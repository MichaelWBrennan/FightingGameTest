export class ConfigLoader {
  async loadJson<T>(url: string): Promise<T | null> {
    try {
      const ver = (typeof window !== 'undefined' && (window as any).__BUILD_VERSION__) ? (window as any).__BUILD_VERSION__ : 'dev';
      const sep = url.includes('?') ? '&' : '?';
      const r = await fetch(`${url}${sep}v=${encodeURIComponent(String(ver))}`);
      if (!r.ok) return null; return await r.json() as T;
    } catch { return null; }
  }
}

