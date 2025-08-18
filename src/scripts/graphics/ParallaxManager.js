/**
 * ParallaxManager - HD-2D Multi-layer Parallax Background System
 * Creates depth and immersion through layered parallax scrolling
 * Features: Multiple depth layers, speed variation, dynamic backgrounds
 */
class ParallaxManager {
    constructor(app) {
        this.app = app;
        this.initialized = false;
        
        // Parallax configuration based on HD-2D depth layers
        this.layerConfig = {
            skybox: { 
                depth: -100, 
                speed: 0.05, 
                name: 'Skybox',
                opacity: 0.8,
                blur: 0.3
            },
            farBackground: { 
                depth: -50, 
                speed: 0.1, 
                name: 'Far Background',
                opacity: 0.9,
                blur: 0.2
            },
            midBackground: { 
                depth: -25, 
                speed: 0.3, 
                name: 'Mid Background',
                opacity: 0.95,
                blur: 0.1
            },
            nearBackground: { 
                depth: -15, 
                speed: 0.5, 
                name: 'Near Background',
                opacity: 1.0,
                blur: 0.05
            },
            playground: { 
                depth: -8, 
                speed: 0.7, 
                name: 'Playground',
                opacity: 1.0,
                blur: 0.0
            },
            stageForeground: { 
                depth: -3, 
                speed: 0.9, 
                name: 'Stage Foreground',
                opacity: 1.0,
                blur: 0.0
            }
        };
        
        // Active parallax layers
        this.parallaxLayers = new Map();
        this.layerEntities = new Map();
        
        // Camera tracking
        this.cameraPosition = new pc.Vec3(0, 0, 0);
        this.lastCameraPosition = new pc.Vec3(0, 0, 0);
        this.cameraVelocity = new pc.Vec3(0, 0, 0);
        
        // Dynamic elements
        this.dynamicElements = new Map();
        this.animatedElements = [];
        
        // Stage-specific data
        this.currentStage = null;
        this.stageData = new Map();
        
        // Performance settings
        this.performance = {
            cullingDistance: 100,
            maxElements: 50,
            updateFrequency: 60,
            frameSkip: 0
        };
        
        // Visual effects
        this.effects = {
            windSpeed: 0.5,
            timeOfDay: 0.5, // 0 = night, 1 = day
            weather: 'clear', // clear, rain, wind, storm
            atmosphere: 1.0
        };
        
        this.setupDefaultStages();
    }

    async initialize() {
        console.log('Initializing Parallax Manager...');
        
        try {
            // Create parallax layer containers
            this.createParallaxLayers();
            
            // Setup camera tracking
            this.setupCameraTracking();
            
            // Initialize default stage
            await this.loadStage('training_stage');
            
            // Setup dynamic updates
            this.setupUpdateLoop();
            
            this.initialized = true;
            console.log('Parallax Manager initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Parallax Manager:', error);
            throw error;
        }
    }

    setupDefaultStages() {
        // Training Stage - Simple multi-layer setup
        this.stageData.set('training_stage', {
            name: 'Training Stage',
            layers: {
                skybox: {
                    type: 'gradient',
                    colors: ['#87CEEB', '#98D8E8', '#B8E6F0'],
                    animated: false
                },
                farBackground: {
                    type: 'mountains',
                    elements: [
                        { type: 'mountain', x: -200, y: -20, scale: 2.0, color: '#4A5568' },
                        { type: 'mountain', x: 0, y: -15, scale: 1.8, color: '#5A6578' },
                        { type: 'mountain', x: 180, y: -18, scale: 2.2, color: '#3A4558' }
                    ]
                },
                midBackground: {
                    type: 'buildings',
                    elements: [
                        { type: 'building', x: -150, y: -10, width: 40, height: 60, color: '#6B7280' },
                        { type: 'building', x: -80, y: -5, width: 35, height: 45, color: '#5B6270' },
                        { type: 'building', x: 50, y: -8, width: 50, height: 70, color: '#7B8290' },
                        { type: 'building', x: 120, y: -12, width: 30, height: 55, color: '#4B5260' }
                    ]
                },
                nearBackground: {
                    type: 'trees',
                    elements: [
                        { type: 'tree', x: -100, y: -5, scale: 1.5, sway: true },
                        { type: 'tree', x: -30, y: -3, scale: 1.2, sway: true },
                        { type: 'tree', x: 80, y: -6, scale: 1.8, sway: true },
                        { type: 'tree', x: 150, y: -4, scale: 1.3, sway: true }
                    ]
                },
                playground: {
                    type: 'stage_floor',
                    elements: [
                        { type: 'platform', x: 0, y: -5, width: 40, height: 2, color: '#8B7355' },
                        { type: 'boundary_left', x: -20, y: 0, height: 10 },
                        { type: 'boundary_right', x: 20, y: 0, height: 10 }
                    ]
                },
                stageForeground: {
                    type: 'decorative',
                    elements: [
                        { type: 'lamp', x: -25, y: 5, animated: true, light: true },
                        { type: 'lamp', x: 25, y: 5, animated: true, light: true }
                    ]
                }
            },
            lighting: {
                ambient: new pc.Color(0.3, 0.4, 0.5),
                directional: new pc.Color(1.0, 0.95, 0.8),
                intensity: 1.2
            },
            atmosphere: {
                fog: false,
                particles: ['dust'],
                wind: 0.3
            }
        });
        
        // Urban Stage - 2D Fighting Game style
        this.stageData.set('urban_stage', {
            name: 'Urban Street',
            layers: {
                skybox: {
                    type: 'cityscape',
                    colors: ['#2D3748', '#4A5568', '#718096'],
                    timeOfDay: 0.7 // Evening
                },
                farBackground: {
                    type: 'cityscape',
                    elements: [
                        { type: 'skyscraper', x: -300, y: -30, width: 60, height: 120 },
                        { type: 'skyscraper', x: -200, y: -25, width: 80, height: 150 },
                        { type: 'skyscraper', x: 0, y: -35, width: 100, height: 180 },
                        { type: 'skyscraper', x: 200, y: -28, width: 70, height: 140 }
                    ]
                },
                midBackground: {
                    type: 'street',
                    elements: [
                        { type: 'storefront', x: -120, y: -10, width: 60, height: 40 },
                        { type: 'alley', x: -40, y: -8, width: 20, height: 35 },
                        { type: 'storefront', x: 40, y: -12, width: 80, height: 45 }
                    ]
                },
                nearBackground: {
                    type: 'crowd',
                    elements: [
                        { type: 'spectator_group', x: -80, y: -5, count: 8, animated: true },
                        { type: 'spectator_group', x: 80, y: -5, count: 12, animated: true }
                    ]
                },
                playground: {
                    type: 'street_stage',
                    elements: [
                        { type: 'asphalt', x: 0, y: -5, width: 50, height: 3 },
                        { type: 'sidewalk', x: -30, y: -3, width: 10, height: 1 },
                        { type: 'sidewalk', x: 30, y: -3, width: 10, height: 1 }
                    ]
                }
            }
        });
    }

    createParallaxLayers() {
        // Create container for all parallax layers
        this.parallaxContainer = new pc.Entity('ParallaxContainer');
        this.app.root.addChild(this.parallaxContainer);
        
        // Create individual layer containers
        Object.entries(this.layerConfig).forEach(([layerName, config]) => {
            const layerEntity = new pc.Entity(`ParallaxLayer_${layerName}`);
            layerEntity.setPosition(0, 0, config.depth);
            
            this.parallaxContainer.addChild(layerEntity);
            this.layerEntities.set(layerName, layerEntity);
            
            // Create layer data
            this.parallaxLayers.set(layerName, {
                entity: layerEntity,
                config: config,
                elements: [],
                basePosition: new pc.Vec3(0, 0, config.depth),
                currentOffset: new pc.Vec3(0, 0, 0)
            });
        });
        
        console.log('Parallax layers created:', this.parallaxLayers.size);
    }

    setupCameraTracking() {
        // Get main camera reference
        this.mainCamera = this.app.root.findByName('MainCamera');
        
        if (!this.mainCamera) {
            console.warn('Main camera not found for parallax tracking');
            return;
        }
        
        // Initialize camera position tracking
        this.lastCameraPosition.copy(this.mainCamera.getPosition());
        this.cameraPosition.copy(this.mainCamera.getPosition());
        
        console.log('Camera tracking setup complete');
    }

    async loadStage(stageId) {
        const stage = this.stageData.get(stageId);
        if (!stage) {
            console.error(`Stage not found: ${stageId}`);
            return;
        }
        
        console.log(`Loading stage: ${stage.name}`);
        
        // Clear existing elements
        this.clearAllLayers();
        
        // Load stage layers
        Object.entries(stage.layers).forEach(([layerName, layerData]) => {
            this.loadStageLayer(layerName, layerData);
        });
        
        // Set stage lighting
        if (stage.lighting) {
            this.applyStageL ighting(stage.lighting);
        }
        
        // Set stage atmosphere
        if (stage.atmosphere) {
            this.applyStageAtmosphere(stage.atmosphere);
        }
        
        this.currentStage = stageId;
        console.log(`Stage loaded: ${stage.name}`);
    }

    loadStageLayer(layerName, layerData) {
        const layer = this.parallaxLayers.get(layerName);
        if (!layer) return;
        
        // Create elements for this layer
        layerData.elements?.forEach((elementData, index) => {
            const element = this.createElement(layerName, elementData, index);
            if (element) {
                layer.entity.addChild(element);
                layer.elements.push(element);
                
                // Add to animated elements if needed
                if (elementData.animated || elementData.sway) {
                    this.animatedElements.push({
                        entity: element,
                        data: elementData,
                        layer: layerName,
                        animation: this.createElementAnimation(elementData)
                    });
                }
            }
        });
    }

    createElement(layerName, elementData, index) {
        const element = new pc.Entity(`${layerName}_element_${index}`);
        
        // Position element
        element.setPosition(elementData.x || 0, elementData.y || 0, 0);
        
        // Scale element
        if (elementData.scale) {
            element.setLocalScale(elementData.scale, elementData.scale, 1);
        }
        
        // Create visual representation based on type
        switch (elementData.type) {
            case 'mountain':
                this.createMountainElement(element, elementData);
                break;
            case 'building':
            case 'skyscraper':
                this.createBuildingElement(element, elementData);
                break;
            case 'tree':
                this.createTreeElement(element, elementData);
                break;
            case 'platform':
                this.createPlatformElement(element, elementData);
                break;
            case 'lamp':
                this.createLampElement(element, elementData);
                break;
            case 'spectator_group':
                this.createSpectatorGroup(element, elementData);
                break;
            default:
                this.createGenericElement(element, elementData);
        }
        
        return element;
    }

    createMountainElement(element, data) {
        element.addComponent('render', {
            type: 'plane',
            material: this.createSolidMaterial(data.color || '#4A5568')
        });
        
        // Create mountain silhouette shape
        element.setLocalScale(data.width || 20, data.height || 15, 1);
    }

    createBuildingElement(element, data) {
        element.addComponent('render', {
            type: 'box',
            material: this.createSolidMaterial(data.color || '#6B7280')
        });
        
        element.setLocalScale(data.width || 10, data.height || 20, 2);
        
        // Add windows
        this.addBuildingWindows(element, data);
    }

    addBuildingWindows(building, data) {
        const windowRows = Math.floor((data.height || 20) / 4);
        const windowCols = Math.floor((data.width || 10) / 3);
        
        for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < windowCols; col++) {
                if (Math.random() > 0.3) { // 70% chance for lit window
                    const window = new pc.Entity(`window_${row}_${col}`);
                    window.addComponent('render', {
                        type: 'plane',
                        material: this.createEmissiveMaterial('#FFFF99')
                    });
                    
                    const x = (col - windowCols/2) * 2.5;
                    const y = (row - windowRows/2) * 3;
                    window.setPosition(x, y, 1.1);
                    window.setLocalScale(0.8, 1.2, 1);
                    
                    building.addChild(window);
                }
            }
        }
    }

    createTreeElement(element, data) {
        // Tree trunk
        const trunk = new pc.Entity('trunk');
        trunk.addComponent('render', {
            type: 'cylinder',
            material: this.createSolidMaterial('#4A3429')
        });
        trunk.setLocalScale(1, 4, 1);
        trunk.setPosition(0, -2, 0);
        
        // Tree foliage
        const foliage = new pc.Entity('foliage');
        foliage.addComponent('render', {
            type: 'sphere',
            material: this.createSolidMaterial('#228B22')
        });
        foliage.setLocalScale(4, 3, 4);
        foliage.setPosition(0, 1, 0);
        
        element.addChild(trunk);
        element.addChild(foliage);
    }

    createPlatformElement(element, data) {
        element.addComponent('render', {
            type: 'box',
            material: this.createSolidMaterial(data.color || '#8B7355')
        });
        
        element.setLocalScale(data.width || 10, data.height || 1, 3);
    }

    createLampElement(element, data) {
        // Lamp post
        const post = new pc.Entity('lamp_post');
        post.addComponent('render', {
            type: 'cylinder',
            material: this.createSolidMaterial('#2C2C2C')
        });
        post.setLocalScale(0.2, 8, 0.2);
        
        // Lamp head
        const head = new pc.Entity('lamp_head');
        head.addComponent('render', {
            type: 'sphere',
            material: this.createEmissiveMaterial('#FFFFCC')
        });
        head.setLocalScale(1.5, 1.5, 1.5);
        head.setPosition(0, 4, 0);
        
        // Add light source
        if (data.light) {
            head.addComponent('light', {
                type: pc.LIGHTTYPE_OMNI,
                color: new pc.Color(1, 1, 0.8),
                intensity: 2,
                range: 15,
                castShadows: false
            });
        }
        
        element.addChild(post);
        element.addChild(head);
    }

    createSpectatorGroup(element, data) {
        const count = data.count || 5;
        
        for (let i = 0; i < count; i++) {
            const spectator = new pc.Entity(`spectator_${i}`);
            spectator.addComponent('render', {
                type: 'capsule',
                material: this.createSolidMaterial(`hsl(${Math.random() * 360}, 50%, 60%)`)
            });
            
            const x = (i - count/2) * 2 + (Math.random() - 0.5);
            const z = Math.random() * 2 - 1;
            spectator.setPosition(x, 0, z);
            spectator.setLocalScale(0.8, 1.5, 0.8);
            
            element.addChild(spectator);
        }
    }

    createGenericElement(element, data) {
        element.addComponent('render', {
            type: 'plane',
            material: this.createSolidMaterial(data.color || '#666666')
        });
    }

    createSolidMaterial(color) {
        const material = new pc.StandardMaterial();
        material.diffuse = new pc.Color().fromString(color);
        material.update();
        return material;
    }

    createEmissiveMaterial(color) {
        const material = new pc.StandardMaterial();
        material.emissive = new pc.Color().fromString(color);
        material.update();
        return material;
    }

    createElementAnimation(elementData) {
        const animation = {
            type: 'none',
            time: 0,
            speed: 1,
            amplitude: 1
        };
        
        if (elementData.sway) {
            animation.type = 'sway';
            animation.speed = 0.5 + Math.random() * 0.5;
            animation.amplitude = 0.1 + Math.random() * 0.1;
        } else if (elementData.animated) {
            animation.type = 'pulse';
            animation.speed = 1 + Math.random() * 0.5;
            animation.amplitude = 0.1;
        }
        
        return animation;
    }

    setupUpdateLoop() {
        // Hook into app update loop
        this.app.on('update', this.updateParallax.bind(this));
    }

    updateParallax(dt) {
        if (!this.initialized || !this.mainCamera) return;
        
        // Update camera tracking
        this.updateCameraTracking(dt);
        
        // Update parallax layers
        this.updateParallaxLayers(dt);
        
        // Update animated elements
        this.updateAnimatedElements(dt);
    }

    updateCameraTracking(dt) {
        this.lastCameraPosition.copy(this.cameraPosition);
        this.cameraPosition.copy(this.mainCamera.getPosition());
        
        // Calculate camera velocity
        this.cameraVelocity.sub2(this.cameraPosition, this.lastCameraPosition);
    }

    updateParallaxLayers(dt) {
        // Calculate camera movement delta
        const cameraDelta = new pc.Vec3().sub2(this.cameraPosition, this.lastCameraPosition);
        
        this.parallaxLayers.forEach((layer, layerName) => {
            // Calculate parallax offset based on layer speed
            const parallaxOffset = new pc.Vec3().copy(cameraDelta).scale(layer.config.speed);
            
            // Add to current offset
            layer.currentOffset.add(parallaxOffset);
            
            // Apply offset to layer entity
            const newPosition = new pc.Vec3().add2(layer.basePosition, layer.currentOffset);
            layer.entity.setPosition(newPosition);
        });
    }

    updateAnimatedElements(dt) {
        this.animatedElements.forEach(animElement => {
            const animation = animElement.animation;
            animation.time += dt * animation.speed;
            
            switch (animation.type) {
                case 'sway':
                    this.updateSwayAnimation(animElement, animation);
                    break;
                case 'pulse':
                    this.updatePulseAnimation(animElement, animation);
                    break;
            }
        });
    }

    updateSwayAnimation(animElement, animation) {
        const swayAmount = Math.sin(animation.time) * animation.amplitude;
        const currentRotation = animElement.entity.getEulerAngles();
        animElement.entity.setEulerAngles(currentRotation.x, currentRotation.y, swayAmount * 5);
    }

    updatePulseAnimation(animElement, animation) {
        const pulseAmount = 1 + Math.sin(animation.time) * animation.amplitude;
        animElement.entity.setLocalScale(pulseAmount, pulseAmount, pulseAmount);
    }

    applyStageL ighting(lighting) {
        // Apply stage-specific lighting
        this.app.scene.ambientLight = lighting.ambient;
        
        // Update directional lights if available
        const lights = this.app.root.findComponents('light');
        lights.forEach(light => {
            if (light.type === pc.LIGHTTYPE_DIRECTIONAL) {
                light.color = lighting.directional;
                light.intensity = lighting.intensity;
            }
        });
    }

    applyStageAtmosphere(atmosphere) {
        // Apply atmospheric effects
        this.effects.weather = atmosphere.particles?.[0] || 'clear';
        this.effects.windSpeed = atmosphere.wind || 0.3;
        
        if (atmosphere.fog) {
            this.app.scene.fog = pc.FOG_LINEAR;
            this.app.scene.fogStart = 20;
            this.app.scene.fogEnd = 100;
            this.app.scene.fogColor = new pc.Color(0.5, 0.6, 0.7);
        }
    }

    clearAllLayers() {
        this.parallaxLayers.forEach(layer => {
            // Remove all children
            layer.elements.forEach(element => {
                layer.entity.removeChild(element);
                element.destroy();
            });
            layer.elements = [];
        });
        
        // Clear animated elements
        this.animatedElements = [];
    }

    // Public API
    setParallaxSpeed(layerName, speed) {
        const layer = this.parallaxLayers.get(layerName);
        if (layer) {
            layer.config.speed = speed;
        }
    }

    setWeatherEffect(weather) {
        this.effects.weather = weather;
        // Implement weather effects
    }

    setTimeOfDay(time) {
        this.effects.timeOfDay = time;
        // Adjust lighting and colors based on time
    }

    addDynamicElement(layerName, elementData) {
        const element = this.createElement(layerName, elementData, 'dynamic');
        const layer = this.parallaxLayers.get(layerName);
        
        if (element && layer) {
            layer.entity.addChild(element);
            layer.elements.push(element);
            return element;
        }
        
        return null;
    }

    removeDynamicElement(element) {
        this.parallaxLayers.forEach(layer => {
            const index = layer.elements.indexOf(element);
            if (index !== -1) {
                layer.elements.splice(index, 1);
                layer.entity.removeChild(element);
                element.destroy();
            }
        });
    }

    // Debug and utility
    getParallaxStats() {
        return {
            initialized: this.initialized,
            currentStage: this.currentStage,
            layerCount: this.parallaxLayers.size,
            elementCount: Array.from(this.parallaxLayers.values()).reduce((sum, layer) => sum + layer.elements.length, 0),
            animatedElements: this.animatedElements.length,
            cameraPosition: this.cameraPosition.toString(),
            effects: this.effects
        };
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParallaxManager;
}