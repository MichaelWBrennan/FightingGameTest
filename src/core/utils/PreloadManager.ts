export class PreloadManager {
	private manifest: { assets: { path: string; type: string; sha256?: string }[] } = { assets: [] };
	private jsonCache: Map<string, unknown> = new Map();
	private imageCache: Map<string, HTMLImageElement> = new Map();
	private audioCache: Map<string, HTMLAudioElement> = new Map();
	private blobCache: Map<string, Blob> = new Map();
	private readonly version: string = (typeof window !== 'undefined' && (window as any).__BUILD_VERSION__) ? (window as any).__BUILD_VERSION__ : 'dev';

	private buildVersionedUrl(path: string): string {
		try {
			// Do not version the manifest itself to avoid CDN/proxy caching quirks
			if (path.toLowerCase().includes('/assets/manifest.json')) return path;
			const hasQuery = path.includes('?');
			const sep = hasQuery ? '&' : '?';
			return `${path}${sep}v=${encodeURIComponent(String(this.version))}`;
		} catch {
			return path;
		}
	}


	async loadManifest(url: string = '/assets/manifest.json', onProgress?: (progress: number, label?: string) => void): Promise<void> {
		const overlayP = import('../../core/ui/LoadingOverlay').catch(() => null);
		const defaultManifestP = import('./DefaultManifest').catch(() => null);
		let overlayTimeout: any = null;
		try { (await overlayP)?.LoadingOverlay.beginTask('manifest_bg', 'Loading manifest', 1); } catch {}
		try { overlayTimeout = setTimeout(async () => { try { (await overlayP)?.LoadingOverlay.endTask('manifest_bg', true); } catch {} }, 7000); } catch {}
		const fetchWithTimeout = async (u: string, ms: number, init?: RequestInit): Promise<Response> => {
			const ctrl = new AbortController();
			const id = setTimeout(() => ctrl.abort(), ms);
			try { return await fetch(this.buildVersionedUrl(u), { ...(init || {}), signal: ctrl.signal, cache: (init && init.cache) || 'no-store' }); }
			finally { clearTimeout(id); }
		};
		try {
			try { (await overlayP)?.LoadingOverlay.log(`[manifest] fetching ${url}`, 'info'); } catch {}
			onProgress?.(0.2, 'Fetching manifest');
			try { (await overlayP)?.LoadingOverlay.updateTask('manifest_bg', 0.2, 'Fetching manifest'); } catch {}
			let res: Response | null = null;
			try {
				res = await fetchWithTimeout(url, 3500, { cache: 'no-store' });
			} catch {}
			// Treat empty/invalid bodies as failure to trigger fallback
			let text: string | null = null;
			if (res && res.ok) {
				try { text = await res.text(); } catch {}
				if (!text || text.trim().length === 0) res = null;
			}
			if (!res || !res.ok) {
				try { (await overlayP)?.LoadingOverlay.log(`[manifest] primary fetch failed${res ? ` (${res.status})` : ''}, trying API fallback`, 'warn'); } catch {}
				onProgress?.(0.3, 'Fetching manifest (fallback)');
				try { (await overlayP)?.LoadingOverlay.updateTask('manifest_bg', 0.3, 'Fetching manifest (fallback)'); } catch {}
				try {
					res = await fetchWithTimeout('/api/manifest', 4000, { cache: 'no-store' });
				} catch {}
				text = null;
				if (res && res.ok) {
					try { text = await res.text(); } catch {}
					if (!text || text.trim().length === 0) res = null;
				}
			}
			if (!res || !res.ok) {
				// Use built-in minimal default manifest to ensure boot continues
				try { (await overlayP)?.LoadingOverlay.log(`[manifest] using default manifest (static fetch failed)`, 'warn'); } catch {}
				try {
					const dm = await defaultManifestP;
					if (dm && typeof dm.getDefaultManifest === 'function') {
						this.manifest = dm.getDefaultManifest() as any;
						onProgress?.(1.0, 'Default manifest ready');
						try { (await overlayP)?.LoadingOverlay.updateTask('manifest_bg', 1.0, 'Default manifest ready'); } catch {}
						try { clearTimeout(overlayTimeout); } catch {}
						try { (await overlayP)?.LoadingOverlay.endTask('manifest_bg', true); } catch {}
						return;
					}
				} catch {}
				console.warn(`[PreloadManager] Manifest not available. Continuing without it.`);
				this.manifest = { assets: [] };
				onProgress?.(1.0, 'Manifest not found, continuing');
				try { (await overlayP)?.LoadingOverlay.updateTask('manifest_bg', 1.0, 'Manifest not found, continuing'); } catch {}
				try { clearTimeout(overlayTimeout); } catch {}
				try { (await overlayP)?.LoadingOverlay.endTask('manifest_bg', true); } catch {}
				try { (await overlayP)?.LoadingOverlay.log(`[manifest] not found at ${url} and /api/manifest`, 'warn'); } catch {}
				return;
			}
			onProgress?.(0.6, 'Parsing manifest');
			try { (await overlayP)?.LoadingOverlay.updateTask('manifest_bg', 0.6, 'Parsing manifest'); } catch {}
			try {
				// Validate content-type if available (iOS/Safari can serve HTML for JSON on misconfig)
				try {
					const ct = res?.headers?.get?.('content-type') || '';
					if (ct && !/application\/json/i.test(ct)) {
						throw new Error(`Unexpected Content-Type: ${ct}`);
					}
				} catch {}
				this.manifest = JSON.parse(text as string);
			} catch {
				// Final guard: if JSON parse fails, continue without manifest
				// Try default manifest as last resort
				try {
					const dm = await defaultManifestP;
					if (dm && typeof dm.getDefaultManifest === 'function') {
						this.manifest = dm.getDefaultManifest() as any;
						onProgress?.(1.0, 'Default manifest ready');
						try { (await overlayP)?.LoadingOverlay.updateTask('manifest_bg', 1.0, 'Default manifest ready'); } catch {}
						try { clearTimeout(overlayTimeout); } catch {}
						try { (await overlayP)?.LoadingOverlay.endTask('manifest_bg', true); } catch {}
						try { (await overlayP)?.LoadingOverlay.log(`[manifest] invalid JSON; used default manifest`, 'warn'); } catch {}
						return;
					}
				} catch {}
				this.manifest = { assets: [] };
				onProgress?.(1.0, 'Manifest error, continuing');
				try { (await overlayP)?.LoadingOverlay.updateTask('manifest_bg', 1.0, 'Manifest error, continuing'); } catch {}
				try { clearTimeout(overlayTimeout); } catch {}
				try { (await overlayP)?.LoadingOverlay.endTask('manifest_bg', true); } catch {}
				try { (await overlayP)?.LoadingOverlay.log(`[manifest] invalid JSON from ${url}`, 'error'); } catch {}
				return;
			}
			onProgress?.(1.0, 'Manifest ready');
			try { (await overlayP)?.LoadingOverlay.updateTask('manifest_bg', 1.0, 'Manifest ready'); } catch {}
			try { (await overlayP)?.LoadingOverlay.log(`[manifest] loaded (${this.manifest.assets?.length || 0} assets)`, 'info'); } catch {}
			try { clearTimeout(overlayTimeout); } catch {}
			try { (await overlayP)?.LoadingOverlay.endTask('manifest_bg', true); } catch {}
		} catch (err) {
			console.warn(`[PreloadManager] Manifest load error at ${url}. Using empty manifest.`, err);
			this.manifest = { assets: [] };
			onProgress?.(1.0, 'Manifest error, continuing');
			try { (await overlayP)?.LoadingOverlay.updateTask('manifest_bg', 1.0, 'Manifest error, continuing'); } catch {}
			try { clearTimeout(overlayTimeout); } catch {}
			try { (await overlayP)?.LoadingOverlay.endTask('manifest_bg', true); } catch {}
			try { (await overlayP)?.LoadingOverlay.log(`[manifest] error at ${url}: ${(err as any)?.message || String(err)}`, 'error'); } catch {}
		}
	}

	getAssetsByType(type: string): string[] {
		return this.manifest.assets.filter(a => a.type === type).map(a => a.path);
	}

	async getJson<T = unknown>(path: string): Promise<T> {
		const res = await fetch(this.buildVersionedUrl(path));
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

	public async preloadAllAssets(options?: PreloadAllOptions): Promise<PreloadResult> {
		const groupOrder: AssetType[] = options?.groupOrder ?? ['json', 'image', 'audio', 'other'];
		const onEvent = options?.onEvent ?? (() => {});

		const results: PreloadedAsset[] = [];
		const overlayP = import('../../core/ui/LoadingOverlay').catch(() => null);

		// Build assets by type
		const assetsByType: Record<AssetType, { path: string; size?: number; sha256?: string }[]> = {
			json: [], image: [], audio: [], other: []
		};
		// Filter out oversized or explicitly excluded assets (e.g., encrypted blobs)
		const MAX_PRELOAD_BYTES = 5 * 1024 * 1024; // 5MB cap for initial/background preloads
		for (const a of this.manifest.assets) {
			if (!a || !a.path) continue;
			const normalizedPath = String(a.path);
			// Skip any explicitly large/opaque binaries
			if (normalizedPath.endsWith('encrypted.bin') || /\.bin$/i.test(normalizedPath)) {
				continue;
			}
			const t = (['json','image','audio'].includes(a.type) ? a.type : 'other') as AssetType;
			const size = (a as any).size as number | undefined;
			if (typeof size === 'number' && size > MAX_PRELOAD_BYTES) {
				// Do not schedule very large assets via generic preloader
				continue;
			}
			assetsByType[t].push({ path: normalizedPath, size: size, sha256: a.sha256 });
		}

		// Sequentially process groups
		for (const group of groupOrder) {
			const groupAssets = assetsByType[group];
			if (!groupAssets || groupAssets.length === 0) continue;
			onEvent({ kind: 'groupStart', group });
			try { (await overlayP)?.LoadingOverlay.log(`[preload] group start ${group} (${groupAssets.length} assets)`, 'info'); } catch {}

			const overlay = await overlayP;
			try { overlay?.LoadingOverlay.beginTask(`group:${group}`, `${group.toUpperCase()} assets`, 0); } catch {}

			// Total bytes for weighting/progress
			const totalBytes = groupAssets.reduce((sum, a) => sum + (a.size || 1), 0) || 1;
			let groupLoaded = 0;

			for (const asset of groupAssets) {
				const label = prettyAssetLabel(asset.path);
				const weight = Math.max(1, asset.size || 1);
				try { overlay?.LoadingOverlay.beginTask(`asset:${asset.path}`, label, weight); } catch {}
				onEvent({ kind: 'assetStart', group, assetPath: asset.path, progress: 0, bytesTotal: asset.size });
				try { (await overlayP)?.LoadingOverlay.log(`[preload] asset start ${group} ${asset.path}${asset.size ? ` (${asset.size} bytes)` : ''}`, 'info'); } catch {}
				try {
					const loaded = await this.loadSingleAsset(group, asset.path, asset.size, asset.sha256, (bytesLoaded, bytesTotal) => {
						try { overlay?.LoadingOverlay.updateTask(`asset:${asset.path}`, Math.max(0, Math.min(1, (bytesTotal ? (bytesLoaded / bytesTotal) : 0)))); } catch {}
						onEvent({ kind: 'assetProgress', group, assetPath: asset.path, progress: bytesTotal ? (bytesLoaded / (bytesTotal || 1)) : 0, bytesTotal, bytesLoaded });
					});
					results.push({ type: group, path: asset.path, data: loaded });
					try { overlay?.LoadingOverlay.endTask(`asset:${asset.path}`, true); } catch {}
					onEvent({ kind: 'assetEnd', group, assetPath: asset.path, success: true, progress: 1 });
					try { (await overlayP)?.LoadingOverlay.log(`[preload] asset ok ${group} ${asset.path}`, 'info'); } catch {}
				} catch (e) {
					try { overlay?.LoadingOverlay.endTask(`asset:${asset.path}`, false); } catch {}
					onEvent({ kind: 'assetEnd', group, assetPath: asset.path, success: false, progress: 1 });
					try { (await overlayP)?.LoadingOverlay.log(`[preload] asset failed ${group} ${asset.path}: ${(e as any)?.message || String(e)}`, 'error'); } catch {}
					// Continue even if an asset fails
				}
				groupLoaded += Math.max(1, asset.size || 1);
				onEvent({ kind: 'groupProgress', group, progress: Math.max(0, Math.min(1, groupLoaded / totalBytes)) });
			}

			try { overlay?.LoadingOverlay.endTask(`group:${group}`, true); } catch {}
			onEvent({ kind: 'groupEnd', group, progress: 1 });
			try { (await overlayP)?.LoadingOverlay.log(`[preload] group end ${group}`, 'info'); } catch {}
		}

		return { assets: results };
	}

	private async loadSingleAsset(type: AssetType, path: string, size?: number, sha256?: string, onStream?: (bytesLoaded: number, bytesTotal?: number) => void): Promise<unknown> {
		switch (type) {
			case 'json':
				return this.loadJsonWithProgress(path, size, sha256, onStream);
			case 'image':
				return this.loadImageWithProgress(path, size, sha256, onStream);
			case 'audio':
				return this.loadAudioWithProgress(path, size, sha256, onStream);
			default:
				return this.loadBlobWithProgress(path, size, sha256, onStream);
		}
	}

	private async loadJsonWithProgress(path: string, size?: number, sha256?: string, onStream?: (bytesLoaded: number, bytesTotal?: number) => void): Promise<unknown> {
		if (this.jsonCache.has(path)) return this.jsonCache.get(path) as unknown;
		const res = await fetch(this.buildVersionedUrl(path));
		if (!res.ok) throw new PreloadError(`JSON fetch failed: ${path}`, path);
		const contentLength = Number(res.headers.get('content-length') || size || 0) || undefined;
		const body = res.body;
		let text: string;
		if (body && typeof (body as any).getReader === 'function') {
			const bytes = await streamToUint8Array(body, (loaded) => { onStream?.(loaded, contentLength); });
			text = new TextDecoder().decode(bytes);
			// Decrypt before integrity check so hash matches manifest of plaintext
			{
				const maybeDecrypted = await this.tryDecrypt(text);
				if (sha256) {
					const buf = new TextEncoder().encode(maybeDecrypted ?? text);
					const hash = await toSha256Hex(buf);
					if (hash !== sha256) throw new PreloadError(`Integrity check failed for ${path}`, path);
				}
				text = maybeDecrypted ?? text;
			}
		} else {
			text = await res.text();
			onStream?.(contentLength || 1, contentLength);
			// Decrypt before integrity check so hash matches manifest of plaintext
			{
				const maybeDecrypted = await this.tryDecrypt(text);
				if (sha256) {
					const buf = new TextEncoder().encode(maybeDecrypted ?? text);
					const hash = await toSha256Hex(buf);
					if (hash !== sha256) throw new PreloadError(`Integrity check failed for ${path}`, path);
				}
				text = maybeDecrypted ?? text;
			}
		}
		const obj = JSON.parse(text);
		this.jsonCache.set(path, obj);
		return obj;
	}

	private async loadBlobWithProgress(path: string, size?: number, sha256?: string, onStream?: (bytesLoaded: number, bytesTotal?: number) => void): Promise<Blob> {
		if (this.blobCache.has(path)) return this.blobCache.get(path) as Blob;
		const res = await fetch(this.buildVersionedUrl(path));
		if (!res.ok) throw new PreloadError(`Blob fetch failed: ${path}`, path);
		const contentLength = Number(res.headers.get('content-length') || size || 0) || undefined;
		const body = res.body;
		let bytes: Uint8Array;
		if (body && typeof (body as any).getReader === 'function') {
			bytes = await streamToUint8Array(body, (loaded) => { onStream?.(loaded, contentLength); });
		} else {
			const arrBuf = await res.arrayBuffer();
			bytes = new Uint8Array(arrBuf);
			onStream?.(bytes.byteLength, bytes.byteLength);
		}
		if (sha256) {
			const hash = await toSha256Hex(bytes.buffer);
			if (hash !== sha256) throw new PreloadError(`Integrity check failed for ${path}`, path);
		}
		const blob = new Blob([bytes]);
		this.blobCache.set(path, blob);
		return blob;
	}

	private async loadImageWithProgress(path: string, size?: number, sha256?: string, onStream?: (bytesLoaded: number, bytesTotal?: number) => void): Promise<HTMLImageElement> {
		if (this.imageCache.has(path)) return this.imageCache.get(path) as HTMLImageElement;
		const blob = await this.loadBlobWithProgress(path, size, sha256, onStream);
		const url = URL.createObjectURL(blob);
		try {
			const img = await new Promise<HTMLImageElement>((resolve, reject) => {
				const i = new Image();
				i.onload = () => resolve(i);
				i.onerror = () => reject(new PreloadError(`Image decode failed: ${path}`, path));
				i.src = url;
			});
			this.imageCache.set(path, img);
			return img;
		} finally {
			try { URL.revokeObjectURL(url); } catch {}
		}
	}

	private async loadAudioWithProgress(path: string, size?: number, sha256?: string, onStream?: (bytesLoaded: number, bytesTotal?: number) => void): Promise<HTMLAudioElement> {
		if (this.audioCache.has(path)) return this.audioCache.get(path) as HTMLAudioElement;
		const blob = await this.loadBlobWithProgress(path, size, sha256, onStream);
		const url = URL.createObjectURL(blob);
		const audio = new Audio();
		audio.preload = 'auto';
		return await new Promise<HTMLAudioElement>((resolve) => {
			const done = () => {
				try { URL.revokeObjectURL(url); } catch {}
				this.audioCache.set(path, audio);
				resolve(audio);
			};
			audio.addEventListener('canplaythrough', done, { once: true });
			audio.addEventListener('loadeddata', done, { once: true });
			audio.src = url;
			audio.load();
		});
	}
}
export type AssetType = 'json' | 'image' | 'audio' | 'other';

export interface PreloadProgressEvent {
    kind: 'groupStart' | 'groupProgress' | 'groupEnd' | 'assetStart' | 'assetProgress' | 'assetEnd';
    group: AssetType;
    assetPath?: string;
    progress?: number; // 0..1 for asset/group
    bytesTotal?: number;
    bytesLoaded?: number;
    success?: boolean;
}

export interface PreloadAllOptions {
    groupOrder?: AssetType[];
    onEvent?: (evt: PreloadProgressEvent) => void;
}

// Streaming helpers
async function streamToUint8Array(stream: ReadableStream<Uint8Array>, onChunk: (loaded: number) => void): Promise<Uint8Array> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
            chunks.push(value);
            loaded += value.byteLength;
            onChunk(loaded);
        }
    }
    let total = 0;
    for (const c of chunks) total += c.byteLength;
    const out = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) { out.set(c, offset); offset += c.byteLength; }
    return out;
}

async function toSha256Hex(buffer: ArrayBuffer): Promise<string> {
    const digest = await (window.crypto as any).subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(digest));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function prettyAssetLabel(path: string): string {
    try {
        const parts = path.split('/');
        return parts.slice(Math.max(0, parts.length - 3)).join('/');
    } catch { return path; }
}

export interface PreloadedAsset {
    type: AssetType;
    path: string;
    data: unknown;
}

export type PreloadResult = {
    assets: PreloadedAsset[];
}

export class PreloadError extends Error {
    constructor(message: string, public readonly path: string) { super(message); }
}

// Extend PreloadManager with grouped, sequential, per-asset preloading

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
	const out = new Uint8Array(a.length + b.length);
	out.set(a, 0);
	out.set(b, a.length);
	return out;
}

