import * as pc from 'playcanvas';
import { GameState } from './GameStateStack';
import { ConfigService } from '../utils/ConfigService';

export class BootState implements GameState {
	public name = 'boot';
	private app: pc.Application;
	private services: any;
	private events: any;

	constructor(app: pc.Application, services: any, events: any) {
		this.app = app;
		this.services = services;
		this.events = events;
	}

	async enter(): Promise<void> {
		try {
			// Load initial configs; extend as needed
			const config = this.services.resolve<ConfigService>('config');
			await Promise.all([
				config.loadJson('/data/balance/live_balance.json').catch(() => ({})),
			]);
			this.events.emit('state:goto', { state: 'menu' });
		} catch (e) {
			console.error('BootState failed:', e);
			this.events.emit('state:goto', { state: 'menu' });
		}
	}

	exit(): void {}

	update(dt: number): void {}
}

