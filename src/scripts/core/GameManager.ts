
/**
 * PlayCanvas-compatible Game Manager
 * Manages the overall game state and systems
 */

import * as pc from 'playcanvas';
import { InputManager } from './InputManager';
import { AssetLoader } from './AssetLoader';
import { SceneManager } from './SceneManager';
import { ConversionManager } from '../../typescript/ConversionManager';

export class GameManager extends pc.ScriptType {
  private static instance: GameManager;
  
  private inputManager: InputManager;
  private assetLoader: AssetLoader;
  private sceneManager: SceneManager;
  private conversionManager: ConversionManager;
  
  private gameState: 'menu' | 'character_select' | 'battle' | 'training' = 'menu';
  private deltaTime: number = 0;
  private lastTime: number = 0;

  initialize(): void {
    if (GameManager.instance) {
      console.warn('GameManager already exists. Using singleton pattern.');
      return;
    }
    
    GameManager.instance = this;
    
    // Initialize core systems
    this.inputManager = new InputManager();
    this.assetLoader = new AssetLoader();
    this.sceneManager = new SceneManager();
    this.conversionManager = new ConversionManager();
    
    // Initialize PlayCanvas-specific setup
    this.setupPlayCanvasIntegration();
    
    // Initialize converted SF3 systems
    this.initializeGameSystems();
    
    console.log('GameManager initialized with PlayCanvas integration');
  }

  private setupPlayCanvasIntegration(): void {
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

  private initializeGameSystems(): void {
    // Initialize all converted game systems
    const status = this.conversionManager.getConversionStatus();
    console.log(`Game systems initialized. Conversion: ${status.conversionProgress.toFixed(1)}% complete`);
    
    // Set up game-specific entities and components
    this.createGameEntities();
  }

  private createGameEntities(): void {
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

  update(dt: number): void {
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

  private updateGameState(dt: number): void {
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

  private updateMenuState(dt: number): void {
    // Handle menu logic
    if (this.inputManager.isButtonPressed('start')) {
      this.changeState('character_select');
    }
  }

  private updateCharacterSelectState(dt: number): void {
    // Handle character selection
    if (this.inputManager.isButtonPressed('confirm')) {
      this.changeState('battle');
    }
  }

  private updateBattleState(dt: number): void {
    // Update battle systems
    const characterSystem = this.conversionManager.getCharacterSystem();
    const effectSystem = this.conversionManager.getEffectSystem();
    
    characterSystem.update();
    effectSystem.update();
  }

  private updateTrainingState(dt: number): void {
    // Handle training mode
    this.updateBattleState(dt); // Training uses battle systems
  }

  public changeState(newState: 'menu' | 'character_select' | 'battle' | 'training'): void {
    console.log(`Game state changed from ${this.gameState} to ${newState}`);
    this.gameState = newState;
    this.sceneManager.loadScene(newState);
  }

  public getGameState(): string {
    return this.gameState;
  }

  public static getInstance(): GameManager | null {
    return GameManager.instance || null;
  }

  // PlayCanvas script registration
  public static get scriptName(): string {
    return 'gameManager';
  }
}

// Register with PlayCanvas
pc.registerScript(GameManager, 'gameManager');
