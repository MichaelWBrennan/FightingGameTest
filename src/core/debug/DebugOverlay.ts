export interface TimingSample { name: string; ms: number; }

export class DebugOverlay {
	private container: HTMLDivElement;
	private fpsLabel: HTMLDivElement;
	private timingsLabel: HTMLDivElement;
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
}