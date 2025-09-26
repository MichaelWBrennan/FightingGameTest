import type * as pc from 'playcanvas';
import type { Character } from '../../../types/character';
import type { CharacterManager } from '../characters/CharacterManager';

type Projectile = { x: number; y: number; dir: number; ownerId: string; speed: number; w: number; h: number; life: number };

export class ProjectileManager {
  private list: Projectile[] = [];
  private free: Projectile[] = [];
  private app: pc.Application;
  private chars: CharacterManager;
  private onHit: (owner: Character, defender: Character) => void;

  constructor(app: pc.Application, chars: CharacterManager, onHit: (owner: Character, defender: Character) => void) {
    this.app = app;
    this.chars = chars;
    this.onHit = onHit;
  }

  spawn(owner: Character, speed: number, lifetime: number, w: number, h: number, dir: number): void {
    const p = owner.entity.getPosition();
    const pr = this.free.pop() || { x: 0, y: 0, dir, ownerId: owner.id, speed, w, h, life: lifetime } as Projectile;
    pr.x = p.x + dir * 0.8;
    pr.y = p.y + 1.0;
    pr.dir = dir;
    pr.ownerId = owner.id;
    pr.speed = speed;
    pr.w = w; pr.h = h;
    pr.life = lifetime | 0;
    this.list.push(pr);
    try { const sfx: any = (this.app as any)._services?.resolve?.('sfx'); sfx?.play?.('hadoken'); } catch {}
  }

  spawnFromMove(owner: Character, moveData: any, dir: number): void {
    const meta = moveData?.projectile || { speed: 0.18, lifetime: 90, width: 0.6, height: 0.6 };
    this.spawn(owner, meta.speed || 0.18, (meta.lifetime | 0) || 90, meta.width || 0.6, meta.height || 0.6, dir);
  }

  applyConfig(cfg: any): void {
    // No-op now; per-move metadata already used. Could apply global modifiers (speedScale, sizeScale)
  }

  update(): void {
    if (this.list.length === 0) return;
    const toRemove: number[] = [];
    for (let i = 0; i < this.list.length; i++) {
      const pr = this.list[i];
      pr.x += pr.dir * pr.speed;
      pr.life -= 1;
      if (pr.life <= 0) { toRemove.push(i); continue; }
      // Clash
      for (let j = i + 1; j < this.list.length; j++) {
        const other = this.list[j];
        if (other.ownerId === pr.ownerId) continue;
        if (Math.abs(pr.x - other.x) < Math.max(pr.w, other.w) && Math.abs(pr.y - other.y) < Math.max(pr.h, other.h)) {
          toRemove.push(i); toRemove.push(j);
          try { const fx: any = (this.app as any)._services?.resolve?.('effects'); fx?.spawn?.((pr.x+other.x)*0.5, (pr.y+other.y)*0.5, 'clash'); } catch {}
        }
      }
      // Hit opponent
      const opp = this.chars.getActiveCharacters().find(c => c.id !== pr.ownerId);
      const owner = this.chars.getActiveCharacters().find(c => c.id === pr.ownerId);
      if (opp && owner) {
        const op = opp.entity.getPosition();
        if (Math.abs(pr.x - op.x) < pr.w && Math.abs(pr.y - op.y) < pr.h) {
          this.onHit(owner, opp);
          toRemove.push(i);
        }
      }
    }
    toRemove.sort((a,b)=>b-a);
    let last = -1;
    for (const idx of toRemove) {
      if (idx === last) continue; last = idx;
      if (idx >= 0 && idx < this.list.length) this.free.push(this.list.splice(idx,1)[0]);
    }
  }

  serialize(): any[] {
    return this.list.map(p => ({ x: p.x, y: p.y, dir: p.dir, ownerId: p.ownerId, speed: p.speed, w: p.w, h: p.h, life: p.life }));
  }
  deserialize(arr: any[]): void {
    this.list.length = 0;
    for (const s of (arr || [])) {
      const pr: Projectile = { x: s.x, y: s.y, dir: s.dir, ownerId: s.ownerId, speed: s.speed, w: s.w, h: s.h, life: s.life };
      this.list.push(pr);
    }
  }
}

