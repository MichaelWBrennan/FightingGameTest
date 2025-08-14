shader_type canvas_item;

/*
High-Quality Bloom Post-Processing Shader
Multi-pass bloom with threshold, blur, and composition
Optimized for real-time performance
MIT Licensed
*/

// === Bloom Parameters ===
uniform float bloom_threshold: hint_range(0.0, 2.0) = 1.0;  // Brightness threshold for bloom
uniform float bloom_intensity: hint_range(0.0, 5.0) = 1.0;  // Final bloom strength
uniform float bloom_radius: hint_range(0.1, 10.0) = 2.0;  // Blur radius in pixels
uniform int bloom_quality: hint_range(1, 3) = 2;  // 1=Fast, 2=Quality, 3=Ultra

// === Bloom Composition ===
uniform float bloom_mix: hint_range(0.0, 1.0) = 0.3;  // How much bloom to blend
uniform vec3 bloom_tint: source_color = vec3(1.0, 1.0, 1.0);  // Bloom color tint
uniform bool enable_lens_dirt: hint_default_enabled = false;
uniform sampler2D lens_dirt_texture: hint_default_white, filter_linear;

// === Tone Mapping ===
uniform bool enable_tone_mapping: hint_default_enabled = true;
uniform float exposure: hint_range(0.1, 5.0) = 1.0;
uniform float white_point: hint_range(1.0, 10.0) = 2.0;

// === Performance ===
uniform bool enable_optimization: hint_default_enabled = true;
uniform float mip_bias: hint_range(-2.0, 2.0) = 0.0;

// Gaussian blur weights for quality levels
vec4 gaussian_blur_13(sampler2D tex, vec2 uv, vec2 direction, float radius) {
    vec4 result = vec4(0.0);
    float weights[7] = float[](0.383103, 0.241843, 0.060626, 0.005977, 0.000229, 0.000003, 0.000000);
    
    result += texture(tex, uv) * weights[0];
    
    for (int i = 1; i < 7; i++) {
        vec2 offset = direction * radius * float(i);
        result += texture(tex, uv + offset) * weights[i];
        result += texture(tex, uv - offset) * weights[i];
    }
    
    return result;
}

vec4 gaussian_blur_7(sampler2D tex, vec2 uv, vec2 direction, float radius) {
    vec4 result = vec4(0.0);
    float weights[4] = float[](0.4026, 0.2442, 0.0545, 0.0044);
    
    result += texture(tex, uv) * weights[0];
    
    for (int i = 1; i < 4; i++) {
        vec2 offset = direction * radius * float(i);
        result += texture(tex, uv + offset) * weights[i];
        result += texture(tex, uv - offset) * weights[i];
    }
    
    return result;
}

// Fast box blur for performance mode
vec4 box_blur(sampler2D tex, vec2 uv, vec2 direction, float radius) {
    vec4 result = vec4(0.0);
    int samples = 5;
    
    for (int i = -samples; i <= samples; i++) {
        vec2 offset = direction * radius * float(i) / float(samples);
        result += texture(tex, uv + offset);
    }
    
    return result / float(samples * 2 + 1);
}

// Luminance calculation for bloom threshold
float luminance(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}

// ACES tone mapping
vec3 aces_tone_map(vec3 color) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    
    return clamp((color * (a * color + b)) / (color * (c * color + d) + e), 0.0, 1.0);
}

void fragment() {
    vec2 uv = SCREEN_UV;
    vec4 original_color = textureLod(TEXTURE, uv, mip_bias);
    
    // === Bloom Threshold ===
    vec3 bright_areas = max(vec3(0.0), original_color.rgb - bloom_threshold);
    float bright_luminance = luminance(bright_areas);
    
    // Only process bloom if there are bright areas
    vec3 bloom_color = vec3(0.0);
    
    if (bright_luminance > 0.01) {
        // Apply bloom tint
        bright_areas *= bloom_tint;
        
        // Choose blur quality based on settings
        vec4 blurred;
        float pixel_size = 1.0 / float(textureSize(TEXTURE, 0).x);
        
        if (bloom_quality >= 3) {
            // Ultra quality: 13-tap Gaussian
            blurred = gaussian_blur_13(TEXTURE, uv, vec2(pixel_size, 0.0), bloom_radius);
        } else if (bloom_quality >= 2) {
            // Quality: 7-tap Gaussian  
            blurred = gaussian_blur_7(TEXTURE, uv, vec2(pixel_size, 0.0), bloom_radius);
        } else {
            // Fast: Box blur
            blurred = box_blur(TEXTURE, uv, vec2(pixel_size, 0.0), bloom_radius);
        }
        
        bloom_color = blurred.rgb * bloom_intensity;
        
        // Lens dirt effect (additive)
        if (enable_lens_dirt) {
            vec3 dirt_sample = texture(lens_dirt_texture, uv).rgb;
            bloom_color += dirt_sample * bloom_color * 0.5;
        }
    }
    
    // === Bloom Composition ===
    vec3 final_color = original_color.rgb + (bloom_color * bloom_mix);
    
    // === Tone Mapping ===
    if (enable_tone_mapping) {
        final_color *= exposure;
        final_color = aces_tone_map(final_color);
    }
    
    // Clamp to valid range
    final_color = clamp(final_color, 0.0, 1.0);
    
    COLOR = vec4(final_color, original_color.a);
}