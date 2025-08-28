import * as pc from 'playcanvas';
import { CharacterHighlightShader } from '../../typescript/shaders/CharacterHighlightShader';
import { RimLightingShader } from '../../typescript/shaders/RimLightingShader';
import { SpriteNormalMappingShader } from '../../typescript/shaders/SpriteNormalMappingShader';
import { DepthPostProcessShader } from '../../typescript/shaders/DepthPostProcessShader';
import { StageStormySkyShader } from '../../typescript/shaders/StageStormySkyShader';

export class ShaderUtils {
    public static createMaterialFromShaders(app: pc.Application, vertexShader: string, fragmentShader: string): pc.Material {
        const shader = new pc.Shader(app.graphicsDevice, {
            attributes: {
                vertex_position: pc.SEMANTIC_POSITION,
                vertex_texCoord0: pc.SEMANTIC_TEXCOORD0,
                vertex_normal: pc.SEMANTIC_NORMAL,
                vertex_tangent: pc.SEMANTIC_TANGENT
            },
            vshader: vertexShader,
            fshader: fragmentShader
        });

        const material = new pc.Material();
        material.shader = shader;
        return material;
    }

    public static createCharacterHighlightMaterial(app: pc.Application): pc.Material {
        const mat = this.createMaterialFromShaders(app, CharacterHighlightShader.vertexShader, CharacterHighlightShader.fragmentShader);
        // Reasonable defaults; callers can override
        mat.setParameter('outline_width', 2.0);
        mat.setParameter('outline_color', new Float32Array([1.0, 0.5, 0.0, 1.0]));
        mat.setParameter('rim_power', 2.0);
        mat.setParameter('rim_intensity', 1.0);
        mat.setParameter('rim_color', new Float32Array([0.8, 0.9, 1.0, 1.0]));
        mat.setParameter('energy_flow_speed', 2.0);
        mat.setParameter('energy_frequency', 5.0);
        mat.setParameter('enable_energy_flow', 1);
        mat.setParameter('ambient_color', new Float32Array([0.2, 0.2, 0.3, 1.0]));
        mat.setParameter('main_light_color', new Float32Array([1.0, 0.95, 0.9, 1.0]));
        mat.setParameter('lighting_intensity', 1.0);
        mat.setParameter('light_direction', new Float32Array([0.3, -0.5]));
        mat.setParameter('enable_pseudo_depth', 1);
        mat.setParameter('depth_offset', 0.01);
        mat.setParameter('shadow_color', new Float32Array([0.1, 0.1, 0.2, 0.3]));
        mat.setParameter('time', 0.0);
        mat.setParameter('texture_pixelSize', new Float32Array([1.0 / 256.0, 1.0 / 256.0]));
        return mat;
    }

    public static createRimLightingMaterial(app: pc.Application): pc.Material {
        const mat = this.createMaterialFromShaders(app, RimLightingShader.vertexShader, RimLightingShader.fragmentShader);
        // Minimal defaults
        mat.setParameter('material_opacity', 1.0);
        mat.setParameter('material_diffuse', new Float32Array([1, 1, 1]));
        mat.setParameter('material_emissive', new Float32Array([0, 0, 0]));
        mat.setParameter('light_globalAmbient', new Float32Array([0.2, 0.2, 0.2]));
        mat.setParameter('light_color', new Float32Array([1, 1, 1]));
        mat.setParameter('light_direction', new Float32Array([0, -1, 0]));
        mat.setParameter('light_intensity', 1.0);
        mat.setParameter('rimPower', 2.0);
        mat.setParameter('rimIntensity', 0.8);
        mat.setParameter('rimColor', new Float32Array([0.8, 0.9, 1.0]));
        mat.setParameter('depthBlur', 0.0);
        mat.setParameter('pixelSize', 0.0);
        mat.setParameter('screenResolution', new Float32Array([1920, 1080]));
        mat.setParameter('hitFlash', 0.0);
        mat.setParameter('hitFlashColor', new Float32Array([1.0, 1.0, 1.0]));
        mat.setParameter('characterHighlight', 0.0);
        return mat;
    }

    public static createSpriteNormalMappingMaterial(app: pc.Application): pc.Material {
        const mat = this.createMaterialFromShaders(app, SpriteNormalMappingShader.vertexShader, SpriteNormalMappingShader.fragmentShader);
        // Defaults for normal mapping sprite
        mat.setParameter('material_diffuse', new Float32Array([1, 1, 1]));
        mat.setParameter('material_specular', new Float32Array([0.1, 0.1, 0.1]));
        mat.setParameter('material_shininess', 16.0);
        mat.setParameter('material_opacity', 1.0);
        mat.setParameter('light_color_0', new Float32Array([1, 1, 1]));
        mat.setParameter('light_color_1', new Float32Array([1, 1, 1]));
        mat.setParameter('light_color_2', new Float32Array([1, 1, 1]));
        mat.setParameter('light_intensity_0', 1.0);
        mat.setParameter('light_intensity_1', 0.5);
        mat.setParameter('light_intensity_2', 0.2);
        mat.setParameter('normalMapStrength', 1.0);
        mat.setParameter('spriteDepth', 0.0);
        mat.setParameter('spritePixelSize', new Float32Array([256, 256]));
        mat.setParameter('pixelPerfect', 0.0);
        mat.setParameter('hitFlash', 0.0);
        mat.setParameter('hitFlashColor', new Float32Array([1, 1, 1]));
        mat.setParameter('stunEffect', 0.0);
        mat.setParameter('counterHitGlow', 0.0);
        mat.setParameter('playerTint', new Float32Array([1, 1, 1]));
        mat.setParameter('animationFrame', 0.0);
        mat.setParameter('spriteSheetSize', new Float32Array([1, 1]));
        mat.setParameter('frameSize', new Float32Array([1, 1]));
        return mat;
    }

    public static createDepthPostProcessMaterial(app: pc.Application): pc.Material {
        const mat = this.createMaterialFromShaders(app, DepthPostProcessShader.vertexShader, DepthPostProcessShader.fragmentShader);
        // Defaults
        const device = app.graphicsDevice;
        mat.setParameter('uScreenSize', new Float32Array([device.width, device.height]));
        mat.setParameter('uInvScreenSize', new Float32Array([1 / Math.max(1, device.width), 1 / Math.max(1, device.height)]));
        mat.setParameter('uNearClip', 0.1);
        mat.setParameter('uFarClip', 1000.0);
        mat.setParameter('uFocusDistance', 15.0);
        mat.setParameter('uFocusRange', 5.0);
        mat.setParameter('uBokehRadius', 1.5);
        mat.setParameter('uBokehIntensity', 0.8);
        mat.setParameter('uFogColor', new Float32Array([0.7, 0.8, 0.9]));
        mat.setParameter('uFogDensity', 0.0);
        mat.setParameter('uFogStart', 10.0);
        mat.setParameter('uFogEnd', 50.0);
        mat.setParameter('uAtmosphericPerspective', 0.0);
        mat.setParameter('uAtmosphereColor', new Float32Array([0.7, 0.8, 0.9]));
        mat.setParameter('uHeatHaze', 0.0);
        mat.setParameter('uColorSeparation', 0.0);
        mat.setParameter('uScreenShake', 0.0);
        mat.setParameter('uScreenShakeOffset', new Float32Array([0, 0]));
        mat.setParameter('uTimeScale', 1.0);
        mat.setParameter('uTime', 0.0);
        return mat;
    }

    public static createStageStormySkyMaterial(app: pc.Application): pc.Material {
        const mat = this.createMaterialFromShaders(app, StageStormySkyShader.vertexShader, StageStormySkyShader.fragmentShader);
        mat.setParameter('uScrollSpeed', new Float32Array([0.01, 0.002]));
        mat.setParameter('uTime', 0.0);
        mat.setParameter('uTint', new Float32Array([0.6, 0.7, 0.8, 1.0]));
        return mat;
    }
}

