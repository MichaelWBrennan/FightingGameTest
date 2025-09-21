export class WsSignaling {
  private ws?: WebSocket;
  private cb?: (s: any) => void;
  constructor(private url: string, private token?: string) {
    try {
      const full = token ? (url + (url.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token)) : url;
      this.ws = new WebSocket(full.replace(/^http/,'ws'));
      this.ws.onmessage = (e) => { try { this.cb?.(JSON.parse(e.data)); } catch {} };
    } catch {}
  }
  send(s: any): void { try { this.ws?.readyState === 1 ? this.ws?.send(JSON.stringify(s)) : null; } catch {} }
  on(cb: (s: any) => void): void { this.cb = cb; }
}

