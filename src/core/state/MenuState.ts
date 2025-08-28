import * as pc from 'playcanvas';
import { GameState } from './GameStateStack';

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
		this.menuEntity = new pc.Entity('MainMenu');
		this.menuEntity.addComponent('element', { type: pc.ELEMENTTYPE_TEXT, text: 'Press Enter to Start', anchor: new pc.Vec4(0.5,0.5,0.5,0.5), pivot: new pc.Vec2(0.5,0.5) });
		this.app.root.addChild(this.menuEntity);
		window.addEventListener('keydown', this.onKey);
	}

	exit(): void {
		window.removeEventListener('keydown', this.onKey);
		this.menuEntity?.destroy();
		this.menuEntity = null;
	}

	update(dt: number): void {}

	private onKey = (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			this.events.emit('state:goto', { state: 'match' });
		}
	}
}

