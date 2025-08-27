/**
 * Advanced Character Highlight Shader for Cutting-Edge Visuals
 * Enhanced for Pseudo 2.5D rendering pipeline
 * Converted from GDScript to TypeScript
 */
export class CharacterHighlightShader {
    static createMaterial(device) {
        const material = new device.StandardMaterial();
        material.chunks.VS_TRANSFORM = this.vertexShader;
        material.chunks.PS_OUTPUT = this.fragmentShader;
        return material;
    }
    static setUniforms(material, params) {
        material.setParameter('outline_width', params.outlineWidth);
        material.setParameter('outline_color', params.outlineColor);
        material.setParameter('rim_power', params.rimPower);
        material.setParameter('rim_intensity', params.rimIntensity);
        material.setParameter('rim_color', params.rimColor);
        material.setParameter('energy_flow_speed', params.energyFlowSpeed);
        material.setParameter('energy_frequency', params.energyFrequency);
        material.setParameter('enable_energy_flow', params.enableEnergyFlow);
        material.setParameter('ambient_color', params.ambientColor);
        material.setParameter('main_light_color', params.mainLightColor);
        material.setParameter('lighting_intensity', params.lightingIntensity);
        material.setParameter('light_direction', params.lightDirection);
        material.setParameter('enable_pseudo_depth', params.enablePseudoDepth);
        material.setParameter('depth_offset', params.depthOffset);
        material.setParameter('shadow_color', params.shadowColor);
        material.setParameter('time', params.time);
        material.setParameter('texture_pixelSize', params.texturePixelSize);
    }
}
CharacterHighlightShader.vertexShader = `
    attribute vec3 vertex_position;
    attribute vec2 vertex_texCoord0;
    
    uniform mat4 matrix_model;
    uniform mat4 matrix_view;
    uniform mat4 matrix_projection;
    
    varying vec2 vUv0;
    varying vec2 vWorldPosition;
    
    void main() {
        vec4 worldPos = matrix_model * vec4(vertex_position, 1.0);
        vWorldPosition = worldPos.xy;
        vUv0 = vertex_texCoord0;
        gl_Position = matrix_projection * matrix_view * worldPos;
    }
  `;
CharacterHighlightShader.fragmentShader = `
    #ifdef GL_ES
    precision highp float;
    #endif
    
    varying vec2 vUv0;
    varying vec2 vWorldPosition;
    
    uniform sampler2D texture_diffuseMap;
    uniform vec2 texture_pixelSize;
    
    // Shader parameters
    uniform float outline_width;
    uniform vec4 outline_color;
    uniform float rim_power;
    uniform float rim_intensity;
    uniform vec4 rim_color;
    uniform float energy_flow_speed;
    uniform float energy_frequency;
    uniform bool enable_energy_flow;
    
    // Pseudo 2.5D lighting integration
    uniform vec4 ambient_color;
    uniform vec4 main_light_color;
    uniform float lighting_intensity;
    uniform vec2 light_direction;
    
    // Depth and shadow effects
    uniform bool enable_pseudo_depth;
    uniform float depth_offset;
    uniform vec4 shadow_color;
    
    uniform float time;
    
    // Calculate pseudo normal for depth effect
    vec3 calculate_pseudo_normal(vec2 uv) {
        vec2 tex_size = 1.0 / texture_pixelSize;
        float offset = 1.0 / tex_size.x;
        
        float height_left = texture2D(texture_diffuseMap, uv - vec2(offset, 0.0)).r;
        float height_right = texture2D(texture_diffuseMap, uv + vec2(offset, 0.0)).r;
        float height_up = texture2D(texture_diffuseMap, uv - vec2(0.0, offset)).r;
        float height_down = texture2D(texture_diffuseMap, uv + vec2(0.0, offset)).r;
        
        float dx = (height_right - height_left);
        float dy = (height_down - height_up);
        
        return normalize(vec3(dx, dy, 1.0));
    }
    
    void main() {
        vec2 uv = vUv0;
        vec4 tex_color = texture2D(texture_diffuseMap, uv);
        
        // Skip transparent pixels
        if (tex_color.a < 0.1) {
            gl_FragColor = tex_color;
            return;
        }
        
        vec3 final_color = tex_color.rgb;
        
        // Apply pseudo 2.5D lighting
        if (enable_pseudo_depth) {
            vec3 pseudo_normal = calculate_pseudo_normal(uv);
            float light_factor = dot(pseudo_normal, normalize(vec3(light_direction, 1.0)));
            light_factor = light_factor * 0.5 + 0.5;
            
            vec3 lit_color = mix(ambient_color.rgb, main_light_color.rgb, light_factor);
            final_color *= lit_color * lighting_intensity;
            
            // Add subtle shadow
            float shadow_factor = 1.0 - light_factor;
            shadow_factor = smoothstep(0.3, 0.7, shadow_factor);
            final_color = mix(final_color, shadow_color.rgb, shadow_factor * shadow_color.a * 0.2);
        }
        
        // Create outline by sampling neighboring pixels
        float outline = 0.0;
        vec2 tex_size = 1.0 / texture_pixelSize;
        float outline_width_uv = outline_width / tex_size.x;
        
        for (float i = 0.0; i < 8.0; i++) {
            float angle = i * 0.785398; // 45 degrees in radians
            vec2 offset = vec2(cos(angle), sin(angle)) * outline_width_uv;
            float alpha = texture2D(texture_diffuseMap, uv + offset).a;
            if (alpha < 0.1 && tex_color.a > 0.1) {
                outline = 1.0;
                break;
            }
        }
        
        // Apply outline with depth consideration
        if (outline > 0.0) {
            final_color = mix(final_color, outline_color.rgb, outline_color.a);
        }
        
        // Create enhanced rim lighting effect
        vec2 center = vec2(0.5, 0.5);
        vec2 rim_dir = normalize(uv - center);
        float rim_factor = dot(rim_dir, rim_dir);
        rim_factor = pow(rim_factor, rim_power);
        
        // Add energy flow animation
        float energy = 1.0;
        if (enable_energy_flow) {
            float time_offset = time * energy_flow_speed;
            energy = sin(uv.y * energy_frequency + time_offset) * 0.5 + 0.5;
            energy = smoothstep(0.3, 0.7, energy);
        }
        
        // Apply rim lighting with energy animation
        vec3 rim_light = rim_color.rgb * rim_intensity * rim_factor * energy;
        final_color += rim_light;
        
        // Enhanced contrast for fighting game aesthetics
        final_color = pow(final_color, vec3(0.9));
        final_color = clamp(final_color, 0.0, 1.0);
        
        gl_FragColor = vec4(final_color, tex_color.a);
    }
  `;
export class CharacterHighlightManager {
    constructor() {
        this.materials = new Map();
        this.startTime = Date.now();
    }
    createHighlightMaterial(device, characterId, params) {
        const material = CharacterHighlightShader.createMaterial(device);
        this.materials.set(characterId, { material, params });
        return material;
    }
    updateHighlight(characterId, deltaTime) {
        const data = this.materials.get(characterId);
        if (!data)
            return;
        const currentTime = (Date.now() - this.startTime) / 1000.0;
        CharacterHighlightShader.setUniforms(data.material, {
            ...data.params,
            time: currentTime,
            texturePixelSize: [1.0 / 256, 1.0 / 256] // Default sprite size
        });
    }
    setHighlightParams(characterId, params) {
        const data = this.materials.get(characterId);
        if (!data)
            return;
        Object.assign(data.params, params);
    }
    removeHighlight(characterId) {
        this.materials.delete(characterId);
    }
    updateAll(deltaTime) {
        for (const characterId of this.materials.keys()) {
            this.updateHighlight(characterId, deltaTime);
        }
    }
}
//# sourceMappingURL=CharacterHighlightShader.js.map