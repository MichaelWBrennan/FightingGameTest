export interface UpdatableSystem {
	priority: number;
	update(deltaTime: number): void;
}

export class UpdatePipeline {
	private systems: UpdatableSystem[] = [];

	add(system: UpdatableSystem): void {
		this.systems.push(system);
		this.systems.sort((a, b) => a.priority - b.priority);
	}

	remove(system: UpdatableSystem): void {
		this.systems = this.systems.filter(s => s !== system);
	}

	update(deltaTime: number): void {
		for (const sys of this.systems) sys.update(deltaTime);
	}

	clear(): void {
		this.systems.length = 0;
	}
}