export class RemoteConfigService {
  private config: Record<string, any> = {};

  async load(): Promise<void> {
    try {
      const ver = (typeof window !== 'undefined' && (window as any).__BUILD_VERSION__) ? (window as any).__BUILD_VERSION__ : 'dev';
      const r = await fetch(`/api/config?v=${encodeURIComponent(String(ver))}`);
      this.config = await r.json();
    } catch {
      this.config = {};
    }
  }

  get<T = any>(key: string, fallback: T): T {
    return (this.config && key in this.config ? this.config[key] : fallback) as T;
  }
}

