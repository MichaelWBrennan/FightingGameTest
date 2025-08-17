shader_type canvas_item;

/*
HD-2D Post-Processing Shader
Final pass shader that combines SF3:3S atmospheric style 
with Octopath Traveler's HD-2D depth and lighting effects.

Features:
- Depth-based color grading
- Atmospheric haze and fog
- Enhanced bloom and glow
- Film grain for texture
- Color temperature adjustment
- Vignette for focus
*/

// Screen texture
uniform sampler2D screen_texture : hint_screen_texture, repeat_disable, filter_linear_mipmap;
uniform sampler2D depth_texture : hint_depth_texture, repeat_disable, filter_nearest;

// SF3:3S Style Settings
uniform float sf3s_saturation : hint_range(0.0, 2.0) = 0.85;
uniform float sf3s_contrast : hint_range(0.5, 2.0) = 1.15;
uniform vec4 sf3s_color_cast : source_color = vec4(0.95, 0.9, 0.85, 1.0);
uniform float color_cast_strength : hint_range(0.0, 1.0) = 0.2;

// HD-2D Depth Effects
uniform float depth_fog_intensity : hint_range(0.0, 1.0) = 0.3;
uniform vec4 fog_color : source_color = vec4(0.7, 0.8, 0.9, 1.0);
uniform float depth_color_shift : hint_range(0.0, 1.0) = 0.15;
uniform float near_plane = 0.1;
uniform float far_plane = 100.0;

// Bloom and Glow
uniform float bloom_intensity : hint_range(0.0, 3.0) = 1.2;
uniform float bloom_threshold : hint_range(0.0, 2.0) = 0.8;
uniform vec4 bloom_tint : source_color = vec4(1.0, 0.95, 0.8, 1.0);

// Film Effects
uniform float film_grain_intensity : hint_range(0.0, 1.0) = 0.08;
uniform float vignette_strength : hint_range(0.0, 1.0) = 0.3;
uniform vec4 vignette_color : source_color = vec4(0.0, 0.0, 0.0, 1.0);

// Color Grading
uniform float temperature : hint_range(-1.0, 1.0) = 0.1;  // Warm/cool balance
uniform float exposure : hint_range(0.1, 3.0) = 1.0;
uniform float gamma : hint_range(0.1, 3.0) = 1.0;

// Animation and Movement
uniform bool enable_subtle_breathing = true;
uniform float breathing_intensity : hint_range(0.0, 0.1) = 0.02;

// Noise function for film grain
float random(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float get_linear_depth(float depth, float near, float far) {
    float z = depth * 2.0 - 1.0; // Convert to NDC
    return (2.0 * near * far) / (far + near - z * (far - near));
}

vec3 apply_color_temperature(vec3 color, float temp) {
    // Simple color temperature adjustment
    vec3 warm = vec3(1.0, 0.95, 0.8);
    vec3 cool = vec3(0.8, 0.95, 1.0);
    
    if (temp > 0.0) {
        return mix(color, color * warm, temp);
    } else {
        return mix(color, color * cool, abs(temp));
    }
}

vec3 apply_sf3s_color_grading(vec3 color) {
    // Desaturate slightly for SF3:3S muted palette
    vec3 gray = vec3(dot(color, vec3(0.299, 0.587, 0.114)));
    color = mix(gray, color, sf3s_saturation);
    
    // Apply contrast
    color = pow(color, vec3(1.0 / sf3s_contrast));
    
    // Apply color cast
    color = mix(color, color * sf3s_color_cast.rgb, color_cast_strength);
    
    return color;
}

vec3 apply_depth_effects(vec3 color, float depth) {
    float linear_depth = get_linear_depth(depth, near_plane, far_plane);
    float depth_factor = clamp(linear_depth / far_plane, 0.0, 1.0);
    
    // Apply fog based on depth
    color = mix(color, fog_color.rgb, depth_fog_intensity * depth_factor);
    
    // Shift colors based on depth (atmospheric perspective)
    vec3 distant_color = color * vec3(0.9, 0.95, 1.1); // Slightly blue-shift
    color = mix(color, distant_color, depth_color_shift * depth_factor);
    
    return color;
}

vec3 calculate_bloom(sampler2D tex, vec2 uv) {
    vec3 color = texture(tex, uv).rgb;
    
    // Extract bright areas
    float brightness = dot(color, vec3(0.299, 0.587, 0.114));
    if (brightness > bloom_threshold) {
        float bloom_factor = brightness - bloom_threshold;
        return color * bloom_factor * bloom_intensity * bloom_tint.rgb;
    }
    
    return vec3(0.0);
}

vec2 apply_breathing_effect(vec2 uv) {
    if (!enable_subtle_breathing) return uv;
    
    // Subtle breathing/pulsing effect
    float breath = sin(TIME * 1.5) * breathing_intensity;
    vec2 center = vec2(0.5, 0.5);
    return mix(uv, center, breath);
}

float calculate_vignette(vec2 uv) {
    vec2 center = vec2(0.5, 0.5);
    float distance = length(uv - center);
    return 1.0 - smoothstep(0.3, 0.8, distance * vignette_strength);
}

void fragment() {
    vec2 screen_uv = apply_breathing_effect(SCREEN_UV);
    
    // Sample main screen texture
    vec3 color = texture(screen_texture, screen_uv).rgb;
    
    // Sample depth for depth effects
    float depth = texture(depth_texture, screen_uv).r;
    
    // Apply exposure
    color *= exposure;
    
    // Apply gamma correction
    color = pow(color, vec3(1.0 / gamma));
    
    // Apply color temperature
    color = apply_color_temperature(color, temperature);
    
    // Apply SF3:3S color grading
    color = apply_sf3s_color_grading(color);
    
    // Apply depth-based effects
    color = apply_depth_effects(color, depth);
    
    // Calculate and add bloom
    vec3 bloom = calculate_bloom(screen_texture, screen_uv);
    color += bloom;
    
    // Apply film grain
    if (film_grain_intensity > 0.0) {
        float grain = random(screen_uv + TIME) * 2.0 - 1.0;
        color += grain * film_grain_intensity * 0.1;
    }
    
    // Apply vignette
    if (vignette_strength > 0.0) {
        float vignette = calculate_vignette(screen_uv);
        color = mix(vignette_color.rgb, color, vignette);
    }
    
    // Final clamp to prevent over-bright values
    color = clamp(color, 0.0, 1.0);
    
    COLOR = vec4(color, 1.0);
}