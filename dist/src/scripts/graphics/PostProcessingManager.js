/**
 * PostProcessingManager - HD-2D Post-Processing Effects
 * Implements Octopath Traveler style post-processing: depth-of-field, bloom, color grading
 * Features: Real-time DOF, volumetric lighting, cinematic color grading
 */
import * as pc from 'playcanvas';
class PostProcessingManager {
    constructor(app) {
        Object.defineProperty(this, "app", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "initialized", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        // Post-processing configuration
        Object.defineProperty(this, "effects", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                depthOfField: {
                    enabled: true,
                    focusDistance: 15.0,
                    focusRange: 5.0,
                    blurRadius: 1.5,
                    maxBlur: 2.0,
                    bokehIntensity: 0.8,
                    adaptiveFocus: true
                },
                bloom: {
                    enabled: true,
                    threshold: 0.7,
                    intensity: 0.9,
                    radius: 0.8,
                    passes: 3,
                    quality: 'high'
                },
                colorGrading: {
                    enabled: true,
                    contrast: 1.1,
                    saturation: 1.15,
                    brightness: 0.05,
                    warmth: 0.1,
                    vignette: 0.3,
                    filmGrain: 0.15
                },
                lightingEffects: {
                    enabled: true,
                    volumetricFog: true,
                    lightShafts: true,
                    screenSpaceReflections: false,
                    ambientOcclusion: true
                },
                fightingGameEffects: {
                    enabled: true,
                    hitPause: false,
                    screenShake: { intensity: 0, duration: 0, decay: 0, frequency: 0, active: false },
                    flashEffect: { color: new pc.Color(1, 1, 1), intensity: 0, duration: 0, active: false },
                    slowMotion: { factor: 1.0, duration: 0, active: false },
                    dramaTicLighting: false
                }
            }
        });
        // Render targets for multi-pass rendering
        Object.defineProperty(this, "renderTargets", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                sceneColor: null,
                sceneDepth: null,
                blurHorizontal: null,
                blurVertical: null,
                bloom: null,
                final: null
            }
        });
        // Post-processing materials/shaders
        Object.defineProperty(this, "materials", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                depthOfField: null,
                bloom: null,
                colorGrading: null,
                combine: null,
                blur: null
            }
        });
        // Effect cameras for multi-pass rendering
        Object.defineProperty(this, "cameras", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                postProcess: null,
                depth: null
            }
        });
        // Performance settings
        Object.defineProperty(this, "quality", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'ultra'
        }); // ultra, high, medium, low
        Object.defineProperty(this, "resolution", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                scale: 1.0,
                minScale: 0.5,
                maxScale: 1.0
            }
        });
        // Entities
        Object.defineProperty(this, "fullScreenQuad", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.app = app;
    }
    async initialize() {
        console.log('Initializing Post-Processing Manager...');
        try {
            // Create render targets
            this.createRenderTargets();
            // Create post-processing materials
            await this.createPostProcessingMaterials();
            // Setup post-processing cameras
            this.setupPostProcessingCameras();
            // Create effect entities
            this.createEffectEntities();
            // Setup render pipeline
            this.setupRenderPipeline();
            this.initialized = true;
            console.log('Post-Processing Manager initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize Post-Processing Manager:', error);
            throw error;
        }
    }
    createRenderTargets() {
        const device = this.app.graphicsDevice;
        const width = Math.floor(device.width * this.resolution.scale);
        const height = Math.floor(device.height * this.resolution.scale);
        // Main scene color buffer
        this.renderTargets.sceneColor = new pc.RenderTarget({
            colorBuffer: new pc.Texture(device, {
                width: width,
                height: height,
                format: pc.PIXELFORMAT_R8_G8_B8_A8,
                mipmaps: false,
                addressU: pc.ADDRESS_CLAMP_TO_EDGE,
                addressV: pc.ADDRESS_CLAMP_TO_EDGE,
                magFilter: pc.FILTER_LINEAR,
                minFilter: pc.FILTER_LINEAR
            }),
            depthBuffer: true,
            samples: this.quality === 'ultra' ? 4 : 1
        });
        // Depth buffer for DOF
        this.renderTargets.sceneDepth = new pc.RenderTarget({
            colorBuffer: new pc.Texture(device, {
                width: width,
                height: height,
                format: pc.PIXELFORMAT_R8_G8_B8_A8,
                mipmaps: false,
                addressU: pc.ADDRESS_CLAMP_TO_EDGE,
                addressV: pc.ADDRESS_CLAMP_TO_EDGE,
                magFilter: pc.FILTER_LINEAR,
                minFilter: pc.FILTER_LINEAR
            }),
            depthBuffer: false
        });
        // Blur targets (half resolution for performance)
        const blurWidth = Math.floor(width * 0.5);
        const blurHeight = Math.floor(height * 0.5);
        this.renderTargets.blurHorizontal = new pc.RenderTarget({
            colorBuffer: new pc.Texture(device, {
                width: blurWidth,
                height: blurHeight,
                format: pc.PIXELFORMAT_R8_G8_B8_A8,
                mipmaps: false,
                addressU: pc.ADDRESS_CLAMP_TO_EDGE,
                addressV: pc.ADDRESS_CLAMP_TO_EDGE,
                magFilter: pc.FILTER_LINEAR,
                minFilter: pc.FILTER_LINEAR
            }),
            depthBuffer: false
        });
        this.renderTargets.blurVertical = new pc.RenderTarget({
            colorBuffer: new pc.Texture(device, {
                width: blurWidth,
                height: blurHeight,
                format: pc.PIXELFORMAT_R8_G8_B8_A8,
                mipmaps: false,
                addressU: pc.ADDRESS_CLAMP_TO_EDGE,
                addressV: pc.ADDRESS_CLAMP_TO_EDGE,
                magFilter: pc.FILTER_LINEAR,
                minFilter: pc.FILTER_LINEAR
            }),
            depthBuffer: false
        });
        // Bloom target
        this.renderTargets.bloom = new pc.RenderTarget({
            colorBuffer: new pc.Texture(device, {
                width: blurWidth,
                height: blurHeight,
                format: pc.PIXELFORMAT_R8_G8_B8_A8,
                mipmaps: false,
                addressU: pc.ADDRESS_CLAMP_TO_EDGE,
                addressV: pc.ADDRESS_CLAMP_TO_EDGE,
                magFilter: pc.FILTER_LINEAR,
                minFilter: pc.FILTER_LINEAR
            }),
            depthBuffer: false
        });
        console.log('Post-processing render targets created');
    }
    async createPostProcessingMaterials() {
        // Depth of Field material
        this.materials.depthOfField = new pc.StandardMaterial();
        this.materials.depthOfField.chunks.PS_LIGHTING = this.getDOFFragmentShader();
        this.materials.depthOfField.blendType = pc.BLEND_NONE;
        this.materials.depthOfField.depthTest = false;
        this.materials.depthOfField.depthWrite = false;
        // Bloom material
        this.materials.bloom = new pc.StandardMaterial();
        this.materials.bloom.chunks.PS_LIGHTING = this.getBloomFragmentShader();
        this.materials.bloom.blendType = pc.BLEND_ADDITIVE;
        this.materials.bloom.depthTest = false;
        this.materials.bloom.depthWrite = false;
        // Blur material
        this.materials.blur = new pc.StandardMaterial();
        this.materials.blur.chunks.PS_LIGHTING = this.getBlurFragmentShader();
        this.materials.blur.blendType = pc.BLEND_NONE;
        this.materials.blur.depthTest = false;
        this.materials.blur.depthWrite = false;
        // Color grading material
        this.materials.colorGrading = new pc.StandardMaterial();
        this.materials.colorGrading.chunks.PS_LIGHTING = this.getColorGradingFragmentShader();
        this.materials.colorGrading.blendType = pc.BLEND_NONE;
        this.materials.colorGrading.depthTest = false;
        this.materials.colorGrading.depthWrite = false;
        // Final combine material
        this.materials.combine = new pc.StandardMaterial();
        this.materials.combine.chunks.PS_LIGHTING = this.getCombineFragmentShader();
        this.materials.combine.blendType = pc.BLEND_NONE;
        this.materials.combine.depthTest = false;
        this.materials.combine.depthWrite = false;
        console.log('Post-processing materials created');
    }
    getDOFFragmentShader() {
        return `
        uniform sampler2D texture_sceneColor;
        uniform sampler2D texture_sceneDepth;
        uniform vec2 uScreenSize;
        uniform float uFocusDistance;
        uniform float uFocusRange;
        uniform float uMaxBlur;
        
        varying vec2 vUv0;
        
        void main() {
            vec2 uv = vUv0;
            vec4 sceneColor = texture2D(texture_sceneColor, uv);
            float depth = texture2D(texture_sceneDepth, uv).r;
            
            // Calculate blur amount based on distance from focus
            float focusBlur = abs(depth - uFocusDistance) / uFocusRange;
            focusBlur = clamp(focusBlur, 0.0, 1.0) * uMaxBlur;
            
            // Simple box blur (would be replaced with proper DOF in production)
            vec3 color = sceneColor.rgb;
            if (focusBlur > 0.1) {
                vec3 blurColor = vec3(0.0);
                float samples = 0.0;
                
                for (int x = -2; x <= 2; x++) {
                    for (int y = -2; y <= 2; y++) {
                        vec2 offset = vec2(float(x), float(y)) * focusBlur / uScreenSize;
                        blurColor += texture2D(texture_sceneColor, uv + offset).rgb;
                        samples += 1.0;
                    }
                }
                
                color = mix(color, blurColor / samples, focusBlur);
            }
            
            gl_FragColor = vec4(color, sceneColor.a);
        }`;
    }
    getBloomFragmentShader() {
        return `
        uniform sampler2D texture_sceneColor;
        uniform float uBloomThreshold;
        uniform float uBloomIntensity;
        
        varying vec2 vUv0;
        
        void main() {
            vec4 color = texture2D(texture_sceneColor, vUv0);
            
            // Extract bright areas
            float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
            float bloomAmount = max(luminance - uBloomThreshold, 0.0);
            bloomAmount *= uBloomIntensity;
            
            gl_FragColor = vec4(color.rgb * bloomAmount, color.a);
        }`;
    }
    getBlurFragmentShader() {
        return `
        uniform sampler2D texture_source;
        uniform vec2 uBlurDirection;
        uniform vec2 uScreenSize;
        
        varying vec2 vUv0;
        
        void main() {
            vec2 texelSize = 1.0 / uScreenSize;
            vec3 color = vec3(0.0);
            
            // 9-tap Gaussian blur
            color += texture2D(texture_source, vUv0 - 4.0 * uBlurDirection * texelSize).rgb * 0.05;
            color += texture2D(texture_source, vUv0 - 3.0 * uBlurDirection * texelSize).rgb * 0.09;
            color += texture2D(texture_source, vUv0 - 2.0 * uBlurDirection * texelSize).rgb * 0.12;
            color += texture2D(texture_source, vUv0 - 1.0 * uBlurDirection * texelSize).rgb * 0.15;
            color += texture2D(texture_source, vUv0).rgb * 0.18;
            color += texture2D(texture_source, vUv0 + 1.0 * uBlurDirection * texelSize).rgb * 0.15;
            color += texture2D(texture_source, vUv0 + 2.0 * uBlurDirection * texelSize).rgb * 0.12;
            color += texture2D(texture_source, vUv0 + 3.0 * uBlurDirection * texelSize).rgb * 0.09;
            color += texture2D(texture_source, vUv0 + 4.0 * uBlurDirection * texelSize).rgb * 0.05;
            
            gl_FragColor = vec4(color, 1.0);
        }`;
    }
    getColorGradingFragmentShader() {
        return `
        uniform sampler2D texture_sceneColor;
        uniform float uContrast;
        uniform float uSaturation;
        uniform float uBrightness;
        uniform float uWarmth;
        uniform float uVignette;
        uniform float uFilmGrain;
        uniform float uTime;
        
        varying vec2 vUv0;
        
        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }
        
        void main() {
            vec2 uv = vUv0;
            vec4 color = texture2D(texture_sceneColor, uv);
            
            // Brightness
            color.rgb += uBrightness;
            
            // Contrast
            color.rgb = (color.rgb - 0.5) * uContrast + 0.5;
            
            // Saturation
            float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
            color.rgb = mix(vec3(luminance), color.rgb, uSaturation);
            
            // Warmth (blue/orange tint)
            color.rgb = mix(color.rgb, color.rgb * vec3(1.0 + uWarmth, 1.0, 1.0 - uWarmth), abs(uWarmth));
            
            // Vignette
            if (uVignette > 0.0) {
                float dist = distance(uv, vec2(0.5));
                float vignetteFactor = 1.0 - smoothstep(0.3, 0.8, dist * uVignette);
                color.rgb *= vignetteFactor;
            }
            
            // Film grain
            if (uFilmGrain > 0.0) {
                float noise = random(uv + uTime) * 2.0 - 1.0;
                color.rgb += noise * uFilmGrain * 0.1;
            }
            
            gl_FragColor = vec4(color.rgb, color.a);
        }`;
    }
    getCombineFragmentShader() {
        return `
        uniform sampler2D texture_sceneColor;
        uniform sampler2D texture_bloom;
        uniform float uBloomIntensity;
        uniform vec3 uFlashColor;
        uniform float uFlashIntensity;
        
        varying vec2 vUv0;
        
        void main() {
            vec4 sceneColor = texture2D(texture_sceneColor, vUv0);
            vec4 bloomColor = texture2D(texture_bloom, vUv0);
            
            // Combine scene and bloom
            vec3 finalColor = sceneColor.rgb + bloomColor.rgb * uBloomIntensity;
            
            // Apply flash effect (for hit effects)
            if (uFlashIntensity > 0.0) {
                finalColor = mix(finalColor, uFlashColor, uFlashIntensity);
            }
            
            gl_FragColor = vec4(finalColor, sceneColor.a);
        }`;
    }
    setupPostProcessingCameras() {
        // Post-processing camera (orthographic, full screen)
        this.cameras.postProcess = new pc.Entity('PostProcessCamera');
        this.cameras.postProcess.addComponent('camera', {
            clearColor: new pc.Color(0, 0, 0, 0),
            projection: pc.PROJECTION_ORTHOGRAPHIC,
            orthoHeight: 1,
            nearClip: 0,
            farClip: 1,
            priority: 100,
            enabled: false
        });
        this.app.root.addChild(this.cameras.postProcess);
    }
    createEffectEntities() {
        // Full-screen quad for post-processing
        this.fullScreenQuad = new pc.Entity('FullScreenQuad');
        this.fullScreenQuad.addComponent('render', {
            type: 'plane'
        });
        this.fullScreenQuad.setLocalScale(2, 2, 1);
        this.fullScreenQuad.setPosition(0, 0, 0.5);
        this.app.root.addChild(this.fullScreenQuad);
    }
    setupRenderPipeline() {
        // Hook into the main camera's render pipeline
        const mainCamera = this.app.root.findByName('MainCamera');
        if (mainCamera && mainCamera.camera) {
            // Set main camera to render to our scene color target
            mainCamera.camera.renderTarget = this.renderTargets.sceneColor;
        }
        console.log('Post-processing render pipeline configured');
    }
    // Public API methods
    setDepthOfField(focusDistance, focusRange, blurRadius) {
        this.effects.depthOfField.focusDistance = focusDistance;
        this.effects.depthOfField.focusRange = focusRange;
        this.effects.depthOfField.blurRadius = blurRadius;
    }
    setBloom(threshold, intensity, radius) {
        this.effects.bloom.threshold = threshold;
        this.effects.bloom.intensity = intensity;
        this.effects.bloom.radius = radius;
    }
    setColorGrading(contrast, saturation, brightness, warmth) {
        this.effects.colorGrading.contrast = contrast;
        this.effects.colorGrading.saturation = saturation;
        this.effects.colorGrading.brightness = brightness;
        this.effects.colorGrading.warmth = warmth;
    }
    // Fighting game specific effects
    triggerHitFlash(color = [1, 1, 1], intensity = 0.8, duration = 100) {
        this.effects.fightingGameEffects.flashEffect.color = new pc.Color(color[0], color[1], color[2]);
        this.effects.fightingGameEffects.flashEffect.intensity = intensity;
        this.effects.fightingGameEffects.flashEffect.duration = duration;
        this.effects.fightingGameEffects.flashEffect.active = true;
        // Fade out flash over duration
        const startTime = Date.now();
        const fadeFlash = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            if (progress < 1) {
                this.effects.fightingGameEffects.flashEffect.intensity = intensity * (1 - progress);
                requestAnimationFrame(fadeFlash);
            }
            else {
                this.effects.fightingGameEffects.flashEffect.intensity = 0;
                this.effects.fightingGameEffects.flashEffect.active = false;
            }
        };
        fadeFlash();
    }
    triggerScreenShake(intensity = 1.0, duration = 300) {
        this.effects.fightingGameEffects.screenShake.intensity = intensity;
        this.effects.fightingGameEffects.screenShake.duration = duration;
        this.effects.fightingGameEffects.screenShake.active = true;
        const startTime = Date.now();
        const mainCamera = this.app.root.findByName('MainCamera');
        const originalPos = mainCamera.getPosition().clone();
        const shakeCamera = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            if (progress < 1) {
                const currentIntensity = intensity * (1 - progress);
                const shakeX = (Math.random() - 0.5) * currentIntensity * 0.5;
                const shakeY = (Math.random() - 0.5) * currentIntensity * 0.3;
                mainCamera.setPosition(originalPos.x + shakeX, originalPos.y + shakeY, originalPos.z);
                requestAnimationFrame(shakeCamera);
            }
            else {
                mainCamera.setPosition(originalPos);
                this.effects.fightingGameEffects.screenShake.intensity = 0;
                this.effects.fightingGameEffects.screenShake.active = false;
            }
        };
        shakeCamera();
    }
    triggerSlowMotion(factor = 0.3, duration = 1000) {
        this.effects.fightingGameEffects.slowMotion.factor = factor;
        this.effects.fightingGameEffects.slowMotion.duration = duration;
        this.effects.fightingGameEffects.slowMotion.active = true;
        this.app.timeScale = factor;
        setTimeout(() => {
            this.effects.fightingGameEffects.slowMotion.factor = 1.0;
            this.effects.fightingGameEffects.slowMotion.active = false;
            this.app.timeScale = 1.0;
        }, duration);
    }
    setDramaticLighting(enabled) {
        this.effects.fightingGameEffects.dramaTicLighting = enabled;
        // Adjust post-processing for dramatic effect
        if (enabled) {
            this.setColorGrading(1.3, 1.4, 0.1, 0.2);
            this.setBloom(0.5, 1.2, 1.0);
        }
        else {
            // Reset to normal values
            this.setColorGrading(1.1, 1.15, 0.05, 0.1);
            this.setBloom(0.7, 0.9, 0.8);
        }
    }
    // Update loop
    update(dt) {
        if (!this.initialized)
            return;
        this.updateEffectParameters(dt);
        this.renderPostProcessing(dt);
    }
    updateEffectParameters(dt) {
        // Update material parameters
        if (this.materials.depthOfField) {
            this.materials.depthOfField.setParameter('uFocusDistance', this.effects.depthOfField.focusDistance);
            this.materials.depthOfField.setParameter('uFocusRange', this.effects.depthOfField.focusRange);
            this.materials.depthOfField.setParameter('uMaxBlur', this.effects.depthOfField.maxBlur);
        }
        if (this.materials.bloom) {
            this.materials.bloom.setParameter('uBloomThreshold', this.effects.bloom.threshold);
            this.materials.bloom.setParameter('uBloomIntensity', this.effects.bloom.intensity);
        }
        if (this.materials.colorGrading) {
            this.materials.colorGrading.setParameter('uContrast', this.effects.colorGrading.contrast);
            this.materials.colorGrading.setParameter('uSaturation', this.effects.colorGrading.saturation);
            this.materials.colorGrading.setParameter('uBrightness', this.effects.colorGrading.brightness);
            this.materials.colorGrading.setParameter('uWarmth', this.effects.colorGrading.warmth);
            this.materials.colorGrading.setParameter('uVignette', this.effects.colorGrading.vignette);
            this.materials.colorGrading.setParameter('uFilmGrain', this.effects.colorGrading.filmGrain);
            this.materials.colorGrading.setParameter('uTime', Date.now() * 0.001);
        }
        if (this.materials.combine) {
            this.materials.combine.setParameter('uBloomIntensity', this.effects.bloom.intensity);
            this.materials.combine.setParameter('uFlashColor', [
                this.effects.fightingGameEffects.flashEffect.color.r,
                this.effects.fightingGameEffects.flashEffect.color.g,
                this.effects.fightingGameEffects.flashEffect.color.b
            ]);
            this.materials.combine.setParameter('uFlashIntensity', this.effects.fightingGameEffects.flashEffect.intensity);
        }
    }
    renderPostProcessing(dt) {
        // Multi-pass post-processing would be implemented here
        // For now, we'll just update the parameters
        // In a full implementation, this would render each effect pass
    }
    // Quality management
    setQuality(quality) {
        this.quality = quality;
        const qualitySettings = {
            low: { scale: 0.5, bloom: false, dof: false },
            medium: { scale: 0.75, bloom: true, dof: false },
            high: { scale: 1.0, bloom: true, dof: true },
            ultra: { scale: 1.0, bloom: true, dof: true }
        };
        const settings = qualitySettings[quality];
        this.resolution.scale = settings.scale;
        this.effects.bloom.enabled = settings.bloom;
        this.effects.depthOfField.enabled = settings.dof;
        // Recreate render targets with new resolution
        this.createRenderTargets();
        console.log(`Post-processing quality set to: ${quality}`);
    }
    destroy() {
        // Clean up resources
        if (this.fullScreenQuad) {
            this.fullScreenQuad.destroy();
        }
        // Clean up render targets
        Object.values(this.renderTargets).forEach(target => {
            if (target) {
                target.destroy();
            }
        });
        // Clean up cameras
        Object.values(this.cameras).forEach(camera => {
            if (camera) {
                camera.destroy();
            }
        });
        console.log('PostProcessingManager destroyed');
    }
}
export default PostProcessingManager;
//# sourceMappingURL=PostProcessingManager.js.map