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

  spawn(x: number, y: number): void {
    const e = this.pool.pop() || this.createSpark();
    e.enabled = true;
    e.setPosition(x, y, 0);
    const el: any = e.element;
    if (el) el.color = new pc.Color(1,1,1,1);
    setTimeout(() => { try { if (el) el.color = new pc.Color(1,1,1,0); e.enabled = false; this.pool.push(e); } catch {} }, 80);
  }
}

