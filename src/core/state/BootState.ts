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
			// Route immediately; don't block on network or service init
			const qp = (() => { try { const p = new URLSearchParams(window.location.search); return ['1','true','yes','on'].includes((p.get('quickplay')||'').toLowerCase()); } catch { return false; } })();
			this.events.emit('state:goto', { state: qp ? 'match' : 'characterselect' });
			// Perform service/network initialization in the background (not reflected in loading overlay)
			void (async () => {
				try {
					const config = this.services.resolve('config') as ConfigService;
					const monetization = this.services.resolve('monetization') as MonetizationService;
					const entitlement = this.services.resolve('entitlement') as any;
					const security = this.services.resolve('security') as any;
					const sync = this.services.resolve('sync') as any;
					const remote = this.services.resolve('configRemote') as any;
					const liveops = this.services.resolve('liveops') as any;
					const netcode = this.services.resolve('netcode') as any;
					await Promise.all([
						config.loadJson('/data/balance/live_balance.json').catch(() => {}),
						monetization.initialize().catch(() => {}),
						Promise.resolve(entitlement.initialize?.()).catch(() => {}),
						remote.load().catch(() => {}),
						liveops.load().catch(() => {})
					]);
					security.start?.();
					sync.start?.();
					const cfg = remote.get('netcode', { enabled: false });
					if (cfg?.enabled && cfg.mode === 'local') {
						netcode.enableLocalP2();
					}
				} catch (err) {
					console.error('BootState background init failed:', err);
				}
			})();
		} catch (e) {
			console.error('BootState failed:', e);
			this.events.emit('state:goto', { state: 'match' });
		}
	}

	exit(): void {}

	update(dt: number): void {}
}

