import * as pc from 'playcanvas';
import { CharacterManager } from './characters/CharacterManager';
import { CombatSystem } from './combat/CombatSystem';
// Integrate with existing PlayCanvas script-based managers under src/scripts
import { StageManager } from './stages/StageManager';
import { InputManager } from './input/InputManager';
import { UIManager } from './ui/UIManager';
// (Optional) Asset loader integration available under scripts if needed
import { Logger } from './utils/Logger';
export class GameEngine {
    constructor(canvas) {
        // private assetManager: any;
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
        // Asset loading can be handled later via script components
        this.inputManager = new InputManager(this.app);
        // Audio handled by PlayCanvas components or a future wrapper
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
            // Preload assets if needed using AssetLoader script
            await this.characterManager.initialize();
            // StageManager/UIManager initialize through their own methods if needed
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