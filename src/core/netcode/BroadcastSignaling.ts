export class BroadcastSignaling {
  private chan: BroadcastChannel;
  private session: string;
  private callbacks: Array<(s: any) => void> = [];
  // Spectator stream channel (optional)
  private stream?: BroadcastChannel;

  constructor(sessionId: string) {
    this.session = sessionId;
    this.chan = new BroadcastChannel('fg-rtc');
    this.chan.onmessage = (e) => {
      const msg = e.data;
      if (!msg || msg.session !== this.session) return;
      for (const cb of this.callbacks) cb(msg.payload);
    };
  }

  send(s: any): void {
    try { this.chan.postMessage({ session: this.session, payload: s }); } catch {}
  }

  on(cb: (s: any) => void): void {
    this.callbacks.push(cb);
  }

  // Spectator streaming support (local only). Producer can post frames, consumers subscribe with delay.
  createStream(): void { try { this.stream = new BroadcastChannel('fg-stream-' + this.session); } catch {} }
  postFrame(data: any): void { try { this.stream?.postMessage({ t: 'frame', d: data, ts: performance.now() }); } catch {} }
  onStreamFrame(cb: (d: any) => void, delayMs: number = 1500): void {
    try {
      const s = new BroadcastChannel('fg-stream-' + this.session);
      s.onmessage = (e) => {
        const { t, d, ts } = e.data || {};
        if (t !== 'frame') return;
        const now = performance.now();
        const wait = Math.max(0, (ts + delayMs) - now);
        setTimeout(() => cb(d), wait);
      };
    } catch {}
  }
}

