export class SyncService {
  private flushing = false;

  constructor(private offline: { dequeueAll: () => any[] }) {}

  start(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.flush());
      setInterval(() => this.flush(), 15000);
    }
  }

  async flush(): Promise<void> {
    if (this.flushing) return;
    this.flushing = true;
    try {
      const events = this.offline.dequeueAll();
      if (!events.length) return;
      await fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ events }) });
    } catch {}
    this.flushing = false;
  }
}

