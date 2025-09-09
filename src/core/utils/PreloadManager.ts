export class PreloadManager {
	private manifest: { assets: { path: string; type: string; sha256?: string }[] } = { assets: [] };

	async loadManifest(url: string = '/assets/manifest.json'): Promise<void> {
		try {
			try { (await import('../ui/LoadingOverlay')).LoadingOverlay.beginTask('manifest', 'Loading content manifest', 1); } catch {}
			try { (await import('../ui/LoadingOverlay')).LoadingOverlay.updateTask('manifest', 0.2, 'Fetching manifest'); } catch {}
			const res = await fetch(url, { cache: 'no-store' });
			if (!res.ok) {
				console.warn(`[PreloadManager] Manifest not found (${res.status}) at ${url}. Continuing without it.`);
				this.manifest = { assets: [] };
				try { (await import('../ui/LoadingOverlay')).LoadingOverlay.endTask('manifest', true); } catch {}
				return;
			}
			try { (await import('../ui/LoadingOverlay')).LoadingOverlay.updateTask('manifest', 0.6, 'Parsing manifest'); } catch {}
			this.manifest = await res.json();
			try { (await import('../ui/LoadingOverlay')).LoadingOverlay.updateTask('manifest', 1.0, 'Manifest ready'); } catch {}
			try { (await import('../ui/LoadingOverlay')).LoadingOverlay.endTask('manifest', true); } catch {}
		} catch (err) {
			console.warn(`[PreloadManager] Manifest load error at ${url}. Using empty manifest.`, err);
			this.manifest = { assets: [] };
			try { (await import('../ui/LoadingOverlay')).LoadingOverlay.endTask('manifest', false); } catch {}
		}
	}

	getAssetsByType(type: string): string[] {
		return this.manifest.assets.filter(a => a.type === type).map(a => a.path);
	}

	async getJson<T = unknown>(path: string): Promise<T> {
		const res = await fetch(path, { cache: 'no-store' });
		if (!res.ok) throw new Error(`JSON load failed: ${path}`);
		const text = await res.text();
		const decrypted = await this.tryDecrypt(text);
		try {
			const entry = this.manifest.assets.find(a => a.path === path);
			if (entry?.sha256 && 'crypto' in window && (window.crypto as any).subtle) {
				const buf = new TextEncoder().encode(decrypted ?? text);
				const hashBuf = await (window.crypto as any).subtle.digest('SHA-256', buf);
				const hashArray = Array.from(new Uint8Array(hashBuf));
				const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
				if (hashHex !== entry.sha256) throw new Error(`Integrity check failed for ${path}`);
			}
		} catch {}
		return JSON.parse(decrypted ?? text) as T;
	}

	private async tryDecrypt(text: string): Promise<string | null> {
		if (!text.startsWith('ENC1|')) return null;
		try {
			const parts = text.split('|');
			const iv = Uint8Array.from(atob(parts[1]), c => c.charCodeAt(0));
			const tag = Uint8Array.from(atob(parts[2]), c => c.charCodeAt(0));
			const enc = Uint8Array.from(atob(parts[3]), c => c.charCodeAt(0));
			const keyStr = (window as any).__ASSET_KEY__ || 'dev-asset-key-change-me';
			const keyBuf = new TextEncoder().encode(keyStr);
			const key = await (window.crypto as any).subtle.importKey('raw', await (window.crypto as any).subtle.digest('SHA-256', keyBuf), { name: 'AES-GCM' }, false, ['decrypt']);
			const plain = await (window.crypto as any).subtle.decrypt({ name: 'AES-GCM', iv, additionalData: undefined, tagLength: 128 }, key, concat(enc, tag));
			return new TextDecoder().decode(new Uint8Array(plain));
		} catch {
			return null;
		}
	}
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
	const out = new Uint8Array(a.length + b.length);
	out.set(a, 0);
	out.set(b, a.length);
	return out;
}

