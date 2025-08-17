import { CharacterManager } from '../characters/CharacterManager.js';
import HD2DRenderer from '../graphics/HD2DRenderer.js';
import { RotationService } from '../RotationService.js';
import StageManager from './StageManager.js';

/**
 * Core Game Manager for SF3:3S HD-2D Fighting Game
 * Handles main game state, scene management, and system coordination
 */

import { type GameState, type BattleState, type ISystem, type PerformanceStats, type ParticlePool, type ParticleType } from '../../../types/core.js';

export class GameManager implements ISystem {
    private readonly app: pc.Application;
    private hd2dRenderer!: HD2DRenderer;
    private characterManager!: CharacterManager;
    private stageManager!: StageManager;
    private rotationService!: RotationService;
    private initialized: boolean = false;
    private gameState: GameState = 'MENU';
    private battleState: BattleState = 'NEUTRAL';
    
    // Frame-accurate timing for fighting game precision
    private frameCount: number = 0;
    private readonly targetFPS: number = 60;
    private readonly frameTime: number = 1000 / this.targetFPS;
    private lastFrameTime: number = 0;
    private deltaAccumulator: number = 0;
    
    // SF3:3S specific timing
    private gameSpeed: number = 1.0;
    private frameStep: boolean = false;
    private nextFrame: boolean = false;
    
    // Scene management
    private currentScene: pc.Entity | null = null;
    private readonly scenes: Map<string, pc.Entity> = new Map();
    
    // System references
    private readonly systems: Map<string, ISystem> = new Map();
    
    // Debug and development
    private debug: boolean = false;
    private showHitboxes: boolean = false;
    private showFrameData: boolean = false;
    
    // Scene entities
    private mainScene!: pc.Entity;
    private camera!: pc.Entity;
    private keyLight!: pc.Entity;
    private rimLight!: pc.Entity;
    private accentLight!: pc.Entity;
    private backgroundContainer!: pc.Entity;
    private midgroundContainer!: pc.Entity;
    private backgroundLayers: pc.Entity[] = [];
    private leftBoundary!: pc.Entity;
    private rightBoundary!: pc.Entity;
    private groundBoundary!: pc.Entity;
    private stageGround!: pc.Entity;
    private particleContainer!: pc.Entity;
    private particlePools: ParticlePool = {
        impact: [],
        spark: [],
        dust: [],
        energy: [],
        blood: []
    };

    constructor(app: pc.Application) {
        this.app = app;
        this.setupEventListeners();
    }

    public async initialize(): Promise<void> {
        console.log('Initializing Game Manager...');
        
        try {
            // Initialize core systems
            this.hd2dRenderer = new HD2DRenderer(this.app);
            await this.hd2dRenderer.initialize();
            this.registerSystem('hd2dRenderer', this.hd2dRenderer);

            this.characterManager = new CharacterManager(this.app);
            await this.characterManager.initialize();
            this.registerSystem('characterManager', this.characterManager);

            this.stageManager = new StageManager(this.app, this.hd2dRenderer);
            this.registerSystem('stageManager', this.stageManager);

            this.rotationService = new RotationService(this.app, this.characterManager);
            await this.rotationService.initialize();
            this.registerSystem('rotationService', this.rotationService);

            this.setupRenderSettings();
            
            // Initialize game loop
            this.setupGameLoop();

            // Create default entities like boundaries
            this.createDefaultEntities();
            
            // Start a new game
            await this.startNewGame();

            this.initialized = true;
            console.log('Game Manager initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Game Manager:', error);
            throw error;
        }
    }

    private async startNewGame(): Promise<void> {
        console.log("Starting new game...");

        // 1. Get available content from RotationService
        const availableChars = this.rotationService.getAvailableCharacters('casual');
        // For stages, we'll assume a list for now, as RotationService doesn't manage stages yet.
        const availableStages = ['castle', 'cathedral', 'crypt'];

        if (availableChars.length < 1 || availableStages.length < 1) {
            console.error("Not enough characters or stages available to start a game.");
            return;
        }

        // 2. Load a stage
        const stageId = availableStages[Math.floor(Math.random() * availableStages.length)];
        try {
            const response = await fetch(`data/stages/${stageId}.json`);
            if (!response.ok) throw new Error(`Failed to fetch stage data for ${stageId}`);
            const stageData = await response.json();
            await this.stageManager.loadStage(stageData);
            console.log(`Stage ${stageId} loaded.`);
        } catch (error) {
            console.error(`Failed to load stage: ${error}`);
            return;
        }

        // 3. Create characters with variations
        const char1Id = availableChars[Math.floor(Math.random() * availableChars.length)];
        const char2Id = availableChars[Math.floor(Math.random() * availableChars.length)];

        const char1Variations = this.characterManager.getCharacterVariations(char1Id);
        const char2Variations = this.characterManager.getCharacterVariations(char2Id);

        if (!char1Variations || char1Variations.length === 0 || !char2Variations || char2Variations.length === 0) {
            console.error("Characters do not have variations to select from.");
            // As a fallback, create characters without variations
            this.characterManager.createCharacter(char1Id, 'player1', new pc.Vec3(-3, 0, 0));
            this.characterManager.createCharacter(char2Id, 'player2', new pc.Vec3(3, 0, 0));
            return;
        }

        const variation1Id = char1Variations[Math.floor(Math.random() * char1Variations.length)].id;
        const variation2Id = char2Variations[Math.floor(Math.random() * char2Variations.length)].id;

        this.characterManager.createCharacterWithVariation(char1Id, variation1Id, 'player1', new pc.Vec3(-3, 0, 0));
        this.characterManager.createCharacterWithVariation(char2Id, variation2Id, 'player2', new pc.Vec3(3, 0, 0));

        console.log(`Created characters: ${char1Id} (${variation1Id}) vs ${char2Id} (${variation2Id})`);

        this.setGameState('BATTLE');
    }

    private setupRenderSettings(): void {
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

    private createDefaultEntities(): void {
        // Create stage boundaries (invisible collision)
        this.createStageBoundaries();

        // Create default stage ground
        this.createStageGround();
        
        // Create particle effect pools
        this.createParticleSystem();
    }

    private createStageBoundaries(): void {
        // Left boundary
        this.leftBoundary = new pc.Entity('LeftBoundary');
        this.leftBoundary.addComponent('collision', {
            type: 'box',
            halfExtents: new pc.Vec3(0.1, 10, 5)
        });
        this.leftBoundary.setPosition(-12, 0, 0);
        this.app.root.addChild(this.leftBoundary);
        
        // Right boundary
        this.rightBoundary = new pc.Entity('RightBoundary');
        this.rightBoundary.addComponent('collision', {
            type: 'box',
            halfExtents: new pc.Vec3(0.1, 10, 5)
        });
        this.rightBoundary.setPosition(12, 0, 0);
        this.app.root.addChild(this.rightBoundary);
        
        // Ground
        this.groundBoundary = new pc.Entity('GroundBoundary');
        this.groundBoundary.addComponent('collision', {
            type: 'box',
            halfExtents: new pc.Vec3(15, 0.1, 5)
        });
        this.groundBoundary.setPosition(0, -5, 0);
        this.app.root.addChild(this.groundBoundary);
    }

    private createStageGround(): void {
        // Visible stage ground plane
        this.stageGround = new pc.Entity('StageGround');
        this.stageGround.addComponent('render', {
            type: 'plane'
        });
        this.stageGround.setPosition(0, -5, -1);
        this.stageGround.setLocalScale(30, 1, 10);
        this.app.root.addChild(this.stageGround);
    }

    private createParticleSystem(): void {
        // Particle effect container
        this.particleContainer = new pc.Entity('ParticleEffects');
        this.app.root.addChild(this.particleContainer);
        
        // Pre-create particle pools for performance
        this.particlePools = {
            impact: [],
            spark: [],
            dust: [],
            energy: [],
            blood: [] // For hit effects
        };
        
        // Create initial particle entities (object pooling)
        Object.keys(this.particlePools).forEach((type: string) => {
            const particleType = type as ParticleType;
            for (let i = 0; i < 50; i++) {
                const particle = new pc.Entity(`${type}_particle_${i}`);
                particle.addComponent('render', {
                    type: 'plane'
                });
                particle.enabled = false;
                this.particleContainer.addChild(particle);
                this.particlePools[particleType].push(particle);
            }
        });
    }

    private async setupLighting(): Promise<void> {
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

    private createBackgroundLayers(): void {
        // Background layer container
        this.backgroundContainer = new pc.Entity('BackgroundLayers');
        this.backgroundContainer.setPosition(0, 0, -5);
        this.mainScene.addChild(this.backgroundContainer);
        
        // Create multiple depth layers for parallax
        this.backgroundLayers = [];
        const layerDepths: readonly number[] = [-20, -15, -10, -7, -5, -3]; // Far to near
        
        layerDepths.forEach((depth: number, index: number) => {
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

    private createDefaultEntities(): void {
        // Create stage boundaries (invisible collision)
        this.createStageBoundaries();
        
        // Create default stage ground
        this.createStageGround();
        
        // Create particle effect pools
        this.createParticleSystem();
    }

    private createStageBoundaries(): void {
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

    private createStageGround(): void {
        // Visible stage ground plane
        this.stageGround = new pc.Entity('StageGround');
        this.stageGround.addComponent('render', {
            type: 'plane'
        });
        this.stageGround.setPosition(0, -5, -1);
        this.stageGround.setLocalScale(30, 1, 10);
        this.mainScene.addChild(this.stageGround);
    }

    private createParticleSystem(): void {
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
        Object.keys(this.particlePools).forEach((type: string) => {
            const particleType = type as ParticleType;
            for (let i = 0; i < 50; i++) {
                const particle = new pc.Entity(`${type}_particle_${i}`);
                particle.addComponent('render', {
                    type: 'plane'
                });
                particle.enabled = false;
                this.particleContainer.addChild(particle);
                this.particlePools[particleType].push(particle);
            }
        });
    }

    private setupGameLoop(): void {
        // Frame-accurate update loop for fighting games
        this.app.on('update', this.update.bind(this));
        this.app.on('postUpdate', this.postUpdate.bind(this));
        
        // Fixed timestep for deterministic gameplay
        this.app.setTargetFrameRate(this.targetFPS);
    }

    public update(dt: number): void {
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

    public fixedUpdate(fixedDt: number): void {
        // Update all game systems with fixed timestep
        this.systems.forEach((system: ISystem) => {
            if (system.fixedUpdate) {
                system.fixedUpdate(fixedDt);
            }
        });
        
        // Update game-specific logic
        this.updateGameState(fixedDt);
        this.updateBattleState(fixedDt);
    }

    public interpolationUpdate(dt: number): void {
        // Handle smooth visual updates that need interpolation
        this.systems.forEach((system: ISystem) => {
            if (system.interpolationUpdate) {
                system.interpolationUpdate(dt);
            }
        });
        
        // Update camera and visual effects
        this.updateCamera(dt);
        this.updateVisualEffects(dt);
    }

    public postUpdate(dt: number): void {
        // Handle post-processing and final visual updates
        this.systems.forEach((system: ISystem) => {
            if (system.postUpdate) {
                system.postUpdate(dt);
            }
        });
    }

    private updateGameState(dt: number): void {
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
            default:
                // Type safety - this should never happen
                const _exhaustiveCheck: never = this.gameState;
                break;
        }
    }

    private updateBattleState(dt: number): void {
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
            default:
                // Type safety - this should never happen
                const _exhaustiveCheck: never = this.battleState;
                break;
        }
    }

    private updateCamera(dt: number): void {
        // Camera following and framing for fighting games
        // This will be enhanced by the systems
    }

    private updateVisualEffects(dt: number): void {
        // Update dynamic lighting based on battle state
        if (this.battleState === 'SUPER') {
            // Increase dramatic lighting
            const lightComponent = this.accentLight.light;
            if (lightComponent) {
                lightComponent.intensity = Math.sin(this.frameCount * 0.2) * 0.5 + 1.0;
            }
        } else {
            // Fade out accent light
            const lightComponent = this.accentLight.light;
            if (lightComponent) {
                lightComponent.intensity *= 0.95;
            }
        }
    }

    private setupEventListeners(): void {
        // Debug controls
        window.addEventListener('keydown', (event: KeyboardEvent) => {
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
    public registerSystem(name: string, system: ISystem): void {
        this.systems.set(name, system);
        console.log(`Registered system: ${name}`);
    }

    public getSystem<T extends ISystem>(name: string): T | undefined {
        return this.systems.get(name) as T | undefined;
    }

    // State management
    public setGameState(newState: GameState): void {
        const oldState = this.gameState;
        this.gameState = newState;
        console.log(`Game state changed: ${oldState} -> ${newState}`);
        
        // Trigger state change events
        this.app.fire('gamestate:changed', oldState, newState);
    }

    public setBattleState(newState: BattleState): void {
        const oldState = this.battleState;
        this.battleState = newState;
        console.log(`Battle state changed: ${oldState} -> ${newState}`);
        
        // Trigger battle state change events
        this.app.fire('battlestate:changed', oldState, newState);
    }

    // Getters for current state
    public getCurrentGameState(): GameState {
        return this.gameState;
    }

    public getCurrentBattleState(): BattleState {
        return this.battleState;
    }

    // Debug functions
    private toggleFrameStep(): void {
        this.frameStep = !this.frameStep;
        console.log('Frame step:', this.frameStep ? 'enabled' : 'disabled');
    }

    private toggleHitboxes(): void {
        this.showHitboxes = !this.showHitboxes;
        console.log('Hitbox display:', this.showHitboxes ? 'enabled' : 'disabled');
        this.app.fire('debug:hitboxes', this.showHitboxes);
    }

    private toggleFrameData(): void {
        this.showFrameData = !this.showFrameData;
        console.log('Frame data display:', this.showFrameData ? 'enabled' : 'disabled');
        this.app.fire('debug:framedata', this.showFrameData);
    }

    // Utility functions
    public getParticle(type: ParticleType): pc.Entity | null {
        const pool = this.particlePools[type];
        if (!pool) return null;
        
        // Find inactive particle
        for (const particle of pool) {
            if (!particle.enabled) {
                return particle;
            }
        }
        
        return null; // Pool exhausted
    }

    public releaseParticle(particle: pc.Entity): void {
        particle.enabled = false;
        particle.setPosition(0, -100, 0); // Move offscreen
    }

    // Performance monitoring
    public getPerformanceStats(): PerformanceStats {
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

    private getActiveParticleCount(): number {
        let count = 0;
        Object.values(this.particlePools).forEach((pool: pc.Entity[]) => {
            pool.forEach((particle: pc.Entity) => {
                if (particle.enabled) count++;
            });
        });
        return count;
    }

    // Cleanup
    public destroy(): void {
        // Cleanup systems
        this.systems.forEach((system: ISystem) => {
            if (system.destroy) {
                system.destroy();
            }
        });
        
        // Clear collections
        this.systems.clear();
        this.scenes.clear();
        
        console.log('Game Manager destroyed');
    }
}