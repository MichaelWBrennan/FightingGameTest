import * as pc from 'playcanvas';
import ParallaxManager from '../../scripts/graphics/ParallaxManager';
import { ProceduralStageGenerator } from '../procgen/ProceduralStageGenerator';

export class StageManager {
  private app: pc.Application;
  private parallax?: ParallaxManager;

  constructor(app: pc.Application) {
    this.app = app;
  }

  public async initialize(): Promise<void> {
    try { (await import('../ui/LoadingOverlay')).LoadingOverlay.beginTask('stage_camera', 'Creating camera and light', 1); } catch {}
    // Camera
    const camera = new pc.Entity('MainCamera');
    camera.addComponent('camera', {
      clearColor: new pc.Color(0, 0, 0),
      fov: 55,
      nearClip: 0.1,
      farClip: 1000
    });
    camera.setPosition(0, 2, 10);
    camera.lookAt(0, 1, 0);
    this.app.root.addChild(camera);

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

    // Parallax background system
    try { (await import('../ui/LoadingOverlay')).LoadingOverlay.beginTask('parallax_init', 'Initializing parallax', 1); } catch {}
    this.parallax = new ParallaxManager(this.app);
    await this.parallax.initialize();
    try { (await import('../ui/LoadingOverlay')).LoadingOverlay.endTask('parallax_init', true); } catch {}

    // Procedural stage generation with URL-configurable seed/theme
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const seedParam = params.get('seed');
    const themeParam = params.get('theme') as 'training' | 'gothic' | 'urban' | null;
    const seed = seedParam ? parseInt(seedParam, 10) : Date.now();
    const theme = themeParam || 'training';

    const gen = new ProceduralStageGenerator(seed);
    const stageData = gen.generate({ theme });
    try { (await import('../ui/LoadingOverlay')).LoadingOverlay.beginTask('stage_load', `Generating ${theme} stage`, 1); } catch {}
    await this.parallax.loadStageData(stageData);
    try { (await import('../ui/LoadingOverlay')).LoadingOverlay.endTask('stage_load', true); } catch {}

    // Hot-regenerate with keyboard: R to reseed, T to cycle theme
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e: KeyboardEvent) => {
        if (!this.parallax) return;
        if (e.key === 'r' || e.key === 'R') {
          const newSeed = Date.now();
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
}

