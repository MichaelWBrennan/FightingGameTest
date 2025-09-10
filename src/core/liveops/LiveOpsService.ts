export class LiveOpsService {
  private events: any[] = [];

  async load(): Promise<void> {
    try {
      const ver = (typeof window !== 'undefined' && (window as any).__BUILD_VERSION__) ? (window as any).__BUILD_VERSION__ : 'dev';
      const r = await fetch(`/api/config?resource=events&v=${encodeURIComponent(String(ver))}`);
      const j = await r.json();
      this.events = j?.events || [];
    } catch { this.events = []; }
  }

  getActive(now = Date.now()): any[] {
    return this.events.filter(e => (!e.start || e.start <= now) && (!e.end || e.end >= now));
  }
}

