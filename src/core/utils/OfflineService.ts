export class OfflineService {
  private storage: Storage;

  constructor() {
    this.storage = typeof localStorage !== 'undefined' ? localStorage : ({} as any);
  }

  save<T>(key: string, value: T): void {
    try { this.storage.setItem(key, JSON.stringify(value)); } catch {}
  }

  load<T>(key: string, fallback: T): T {
    try {
      const v = this.storage.getItem(key);
      return v ? (JSON.parse(v) as T) : fallback;
    } catch { return fallback; }
  }

  enqueueEvent(event: any): void {
    const q = this.load<any[]>('offline_events', []);
    q.push({ ...event, ts: Date.now() });
    this.save('offline_events', q);
  }

  dequeueAll(): any[] {
    const q = this.load<any[]>('offline_events', []);
    this.save('offline_events', []);
    return q;
  }
}

