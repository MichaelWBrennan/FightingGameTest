shader_type canvas_item;

/*
HD-2D Sprite Rim Lighting Shader
Combines Street Fighter 3: Third Strike fluid animation style 
with Octopath Traveler's HD-2D rim lighting effects.

Features:
- Rim lighting for 2D sprites
- SF3:3S style color tinting
- Normal map support for depth
- Emissive highlights for special moves
- Atmospheric perspective integration
*/

// Rim lighting parameters
uniform float rim_power : hint_range(0.1, 8.0) = 2.0;
uniform float rim_intensity : hint_range(0.0, 2.0) = 0.8;
uniform vec4 rim_color : source_color = vec4(0.9, 0.7, 0.5, 1.0);

// SF3:3S style tinting
uniform vec4 sf3s_tint : source_color = vec4(0.9, 0.85, 0.8, 1.0);
uniform float tint_strength : hint_range(0.0, 1.0) = 0.3;

// Normal mapping for depth
uniform sampler2D normal_map : hint_normal;
uniform float normal_strength : hint_range(0.0, 2.0) = 1.0;

// Emissive effects for special moves
uniform bool enable_emissive = false;
uniform vec4 emissive_color : source_color = vec4(1.0, 0.8, 0.4, 1.0);
uniform float emissive_intensity : hint_range(0.0, 3.0) = 1.0;
uniform float emissive_pulse_speed : hint_range(0.0, 10.0) = 2.0;

// Atmospheric perspective
uniform float depth_fade : hint_range(0.0, 1.0) = 0.1;
uniform vec4 atmosphere_color : source_color = vec4(0.7, 0.8, 0.9, 1.0);

// Animation enhancement
uniform float animation_intensity : hint_range(0.8, 1.5) = 1.2;
uniform float fluid_motion_boost : hint_range(0.0, 0.5) = 0.2;

varying vec3 world_normal;
varying vec3 world_position;
varying vec2 world_uv;

void vertex() {
    world_uv = UV;
    world_position = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

vec3 get_rim_lighting(vec3 normal, vec3 view_dir, vec3 light_dir) {
    // Calculate rim lighting using fresnel-like effect
    float rim_factor = 1.0 - max(0.0, dot(normal, view_dir));
    rim_factor = pow(rim_factor, rim_power);
    
    // Enhance rim effect based on light direction
    float light_factor = max(0.0, dot(normal, light_dir));
    rim_factor *= (0.5 + 0.5 * light_factor);
    
    return rim_color.rgb * rim_factor * rim_intensity;
}

vec3 apply_sf3s_style(vec3 base_color) {
    // Apply SF3:3S characteristic muted, warm color palette
    vec3 tinted_color = mix(base_color, sf3s_tint.rgb, tint_strength);
    
    // Enhance contrast slightly for animation clarity
    tinted_color = pow(tinted_color, vec3(1.0 / 1.1));
    
    // Animation enhancement for fluid motion
    tinted_color *= (1.0 + fluid_motion_boost * sin(TIME * 8.0) * 0.1);
    
    return tinted_color * animation_intensity;
}

vec3 calculate_emissive() {
    if (!enable_emissive) return vec3(0.0);
    
    // Pulsing emissive effect for special moves
    float pulse = 0.5 + 0.5 * sin(TIME * emissive_pulse_speed);
    return emissive_color.rgb * emissive_intensity * pulse;
}

void fragment() {
    // Sample base texture
    vec4 base_texture = texture(TEXTURE, UV);
    
    // Sample normal map if available
    vec3 normal = vec3(0.0, 0.0, 1.0);
    if (normal_strength > 0.0) {
        vec3 normal_sample = texture(normal_map, UV).rgb;
        normal_sample = normal_sample * 2.0 - 1.0;
        normal = normalize(mix(vec3(0.0, 0.0, 1.0), normal_sample, normal_strength));
    }
    
    // Calculate view and light directions (simplified for 2D)
    vec3 view_dir = normalize(vec3(0.0, 0.0, 1.0));
    vec3 light_dir = normalize(vec3(-0.5, 0.8, 0.5)); // Main key light direction
    
    // Apply SF3:3S style color treatment
    vec3 styled_color = apply_sf3s_style(base_texture.rgb);
    
    // Calculate rim lighting
    vec3 rim_light = get_rim_lighting(normal, view_dir, light_dir);
    
    // Calculate emissive effects
    vec3 emissive = calculate_emissive();
    
    // Apply atmospheric perspective for depth
    float depth_factor = 1.0 - depth_fade;
    styled_color = mix(atmosphere_color.rgb, styled_color, depth_factor);
    
    // Combine all effects
    vec3 final_color = styled_color + rim_light + emissive;
    
    // Preserve alpha for sprite transparency
    COLOR = vec4(final_color, base_texture.a);
}