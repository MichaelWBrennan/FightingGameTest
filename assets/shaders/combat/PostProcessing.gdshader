// Advanced post-processing shader for cutting-edge screen effects
// MIT Licensed - Free for commercial use
shader_type canvas_item;

uniform float chromatic_aberration : hint_range(0.0, 0.02) = 0.005;
uniform float vignette_strength : hint_range(0.0, 1.0) = 0.3;
uniform float film_grain_intensity : hint_range(0.0, 1.0) = 0.1;
uniform float scan_line_opacity : hint_range(0.0, 1.0) = 0.05;
uniform float scan_line_frequency : hint_range(50.0, 1000.0) = 200.0;
uniform bool enable_color_grading = true;
uniform vec3 color_balance : source_color = vec3(1.0, 0.95, 0.9);
uniform float contrast : hint_range(0.5, 2.0) = 1.1;
uniform float saturation : hint_range(0.0, 2.0) = 1.05;

float random(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 rgb_to_hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv_to_rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void fragment() {
    vec2 uv = UV;
    
    // Chromatic aberration
    vec2 center = vec2(0.5, 0.5);
    vec2 dir = uv - center;
    float dist = length(dir);
    
    float r = texture(TEXTURE, uv + dir * chromatic_aberration).r;
    float g = texture(TEXTURE, uv).g;
    float b = texture(TEXTURE, uv - dir * chromatic_aberration).b;
    
    vec3 color = vec3(r, g, b);
    
    // Vignette effect
    float vignette = 1.0 - smoothstep(0.3, 1.2, dist);
    vignette = mix(1.0, vignette, vignette_strength);
    color *= vignette;
    
    // Film grain
    float grain = random(uv + TIME) * 2.0 - 1.0;
    color += grain * film_grain_intensity * 0.1;
    
    // Scan lines
    float scan_line = sin(uv.y * scan_line_frequency) * 0.5 + 0.5;
    scan_line = mix(1.0, scan_line, scan_line_opacity);
    color *= scan_line;
    
    // Color grading
    if (enable_color_grading) {
        // Apply color balance
        color *= color_balance;
        
        // Adjust contrast
        color = (color - 0.5) * contrast + 0.5;
        
        // Adjust saturation
        vec3 hsv = rgb_to_hsv(color);
        hsv.y *= saturation;
        color = hsv_to_rgb(hsv);
    }
    
    // Ensure color stays in valid range
    color = clamp(color, 0.0, 1.0);
    
    COLOR = vec4(color, 1.0);
}