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
			try { (await import('../ui/LoadingOverlay')).LoadingOverlay.beginTask('boot_config', 'Loading live config and services', 3); } catch {}
			// Load initial configs; extend as needed
			const config = this.services.resolve('config') as ConfigService;
            const monetization = this.services.resolve('monetization') as MonetizationService;
            const entitlement = this.services.resolve('entitlement') as any;
            const security = this.services.resolve('security') as any;
            const sync = this.services.resolve('sync') as any;
            const remote = this.services.resolve('configRemote') as any;
            const liveops = this.services.resolve('liveops') as any;
            const netcode = this.services.resolve('netcode') as any;
			await Promise.all([
				config.loadJson('/data/balance/live_balance.json').catch(() => ({})),
                monetization.initialize().catch(() => undefined),
                entitlement.initialize?.().catch(() => undefined),
                remote.load().catch(() => undefined),
                liveops.load().catch(() => undefined)
			]);
			try { (await import('../ui/LoadingOverlay')).LoadingOverlay.endTask('boot_config', true); } catch {}
            security.start?.();
            sync.start?.();
			const cfg = remote.get('netcode', { enabled: false });
			if (cfg?.enabled && cfg.mode === 'local') {
				netcode.enableLocalP2();
			}
			this.events.emit('state:goto', { state: 'login' });
		} catch (e) {
			console.error('BootState failed:', e);
			try { (await import('../ui/LoadingOverlay')).LoadingOverlay.endTask('boot_config', false); } catch {}
			this.events.emit('state:goto', { state: 'login' });
		}
	}

	exit(): void {}

	update(dt: number): void {}
}

