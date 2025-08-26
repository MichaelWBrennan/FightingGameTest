/**
 * PlayCanvas-compatible Game Manager
 * Manages the overall game state and systems
 */
import * as pc from 'playcanvas';
export declare class GameManager extends pc.ScriptType {
    private static instance;
    private inputManager;
    private assetLoader;
    private sceneManager;
    private conversionManager;
    private gameState;
    private deltaTime;
    private lastTime;
    initialize(): void;
    private setupPlayCanvasIntegration;
    private initializeGameSystems;
    private createGameEntities;
    update(dt: number): void;
    private updateGameState;
    private updateMenuState;
    private updateCharacterSelectState;
    private updateBattleState;
    private updateTrainingState;
    changeState(newState: 'menu' | 'character_select' | 'battle' | 'training'): void;
    getGameState(): string;
    static getInstance(): GameManager | null;
    static get scriptName(): string;
}
//# sourceMappingURL=GameManager.d.ts.map