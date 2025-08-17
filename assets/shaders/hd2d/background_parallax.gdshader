shader_type canvas_item;

/*
HD-2D Background Parallax Shader
Creates multi-layer parallax backgrounds with atmospheric depth
for Street Fighter 3: Third Strike meets Octopath Traveler style.

Features:
- Multi-layer parallax scrolling
- Atmospheric perspective with distance fog
- SF3:3S muted color palette
- Dynamic lighting interaction
- Depth-based blur simulation
*/

// Parallax settings
uniform float parallax_speed : hint_range(0.0, 2.0) = 1.0;
uniform float depth_layer : hint_range(-1.0, 1.0) = 0.0; // -1 = far, 1 = near
uniform vec2 scroll_direction = vec2(1.0, 0.0);

// SF3:3S atmospheric style
uniform vec4 atmosphere_color : source_color = vec4(0.7, 0.8, 0.9, 0.3);
uniform float atmosphere_strength : hint_range(0.0, 1.0) = 0.4;
uniform vec4 sf3s_palette : source_color = vec4(0.85, 0.8, 0.75, 1.0);

// Depth effects
uniform float depth_blur : hint_range(0.0, 5.0) = 1.0;
uniform float depth_desaturation : hint_range(0.0, 1.0) = 0.3;
uniform float depth_brightness : hint_range(0.5, 2.0) = 0.8;

// Dynamic lighting
uniform vec3 light_position = vec3(0.0, 0.5, 1.0);
uniform vec4 light_color : source_color = vec4(1.0, 0.95, 0.85, 1.0);
uniform float light_intensity : hint_range(0.0, 2.0) = 1.0;

// Animation
uniform float time_scale : hint_range(0.0, 2.0) = 1.0;
uniform bool enable_subtle_animation = true;

varying vec2 world_position;

void vertex() {
    world_position = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xy;
}

vec3 apply_depth_effects(vec3 color, float depth) {
    // Atmospheric perspective - distant objects become more blue/gray
    float distance_factor = abs(depth);
    color = mix(color, atmosphere_color.rgb, atmosphere_strength * distance_factor);
    
    // Desaturate distant objects
    vec3 gray = vec3(dot(color, vec3(0.299, 0.587, 0.114)));
    color = mix(color, gray, depth_desaturation * distance_factor);
    
    // Darken distant objects
    color *= mix(1.0, depth_brightness, distance_factor);
    
    return color;
}

vec3 apply_sf3s_style(vec3 color) {
    // Apply SF3:3S characteristic muted, warm tones
    color = mix(color, sf3s_palette.rgb, 0.15);
    
    // Slight contrast enhancement for readability
    color = pow(color, vec3(1.0 / 1.05));
    
    return color;
}

vec2 calculate_parallax_offset(vec2 base_uv, float depth) {
    // Calculate parallax offset based on depth and camera movement
    float parallax_factor = depth * parallax_speed;
    
    // Simulate camera movement (can be controlled by script)
    vec2 camera_offset = vec2(TIME * 0.1, sin(TIME * 0.3) * 0.05) * time_scale;
    
    // Apply parallax scrolling
    vec2 parallax_offset = camera_offset * parallax_factor * scroll_direction;
    
    return base_uv + parallax_offset;
}

vec4 sample_with_blur(sampler2D tex, vec2 uv, float blur_amount) {
    if (blur_amount < 0.01) {
        return texture(tex, uv);
    }
    
    // Simple box blur for depth effect
    vec4 color = vec4(0.0);
    float blur_step = blur_amount * 0.01;
    int samples = 0;
    
    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            vec2 offset = vec2(float(x), float(y)) * blur_step;
            color += texture(tex, uv + offset);
            samples++;
        }
    }
    
    return color / float(samples);
}

vec3 apply_dynamic_lighting(vec3 color, vec2 world_pos) {
    // Calculate distance from light
    vec2 light_pos_2d = light_position.xy;
    float light_distance = length(world_pos - light_pos_2d);
    
    // Calculate light attenuation
    float attenuation = 1.0 / (1.0 + light_distance * light_distance * 0.1);
    
    // Apply lighting
    vec3 lit_color = color * light_color.rgb * light_intensity * attenuation;
    
    // Blend with original color
    return mix(color, lit_color, 0.3);
}

void fragment() {
    // Calculate parallax UV
    vec2 parallax_uv = calculate_parallax_offset(UV, depth_layer);
    
    // Wrap UV coordinates for tiling
    parallax_uv = fract(parallax_uv);
    
    // Sample texture with depth-based blur
    float blur_amount = abs(depth_layer) * depth_blur;
    vec4 base_color = sample_with_blur(TEXTURE, parallax_uv, blur_amount);
    
    // Apply depth effects
    vec3 depth_affected_color = apply_depth_effects(base_color.rgb, depth_layer);
    
    // Apply SF3:3S style
    vec3 styled_color = apply_sf3s_style(depth_affected_color);
    
    // Apply dynamic lighting
    styled_color = apply_dynamic_lighting(styled_color, world_position);
    
    // Subtle animation for background elements
    if (enable_subtle_animation) {
        float animation_factor = 1.0 + sin(TIME * 2.0 + world_position.x * 0.1) * 0.02;
        styled_color *= animation_factor;
    }
    
    COLOR = vec4(styled_color, base_color.a);
}