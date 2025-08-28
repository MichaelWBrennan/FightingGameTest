
import * as pc from 'playcanvas';
import { CharacterManager } from './characters/CharacterManager';
import { CombatSystem } from './combat/CombatSystem';
// Integrate with existing PlayCanvas script-based managers under src/scripts
import { StageManager } from './stages/StageManager';
import { InputManager } from './input/InputManager';
import { UIManager } from './ui/UIManager';
// (Optional) Asset loader integration available under scripts if needed
import { Logger } from './utils/Logger';
import PostProcessingManager from '../scripts/graphics/PostProcessingManager';
import { EventBus } from './utils/EventBus';
import { ServiceContainer } from './utils/ServiceContainer';
import { FeatureFlags } from './utils/FeatureFlags';
import { UpdatePipeline, UpdatableSystem } from './UpdatePipeline';
import { GameStateStack } from './state/GameStateStack';
import { BootState } from './state/BootState';
import { MenuState } from './state/MenuState';
import { MatchState } from './state/MatchState';
import { ProceduralSpriteGenerator } from './graphics/ProceduralSpriteGenerator';
import { SpriteRegistry } from './graphics/SpriteRegistry';
import { PreloadManager } from './utils/PreloadManager';

export class GameEngine {
  private app: pc.Application;
  private characterManager: CharacterManager;
  private combatSystem: CombatSystem;
  private stageManager: StageManager;
  private inputManager: InputManager;
  private uiManager: UIManager;
  private postProcessingManager: PostProcessingManager | null = null;
  private eventBus: EventBus;
  private services: ServiceContainer;
  private featureFlags: FeatureFlags;
  private pipeline: UpdatePipeline;
  private debugOverlay: any | null = null;
  private stateStack: GameStateStack;
  private spriteGenerator: ProceduralSpriteGenerator;
  private spriteRegistry: SpriteRegistry;
  private preloader: PreloadManager;
  // private assetManager: any;
  private isInitialized = false;
  private updateHandler: ((dt: number) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.app = new pc.Application(canvas, {
      mouse: new pc.Mouse(canvas),
      touch: new pc.TouchDevice(canvas),
      keyboard: new pc.Keyboard(window),
      gamepads: new pc.GamePads()
    });

    this.setupApplication();
    this.initializeManagers();

    // Core infrastructure
    this.eventBus = new EventBus();
    this.services = new ServiceContainer();
    this.featureFlags = new FeatureFlags();
    this.pipeline = new UpdatePipeline();

    // Register services
    this.services.register('app', this.app);
    this.services.register('events', this.eventBus);
    this.services.register('flags', this.featureFlags);
    this.services.register('config', new (require('./utils/ConfigService').ConfigService)());
    this.spriteGenerator = new ProceduralSpriteGenerator(this.app);
    this.spriteRegistry = new SpriteRegistry(this.app);
    this.preloader = new PreloadManager();
    this.services.register('spriteGen', this.spriteGenerator);
    this.services.register('sprites', this.spriteRegistry);
    this.services.register('preloader', this.preloader);

    // State stack
    this.stateStack = new GameStateStack();

    // State transitions via EventBus
    this.eventBus.on('state:goto', async ({ state }: any) => {
      switch (state) {
        case 'menu':
          await this.stateStack.replace(new MenuState(this.app, this.eventBus));
          break;
        case 'match':
          await this.stateStack.replace(new MatchState(this.app, this.eventBus));
          break;
      }
    });
  }

  private setupApplication(): void {
    this.app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    this.app.setCanvasResolution(pc.RESOLUTION_AUTO);
    
    window.addEventListener('resize', () => this.app.resizeCanvas());
    
    Logger.info('PlayCanvas application initialized');
  }

  private initializeManagers(): void {
    // Asset loading can be handled later via script components
    this.inputManager = new InputManager(this.app);
    // Audio handled by PlayCanvas components or a future wrapper
    this.characterManager = new CharacterManager(this.app);
    this.combatSystem = new CombatSystem(this.app);
    this.stageManager = new StageManager(this.app);
    this.uiManager = new UIManager(this.app);
    // expose for states
    (this.app as any)._ui = this.uiManager;
    this.postProcessingManager = new PostProcessingManager(this.app);

    // Register update order
    const inputUpdatable: UpdatableSystem = { name: 'input', priority: 10, update: dt => this.inputManager.update() };
    const characterUpdatable: UpdatableSystem = { name: 'characters', priority: 20, update: dt => this.characterManager.update(dt) };
    const combatUpdatable: UpdatableSystem = { name: 'combat', priority: 30, update: dt => this.combatSystem.update(dt) };
    const postFxUpdatable: UpdatableSystem = { name: 'postfx', priority: 90, update: dt => this.postProcessingManager?.update(dt) };
    this.pipeline.add(inputUpdatable);
    this.pipeline.add(characterUpdatable);
    this.pipeline.add(combatUpdatable);
    this.pipeline.add(postFxUpdatable);
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      Logger.info('Initializing game systems...');
      
      // Preload assets if needed using AssetLoader script
      await this.characterManager.initialize();
      // StageManager/UIManager initialize through their own methods if needed
      await this.stageManager.initialize();
      await this.uiManager.initialize();
      if (this.postProcessingManager) {
        await this.postProcessingManager.initialize();
      }

      // Load manifest first
      await this.preloader.loadManifest('/assets/manifest.json');

      // Generate basic procedural sprites for placeholders
      const checker = this.spriteGenerator.createTexture({ width: 256, height: 256, type: 'checker', tile: 16, colorA: [200,200,200,255], colorB: [80,80,80,255] });
      this.spriteRegistry.register('checkerboard', checker);
      
      this.combatSystem.initialize(this.characterManager, this.inputManager);
      
      this.isInitialized = true;
      this.app.start();

      // Push boot state
      await this.stateStack.push(new BootState(this.app, this.services, this.eventBus));

      // Wire main update loop
      this.updateHandler = (dt: number) => {
        this.pipeline.update(dt);
        this.stateStack.update(dt);
        if (!this.debugOverlay && typeof window !== 'undefined') {
          try { const { DebugOverlay } = require('./debug/DebugOverlay'); this.debugOverlay = new DebugOverlay(); } catch {}
        }
        this.debugOverlay?.update();
        this.debugOverlay?.setTimings(this.pipeline.getTimings());
      };
      this.app.on('update', this.updateHandler);
      
      Logger.info('Game engine fully initialized');
    } catch (error) {
      Logger.error('Failed to initialize game engine:', error);
      throw error;
    }
  }

  public getApp(): pc.Application {
    return this.app;
  }

  public getCharacterManager(): CharacterManager {
    return this.characterManager;
  }

  public getCombatSystem(): CombatSystem {
    return this.combatSystem;
  }

  public destroy(): void {
    if (this.updateHandler) {
      this.app.off('update', this.updateHandler);
      this.updateHandler = null;
    }
    this.app.destroy();
    Logger.info('Game engine destroyed');
  }
}
