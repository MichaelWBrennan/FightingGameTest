import * as pc from 'playcanvas';
import { ProceduralStageGenerator } from '../procgen/ProceduralStageGenerator';
import { FighterCameraController } from '../camera/FighterCameraController';
import type { EnvironmentTheme } from './EnvironmentManager';
import { EnvironmentManager } from './EnvironmentManager';

export class StageManager {
  private app: pc.Application;
  private parallax?: any;
  private env?: EnvironmentManager;

  constructor(app: pc.Application) {
    this.app = app;
  }

  public async initialize(): Promise<void> {
    try { (await import('../ui/LoadingOverlay')).LoadingOverlay.beginTask('stage_camera', 'Creating camera and light', 1); } catch {}
    // Camera — orthographic, centered on fighters, auto-zoom to maintain framing
    const camera = new pc.Entity('MainCamera');
    camera.addComponent('camera', {
      clearColor: new pc.Color(0, 0, 0, 1),
      projection: pc.PROJECTION_ORTHOGRAPHIC,
      orthoHeight: 4.5,
      nearClip: 0.01,
      farClip: 1000
    });
    this.app.root.addChild(camera);
    // Ensure UI screens draw on top by setting camera priority low
    try { (camera as any).camera.priority = 0; } catch {}

    // Attach fighter-style camera logic
    const fighterCam = new FighterCameraController(this.app, camera);
    (camera as any)._fighterCam = fighterCam;
    fighterCam.start();

    // Light
    const light = new pc.Entity('DirectionalLight');
    light.addComponent('light', {
      type: pc.LIGHTTYPE_DIRECTIONAL,
      color: new pc.Color(1, 1, 1),
      intensity: 1.0,
      castShadows: false
    });
    light.setEulerAngles(45, 30, 0);
    this.app.root.addChild(light);
    try { (await import('../ui/LoadingOverlay')).LoadingOverlay.endTask('stage_camera', true); } catch {}

    // 3D Environment system
    try { (await import('../ui/LoadingOverlay')).LoadingOverlay.beginTask('env_init', 'Preparing 3D environment', 1); } catch {}
    this.env = new EnvironmentManager(this.app);
    await this.env.initialize();
    try { (await import('../ui/LoadingOverlay')).LoadingOverlay.endTask('env_init', true); } catch {}

    // Parallax background system (kept for HD-2D layering in front of sky)
    try { (await import('../ui/LoadingOverlay')).LoadingOverlay.beginTask('parallax_init', 'Initializing parallax', 1); } catch {}
    const { default: ParallaxManager } = await import('../../scripts/graphics/ParallaxManager');
    this.parallax = new ParallaxManager(this.app);
    // Initialize parallax quickly with default stage, but do not block match start
    await this.parallax.initialize((p: number, label?: string) => {
      (async () => {
        try { (await import('../ui/LoadingOverlay')).LoadingOverlay.updateTask('parallax_init', Math.max(0, Math.min(1, p)), label || 'Initializing parallax'); } catch {}
      })();
    });
    try { (await import('../ui/LoadingOverlay')).LoadingOverlay.endTask('parallax_init', true); } catch {}

    // Auto-generate a random stage for the match
    const themes = [
      'training', 'urban', 'arcane_tower', 'divine_cathedral', 'elemental_realm',
      'shadow_keep', 'nature_sanctuary', 'crystal_cavern', 'void_dimension',
      'celestial_plane', 'infernal_abyss', 'primal_forest', 'gothic_cathedral',
      'gothic_graveyard', 'gothic_castle', 'gothic_ruins', 'gothic_forest',
      'gothic_laboratory', 'gothic_clocktower'
    ];
    
    const sizes = ['small', 'medium', 'large', 'huge'];
    const atmospheres = ['peaceful', 'tense', 'mysterious', 'epic', 'intimate'];
    const weathers = ['none', 'rain', 'snow', 'fog', 'storm', 'magical'];
    const timesOfDay = ['dawn', 'day', 'dusk', 'night', 'eternal'];
    
    const generationParams = {
      seed: Math.floor(Math.random() * 1000000),
      theme: themes[Math.floor(Math.random() * themes.length)],
      size: sizes[Math.floor(Math.random() * sizes.length)],
      atmosphere: atmospheres[Math.floor(Math.random() * atmospheres.length)],
      hazards: Math.random() > 0.5,
      interactiveElements: Math.floor(Math.random() * 6),
      weather: weathers[Math.floor(Math.random() * weathers.length)],
      timeOfDay: timesOfDay[Math.floor(Math.random() * timesOfDay.length)]
    };

    // Build 3D environment first to replace generic gray
    this.env.buildEnvironment(generationParams.theme as EnvironmentTheme);
    const gen = new ProceduralStageGenerator(generationParams.seed);
    const stageData = gen.generate(generationParams);
    try { (await import('../ui/LoadingOverlay')).LoadingOverlay.beginTask('stage_load', `Generating ${generationParams.theme} stage`, 1); } catch {}
    // Load stage layout synchronously (procedural, no network) to be playable instantly
    await this.parallax.loadStageData(stageData, (p: number, label?: string) => {
      (async () => {
        try { (await import('../ui/LoadingOverlay')).LoadingOverlay.updateTask('stage_load', Math.max(0, Math.min(1, p)), label || `Generating ${generationParams.theme} stage`); } catch {}
      })();
    });
    try { (await import('../ui/LoadingOverlay')).LoadingOverlay.endTask('stage_load', true); } catch {}

    // Store stage data for saving after match
    (this.app as any)._currentStageData = stageData;
    (this.app as any)._currentGenerationParams = generationParams;

    // Hot-regenerate with keyboard: R to reseed
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e: KeyboardEvent) => {
        if (!this.parallax) return;
        if (e.key === 'r' || e.key === 'R') {
          // Regenerate with new random parameters
          const newGenerationParams = {
            seed: Math.floor(Math.random() * 1000000),
            theme: themes[Math.floor(Math.random() * themes.length)],
            size: sizes[Math.floor(Math.random() * sizes.length)],
            atmosphere: atmospheres[Math.floor(Math.random() * atmospheres.length)],
            hazards: Math.random() > 0.5,
            interactiveElements: Math.floor(Math.random() * 6),
            weather: weathers[Math.floor(Math.random() * weathers.length)],
            timeOfDay: timesOfDay[Math.floor(Math.random() * timesOfDay.length)]
          };
          
          const g = new ProceduralStageGenerator(newGenerationParams.seed);
          const d = g.generate(newGenerationParams);
          this.parallax!.loadStageData(d);
          
          // Update stored data
          (this.app as any)._currentStageData = d;
          (this.app as any)._currentGenerationParams = newGenerationParams;
        }
      });
    }
  }

  public async loadTheme(theme: EnvironmentTheme): Promise<void> {
    const seed = Date.now();
    const gen = new ProceduralStageGenerator(seed);
    const stageData = gen.generate({ theme });
    this.env?.buildEnvironment(theme);
    await this.parallax?.loadStageData(stageData);
  }
}

