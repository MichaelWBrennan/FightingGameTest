export class SfxService {
  private buffers: Map<string, HTMLAudioElement> = new Map();
  private volume = 0.9;
  private duck = 1.0;

  preload(map: Record<string, string>): void {
    Object.entries(map).forEach(([k, url]) => {
      const a = new Audio(); a.src = url; a.preload = 'auto'; a.volume = this.volume; this.buffers.set(k, a);
    });
  }

  setVolume(vol: number): void { this.volume = Math.max(0, Math.min(1, vol)); this.buffers.forEach(a => a.volume = this.volume); }

  play(key: string): void {
    const a = this.buffers.get(key);
    if (!a) return;
    try {
      const inst = new Audio(a.src);
      inst.volume = Math.max(0, Math.min(1, this.volume * this.duck));
      inst.play().catch(()=>{});
    } catch {}
  }

  setDuck(active: boolean): void { this.duck = active ? 0.6 : 1.0; }
}

