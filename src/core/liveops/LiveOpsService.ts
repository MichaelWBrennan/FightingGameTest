export class LiveOpsService {
  private events: any[] = [];

  async load(): Promise<void> {
    try {
      const r = await fetch('/api/config?resource=events', { cache: 'no-store' });
      const j = await r.json();
      this.events = j?.events || [];
    } catch { this.events = []; }
  }

  getActive(now = Date.now()): any[] {
    return this.events.filter(e => (!e.start || e.start <= now) && (!e.end || e.end >= now));
  }
}

