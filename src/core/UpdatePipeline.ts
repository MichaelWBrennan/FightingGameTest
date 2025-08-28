export interface UpdatableSystem {
	priority: number;
	update(deltaTime: number): void;
	name?: string;
}

export class UpdatePipeline {
	private systems: UpdatableSystem[] = [];
	private samples: { name: string; ms: number }[] = [];

	add(system: UpdatableSystem): void {
		this.systems.push(system);
		this.systems.sort((a, b) => a.priority - b.priority);
	}

	remove(system: UpdatableSystem): void {
		this.systems = this.systems.filter(s => s !== system);
	}

	update(deltaTime: number): void {
		this.samples.length = 0;
		for (const sys of this.systems) {
			const start = performance.now();
			sys.update(deltaTime);
			const end = performance.now();
			this.samples.push({ name: sys.name || 'system', ms: end - start });
		}
	}

	getTimings(): { name: string; ms: number }[] {
		return this.samples.slice();
	}

	clear(): void {
		this.systems.length = 0;
	}
}