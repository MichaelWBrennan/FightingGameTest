import * as pc from 'playcanvas';

export interface ProceduralSpriteOptions {
	width: number;
	height: number;
	type: 'solid' | 'gradient' | 'checker';
	colorA?: [number, number, number, number];
	colorB?: [number, number, number, number];
	tile?: number;
}

export class ProceduralSpriteGenerator {
	private app: pc.Application;

	constructor(app: pc.Application) {
		this.app = app;
	}

	createTexture(opts: ProceduralSpriteOptions): pc.Texture {
		const w = Math.max(1, Math.floor(opts.width));
		const h = Math.max(1, Math.floor(opts.height));
		const device = this.app.graphicsDevice;
		const tex = new pc.Texture(device, { width: w, height: h, format: pc.PIXELFORMAT_R8_G8_B8_A8 });
		const pixels = new Uint8Array(w * h * 4);
		const a = opts.colorA || [255, 255, 255, 255];
		const b = opts.colorB || [0, 0, 0, 255];
		const tile = Math.max(1, opts.tile || 8);

		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				const i = (y * w + x) * 4;
				switch (opts.type) {
					case 'solid': {
						pixels[i] = a[0]; pixels[i+1] = a[1]; pixels[i+2] = a[2]; pixels[i+3] = a[3];
						break;
					}
					case 'gradient': {
						const t = y / (h - 1);
						pixels[i]   = Math.round(a[0] * (1 - t) + b[0] * t);
						pixels[i+1] = Math.round(a[1] * (1 - t) + b[1] * t);
						pixels[i+2] = Math.round(a[2] * (1 - t) + b[2] * t);
						pixels[i+3] = Math.round(a[3] * (1 - t) + b[3] * t);
						break;
					}
					case 'checker': {
						const cx = Math.floor(x / tile);
						const cy = Math.floor(y / tile);
						const useA = (cx + cy) % 2 === 0;
						const c = useA ? a : b;
						pixels[i] = c[0]; pixels[i+1] = c[1]; pixels[i+2] = c[2]; pixels[i+3] = c[3];
						break;
					}
				}
			}
		}

		tex.lock();
		 
		// @ts-ignore
		new Uint8Array(tex.lockedMipmaps[0][0].data.buffer).set(pixels);
		tex.unlock();
		return tex;
	}
}