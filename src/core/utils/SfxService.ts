export class SfxService {
  private buffers: Map<string, HTMLAudioElement> = new Map();
  private volume = 0.9;
  private duck = 1.0;
  private busGain: Record<'master'|'sfx'|'ui', number> = { master: 1.0, sfx: 1.0, ui: 1.0 };
  private priorities: Record<string, number> = {};

  preload(map: Record<string, string>): void {
    Object.entries(map).forEach(([k, url]) => {
      const a = new Audio(); a.src = url; a.preload = 'auto'; a.volume = this.volume; this.buffers.set(k, a);
    });
  }

  setVolume(vol: number): void { this.volume = Math.max(0, Math.min(1, vol)); this.buffers.forEach(a => a.volume = this.volume); }

  play(key: string, bus: 'sfx'|'ui' = 'sfx', priority: number = 0): void {
    const a = this.buffers.get(key);
    if (!a) return;
    try {
      const inst = new Audio(a.src);
      const busVol = this.busGain[bus] ?? 1.0;
      inst.volume = Math.max(0, Math.min(1, this.volume * this.duck * busVol));
      inst.play().catch(()=>{});
    } catch {}
  }

  setDuck(active: boolean): void { this.duck = active ? 0.6 : 1.0; }

  setBusVolume(bus: 'master'|'sfx'|'ui', vol: number): void { this.busGain[bus] = Math.max(0, Math.min(1, vol)); }
  setPriority(key: string, prio: number): void { this.priorities[key] = prio; }
}

