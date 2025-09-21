export interface TimingSample { name: string; ms: number; }

export class DebugOverlay {
	private container: HTMLDivElement;
	private fpsLabel: HTMLDivElement;
	private timingsLabel: HTMLDivElement;
	private netcodeLabel: HTMLDivElement | null = null;
	private cheatLabel: HTMLDivElement | null = null;
	private detLabel: HTMLDivElement | null = null;
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
    // Add simple connection quality line
    const quality = document.createElement('div');
    quality.style.color = '#fff';
    quality.style.opacity = '0.8';
    quality.id = 'net-quality';
    this.container.appendChild(quality);
		this.cheatLabel = document.createElement('div');
		this.cheatLabel.style.color = '#ff6666';
		this.container.appendChild(this.cheatLabel);
        this.detLabel = document.createElement('div');
        this.detLabel.style.color = '#6ff';
        this.container.appendChild(this.detLabel);
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

  setNetcodeInfo(info: { rtt?: number; jitter?: number; delay?: number; rollbacks?: number; ooo?: number; loss?: number; tx?: number; rx?: number; cur?: number; confirmed?: number }): void {
		if (!this.netcodeLabel) return;
		const parts: string[] = [];
		if (info.rtt != null) parts.push(`RTT:${Math.round(info.rtt)}ms`);
    if (info.jitter != null) parts.push(`Jit:${Math.round(info.jitter)}ms`);
		if (info.delay != null) parts.push(`Delay:${info.delay}`);
		if (info.rollbacks != null) parts.push(`RB:${info.rollbacks}`);
    if (info.ooo != null) parts.push(`OOO:${info.ooo}`);
    if (info.loss != null) parts.push(`Loss~:${info.loss}`);
    if (info.tx != null && info.rx != null) parts.push(`TX:${Math.round((info.tx||0)/1024)}k RX:${Math.round((info.rx||0)/1024)}k`);
    if (info.cur != null && info.confirmed != null) parts.push(`F:${info.cur}/${info.confirmed}`);
    this.netcodeLabel.textContent = parts.join('  ');
    const qual = document.getElementById('net-quality') as HTMLDivElement | null;
    if (qual) {
			const r = info.rtt ?? 0, j = info.jitter ?? 0, l = info.loss ?? 0;
      let grade = 'GOOD';
      if (r > 120 || j > 30 || l > 3) grade = 'FAIR';
      if (r > 200 || j > 60 || l > 8) grade = 'POOR';
			qual.textContent = `Link: ${grade}`;
      qual.style.color = grade === 'GOOD' ? '#9f9' : grade === 'FAIR' ? '#ffeb3b' : '#ff6666';
    }
	}

	setCheatAlerts(reports: Array<{ type: string }>): void {
		if (!this.cheatLabel) return;
		if (!reports || reports.length === 0) { this.cheatLabel.textContent = ''; return; }
		this.cheatLabel.textContent = `CHEAT ALERTS: ${reports.map(r => r.type).join(', ')}`;
	}

	setDeterminism(frame: number, ok: boolean): void {
        if (!this.detLabel) return;
        this.detLabel.textContent = ok ? '' : `DET MISMATCH @${frame}`;
    }
}