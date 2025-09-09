export class LoadingOverlay {
	private static initialized = false;
	private static container: HTMLElement | null = null;
	private static fill: HTMLElement | null = null;
	private static label: HTMLElement | null = null;
    private static trackNetwork = false;
    private static origFetch: typeof fetch | null = null;
    private static reqStarted = 0;
    private static reqCompleted = 0;

	/**
	 * Initializes a fullscreen loading overlay or reuses pre-rendered markup.
	 */
	public static initialize(): void {
		if (typeof document === 'undefined') return;
		if (this.initialized) return;

		this.container = document.getElementById('pc-loading-overlay');
		if (!this.container) {
			this.container = document.createElement('div');
			this.container.id = 'pc-loading-overlay';
			this.container.style.position = 'fixed';
			this.container.style.inset = '0';
			this.container.style.background = '#000';
			this.container.style.display = 'flex';
			this.container.style.alignItems = 'center';
			this.container.style.justifyContent = 'center';
			this.container.style.flexDirection = 'column';
			this.container.style.color = '#fff';
			this.container.style.zIndex = '100000';
			document.body.appendChild(this.container);
		}

		this.fill = document.getElementById('pc-loading-fill');
		let bar = document.getElementById('pc-loading-bar');
		if (!bar) {
			bar = document.createElement('div');
			bar.id = 'pc-loading-bar';
			bar.style.width = '60%';
			bar.style.maxWidth = '480px';
			bar.style.height = '8px';
			bar.style.background = '#333';
			bar.style.borderRadius = '4px';
			bar.style.overflow = 'hidden';
			this.container.appendChild(bar);
		}

		if (!this.fill) {
			this.fill = document.createElement('div');
			this.fill.id = 'pc-loading-fill';
			this.fill.style.width = '0%';
			this.fill.style.height = '100%';
			this.fill.style.background = '#09f';
			(this.fill.style as any).transition = 'width 0.2s';
			bar.appendChild(this.fill);
		}

		this.label = document.getElementById('pc-loading-text');
		if (!this.label) {
			this.label = document.createElement('div');
			this.label.id = 'pc-loading-text';
			this.label.textContent = 'Loading…';
			this.label.style.marginTop = '12px';
			(this.label.style as any).font = '14px/1.2 monospace';
			(this.label.style as any).opacity = '.9';
			this.container.appendChild(this.label);
		}

		this.initialized = true;
	}

	/**
	 * Updates progress bar and optional status label.
	 */
	public static updateProgress(progress: number, message?: string): void {
		if (!this.initialized) return;
		let clamped = Math.max(0, Math.min(1, progress));
		if (this.trackNetwork && this.reqStarted > 0) {
			const netPortion = Math.max(0, Math.min(1, this.reqCompleted / this.reqStarted));
			// Reserve last 15% for in-flight network requests
			clamped = Math.max(clamped, 0.85 + 0.15 * netPortion);
		}
		if (this.fill) this.fill.style.width = String(Math.round(clamped * 100)) + '%';
		if (message && this.label) this.label.textContent = message;
	}

	/**
	 * Hides the overlay with a short fade once loading completes.
	 */
	public static complete(): void {
		if (!this.initialized || !this.container) return;
		(this.container.style as any).transition = 'opacity 180ms ease';
		this.container.style.opacity = '0';
		setTimeout(() => {
			try {
				this.container && this.container.parentElement && this.container.parentElement.removeChild(this.container);
			} catch {}
			this.container = null;
			this.fill = null;
			this.label = null;
			this.initialized = false;
			this.disableNetworkTracking();
		}, 200);
	}

	/**
	 * Enables lightweight network tracking by wrapping window.fetch.
	 */
	public static enableNetworkTracking(): void {
		if (typeof window === 'undefined' || this.trackNetwork) return;
		this.trackNetwork = true;
		this.reqStarted = 0;
		this.reqCompleted = 0;
		this.origFetch = window.fetch.bind(window);
		window.fetch = ((...args: Parameters<typeof fetch>) => {
			this.reqStarted++;
			try {
				const p = (this.origFetch as any)(...args);
				return p.finally(() => {
					this.reqCompleted++;
					// Nudge progress when requests complete during boot
					this.updateProgress(0.9);
				});
			} catch (e) {
				this.reqCompleted++;
				this.updateProgress(0.9);
				throw e;
			}
		}) as any;
	}

	private static disableNetworkTracking(): void {
		if (!this.trackNetwork) return;
		if (typeof window !== 'undefined' && this.origFetch) {
			window.fetch = this.origFetch;
		}
		this.trackNetwork = false;
		this.origFetch = null;
		this.reqStarted = 0;
		this.reqCompleted = 0;
	}
}

