import * as pc from 'playcanvas';
import { CharacterManager } from './characters/CharacterManager';
import { CombatSystem } from './combat/CombatSystem';
import { StageManager } from './stages/StageManager';
import { InputManager } from './input/InputManager';
import { UIManager } from './ui/UIManager';
import { AudioManager } from './audio/AudioManager';
import { AssetManager } from './assets/AssetManager';
import { Logger } from './utils/Logger';
export class GameEngine {
    constructor(canvas) {
        this.isInitialized = false;
        this.app = new pc.Application(canvas, {
            mouse: new pc.Mouse(canvas),
            touch: new pc.TouchDevice(canvas),
            keyboard: new pc.Keyboard(window),
            gamepads: new pc.GamePads()
        });
        this.setupApplication();
        this.initializeManagers();
    }
    setupApplication() {
        this.app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
        this.app.setCanvasResolution(pc.RESOLUTION_AUTO);
        window.addEventListener('resize', () => this.app.resizeCanvas());
        Logger.info('PlayCanvas application initialized');
    }
    initializeManagers() {
        this.assetManager = new AssetManager(this.app);
        this.inputManager = new InputManager(this.app);
        this.audioManager = new AudioManager(this.app);
        this.characterManager = new CharacterManager(this.app);
        this.combatSystem = new CombatSystem(this.app);
        this.stageManager = new StageManager(this.app);
        this.uiManager = new UIManager(this.app);
    }
    async initialize() {
        if (this.isInitialized)
            return;
        try {
            Logger.info('Initializing game systems...');
            await this.assetManager.preloadAssets();
            await this.audioManager.initialize();
            await this.characterManager.initialize();
            await this.stageManager.initialize();
            await this.uiManager.initialize();
            this.combatSystem.initialize(this.characterManager, this.inputManager);
            this.isInitialized = true;
            this.app.start();
            Logger.info('Game engine fully initialized');
        }
        catch (error) {
            Logger.error('Failed to initialize game engine:', error);
            throw error;
        }
    }
    getApp() {
        return this.app;
    }
    getCharacterManager() {
        return this.characterManager;
    }
    getCombatSystem() {
        return this.combatSystem;
    }
    destroy() {
        this.app.destroy();
        Logger.info('Game engine destroyed');
    }
}
//# sourceMappingURL=GameEngine.js.map