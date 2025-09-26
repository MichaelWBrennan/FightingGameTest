
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
import { Platform } from './utils/Platform';
import { TrainingOverlay } from './ui/TrainingOverlay';
import { NetplayOverlay } from './ui/NetplayOverlay';
import { ReplayService } from './utils/ReplayService';
import { MatchmakingOverlay } from './ui/MatchmakingOverlay';
import { EffectsOverlay } from './graphics/EffectsOverlay';
import { SfxService } from './utils/SfxService';
import { DeterminismService } from './utils/DeterminismService';
import { InputRemapOverlay } from './ui/InputRemapOverlay';
import { TuningOverlay } from './ui/TuningOverlay';
import { ConfigLoader } from './utils/ConfigLoader';
import { I18nService } from './utils/I18n';
import { CommandListOverlay } from './ui/CommandListOverlay';
import { OptionsOverlay } from './ui/OptionsOverlay';
import { MatchmakingService } from './online/MatchmakingService';
import { AnalyticsService } from './utils/AnalyticsService';
import { LobbiesOverlay } from './ui/LobbiesOverlay';
import { RankedOverlay } from './ui/RankedOverlay';
import { StreamingOverlay } from './ui/StreamingOverlay';
import { ReplayArchiveOverlay } from './ui/ReplayArchiveOverlay';
import { ReconnectOverlay } from './ui/ReconnectOverlay';
import { CameraCinematics } from './camera/Cinematics';
import { StoreOverlay } from './ui/StoreOverlay';
import { SpectatorOverlay } from './ui/SpectatorOverlay';
import { CancelTableOverlay } from './ui/CancelTableOverlay';
import { RoundManager } from './match/RoundManager';
import { RematchOverlay } from './ui/RematchOverlay';
import { SpectateService } from './online/SpectateService';
import { SimService } from './sim/SimService';
import { ChatOverlay } from './ui/ChatOverlay';
import { BoxEditorOverlay } from './ui/BoxEditorOverlay';
import { TtsService } from './utils/TtsService';
import { PrivacyOverlay } from './ui/PrivacyOverlay';
import { PartyOverlay } from './ui/PartyOverlay';
import { TournamentOverlay } from './ui/TournamentOverlay';
import { BalanceVersionService } from './utils/BalanceVersionService';
import { PartyService } from './online/PartyService';
import { TournamentService } from './online/TournamentService';
import { FixedClock } from './utils/Clock';
import { RngService } from './utils/RngService';
import { AudioManager } from './audio/AudioManager';
import { MusicManager } from './audio/MusicManager';
import { StoryMode } from './story/StoryMode';
import { ModernUIManager } from './ui/ModernUIManager';
import { ParticleSystem } from './graphics/ParticleSystem';
import { RankingSystem } from './competitive/RankingSystem';
import { AccessibilityManager } from './accessibility/AccessibilityManager';
import { AdvancedAccessibilityManager } from './accessibility/AdvancedAccessibilityManager';
import { AdvancedAudioSystem } from './audio/AdvancedAudioSystem';
import { QuantumRollbackNetcode } from './netcode/QuantumRollbackNetcode';
import { AdvancedAntiCheatSystem } from './security/AdvancedAntiCheatSystem';
import { AdvancedMobileOptimizer } from './mobile/AdvancedMobileOptimizer';
import { AdvancedEsportsPlatform } from './esports/AdvancedEsportsPlatform';
import { NeuralInterfaceSystem } from './neural/NeuralInterfaceSystem';
import { AdvancedTrainingMode } from './training/AdvancedTrainingMode';
import { SmartReplaySystem } from './replay/SmartReplaySystem';
import { SocialFeatures } from './social/SocialFeatures';
import { PerformanceOptimizer } from './performance/PerformanceOptimizer';
import { PracticalAccessibility } from './accessibility/PracticalAccessibility';
import { UserAccountSystem } from './accounts/UserAccountSystem';
import { LeagueRankingSystem } from './competitive/LeagueRankingSystem';
import { BayesianRankingSystem } from './competitive/BayesianRankingSystem';
import { BrowserUISystem } from './ui/BrowserUISystem';
import { BrowserGameLauncher } from '../launcher/BrowserGameLauncher';
import { MainMenuUI } from './ui/MainMenuUI';
import { FeatureShowcaseUI } from './ui/FeatureShowcaseUI';

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
  private trainingOverlay: TrainingOverlay | null = null;
  private netplayOverlay: NetplayOverlay | null = null;
  private replay: ReplayService | null = null;
  private matchmaking: MatchmakingOverlay | null = null;
  private effects: EffectsOverlay | null = null;
  private sfx: SfxService | null = null;
  private det: DeterminismService | null = null;
  private i18n: I18nService | null = null;
  private cmdList: CommandListOverlay | null = null;
  private options: OptionsOverlay | null = null;
  private mmService: MatchmakingService | null = null;
  private analytics: AnalyticsService | null = null;
  private lobbies: LobbiesOverlay | null = null;
  private ranked: RankedOverlay | null = null;
  private streaming: StreamingOverlay | null = null;
  private replayArchive: ReplayArchiveOverlay | null = null;
  private reconnect: ReconnectOverlay | null = null;
  private cinematics: CameraCinematics | null = null;
  private store: StoreOverlay | null = null;
  private spectator: SpectatorOverlay | null = null;
  private cancelTable: CancelTableOverlay | null = null;
  private roundMgr: RoundManager | null = null;
  private rematch: RematchOverlay | null = null;
  private sim: SimService | null = null;
  private chat: ChatOverlay | null = null;
  private boxEditor: BoxEditorOverlay | null = null;
  private _specBound: boolean = false;
  private partyOverlay: PartyOverlay | null = null;
  private tournamentOverlay: TournamentOverlay | null = null;
  private privacy: PrivacyOverlay | null = null;
  private clock: FixedClock = new FixedClock(60);
  private rng: RngService = new RngService(0xC0FFEE);
  private audioManager: AudioManager | null = null;
  private musicManager: MusicManager | null = null;
  private storyMode: StoryMode | null = null;
  private modernUI: ModernUIManager | null = null;
  private particleSystem: ParticleSystem | null = null;
  private rankingSystem: RankingSystem | null = null;
  private accessibilityManager: AccessibilityManager | null = null;
  private advancedAccessibilityManager: AdvancedAccessibilityManager | null = null;
  private advancedAudioSystem: AdvancedAudioSystem | null = null;
  private quantumNetcode: QuantumRollbackNetcode | null = null;
  private advancedAntiCheat: AdvancedAntiCheatSystem | null = null;
  private advancedMobileOptimizer: AdvancedMobileOptimizer | null = null;
  private advancedEsportsPlatform: AdvancedEsportsPlatform | null = null;
  private neuralInterfaceSystem: NeuralInterfaceSystem | null = null;
  private advancedTrainingMode: AdvancedTrainingMode | null = null;
  private smartReplaySystem: SmartReplaySystem | null = null;
  private socialFeatures: SocialFeatures | null = null;
  private performanceOptimizer: PerformanceOptimizer | null = null;
  private practicalAccessibility: PracticalAccessibility | null = null;
  private userAccountSystem: UserAccountSystem | null = null;
  private leagueRankingSystem: LeagueRankingSystem | null = null;
  private bayesianRankingSystem: BayesianRankingSystem | null = null;
  private browserUISystem: BrowserUISystem | null = null;
  private browserGameLauncher: BrowserGameLauncher | null = null;
  private mainMenuUI: MainMenuUI | null = null;
  private featureShowcaseUI: FeatureShowcaseUI | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.app = new pc.Application(canvas, {
      mouse: new pc.Mouse(canvas),
      touch: new pc.TouchDevice(canvas),
      keyboard: new pc.Keyboard(window),
      gamepads: new pc.GamePads()
    });

    // UA-aware device pixel ratio cap to balance clarity and performance
    try {
      const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
      const isIOS = /iPhone|iPad|iPod/.test(ua);
      const isAndroid = /Android/.test(ua);
      const isMobile = isIOS || isAndroid || /Mobile|IEMobile|Opera Mini/.test(ua);
      const prefersReducedMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
      let maxDpr = 2;
      if (isIOS) maxDpr = 2; // avoid >2 on iOS Safari due to fill-rate
      if (isAndroid) maxDpr = 1.75;
      if (isMobile && prefersReducedMotion) maxDpr = Math.min(maxDpr, 1.5);
      const finalDpr = Math.min(dpr, maxDpr);
      // PlayCanvas exposes setDevicePixelRatio on application since 1.63+
      try { (this.app as any).setDevicePixelRatio?.(finalDpr); } catch {}
    } catch {}

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
    this.services.register('input', this.inputManager);
    this.services.register('ui', this.uiManager);
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
    this.services.register('clock', this.clock);
    this.services.register('rng', this.rng);
    this.services.register('characters', this.characterManager);
    this.services.register('stages', this.stageManager);
    this.services.register('combat', this.combatSystem);
    this.services.register('anticheat', this.antiCheat);
    this.services.register('effects', null as any);
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
      // Decide whether to enable PostFX (iOS Safari and reduced-motion default to off)
      let enablePostFX = true;
      let postfxReason = 'enabled';
      try {
        const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        const override = (params.get('postfx') || '').toLowerCase();
        const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
        const isIOS = /iPhone|iPad|iPod/.test(ua);
        const prefersReducedMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (override) {
          if (['0','false','off','no','n'].includes(override)) { enablePostFX = false; postfxReason = 'override:off'; }
          if (['1','true','on','yes','y'].includes(override)) { enablePostFX = true; postfxReason = 'override:on'; }
        } else {
          if (isIOS || prefersReducedMotion) { enablePostFX = false; postfxReason = isIOS ? 'ios' : 'reduced-motion'; }
        }
      } catch {}

      // Defer post-processing init until after first frame for faster boot
      if (enablePostFX && this.postProcessingManager) {
        try { LoadingOverlay.beginTask('postfx', 'Scheduling post-processing', 1); } catch {}
        try { LoadingOverlay.endTask('postfx', true); } catch {}
        setTimeout(() => {
          this.postProcessingManager?.initialize((p, label) => {
            try { LoadingOverlay.updateTask('postfx_bg', Math.max(0, Math.min(1, p ?? 0)), label || 'Post-processing'); } catch {}
          }).catch(() => {}).finally(() => {
            try { LoadingOverlay.endTask('postfx_bg', true); } catch {}
          });
          try { LoadingOverlay.beginTask('postfx_bg', 'Post-processing', 1); } catch {}
        }, 0);
        try { LoadingOverlay.log(`[postfx] ${postfxReason}`, 'info'); } catch {}
      } else {
        // Ensure main camera renders directly to the backbuffer if PostFX is disabled
        try {
          const cam = this.app.root.findByName('MainCamera');
          if (cam && (cam as any).camera) {
            (cam as any).camera.renderTarget = null;
          }
        } catch {}
        try { LoadingOverlay.log(`[postfx] disabled (${postfxReason})`, 'warn'); } catch {}
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

      // Show main menu after boot
      setTimeout(() => {
        if (this.mainMenuUI) {
          this.mainMenuUI.show();
        }
      }, 1000);
      LoadingOverlay.beginTask('finalize', 'Finalizing', 1);

      // Wire main update loop
      this.updateHandler = (_dt: number) => {
        const steps = this.clock.tick();
        for (let i = 0; i < steps; i++) {
          // Ensure input is updated first for deterministic reads
          try { this.inputManager.update(); } catch {}
          // Pause gating for training
          if (!this.trainingOverlay || !this.trainingOverlay.isPaused || this.trainingOverlay.consumeStep?.()) {
            this.pipeline.update(this.clock.stepSec);
          }
          if (!this.trainingOverlay || !this.trainingOverlay.isPaused || this.trainingOverlay.consumeStep?.()) {
            this.stateStack.update(this.clock.stepSec);
          }
          // Netcode
          try {
            const net: any = this.services.resolve('netcode');
            // advance netcode each frame to drive rollback sim when enabled
            net?.step?.();
            if (net?.isEnabled?.() && net?.getStats) {
              this.debugOverlay?.setNetcodeInfo(net.getStats());
              // Update connection quality badge
              try {
                const st = net.getStats();
                const rtt = st?.rtt ?? 0; const jitter = st?.jitter ?? 0; const loss = st?.loss ?? 0;
                let grade = 'A';
                if (rtt > 120 || jitter > 30 || (loss|0) > 5) grade = 'C';
                if (rtt > 200 || jitter > 50 || (loss|0) > 10) grade = 'D';
                if (rtt > 280 || jitter > 80 || (loss|0) > 15) grade = 'F';
                let el = document.getElementById('net-quality');
                if (!el) {
                  el = document.createElement('div'); el.id = 'net-quality'; el.style.position = 'fixed'; el.style.right = '8px'; el.style.top = '8px'; el.style.zIndex = '10001'; el.style.padding = '4px 6px'; el.style.borderRadius = '4px'; el.style.font = '12px system-ui'; document.body.appendChild(el);
                }
                (el as any).textContent = `Link: ${grade}`;
                (el as any).style.background = grade === 'A' ? 'rgba(40,180,80,0.8)' : grade === 'C' ? 'rgba(180,150,40,0.8)' : grade === 'D' ? 'rgba(200,100,40,0.8)' : 'rgba(200,60,60,0.8)';
                (el as any).style.color = '#fff';
              } catch {}
            }
          } catch {}
          // Deterministic SFX flush
          try { (this.sfx as any)?.flushScheduled?.(this.combatSystem.getCurrentFrame()); } catch {}
          // Replay
          try { this.replay?.update(); } catch {}
          // Anti-cheat monitor surface
          try {
            const ac: any = this.services.resolve('anticheat');
            this.debugOverlay?.setCheatAlerts(ac?.getReports?.() || []);
          } catch {}
          // Determinism status surface
          try {
            const det: any = this.services.resolve('det');
            const last = det?.getLastValidatedFrame?.() ?? -1;
            const mis = det?.getLastMismatchFrame?.() ?? -1;
            this.debugOverlay?.setDeterminism(last, mis < 0 || mis < last);
          } catch {}
          try { const ac: any = this.services.resolve('anticheat'); ac?.heartbeat?.(); } catch {}
          // Example: KO cinematic trigger
          try {
            const combat: any = this.services.resolve('combat');
            if (combat?.wasRecentKO?.() && !this.cinematics) {
              this.cinematics = new CameraCinematics(this.app);
              this.cinematics.koCinematic();
            }
          } catch {}
          // Spectator controls
          try {
            const spec: any = this.services.resolve('spectate');
            if (!this._specBound) {
              spec?.on?.((e: any) => {
                try {
                  const tr: any = (this.app as any)._training;
                  if (e?.ctrl === 'pause') tr?.setPaused?.(true);
                  if (e?.ctrl === 'step') tr?.stepOnce?.();
                } catch {}
              });
              (this as any)._specBound = true;
            }
          } catch {}
        }
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

      // Initialize overlays/services
      try { this.trainingOverlay = new TrainingOverlay(this.app); (this.app as any)._training = this.trainingOverlay; } catch {}
      try { this.netplayOverlay = new NetplayOverlay(this.app); } catch {}
      try { this.replay = new ReplayService(this.inputManager, this.combatSystem); this.services.register('replay', this.replay); } catch {}
      try { this.matchmaking = new MatchmakingOverlay(); } catch {}
      try { this.effects = new EffectsOverlay(this.app); } catch {}
      try { if (this.effects) this.services.register('effects', this.effects); } catch {}
      try { this.sfx = new SfxService(); this.sfx.preload({ hadoken: '/sfx/hadoken.mp3', hit: '/sfx/hit.mp3', block: '/sfx/block.mp3', parry: '/sfx/parry.mp3', throw: '/sfx/throw.mp3' }); this.services.register('sfx', this.sfx); } catch {}
      try { this.det = new DeterminismService(); this.services.register('det', this.det); } catch {}
      try { this.analytics = new AnalyticsService(); this.analytics.setEndpoint(''); this.analytics.startAutoFlush(4000); this.services.register('analytics', this.analytics); } catch {}
      try { this.mmService = new MatchmakingService(); this.services.register('matchmakingService', this.mmService); } catch {}
      try { const spectate = new SpectateService(); this.services.register('spectate', spectate); } catch {}
      try { this.sim = new SimService(); this.services.register('sim', this.sim); } catch {}
      try { this.chat = new ChatOverlay(); } catch {}
      try { this.boxEditor = new BoxEditorOverlay(); } catch {}
      try { const tts = new TtsService(); this.services.register('tts', tts); } catch {}
      try { this.privacy = new PrivacyOverlay(this.services); } catch {}
      try { this.services.register('balance', new BalanceVersionService()); } catch {}
      try { this.services.register('party', new PartyService()); } catch {}
      try { this.services.register('tournament', new TournamentService()); } catch {}
      try { const party = this.services.resolve('party'); this.partyOverlay = new PartyOverlay(party); } catch {}
      try { const tour = this.services.resolve('tournament'); this.tournamentOverlay = new TournamentOverlay(tour); } catch {}
      try { new InputRemapOverlay((map) => this.inputManager.setKeyMap(map)); } catch {}
      
      // Initialize new systems
      try { 
        this.audioManager = new AudioManager(this.app);
        this.services.register('audio', this.audioManager);
      } catch {}
      try { 
        this.musicManager = new MusicManager(this.audioManager!);
        this.services.register('music', this.musicManager);
      } catch {}
      try { 
        this.storyMode = new StoryMode();
        this.services.register('story', this.storyMode);
      } catch {}
      try { 
        this.modernUI = new ModernUIManager(this.app);
        this.services.register('modernUI', this.modernUI);
      } catch {}
      try { 
        this.particleSystem = new ParticleSystem(this.app);
        this.services.register('particles', this.particleSystem);
      } catch {}
      try { 
        this.rankingSystem = new RankingSystem();
        this.services.register('ranking', this.rankingSystem);
      } catch {}
      try { 
        this.accessibilityManager = new AccessibilityManager();
        this.services.register('accessibility', this.accessibilityManager);
      } catch {}
      try { 
        this.advancedAccessibilityManager = new AdvancedAccessibilityManager(this.app);
        this.services.register('advancedAccessibility', this.advancedAccessibilityManager);
      } catch {}
      try { 
        this.advancedAudioSystem = new AdvancedAudioSystem(this.app);
        this.services.register('advancedAudio', this.advancedAudioSystem);
      } catch {}
      try { 
        this.quantumNetcode = new QuantumRollbackNetcode(this.app);
        this.services.register('quantumNetcode', this.quantumNetcode);
      } catch {}
      try { 
        this.advancedAntiCheat = new AdvancedAntiCheatSystem(this.app);
        this.services.register('advancedAntiCheat', this.advancedAntiCheat);
      } catch {}
      try { 
        this.advancedMobileOptimizer = new AdvancedMobileOptimizer(this.app);
        this.services.register('advancedMobileOptimizer', this.advancedMobileOptimizer);
      } catch {}
      try { 
        this.advancedEsportsPlatform = new AdvancedEsportsPlatform(this.app);
        this.services.register('advancedEsportsPlatform', this.advancedEsportsPlatform);
      } catch {}
      try { 
        this.neuralInterfaceSystem = new NeuralInterfaceSystem(this.app);
        this.services.register('neuralInterfaceSystem', this.neuralInterfaceSystem);
      } catch {}
      try { 
        this.advancedTrainingMode = new AdvancedTrainingMode(this.app);
        this.services.register('advancedTrainingMode', this.advancedTrainingMode);
      } catch {}
      try { 
        this.smartReplaySystem = new SmartReplaySystem(this.app);
        this.services.register('smartReplaySystem', this.smartReplaySystem);
      } catch {}
      try { 
        this.socialFeatures = new SocialFeatures(this.app);
        this.services.register('socialFeatures', this.socialFeatures);
      } catch {}
      try { 
        this.performanceOptimizer = new PerformanceOptimizer(this.app);
        this.services.register('performanceOptimizer', this.performanceOptimizer);
      } catch {}
      try { 
        this.practicalAccessibility = new PracticalAccessibility(this.app);
        this.services.register('practicalAccessibility', this.practicalAccessibility);
      } catch {}
      try { 
        this.userAccountSystem = new UserAccountSystem(this.app);
        this.services.register('userAccountSystem', this.userAccountSystem);
      } catch {}
      try { 
        this.leagueRankingSystem = new LeagueRankingSystem(this.app);
        this.services.register('leagueRankingSystem', this.leagueRankingSystem);
      } catch {}
      try { 
        this.bayesianRankingSystem = new BayesianRankingSystem(this.app);
        this.services.register('bayesianRankingSystem', this.bayesianRankingSystem);
      } catch {}
      try { 
        this.browserUISystem = new BrowserUISystem(this.app);
        this.services.register('browserUISystem', this.browserUISystem);
      } catch {}
      try { 
        this.browserGameLauncher = new BrowserGameLauncher(this.app);
        this.services.register('browserGameLauncher', this.browserGameLauncher);
      } catch {}
      try { 
        this.mainMenuUI = new MainMenuUI(this.app);
        this.services.register('mainMenuUI', this.mainMenuUI);
      } catch {}
      try { 
        this.featureShowcaseUI = new FeatureShowcaseUI(this.app);
        this.services.register('featureShowcaseUI', this.featureShowcaseUI);
      } catch {}

      // Game mode event handlers
      this.app.on('game:storyMode', () => {
        Logger.info('Starting Story Mode');
        this.stateStack.push(new MenuState());
      });

      this.app.on('game:arcadeMode', () => {
        Logger.info('Starting Arcade Mode');
        this.stateStack.push(new MenuState());
      });

      this.app.on('game:versusMode', () => {
        Logger.info('Starting Versus Mode');
        this.stateStack.push(new CharacterSelectState());
      });

      this.app.on('game:trainingMode', () => {
        Logger.info('Starting Training Mode');
        this.stateStack.push(new MatchState());
      });

      this.app.on('game:onlineMode', () => {
        Logger.info('Starting Online Mode');
        this.stateStack.push(new MenuState());
      });

      this.app.on('ui:characterSelect', () => {
        Logger.info('Opening Character Select');
        this.stateStack.push(new CharacterSelectState());
      });

      this.app.on('ui:playerProfile', () => {
        Logger.info('Opening Player Profile');
        // Player profile would be handled by a profile overlay
        // For now, show a placeholder message
        console.log('Player Profile: Stats, progress, and personal data');
      });

      this.app.on('ui:rankings', () => {
        Logger.info('Opening Rankings');
        // Rankings would be handled by the ranked overlay
        if (this.ranked) {
          this.ranked.show();
        }
      });

      this.app.on('ui:achievements', () => {
        Logger.info('Opening Achievements');
        // Achievements would be handled by an achievements overlay
        console.log('Achievements: Personal and social accomplishments');
      });

      this.app.on('ui:replayGallery', () => {
        Logger.info('Opening Replay Gallery');
        // Replay gallery would be handled by the replay service
        if (this.replay) {
          console.log('Replay Gallery: Saved matches and combo videos');
        }
      });

      this.app.on('ui:socialHub', () => {
        Logger.info('Opening Social Hub');
        // Social hub would be handled by social features
        console.log('Social Hub: Guilds, coaching, voice chat, leaderboards');
      });

      this.app.on('ui:customization', () => {
        Logger.info('Opening Customization');
        // Customization would be handled by customization overlay
        console.log('Customization: Character skins, UI themes, control schemes');
      });

      this.app.on('ui:settings', () => {
        Logger.info('Opening Settings');
        // Settings would be handled by the options overlay
        if (this.options) {
          this.options.show();
        }
      });
      try {
        const loader = new ConfigLoader();
        loader.loadJson<any>('/assets/config/fx.json').then(cfg => { if (cfg && this.effects) this.effects.applyConfig(cfg); }).catch(()=>{});
        loader.loadJson<any>('/assets/config/projectiles.json').then(cfg => { /* hook for global projectile mods */ }).catch(()=>{});
      } catch {}
      try { this.i18n = new I18nService(); const saved = (typeof localStorage !== 'undefined' && localStorage.getItem('locale')) || 'en'; await this.i18n.load(saved); this.services.register('i18n', this.i18n); } catch {}
      try { this.cmdList = new CommandListOverlay(); this.cmdList.setCommands([{ name: 'Hadoken', input: 'QCF + P' }, { name: 'Shoryuken', input: 'DP + P' }, { name: 'Tatsumaki', input: 'QCB + K' }, { name: 'Sonic Boom', input: 'Charge back, forward + P' }, { name: 'Flash Kick', input: 'Charge down, up + K' }, { name: 'Command Grab', input: '360 + P' }]); } catch {}
      try { this.options = new OptionsOverlay(this.services); } catch {}
      try { if (this.mmService) { this.lobbies = new LobbiesOverlay(this.mmService); } } catch {}
      try { this.ranked = new RankedOverlay(); } catch {}
      try { this.streaming = new StreamingOverlay(this.app.graphicsDevice.canvas as any); } catch {}
      try { this.replayArchive = new ReplayArchiveOverlay(); this.services.register('replayArchive', this.replayArchive); } catch {}
      try { this.reconnect = new ReconnectOverlay(); } catch {}
      try { this.store = new StoreOverlay(); } catch {}
      try { this.spectator = new SpectatorOverlay(); } catch {}
      try { this.cancelTable = new CancelTableOverlay(); } catch {}
      try {
        this.roundMgr = new RoundManager(3);
        // Listen for match victory from combat
        this.app.on('match:victory', (winnerId: string) => {
          const res = this.roundMgr!.onVictory(winnerId);
          if (res.setWon) {
            // Show rematch UI
            if (!this.rematch) {
              const i18n: any = this.services.resolve('i18n');
              this.rematch = new RematchOverlay(() => this.resetMatch(), () => this.eventBus.emit('state:goto', { state: 'menu' }), i18n || undefined);
            }
            this.rematch.show();
          } else {
            // Reset round only
            this.resetRound();
          }
        });
      } catch {}
      try {
        const net: any = this.services.resolve('netcode');
        new TuningOverlay({
          setLeniency: (ms) => this.inputManager.setMotionLeniency(ms),
          setVol: (vol) => this.sfx?.setVolume?.(vol),
          setSocd: (p) => this.inputManager.setSocdPolicy(p),
          setNegEdge: (ms) => this.inputManager.setNegativeEdgeWindow(ms),
          setJitterBuffer: (f) => { net?.setJitterBuffer?.(f); net?.applyTransportJitterWindow?.(); },
          setLocale: async (locale) => { try { await this.i18n?.load(locale); if (typeof localStorage !== 'undefined') localStorage.setItem('locale', locale); } catch {} }
        });
      } catch {}
      // Wire anti-cheat monitors
      try {
        const ac: any = this.antiCheat;
        ac?.monitorInputRate?.(() => this.inputManager.getPressCount());
        ac?.monitorPhysicsDivergence?.(() => this.combatSystem.getCurrentFrame());
        const net: any = this.services.resolve('netcode');
        ac?.monitorRemoteStateSanity?.(() => net?.getStats?.());
      } catch {}
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
  
  private resetRound(): void {
    try {
      const chars: any = this.services.resolve('characters');
      const list = chars?.getActiveCharacters?.() || [];
      if (list[0] && list[1]) {
        const left = new pc.Vec3(-1.2, 0, 0);
        const right = new pc.Vec3(1.2, 0, 0);
        list[0].entity.setPosition(left); list[1].entity.setPosition(right);
        list[0].health = list[0].maxHealth; list[1].health = list[1].maxHealth;
        list[0].state = 'idle'; list[1].state = 'idle'; list[0].currentMove = list[1].currentMove = null;
      }
    } catch {}
  }
  
  private resetMatch(): void {
    try {
      this.resetRound();
      if (this.roundMgr) this.roundMgr.resetRounds();
    } catch {}
  }
}
