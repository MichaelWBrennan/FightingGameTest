import * as pc from 'playcanvas';

export type EnvironmentTheme = 'training' | 'gothic' | 'urban';

export class EnvironmentManager {
  private app: pc.Application;
  private root: pc.Entity | null = null;

  constructor(app: pc.Application) {
    this.app = app;
  }

  public async initialize(): Promise<void> {
    if (this.root) return;
    this.root = new pc.Entity('EnvironmentRoot');
    this.app.root.addChild(this.root);
  }

  public clear(): void {
    if (!this.root) return;
    const toDestroy = [...this.root.children];
    toDestroy.forEach(child => {
      this.root!.removeChild(child);
      child.destroy();
    });
  }

  public buildEnvironment(theme: EnvironmentTheme): void {
    if (!this.root) return;
    this.clear();

    // Sky
    switch (theme) {
      case 'gothic':
        this.createSkyDome('#243040', '#0d1117');
        break;
      case 'urban':
        this.createSkyDome('#3d4b63', '#101418');
        break;
      default:
        this.createSkyDome('#6fb1ff', '#bfe8ff');
        break;
    }

    // Ground
    if (theme === 'training') {
      this.createTrainingGround();
    } else if (theme === 'gothic') {
      this.createGothicGround();
    } else {
      this.createUrbanGround();
    }

    // Set pieces
    if (theme === 'gothic') {
      this.createGothicSetPieces();
    } else if (theme === 'urban') {
      this.createUrbanSetPieces();
    } else {
      this.createTrainingSetPieces();
    }
  }

  private createSkyDome(topHex: string, bottomHex: string): void {
    const dome = new pc.Entity('SkyDome');
    dome.addComponent('render', { type: 'sphere' });
    const mat = new pc.StandardMaterial();
    // Simple vertical gradient approximation via vertex color lerp in fragment chunk
    (mat as any).chunks = (mat as any).chunks || {};
    (mat as any).chunks.PS_LIGHTING = `
    varying vec2 vUv0;
    void getLightDir(){}
    void getLightDiffuse(){}
    void getLightSpecular(){}
    void addAmbient(vec3 color){}
    void addReflection(vec3 color){}
    void getNormal(){}
    void getViewDir(){}
    void main(void){
      vec3 top = vec3(${this.hexToRgb(topHex)});
      vec3 bot = vec3(${this.hexToRgb(bottomHex)});
      float t = clamp((vPositionW.y + 50.0) / 100.0, 0.0, 1.0);
      dAlbedo = mix(bot, top, t);
    }`;
    mat.cull = pc.CULLFACE_FRONT; // render inside of sphere
    mat.useLighting = false as unknown as boolean;
    mat.update();
    dome.render!.material = mat as unknown as pc.Material;
    dome.setLocalScale(200, 200, 200);
    dome.setLocalPosition(0, 0, -60);
    this.root!.addChild(dome);
  }

  private createTrainingGround(): void {
    const ground = new pc.Entity('TrainingGround');
    ground.addComponent('render', { type: 'box' });
    const mat = new pc.StandardMaterial();
    mat.diffuse = new pc.Color(0.85, 0.9, 0.95);
    mat.metalness = 0;
    mat.useMetalness = true;
    mat.update();
    ground.render!.material = mat as unknown as pc.Material;
    ground.setLocalScale(100, 0.2, 30);
    ground.setLocalPosition(0, -1.0, -5);
    this.root!.addChild(ground);

    // Grid lines
    for (let i = -20; i <= 20; i++) {
      const line = new pc.Entity(`GridLine_${i}`);
      line.addComponent('render', { type: 'box' });
      const lmat = new pc.StandardMaterial();
      lmat.emissive = new pc.Color(0.75, 0.85, 1.0);
      lmat.useLighting = false as unknown as boolean;
      lmat.update();
      line.render!.material = lmat as unknown as pc.Material;
      line.setLocalScale(0.02, 0.21, 30);
      line.setLocalPosition(i * 2, -0.995, -5);
      this.root!.addChild(line);
    }
  }

  private createGothicGround(): void {
    const plane = new pc.Entity('GothicCobblestone');
    plane.addComponent('render', { type: 'box' });
    const mat = new pc.StandardMaterial();
    mat.diffuse = new pc.Color(0.35, 0.35, 0.42);
    mat.gloss = 0.25 as unknown as number;
    mat.metalness = 0.05;
    mat.useMetalness = true;
    mat.update();
    plane.render!.material = mat as unknown as pc.Material;
    plane.setLocalScale(100, 0.25, 30);
    plane.setLocalPosition(0, -1.0, -5);
    this.root!.addChild(plane);
  }

  private createUrbanGround(): void {
    const asphalt = new pc.Entity('UrbanAsphalt');
    asphalt.addComponent('render', { type: 'box' });
    const mat = new pc.StandardMaterial();
    mat.diffuse = new pc.Color(0.12, 0.12, 0.14);
    mat.gloss = 0.15 as unknown as number;
    mat.metalness = 0.02;
    mat.useMetalness = true;
    mat.update();
    asphalt.render!.material = mat as unknown as pc.Material;
    asphalt.setLocalScale(120, 0.2, 40);
    asphalt.setLocalPosition(0, -1.0, -5);
    this.root!.addChild(asphalt);

    // Lane stripes
    for (let i = -2; i <= 2; i++) {
      const stripe = new pc.Entity(`LaneStripe_${i}`);
      stripe.addComponent('render', { type: 'box' });
      const smat = new pc.StandardMaterial();
      smat.emissive = new pc.Color(0.95, 0.9, 0.4);
      smat.useLighting = false as unknown as boolean;
      smat.update();
      stripe.render!.material = smat as unknown as pc.Material;
      stripe.setLocalScale(10, 0.201, 0.3);
      stripe.setLocalPosition(-25 + i * 20, -0.999, -5);
      this.root!.addChild(stripe);
    }
  }

  private createGothicSetPieces(): void {
    // Pillars
    for (let i = -3; i <= 3; i++) {
      const pillar = new pc.Entity(`Pillar_${i}`);
      pillar.addComponent('render', { type: 'cylinder' });
      const mat = new pc.StandardMaterial();
      mat.diffuse = new pc.Color(0.45, 0.45, 0.5);
      mat.update();
      pillar.render!.material = mat as unknown as pc.Material;
      pillar.setLocalScale(0.8, 6.0, 0.8);
      pillar.setLocalPosition(i * 6, 2.0, -15 - Math.abs(i) * 2);
      this.root!.addChild(pillar);
    }

    // Arches (boxes approximating)
    for (let i = -2; i <= 2; i++) {
      const arch = new pc.Entity(`Arch_${i}`);
      arch.addComponent('render', { type: 'box' });
      const mat = new pc.StandardMaterial();
      mat.diffuse = new pc.Color(0.40, 0.42, 0.50);
      mat.update();
      arch.render!.material = mat as unknown as pc.Material;
      arch.setLocalScale(8.0, 0.6, 2.0);
      arch.setLocalPosition(i * 10, 5.0, -22);
      this.root!.addChild(arch);
    }
  }

  private createUrbanSetPieces(): void {
    // Skyline blocks
    const rng = (i: number) => 40 + Math.abs(i) * 6;
    for (let i = -4; i <= 4; i++) {
      const b = new pc.Entity(`Building_${i}`);
      b.addComponent('render', { type: 'box' });
      const mat = new pc.StandardMaterial();
      mat.diffuse = new pc.Color(0.18 + Math.random() * 0.1, 0.2 + Math.random() * 0.1, 0.25 + Math.random() * 0.1);
      mat.update();
      b.render!.material = mat as unknown as pc.Material;
      b.setLocalScale(6 + Math.random() * 4, rng(i), 6 + Math.random() * 4);
      b.setLocalPosition(i * 10, rng(i) * 0.5 - 1.0, -30 - Math.abs(i) * 2);
      this.root!.addChild(b);
    }
  }

  private createTrainingSetPieces(): void {
    // Side walls
    for (let side = -1; side <= 1; side += 2) {
      const wall = new pc.Entity(`Wall_${side}`);
      wall.addComponent('render', { type: 'box' });
      const mat = new pc.StandardMaterial();
      mat.diffuse = new pc.Color(0.85, 0.9, 0.95);
      mat.update();
      wall.render!.material = mat as unknown as pc.Material;
      wall.setLocalScale(2, 3, 26);
      wall.setLocalPosition(20 * side, 0.5, -10);
      this.root!.addChild(wall);
    }

    // Ceiling lights
    // iOS Safari exhibits stability issues in PlayCanvas lighting array splitting under some conditions.
    // Avoid adding multiple spotlights on iOS to prevent _splitLightsArray failures.
    try {
      const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
      const isIOS = /iPhone|iPad|iPod/i.test(ua);
      const allowSpotlights = !isIOS;
      if (allowSpotlights) {
        for (let i = -3; i <= 3; i++) {
          const lamp = new pc.Entity(`Lamp_${i}`);
          lamp.addComponent('light', {
            type: pc.LIGHTTYPE_SPOT,
            color: new pc.Color(0.95, 0.98, 1.0),
            intensity: 0.6,
            range: 20,
            innerConeAngle: 40,
            outerConeAngle: 60,
            castShadows: false
          });
          lamp.setLocalPosition(i * 6, 8, -10);
          lamp.setEulerAngles(45, 0, 0);
          this.root!.addChild(lamp);
        }
      } else {
        // Fallback: a single gentle directional to keep scene lit
        const fill = new pc.Entity('IOS_FillLight');
        fill.addComponent('light', {
          type: pc.LIGHTTYPE_DIRECTIONAL,
          color: new pc.Color(0.9, 0.95, 1.0),
          intensity: 0.6,
          castShadows: false
        });
        fill.setEulerAngles(60, 15, 0);
        this.root!.addChild(fill);
      }
    } catch {
      // If UA parsing fails, default to adding lights as usual
      for (let i = -3; i <= 3; i++) {
        const lamp = new pc.Entity(`Lamp_${i}`);
        lamp.addComponent('light', {
          type: pc.LIGHTTYPE_SPOT,
          color: new pc.Color(0.95, 0.98, 1.0),
          intensity: 0.6,
          range: 20,
          innerConeAngle: 40,
          outerConeAngle: 60,
          castShadows: false
        });
        lamp.setLocalPosition(i * 6, 8, -10);
        lamp.setEulerAngles(45, 0, 0);
        this.root!.addChild(lamp);
      }
    }
  }

  private hexToRgb(hex: string): string {
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${(r/255).toFixed(4)}, ${(g/255).toFixed(4)}, ${(b/255).toFixed(4)}`;
  }
}

