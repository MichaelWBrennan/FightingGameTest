// Simple spectator stream via BroadcastChannel: publisher posts replay frames; spectators play
import { CombatSystem } from '../combat/CombatSystem';

interface StreamFrame { f: number; p0: any; p1: any }

export class StreamService {
  private chan: BroadcastChannel;
  private playing = false;
  private publishing = false;
  private queue: StreamFrame[] = [];

  constructor(private session: string, private combat: CombatSystem) {
    this.chan = new BroadcastChannel('fg-stream-' + session);
    this.chan.onmessage = (e) => this.onMsg(e.data);
  }

  publish(frame: StreamFrame): void {
    if (!this.publishing) return;
    try { this.chan.postMessage(frame); } catch {}
  }

  startPublishing(): void { this.publishing = true; }
  stopPublishing(): void { this.publishing = false; }

  startPlayback(): void { this.playing = true; this.queue = []; }
  stopPlayback(): void { this.playing = false; this.queue = []; }

  private onMsg(m: any): void {
    if (!this.playing) return;
    if (m && typeof m.f === 'number') this.queue.push(m);
    while (this.queue.length > 0) {
      const fr = this.queue.shift()!;
      try { this.combat.stepWithInputs(fr.p0, fr.p1); } catch {}
    }
  }
}

