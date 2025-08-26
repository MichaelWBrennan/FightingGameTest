
/**
 * PlayCanvas Scene Manager
 * Manages scene transitions and loading for SF3 game modes
 */

import * as pc from 'playcanvas';
import { AssetLoader } from './AssetLoader';

export type SceneType = 'menu' | 'character_select' | 'battle' | 'training';

export class SceneManager extends pc.ScriptType {
  private currentScene: SceneType = 'menu';
  private assetLoader: AssetLoader;
  private sceneEntities: Map<SceneType, pc.Entity> = new Map();
  private transitionInProgress: boolean = false;

  initialize(): void {
    this.assetLoader = new AssetLoader();
    this.setupScenes();
    console.log('SceneManager initialized');
  }

  private setupScenes(): void {
    // Create scene entities
    this.createMenuScene();
    this.createCharacterSelectScene();
    this.createBattleScene();
    this.createTrainingScene();
    
    // Start with menu scene
    this.activateScene('menu');
  }

  private createMenuScene(): void {
    const menuEntity = new pc.Entity('MenuScene');
    
    // Create background
    const bgEntity = new pc.Entity('MenuBackground');
    bgEntity.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 0, 1, 1],
      pivot: [0.5, 0.5],
      color: new pc.Color(0.1, 0.1, 0.2)
    });
    menuEntity.addChild(bgEntity);
    
    // Create title
    const titleEntity = new pc.Entity('Title');
    titleEntity.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      text: 'STREET FIGHTER III: 3rd STRIKE',
      fontSize: 48,
      color: new pc.Color(1, 1, 1),
      anchor: [0.5, 0.8, 0.5, 0.8],
      pivot: [0.5, 0.5]
    });
    menuEntity.addChild(titleEntity);
    
    // Create menu options
    const optionsEntity = new pc.Entity('MenuOptions');
    optionsEntity.setLocalPosition(0, -100, 0);
    
    const options = ['ARCADE', 'VERSUS', 'TRAINING', 'OPTIONS'];
    options.forEach((option, index) => {
      const optionEntity = new pc.Entity(`Option_${option}`);
      optionEntity.addComponent('element', {
        type: pc.ELEMENTTYPE_TEXT,
        text: option,
        fontSize: 24,
        color: new pc.Color(0.8, 0.8, 0.8),
        anchor: [0.5, 0.5, 0.5, 0.5],
        pivot: [0.5, 0.5]
      });
      optionEntity.setLocalPosition(0, -index * 50, 0);
      optionsEntity.addChild(optionEntity);
    });
    
    menuEntity.addChild(optionsEntity);
    this.sceneEntities.set('menu', menuEntity);
    this.app.root.addChild(menuEntity);
  }

  private createCharacterSelectScene(): void {
    const charSelectEntity = new pc.Entity('CharacterSelectScene');
    
    // Create character grid
    const gridEntity = new pc.Entity('CharacterGrid');
    const characters = ['RYU', 'KEN', 'CHUN', 'AKUMA', 'YUKA', 'ALEX'];
    
    characters.forEach((character, index) => {
      const charEntity = new pc.Entity(`Character_${character}`);
      charEntity.addComponent('element', {
        type: pc.ELEMENTTYPE_IMAGE,
        color: new pc.Color(0.5, 0.5, 0.8),
        anchor: [0.2 + (index % 3) * 0.2, 0.6 - Math.floor(index / 3) * 0.3, 
                 0.2 + (index % 3) * 0.2, 0.6 - Math.floor(index / 3) * 0.3],
        pivot: [0.5, 0.5]
      });
      
      // Add character name
      const nameEntity = new pc.Entity(`Name_${character}`);
      nameEntity.addComponent('element', {
        type: pc.ELEMENTTYPE_TEXT,
        text: character,
        fontSize: 16,
        color: new pc.Color(1, 1, 1),
        anchor: [0, 0, 1, 0.2],
        pivot: [0.5, 0.5]
      });
      charEntity.addChild(nameEntity);
      gridEntity.addChild(charEntity);
    });
    
    charSelectEntity.addChild(gridEntity);
    charSelectEntity.enabled = false;
    this.sceneEntities.set('character_select', charSelectEntity);
    this.app.root.addChild(charSelectEntity);
  }

  private createBattleScene(): void {
    const battleEntity = new pc.Entity('BattleScene');
    
    // Create stage background
    const stageEntity = new pc.Entity('Stage');
    stageEntity.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(0.2, 0.6, 0.2),
      anchor: [0, 0, 1, 0.7],
      pivot: [0.5, 0.5]
    });
    battleEntity.addChild(stageEntity);
    
    // Create HUD
    const hudEntity = new pc.Entity('HUD');
    
    // Player 1 health bar
    const p1HealthEntity = new pc.Entity('P1_Health');
    p1HealthEntity.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(1, 0, 0),
      anchor: [0.05, 0.85, 0.45, 0.95],
      pivot: [0, 0.5]
    });
    hudEntity.addChild(p1HealthEntity);
    
    // Player 2 health bar  
    const p2HealthEntity = new pc.Entity('P2_Health');
    p2HealthEntity.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: new pc.Color(1, 0, 0),
      anchor: [0.55, 0.85, 0.95, 0.95],
      pivot: [1, 0.5]
    });
    hudEntity.addChild(p2HealthEntity);
    
    // Timer
    const timerEntity = new pc.Entity('Timer');
    timerEntity.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      text: '99',
      fontSize: 32,
      color: new pc.Color(1, 1, 1),
      anchor: [0.5, 0.9, 0.5, 0.9],
      pivot: [0.5, 0.5]
    });
    hudEntity.addChild(timerEntity);
    
    battleEntity.addChild(hudEntity);
    battleEntity.enabled = false;
    this.sceneEntities.set('battle', battleEntity);
    this.app.root.addChild(battleEntity);
  }

  private createTrainingScene(): void {
    // Training scene extends battle scene with additional UI
    const trainingEntity = new pc.Entity('TrainingScene');
    
    // Copy battle scene structure
    const battleScene = this.sceneEntities.get('battle');
    if (battleScene) {
      trainingEntity.addChild(battleScene.clone());
    }
    
    // Add training-specific UI
    const trainingUIEntity = new pc.Entity('TrainingUI');
    
    const infoEntity = new pc.Entity('TrainingInfo');
    infoEntity.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      text: 'TRAINING MODE',
      fontSize: 20,
      color: new pc.Color(1, 1, 0),
      anchor: [0.05, 0.05, 0.95, 0.15],
      pivot: [0, 0]
    });
    trainingUIEntity.addChild(infoEntity);
    
    trainingEntity.addChild(trainingUIEntity);
    trainingEntity.enabled = false;
    this.sceneEntities.set('training', trainingEntity);
    this.app.root.addChild(trainingEntity);
  }

  public async loadScene(sceneType: SceneType): Promise<void> {
    if (this.transitionInProgress) {
      console.log('Scene transition already in progress');
      return;
    }

    if (sceneType === this.currentScene) {
      console.log(`Already in ${sceneType} scene`);
      return;
    }

    this.transitionInProgress = true;
    
    try {
      // Load required assets for the scene
      await this.loadSceneAssets(sceneType);
      
      // Transition to new scene
      await this.transitionToScene(sceneType);
      
      this.currentScene = sceneType;
      console.log(`Scene loaded: ${sceneType}`);
    } catch (error) {
      console.error(`Failed to load scene ${sceneType}:`, error);
    } finally {
      this.transitionInProgress = false;
    }
  }

  private async loadSceneAssets(sceneType: SceneType): Promise<void> {
    switch (sceneType) {
      case 'menu':
        await this.assetLoader.loadUIAssets();
        break;
      case 'character_select':
        await this.assetLoader.loadUIAssets();
        break;
      case 'battle':
      case 'training':
        await this.assetLoader.loadCharacterAssets('ryu');
        await this.assetLoader.loadStageAssets('new_york');
        break;
    }
  }

  private async transitionToScene(sceneType: SceneType): Promise<void> {
    // Fade out current scene
    await this.fadeOut();
    
    // Deactivate current scene
    this.activateScene(sceneType);
    
    // Fade in new scene
    await this.fadeIn();
  }

  private activateScene(sceneType: SceneType): void {
    // Disable all scenes
    this.sceneEntities.forEach(entity => {
      entity.enabled = false;
    });
    
    // Enable target scene
    const targetScene = this.sceneEntities.get(sceneType);
    if (targetScene) {
      targetScene.enabled = true;
    }
  }

  private async fadeOut(): Promise<void> {
    return new Promise(resolve => {
      // Simple fade implementation
      setTimeout(resolve, 300);
    });
  }

  private async fadeIn(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, 300);
    });
  }

  public getCurrentScene(): SceneType {
    return this.currentScene;
  }

  public isTransitioning(): boolean {
    return this.transitionInProgress;
  }

  update(dt: number): void {
    // Update current scene logic
    // This can be expanded for scene-specific updates
  }

  public static get scriptName(): string {
    return 'sceneManager';
  }
}

pc.registerScript(SceneManager, 'sceneManager');
