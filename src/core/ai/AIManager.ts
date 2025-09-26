import type * as pc from 'playcanvas';

export type AIPolicy = (ctx: { dt: number; app: pc.Application; state: any }) => void;

export class AIManager {
	private app: pc.Application;
	private policies: Map<string, AIPolicy> = new Map();
	private active: string | null = null;
	private dda: { difficulty: number } = { difficulty: 1.0 };

	constructor(app: pc.Application) {
		this.app = app;
	}

	registerPolicy(name: string, policy: AIPolicy): void {
		this.policies.set(name, policy);
	}

	activate(name: string): void {
		if (this.policies.has(name)) this.active = name;
	}

	setDifficulty(x: number): void { this.dda.difficulty = Math.max(0.1, Math.min(3.0, x)); }

	update(dt: number): void {
		if (!this.active) return;
		const policy = this.policies.get(this.active);
		policy?.({ dt, app: this.app, state: { difficulty: this.dda.difficulty } });
	}
}