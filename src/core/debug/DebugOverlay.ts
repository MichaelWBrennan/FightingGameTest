export interface TimingSample { name: string; ms: number; }

export class DebugOverlay {
	private container: HTMLDivElement;
	private fpsLabel: HTMLDivElement;
	private timingsLabel: HTMLDivElement;
	private netcodeLabel: HTMLDivElement | null = null;
	private cheatLabel: HTMLDivElement | null = null;
	private lastTime = performance.now();
	private frames = 0;
	private fps = 0;

	constructor() {
		this.container = document.createElement('div');
		this.container.style.position = 'fixed';
		this.container.style.top = '8px';
		this.container.style.left = '8px';
		this.container.style.background = 'rgba(0,0,0,0.5)';
		this.container.style.color = '#0f0';
		this.container.style.font = '12px monospace';
		this.container.style.padding = '6px 8px';
		this.container.style.borderRadius = '4px';
		this.container.style.zIndex = '9999';

		this.fpsLabel = document.createElement('div');
		this.timingsLabel = document.createElement('div');
		this.container.appendChild(this.fpsLabel);
		this.container.appendChild(this.timingsLabel);
		this.netcodeLabel = document.createElement('div');
		this.netcodeLabel.style.color = '#9f9';
		this.container.appendChild(this.netcodeLabel);
		this.cheatLabel = document.createElement('div');
		this.cheatLabel.style.color = '#ff6666';
		this.container.appendChild(this.cheatLabel);
		document.body.appendChild(this.container);
	}

	update(): void {
		this.frames++;
		const now = performance.now();
		if (now - this.lastTime >= 1000) {
			this.fps = Math.round((this.frames * 1000) / (now - this.lastTime));
			this.frames = 0;
			this.lastTime = now;
			this.fpsLabel.textContent = `FPS: ${this.fps}`;
		}
	}

	setTimings(samples: TimingSample[]): void {
		const text = samples.map(s => `${s.name}:${s.ms.toFixed(2)}ms`).join('  ');
		this.timingsLabel.textContent = text;
	}

	setNetcodeInfo(info: { rtt?: number; delay?: number; rollbacks?: number }): void {
		if (!this.netcodeLabel) return;
		const parts: string[] = [];
		if (info.rtt != null) parts.push(`RTT:${Math.round(info.rtt)}ms`);
		if (info.delay != null) parts.push(`Delay:${info.delay}`);
		if (info.rollbacks != null) parts.push(`RB:${info.rollbacks}`);
		this.netcodeLabel.textContent = parts.join('  ');
	}

	setCheatAlerts(reports: Array<{ type: string }>): void {
		if (!this.cheatLabel) return;
		if (!reports || reports.length === 0) { this.cheatLabel.textContent = ''; return; }
		this.cheatLabel.textContent = `CHEAT ALERTS: ${reports.map(r => r.type).join(', ')}`;
	}
}