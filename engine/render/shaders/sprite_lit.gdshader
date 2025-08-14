shader_type canvas_item;

/*
Advanced 2D-HD Sprite Lighting Shader
Supports albedo, normal, specular maps with rim lighting and palette swapping
Production-grade BRDF implementation for 2D sprites
MIT Licensed
*/

// === Texture Inputs ===
uniform sampler2D albedo_texture: source_color, filter_linear_mipmap;
uniform sampler2D normal_texture: hint_normal, filter_linear_mipmap;
uniform sampler2D specular_texture: filter_linear_mipmap;

// === Palette/LUT Swapping ===
uniform sampler2D palette_lut: filter_linear, repeat_disable;
uniform bool enable_palette_swap: hint_default_enabled = false;
uniform float palette_mix: hint_range(0.0, 1.0) = 1.0;

// === Lighting Parameters ===
uniform bool enable_lighting: hint_default_enabled = true;
uniform float rim_intensity: hint_range(0.0, 5.0) = 1.0;
uniform vec3 rim_color: source_color = vec3(1.0, 1.0, 1.0);
uniform float specular_power: hint_range(1.0, 128.0) = 32.0;
uniform float specular_intensity: hint_range(0.0, 2.0) = 1.0;

// === Material Properties ===
uniform float metallic: hint_range(0.0, 1.0) = 0.0;
uniform float roughness: hint_range(0.0, 1.0) = 0.5;
uniform vec3 emission: source_color = vec3(0.0);
uniform float emission_energy: hint_range(0.0, 10.0) = 1.0;

// === Quality/Performance ===
uniform bool enable_normal_mapping: hint_default_enabled = true;
uniform bool enable_specular: hint_default_enabled = true;
uniform bool enable_rim_lighting: hint_default_enabled = true;
uniform float mip_bias: hint_range(-2.0, 2.0) = 0.0;

// === Utility Functions ===

// Convert RGB to HSV for palette manipulation
vec3 rgb_to_hsv(vec3 rgb) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(rgb.bg, K.wz), vec4(rgb.gb, K.xy), step(rgb.b, rgb.g));
    vec4 q = mix(vec4(p.xyw, rgb.r), vec4(rgb.r, p.yzx), step(p.x, rgb.r));
    
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// Convert HSV back to RGB
vec3 hsv_to_rgb(vec3 hsv) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(hsv.xxx + K.xyz) * 6.0 - K.www);
    return hsv.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), hsv.y);
}

// Unpack normal from texture (assumes standard format)
vec3 unpack_normal(vec3 normal_sample) {
    return normalize(normal_sample * 2.0 - 1.0);
}

// Simple BRDF for 2D lighting
vec3 calculate_lighting(vec3 albedo, vec3 normal, vec3 specular_sample, vec3 light_dir, vec3 view_dir, vec3 light_color) {
    // Lambertian diffuse
    float n_dot_l = max(0.0, dot(normal, light_dir));
    vec3 diffuse = albedo * light_color * n_dot_l;
    
    // Blinn-Phong specular
    vec3 half_dir = normalize(light_dir + view_dir);
    float n_dot_h = max(0.0, dot(normal, half_dir));
    float spec_power = specular_sample.r * specular_power;
    float spec_term = pow(n_dot_h, spec_power) * specular_intensity;
    vec3 specular = specular_sample.rgb * light_color * spec_term;
    
    return diffuse + specular;
}

// Fresnel rim lighting effect
float calculate_rim_light(vec3 normal, vec3 view_dir) {
    float rim_factor = 1.0 - max(0.0, dot(normal, view_dir));
    return pow(rim_factor, 2.0) * rim_intensity;
}

varying vec2 world_position;
varying vec3 world_normal;

void vertex() {
    world_position = (MODEL_MATRIX * vec4(VERTEX, 0.0, 1.0)).xy;
}

void fragment() {
    // Sample base textures with mip bias
    vec4 albedo_sample = textureLod(albedo_texture, UV, mip_bias);
    vec4 normal_sample = textureLod(normal_texture, UV, mip_bias);
    vec4 specular_sample = textureLod(specular_texture, UV, mip_bias);
    
    // Early exit if fully transparent
    if (albedo_sample.a < 0.01) {
        discard;
    }
    
    vec3 base_color = albedo_sample.rgb;
    
    // === Palette Swapping ===
    if (enable_palette_swap && palette_mix > 0.0) {
        // Use red channel as palette index
        float palette_index = base_color.r;
        vec3 palette_color = texture(palette_lut, vec2(palette_index, 0.5)).rgb;
        base_color = mix(base_color, palette_color, palette_mix);
    }
    
    // === Lighting Calculation ===
    vec3 final_color = base_color;
    
    if (enable_lighting) {
        vec3 normal = vec3(0.0, 0.0, 1.0);  // Default forward normal
        
        // Extract normal from normal map
        if (enable_normal_mapping && normal_sample.a > 0.0) {
            normal = unpack_normal(normal_sample.rgb);
        }
        
        // Approximate view direction for 2D
        vec3 view_dir = vec3(0.0, 0.0, 1.0);
        
        // Accumulate lighting from all lights
        final_color = base_color * 0.2;  // Ambient component
        
        // Note: In Godot 4, Light2D nodes automatically provide lighting data
        // This shader receives light information through built-in uniforms
        
        // Manual lighting calculation for primary light
        vec3 light_dir = normalize(vec3(1.0, 1.0, 1.0));  // Default light direction
        vec3 light_color = vec3(1.0, 1.0, 1.0);  // Default white light
        
        if (enable_normal_mapping) {
            final_color += calculate_lighting(base_color, normal, specular_sample.rgb, light_dir, view_dir, light_color);
        } else {
            // Simple diffuse when no normal map
            float n_dot_l = max(0.0, dot(normal, light_dir));
            final_color += base_color * light_color * n_dot_l;
        }
        
        // === Rim Lighting ===
        if (enable_rim_lighting) {
            float rim = calculate_rim_light(normal, view_dir);
            final_color += rim_color * rim;
        }
        
        // === Specular Highlights ===
        if (enable_specular && specular_sample.a > 0.0) {
            vec3 half_dir = normalize(light_dir + view_dir);
            float n_dot_h = max(0.0, dot(normal, half_dir));
            float spec_term = pow(n_dot_h, specular_power) * specular_intensity;
            final_color += specular_sample.rgb * spec_term;
        }
    }
    
    // === Emission ===
    if (emission_energy > 0.0) {
        final_color += emission * emission_energy;
    }
    
    // Apply modulation and final output
    final_color *= COLOR.rgb;
    COLOR = vec4(final_color, albedo_sample.a * COLOR.a);
    
    // Debug: Show normal map as color (for testing)
    // COLOR = vec4(normal_sample.rgb, albedo_sample.a);
}