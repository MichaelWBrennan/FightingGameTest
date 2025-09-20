export class ConfigLoader {
  async loadJson<T>(url: string): Promise<T | null> {
    try { const r = await fetch(url); if (!r.ok) return null; return await r.json() as T; } catch { return null; }
  }
}

