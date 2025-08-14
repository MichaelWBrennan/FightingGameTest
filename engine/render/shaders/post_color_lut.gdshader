shader_type canvas_item;

/*
3D LUT Color Grading Post-Processing Shader
Professional color grading with 3D lookup table support
Support for film emulation and artistic color correction
MIT Licensed
*/

// === Color Grading Textures ===
uniform sampler2D color_lut_3d: source_color, filter_linear, repeat_disable;  // 3D LUT as 2D texture
uniform bool enable_lut: hint_default_enabled = true;

// === LUT Parameters ===
uniform int lut_size: hint_range(16, 64) = 32;  // Size of the 3D LUT (32x32x32 common)
uniform float lut_intensity: hint_range(0.0, 1.0) = 1.0;  // Blend with original

// === Manual Color Correction ===
uniform bool enable_manual_correction: hint_default_enabled = false;

// Basic color adjustments
uniform float exposure: hint_range(0.1, 5.0) = 1.0;
uniform float contrast: hint_range(0.0, 3.0) = 1.0;
uniform float saturation: hint_range(0.0, 3.0) = 1.0;
uniform float brightness: hint_range(-1.0, 1.0) = 0.0;
uniform float gamma: hint_range(0.1, 3.0) = 1.0;

// Color balance (shadows, midtones, highlights)
uniform vec3 shadows_color: source_color = vec3(1.0, 1.0, 1.0);
uniform vec3 midtones_color: source_color = vec3(1.0, 1.0, 1.0);
uniform vec3 highlights_color: source_color = vec3(1.0, 1.0, 1.0);

// Lift, gamma, gain controls (professional grading)
uniform vec3 lift: source_color = vec3(0.0, 0.0, 0.0);  // Shadows
uniform vec3 gamma_rgb: source_color = vec3(1.0, 1.0, 1.0);  // Midtones
uniform vec3 gain: source_color = vec3(1.0, 1.0, 1.0);  // Highlights

// === Film Emulation ===
uniform bool enable_film_emulation: hint_default_enabled = false;
uniform float film_grain: hint_range(0.0, 0.5) = 0.05;
uniform vec3 film_tint: source_color = vec3(1.0, 0.95, 0.9);  // Warm film look

// === Performance ===
uniform bool enable_dithering: hint_default_enabled = true;
uniform float mip_bias: hint_range(-2.0, 2.0) = 0.0;

// === Utility Functions ===

// RGB to HSV conversion
vec3 rgb_to_hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// HSV to RGB conversion
vec3 hsv_to_rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// 3D LUT lookup (converts 3D LUT stored as 2D texture)
vec3 sample_lut_3d(sampler2D lut_texture, vec3 color, int size) {
    float lut_size_f = float(size);
    
    // Scale color to LUT coordinates
    vec3 scaled = color * (lut_size_f - 1.0);
    
    // Calculate slice and blend factor
    float slice = floor(scaled.b);
    float blend_factor = scaled.b - slice;
    
    // Calculate UV coordinates for both slices
    vec2 uv1, uv2;
    uv1.x = (scaled.r + slice * lut_size_f) / (lut_size_f * lut_size_f);
    uv1.y = scaled.g / lut_size_f;
    
    uv2.x = (scaled.r + (slice + 1.0) * lut_size_f) / (lut_size_f * lut_size_f);
    uv2.y = scaled.g / lut_size_f;
    
    // Sample both slices and blend
    vec3 slice1 = texture(lut_texture, uv1).rgb;
    vec3 slice2 = texture(lut_texture, uv2).rgb;
    
    return mix(slice1, slice2, blend_factor);
}

// Apply lift, gamma, gain color correction
vec3 apply_lift_gamma_gain(vec3 color) {
    // Lift (shadows)
    color = color + lift;
    
    // Gamma (midtones)
    color = pow(max(color, vec3(0.0)), 1.0 / gamma_rgb);
    
    // Gain (highlights)
    color = color * gain;
    
    return color;
}

// Simple dithering to reduce banding
float dither_8x8(vec2 position) {
    int x = int(mod(position.x, 8.0));
    int y = int(mod(position.y, 8.0));
    
    int dither_matrix[64] = int[](
        0,  32, 8,  40, 2,  34, 10, 42,
        48, 16, 56, 24, 50, 18, 58, 26,
        12, 44, 4,  36, 14, 46, 6,  38,
        60, 28, 52, 20, 62, 30, 54, 22,
        3,  35, 11, 43, 1,  33, 9,  41,
        51, 19, 59, 27, 49, 17, 57, 25,
        15, 47, 7,  39, 13, 45, 5,  37,
        63, 31, 55, 23, 61, 29, 53, 21
    );
    
    return float(dither_matrix[y * 8 + x]) / 64.0;
}

void fragment() {
    vec2 uv = SCREEN_UV;
    vec4 original_color = textureLod(TEXTURE, uv, mip_bias);
    vec3 color = original_color.rgb;
    
    // === Manual Color Correction ===
    if (enable_manual_correction) {
        // Exposure
        color *= exposure;
        
        // Brightness
        color += brightness;
        
        // Contrast
        color = (color - 0.5) * contrast + 0.5;
        
        // Saturation
        vec3 hsv = rgb_to_hsv(color);
        hsv.y *= saturation;
        color = hsv_to_rgb(hsv);
        
        // Gamma
        color = pow(max(color, vec3(0.0)), vec3(1.0 / gamma));
        
        // Lift, Gamma, Gain (professional controls)
        color = apply_lift_gamma_gain(color);
        
        // Color balance by luminance zones
        float luminance = dot(color, vec3(0.299, 0.587, 0.114));
        if (luminance < 0.33) {
            // Shadows
            color *= shadows_color;
        } else if (luminance < 0.66) {
            // Midtones
            color *= midtones_color;
        } else {
            // Highlights
            color *= highlights_color;
        }
    }
    
    // === 3D LUT Color Grading ===
    if (enable_lut) {
        vec3 lut_color = sample_lut_3d(color_lut_3d, clamp(color, 0.0, 1.0), lut_size);
        color = mix(color, lut_color, lut_intensity);
    }
    
    // === Film Emulation ===
    if (enable_film_emulation) {
        // Film tint
        color *= film_tint;
        
        // Film grain
        if (film_grain > 0.0) {
            vec2 grain_uv = uv * vec2(textureSize(TEXTURE, 0)) + TIME;
            float grain = fract(sin(dot(grain_uv, vec2(12.9898, 78.233))) * 43758.5453);
            grain = (grain - 0.5) * film_grain;
            color += vec3(grain);
        }
    }
    
    // === Dithering ===
    if (enable_dithering) {
        vec2 screen_pos = uv * vec2(textureSize(TEXTURE, 0));
        float dither = (dither_8x8(screen_pos) - 0.5) / 255.0;
        color += vec3(dither);
    }
    
    // Clamp to valid range
    color = clamp(color, 0.0, 1.0);
    
    COLOR = vec4(color, original_color.a);
}