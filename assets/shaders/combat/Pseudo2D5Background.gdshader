// Pseudo 2.5D Background Shader - Multi-layer parallax with depth
// Creates realistic depth sensation for 2D backgrounds
// MIT Licensed - Free for commercial use
shader_type canvas_item;

// Parallax and depth parameters
uniform float depth_layer : hint_range(-5.0, 5.0) = 0.0;
uniform float parallax_strength : hint_range(0.0, 2.0) = 1.0;
uniform vec2 camera_offset = vec2(0.0, 0.0);
uniform bool enable_depth_fog = true;
uniform vec4 fog_color : source_color = vec4(0.7, 0.8, 1.0, 0.3);
uniform float fog_distance : hint_range(0.0, 10.0) = 3.0;

// Atmospheric perspective
uniform bool enable_atmospheric_perspective = true;
uniform float atmosphere_strength : hint_range(0.0, 1.0) = 0.5;
uniform vec4 atmosphere_color : source_color = vec4(0.6, 0.7, 0.9, 1.0);

// Lighting integration
uniform vec4 ambient_light : source_color = vec4(0.8, 0.8, 0.9, 1.0);
uniform float lighting_influence : hint_range(0.0, 1.0) = 0.7;

// Animation parameters
uniform float wind_speed : hint_range(0.0, 3.0) = 1.0;
uniform float wind_strength : hint_range(0.0, 0.1) = 0.02;
uniform bool enable_wind_animation = false;

// Heat haze effect for dramatic stages
uniform bool enable_heat_haze = false;
uniform float haze_intensity : hint_range(0.0, 0.02) = 0.005;
uniform float haze_speed : hint_range(0.0, 2.0) = 1.0;

float noise(vec2 pos) {
    return fract(sin(dot(pos, vec2(12.9898, 78.233))) * 43758.5453);
}

float smooth_noise(vec2 pos) {
    vec2 i = floor(pos);
    vec2 f = fract(pos);
    
    float a = noise(i);
    float b = noise(i + vec2(1.0, 0.0));
    float c = noise(i + vec2(0.0, 1.0));
    float d = noise(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void fragment() {
    vec2 uv = UV;
    
    // Apply parallax offset based on depth layer
    vec2 parallax_offset = camera_offset * depth_layer * parallax_strength * 0.01;
    uv += parallax_offset;
    
    // Wind animation for background elements
    if (enable_wind_animation) {
        float wind_time = TIME * wind_speed;
        float wind_wave = sin(uv.y * 10.0 + wind_time) * wind_strength;
        uv.x += wind_wave;
    }
    
    // Heat haze distortion
    if (enable_heat_haze) {
        float haze_time = TIME * haze_speed;
        vec2 haze_offset = vec2(
            smooth_noise(uv * 20.0 + haze_time),
            smooth_noise(uv * 25.0 + haze_time + 100.0)
        ) * haze_intensity;
        uv += haze_offset;
    }
    
    // Wrap UV coordinates for seamless parallax
    uv = fract(uv);
    
    // Sample base texture
    vec4 base_color = texture(TEXTURE, uv);
    
    if (base_color.a < 0.01) {
        COLOR = base_color;
        return;
    }
    
    vec3 final_color = base_color.rgb;
    
    // Apply ambient lighting
    final_color *= ambient_light.rgb * lighting_influence + vec3(1.0 - lighting_influence);
    
    // Atmospheric perspective based on depth
    if (enable_atmospheric_perspective && depth_layer != 0.0) {
        float depth_factor = abs(depth_layer) / fog_distance;
        depth_factor = clamp(depth_factor, 0.0, 1.0);
        
        // Apply atmospheric color mixing
        final_color = mix(final_color, atmosphere_color.rgb, depth_factor * atmosphere_strength);
    }
    
    // Depth fog for distant layers
    if (enable_depth_fog && depth_layer < 0.0) {
        float fog_factor = abs(depth_layer) / fog_distance;
        fog_factor = clamp(fog_factor, 0.0, 1.0);
        fog_factor = smoothstep(0.2, 1.0, fog_factor);
        
        final_color = mix(final_color, fog_color.rgb, fog_factor * fog_color.a);
    }
    
    // Darken very distant backgrounds slightly
    if (depth_layer < -2.0) {
        float darken_factor = (abs(depth_layer) - 2.0) * 0.1;
        darken_factor = clamp(darken_factor, 0.0, 0.3);
        final_color *= (1.0 - darken_factor);
    }
    
    // Brighten foreground elements slightly
    if (depth_layer > 1.0) {
        float brighten_factor = (depth_layer - 1.0) * 0.05;
        brighten_factor = clamp(brighten_factor, 0.0, 0.2);
        final_color += vec3(brighten_factor);
    }
    
    final_color = clamp(final_color, 0.0, 1.0);
    COLOR = vec4(final_color, base_color.a);
}