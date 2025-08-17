/**
 * HD2DRenderer - Octopath Traveler Style HD-2D Rendering System
 * Combines 2D sprites with 3D depth, lighting, and post-processing effects
 * Features: Multi-layer parallax, dynamic lighting, depth-of-field, sprite billboarding
 */
class HD2DRenderer {
    constructor(app) {
        this.app = app;
        this.initialized = false;
        
        // HD-2D Configuration (based on Octopath Traveler techniques)
        this.hd2dConfig = {
            // Depth layer configuration
            depthLayers: {
                background: { z: -50, parallaxSpeed: 0.1, blur: 0.8 },
                midground: { z: -25, parallaxSpeed: 0.3, blur: 0.4 },
                playground: { z: -10, parallaxSpeed: 0.6, blur: 0.2 },
                foreground: { z: -5, parallaxSpeed: 0.8, blur: 0.1 },
                characters: { z: 0, parallaxSpeed: 1.0, blur: 0.0 },
                effects: { z: 5, parallaxSpeed: 1.2, blur: 0.0 },
                ui: { z: 10, parallaxSpeed: 0.0, blur: 0.0 }
            },
            
            // Camera configuration for HD-2D effect
            camera: {
                tiltAngle: 8, // Slight tilt for depth perception
                heightOffset: 2, // Camera height for perspective
                followSmoothing: 0.1,
                fov: 45,
                depthOfField: true
            },
            
            // Lighting configuration
            lighting: {
                dynamicLights: true,
                softShadows: true,
                lightShafts: true,
                volumetricFog: true,
                rimLighting: true
            },
            
            // Sprite rendering
            sprites: {
                billboarding: true,
                pixelPerfect: true,
                filterMode: 'nearest', // Pixel art preservation
                normalMaps: true,
                heightMaps: false
            }
        };
        
        // Render layers for depth sorting
        this.renderLayers = new Map();
        
        // Camera system for HD-2D effects
        this.cameraSystem = {
            mainCamera: null,
            depthCamera: null,
            focusTarget: null,
            tiltMatrix: new pc.Mat4(),
            followPosition: new pc.Vec3(),
            targetPosition: new pc.Vec3()
        };
        
        // Multi-layer rendering setup
        this.layerSystem = {
            layers: new Map(),
            renderTargets: new Map(),
            layerCameras: new Map()
        };
        
        // Dynamic lighting system for HD-2D
        this.lightingSystem = {
            keyLights: [],
            fillLights: [],
            rimLights: [],
            environmentLights: [],
            lightShafts: [],
            lightingIntensity: 1.0
        };
        
        // Post-processing effects
        this.postEffects = {
            depthOfField: null,
            bloom: null,
            colorGrading: null,
            vignette: null,
            filmGrain: null
        };
        
        // Sprite management for billboarding
        this.spriteSystem = {
            billboardSprites: new Map(),
            staticSprites: new Map(),
            animatedSprites: new Map()
        };
    }

    async initialize() {
        console.log('Initializing HD-2D Renderer...');
        
        try {
            // Setup multi-layer rendering system
            this.setupRenderLayers();
            
            // Create HD-2D camera system
            this.setupHD2DCamera();
            
            // Initialize dynamic lighting
            this.setupDynamicLighting();
            
            // Setup sprite billboarding system
            this.setupSpriteBillboarding();
            
            // Create post-processing pipeline
            await this.setupPostProcessing();
            
            // Initialize parallax system
            this.setupParallaxSystem();
            
            this.initialized = true;
            console.log('HD-2D Renderer initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize HD-2D Renderer:', error);
            throw error;
        }
    }

    setupRenderLayers() {
        // Create render layers for depth-based rendering
        Object.entries(this.hd2dConfig.depthLayers).forEach(([name, config]) => {
            const layer = this.app.scene.layers.getLayerByName(name) || new pc.Layer({
                name: name,
                clearColorBuffer: name === 'background',
                clearDepthBuffer: name === 'background',
                clearStencilBuffer: false
            });
            
            // Set layer properties based on depth configuration
            layer.renderTarget = this.createLayerRenderTarget(name, config);
            
            this.renderLayers.set(name, layer);
            this.layerSystem.layers.set(name, {
                layer: layer,
                config: config,
                entities: []
            });
            
            if (!this.app.scene.layers.getLayerByName(name)) {
                this.app.scene.layers.push(layer);
            }
        });
        
        console.log('HD-2D render layers created:', this.renderLayers.size);
    }

    createLayerRenderTarget(layerName, config) {
        // Create render target for layer-based rendering
        const renderTarget = new pc.RenderTarget({
            colorBuffer: new pc.Texture(this.app.graphicsDevice, {
                width: 1920,
                height: 1080,
                format: pc.PIXELFORMAT_R8_G8_B8_A8,
                mipmaps: false,
                addressU: pc.ADDRESS_CLAMP_TO_EDGE,
                addressV: pc.ADDRESS_CLAMP_TO_EDGE,
                magFilter: pc.FILTER_LINEAR,
                minFilter: pc.FILTER_LINEAR
            }),
            depthBuffer: true,
            samples: 4 // MSAA for smooth edges
        });
        
        this.layerSystem.renderTargets.set(layerName, renderTarget);
        return renderTarget;
    }

    setupHD2DCamera() {
        // Main camera with HD-2D perspective
        this.cameraSystem.mainCamera = this.app.root.findByName('MainCamera');
        
        if (this.cameraSystem.mainCamera) {
            // Configure camera for HD-2D effect
            this.cameraSystem.mainCamera.camera.projection = pc.PROJECTION_PERSPECTIVE;
            this.cameraSystem.mainCamera.camera.fov = this.hd2dConfig.camera.fov;
            this.cameraSystem.mainCamera.camera.nearClip = 0.1;
            this.cameraSystem.mainCamera.camera.farClip = 100;
            
            // Apply slight tilt for depth perception
            this.applyCameraTilt();
            
            // Position camera for fighting game view with HD-2D depth
            this.cameraSystem.mainCamera.setPosition(0, this.hd2dConfig.camera.heightOffset, 15);
            this.cameraSystem.mainCamera.lookAt(0, 0, 0);
        }
        
        // Create depth camera for depth-of-field effects
        this.createDepthCamera();
        
        console.log('HD-2D camera system configured');
    }

    applyCameraTilt() {
        const tiltRadians = this.hd2dConfig.camera.tiltAngle * pc.math.DEG_TO_RAD;
        this.cameraSystem.tiltMatrix.setFromAxisAngle(pc.Vec3.RIGHT, tiltRadians);
        
        // Apply tilt to camera transform
        const currentRotation = this.cameraSystem.mainCamera.getRotation();
        const tiltRotation = new pc.Quat().setFromMat4(this.cameraSystem.tiltMatrix);
        const finalRotation = new pc.Quat().mul2(currentRotation, tiltRotation);
        
        this.cameraSystem.mainCamera.setRotation(finalRotation);
    }

    createDepthCamera() {
        this.cameraSystem.depthCamera = new pc.Entity('DepthCamera');
        this.cameraSystem.depthCamera.addComponent('camera', {
            clearColor: new pc.Color(1, 1, 1, 1),
            projection: pc.PROJECTION_PERSPECTIVE,
            fov: this.hd2dConfig.camera.fov,
            nearClip: 0.1,
            farClip: 100
        });
        
        // Match main camera position and orientation
        this.cameraSystem.depthCamera.setPosition(this.cameraSystem.mainCamera.getPosition());
        this.cameraSystem.depthCamera.setRotation(this.cameraSystem.mainCamera.getRotation());
        
        this.app.root.addChild(this.cameraSystem.depthCamera);
    }

    setupDynamicLighting() {
        // Key light setup with soft shadows
        this.createKeyLight();
        
        // Fill lights for character separation
        this.createFillLights();
        
        // Rim lighting for HD-2D depth effect
        this.createRimLighting();
        
        // Environment lighting
        this.createEnvironmentLighting();
        
        // Light shafts for atmospheric effect
        if (this.hd2dConfig.lighting.lightShafts) {
            this.createLightShafts();
        }
        
        console.log('HD-2D dynamic lighting setup complete');
    }

    createKeyLight() {
        const keyLight = new pc.Entity('HD2D_KeyLight');
        keyLight.addComponent('light', {
            type: pc.LIGHTTYPE_DIRECTIONAL,
            color: new pc.Color(1.0, 0.95, 0.85), // Warm white
            intensity: 1.8,
            castShadows: this.hd2dConfig.lighting.softShadows,
            shadowBias: 0.0005,
            shadowDistance: 40,
            shadowResolution: 2048,
            shadowType: pc.SHADOW_PCF5 // Soft shadows
        });
        
        keyLight.setEulerAngles(45, -30, 0);
        this.lightingSystem.keyLights.push(keyLight);
        this.app.root.addChild(keyLight);
    }

    createFillLights() {
        // Multiple fill lights for even character illumination
        const fillPositions = [
            { pos: [-10, 5, 10], color: [0.8, 0.9, 1.0], intensity: 0.6 },
            { pos: [10, 5, 10], color: [1.0, 0.9, 0.8], intensity: 0.6 },
            { pos: [0, -2, 8], color: [0.9, 0.95, 1.0], intensity: 0.4 }
        ];
        
        fillPositions.forEach((fillData, index) => {
            const fillLight = new pc.Entity(`HD2D_FillLight_${index}`);
            fillLight.addComponent('light', {
                type: pc.LIGHTTYPE_OMNI,
                color: new pc.Color(...fillData.color),
                intensity: fillData.intensity,
                range: 25,
                castShadows: false
            });
            
            fillLight.setPosition(...fillData.pos);
            this.lightingSystem.fillLights.push(fillLight);
            this.app.root.addChild(fillLight);
        });
    }

    createRimLighting() {
        if (!this.hd2dConfig.lighting.rimLighting) return;
        
        const rimLight = new pc.Entity('HD2D_RimLight');
        rimLight.addComponent('light', {
            type: pc.LIGHTTYPE_DIRECTIONAL,
            color: new pc.Color(0.6, 0.8, 1.0), // Cool blue
            intensity: 1.2,
            castShadows: false
        });
        
        rimLight.setEulerAngles(-45, 150, 0); // Behind and above
        this.lightingSystem.rimLights.push(rimLight);
        this.app.root.addChild(rimLight);
    }

    createEnvironmentLighting() {
        // Ambient environment light
        const envLight = new pc.Entity('HD2D_EnvironmentLight');
        envLight.addComponent('light', {
            type: pc.LIGHTTYPE_DIRECTIONAL,
            color: new pc.Color(0.4, 0.5, 0.7), // Cool ambient
            intensity: 0.8,
            castShadows: false
        });
        
        envLight.setEulerAngles(60, 0, 0);
        this.lightingSystem.environmentLights.push(envLight);
        this.app.root.addChild(envLight);
    }

    createLightShafts() {
        // Volumetric light shafts for atmospheric depth
        for (let i = 0; i < 3; i++) {
            const lightShaft = new pc.Entity(`HD2D_LightShaft_${i}`);
            lightShaft.addComponent('light', {
                type: pc.LIGHTTYPE_SPOT,
                color: new pc.Color(1.0, 0.95, 0.8),
                intensity: 0.5,
                range: 30,
                innerConeAngle: 25,
                outerConeAngle: 45,
                castShadows: true
            });
            
            lightShaft.setPosition(-15 + i * 15, 20, -10);
            lightShaft.lookAt(0, 0, 0);
            this.lightingSystem.lightShafts.push(lightShaft);
            this.app.root.addChild(lightShaft);
        }
    }

    setupSpriteBillboarding() {
        // Configure sprite billboarding for 2D characters in 3D space
        this.spriteBillboardSystem = {
            enabled: this.hd2dConfig.sprites.billboarding,
            sprites: new Map(),
            updateFrequency: 60 // Updates per second
        };
        
        console.log('Sprite billboarding system configured');
    }

    async setupPostProcessing() {
        // Setup post-processing effects for HD-2D look
        if (this.hd2dConfig.camera.depthOfField) {
            await this.createDepthOfFieldEffect();
        }
        
        await this.createBloomEffect();
        await this.createColorGradingEffect();
        await this.createVignetteEffect();
        
        console.log('HD-2D post-processing pipeline created');
    }

    async createDepthOfFieldEffect() {
        // Depth-of-field for HD-2D depth perception
        this.postEffects.depthOfField = {
            enabled: true,
            focusDistance: 15,
            blurAmount: 0.8,
            aperture: 0.1,
            maxBlur: 1.0
        };
    }

    async createBloomEffect() {
        // Bloom effect for dramatic lighting
        this.postEffects.bloom = {
            enabled: true,
            intensity: 0.8,
            threshold: 0.7,
            radius: 0.8
        };
    }

    async createColorGradingEffect() {
        // Color grading for cinematic look
        this.postEffects.colorGrading = {
            enabled: true,
            contrast: 1.1,
            saturation: 1.15,
            brightness: 0.05,
            warmth: 0.1
        };
    }

    async createVignetteEffect() {
        // Subtle vignette for focus
        this.postEffects.vignette = {
            enabled: true,
            intensity: 0.3,
            smoothness: 0.8
        };
    }

    setupParallaxSystem() {
        // Initialize parallax system for multi-layer backgrounds
        this.parallaxSystem = {
            enabled: true,
            layers: new Map(),
            cameraBasePosition: new pc.Vec3(),
            parallaxStrength: 1.0
        };
        
        // Setup parallax layers based on depth configuration
        Object.entries(this.hd2dConfig.depthLayers).forEach(([name, config]) => {
            this.parallaxSystem.layers.set(name, {
                speed: config.parallaxSpeed,
                entities: [],
                basePositions: new Map()
            });
        });
        
        console.log('Parallax system initialized');
    }

    // Public API methods
    addEntityToLayer(entity, layerName) {
        const layerData = this.layerSystem.layers.get(layerName);
        if (!layerData) {
            console.warn(`Layer ${layerName} not found`);
            return;
        }
        
        // Add entity to appropriate render layer
        const layer = layerData.layer;
        if (entity.render) {
            entity.render.layers = [layer.id];
        }
        
        // Add to layer entity list
        layerData.entities.push(entity);
        
        // Configure entity based on layer settings
        this.configureEntityForLayer(entity, layerData.config);
        
        // Add to parallax system if applicable
        if (layerData.config.parallaxSpeed !== 1.0) {
            this.addEntityToParallax(entity, layerName);
        }
    }

    configureEntityForLayer(entity, layerConfig) {
        // Set depth position
        const currentPos = entity.getPosition();
        entity.setPosition(currentPos.x, currentPos.y, layerConfig.z);
        
        // Apply blur effect based on layer depth
        if (layerConfig.blur > 0 && entity.render && entity.render.material) {
            // This would require custom shader modification
            entity.render.material.setParameter('blurAmount', layerConfig.blur);
        }
    }

    addEntityToParallax(entity, layerName) {
        const parallaxLayer = this.parallaxSystem.layers.get(layerName);
        if (!parallaxLayer) return;
        
        parallaxLayer.entities.push(entity);
        parallaxLayer.basePositions.set(entity.getGuid(), entity.getPosition().clone());
    }

    createBillboardSprite(texture, position, size = new pc.Vec2(2, 2)) {
        const sprite = new pc.Entity('BillboardSprite');
        
        // Create billboard material
        const material = new pc.StandardMaterial();
        material.diffuseMap = texture;
        material.transparent = true;
        material.alphaTest = 0.1;
        material.cull = pc.CULLFACE_NONE;
        
        // Add render component
        sprite.addComponent('render', {
            type: 'plane',
            material: material
        });
        
        sprite.setPosition(position);
        sprite.setLocalScale(size.x, size.y, 1);
        
        // Add to billboard system
        this.spriteBillboardSystem.sprites.set(sprite.getGuid(), sprite);
        
        return sprite;
    }

    setCameraFocus(target, smoothing = 0.1) {
        this.cameraSystem.focusTarget = target;
        this.cameraSystem.followSmoothing = smoothing;
    }

    setDepthOfField(focusDistance, blurAmount) {
        if (this.postEffects.depthOfField) {
            this.postEffects.depthOfField.focusDistance = focusDistance;
            this.postEffects.depthOfField.blurAmount = blurAmount;
        }
    }

    setLightingIntensity(intensity) {
        this.lightingSystem.lightingIntensity = intensity;
        
        // Apply to all lights
        [...this.lightingSystem.keyLights, 
         ...this.lightingSystem.fillLights,
         ...this.lightingSystem.rimLights,
         ...this.lightingSystem.environmentLights].forEach(light => {
            light.light.intensity *= intensity;
        });
    }

    // Update methods
    update(dt) {
        if (!this.initialized) return;
        
        // Update camera system
        this.updateCamera(dt);
        
        // Update parallax system
        this.updateParallax(dt);
        
        // Update sprite billboarding
        this.updateSpriteBillboarding(dt);
        
        // Update dynamic lighting
        this.updateLighting(dt);
    }

    updateCamera(dt) {
        if (!this.cameraSystem.mainCamera || !this.cameraSystem.focusTarget) return;
        
        // Smooth camera following with HD-2D offset
        const targetPos = this.cameraSystem.focusTarget.getPosition();
        this.cameraSystem.targetPosition.set(
            targetPos.x,
            targetPos.y + this.hd2dConfig.camera.heightOffset,
            15
        );
        
        // Lerp to target position
        this.cameraSystem.followPosition.lerp(
            this.cameraSystem.followPosition,
            this.cameraSystem.targetPosition,
            this.cameraSystem.followSmoothing
        );
        
        this.cameraSystem.mainCamera.setPosition(this.cameraSystem.followPosition);
    }

    updateParallax(dt) {
        if (!this.parallaxSystem.enabled || !this.cameraSystem.mainCamera) return;
        
        const cameraPos = this.cameraSystem.mainCamera.getPosition();
        const deltaPos = new pc.Vec3().sub2(cameraPos, this.parallaxSystem.cameraBasePosition);
        
        // Update parallax layers
        this.parallaxSystem.layers.forEach((layer, layerName) => {
            layer.entities.forEach(entity => {
                const basePos = layer.basePositions.get(entity.getGuid());
                if (!basePos) return;
                
                const parallaxOffset = new pc.Vec3().copy(deltaPos).scale(layer.speed);
                const newPos = new pc.Vec3().add2(basePos, parallaxOffset);
                entity.setPosition(newPos);
            });
        });
        
        this.parallaxSystem.cameraBasePosition.copy(cameraPos);
    }

    updateSpriteBillboarding(dt) {
        if (!this.spriteBillboardSystem.enabled || !this.cameraSystem.mainCamera) return;
        
        const cameraPos = this.cameraSystem.mainCamera.getPosition();
        
        this.spriteBillboardSystem.sprites.forEach(sprite => {
            // Make sprite face camera
            sprite.lookAt(cameraPos);
            
            // Maintain upright orientation
            const rotation = sprite.getRotation();
            const uprightRotation = new pc.Quat().setFromEulerAngles(0, rotation.getEulerAngles().y, 0);
            sprite.setRotation(uprightRotation);
        });
    }

    updateLighting(dt) {
        // Dynamic lighting adjustments
        const time = Date.now() * 0.001;
        
        // Subtle light shaft animation
        this.lightingSystem.lightShafts.forEach((shaft, index) => {
            const offset = index * 2.0;
            shaft.light.intensity = 0.5 + Math.sin(time + offset) * 0.1;
        });
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HD2DRenderer;
}