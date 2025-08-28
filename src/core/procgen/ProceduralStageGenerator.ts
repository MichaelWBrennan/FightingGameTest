export interface ProcStageOptions {
	seed?: number;
	theme?: 'training' | 'gothic' | 'urban';
}

export class ProceduralStageGenerator {
	private rng: () => number;

	constructor(seed: number = Date.now()) {
		this.rng = mulberry32(seed >>> 0);
	}

	generate(opts: ProcStageOptions = {}): any {
		const theme = opts.theme || 'training';
		switch (theme) {
			case 'urban':
				return this.urban();
			case 'gothic':
				return this.gothic();
			default:
				return this.training();
		}
	}

	private training(): any {
		return {
			name: 'Training (Procedural)',
			layers: {
				skybox: { type: 'gradient', elements: [] },
				farBackground: { type: 'mountains', elements: this.mountains(3) },
				midBackground: { type: 'buildings', elements: this.buildings(4) },
				nearBackground: { type: 'trees', elements: this.trees(3) },
				playground: { type: 'stage_floor', elements: [{ type: 'platform', x: 0, y: -5, width: 40, height: 2 }] }
			}
		};
	}

	private gothic(): any {
		return {
			name: 'Gothic (Procedural)',
			layers: {
				skybox: { type: 'stormy_sky', elements: [{ type: 'plane', name: 'stormy_sky' }] },
				farBackground: { type: 'mountains', elements: this.mountains(2) },
				midBackground: { type: 'castle', elements: this.buildings(3) },
				nearBackground: { type: 'gargoyles', elements: this.trees(2) },
				playground: { type: 'cobblestone', elements: [{ type: 'platform', x: 0, y: -5, width: 40, height: 2 }] }
			}
		};
	}

	private urban(): any {
		return {
			name: 'Urban (Procedural)',
			layers: {
				skybox: { type: 'cityscape', elements: [] },
				farBackground: { type: 'cityscape', elements: this.buildings(5) },
				midBackground: { type: 'street', elements: this.buildings(3) },
				nearBackground: { type: 'crowd', elements: this.buildings(2) },
				playground: { type: 'street_stage', elements: [{ type: 'asphalt', x: 0, y: -5, width: 50, height: 3 }] }
			}
		};
	}

	private mountains(n: number) {
		const arr = [] as any[];
		for (let i = 0; i < n; i++) arr.push({ type: 'mountain', x: (i - n/2) * 100, y: -20 + this.rand(-5,5), width: this.rand(30,50), height: this.rand(20,30), color: '#4A5568' });
		return arr;
	}
	private buildings(n: number) {
		const arr = [] as any[];
		for (let i = 0; i < n; i++) arr.push({ type: 'building', x: (i - n/2) * 80, y: -10, width: this.rand(20,60), height: this.rand(40,120), color: '#6B7280' });
		return arr;
	}
	private trees(n: number) {
		const arr = [] as any[];
		for (let i = 0; i < n; i++) arr.push({ type: 'tree', x: (i - n/2) * 60, y: -6, scale: this.rand(1.0, 2.0), sway: true });
		return arr;
	}
	private rand(min: number, max: number) { return min + (max - min) * this.rng(); }
}

function mulberry32(a: number) {
	return function() {
		a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}