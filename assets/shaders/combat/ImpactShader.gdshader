// Advanced impact shader for cutting-edge combat visuals
// MIT Licensed - Free for commercial use
shader_type canvas_item;

uniform float impact_intensity : hint_range(0.0, 2.0) = 1.0;
uniform float flash_strength : hint_range(0.0, 1.0) = 0.8;
uniform vec4 impact_color : source_color = vec4(1.0, 0.8, 0.3, 1.0);
uniform float time_scale : hint_range(0.1, 5.0) = 2.0;
uniform float wave_frequency : hint_range(1.0, 10.0) = 3.0;
uniform float distortion_strength : hint_range(0.0, 0.1) = 0.02;

varying vec2 screen_uv;

void vertex() {
    screen_uv = SCREEN_UV;
}

vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(
        mix(dot(hash22(i + vec2(0.0, 0.0)) - 0.5, f - vec2(0.0, 0.0)),
            dot(hash22(i + vec2(1.0, 0.0)) - 0.5, f - vec2(1.0, 0.0)), u.x),
        mix(dot(hash22(i + vec2(0.0, 1.0)) - 0.5, f - vec2(0.0, 1.0)),
            dot(hash22(i + vec2(1.0, 1.0)) - 0.5, f - vec2(1.0, 1.0)), u.x), u.y);
}

void fragment() {
    vec2 uv = UV;
    float time = TIME * time_scale;
    
    // Create radial impact waves
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(uv, center);
    float wave = sin(dist * wave_frequency - time * 3.0) * 0.5 + 0.5;
    wave *= exp(-dist * 2.0); // Fade with distance
    
    // Add screen distortion
    vec2 distortion = vec2(
        noise(uv * 10.0 + time),
        noise(uv * 10.0 + time + 100.0)
    ) * distortion_strength * impact_intensity;
    
    // Sample the texture with distortion
    vec4 tex_color = texture(TEXTURE, uv + distortion);
    
    // Create impact flash
    float flash = wave * flash_strength * impact_intensity;
    vec3 final_color = mix(tex_color.rgb, impact_color.rgb, flash);
    
    // Add energy glow effect
    float glow = smoothstep(0.3, 0.0, dist) * impact_intensity;
    final_color += impact_color.rgb * glow * 0.5;
    
    COLOR = vec4(final_color, tex_color.a);
}