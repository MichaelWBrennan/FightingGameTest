import * as pc from 'playcanvas';

export class EffectsOverlay {
  private app: pc.Application;
  private pool: pc.Entity[] = [];
  private config: Record<string, { color: pc.Color; size: number; life: number }> = {
    hit: { color: new pc.Color(1,1,1,1), size: 1.0, life: 80 },
    block: { color: new pc.Color(1,1,0.5,1), size: 1.0, life: 80 },
    parry: { color: new pc.Color(0.6,0.8,1,1), size: 1.2, life: 90 },
    clash: { color: new pc.Color(1,0.7,0.2,1), size: 1.1, life: 70 },
    counter: { color: new pc.Color(1,0.3,0.3,1), size: 1.25, life: 95 },
    light: { color: new pc.Color(0.9,0.9,1,1), size: 0.9, life: 70 },
    medium: { color: new pc.Color(1,0.85,0.6,1), size: 1.1, life: 80 },
    heavy: { color: new pc.Color(1,0.6,0.4,1), size: 1.3, life: 90 },
    guardcrush: { color: new pc.Color(1,0.2,0.2,1), size: 1.35, life: 110 }
  };

  constructor(app: pc.Application) {
    this.app = app;
    for (let i = 0; i < 12; i++) this.pool.push(this.createSpark());
    // Afterimage canvas layer (simple trails demo)
    try {
      const canvas = document.createElement('canvas');
      canvas.style.position = 'fixed'; canvas.style.left = '0'; canvas.style.top = '0'; canvas.style.pointerEvents = 'none'; canvas.style.zIndex = '9998';
      document.body.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
      window.addEventListener('resize', resize); resize();
      let last = performance.now();
      const tick = () => {
        const now = performance.now(); const dt = now - last; last = now;
        if (ctx) { ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0,0,canvas.width,canvas.height); }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch {}
  }

  private createSpark(): pc.Entity {
    const e = new pc.Entity('hitspark');
    e.addComponent('element', { type: 'image', color: new pc.Color(1,1,1,0), anchor: new pc.Vec4(0.5,0.5,0.5,0.5) } as any);
    this.app.root.addChild(e);
    return e;
  }

  spawn(x: number, y: number, kind: 'hit'|'block'|'parry'|'clash'|'counter'|'light'|'medium'|'heavy'|'guardcrush' = 'hit'): void {
    const e = this.pool.pop() || this.createSpark();
    e.enabled = true;
    e.setPosition(x, y, 0);
    const el: any = e.element;
    const cfg = this.config[kind];
    if (el) {
      el.color = cfg.color;
      el.width = 32 * cfg.size; el.height = 32 * cfg.size;
    }
    setTimeout(() => { try { if (el) el.color = new pc.Color(1,1,1,0); e.enabled = false; this.pool.push(e); } catch {} }, cfg.life);
  }

  applyConfig(raw: any): void {
    try {
      const next: any = {};
      Object.keys(this.config).forEach(k => {
        const src = raw?.[k];
        if (src) next[k] = { color: new pc.Color(src.r ?? 1, src.g ?? 1, src.b ?? 1, 1), size: src.size ?? this.config[k].size, life: src.life ?? this.config[k].life };
        else next[k] = this.config[k];
      });
      this.config = next;
    } catch {}
  }
}

