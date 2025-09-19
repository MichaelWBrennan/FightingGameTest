import * as pc from 'playcanvas';

export class TrainingOverlay {
  private app: pc.Application;
  private container: HTMLDivElement;
  private inputLabel: HTMLDivElement;
  private hitboxToggle = false;
  private paused = false;
  private hitboxLayer: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private stepRequested = false;

  constructor(app: pc.Application) {
    this.app = app;
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.bottom = '8px';
    this.container.style.left = '8px';
    this.container.style.background = 'rgba(0,0,0,0.5)';
    this.container.style.color = '#fff';
    this.container.style.font = '12px monospace';
    this.container.style.padding = '6px 8px';
    this.container.style.borderRadius = '4px';
    this.container.style.zIndex = '10002';
    this.inputLabel = document.createElement('div');
    this.container.appendChild(this.inputLabel);
    document.body.appendChild(this.container);

    window.addEventListener('keydown', (e) => this.onKey(e));
    this.app.on('update', () => { this.renderInputs(); this.renderBoxes(); });

    // Overlay canvas for hitbox rendering
    this.hitboxLayer = document.createElement('canvas');
    this.hitboxLayer.style.position = 'fixed';
    this.hitboxLayer.style.left = '0';
    this.hitboxLayer.style.top = '0';
    this.hitboxLayer.style.right = '0';
    this.hitboxLayer.style.bottom = '0';
    this.hitboxLayer.style.pointerEvents = 'none';
    this.hitboxLayer.style.zIndex = '10001';
    document.body.appendChild(this.hitboxLayer);
    this.ctx = this.hitboxLayer.getContext('2d');
  }

  private onKey(e: KeyboardEvent): void {
    if (e.key === 'F2') this.hitboxToggle = !this.hitboxToggle;
    if (e.key === 'F3') this.paused = !this.paused;
    if (e.key === 'F4') this.stepRequested = true;
  }

  private renderInputs(): void {
    try {
      const services: any = (this.app as any)._services;
      const input = services?.resolve?.('input');
      if (!input) return;
      const p1 = input.getPlayerInputs(0);
      this.inputLabel.textContent = `P1: ${['up','down','left','right','lightPunch','mediumPunch','heavyPunch','lightKick','mediumKick','heavyKick']
        .filter(k => (p1 as any)[k]).join(' ')}`;
    } catch {}
  }

  private renderBoxes(): void {
    if (!this.hitboxToggle || !this.hitboxLayer || !this.ctx) return;
    const w = window.innerWidth, h = window.innerHeight;
    if (this.hitboxLayer.width !== w) this.hitboxLayer.width = w;
    if (this.hitboxLayer.height !== h) this.hitboxLayer.height = h;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);
    try {
      const services: any = (this.app as any)._services;
      const chars = services?.resolve?.('characters');
      const list = chars?.getActiveCharacters?.() || [];
      const cam = this.app.root.findByName('MainCamera');
      if (!cam || !cam.camera) return;
      const worldToScreen = (vx: number, vy: number, vz: number) => {
        const p = new pc.Vec3(vx, vy, vz);
        const out = new pc.Vec3();
        cam.camera.worldToScreen(p, out);
        return { x: out.x, y: h - out.y };
      };
      for (const ch of list) {
        const pos = ch.entity.getPosition();
        const cfg: any = ch.config;
        const key = ch.currentMove ? `move_${ch.currentMove.name}` : 'idle';
        const frames = cfg.animations?.[key]?.frames as any[] | undefined;
        const idx = ch.currentMove ? Math.max(0, Math.min((frames?.length || 1) - 1, ch.currentMove.currentFrame | 0)) : 0;
        const fr = frames && frames[idx];
        const hit = (fr?.hitboxes || []) as any[];
        const hurt = (fr?.hurtboxes || [{ x:-0.4, y:0, width:0.8, height:1.6 }]) as any[];
        // draw hurtboxes (blue)
        ctx.strokeStyle = 'rgba(80,160,255,0.9)';
        for (const hu of hurt) {
          const p0 = worldToScreen(pos.x + hu.x, pos.y + hu.y, pos.z);
          const p1 = worldToScreen(pos.x + hu.x + hu.width, pos.y + hu.y + hu.height, pos.z);
          const x = Math.min(p0.x, p1.x), y = Math.min(p0.y, p1.y);
          const ww = Math.abs(p1.x - p0.x), hh = Math.abs(p1.y - p0.y);
          ctx.strokeRect(x, y, ww, hh);
        }
        // draw hitboxes (red)
        ctx.strokeStyle = 'rgba(255,80,80,0.9)';
        for (const hb of hit) {
          const p0 = worldToScreen(pos.x + hb.x, pos.y + hb.y, pos.z);
          const p1 = worldToScreen(pos.x + hb.x + hb.width, pos.y + hb.y + hb.height, pos.z);
          const x = Math.min(p0.x, p1.x), y = Math.min(p0.y, p1.y);
          const ww = Math.abs(p1.x - p0.x), hh = Math.abs(p1.y - p0.y);
          ctx.strokeRect(x, y, ww, hh);
        }
      }
    } catch {}
  }

  consumeStep(): boolean { const s = this.stepRequested; this.stepRequested = false; return s; }

  get showHitboxes(): boolean { return this.hitboxToggle; }
  get isPaused(): boolean { return this.paused; }
}

