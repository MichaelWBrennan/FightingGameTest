/**
 * Core Game Manager for SF3:3S HD-2D Fighting Game
 * Handles main game state, scene management, and system coordination
 */
class GameManager {
    constructor(app) {
        this.app = app;
        this.initialized = false;
        this.gameState = 'MENU'; // MENU, CHARACTER_SELECT, BATTLE, PAUSE
        this.battleState = 'NEUTRAL'; // NEUTRAL, COMBO, SUPER, STUNNED
        
        // Frame-accurate timing for fighting game precision
        this.frameCount = 0;
        this.targetFPS = 60;
        this.frameTime = 1000 / this.targetFPS;
        this.lastFrameTime = 0;
        this.deltaAccumulator = 0;
        
        // SF3:3S specific timing
        this.gameSpeed = 1.0;
        this.frameStep = false;
        this.nextFrame = false;
        
        // Scene management
        this.currentScene = null;
        this.scenes = new Map();
        
        // System references
        this.systems = new Map();
        
        // Debug and development
        this.debug = false;
        this.showHitboxes = false;
        this.showFrameData = false;
        
        this.setupEventListeners();
    }

    async initialize() {
        console.log('Initializing Game Manager...');
        
        try {
            // Set up render settings for fighting game precision
            this.setupRenderSettings();
            
            // Create main scene
            await this.createMainScene();
            
            // Initialize game loop
            this.setupGameLoop();
            
            // Create default entities
            this.createDefaultEntities();
            
            this.initialized = true;
            console.log('Game Manager initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Game Manager:', error);
            throw error;
        }
    }

    setupRenderSettings() {
        // Configure for pixel-perfect 2D fighting game rendering
        this.app.graphicsDevice.maxPixelRatio = 1; // Prevent blur on high-DPI displays
        
        // Set up canvas for fighting game aspect ratio (16:9 typical)
        this.app.setCanvasFillMode(pc.FILLMODE_KEEP_ASPECT);
        this.app.setCanvasResolution(pc.RESOLUTION_FIXED, 1920, 1080);
        
        // Disable automatic garbage collection spikes during gameplay
        if (this.app.graphicsDevice.extDisjointTimerQuery) {
            console.log('GPU timing available for performance monitoring');
        }
        
        // Configure render settings for fighting games
        this.app.scene.ambientLight = new pc.Color(0.2, 0.2, 0.3); // Slightly cool ambient
        this.app.scene.fog = pc.FOG_NONE; // No fog for clarity
        this.app.scene.exposure = 1.0;
        this.app.scene.skyboxIntensity = 0.3;
    }

    async createMainScene() {
        // Create root scene entity
        this.mainScene = new pc.Entity('MainScene');
        this.app.root.addChild(this.mainScene);
        
        // Create camera with fighting game optimal settings
        this.camera = new pc.Entity('MainCamera');
        this.camera.addComponent('camera', {
            clearColor: new pc.Color(0.1, 0.1, 0.15), // Dark blue-grey background
            projection: pc.PROJECTION_ORTHOGRAPHIC,
            orthoHeight: 10,
            nearClip: 0.1,
            farClip: 1000,
            frustumCulling: true
        });
        
        // Position camera for 2D fighting game view
        this.camera.setPosition(0, 0, 10);
        this.camera.lookAt(0, 0, 0);
        this.mainScene.addChild(this.camera);
        
        // Create lighting setup for SF3:3S + HD-2D style
        await this.setupLighting();
        
        // Create background layers for parallax
        this.createBackgroundLayers();
        
        console.log('Main scene created successfully');
    }

    async setupLighting() {
        // Key light (main character lighting)
        this.keyLight = new pc.Entity('KeyLight');
        this.keyLight.addComponent('light', {
            type: pc.LIGHTTYPE_DIRECTIONAL,
            color: new pc.Color(1.0, 0.95, 0.8), // Warm white
            intensity: 1.2,
            castShadows: true,
            shadowBias: 0.0005,
            shadowDistance: 50,
            shadowResolution: 2048
        });
        this.keyLight.setEulerAngles(45, -30, 0);
        this.mainScene.addChild(this.keyLight);
        
        // Rim light (for character separation and drama)
        this.rimLight = new pc.Entity('RimLight');
        this.rimLight.addComponent('light', {
            type: pc.LIGHTTYPE_DIRECTIONAL,
            color: new pc.Color(0.6, 0.8, 1.0), // Cool blue
            intensity: 0.8,
            castShadows: false
        });
        this.rimLight.setEulerAngles(-45, 150, 0);
        this.mainScene.addChild(this.rimLight);
        
        // Dramatic accent light (for special moves)
        this.accentLight = new pc.Entity('AccentLight');
        this.accentLight.addComponent('light', {
            type: pc.LIGHTTYPE_SPOT,
            color: new pc.Color(1.0, 0.7, 0.3), // Orange accent
            intensity: 0,
            range: 20,
            innerConeAngle: 20,
            outerConeAngle: 35,
            castShadows: true
        });
        this.accentLight.setPosition(0, 8, 5);
        this.accentLight.lookAt(0, 0, 0);
        this.mainScene.addChild(this.accentLight);
    }

    createBackgroundLayers() {
        // Background layer container
        this.backgroundContainer = new pc.Entity('BackgroundLayers');
        this.backgroundContainer.setPosition(0, 0, -5);
        this.mainScene.addChild(this.backgroundContainer);
        
        // Create multiple depth layers for parallax
        this.backgroundLayers = [];
        const layerDepths = [-20, -15, -10, -7, -5, -3]; // Far to near
        
        layerDepths.forEach((depth, index) => {
            const layer = new pc.Entity(`BackgroundLayer_${index}`);
            layer.setPosition(0, 0, depth);
            this.backgroundContainer.addChild(layer);
            this.backgroundLayers.push(layer);
        });
        
        // Foreground/midground container for stage elements
        this.midgroundContainer = new pc.Entity('MidgroundLayers');
        this.midgroundContainer.setPosition(0, 0, 0);
        this.mainScene.addChild(this.midgroundContainer);
        
        console.log('Background layers created:', this.backgroundLayers.length);
    }

    createDefaultEntities() {
        // Create stage boundaries (invisible collision)
        this.createStageBoundaries();
        
        // Create default stage ground
        this.createStageGround();
        
        // Create particle effect pools
        this.createParticleSystem();
    }

    createStageBoundaries() {
        // Left boundary
        this.leftBoundary = new pc.Entity('LeftBoundary');
        this.leftBoundary.addComponent('collision', {
            type: 'box',
            halfExtents: new pc.Vec3(0.1, 10, 5)
        });
        this.leftBoundary.setPosition(-12, 0, 0);
        this.mainScene.addChild(this.leftBoundary);
        
        // Right boundary
        this.rightBoundary = new pc.Entity('RightBoundary');
        this.rightBoundary.addComponent('collision', {
            type: 'box',
            halfExtents: new pc.Vec3(0.1, 10, 5)
        });
        this.rightBoundary.setPosition(12, 0, 0);
        this.mainScene.addChild(this.rightBoundary);
        
        // Ground
        this.groundBoundary = new pc.Entity('GroundBoundary');
        this.groundBoundary.addComponent('collision', {
            type: 'box',
            halfExtents: new pc.Vec3(15, 0.1, 5)
        });
        this.groundBoundary.setPosition(0, -5, 0);
        this.mainScene.addChild(this.groundBoundary);
    }

    createStageGround() {
        // Visible stage ground plane
        this.stageGround = new pc.Entity('StageGround');
        this.stageGround.addComponent('render', {
            type: 'plane'
        });
        this.stageGround.setPosition(0, -5, -1);
        this.stageGround.setLocalScale(30, 1, 10);
        this.mainScene.addChild(this.stageGround);
    }

    createParticleSystem() {
        // Particle effect container
        this.particleContainer = new pc.Entity('ParticleEffects');
        this.mainScene.addChild(this.particleContainer);
        
        // Pre-create particle pools for performance
        this.particlePools = {
            impact: [],
            spark: [],
            dust: [],
            energy: [],
            blood: [] // For hit effects
        };
        
        // Create initial particle entities (object pooling)
        Object.keys(this.particlePools).forEach(type => {
            for (let i = 0; i < 50; i++) {
                const particle = new pc.Entity(`${type}_particle_${i}`);
                particle.addComponent('render', {
                    type: 'plane'
                });
                particle.enabled = false;
                this.particleContainer.addChild(particle);
                this.particlePools[type].push(particle);
            }
        });
    }

    setupGameLoop() {
        // Frame-accurate update loop for fighting games
        this.app.on('update', this.update.bind(this));
        this.app.on('postUpdate', this.postUpdate.bind(this));
        
        // Fixed timestep for deterministic gameplay
        this.app.setTargetFrameRate(this.targetFPS);
    }

    update(dt) {
        if (!this.initialized) return;
        
        // Handle frame stepping for debugging
        if (this.frameStep && !this.nextFrame) {
            return;
        }
        this.nextFrame = false;
        
        // Accumulate delta time for fixed timestep
        this.deltaAccumulator += dt * 1000; // Convert to milliseconds
        
        // Process fixed timestep updates
        while (this.deltaAccumulator >= this.frameTime) {
            this.fixedUpdate(this.frameTime / 1000);
            this.deltaAccumulator -= this.frameTime;
            this.frameCount++;
        }
        
        // Update systems that need interpolation
        this.interpolationUpdate(dt);
    }

    fixedUpdate(fixedDt) {
        // Update all game systems with fixed timestep
        this.systems.forEach(system => {
            if (system.fixedUpdate) {
                system.fixedUpdate(fixedDt);
            }
        });
        
        // Update game-specific logic
        this.updateGameState(fixedDt);
        this.updateBattleState(fixedDt);
    }

    interpolationUpdate(dt) {
        // Handle smooth visual updates that need interpolation
        this.systems.forEach(system => {
            if (system.interpolationUpdate) {
                system.interpolationUpdate(dt);
            }
        });
        
        // Update camera and visual effects
        this.updateCamera(dt);
        this.updateVisualEffects(dt);
    }

    postUpdate(dt) {
        // Handle post-processing and final visual updates
        this.systems.forEach(system => {
            if (system.postUpdate) {
                system.postUpdate(dt);
            }
        });
    }

    updateGameState(dt) {
        switch (this.gameState) {
            case 'MENU':
                // Handle menu updates
                break;
            case 'CHARACTER_SELECT':
                // Handle character selection
                break;
            case 'BATTLE':
                // Handle battle updates
                break;
            case 'PAUSE':
                // Handle pause state
                break;
        }
    }

    updateBattleState(dt) {
        if (this.gameState !== 'BATTLE') return;
        
        switch (this.battleState) {
            case 'NEUTRAL':
                // Normal fighting state
                break;
            case 'COMBO':
                // Combo state with modified gravity/hitstun
                break;
            case 'SUPER':
                // Super move state with screen effects
                break;
            case 'STUNNED':
                // Stun state with visual effects
                break;
        }
    }

    updateCamera(dt) {
        // Camera following and framing for fighting games
        // This will be enhanced by the systems
    }

    updateVisualEffects(dt) {
        // Update dynamic lighting based on battle state
        if (this.battleState === 'SUPER') {
            // Increase dramatic lighting
            this.accentLight.light.intensity = Math.sin(this.frameCount * 0.2) * 0.5 + 1.0;
        } else {
            // Fade out accent light
            this.accentLight.light.intensity *= 0.95;
        }
    }

    setupEventListeners() {
        // Debug controls
        window.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'F2':
                    event.preventDefault();
                    this.toggleFrameStep();
                    break;
                case 'F3':
                    event.preventDefault();
                    this.toggleHitboxes();
                    break;
                case 'F4':
                    event.preventDefault();
                    this.toggleFrameData();
                    break;
                case ' ':
                    if (this.frameStep) {
                        event.preventDefault();
                        this.nextFrame = true;
                    }
                    break;
            }
        });
    }

    // System management
    registerSystem(name, system) {
        this.systems.set(name, system);
        console.log(`Registered system: ${name}`);
    }

    getSystem(name) {
        return this.systems.get(name);
    }

    // State management
    setGameState(newState) {
        const oldState = this.gameState;
        this.gameState = newState;
        console.log(`Game state changed: ${oldState} -> ${newState}`);
        
        // Trigger state change events
        this.app.fire('gamestate:changed', oldState, newState);
    }

    setBattleState(newState) {
        const oldState = this.battleState;
        this.battleState = newState;
        console.log(`Battle state changed: ${oldState} -> ${newState}`);
        
        // Trigger battle state change events
        this.app.fire('battlestate:changed', oldState, newState);
    }

    // Debug functions
    toggleFrameStep() {
        this.frameStep = !this.frameStep;
        console.log('Frame step:', this.frameStep ? 'enabled' : 'disabled');
    }

    toggleHitboxes() {
        this.showHitboxes = !this.showHitboxes;
        console.log('Hitbox display:', this.showHitboxes ? 'enabled' : 'disabled');
        this.app.fire('debug:hitboxes', this.showHitboxes);
    }

    toggleFrameData() {
        this.showFrameData = !this.showFrameData;
        console.log('Frame data display:', this.showFrameData ? 'enabled' : 'disabled');
        this.app.fire('debug:framedata', this.showFrameData);
    }

    // Utility functions
    getParticle(type) {
        const pool = this.particlePools[type];
        if (!pool) return null;
        
        // Find inactive particle
        for (let particle of pool) {
            if (!particle.enabled) {
                return particle;
            }
        }
        
        return null; // Pool exhausted
    }

    releaseParticle(particle) {
        particle.enabled = false;
        particle.setPosition(0, -100, 0); // Move offscreen
    }

    // Performance monitoring
    getPerformanceStats() {
        return {
            frameCount: this.frameCount,
            fps: Math.round(1000 / this.app.stats.frame.ms),
            frameTime: this.app.stats.frame.ms,
            drawCalls: this.app.stats.drawCalls.total,
            triangles: this.app.stats.triangles.total,
            gameState: this.gameState,
            battleState: this.battleState,
            activeParticles: this.getActiveParticleCount()
        };
    }

    getActiveParticleCount() {
        let count = 0;
        Object.values(this.particlePools).forEach(pool => {
            pool.forEach(particle => {
                if (particle.enabled) count++;
            });
        });
        return count;
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameManager;
}