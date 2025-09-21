import * as pc from 'playcanvas';

export class TrainingOverlay {
  private app: pc.Application;
  private container: HTMLDivElement;
  private inputLabel: HTMLDivElement;
  private statsLabel: HTMLDivElement | null = null;
  private frameDataLabel: HTMLDivElement | null = null;
  private hitboxToggle = false;
  private paused = false;
  private hitboxLayer: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private stepRequested = false;
  private saveState: any | null = null;
  private dummyMode: 'idle'|'block_all'|'block_random'|'reversal' = 'idle';
  private modeLabel: HTMLDivElement | null = null;
  private slots: any[] = [null, null, null];
  private rec: { active: boolean; buf: any[] } = { active: false, buf: [] };

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
    this.statsLabel = document.createElement('div');
    this.container.appendChild(this.statsLabel);
    this.frameDataLabel = document.createElement('div'); this.container.appendChild(this.frameDataLabel);
    this.modeLabel = document.createElement('div');
    this.modeLabel.textContent = 'Dummy: idle';
    this.container.appendChild(this.modeLabel);
    document.body.appendChild(this.container);

    window.addEventListener('keydown', (e) => this.onKey(e));
    this.app.on('update', () => { this.onUpdate(); });

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
    if (e.key === 'F5') this.saveTrainingState();
    if (e.key === 'F6') this.loadTrainingState();
    if (e.key === 'F7') this.cycleDummyMode();
    if (e.key === 'F8') this.resetMid();
    if (e.key === 'F9') this.resetCorner('left');
    // Recording controls
    if (e.key === 'F10') this.toggleRecord();
    if (e.key === 'F11') this.playSlot(0);
    if (e.key === 'F12') this.playSlot(1);
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

  private renderStats(): void {
    if (!this.statsLabel) return;
    try {
      const services: any = (this.app as any)._services;
      const combat = services?.resolve?.('combat');
      const chars = services?.resolve?.('characters');
      const frame = combat?.getCurrentFrame?.() ?? 0;
      const p = chars?.getActiveCharacters?.() || [];
      const p1 = p[0], p2 = p[1];
      const hs = combat?.isInHistop?.() ? 'H' : '';
      this.statsLabel.textContent = `F:${frame}${hs}  P1:${p1?.health ?? '?'}  P2:${p2?.health ?? '?'}`;
      if (this.frameDataLabel && p1) {
        const move = p1.currentMove; const name = move?.name || 'idle';
        const fd = p1.frameData || { startup: 0, active: 0, recovery: 0, advantage: 0 };
        this.frameDataLabel.textContent = `P1 Move: ${name}  S:${fd.startup} A:${fd.active} R:${fd.recovery} Adv:${fd.advantage}`;
      }
    } catch {}
  }

  private onUpdate(): void {
    this.renderInputs(); this.renderStats(); this.renderBoxes();
    // If recording, capture P2 input each frame
    try {
      if (this.rec.active) {
        const services: any = (this.app as any)._services;
        const input = services?.resolve?.('input');
        if (input) {
          const p2 = input.getPlayerInputs(1);
          this.rec.buf.push({ ...p2 });
        }
      }
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
  public setPaused(p: boolean): void { this.paused = !!p; }
  public stepOnce(): void { this.stepRequested = true; }

  get showHitboxes(): boolean { return this.hitboxToggle; }
  get isPaused(): boolean { return this.paused; }
  getDummyMode(): 'idle'|'block_all'|'block_random'|'reversal' { return this.dummyMode; }

  private saveTrainingState(): void {
    try {
      const services: any = (this.app as any)._services;
      const combat = services?.resolve?.('combat');
      const chars = services?.resolve?.('characters');
      if (!combat || !chars) return;
      const frame = combat.getCurrentFrame?.();
      const snapshot = { frame, chars: JSON.stringify(chars.getActiveCharacters?.().map((c: any) => ({ id: c.id, pos: c.entity.getPosition().clone(), health: c.health, meter: c.meter }))) };
      this.saveState = snapshot;
    } catch {}
  }

  private loadTrainingState(): void {
    if (!this.saveState) return;
    try {
      const services: any = (this.app as any)._services;
      const chars = services?.resolve?.('characters');
      const data = JSON.parse(this.saveState.chars);
      const list = chars.getActiveCharacters?.();
      for (const d of data) {
        const c = list.find((x: any) => x.id === d.id);
        if (!c) continue;
        c.entity.setPosition(d.pos);
        c.health = d.health;
        c.meter = d.meter;
        c.state = 'idle';
        c.currentMove = null;
      }
    } catch {}
  }

  private cycleDummyMode(): void {
    const order: Array<'idle'|'block_all'|'block_random'|'reversal'> = ['idle','block_all','block_random','reversal'];
    const idx = order.indexOf(this.dummyMode);
    this.dummyMode = order[(idx + 1) % order.length];
    if (this.modeLabel) this.modeLabel.textContent = `Dummy: ${this.dummyMode}`;
  }

  private toggleRecord(): void {
    if (!this.rec.active) {
      this.rec.active = true; this.rec.buf = [];
      if (this.modeLabel) this.modeLabel.textContent = 'Recording...';
    } else {
      this.rec.active = false;
      this.slots[0] = this.rec.buf.slice();
      if (this.modeLabel) this.modeLabel.textContent = 'Dummy: idle (saved to Slot 1)';
    }
  }

  private playSlot(index: number): void {
    try {
      const seq = this.slots[index];
      if (!seq || seq.length === 0) return;
      const services: any = (this.app as any)._services;
      const input = services?.resolve?.('input');
      input?.startPlaybackForP2?.(seq, true);
    } catch {}
  }

  private resetMid(): void {
    try {
      const services: any = (this.app as any)._services;
      const chars = services?.resolve?.('characters');
      const p = chars?.getActiveCharacters?.() || [];
      if (p[0] && p[1]) {
        const a = p[0].entity.getPosition().clone();
        const b = p[1].entity.getPosition().clone();
        a.x = -1.2; b.x = 1.2; a.y = b.y = 0;
        p[0].entity.setPosition(a); p[1].entity.setPosition(b);
        p[0].state = p[1].state = 'idle'; p[0].currentMove = p[1].currentMove = null;
      }
    } catch {}
  }

  private resetCorner(side: 'left'|'right'): void {
    try {
      const services: any = (this.app as any)._services;
      const chars = services?.resolve?.('characters');
      const p = chars?.getActiveCharacters?.() || [];
      if (p[0] && p[1]) {
        const a = p[0].entity.getPosition().clone();
        const b = p[1].entity.getPosition().clone();
        if (side === 'left') { a.x = -5.4; b.x = -3.8; } else { a.x = 3.8; b.x = 5.4; }
        a.y = b.y = 0;
        p[0].entity.setPosition(a); p[1].entity.setPosition(b);
        p[0].state = p[1].state = 'idle'; p[0].currentMove = p[1].currentMove = null;
      }
    } catch {}
  }
}

