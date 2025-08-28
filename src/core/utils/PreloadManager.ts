export class PreloadManager {
	private manifest: { assets: { path: string; type: string }[] } = { assets: [] };

	async loadManifest(url: string = '/assets/manifest.json'): Promise<void> {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`Manifest load failed: ${res.status}`);
		this.manifest = await res.json();
	}

	getAssetsByType(type: string): string[] {
		return this.manifest.assets.filter(a => a.type === type).map(a => a.path);
	}

	async getJson<T = unknown>(path: string): Promise<T> {
		const res = await fetch(path);
		if (!res.ok) throw new Error(`JSON load failed: ${path}`);
		return res.json();
	}
}

