export class LoadingOverlay {
	private static initialized = false;
	private static container: HTMLElement | null = null;
	private static fill: HTMLElement | null = null;
	private static label: HTMLElement | null = null;
    // Expose a guarded snapshot for diagnostics and iOS fail-safe toggles
    private static trackNetwork = false;
    private static origFetch: typeof fetch | null = null;
    private static reqStarted = 0;
    private static reqCompleted = 0;
    private static tasksEl: HTMLElement | null = null;
    private static logEl: HTMLElement | null = null;
    private static tasks: Map<string, {
        id: string;
        label: string;
        weight: number;
        progress: number; // 0..1
        status: 'running' | 'done' | 'failed';
        el: HTMLElement | null;
    }> = new Map();
    private static completeRequested = false;
    private static logBuffer: { ts: number; level: 'debug' | 'info' | 'warn' | 'error'; message: string; }[] = [];
    private static logMax = 1000;
    public static consolePatched = false;
    public static origConsole: { log?: any; info?: any; warn?: any; error?: any; debug?: any } | null = null;

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

		// Optional boot-like headline
		let head = document.getElementById('pc-loading-head');
		if (!head) {
			head = document.createElement('div');
			head.id = 'pc-loading-head';
			(head.style as any).font = '12px/1.2 monospace';
			head.style.color = '#0f0';
			head.style.opacity = '.85';
			head.style.marginBottom = '8px';
			head.textContent = '== Boot sequence ==';
			this.container.appendChild(head);
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
			this.fill.style.background = '#0f0';
			(this.fill.style as any).transition = 'width 0.2s';
			bar.appendChild(this.fill);
		}

		this.label = document.getElementById('pc-loading-text');
		if (!this.label) {
			this.label = document.createElement('div');
			this.label.id = 'pc-loading-text';
			this.label.textContent = 'Loading...';
			this.label.style.marginTop = '12px';
			(this.label.style as any).font = '14px/1.2 monospace';
			(this.label.style as any).opacity = '.9';
			this.label.style.color = '#0f0';
			this.container.appendChild(this.label);
		}

		// Task list container
		this.tasksEl = document.getElementById('pc-loading-tasks');
		if (!this.tasksEl) {
			this.tasksEl = document.createElement('div');
			this.tasksEl.id = 'pc-loading-tasks';
			this.tasksEl.style.marginTop = '8px';
			this.tasksEl.style.width = '60%';
			(this.tasksEl.style as any).maxWidth = '480px';
			(this.tasksEl.style as any).font = '12px/1.35 monospace';
			(this.tasksEl.style as any).opacity = '.85';
			(this.tasksEl.style as any).color = '#0f0';
			this.container.appendChild(this.tasksEl);
		}

		// Log output container (scrollable)
		let logEl = document.getElementById('pc-loading-log');
		if (!logEl) {
			logEl = document.createElement('div');
			logEl.id = 'pc-loading-log';
			logEl.style.marginTop = '10px';
			logEl.style.width = '60%';
			(logEl.style as any).maxWidth = '480px';
			(logEl.style as any).maxHeight = '40vh';
			logEl.style.overflowY = 'auto';
			(logEl.style as any).font = '11px/1.4 monospace';
			(logEl.style as any).color = '#0f0';
			(logEl.style as any).background = '#010';
			(logEl.style as any).border = '1px solid rgba(0,255,0,0.15)';
			this.container.appendChild(logEl);
		}
		this.logEl = logEl;
		// Render any buffered logs captured before initialization
		try { this.renderBufferedLogs(); } catch {}

		this.initialized = true;
		try { (LoadingOverlay as any).log('[overlay] initialized', 'debug'); } catch {}
	}

	/**
	 * Updates progress bar and optional status label.
	 */
	public static updateProgress(progress: number, message?: string): void {
		if (!this.initialized) return;
		let clamped = Math.max(0, Math.min(1, progress));
		// If we have task-based progress, prefer that over manual progress for the bar
		const taskProgress = this.computeAggregateTaskProgress();
		const finalProgress = isNaN(taskProgress) ? clamped : taskProgress;
		if (this.fill) this.fill.style.width = String(Math.round(finalProgress * 100)) + '%';
		if (message && this.label) this.label.textContent = message;
	}

	/**
	 * Hides the overlay. By default, waits for tasks to finish and fades out.
	 * When force=true, hides immediately without waiting.
	 */
	public static complete(force: boolean = false): void {
		if (!this.initialized || !this.container) return;
		if (force) {
			// Immediately hide and cleanup without waiting for tasks
			try { this.disableNetworkTracking(); } catch {}
			try { this.disableConsoleCapture(); } catch {}
			(this.container.style as any).transition = 'opacity 0ms linear';
			this.container.style.opacity = '0';
			setTimeout(() => {
				try {
					this.container && this.container.parentElement && this.container.parentElement.removeChild(this.container);
				} catch {}
				this.container = null;
				this.fill = null;
				this.label = null;
				this.tasksEl = null;
				this.tasks.clear();
				this.initialized = false;
			}, 0);
			return;
		}
		// Do not let network tracking block overlay completion. Stop tracking now.
		try { this.disableNetworkTracking(); } catch {}
		// Proactively end any background-only tasks that shouldn't block UX
		try { this.endTask('manifest_bg', true); } catch {}
		try { this.endTask('preload_bg', true); } catch {}
		try {
			// End any preload background groups if present
			['json','image','audio','other'].forEach(g => { try { (this as any).endTask?.(`preload_bg:${g}`, true); } catch {} });
		} catch {}
		// If there are running tasks, ignore purely-background ones when deciding to hide
		const isBackground = (id: string) => id.endsWith('_bg') || id.startsWith('preload_bg:') || id === 'manifest_bg' || id === 'network';
		const anyBlockingRunning = Array.from(this.tasks.values()).some(t => t.status === 'running' && !isBackground(t.id));
		if (anyBlockingRunning) {
			this.completeRequested = true;
			return;
		}
		(this.container.style as any).transition = 'opacity 180ms ease';
		this.container.style.opacity = '0';
		setTimeout(() => {
			try {
				this.container && this.container.parentElement && this.container.parentElement.removeChild(this.container);
			} catch {}
			this.container = null;
			this.fill = null;
			this.label = null;
			this.tasksEl = null;
			this.tasks.clear();
			this.initialized = false;
			// Ensure network tracking is disabled (safe if already disabled)
			this.disableNetworkTracking();
			// Restore console if we captured it
			this.disableConsoleCapture();
		}, 200);
	}

    /**
     * Emergency: ensure overlay is visible and marked complete to avoid black screens
     * when a network request (e.g., manifest) silently hangs on Safari/iOS.
     */
    public static forceVisibleAndComplete(): void {
        try {
            if (!this.initialized) this.initialize();
            if (!this.container) this.initialize();
            if (this.container) {
                this.container.style.opacity = '1';
                this.container.style.display = 'flex';
            }
            // Simulate 100% progress so UI can advance
            try { this.beginTask('safari_guard', 'iOS/Safari guard', 1); } catch {}
            try { this.updateTask('safari_guard', 1.0, 'iOS/Safari guard'); } catch {}
            try { this.endTask('safari_guard', true); } catch {}
            // Do not auto-hide; caller decides when to hide later
            this.completeRequested = false;
            this.updateNetworkTask();
            try { this.log('[overlay] forced init due to fetch hang', 'warn'); } catch {}
        } catch {}
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
		// Register a task for network activity
		try { this.beginTask('network', 'Network activity', 1); } catch {}
		window.fetch = ((...args: Parameters<typeof fetch>) => {
			this.reqStarted++;
			const url = this.extractRequestUrl(args[0]);
			try {
				const p = (this.origFetch as any)(...args)
					.then((res: Response) => {
						try { this.log(`fetch done ${res.status}: ${url}`, res.ok ? 'debug' : 'warn'); } catch {}
						return res;
					})
					.catch((err: any) => {
						try { this.log(`fetch error: ${url} - ${err?.message || String(err)}`, 'error'); } catch {}
						throw err;
					})
					.finally(() => {
						this.reqCompleted++;
						this.updateNetworkTask();
					});
				try { this.log(`fetch start: ${url}`, 'debug'); } catch {}
				return p as any;
			} catch (e) {
				this.reqCompleted++;
				this.updateNetworkTask();
				try { this.log(`fetch error: ${url} - ${(e as any)?.message || String(e)}`, 'error'); } catch {}
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
		try { this.endTask('network', true); } catch {}
	}

	// --- Multi-task API ---

	public static beginTask(id: string, label: string, weight: number = 1): void {
		if (!this.initialized) return;
		const safeId = this.sanitizeId(id);
		if (this.tasks.has(safeId)) {
			// Update label/weight if task already exists
			const existing = this.tasks.get(safeId)!;
			existing.label = label;
			existing.weight = Math.max(0, weight);
			existing.status = 'running';
			this.renderTask(existing);
			this.renderAll();
			return;
		}
		const taskEl = document.createElement('div');
		taskEl.id = 'pc-task-' + safeId;
		taskEl.style.display = 'flex';
		taskEl.style.justifyContent = 'space-between';
		taskEl.style.alignItems = 'center';
		taskEl.style.marginTop = '6px';
		const labelEl = document.createElement('span');
		labelEl.textContent = label;
		const pctEl = document.createElement('span');
		pctEl.textContent = '0%';
		taskEl.appendChild(labelEl);
		taskEl.appendChild(pctEl);
		this.tasksEl?.appendChild(taskEl);
		this.tasks.set(safeId, { id: safeId, label, weight: Math.max(0, weight), progress: 0, status: 'running', el: taskEl });
		this.renderAll();
	}

	public static updateTask(id: string, progress?: number, label?: string): void {
		if (!this.initialized) return;
		const safeId = this.sanitizeId(id);
		const task = this.tasks.get(safeId);
		if (!task) return;
		if (typeof progress === 'number' && isFinite(progress)) {
			task.progress = Math.max(0, Math.min(1, progress));
		}
		if (label) task.label = label;
		this.renderTask(task);
		this.renderAll();
	}

	public static endTask(id: string, success: boolean = true): void {
		if (!this.initialized) return;
		const safeId = this.sanitizeId(id);
		const task = this.tasks.get(safeId);
		if (!task) return;
		task.progress = 1;
		task.status = success ? 'done' : 'failed';
		this.renderTask(task);
		this.renderAll();
		// If completion was requested earlier, hide when no running tasks remain
		if (this.completeRequested) {
			const anyRunning = Array.from(this.tasks.values()).some(t => t.status === 'running');
			if (!anyRunning) {
				this.completeRequested = false;
				this.complete();
			}
		}
	}

	public static async trackAsync<T>(id: string, label: string, weight: number, fnOrPromise: Promise<T> | (() => Promise<T>)): Promise<T> {
		this.beginTask(id, label, weight);
		try {
			const result = typeof fnOrPromise === 'function' ? await (fnOrPromise as any)() : await fnOrPromise;
			this.endTask(id, true);
			return result;
		} catch (e) {
			this.endTask(id, false);
			throw e;
		}
	}

	private static updateNetworkTask(): void {
		if (!this.initialized) return;
		const total = Math.max(1, this.reqStarted);
		const progress = Math.max(0, Math.min(1, this.reqCompleted / total));
		const label = `Network activity (${this.reqCompleted}/${this.reqStarted}${this.reqStarted > this.reqCompleted ? ' in-flight' : ''})`;
		this.updateTask('network', progress, label);
		// If completion was previously requested and network work is done,
		// mark the network task complete to allow the overlay to finish.
		if (this.completeRequested && this.reqCompleted >= this.reqStarted) {
			this.endTask('network', true);
			// Also re-check whether only background tasks remain; if so, complete now
			try {
				const isBackground = (id: string) => id.endsWith('_bg') || id.startsWith('preload_bg:') || id === 'manifest_bg' || id === 'network';
				const anyBlockingRunning = Array.from(this.tasks.values()).some(t => t.status === 'running' && !isBackground(t.id));
				if (!anyBlockingRunning) this.complete();
			} catch {}
		}
	}

	private static computeAggregateTaskProgress(): number {
		if (this.tasks.size === 0) {
			// When no tasks, fall back to manual progress
			return NaN as unknown as number;
		}
		let totalWeight = 0;
		let completed = 0;
		this.tasks.forEach(t => {
			const w = Math.max(0, t.weight);
			totalWeight += w;
			completed += w * Math.max(0, Math.min(1, t.progress));
		});
		if (totalWeight <= 0) return 0;
		return completed / totalWeight;
	}

	private static renderTask(task: { id: string; label: string; weight: number; progress: number; status: 'running' | 'done' | 'failed'; el: HTMLElement | null; }): void {
		if (!task.el) return;
		const children = task.el.children;
		if (children.length >= 2) {
			(children[0] as HTMLElement).textContent = task.label + (task.status === 'done' ? ' ✓' : task.status === 'failed' ? ' ✗' : '');
			(children[1] as HTMLElement).textContent = String(Math.round(task.progress * 100)) + '%';
			(task.el.style as any).color = task.status === 'failed' ? '#faa' : '#fff';
		}
	}

	private static renderAll(): void {
		const agg = this.computeAggregateTaskProgress();
		if (isNaN(agg)) return;
		if (this.fill) this.fill.style.width = String(Math.round(agg * 100)) + '%';
	}

	private static sanitizeId(id: string): string {
		return (id || 'task').toString().replace(/[^A-Za-z0-9_\-:.]/g, '_');
	}

	public static log(message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info'): void {
		const entry = { ts: Date.now(), level, message: String(message || '') };
		this.logBuffer.push(entry);
		if (this.logBuffer.length > this.logMax) this.logBuffer.splice(0, this.logBuffer.length - this.logMax);
		if (this.initialized && this.logEl) {
			this.appendLogLine(entry);
		}
	}

	private static renderBufferedLogs(): void {
		if (!this.logEl) return;
		try { (this.logEl as HTMLElement).innerHTML = ''; } catch {}
		for (const entry of this.logBuffer) {
			this.appendLogLine(entry);
		}
	}

	private static appendLogLine(entry: { ts: number; level: 'debug' | 'info' | 'warn' | 'error'; message: string; }): void {
		if (!this.logEl) return;
		const line = document.createElement('div');
		const ts = this.formatTimestamp(entry.ts);
		line.textContent = `[${ts}] ${entry.message}`;
		switch (entry.level) {
			case 'error': (line.style as any).color = '#faa'; break;
			case 'warn': (line.style as any).color = '#ff7'; break;
			case 'debug': (line.style as any).color = '#8f8'; break;
			default: (line.style as any).color = '#0f0'; break;
		}
		this.logEl.appendChild(line);
		try { this.logEl.scrollTop = this.logEl.scrollHeight; } catch {}
	}

	private static formatTimestamp(ts: number): string {
		const d = new Date(ts);
		const pad = (n: number, w: number = 2) => String(n).padStart(w, '0');
		return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
	}

	private static extractRequestUrl(arg: any): string {
		try {
			if (!arg) return 'unknown';
			if (typeof arg === 'string') return arg;
			if (typeof Request !== 'undefined' && arg instanceof Request) return arg.url || 'unknown';
			if (arg && typeof arg.url === 'string') return arg.url;
			return String(arg);
		} catch { return 'unknown'; }
	}
}

// Extend with lightweight debug snapshot for diagnostics
export interface LoadingOverlayDebugState {
	initialized: boolean;
	visible: boolean;
	labelText: string | null;
	trackNetwork: boolean;
	network: { started: number; completed: number; inFlight: number; };
	tasks: Array<{ id: string; label: string; weight: number; progress: number; status: 'running' | 'done' | 'failed'; }>;
	aggregateProgress: number | null;
	logs: Array<{ ts: number; level: 'debug' | 'info' | 'warn' | 'error'; message: string; }>;
}

export namespace LoadingOverlay {
	export function getDebugState(): LoadingOverlayDebugState | { error: string } {
		try {
			const aggregate = (LoadingOverlay as any).computeAggregateTaskProgress.call(LoadingOverlay);
			return {
				initialized: (LoadingOverlay as any).initialized,
				visible: !!(LoadingOverlay as any).container,
				labelText: (LoadingOverlay as any).label ? (LoadingOverlay as any).label.textContent : null,
				trackNetwork: (LoadingOverlay as any).trackNetwork,
				network: {
					started: (LoadingOverlay as any).reqStarted,
					completed: (LoadingOverlay as any).reqCompleted,
					inFlight: Math.max(0, (LoadingOverlay as any).reqStarted - (LoadingOverlay as any).reqCompleted)
				},
				tasks: Array.from((LoadingOverlay as any).tasks.values()).map((t: any) => ({
					id: t.id,
					label: t.label,
					weight: t.weight,
					progress: t.progress,
					status: t.status
				})),
				aggregateProgress: isNaN(aggregate) ? null : aggregate,
				logs: ((LoadingOverlay as any).logBuffer || []).slice(-200)
			};
		} catch (err) {
			return { error: 'snapshot_failed' };
		}
	}
}

// Console capture to include all logs in overlay for diagnostics
export namespace LoadingOverlay {
	export function enableConsoleCapture(): void {
		try {
			if (LoadingOverlay.consolePatched) return;
			LoadingOverlay.consolePatched = true;
			LoadingOverlay.origConsole = LoadingOverlay.origConsole || {
				log: console.log,
				info: console.info,
				warn: console.warn,
				error: console.error,
				debug: (console as any).debug || console.log
			};
			const forward = (level: 'debug' | 'info' | 'warn' | 'error', fn: any) => {
				return function(this: any, ...args: any[]) {
					try { fn.apply(this, args); } catch {}
					try {
						const msg = args.map(a => {
							if (a instanceof Error) return a.stack || a.message;
							try { return typeof a === 'string' ? a : JSON.stringify(a, (_k, v) => typeof v === 'bigint' ? String(v) : v); } catch { return String(a); }
						}).join(' ');
						LoadingOverlay.log(msg, level);
					} catch {}
				};
			};
			console.log = forward('info', LoadingOverlay.origConsole.log);
			console.info = forward('info', LoadingOverlay.origConsole.info);
			console.warn = forward('warn', LoadingOverlay.origConsole.warn);
			console.error = forward('error', LoadingOverlay.origConsole.error);
			;(console as any).debug = forward('debug', (LoadingOverlay.origConsole as any).debug || LoadingOverlay.origConsole.log);
		} catch {}
	}

	export function disableConsoleCapture(): void {
		try {
			if (!LoadingOverlay.consolePatched) return;
			LoadingOverlay.consolePatched = false;
			if (LoadingOverlay.origConsole) {
				if (LoadingOverlay.origConsole.log) console.log = LoadingOverlay.origConsole.log;
				if (LoadingOverlay.origConsole.info) console.info = LoadingOverlay.origConsole.info;
				if (LoadingOverlay.origConsole.warn) console.warn = LoadingOverlay.origConsole.warn;
				if (LoadingOverlay.origConsole.error) console.error = LoadingOverlay.origConsole.error;
				if ((LoadingOverlay.origConsole as any).debug) (console as any).debug = (LoadingOverlay.origConsole as any).debug;
			}
		} catch {}
	}
}

