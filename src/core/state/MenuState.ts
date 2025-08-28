import * as pc from 'playcanvas';
import { GameState } from './GameStateStack';
import { UIManager } from '../ui/UIManager';

export class MenuState implements GameState {
	public name = 'menu';
	private app: pc.Application;
	private events: any;
	private menuEntity: pc.Entity | null = null;

	constructor(app: pc.Application, events: any) {
		this.app = app;
		this.events = events;
	}

	enter(): void {
		// Show UI-managed menu
		const ui = (this.app as any)._ui as UIManager | undefined;
		ui?.showMenu();
		window.addEventListener('keydown', this.onKey);
	}

	exit(): void {
		window.removeEventListener('keydown', this.onKey);
		const ui = (this.app as any)._ui as UIManager | undefined;
		ui?.hideMenu();
	}

	update(dt: number): void {}

	private onKey = (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			this.events.emit('state:goto', { state: 'match' });
		}
	}
}

