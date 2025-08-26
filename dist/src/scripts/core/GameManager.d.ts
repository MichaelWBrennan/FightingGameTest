import * as pc from 'playcanvas';
/**
 * Core Game Manager for SF3:3S HD-2D Fighting Game
 * Handles main game state, scene management, and system coordination
 */
import { type GameState, type BattleState, type ISystem, type PerformanceStats, type ParticleType } from '../../../types/core';
export declare class GameManager implements ISystem {
    private readonly app;
    private stageLayerManager;
    private characterManager;
    private stageManager;
    private rotationService;
    private sceneManager;
    private particleManager;
    private coachManager;
    private comboTrialManager;
    private initialized;
    private gameState;
    private battleState;
    private frameCount;
    private readonly targetFPS;
    private readonly frameTime;
    private lastFrameTime;
    private deltaAccumulator;
    private gameSpeed;
    private frameStep;
    private nextFrame;
    private readonly systems;
    private debug;
    private showHitboxes;
    private showFrameData;
    constructor(app: pc.Application);
    initialize(): Promise<void>;
    private startNewGame;
    private setupRenderSettings;
    private setupGameLoop;
    update(dt: number): void;
    fixedUpdate(fixedDt: number): void;
    interpolationUpdate(dt: number): void;
    postUpdate(dt: number): void;
    private updateGameState;
    private updateBattleState;
    private updateCamera;
    private updateVisualEffects;
    private setupEventListeners;
    registerSystem(name: string, system: ISystem): void;
    getSystem<T extends ISystem>(name: string): T | undefined;
    setGameState(newState: GameState): void;
    setBattleState(newState: BattleState): void;
    getCurrentGameState(): GameState;
    getCurrentBattleState(): BattleState;
    private toggleFrameStep;
    private toggleHitboxes;
    private toggleFrameData;
    getParticle(type: ParticleType): pc.Entity | null;
    releaseParticle(particle: pc.Entity): void;
    getPerformanceStats(): PerformanceStats;
    destroy(): void;
}
//# sourceMappingURL=GameManager.d.ts.map