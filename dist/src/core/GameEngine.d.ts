import * as pc from 'playcanvas';
import { CharacterManager } from './characters/CharacterManager';
import { CombatSystem } from './combat/CombatSystem';
export declare class GameEngine {
    private app;
    private characterManager;
    private combatSystem;
    private stageManager;
    private inputManager;
    private uiManager;
    private isInitialized;
    constructor(canvas: HTMLCanvasElement);
    private setupApplication;
    private initializeManagers;
    initialize(): Promise<void>;
    getApp(): pc.Application;
    getCharacterManager(): CharacterManager;
    getCombatSystem(): CombatSystem;
    destroy(): void;
}
