import * as pc from 'playcanvas';

export class EffectsOverlay {
  private app: pc.Application;
  private pool: pc.Entity[] = [];

  constructor(app: pc.Application) {
    this.app = app;
    for (let i = 0; i < 12; i++) this.pool.push(this.createSpark());
  }

  private createSpark(): pc.Entity {
    const e = new pc.Entity('hitspark');
    e.addComponent('element', { type: 'image', color: new pc.Color(1,1,1,0), anchor: new pc.Vec4(0.5,0.5,0.5,0.5) } as any);
    this.app.root.addChild(e);
    return e;
  }

  spawn(x: number, y: number, kind: 'hit'|'block'|'parry' = 'hit'): void {
    const e = this.pool.pop() || this.createSpark();
    e.enabled = true;
    e.setPosition(x, y, 0);
    const el: any = e.element;
    if (el) {
      if (kind === 'parry') el.color = new pc.Color(0.6,0.8,1,1);
      else if (kind === 'block') el.color = new pc.Color(1,1,0.5,1);
      else el.color = new pc.Color(1,1,1,1);
    }
    setTimeout(() => { try { if (el) el.color = new pc.Color(1,1,1,0); e.enabled = false; this.pool.push(e); } catch {} }, 80);
  }
}

