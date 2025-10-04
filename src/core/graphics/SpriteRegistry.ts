import type * as pc from 'playcanvas';

export class SpriteRegistry {
	private app: pc.Application;
	private textures = new Map<string, pc.Texture>();
	private sources = new Map<string, string>();

	constructor(app: pc.Application) {
		this.app = app;
	}

	register(id: string, tex: pc.Texture, source?: string): void {
		this.textures.set(id, tex);
		if (source) this.sources.set(id, source);
	}

	get(id: string): pc.Texture | undefined {
		return this.textures.get(id);
	}

	/**
	 * Register a free/placeholder sprite by URL at runtime. This enables
	 * hot-swapping sprite sheets without rebuilds (live-service friendly).
	 */
	async registerFromUrl(id: string, url: string): Promise<pc.Texture> {
		const device = (this.app as any).graphicsDevice as pc.GraphicsDevice;
		const img = await this.loadImage(url);
		const tex = new pc.Texture(device, {
			width: img.width,
			height: img.height,
			format: pc.PIXELFORMAT_R8_G8_B8_A8,
			mipmaps: false
		});
		tex.addressU = pc.ADDRESS_CLAMP_TO_EDGE;
		tex.addressV = pc.ADDRESS_CLAMP_TO_EDGE;
		tex.minFilter = pc.FILTER_NEAREST;
		tex.magFilter = pc.FILTER_NEAREST;
		// Upload pixels
		const canvas = document.createElement('canvas');
		canvas.width = img.width; canvas.height = img.height;
		const ctx = canvas.getContext('2d')!;
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(img, 0, 0);
		const pixels = ctx.getImageData(0, 0, img.width, img.height).data;
		tex.lock();
		// @ts-ignore internal
		new Uint8Array(tex.lockedMipmaps[0][0].data.buffer).set(new Uint8Array(pixels.buffer));
		tex.unlock();
		this.register(id, tex, url);
		return tex;
	}

	private loadImage(src: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => resolve(img);
			img.onerror = (e) => reject(e);
			img.src = src;
		});
	}

	sourceOf(id: string): string | undefined { return this.sources.get(id); }

	all(): string[] {
		return Array.from(this.textures.keys());
	}
}

