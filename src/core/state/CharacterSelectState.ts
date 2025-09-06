import * as pc from 'playcanvas';
import { GameState } from './GameStateStack';
import { RotationService } from '../../scripts/RotationService';
import { CharacterLoader } from '../../scripts/CharacterLoader';
import { CharacterSelectUI } from '../../scripts/CharacterSelectUI';

export class CharacterSelectState implements GameState {
	public name = 'characterselect';
	private app: pc.Application;
	private events: any;
	private rotation!: RotationService;
	private loader!: CharacterLoader;
	private ui!: CharacterSelectUI;
	private handlersBound = false;

	constructor(app: pc.Application, events: any) {
		this.app = app;
		this.events = events;
	}

	async enter(): Promise<void> {
		// Initialize services for selection
		this.rotation = new RotationService(this.app, (this.app as any)._characters ?? (this.app as any)._services?.resolve?.('characters')) as any;
		try { await this.rotation.initialize(); } catch {}
		this.loader = new CharacterLoader(this.app);
		this.ui = new CharacterSelectUI(this.app, this.rotation, this.loader);
		await this.ui.initialize();
		this.ui.startUpdates();
		this.bindEvents();
	}

	exit(): void {
		this.unbindEvents();
		this.ui?.destroy();
	}

	update(dt: number): void {}

	private bindEvents(): void {
		if (this.handlersBound) return;
		this.handlersBound = true;
		this.app.on('characterselect:confirm', this.onConfirm, this);
		this.app.on('characterselect:ready', this.onReady, this);
	}

	private unbindEvents(): void {
		if (!this.handlersBound) return;
		this.handlersBound = false;
		this.app.off('characterselect:confirm', this.onConfirm, this);
		this.app.off('characterselect:ready', this.onReady, this);
	}

	private onConfirm(data: any): void {
		// Persist interim selections (per player)
		try {
			const services = (this.app as any)._services;
			const sel = services.has('selections') ? services.resolve('selections') : {};
			sel[data.playerId] = data.selection;
			if (!services.has('selections')) services.register('selections', sel);
			localStorage.setItem('sf3_selections', JSON.stringify(sel));
		} catch {}
	}

	private onReady(evt: any): void {
		try {
			const services = (this.app as any)._services;
			services.register('selections', evt.selections);
			localStorage.setItem('sf3_selections', JSON.stringify(evt.selections));
		} catch {}
		this.events.emit('state:goto', { state: 'match' });
	}
}

