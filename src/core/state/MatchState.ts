import * as pc from 'playcanvas';
import { GameState } from './GameStateStack';
import { UIManager } from '../ui/UIManager';

export class MatchState implements GameState {
	public name = 'match';
	private app: pc.Application;
	private events: any;

	constructor(app: pc.Application, events: any) {
		this.app = app;
		this.events = events;
	}

	enter(): void {
		const ui = (this.app as any)._ui as UIManager | undefined;
		ui?.showHUD();
	}

	exit(): void {}

	update(dt: number): void {}
}

