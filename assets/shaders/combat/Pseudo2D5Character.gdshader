// Pseudo 2.5D Character Shader - BlazBlue/Skullgirls style
// Enhanced depth rendering for 2D sprites with 3D-like lighting
// MIT Licensed - Free for commercial use
shader_type canvas_item;

// Lighting parameters
uniform vec4 ambient_color : source_color = vec4(0.2, 0.2, 0.3, 1.0);
uniform vec4 main_light_color : source_color = vec4(1.0, 0.95, 0.9, 1.0);
uniform vec4 rim_light_color : source_color = vec4(0.8, 0.9, 1.0, 1.0);
uniform float lighting_intensity : hint_range(0.0, 2.0) = 1.0;

// Rim lighting for pseudo 3D depth
uniform float rim_power : hint_range(0.1, 8.0) = 3.0;
uniform float rim_intensity : hint_range(0.0, 2.0) = 1.5;
uniform float rim_width : hint_range(0.0, 1.0) = 0.7;

// Normal mapping simulation
uniform float normal_strength : hint_range(0.0, 2.0) = 1.0;
uniform vec2 light_direction = vec2(0.3, -0.5);

// Animation and effects
uniform float energy_pulse_speed : hint_range(0.0, 5.0) = 2.0;
uniform bool enable_energy_pulse = false;
uniform vec4 energy_color : source_color = vec4(0.5, 0.8, 1.0, 1.0);

// Depth and shadow simulation
uniform float depth_offset : hint_range(-0.1, 0.1) = 0.02;
uniform vec4 shadow_color : source_color = vec4(0.1, 0.1, 0.2, 0.5);
uniform bool enable_pseudo_shadow = true;

varying vec2 world_position;

void vertex() {
    world_position = VERTEX;
}

// Generate pseudo-normal from sprite texture
vec3 calculate_pseudo_normal(vec2 uv, sampler2D tex) {
    vec2 tex_size = 1.0 / TEXTURE_PIXEL_SIZE;
    float offset = 1.0 / tex_size.x;
    
    // Sample neighboring pixels for height map
    float height_left = texture(tex, uv - vec2(offset, 0.0)).r;
    float height_right = texture(tex, uv + vec2(offset, 0.0)).r;
    float height_up = texture(tex, uv - vec2(0.0, offset)).r;
    float height_down = texture(tex, uv + vec2(0.0, offset)).r;
    
    // Calculate gradients
    float dx = (height_right - height_left) * normal_strength;
    float dy = (height_down - height_up) * normal_strength;
    
    // Return pseudo normal
    return normalize(vec3(dx, dy, 1.0));
}

// BlazBlue-style rim lighting calculation
float calculate_rim_lighting(vec2 uv, vec3 normal) {
    vec2 center = vec2(0.5, 0.5);
    vec2 to_edge = normalize(uv - center);
    
    // Enhanced rim calculation for character silhouette
    float edge_distance = distance(uv, center);
    float rim_mask = smoothstep(rim_width - 0.1, rim_width, edge_distance);
    
    // Consider sprite bounds for better rim effect
    float alpha_edge = 0.0;
    vec2 tex_size = 1.0 / TEXTURE_PIXEL_SIZE;
    float check_radius = 2.0 / tex_size.x;
    
    for (float i = 0.0; i < 8.0; i++) {
        float angle = i * 0.785398; // 45 degrees
        vec2 offset = vec2(cos(angle), sin(angle)) * check_radius;
        float alpha = texture(TEXTURE, uv + offset).a;
        if (alpha < 0.1) {
            alpha_edge = 1.0;
            break;
        }
    }
    
    float final_rim = rim_mask * alpha_edge;
    return pow(final_rim, rim_power) * rim_intensity;
}

void fragment() {
    vec2 uv = UV;
    vec4 tex_color = texture(TEXTURE, uv);
    
    // Skip processing for transparent pixels
    if (tex_color.a < 0.01) {
        COLOR = tex_color;
        return;
    }
    
    vec3 base_color = tex_color.rgb;
    vec3 final_color = base_color;
    
    // Calculate pseudo normal for lighting
    vec3 pseudo_normal = calculate_pseudo_normal(uv, TEXTURE);
    
    // Main directional lighting
    float light_factor = dot(pseudo_normal, normalize(vec3(light_direction, 1.0)));
    light_factor = light_factor * 0.5 + 0.5; // Remap to 0-1
    
    // Apply main lighting
    vec3 lit_color = mix(ambient_color.rgb, main_light_color.rgb, light_factor);
    final_color *= lit_color * lighting_intensity;
    
    // Add rim lighting for pseudo 3D effect
    float rim = calculate_rim_lighting(uv, pseudo_normal);
    final_color += rim_light_color.rgb * rim;
    
    // Energy pulse animation
    if (enable_energy_pulse) {
        float pulse = sin(TIME * energy_pulse_speed) * 0.5 + 0.5;
        pulse = smoothstep(0.3, 1.0, pulse);
        
        // Apply energy glow to rim areas
        final_color += energy_color.rgb * rim * pulse * 0.5;
    }
    
    // Pseudo shadow effect (darker areas)
    if (enable_pseudo_shadow) {
        float shadow_factor = 1.0 - light_factor;
        shadow_factor = smoothstep(0.3, 0.7, shadow_factor);
        final_color = mix(final_color, shadow_color.rgb, shadow_factor * shadow_color.a * 0.3);
    }
    
    // Enhanced contrast for fighting game aesthetics
    final_color = pow(final_color, vec3(0.95)); // Slight gamma correction
    final_color = mix(vec3(0.5), final_color, 1.1); // Increase contrast
    
    // Ensure colors stay in valid range
    final_color = clamp(final_color, 0.0, 1.0);
    
    COLOR = vec4(final_color, tex_color.a);
}