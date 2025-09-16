
import * as pc from 'playcanvas';
import { CharacterManager } from './characters/CharacterManager';
import { CombatSystem } from './combat/CombatSystem';
// Integrate with existing PlayCanvas script-based managers under src/scripts
import { StageManager } from './stages/StageManager';
import { InputManager } from './input/InputManager';
import { UIManager } from './ui/UIManager';
// (Optional) Asset loader integration available under scripts if needed
import { Logger } from './utils/Logger';
import { EventBus } from './utils/EventBus';
import { ServiceContainer } from './utils/ServiceContainer';
import { FeatureFlags } from './utils/FeatureFlags';
import { UpdatePipeline, UpdatableSystem } from './UpdatePipeline';
import { GameStateStack } from './state/GameStateStack';
import { BootState } from './state/BootState';
import { MenuState } from './state/MenuState';
import { MatchState } from './state/MatchState';
import { LoginState } from './state/LoginState';
import { CharacterSelectState } from './state/CharacterSelectState';
import { PreloadManager } from './utils/PreloadManager';
import { AIManager } from './ai/AIManager';
import { ProceduralStageGenerator } from './procgen/ProceduralStageGenerator';
import { DecompDataService } from './utils/DecompDataService';
import { MonetizationService } from './monetization/MonetizationService';
import { SecurityService } from './security/SecurityService';
import { AntiCheat } from './security/AntiCheat';
import { OfflineService } from './utils/OfflineService';
import { SyncService } from './utils/SyncService';
import { RemoteConfigService } from './utils/RemoteConfigService';
import { LiveOpsService } from './liveops/LiveOpsService';
import { NetcodeService } from './netcode/NetcodeService';
import { ConfigService } from './utils/ConfigService';
import { LoadingOverlay } from './ui/LoadingOverlay';

export class GameEngine {
  private app: pc.Application;
  private characterManager: CharacterManager;
  private combatSystem: CombatSystem;
  private stageManager: StageManager;
  private inputManager: InputManager;
  private uiManager: UIManager;
  private postProcessingManager: any | null = null;
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
  private entitlement: any;
  private security: SecurityService;
  private antiCheat: AntiCheat;
  private offline: OfflineService;
  private sync: SyncService;
  private remoteConfig: RemoteConfigService;
  private liveOps: LiveOpsService;
  private netcode?: NetcodeService;
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

    // Core infrastructure must be ready before managers register to the pipeline
    this.eventBus = new EventBus();
    this.services = new ServiceContainer();
    this.featureFlags = new FeatureFlags();
    this.pipeline = new UpdatePipeline();

    this.initializeManagers();

    // Register services
    this.services.register('app', this.app);
    this.services.register('events', this.eventBus);
    this.services.register('flags', this.featureFlags);
    // Config service will be registered during initialize()
    this.preloader = new PreloadManager();
    this.aiManager = new AIManager(this.app);
    this.stageGen = new ProceduralStageGenerator();
    this.decompService = new DecompDataService();
    this.monetization = new MonetizationService();
    this.entitlement = null;
    this.security = new SecurityService();
    this.antiCheat = new AntiCheat();
    this.offline = new OfflineService();
    this.sync = new SyncService(this.offline);
    this.remoteConfig = new RemoteConfigService();
    this.liveOps = new LiveOpsService();
    this.netcode = new NetcodeService(this.combatSystem, this.characterManager, this.inputManager);
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
    this.services.register('netcode', this.netcode);
    this.services.register('characters', this.characterManager);
    this.services.register('stages', this.stageManager);
    // expose services for legacy components that pull from app
    (this.app as any)._services = this.services;

    // State stack
    this.stateStack = new GameStateStack();

    // State transitions via EventBus
    this.eventBus.on('state:goto', ({ state }: any) => {
      (async () => {
        switch (state) {
          case 'menu':
            await this.stateStack.replace(new MenuState(this.app, this.eventBus));
            break;
          case 'login':
            await this.stateStack.replace(new LoginState(this.app, this.eventBus));
            break;
          case 'characterselect':
            await this.stateStack.replace(new CharacterSelectState(this.app, this.eventBus));
            break;
          case 'match':
            await this.stateStack.replace(new MatchState(this.app, this.eventBus));
            break;
        }
      })().catch((err: unknown) => {
        try { Logger.error('state:goto failed', err as any); } catch {}
      });
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
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Lazy load heavy script modules only at runtime
      const [{ default: PostProcessingManager }, { EntitlementBridge }] = await Promise.all([
        import('../scripts/graphics/PostProcessingManager'),
        import('../scripts/EntitlementBridge')
      ]);

      this.postProcessingManager = new PostProcessingManager(this.app);
      this.entitlement = new EntitlementBridge();
      this.services.register('entitlement', this.entitlement);

      Logger.info('Initializing game systems...');
      LoadingOverlay.beginTask('systems', 'Initializing systems', 1);
      // Register config service (static import for IIFE compatibility)
      this.services.register('config', new ConfigService());
      LoadingOverlay.endTask('systems', true);
      LoadingOverlay.beginTask('characters', 'Loading character configs', 3);
      // Fast path: minimal playable roster immediately, full configs in background
      await this.characterManager.initializeLite(['ryu','ken']);
      LoadingOverlay.endTask('characters', true);
      // StageManager/UIManager initialize through their own methods if needed
      LoadingOverlay.beginTask('stages', 'Preparing stages', 2);
      await this.stageManager.initialize();
      LoadingOverlay.endTask('stages', true);
      LoadingOverlay.beginTask('ui', 'Bringing up UI', 1);
      await this.uiManager.initialize();
      LoadingOverlay.endTask('ui', true);
      // Defer post-processing init until after first frame for faster boot
      if (this.postProcessingManager) {
        LoadingOverlay.beginTask('postfx', 'Scheduling post-processing', 1);
        LoadingOverlay.endTask('postfx', true);
        setTimeout(() => {
          this.postProcessingManager?.initialize((p, label) => {
            try { LoadingOverlay.updateTask('postfx_bg', Math.max(0, Math.min(1, p ?? 0)), label || 'Post-processing'); } catch {}
          }).catch(() => {}).finally(() => {
            try { LoadingOverlay.endTask('postfx_bg', true); } catch {}
          });
          try { LoadingOverlay.beginTask('postfx_bg', 'Post-processing', 1); } catch {}
        }, 0);
      }

      // Load manifest and then preload assets with detailed progress grouped by type
      // Background preload (non-blocking) to enhance assets progressively
      setTimeout(() => {
        const loadP = this.preloader.loadManifest('/assets/manifest.json').then(() => {
          try { LoadingOverlay.beginTask('preload_bg', 'Preloading core data', 5); } catch {}
          return this.preloader.preloadAllAssets({
            groupOrder: ['json'],
            onEvent: (evt) => {
              switch (evt.kind) {
                case 'groupStart':
                  try { LoadingOverlay.beginTask(`preload_bg:${evt.group}`, `Loading ${evt.group.toUpperCase()}...`, 1); } catch {}
                  break;
                case 'groupProgress':
                  try { LoadingOverlay.updateTask(`preload_bg:${evt.group}`, evt.progress); } catch {}
                  break;
                case 'groupEnd':
                  try { LoadingOverlay.endTask(`preload_bg:${evt.group}`, true); } catch {}
                  break;
              }
            }
          });
        });
        // Hard timeout to avoid hangs blocking overlay/UI progression on Safari/iOS
        const timeoutP = new Promise<void>((resolve) => {
          setTimeout(() => {
            try {
              LoadingOverlay.log('[preload] timeout guard fired (continuing)', 'warn');
              // Do not block boot on background preloading
              LoadingOverlay.endTask('preload_bg', true);
            } catch {}
            resolve();
          }, 8000);
        });
        Promise.race([loadP.catch(() => undefined), timeoutP]).then(() => {
          try { LoadingOverlay.endTask('preload_bg', true); } catch {}
        }).catch(() => {
          try { LoadingOverlay.endTask('preload_bg', false); } catch {}
        });
      }, 0);

      
      this.combatSystem.initialize(this.characterManager, this.inputManager);
      
      this.isInitialized = true;
      LoadingOverlay.beginTask('app_start', 'Starting engine', 1);
      this.app.start();
      LoadingOverlay.endTask('app_start', true);

      // Optional runtime diagnostic: enable with ?diag=1 to inject a camera and a rotating cube
      try {
        const diag = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('diag') === '1';
        if (diag) {
          const app = this.app;
          // Ensure a camera exists and is enabled
          let camera = app.root.findByName('MainCamera');
          if (!camera) {
            camera = new pc.Entity('MainCamera');
            camera.addComponent('camera', {
              clearColor: new pc.Color(0.2, 0.2, 0.2, 1),
              fov: 55,
              nearClip: 0.1,
              farClip: 1000
            });
            camera.setPosition(0, 2, 6);
            camera.lookAt(0, 1, 0);
            app.root.addChild(camera);
          } else if (!camera.camera) {
            camera.addComponent('camera', { clearColor: new pc.Color(0.2, 0.2, 0.2, 1) });
          }
          camera.enabled = true;
          try { camera.camera.renderTarget = null; } catch {}

          // Directional light
          let light = app.root.findByName('DiagLight');
          if (!light) {
            light = new pc.Entity('DiagLight');
            light.addComponent('light', { type: pc.LIGHTTYPE_DIRECTIONAL, color: new pc.Color(1,1,1), intensity: 1.0, castShadows: false });
            light.setEulerAngles(45, 30, 0);
            app.root.addChild(light);
          }

          // Rotating cube
          let cube = app.root.findByName('DiagCube');
          if (!cube) {
            cube = new pc.Entity('DiagCube');
            cube.addComponent('render', { type: 'box' });
            cube.setLocalScale(1, 1, 1);
            cube.setPosition(0, 1, 0);
            app.root.addChild(cube);
          }
          app.on('update', (dt: number) => {
            const e = app.root.findByName('DiagCube');
            if (e) e.rotate(0, 60 * dt, 0);
          });
        }
      } catch {}

      // Push boot state (will route to match immediately if quickplay param is set)
      LoadingOverlay.beginTask('boot_state', 'Booting', 1);
      await this.stateStack.push(new BootState(this.app, this.services, this.eventBus));
      LoadingOverlay.endTask('boot_state', true);
      LoadingOverlay.beginTask('finalize', 'Finalizing', 1);

      // Wire main update loop
      this.updateHandler = (dt: number) => {
        this.pipeline.update(dt);
        this.stateStack.update(dt);
        if (!this.debugOverlay && typeof window !== 'undefined') {
          import('./debug/DebugOverlay').then(({ DebugOverlay }) => {
            if (!this.debugOverlay) this.debugOverlay = new DebugOverlay();
          }).catch(() => {});
        }
        this.debugOverlay?.update();
        this.debugOverlay?.setTimings(this.pipeline.getTimings());
      };
      this.app.on('update', this.updateHandler);
      LoadingOverlay.endTask('finalize', true);
      
      Logger.info('Game engine fully initialized');
      // Safety: ensure loading overlay is hidden even if caller forgets
      try { LoadingOverlay.complete(); } catch {}
      try { setTimeout(() => { try { LoadingOverlay.complete(true); } catch {} }, 1000); } catch {}
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
    try {
      const appAny: any = this.app as any;
      if (appAny && typeof appAny.destroy === 'function') {
        appAny.destroy();
      } else if (appAny && appAny.graphicsDevice && typeof appAny.graphicsDevice.destroy === 'function') {
        appAny.graphicsDevice.destroy();
      }
    } catch {}
    Logger.info('Game engine destroyed');
  }
}
