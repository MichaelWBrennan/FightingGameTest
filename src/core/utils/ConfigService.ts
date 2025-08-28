export class ConfigService {
	private cache = new Map<string, unknown>();

	async loadJson<T = unknown>(path: string, bust = false): Promise<T> {
		if (!bust && this.cache.has(path)) return this.cache.get(path) as T;
		const res = await fetch(path);
		if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
		const data = (await res.json()) as T;
		this.cache.set(path, data);
		return data;
	}
}