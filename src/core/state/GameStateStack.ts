export interface GameState {
	name: string;
	enter(prev?: GameState): Promise<void> | void;
	exit(next?: GameState): Promise<void> | void;
	update(dt: number): void;
}

export class GameStateStack {
	private stack: GameState[] = [];

	get current(): GameState | undefined { return this.stack[this.stack.length - 1]; }

	async push(state: GameState): Promise<void> {
		const prev = this.current;
		this.stack.push(state);
		await state.enter(prev);
	}

	async pop(): Promise<void> {
		const state = this.stack.pop();
		if (state) await state.exit(this.current);
	}

	async replace(state: GameState): Promise<void> {
		const prev = this.stack.pop();
		if (prev) await prev.exit(state);
		this.stack.push(state);
		await state.enter(prev);
	}

	update(dt: number): void {
		this.current?.update(dt);
	}
}