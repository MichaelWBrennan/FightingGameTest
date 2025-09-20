export type AnalyticsEvent = { name: string; ts: number; props?: Record<string, any> };

export class AnalyticsService {
  private queue: AnalyticsEvent[] = [];
  private endpoint: string | null = null;
  setEndpoint(url: string): void { this.endpoint = url; }
  track(name: string, props?: Record<string, any>): void { this.queue.push({ name, ts: Date.now(), props }); }
  flush(): void {
    const batch = this.queue.splice(0);
    if (batch.length === 0) return;
    if (!this.endpoint) { try { console.log('[analytics]', batch); } catch {} return; }
    try { fetch(this.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ events: batch }) }).catch(()=>{}); } catch {}
  }
}

