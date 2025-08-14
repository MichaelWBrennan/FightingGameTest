shader_type canvas_item;

/*
Mode-7 Style Floor Shader for Pseudo-3D Effect
Creates perspective warped floor with heightmap support and shadow receiver
Optimized for 60 FPS performance at 1080p
MIT Licensed
*/

// === Floor Textures ===
uniform sampler2D floor_texture: source_color, filter_linear_mipmap, repeat_enable;
uniform sampler2D heightmap_texture: hint_default_black, filter_linear_mipmap, repeat_enable;
uniform sampler2D shadow_texture: hint_default_white, filter_linear_mipmap, repeat_enable;

// === Perspective Parameters ===
uniform float horizon_y: hint_range(0.0, 1.0) = 0.5;  // Horizon line position (0=bottom, 1=top)
uniform float perspective_strength: hint_range(0.1, 5.0) = 1.5;  // How strong the perspective effect is
uniform float fov_scale: hint_range(0.1, 2.0) = 1.0;  // Field of view scaling
uniform float camera_height: hint_range(0.1, 10.0) = 2.0;  // Virtual camera height

// === UV Scrolling ===
uniform vec2 uv_scroll: hint_default(0.0, 0.0) = vec2(0.0, 0.0);  // UV scrolling speed
uniform vec2 uv_scale: hint_default(1.0, 1.0) = vec2(4.0, 4.0);  // UV tiling scale

// === Heightmap Effects ===
uniform bool enable_heightmap: hint_default_enabled = false;
uniform float height_scale: hint_range(0.0, 1.0) = 0.1;  // Height displacement amount
uniform vec3 height_color: source_color = vec3(1.0, 1.0, 1.0);  // Color tint for elevated areas

// === Shadow Receiver ===
uniform bool enable_shadows: hint_default_enabled = true;
uniform float shadow_strength: hint_range(0.0, 2.0) = 1.0;
uniform vec3 shadow_color: source_color = vec3(0.0, 0.0, 0.0);

// === Fog/Distance ===
uniform bool enable_fog: hint_default_enabled = false;
uniform vec3 fog_color: source_color = vec3(0.5, 0.5, 0.6);
uniform float fog_start: hint_range(0.0, 1.0) = 0.6;  // Where fog starts (0=near, 1=far)
uniform float fog_density: hint_range(0.0, 5.0) = 1.0;

// === Performance/Quality ===
uniform bool enable_filtering: hint_default_enabled = true;
uniform float mip_bias: hint_range(-2.0, 2.0) = 0.0;

varying vec2 world_position;
varying float depth_factor;

void vertex() {
    world_position = (MODEL_MATRIX * vec4(VERTEX, 0.0, 1.0)).xy;
}

void fragment() {
    vec2 screen_uv = SCREEN_UV;
    
    // === Mode-7 Perspective Calculation ===
    
    // Calculate distance from horizon
    float horizon_distance = screen_uv.y - horizon_y;
    
    // Skip pixels above horizon (sky area)
    if (horizon_distance <= 0.0) {
        discard;
    }
    
    // Calculate perspective depth factor
    // Objects further from horizon appear "further away"
    float depth = camera_height / (horizon_distance * perspective_strength);
    depth_factor = depth;
    
    // Calculate world UV coordinates with perspective
    vec2 perspective_uv;
    perspective_uv.x = (screen_uv.x - 0.5) * depth * fov_scale;
    perspective_uv.y = depth;
    
    // Apply UV scaling and scrolling
    perspective_uv *= uv_scale;
    perspective_uv += uv_scroll * TIME;
    
    // === Texture Sampling ===
    
    vec4 floor_sample = texture(floor_texture, perspective_uv);
    vec3 base_color = floor_sample.rgb;
    
    // === Heightmap Displacement ===
    if (enable_heightmap) {
        vec4 height_sample = texture(heightmap_texture, perspective_uv);
        float height_value = height_sample.r;
        
        // Apply height-based color modulation
        vec3 height_tint = mix(vec3(1.0), height_color, height_value * height_scale);
        base_color *= height_tint;
        
        // Optional: Subtle height-based UV displacement for "embossed" effect
        vec2 height_gradient = vec2(
            texture(heightmap_texture, perspective_uv + vec2(0.001, 0.0)).r - height_value,
            texture(heightmap_texture, perspective_uv + vec2(0.0, 0.001)).r - height_value
        );
        perspective_uv += height_gradient * height_scale * 0.01;
        
        // Re-sample with displaced UVs
        floor_sample = texture(floor_texture, perspective_uv);
        base_color = floor_sample.rgb * height_tint;
    }
    
    // === Shadow Receiver ===
    vec3 final_color = base_color;
    
    if (enable_shadows) {
        vec4 shadow_sample = texture(shadow_texture, perspective_uv);
        float shadow_factor = shadow_sample.r;
        
        // Apply shadows as darkening
        vec3 shadowed_color = mix(base_color, shadow_color, (1.0 - shadow_factor) * shadow_strength);
        final_color = shadowed_color;
    }
    
    // === Distance Fog ===
    if (enable_fog) {
        float fog_factor = smoothstep(fog_start, 1.0, horizon_distance);
        fog_factor = 1.0 - exp(-fog_factor * fog_density);
        final_color = mix(final_color, fog_color, fog_factor);
    }
    
    // === Final Output ===
    
    // Apply depth-based dimming for atmospheric perspective
    float depth_dimming = 1.0 - smoothstep(0.0, 10.0, depth_factor * 0.5);
    final_color *= mix(0.6, 1.0, depth_dimming);
    
    // Ensure alpha is preserved
    float final_alpha = floor_sample.a;
    
    COLOR = vec4(final_color * COLOR.rgb, final_alpha * COLOR.a);
    
    // Debug: Visualize depth
    // COLOR = vec4(vec3(depth_factor * 0.1), 1.0);
    
    // Debug: Visualize perspective UV
    // COLOR = vec4(fract(perspective_uv), 0.0, 1.0);
}