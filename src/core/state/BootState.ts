import * as pc from 'playcanvas';
import { GameState } from './GameStateStack';
import { ConfigService } from '../utils/ConfigService';
import { MonetizationService } from '../monetization/MonetizationService';

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
            const monetization = this.services.resolve<MonetizationService>('monetization');
            const entitlement = this.services.resolve<any>('entitlement');
            const security = this.services.resolve<any>('security');
            const sync = this.services.resolve<any>('sync');
            const remote = this.services.resolve<any>('configRemote');
            const liveops = this.services.resolve<any>('liveops');
            const netcode = this.services.resolve<any>('netcode');
			await Promise.all([
				config.loadJson('/data/balance/live_balance.json').catch(() => ({})),
                monetization.initialize().catch(() => undefined),
                entitlement.initialize?.().catch(() => undefined),
                remote.load().catch(() => undefined),
                liveops.load().catch(() => undefined)
			]);
            security.start?.();
            sync.start?.();
			const cfg = remote.get('netcode', { enabled: false });
			if (cfg?.enabled && cfg.mode === 'local') {
				netcode.enableLocalP2();
			}
			this.events.emit('state:goto', { state: 'login' });
		} catch (e) {
			console.error('BootState failed:', e);
			this.events.emit('state:goto', { state: 'login' });
		}
	}

	exit(): void {}

	update(dt: number): void {}
}

