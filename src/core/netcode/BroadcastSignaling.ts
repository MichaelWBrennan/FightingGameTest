export class BroadcastSignaling {
  private chan: BroadcastChannel;
  private session: string;
  private callbacks: Array<(s: any) => void> = [];

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
}

