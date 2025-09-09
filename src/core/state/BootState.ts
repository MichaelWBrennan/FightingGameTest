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
			let __bootDone = 0;
			const __bootTotal = 5;
			const __bootReport = async (label: string) => {
				__bootDone = Math.min(__bootTotal, __bootDone + 1);
				try { (await import('../ui/LoadingOverlay')).LoadingOverlay.updateTask('boot_config', __bootDone / __bootTotal, `Loading live config and services (${__bootDone}/${__bootTotal}) - ${label}`); } catch {}
			};
			await Promise.all([
				config.loadJson('/data/balance/live_balance.json').then(() => __bootReport('balance')).catch(() => __bootReport('balance')),
				monetization.initialize().then(() => __bootReport('monetization')).catch(() => __bootReport('monetization')),
				Promise.resolve(entitlement.initialize?.()).then(() => __bootReport('entitlement')).catch(() => __bootReport('entitlement')),
				remote.load().then(() => __bootReport('remote config')).catch(() => __bootReport('remote config')),
				liveops.load().then(() => __bootReport('liveops')).catch(() => __bootReport('liveops'))
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

