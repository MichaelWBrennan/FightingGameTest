/**
 * PlayCanvas Scene Manager
 * Manages scene transitions and loading for SF3 game modes
 */
import * as pc from 'playcanvas';
export type SceneType = 'menu' | 'character_select' | 'battle' | 'training';
export declare class SceneManager extends pc.ScriptType {
    private currentScene;
    private assetLoader;
    private sceneEntities;
    private transitionInProgress;
    initialize(): void;
    private setupScenes;
    private createMenuScene;
    private createCharacterSelectScene;
    private createBattleScene;
    private createTrainingScene;
    loadScene(sceneType: SceneType): Promise<void>;
    private loadSceneAssets;
    private transitionToScene;
    private activateScene;
    private fadeOut;
    private fadeIn;
    getCurrentScene(): SceneType;
    isTransitioning(): boolean;
    update(dt: number): void;
    static get scriptName(): string;
}
