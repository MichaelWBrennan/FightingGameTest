// Advanced character highlight shader for cutting-edge visuals
// Enhanced for Pseudo 2.5D rendering pipeline
// MIT Licensed - Free for commercial use
shader_type canvas_item;

uniform float outline_width : hint_range(0.0, 10.0) = 2.0;
uniform vec4 outline_color : source_color = vec4(1.0, 0.5, 0.0, 1.0);
uniform float rim_power : hint_range(0.1, 5.0) = 2.0;
uniform float rim_intensity : hint_range(0.0, 2.0) = 1.0;
uniform vec4 rim_color : source_color = vec4(0.8, 0.9, 1.0, 1.0);
uniform float energy_flow_speed : hint_range(0.1, 5.0) = 2.0;
uniform float energy_frequency : hint_range(1.0, 20.0) = 5.0;
uniform bool enable_energy_flow = true;

// Pseudo 2.5D lighting integration
uniform vec4 ambient_color : source_color = vec4(0.2, 0.2, 0.3, 1.0);
uniform vec4 main_light_color : source_color = vec4(1.0, 0.95, 0.9, 1.0);
uniform float lighting_intensity : hint_range(0.0, 2.0) = 1.0;
uniform vec2 light_direction = vec2(0.3, -0.5);

// Depth and shadow effects
uniform bool enable_pseudo_depth = true;
uniform float depth_offset : hint_range(-0.05, 0.05) = 0.01;
uniform vec4 shadow_color : source_color = vec4(0.1, 0.1, 0.2, 0.3);

varying vec2 world_position;

void vertex() {
    world_position = VERTEX;
}

// Calculate pseudo normal for depth effect
vec3 calculate_pseudo_normal(vec2 uv) {
    vec2 tex_size = 1.0 / TEXTURE_PIXEL_SIZE;
    float offset = 1.0 / tex_size.x;
    
    float height_left = texture(TEXTURE, uv - vec2(offset, 0.0)).r;
    float height_right = texture(TEXTURE, uv + vec2(offset, 0.0)).r;
    float height_up = texture(TEXTURE, uv - vec2(0.0, offset)).r;
    float height_down = texture(TEXTURE, uv + vec2(0.0, offset)).r;
    
    float dx = (height_right - height_left);
    float dy = (height_down - height_up);
    
    return normalize(vec3(dx, dy, 1.0));
}

void fragment() {
    vec2 uv = UV;
    vec4 tex_color = texture(TEXTURE, uv);
    
    // Skip transparent pixels
    if (tex_color.a < 0.1) {
        COLOR = tex_color;
        return;
    }
    
    vec3 final_color = tex_color.rgb;
    
    // Apply pseudo 2.5D lighting
    if (enable_pseudo_depth) {
        vec3 pseudo_normal = calculate_pseudo_normal(uv);
        float light_factor = dot(pseudo_normal, normalize(vec3(light_direction, 1.0)));
        light_factor = light_factor * 0.5 + 0.5;
        
        vec3 lit_color = mix(ambient_color.rgb, main_light_color.rgb, light_factor);
        final_color *= lit_color * lighting_intensity;
        
        // Add subtle shadow
        float shadow_factor = 1.0 - light_factor;
        shadow_factor = smoothstep(0.3, 0.7, shadow_factor);
        final_color = mix(final_color, shadow_color.rgb, shadow_factor * shadow_color.a * 0.2);
    }
    
    // Create outline by sampling neighboring pixels
    float outline = 0.0;
    vec2 tex_size = 1.0 / TEXTURE_PIXEL_SIZE;
    float outline_width_uv = outline_width / tex_size.x;
    
    for (float i = 0.0; i < 8.0; i++) {
        float angle = i * 0.785398; // 45 degrees in radians
        vec2 offset = vec2(cos(angle), sin(angle)) * outline_width_uv;
        float alpha = texture(TEXTURE, uv + offset).a;
        if (alpha < 0.1 && tex_color.a > 0.1) {
            outline = 1.0;
            break;
        }
    }
    
    // Apply outline with depth consideration
    if (outline > 0.0) {
        final_color = mix(final_color, outline_color.rgb, outline_color.a);
    }
    
    // Create enhanced rim lighting effect
    vec2 center = vec2(0.5, 0.5);
    vec2 rim_dir = normalize(uv - center);
    float rim_factor = dot(rim_dir, rim_dir);
    rim_factor = pow(rim_factor, rim_power);
    
    // Add energy flow animation
    float energy = 1.0;
    if (enable_energy_flow) {
        float time_offset = TIME * energy_flow_speed;
        energy = sin(uv.y * energy_frequency + time_offset) * 0.5 + 0.5;
        energy = smoothstep(0.3, 0.7, energy);
    }
    
    // Apply rim lighting with energy animation
    vec3 rim_light = rim_color.rgb * rim_intensity * rim_factor * energy;
    final_color += rim_light;
    
    // Enhanced contrast for fighting game aesthetics
    final_color = pow(final_color, vec3(0.9));
    final_color = clamp(final_color, 0.0, 1.0);
    
    COLOR = vec4(final_color, tex_color.a);
}
