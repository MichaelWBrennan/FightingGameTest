export class HotReloadService {
  private ws?: WebSocket;
  constructor(private onReload: (path: string) => void) {}
  connect(url: string = (location.origin.replace(/^http/,'ws') + '/ws')): void {
    try { this.ws = new WebSocket(url); this.ws.onmessage = (e) => { try { const m = JSON.parse(e.data); if (m?.t === 'file_changed' && m.path) this.onReload(m.path); } catch {} }; } catch {}
  }
}

