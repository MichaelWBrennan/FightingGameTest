import * as pc from 'playcanvas';

export class FighterCameraController {
  private app: pc.Application;
  private cameraEntity: pc.Entity;
  private currentCenterX = 0;
  private targetCenterX = 0;
  private currentOrthoHeight = 4.5;
  private targetOrthoHeight = 4.5;
  private centerSmoothing = 0.18;
  private zoomSmoothing = 0.18;
  private horizontalMargin = 1.6;
  private minOrthoHeight = 3.6;
  private maxOrthoHeight = 9.0;
  private cameraY = 1.6;
  private cameraZ = 10.0;
  private updateHandler: ((dt: number) => void) | null = null;
  private resizeHandler: (() => void) | null = null;

  constructor(app: pc.Application, cameraEntity: pc.Entity) {
    this.app = app;
    this.cameraEntity = cameraEntity;

    // UA-aware defaults (slightly wider view on mobile)
    try {
      const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
      const isMobile = /Android|iPhone|iPad|iPod|Mobile|IEMobile|BlackBerry|Opera Mini/i.test(ua) || (typeof window !== 'undefined' && Math.min(window.innerWidth, window.innerHeight) <= 768);
      if (isMobile) {
        this.horizontalMargin = 2.1;
        this.minOrthoHeight = 4.2;
        this.maxOrthoHeight = 10.5;
        this.cameraY = 1.8;
        this.cameraZ = 11.5;
        this.centerSmoothing = 0.22;
        this.zoomSmoothing = 0.22;
      }
    } catch {}
  }

  public start(): void {
    // Ensure orthographic projection
    if (this.cameraEntity.camera) {
      this.cameraEntity.camera.projection = pc.PROJECTION_ORTHOGRAPHIC;
      const aspect = this.getAspectRatio();
      this.currentOrthoHeight = this.clamp(4.5, this.minOrthoHeight, this.maxOrthoHeight);
      this.targetOrthoHeight = this.currentOrthoHeight;
      this.cameraEntity.camera.orthoHeight = this.currentOrthoHeight;
    }
    // Place camera in front of the stage, looking towards -Z
    this.cameraEntity.setPosition(this.currentCenterX, this.cameraY, this.cameraZ);
    this.cameraEntity.lookAt(this.currentCenterX, this.cameraY, 0);

    this.updateHandler = (dt: number) => this.update(dt);
    this.app.on('update', this.updateHandler);

    this.resizeHandler = () => this.onResize();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.resizeHandler);
    }
  }

  public destroy(): void {
    if (this.updateHandler) this.app.off('update', this.updateHandler);
    if (this.resizeHandler && typeof window !== 'undefined') window.removeEventListener('resize', this.resizeHandler);
  }

  private update(dt: number): void {
    const targets = this.getTargetEntities();

    // Compute desired center X and zoom to fit targets
    if (targets.length > 0) {
      const xs = targets.map(t => t.getPosition().x).sort((a, b) => a - b);
      const minX = xs[0];
      const maxX = xs[xs.length - 1];
      const midpointX = (minX + maxX) * 0.5;
      const distanceX = Math.max(0.01, Math.abs(maxX - minX));

      const aspect = this.getAspectRatio();
      const desiredWorldWidth = distanceX + this.horizontalMargin * 2.0;
      const desiredOrthoHeight = this.clamp((desiredWorldWidth * 0.5) / Math.max(0.01, aspect), this.minOrthoHeight, this.maxOrthoHeight);

      this.targetCenterX = midpointX;
      this.targetOrthoHeight = desiredOrthoHeight;
    }

    // Smoothly approach targets
    this.currentCenterX = this.lerp(this.currentCenterX, this.targetCenterX, this.centerSmoothing);
    this.currentOrthoHeight = this.lerp(this.currentOrthoHeight, this.targetOrthoHeight, this.zoomSmoothing);

    // Apply to camera
    if (this.cameraEntity.camera) {
      this.cameraEntity.camera.orthoHeight = this.currentOrthoHeight;
    }
    this.cameraEntity.setPosition(this.currentCenterX, this.cameraY, this.cameraZ);
    this.cameraEntity.lookAt(this.currentCenterX, this.cameraY, 0);
  }

  private onResize(): void {
    // Recompute target ortho height instantly on resize to prevent visible popping
    const targets = this.getTargetEntities();
    const aspect = this.getAspectRatio();
    if (targets.length > 0) {
      const xs = targets.map(t => t.getPosition().x).sort((a, b) => a - b);
      const minX = xs[0];
      const maxX = xs[xs.length - 1];
      const distanceX = Math.max(0.01, Math.abs(maxX - minX));
      const desiredWorldWidth = distanceX + this.horizontalMargin * 2.0;
      const desiredOrthoHeight = this.clamp((desiredWorldWidth * 0.5) / Math.max(0.01, aspect), this.minOrthoHeight, this.maxOrthoHeight);
      this.currentOrthoHeight = desiredOrthoHeight;
      if (this.cameraEntity.camera) this.cameraEntity.camera.orthoHeight = this.currentOrthoHeight;
    }
  }

  private getTargetEntities(): pc.Entity[] {
    // Prefer the CharacterManager's active characters
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const services = (this.app as any)._services as any;
      const chars = services?.resolve?.('characters');
      if (chars && typeof chars.getActiveCharacters === 'function') {
        const list = chars.getActiveCharacters() as Array<{ entity: pc.Entity }>;
        return list.map(c => c.entity).filter(Boolean);
      }
    } catch {}
    return [];
  }

  private getAspectRatio(): number {
    try {
      const gd: any = this.app.graphicsDevice as any;
      const w = gd.width || (gd.canvas ? gd.canvas.width : 1280);
      const h = gd.height || (gd.canvas ? gd.canvas.height : 720);
      return Math.max(0.01, w / Math.max(1, h));
    } catch {
      return 16 / 9;
    }
  }

  private lerp(a: number, b: number, t: number): number {
    const clamped = Math.max(0, Math.min(1, t));
    return a + (b - a) * clamped;
  }

  private clamp(v: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, v));
  }
}

