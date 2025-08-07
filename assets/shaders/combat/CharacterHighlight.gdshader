// Advanced character highlight shader for cutting-edge visuals
// MIT Licensed - Free for commercial use
shader_type canvas_item;

uniform float outline_width : hint_range(0.0, 10.0) = 2.0;
uniform vec4 outline_color : source_color = vec4(1.0, 0.5, 0.0, 1.0);
uniform float rim_power : hint_range(0.1, 5.0) = 2.0;
uniform float rim_intensity : hint_range(0.0, 2.0) = 1.0;
uniform vec4 rim_color : source_color = vec4(0.8, 0.9, 1.0, 1.0);
uniform float energy_flow_speed : hint_range(0.1, 5.0) = 2.0;
uniform float energy_frequency : hint_range(1.0, 20.0) = 5.0;
uniform bool enable_energy_flow = true;

varying vec2 world_position;

void vertex() {
    world_position = VERTEX;
}

void fragment() {
    vec2 uv = UV;
    vec4 tex_color = texture(TEXTURE, uv);
    
    // Skip transparent pixels
    if (tex_color.a < 0.1) {
        COLOR = tex_color;
        return;
    }
    
    vec3 final_color = tex_color.rgb;
    
    // Create outline by sampling neighboring pixels
    float outline = 0.0;
    vec2 tex_size = 1.0 / TEXTURE_PIXEL_SIZE;
    float outline_width_uv = outline_width / tex_size.x;
    
    for (float i = 0.0; i < 8.0; i++) {
        float angle = i * 0.785398; // 45 degrees in radians
        vec2 offset = vec2(cos(angle), sin(angle)) * outline_width_uv;
        float alpha = texture(TEXTURE, uv + offset).a;
        if (alpha < 0.1 && tex_color.a > 0.1) {
            outline = 1.0;
            break;
        }
    }
    
    // Apply outline
    if (outline > 0.0) {
        final_color = mix(final_color, outline_color.rgb, outline_color.a);
    }
    
    // Create rim lighting effect
    vec2 center = vec2(0.5, 0.5);
    vec2 rim_dir = normalize(uv - center);
    float rim_factor = dot(rim_dir, rim_dir);
    rim_factor = pow(rim_factor, rim_power);
    
    // Add energy flow animation
    float energy = 1.0;
    if (enable_energy_flow) {
        float time_offset = TIME * energy_flow_speed;
        energy = sin(uv.y * energy_frequency + time_offset) * 0.5 + 0.5;
        energy = smoothstep(0.3, 0.7, energy);
    }
    
    // Apply rim lighting
    vec3 rim_light = rim_color.rgb * rim_intensity * rim_factor * energy;
    final_color += rim_light;
    
    COLOR = vec4(final_color, tex_color.a);
}