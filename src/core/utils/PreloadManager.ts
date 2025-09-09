export class PreloadManager {
	private manifest: { assets: { path: string; type: string; sha256?: string }[] } = { assets: [] };
	private jsonCache: Map<string, unknown> = new Map();
	private imageCache: Map<string, HTMLImageElement> = new Map();
	private audioCache: Map<string, HTMLAudioElement> = new Map();
	private blobCache: Map<string, Blob> = new Map();


	async loadManifest(url: string = '/assets/manifest.json', onProgress?: (progress: number, label?: string) => void): Promise<void> {
		try {
			onProgress?.(0.2, 'Fetching manifest');
			const res = await fetch(url, { cache: 'no-store' });
			if (!res.ok) {
				console.warn(`[PreloadManager] Manifest not found (${res.status}) at ${url}. Continuing without it.`);
				this.manifest = { assets: [] };
				onProgress?.(1.0, 'Manifest not found, continuing');
				return;
			}
			onProgress?.(0.6, 'Parsing manifest');
			this.manifest = await res.json();
			onProgress?.(1.0, 'Manifest ready');
		} catch (err) {
			console.warn(`[PreloadManager] Manifest load error at ${url}. Using empty manifest.`, err);
			this.manifest = { assets: [] };
			onProgress?.(1.0, 'Manifest error, continuing');
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

	public async preloadAllAssets(options?: PreloadAllOptions): Promise<PreloadResult> {
		const groupOrder: AssetType[] = options?.groupOrder ?? ['json', 'image', 'audio', 'other'];
		const onEvent = options?.onEvent ?? (() => {});

		const results: PreloadedAsset[] = [];
		const overlayP = import('../../core/ui/LoadingOverlay').catch(() => null);

		// Build assets by type
		const assetsByType: Record<AssetType, { path: string; size?: number; sha256?: string }[]> = {
			json: [], image: [], audio: [], other: []
		};
		for (const a of this.manifest.assets) {
			const t = (['json','image','audio'].includes(a.type) ? a.type : 'other') as AssetType;
			assetsByType[t].push({ path: a.path, size: (a as any).size, sha256: a.sha256 });
		}

		// Sequentially process groups
		for (const group of groupOrder) {
			const groupAssets = assetsByType[group];
			if (!groupAssets || groupAssets.length === 0) continue;
			onEvent({ kind: 'groupStart', group });

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
				try {
					const loaded = await this.loadSingleAsset(group, asset.path, asset.size, asset.sha256, (bytesLoaded, bytesTotal) => {
						try { overlay?.LoadingOverlay.updateTask(`asset:${asset.path}`, Math.max(0, Math.min(1, (bytesTotal ? (bytesLoaded / bytesTotal) : 0)))); } catch {}
						onEvent({ kind: 'assetProgress', group, assetPath: asset.path, progress: bytesTotal ? (bytesLoaded / (bytesTotal || 1)) : 0, bytesTotal, bytesLoaded });
					});
					results.push({ type: group, path: asset.path, data: loaded });
					try { overlay?.LoadingOverlay.endTask(`asset:${asset.path}`, true); } catch {}
					onEvent({ kind: 'assetEnd', group, assetPath: asset.path, success: true, progress: 1 });
				} catch (e) {
					try { overlay?.LoadingOverlay.endTask(`asset:${asset.path}`, false); } catch {}
					onEvent({ kind: 'assetEnd', group, assetPath: asset.path, success: false, progress: 1 });
					// Continue even if an asset fails
				}
				groupLoaded += Math.max(1, asset.size || 1);
				onEvent({ kind: 'groupProgress', group, progress: Math.max(0, Math.min(1, groupLoaded / totalBytes)) });
			}

			try { overlay?.LoadingOverlay.endTask(`group:${group}`, true); } catch {}
			onEvent({ kind: 'groupEnd', group, progress: 1 });
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
		const res = await fetch(path, { cache: 'no-store' });
		if (!res.ok) throw new PreloadError(`JSON fetch failed: ${path}`, path);
		const contentLength = Number(res.headers.get('content-length') || size || 0) || undefined;
		const body = res.body;
		let text: string;
		if (body && typeof (body as any).getReader === 'function') {
			const bytes = await streamToUint8Array(body, (loaded) => { onStream?.(loaded, contentLength); });
			text = new TextDecoder().decode(bytes);
			if (sha256) {
				const hash = await toSha256Hex(new TextEncoder().encode(text));
				if (hash !== sha256) throw new PreloadError(`Integrity check failed for ${path}`, path);
			}
		} else {
			text = await res.text();
			onStream?.(contentLength || 1, contentLength);
		}
		const decrypted = await this.tryDecrypt(text) || text;
		const obj = JSON.parse(decrypted);
		this.jsonCache.set(path, obj);
		return obj;
	}

	private async loadBlobWithProgress(path: string, size?: number, sha256?: string, onStream?: (bytesLoaded: number, bytesTotal?: number) => void): Promise<Blob> {
		if (this.blobCache.has(path)) return this.blobCache.get(path) as Blob;
		const res = await fetch(path, { cache: 'no-store' });
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

