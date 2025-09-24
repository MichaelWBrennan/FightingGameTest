export class RngService {
  private stateA: number;
  private stateB: number;
  private stateC: number;
  private stateD: number;

  constructor(seed: number = 0x9e3779b9) {
    const s = (seed >>> 0) || 0x9e3779b9;
    // SplitMix-like seed expansion to fill 128-bit state
    let x = s >>> 0;
    function mix(v: number): number {
      v = (v + 0x9e3779b9) >>> 0;
      v ^= v >>> 16; v = Math.imul(v, 0x21f0aaad) >>> 0;
      v ^= v >>> 15; v = Math.imul(v, 0x735a2d97) >>> 0;
      v ^= v >>> 15; return v >>> 0;
    }
    this.stateA = mix(x);
    this.stateB = mix(this.stateA);
    this.stateC = mix(this.stateB);
    this.stateD = mix(this.stateC);
  }

  // xoshiro128** style RNG producing 32-bit int
  nextInt(): number {
    let a = this.stateA | 0;
    let b = this.stateB | 0;
    let c = this.stateC | 0;
    let d = this.stateD | 0;
    const t = (b << 9) >>> 0;
    let result = Math.imul((b * 5) >>> 0, 0x7ffff) >>> 0;
    result = ((result << 7) | (result >>> 25)) >>> 0;
    result = Math.imul(result, 9) >>> 0;

    c ^= a; d ^= b; b ^= c; a ^= d;
    c ^= t;
    d = (d << 11) | (d >>> 21);
    this.stateA = a >>> 0; this.stateB = b >>> 0; this.stateC = c >>> 0; this.stateD = d >>> 0;
    return result >>> 0;
  }

  nextFloat(): number {
    return (this.nextInt() >>> 8) / 16777216; // 24-bit mantissa
  }

  reseed(seed: number): void {
    const s = (seed >>> 0) || 1;
    let x = s >>> 0;
    const mix = (v: number) => {
      v = (v + 0x9e3779b9) >>> 0;
      v ^= v >>> 16; v = Math.imul(v, 0x21f0aaad) >>> 0;
      v ^= v >>> 15; v = Math.imul(v, 0x735a2d97) >>> 0;
      v ^= v >>> 15; return v >>> 0;
    };
    this.stateA = mix(x);
    this.stateB = mix(this.stateA);
    this.stateC = mix(this.stateB);
    this.stateD = mix(this.stateC);
  }
}

