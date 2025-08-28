export class RemoteConfigService {
  private config: Record<string, any> = {};

  async load(): Promise<void> {
    try {
      const r = await fetch('/api/config', { cache: 'no-store' });
      this.config = await r.json();
    } catch {
      this.config = {};
    }
  }

  get<T = any>(key: string, fallback: T): T {
    return (this.config && key in this.config ? this.config[key] : fallback) as T;
  }
}

