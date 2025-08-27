/**
 * Advanced Character Highlight Shader for Cutting-Edge Visuals
 * Enhanced for Pseudo 2.5D rendering pipeline
 * Converted from GDScript to TypeScript
 */
export declare class CharacterHighlightShader {
    static readonly vertexShader = "\n    attribute vec3 vertex_position;\n    attribute vec2 vertex_texCoord0;\n    \n    uniform mat4 matrix_model;\n    uniform mat4 matrix_view;\n    uniform mat4 matrix_projection;\n    \n    varying vec2 vUv0;\n    varying vec2 vWorldPosition;\n    \n    void main() {\n        vec4 worldPos = matrix_model * vec4(vertex_position, 1.0);\n        vWorldPosition = worldPos.xy;\n        vUv0 = vertex_texCoord0;\n        gl_Position = matrix_projection * matrix_view * worldPos;\n    }\n  ";
    static readonly fragmentShader = "\n    #ifdef GL_ES\n    precision highp float;\n    #endif\n    \n    varying vec2 vUv0;\n    varying vec2 vWorldPosition;\n    \n    uniform sampler2D texture_diffuseMap;\n    uniform vec2 texture_pixelSize;\n    \n    // Shader parameters\n    uniform float outline_width;\n    uniform vec4 outline_color;\n    uniform float rim_power;\n    uniform float rim_intensity;\n    uniform vec4 rim_color;\n    uniform float energy_flow_speed;\n    uniform float energy_frequency;\n    uniform bool enable_energy_flow;\n    \n    // Pseudo 2.5D lighting integration\n    uniform vec4 ambient_color;\n    uniform vec4 main_light_color;\n    uniform float lighting_intensity;\n    uniform vec2 light_direction;\n    \n    // Depth and shadow effects\n    uniform bool enable_pseudo_depth;\n    uniform float depth_offset;\n    uniform vec4 shadow_color;\n    \n    uniform float time;\n    \n    // Calculate pseudo normal for depth effect\n    vec3 calculate_pseudo_normal(vec2 uv) {\n        vec2 tex_size = 1.0 / texture_pixelSize;\n        float offset = 1.0 / tex_size.x;\n        \n        float height_left = texture2D(texture_diffuseMap, uv - vec2(offset, 0.0)).r;\n        float height_right = texture2D(texture_diffuseMap, uv + vec2(offset, 0.0)).r;\n        float height_up = texture2D(texture_diffuseMap, uv - vec2(0.0, offset)).r;\n        float height_down = texture2D(texture_diffuseMap, uv + vec2(0.0, offset)).r;\n        \n        float dx = (height_right - height_left);\n        float dy = (height_down - height_up);\n        \n        return normalize(vec3(dx, dy, 1.0));\n    }\n    \n    void main() {\n        vec2 uv = vUv0;\n        vec4 tex_color = texture2D(texture_diffuseMap, uv);\n        \n        // Skip transparent pixels\n        if (tex_color.a < 0.1) {\n            gl_FragColor = tex_color;\n            return;\n        }\n        \n        vec3 final_color = tex_color.rgb;\n        \n        // Apply pseudo 2.5D lighting\n        if (enable_pseudo_depth) {\n            vec3 pseudo_normal = calculate_pseudo_normal(uv);\n            float light_factor = dot(pseudo_normal, normalize(vec3(light_direction, 1.0)));\n            light_factor = light_factor * 0.5 + 0.5;\n            \n            vec3 lit_color = mix(ambient_color.rgb, main_light_color.rgb, light_factor);\n            final_color *= lit_color * lighting_intensity;\n            \n            // Add subtle shadow\n            float shadow_factor = 1.0 - light_factor;\n            shadow_factor = smoothstep(0.3, 0.7, shadow_factor);\n            final_color = mix(final_color, shadow_color.rgb, shadow_factor * shadow_color.a * 0.2);\n        }\n        \n        // Create outline by sampling neighboring pixels\n        float outline = 0.0;\n        vec2 tex_size = 1.0 / texture_pixelSize;\n        float outline_width_uv = outline_width / tex_size.x;\n        \n        for (float i = 0.0; i < 8.0; i++) {\n            float angle = i * 0.785398; // 45 degrees in radians\n            vec2 offset = vec2(cos(angle), sin(angle)) * outline_width_uv;\n            float alpha = texture2D(texture_diffuseMap, uv + offset).a;\n            if (alpha < 0.1 && tex_color.a > 0.1) {\n                outline = 1.0;\n                break;\n            }\n        }\n        \n        // Apply outline with depth consideration\n        if (outline > 0.0) {\n            final_color = mix(final_color, outline_color.rgb, outline_color.a);\n        }\n        \n        // Create enhanced rim lighting effect\n        vec2 center = vec2(0.5, 0.5);\n        vec2 rim_dir = normalize(uv - center);\n        float rim_factor = dot(rim_dir, rim_dir);\n        rim_factor = pow(rim_factor, rim_power);\n        \n        // Add energy flow animation\n        float energy = 1.0;\n        if (enable_energy_flow) {\n            float time_offset = time * energy_flow_speed;\n            energy = sin(uv.y * energy_frequency + time_offset) * 0.5 + 0.5;\n            energy = smoothstep(0.3, 0.7, energy);\n        }\n        \n        // Apply rim lighting with energy animation\n        vec3 rim_light = rim_color.rgb * rim_intensity * rim_factor * energy;\n        final_color += rim_light;\n        \n        // Enhanced contrast for fighting game aesthetics\n        final_color = pow(final_color, vec3(0.9));\n        final_color = clamp(final_color, 0.0, 1.0);\n        \n        gl_FragColor = vec4(final_color, tex_color.a);\n    }\n  ";
    static createMaterial(device: any): any;
    static setUniforms(material: any, params: {
        outlineWidth: number;
        outlineColor: [number, number, number, number];
        rimPower: number;
        rimIntensity: number;
        rimColor: [number, number, number, number];
        energyFlowSpeed: number;
        energyFrequency: number;
        enableEnergyFlow: boolean;
        ambientColor: [number, number, number, number];
        mainLightColor: [number, number, number, number];
        lightingIntensity: number;
        lightDirection: [number, number];
        enablePseudoDepth: boolean;
        depthOffset: number;
        shadowColor: [number, number, number, number];
        time: number;
        texturePixelSize: [number, number];
    }): void;
}
export interface CharacterHighlightParams {
    outlineWidth: number;
    outlineColor: [number, number, number, number];
    rimPower: number;
    rimIntensity: number;
    rimColor: [number, number, number, number];
    energyFlowSpeed: number;
    energyFrequency: number;
    enableEnergyFlow: boolean;
    ambientColor: [number, number, number, number];
    mainLightColor: [number, number, number, number];
    lightingIntensity: number;
    lightDirection: [number, number];
    enablePseudoDepth: boolean;
    depthOffset: number;
    shadowColor: [number, number, number, number];
}
export declare class CharacterHighlightManager {
    private materials;
    private startTime;
    createHighlightMaterial(device: any, characterId: string, params: CharacterHighlightParams): any;
    updateHighlight(characterId: string, deltaTime: number): void;
    setHighlightParams(characterId: string, params: Partial<CharacterHighlightParams>): void;
    removeHighlight(characterId: string): void;
    updateAll(deltaTime: number): void;
}
