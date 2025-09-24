import * as pc from 'playcanvas';
import { ProceduralStageGenerator } from '../procgen/ProceduralStageGenerator';
import { FighterCameraController } from '../camera/FighterCameraController';
import { EnvironmentManager, EnvironmentTheme } from './EnvironmentManager';

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

    // Procedural stage generation with URL-configurable seed/theme
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const seedParam = params.get('seed');
    const themeParam = params.get('theme') as 'training' | 'gothic' | 'urban' | null;
    // Prefer match-seeded RNG from services; fallback to URL param; final fallback: 1
    let seed = 1;
    try { const net: any = (this.app as any)._services?.resolve?.('netcode'); const st = net?.getStats?.(); if (st && typeof (st as any).cur === 'number') seed = (st as any).cur | 0; } catch {}
    if (seedParam) { const s = parseInt(seedParam, 10); if (isFinite(s)) seed = s; }
    const theme = (themeParam || 'training') as EnvironmentTheme;

    // Build 3D environment first to replace generic gray
    this.env.buildEnvironment(theme);
    const gen = new ProceduralStageGenerator(seed);
    const stageData = gen.generate({ theme });
    try { (await import('../ui/LoadingOverlay')).LoadingOverlay.beginTask('stage_load', `Generating ${theme} stage`, 1); } catch {}
    // Load stage layout synchronously (procedural, no network) to be playable instantly
    await this.parallax.loadStageData(stageData, (p: number, label?: string) => {
      (async () => {
        try { (await import('../ui/LoadingOverlay')).LoadingOverlay.updateTask('stage_load', Math.max(0, Math.min(1, p)), label || `Generating ${theme} stage`); } catch {}
      })();
    });
    try { (await import('../ui/LoadingOverlay')).LoadingOverlay.endTask('stage_load', true); } catch {}

    // Hot-regenerate with keyboard: R to reseed, T to cycle theme
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e: KeyboardEvent) => {
        if (!this.parallax) return;
        if (e.key === 'r' || e.key === 'R') {
          const newSeed = (seed * 1664525 + 1013904223) >>> 0;
          const g = new ProceduralStageGenerator(newSeed);
          const d = g.generate({ theme });
          this.parallax!.loadStageData(d);
        } else if (e.key === 't' || e.key === 'T') {
          const themes: ('training' | 'gothic' | 'urban')[] = ['training', 'gothic', 'urban'];
          const idx = Math.max(0, themes.indexOf(theme));
          const next = themes[(idx + 1) % themes.length];
          const g = new ProceduralStageGenerator(seed);
          const d = g.generate({ theme: next });
          this.parallax!.loadStageData(d);
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

