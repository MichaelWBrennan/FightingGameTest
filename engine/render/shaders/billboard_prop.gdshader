shader_type canvas_item;

/*
Billboard Prop Shader for Pseudo-3D Environment
Y-depth scaling with soft depth fade for occlusion cues
Optimized for multiple props in fighting game stages
MIT Licensed
*/

// === Texture Inputs ===
uniform sampler2D prop_texture: source_color, filter_linear_mipmap;
uniform sampler2D normal_texture: hint_normal, filter_linear_mipmap;

// === Depth Scaling ===
uniform float base_scale: hint_range(0.1, 5.0) = 1.0;  // Base size multiplier
uniform float depth_scale_factor: hint_range(0.0, 2.0) = 1.0;  // How much Y position affects scale
uniform float reference_y: hint_default(0.0) = 0.0;  // Y position for base_scale (world coordinates)
uniform float scale_curve: hint_range(0.1, 3.0) = 1.0;  // Exponential curve for scaling

// === Soft Fade/Occlusion ===
uniform bool enable_soft_fade: hint_default_enabled = true;
uniform float fade_distance: hint_range(10.0, 1000.0) = 200.0;  // Distance at which props start fading
uniform float fade_curve: hint_range(0.1, 5.0) = 2.0;  // Fade curve steepness

// === Lighting Integration ===
uniform bool enable_lighting: hint_default_enabled = true;
uniform float ambient_light: hint_range(0.0, 1.0) = 0.3;
uniform vec3 light_direction: hint_default(0.0, -1.0, 0.5) = vec3(0.0, -1.0, 0.5);

// === Color/Material ===
uniform vec3 tint_color: source_color = vec3(1.0, 1.0, 1.0);
uniform float opacity: hint_range(0.0, 1.0) = 1.0;
uniform bool enable_depth_tinting: hint_default_enabled = false;
uniform vec3 near_tint: source_color = vec3(1.0, 1.0, 1.0);
uniform vec3 far_tint: source_color = vec3(0.8, 0.8, 1.0);

// === Performance ===
uniform float mip_bias: hint_range(-2.0, 2.0) = 0.0;
uniform bool enable_normal_mapping: hint_default_enabled = false;

varying vec2 world_position;
varying float calculated_scale;
varying float distance_to_camera;

void vertex() {
    // Get world position
    world_position = (MODEL_MATRIX * vec4(VERTEX, 0.0, 1.0)).xy;
    
    // Calculate scale based on Y position (depth)
    float y_offset = world_position.y - reference_y;
    float scale_multiplier = pow(1.0 + (y_offset * depth_scale_factor * 0.001), scale_curve);
    calculated_scale = base_scale * scale_multiplier;
    
    // Apply scaling to vertex
    VERTEX *= calculated_scale;
    
    // Calculate distance for fade effects
    distance_to_camera = length(world_position);
}

void fragment() {
    // Sample prop texture with mip bias
    vec4 prop_sample = textureLod(prop_texture, UV, mip_bias);
    
    // Early exit if transparent
    if (prop_sample.a < 0.01) {
        discard;
    }
    
    vec3 base_color = prop_sample.rgb * tint_color;
    
    // === Depth-based Tinting ===
    if (enable_depth_tinting) {
        float depth_factor = clamp(distance_to_camera / fade_distance, 0.0, 1.0);
        base_color *= mix(near_tint, far_tint, depth_factor);
    }
    
    // === Lighting ===
    vec3 final_color = base_color;
    
    if (enable_lighting) {
        vec3 normal = vec3(0.0, 0.0, 1.0);  // Default billboard normal
        
        // Optional normal mapping for detailed props
        if (enable_normal_mapping) {
            vec4 normal_sample = textureLod(normal_texture, UV, mip_bias);
            if (normal_sample.a > 0.0) {
                normal = normalize(normal_sample.rgb * 2.0 - 1.0);
            }
        }
        
        // Simple Lambert lighting
        vec3 light_dir = normalize(light_direction);
        float n_dot_l = max(ambient_light, dot(normal, light_dir));
        final_color = base_color * n_dot_l;
    }
    
    // === Soft Fade for Occlusion ===
    float alpha = prop_sample.a * opacity;
    
    if (enable_soft_fade) {
        float fade_factor = 1.0 - smoothstep(fade_distance * 0.7, fade_distance, distance_to_camera);
        fade_factor = pow(fade_factor, fade_curve);
        alpha *= fade_factor;
    }
    
    // Apply final modulation
    final_color *= COLOR.rgb;
    COLOR = vec4(final_color, alpha * COLOR.a);
    
    // Debug: Visualize scale
    // COLOR = vec4(vec3(calculated_scale * 0.5), alpha);
    
    // Debug: Visualize distance
    // COLOR = vec4(vec3(distance_to_camera * 0.001), alpha);
}