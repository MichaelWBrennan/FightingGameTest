import * as pc from 'playcanvas';
import { GameState } from './GameStateStack';

export class MatchState implements GameState {
	public name = 'match';
	private app: pc.Application;
	private events: any;

	constructor(app: pc.Application, events: any) {
		this.app = app;
		this.events = events;
	}

	enter(): void {
		// Match setup would go here (characters, stage, timers)
	}

	exit(): void {}

	update(dt: number): void {}
}

