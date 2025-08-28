
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
import { PreloadManager } from './utils/PreloadManager';
import { AIManager } from './ai/AIManager';
import { ProceduralStageGenerator } from './procgen/ProceduralStageGenerator';
import { DecompDataService } from './utils/DecompDataService';
import { MonetizationService } from './monetization/MonetizationService';
import { EntitlementBridge } from '../scripts/EntitlementBridge';
import { SecurityService } from './security/SecurityService';
import { AntiCheat } from './security/AntiCheat';
import { OfflineService } from './utils/OfflineService';
import { SyncService } from './utils/SyncService';
import { RemoteConfigService } from './utils/RemoteConfigService';
import { LiveOpsService } from './liveops/LiveOpsService';

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
  private preloader: PreloadManager;
  private aiManager: AIManager;
  private stageGen: ProceduralStageGenerator;
  private decompService: DecompDataService;
  private monetization: MonetizationService;
  private entitlement: EntitlementBridge;
  private security: SecurityService;
  private antiCheat: AntiCheat;
  private offline: OfflineService;
  private sync: SyncService;
  private remoteConfig: RemoteConfigService;
  private liveOps: LiveOpsService;
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
    this.preloader = new PreloadManager();
    this.aiManager = new AIManager(this.app);
    this.stageGen = new ProceduralStageGenerator();
    this.decompService = new DecompDataService();
    this.monetization = new MonetizationService();
    this.entitlement = new EntitlementBridge();
    this.security = new SecurityService();
    this.antiCheat = new AntiCheat();
    this.offline = new OfflineService();
    this.sync = new SyncService(this.offline);
    this.remoteConfig = new RemoteConfigService();
    this.liveOps = new LiveOpsService();
    this.services.register('preloader', this.preloader);
    this.services.register('ai', this.aiManager);
    this.services.register('stageGen', this.stageGen);
    this.services.register('decomp', this.decompService);
    this.services.register('monetization', this.monetization);
    this.services.register('entitlement', this.entitlement);
    this.services.register('security', this.security);
    this.services.register('anticheat', this.antiCheat);
    this.services.register('offline', this.offline);
    this.services.register('sync', this.sync);
    this.services.register('configRemote', this.remoteConfig);
    this.services.register('liveops', this.liveOps);
    // expose services for legacy components that pull from app
    (this.app as any)._services = this.services;

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
    const aiUpdatable: UpdatableSystem = { name: 'ai', priority: 25, update: dt => this.aiManager.update(dt) };
    this.pipeline.add(inputUpdatable);
    this.pipeline.add(characterUpdatable);
    this.pipeline.add(aiUpdatable);
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
