export class SpectateService {
  private bc: BroadcastChannel | null = null;
  private listeners: Array<(e: any) => void> = [];
  private broadcasting = false;

  constructor() {
    try { this.bc = new BroadcastChannel('fg-spectate'); this.bc.onmessage = (e) => this.listeners.forEach(cb => { try { cb(e.data); } catch {} }); } catch {}
  }

  enableBroadcast(on: boolean): void { this.broadcasting = !!on; }
  on(cb: (e: any) => void): void { this.listeners.push(cb); }
  broadcast(evt: any): void { try { if (this.broadcasting) this.bc?.postMessage(evt); } catch {} }
}

