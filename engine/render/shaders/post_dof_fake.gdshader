shader_type canvas_item;

/*
Fake Depth of Field Post-Processing Shader
Multi-layer blur simulation for pseudo-DOF without Z-buffer
Optimized for 2D fighting game environments
MIT Licensed
*/

// === DOF Parameters ===
uniform float focus_distance: hint_range(0.0, 1000.0) = 300.0;  // Focus distance in world units
uniform float focus_range: hint_range(10.0, 500.0) = 100.0;  // Range around focus that's sharp
uniform float blur_strength: hint_range(0.0, 10.0) = 2.0;  // Maximum blur intensity
uniform float bokeh_scale: hint_range(0.1, 5.0) = 1.0;  // Bokeh circle size

// === Quality Settings ===
uniform int blur_samples: hint_range(4, 16) = 8;  // Number of blur samples
uniform bool enable_bokeh: hint_default_enabled = false;  // Circular bokeh simulation
uniform float bokeh_threshold: hint_range(0.0, 2.0) = 1.0;  // Brightness for bokeh

// === Focus Control ===
uniform bool auto_focus_players: hint_default_enabled = true;  // Focus on player characters
uniform vec2 manual_focus_point: hint_default(0.5, 0.5) = vec2(0.5, 0.5);  // Manual focus (UV coords)
uniform float focus_transition_speed: hint_range(0.1, 10.0) = 2.0;

// === Advanced ===
uniform bool enable_depth_simulation: hint_default_enabled = true;
uniform sampler2D depth_hint_texture: hint_default_white, filter_linear;  // Optional depth hints
uniform float depth_scale: hint_range(0.0, 2.0) = 1.0;

varying vec2 world_position;

void vertex() {
    world_position = (MODEL_MATRIX * vec4(VERTEX, 0.0, 1.0)).xy;
}

// Calculate pseudo-depth based on Y position and hints
float calculate_depth(vec2 uv) {
    // Base depth from Y position (fighting games typically have depth = Y)
    float y_depth = uv.y;
    
    // Optional depth hint texture (for complex scenes)
    if (enable_depth_simulation) {
        float depth_hint = texture(depth_hint_texture, uv).r;
        y_depth = mix(y_depth, depth_hint, depth_scale);
    }
    
    return y_depth * 1000.0;  // Convert to world units
}

// Calculate blur radius based on distance from focus
float calculate_blur_radius(float depth) {
    float distance_from_focus = abs(depth - focus_distance);
    float blur_factor = max(0.0, (distance_from_focus - focus_range) / focus_range);
    return blur_factor * blur_strength;
}

// Circular sample pattern for bokeh effect
vec2 get_bokeh_sample_offset(int index, int total_samples, float radius) {
    float angle = float(index) / float(total_samples) * 6.28318530718;  // 2 * PI
    return vec2(cos(angle), sin(angle)) * radius;
}

// Multi-sample blur with optional bokeh
vec4 sample_blur(sampler2D tex, vec2 uv, float radius) {
    if (radius < 0.01) {
        return texture(tex, uv);
    }
    
    vec4 result = vec4(0.0);
    float weight_sum = 0.0;
    
    vec2 pixel_size = 1.0 / vec2(textureSize(tex, 0));
    
    for (int i = 0; i < blur_samples; i++) {
        vec2 offset;
        float weight = 1.0;
        
        if (enable_bokeh) {
            // Circular bokeh pattern
            offset = get_bokeh_sample_offset(i, blur_samples, radius) * pixel_size;
        } else {
            // Simple radial pattern
            float angle = float(i) / float(blur_samples) * 6.28318530718;
            offset = vec2(cos(angle), sin(angle)) * radius * pixel_size;
        }
        
        vec4 sample_color = texture(tex, uv + offset);
        
        // Bokeh highlight enhancement
        if (enable_bokeh) {
            float brightness = dot(sample_color.rgb, vec3(0.299, 0.587, 0.114));
            if (brightness > bokeh_threshold) {
                weight *= (1.0 + bokeh_scale);
            }
        }
        
        result += sample_color * weight;
        weight_sum += weight;
    }
    
    return result / weight_sum;
}

void fragment() {
    vec2 uv = SCREEN_UV;
    
    // Calculate depth for this pixel
    float pixel_depth = calculate_depth(uv);
    
    // Calculate required blur radius
    float blur_radius = calculate_blur_radius(pixel_depth);
    
    // Sample with appropriate blur
    vec4 blurred_color = sample_blur(TEXTURE, uv, blur_radius);
    
    // Original sharp sample
    vec4 sharp_color = texture(TEXTURE, uv);
    
    // Blend based on blur amount
    float blur_factor = clamp(blur_radius / blur_strength, 0.0, 1.0);
    vec4 final_color = mix(sharp_color, blurred_color, blur_factor);
    
    COLOR = final_color;
    
    // Debug: Show depth as grayscale
    // COLOR = vec4(vec3(pixel_depth / 500.0), 1.0);
    
    // Debug: Show blur radius as red
    // COLOR = vec4(blur_radius / blur_strength, 0.0, 0.0, 1.0);
}