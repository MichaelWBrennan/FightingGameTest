export class PreloadManager {
	private manifest: { assets: { path: string; type: string; sha256?: string }[] } = { assets: [] };

	async loadManifest(url: string = '/assets/manifest.json'): Promise<void> {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`Manifest load failed: ${res.status}`);
		this.manifest = await res.json();
	}

	getAssetsByType(type: string): string[] {
		return this.manifest.assets.filter(a => a.type === type).map(a => a.path);
	}

	async getJson<T = unknown>(path: string): Promise<T> {
		const res = await fetch(path, { cache: 'no-store' });
		if (!res.ok) throw new Error(`JSON load failed: ${path}`);
		const text = await res.text();
		try {
			const entry = this.manifest.assets.find(a => a.path === path);
			if (entry?.sha256 && 'crypto' in window && (window.crypto as any).subtle) {
				const buf = new TextEncoder().encode(text);
				const hashBuf = await (window.crypto as any).subtle.digest('SHA-256', buf);
				const hashArray = Array.from(new Uint8Array(hashBuf));
				const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
				if (hashHex !== entry.sha256) throw new Error(`Integrity check failed for ${path}`);
			}
		} catch {}
		return JSON.parse(text) as T;
	}
}

