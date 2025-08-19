import * as pc from 'playcanvas';
import { CharacterManager } from '../characters/CharacterManager';
import { StageLayerManager } from '../components/graphics/StageLayerManager';
import { RotationService } from '../RotationService';
import StageManager from './StageManager';
import { SceneManager } from './SceneManager';
import { ParticleManager } from './ParticleManager';
import { CoachManager } from './CoachManager';
import { ComboTrialManager } from './ComboTrialManager';

/**
 * Core Game Manager for SF3:3S HD-2D Fighting Game
 * Handles main game state, scene management, and system coordination
 */

import { type GameState, type BattleState, type ISystem, type PerformanceStats, type ParticleType } from '../../../types/core';

export class GameManager implements ISystem {
    private readonly app: pc.Application;
    private stageLayerManager!: StageLayerManager;
    private characterManager!: CharacterManager;
    private stageManager!: StageManager;
    private rotationService!: RotationService;
    private sceneManager!: SceneManager;
    private particleManager!: ParticleManager;
    private coachManager!: CoachManager;
    private comboTrialManager!: ComboTrialManager;
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
    
    // System references
    private readonly systems: Map<string, ISystem> = new Map();
    
    // Debug and development
    private debug: boolean = false;
    private showHitboxes: boolean = false;
    private showFrameData: boolean = false;

    constructor(app: pc.Application) {
        this.app = app;
        this.setupEventListeners();
    }

    public async initialize(): Promise<void> {
        console.log('Initializing Game Manager...');
        
        try {
            // Initialize core systems
            this.sceneManager = new SceneManager(this.app);
            this.sceneManager.initialize();
            this.registerSystem('sceneManager', this.sceneManager);

            this.particleManager = new ParticleManager(this.app);
            this.particleManager.initialize();
            this.registerSystem('particleManager', this.particleManager);

            this.stageLayerManager = new StageLayerManager(this.app);
            // Note: StageLayerManager is a PlayCanvas script component, so we don't need to initialize it separately
            this.registerSystem('stageLayerManager', this.stageLayerManager);

            this.characterManager = new CharacterManager(this.app);
            await this.characterManager.initialize();
            this.registerSystem('characterManager', this.characterManager);

            this.stageManager = new StageManager(this.app, this.stageLayerManager);
            this.registerSystem('stageManager', this.stageManager);

            this.rotationService = new RotationService(this.app, this.characterManager);
            await this.rotationService.initialize();
            this.registerSystem('rotationService', this.rotationService);

            this.coachManager = new CoachManager(this.app, this);
            await this.coachManager.initialize();
            this.registerSystem('coachManager', this.coachManager);

            this.comboTrialManager = new ComboTrialManager(this.app);
            await this.comboTrialManager.initialize();
            this.registerSystem('comboTrialManager', this.comboTrialManager);

            this.setupRenderSettings();
            
            // Initialize game loop
            this.setupGameLoop();
            
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
            const lightComponent = this.sceneManager.accentLight.light;
            if (lightComponent) {
                lightComponent.intensity = Math.sin(this.frameCount * 0.2) * 0.5 + 1.0;
            }
        } else {
            // Fade out accent light
            const lightComponent = this.sceneManager.accentLight.light;
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
        return this.particleManager.getParticle(type);
    }

    public releaseParticle(particle: pc.Entity): void {
        this.particleManager.releaseParticle(particle);
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
            activeParticles: this.particleManager.getActiveParticleCount()
        };
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