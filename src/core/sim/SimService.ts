export class SimService {
  constructor(private gravity = 0.012, private airFriction = 0.98, private bounceFactor = 0.42) {}
  computeAirborne(items: Array<{ x:number; y:number; vx:number; vy:number }>): Array<{ x:number; y:number; vx:number; vy:number; grounded:boolean }> {
    const out: Array<{ x:number; y:number; vx:number; vy:number; grounded:boolean }> = [];
    for (const it of items) {
      let vx = it.vx || 0; let vy = it.vy || 0; let x = it.x || 0; let y = it.y || 0; let grounded = false;
      vy = vy - this.gravity; vx = vx * this.airFriction; x += vx; y += vy;
      if (y <= 0) { y = 0; if (Math.abs(vy) > 0.08) { vy = -vy * this.bounceFactor; } else { vy = 0; grounded = true; } }
      out.push({ x, y, vx, vy, grounded });
    }
    return out;
  }
}

