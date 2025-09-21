export class SfxService {
  private buffers: Map<string, HTMLAudioElement> = new Map();
  private volume = 0.9;
  private duck = 1.0;
  private busGain: Record<'master'|'sfx'|'ui', number> = { master: 1.0, sfx: 1.0, ui: 1.0 };
  private priorities: Record<string, number> = {};
  private scheduled: Map<string, { frame: number; key: string; bus: 'sfx'|'ui'; prio: number }[]> = new Map();
  private pool: HTMLAudioElement[] = [];

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
      const inst = this.acquire(a.src);
      const busVol = this.busGain[bus] ?? 1.0;
      inst.volume = Math.max(0, Math.min(1, this.volume * this.duck * busVol));
      inst.onended = () => { try { this.release(inst); } catch {} };
      inst.play().catch(()=>{ try { this.release(inst); } catch {} });
    } catch {}
  }

  setDuck(active: boolean): void { this.duck = active ? 0.6 : 1.0; }

  setBusVolume(bus: 'master'|'sfx'|'ui', vol: number): void { this.busGain[bus] = Math.max(0, Math.min(1, vol)); }
  setPriority(key: string, prio: number): void { this.priorities[key] = prio; }

  vibrate(ms: number = 20): void {
    try {
      if (typeof navigator !== 'undefined' && (navigator as any).vibrate) (navigator as any).vibrate(ms);
    } catch {}
    try {
      const pads = (window as any).pc?.Application?.getApplication?.().gamepads?.pads as any[];
      const pad = pads && pads[0];
      if (pad && pad.vibrationActuator) pad.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: 0.4, weakMagnitude: 0.6 });
    } catch {}
  }

  // Optional deterministic scheduling API for rollback friendliness
  playDeterministic(instanceId: string, frame: number, key: string, bus: 'sfx'|'ui' = 'sfx', priority: number = 0): void {
    const arr = this.scheduled.get(instanceId) || [];
    arr.push({ frame, key, bus, prio: priority });
    this.scheduled.set(instanceId, arr);
  }

  // Called by the game loop with current frame to emit any due sounds deterministically
  flushScheduled(frame: number): void {
    try {
      for (const [id, list] of Array.from(this.scheduled.entries())) {
        const due = list.filter(it => it.frame === frame);
        // Deduplicate by key per frame, keep highest priority
        const best: Record<string, { bus: 'sfx'|'ui'; prio: number }> = {} as any;
        for (const it of due) {
          const prev = best[it.key];
          if (!prev || it.prio > prev.prio) best[it.key] = { bus: it.bus, prio: it.prio };
        }
        Object.keys(best).forEach(k => this.play(k, best[k].bus, best[k].prio));
        // Clean emitted items
        const remaining = list.filter(it => it.frame > frame);
        if (remaining.length > 0) this.scheduled.set(id, remaining); else this.scheduled.delete(id);
      }
    } catch {}
  }

  private acquire(src: string): HTMLAudioElement {
    const inst = this.pool.pop() || new Audio();
    inst.src = src;
    inst.preload = 'auto';
    return inst;
  }
  private release(a: HTMLAudioElement): void {
    a.onended = null;
    a.src = '';
    if (this.pool.length < 32) this.pool.push(a);
  }
}

