import * as pc from 'playcanvas';

export class SpriteRegistry {
	private app: pc.Application;
	private textures = new Map<string, pc.Texture>();

	constructor(app: pc.Application) {
		this.app = app;
	}

	register(id: string, tex: pc.Texture): void {
		this.textures.set(id, tex);
	}

	get(id: string): pc.Texture | undefined {
		return this.textures.get(id);
	}

	all(): string[] {
		return Array.from(this.textures.keys());
	}
}

