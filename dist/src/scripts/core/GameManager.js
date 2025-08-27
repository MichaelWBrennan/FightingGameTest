/**
 * PlayCanvas-compatible Game Manager
 * Manages the overall game state and systems
 */
import * as pc from 'playcanvas';
import { InputManager } from './InputManager';
import { ModernAssetLoader } from './ModernAssetLoader';
import { SceneManager } from './SceneManager';
import { ECSManager } from './EntitySystem';
import { ModernCombatSystem } from '../combat/ModernCombatSystem';
import { GameStateManager } from './StateManager';
export class GameManager extends pc.ScriptType {
    constructor() {
        super(...arguments);
        this.gameState = 'menu';
        this.deltaTime = 0;
        this.lastTime = 0;
    }
    initialize() {
        if (GameManager.instance) {
            console.warn('GameManager already exists. Using singleton pattern.');
            return;
        }
        GameManager.instance = this;
        // Initialize modern core systems
        this.inputManager = new InputManager();
        this.assetLoader = new ModernAssetLoader(this.app);
        this.sceneManager = new SceneManager();
        this.ecsManager = new ECSManager();
        this.combatSystem = new ModernCombatSystem();
        this.stateManager = GameStateManager.getInstance();
        // Initialize systems
        this.ecsManager.addSystem(this.combatSystem);
        await this.assetLoader.initialize();
        // Initialize PlayCanvas-specific setup
        this.setupPlayCanvasIntegration();
        // Initialize converted SF3 systems
        this.initializeGameSystems();
        console.log('GameManager initialized with PlayCanvas integration');
    }
    setupPlayCanvasIntegration() {
        // Set up PlayCanvas application settings
        this.app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
        this.app.setCanvasResolution(pc.RESOLUTION_AUTO);
        // Enable batch groups for performance
        this.app.batcher.addBatchGroup('ui', true, 100);
        this.app.batcher.addBatchGroup('world', true, 100);
        // Set up scene settings
        this.app.scene.ambientLight = new pc.Color(0.2, 0.2, 0.2);
        // Initialize renderer if canvas exists
        if (this.app.graphicsDevice.canvas) {
            this.conversionManager.initializeRenderer(this.app.graphicsDevice.canvas);
        }
    }
    initializeGameSystems() {
        // Initialize all converted game systems
        const status = this.conversionManager.getConversionStatus();
        console.log(`Game systems initialized. Conversion: ${status.conversionProgress.toFixed(1)}% complete`);
        // Set up game-specific entities and components
        this.createGameEntities();
    }
    createGameEntities() {
        // Create main camera entity
        const cameraEntity = new pc.Entity('MainCamera');
        cameraEntity.addComponent('camera', {
            clearColor: new pc.Color(0, 0, 0),
            fov: 45,
            nearClip: 0.1,
            farClip: 1000
        });
        cameraEntity.setPosition(0, 0, 10);
        this.app.root.addChild(cameraEntity);
        // Create UI entity
        const uiEntity = new pc.Entity('UI');
        uiEntity.addComponent('screen', {
            referenceResolution: new pc.Vec2(1920, 1080),
            scaleBlend: 0.5,
            scaleMode: pc.SCALEMODE_BLEND,
            screenSpace: true
        });
        this.app.root.addChild(uiEntity);
        // Create lighting
        const lightEntity = new pc.Entity('DirectionalLight');
        lightEntity.addComponent('light', {
            type: pc.LIGHTTYPE_DIRECTIONAL,
            color: new pc.Color(1, 1, 1),
            intensity: 1
        });
        lightEntity.setEulerAngles(45, 0, 0);
        this.app.root.addChild(lightEntity);
    }
    update(dt) {
        this.deltaTime = dt;
        this.lastTime += dt;
        // Update all game systems
        this.inputManager?.update(dt);
        this.sceneManager?.update(dt);
        this.conversionManager?.update(dt);
        // Update game state
        this.updateGameState(dt);
        // Render frame
        this.conversionManager?.render();
    }
    updateGameState(dt) {
        switch (this.gameState) {
            case 'menu':
                this.updateMenuState(dt);
                break;
            case 'character_select':
                this.updateCharacterSelectState(dt);
                break;
            case 'battle':
                this.updateBattleState(dt);
                break;
            case 'training':
                this.updateTrainingState(dt);
                break;
        }
    }
    updateMenuState(dt) {
        // Handle menu logic
        if (this.inputManager.isButtonPressed('start')) {
            this.changeState('character_select');
        }
    }
    updateCharacterSelectState(dt) {
        // Handle character selection
        if (this.inputManager.isButtonPressed('confirm')) {
            this.changeState('battle');
        }
    }
    updateBattleState(dt) {
        // Update battle systems
        const characterSystem = this.conversionManager.getCharacterSystem();
        const effectSystem = this.conversionManager.getEffectSystem();
        characterSystem.update();
        effectSystem.update();
    }
    updateTrainingState(dt) {
        // Handle training mode
        this.updateBattleState(dt); // Training uses battle systems
    }
    changeState(newState) {
        console.log(`Game state changed from ${this.gameState} to ${newState}`);
        this.gameState = newState;
        this.sceneManager.loadScene(newState);
    }
    getGameState() {
        return this.gameState;
    }
    static getInstance() {
        return GameManager.instance || null;
    }
    // PlayCanvas script registration
    static get scriptName() {
        return 'gameManager';
    }
}
// Register with PlayCanvas
pc.registerScript(GameManager, 'gameManager');
//# sourceMappingURL=GameManager.js.map