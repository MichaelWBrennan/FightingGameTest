export class FixedClock {
  private accumulator: number = 0;
  private lastTs: number = 0;
  public readonly stepSec: number;

  constructor(fps: number = 60) {
    this.stepSec = 1 / Math.max(1, Math.min(480, Math.floor(fps)));
    this.lastTs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  }

  // returns number of fixed steps to simulate this frame
  tick(): number {
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const deltaMs = Math.max(0, now - this.lastTs);
    this.lastTs = now;
    this.accumulator += deltaMs / 1000;
    const steps = Math.floor(this.accumulator / this.stepSec);
    if (steps > 0) this.accumulator -= steps * this.stepSec;
    // clamp to avoid spiral of death
    return Math.min(steps, 5);
  }

  getAlpha(): number { return Math.max(0, Math.min(1, this.accumulator / this.stepSec)); }
}

