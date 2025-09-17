import * as pc from 'playcanvas';

export class UIManager {
	private app: pc.Application;
	private root: pc.Entity | null = null;
	private menu: pc.Entity | null = null;
	private hud: pc.Entity | null = null;
	private domContainer: HTMLDivElement | null = null;
	private domP1: HTMLDivElement | null = null;
	private domP2: HTMLDivElement | null = null;
	// HUD elements (image-based, fighting game style)
	private p1HealthContainer: pc.Entity | null = null;
	private p2HealthContainer: pc.Entity | null = null;
	private p1HealthFill: pc.Entity | null = null;
	private p2HealthFill: pc.Entity | null = null;
	private p1MeterContainer: pc.Entity | null = null;
	private p2MeterContainer: pc.Entity | null = null;
	private p1MeterSegments: pc.Entity[] = [];
	private p2MeterSegments: pc.Entity[] = [];
	private roundTimerText: pc.Entity | null = null;
	private p1Pips: pc.Entity | null = null;
	private p2Pips: pc.Entity | null = null;
	// Textures
	private healthBgTex: pc.Texture | null = null;
	private healthFillTex: pc.Texture | null = null;
	private meterSegTex: pc.Texture | null = null;

	constructor(app: pc.Application) {
		this.app = app;
	}

	public async initialize(): Promise<void> {
		try { (await import('./LoadingOverlay')).LoadingOverlay.beginTask('ui_init', 'Setting up UI', 1); } catch {}
		this.root = new pc.Entity('UIRoot');
		this.root.addComponent('screen', {
			referenceResolution: new pc.Vec2(1920, 1080),
			scaleMode: pc.SCALEMODE_BLEND,
			scaleBlend: 0.5,
			screenSpace: true
		});
		this.app.root.addChild(this.root);
		this.ensureDomFallback();
		try { (await import('./LoadingOverlay')).LoadingOverlay.endTask('ui_init', true); } catch {}
	}

	public showMenu(): void {
		this.hideHUD();
		if (this.menu) { this.menu.enabled = true; return; }
		this.menu = new pc.Entity('MenuUI');
		this.menu.addComponent('element', { type: pc.ELEMENTTYPE_GROUP, anchor: new pc.Vec4(0,0,1,1) });
		const label = new pc.Entity('MenuLabel');
		label.addComponent('element', { type: pc.ELEMENTTYPE_TEXT, text: 'Press Enter to Start', fontSize: 48, pivot: new pc.Vec2(0.5,0.5), anchor: new pc.Vec4(0.5,0.5,0.5,0.5) });
		this.menu.addChild(label);
		this.root?.addChild(this.menu);
		this.setDomVisible(false);
	}

	public hideMenu(): void {
		if (this.menu) this.menu.enabled = false;
	}

	public showHUD(): void {
		this.hideMenu();
		if (this.hud) { this.hud.enabled = true; this.setDomVisible(true); return; }
		this.hud = new pc.Entity('MatchHUD');
		this.hud.addComponent('element', { type: pc.ELEMENTTYPE_GROUP, anchor: new pc.Vec4(0,0,1,1) });
		this.root?.addChild(this.hud);
		// Build textured HUD asynchronously
		void this.ensureFightingHudBuilt();
		this.setDomVisible(true);
	}

	public hideHUD(): void {
		if (this.hud) this.hud.enabled = false;
		this.setDomVisible(false);
	}

	public updateHUD(p1Health: number, p2Health: number, p1Meter?: number, p2Meter?: number, p1Max?: number, p2Max?: number): void {
		if (!this.hud) return;
		const h1 = Math.max(0, Math.floor(p1Health));
		const h2 = Math.max(0, Math.floor(p2Health));
		const max1 = Math.max(1, Math.floor(p1Max ?? 1000));
		const max2 = Math.max(1, Math.floor(p2Max ?? 1000));
		const m1 = Math.max(0, Math.min(100, Math.floor((p1Meter ?? 0))));
		const m2 = Math.max(0, Math.min(100, Math.floor((p2Meter ?? 0))));

		// Update textured health bars if present
		try {
			const r1 = Math.max(0, Math.min(1, h1 / max1));
			const r2 = Math.max(0, Math.min(1, h2 / max2));
			if (this.p1HealthFill && this.p1HealthFill.element) {
				const a = this.p1HealthFill.element.anchor as pc.Vec4;
				this.p1HealthFill.element.anchor = new pc.Vec4(0, a.y, Math.max(0.001, r1), a.w);
			}
			if (this.p2HealthFill && this.p2HealthFill.element) {
				const a = this.p2HealthFill.element.anchor as pc.Vec4;
				this.p2HealthFill.element.anchor = new pc.Vec4(Math.max(0, 1 - r2), a.y, 1, a.w);
			}
		} catch {}

		// Update meters as 4 segments based on percentage
		try {
			const segs1 = Math.max(0, Math.min(4, Math.floor((m1 / 100) * 4)));
			const segs2 = Math.max(0, Math.min(4, Math.floor((m2 / 100) * 4)));
			this.p1MeterSegments.forEach((e, i) => e.enabled = i < segs1);
			this.p2MeterSegments.forEach((e, i) => e.enabled = i < segs2);
		} catch {}

		// Fallback DOM text (debug/diagnostic)
		if (this.domP1) this.domP1.textContent = `P1: ${h1}${p1Max ? '/' + Math.floor(p1Max) : ''} | ${m1}%`;
		if (this.domP2) this.domP2.textContent = `P2: ${h2}${p2Max ? '/' + Math.floor(p2Max) : ''} | ${m2}%`;
	}

	private ensureDomFallback(): void {
		try {
			const container = document.createElement('div');
			container.id = 'hud-dom-fallback';
			container.style.position = 'fixed';
			container.style.left = '0';
			container.style.right = '0';
			container.style.top = '0';
			container.style.pointerEvents = 'none';
			container.style.zIndex = '10000';
			container.style.display = 'none';
			const p1 = document.createElement('div');
			p1.style.position = 'absolute';
			p1.style.left = '16px';
			p1.style.top = '16px';
			p1.style.color = '#fff';
			p1.style.textShadow = '0 1px 2px rgba(0,0,0,0.8)';
			p1.style.font = 'bold 18px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, sans-serif';
			p1.textContent = 'P1: 1000 | 0%';
			const p2 = document.createElement('div');
			p2.style.position = 'absolute';
			p2.style.right = '16px';
			p2.style.top = '16px';
			p2.style.color = '#fff';
			p2.style.textShadow = '0 1px 2px rgba(0,0,0,0.8)';
			p2.style.font = 'bold 18px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, sans-serif';
			p2.textContent = 'P2: 1000 | 0%';
			container.appendChild(p1);
			container.appendChild(p2);
			document.body.appendChild(container);
			this.domContainer = container;
			this.domP1 = p1;
			this.domP2 = p2;
		} catch {}
	}

	private setDomVisible(visible: boolean): void {
		if (!this.domContainer) return;
		this.domContainer.style.display = visible ? 'block' : 'none';
	}

	// ================== Fighting HUD helpers ==================
	private async ensureFightingHudBuilt(): Promise<void> {
		try {
			await this.loadUiTextures();
			this.buildFightingHud();
			// Hide DOM fallback once textured HUD is successfully built
			this.setDomVisible(false);
		} catch {}
	}

	private async loadUiTextures(): Promise<void> {
		// Load only once
		if (this.healthBgTex && this.healthFillTex && this.meterSegTex) return;
		const [bg, fill, seg] = await Promise.all([
			this.loadTexture('/assets/fighting_ui/ui/health_bars/health_bars/gray_bar.png'),
			this.loadTexture('/assets/fighting_ui/ui/health_bars/health_bars/green_bar.png'),
			this.loadTexture('/assets/fighting_ui/ui/health_bars/health_bars/yellow_bar.png')
		]);
		this.healthBgTex = bg;
		this.healthFillTex = fill;
		this.meterSegTex = seg;
	}

	private loadTexture(url: string): Promise<pc.Texture> {
		return new Promise<pc.Texture>((resolve, reject) => {
			try {
				const img = new Image();
				img.crossOrigin = 'anonymous';
				img.onload = () => {
					try {
						const tex = new pc.Texture(this.app.graphicsDevice, {
							width: img.width,
							height: img.height,
							format: pc.PIXELFORMAT_R8_G8_B8_A8,
							autoMipmap: true
						});
						tex.setSource(img);
						tex.minFilter = pc.FILTER_NEAREST;
						tex.magFilter = pc.FILTER_NEAREST;
						resolve(tex);
					} catch (e) { reject(e as any); }
				};
				img.onerror = () => reject(new Error('Image load failed: ' + url));
				img.src = url;
			} catch (e) {
				reject(e as any);
			}
		});
	}

	private buildFightingHud(): void {
		if (!this.hud || !this.root) return;
		// Clear any leftovers
		try {
			this.hud.children.slice().forEach(c => c.destroy());
		} catch {}

		// Health bars (top)
		this.p1HealthContainer = this.createHealthBar(new pc.Vec4(0.03, 0.92, 0.47, 0.975), false);
		this.p2HealthContainer = this.createHealthBar(new pc.Vec4(0.53, 0.92, 0.97, 0.975), true);

		// Super/EX meters (bottom)
		const p1m = this.createMeterBar(new pc.Vec4(0.03, 0.05, 0.35, 0.085), false, 4);
		const p2m = this.createMeterBar(new pc.Vec4(0.65, 0.05, 0.97, 0.085), true, 4);
		this.p1MeterContainer = p1m.container; this.p1MeterSegments = p1m.segments;
		this.p2MeterContainer = p2m.container; this.p2MeterSegments = p2m.segments;

		// Round timer (center top)
		this.roundTimerText = new pc.Entity('RoundTimer');
		this.roundTimerText.addComponent('element', {
			type: pc.ELEMENTTYPE_TEXT,
			text: '99',
			fontSize: 56,
			color: new pc.Color(1, 1, 1),
			anchor: new pc.Vec4(0.5, 0.90, 0.5, 0.97),
			pivot: new pc.Vec2(0.5, 0.5)
		} as any);
		this.hud.addChild(this.roundTimerText);

		// Round pips
		this.p1Pips = this.createRoundPips('P1Pips', new pc.Vec4(0.25, 0.885, 0.35, 0.91), false);
		this.p2Pips = this.createRoundPips('P2Pips', new pc.Vec4(0.65, 0.885, 0.75, 0.91), true);
	}

	private createHealthBar(anchor: pc.Vec4, flip: boolean): pc.Entity {
		const container = new pc.Entity(flip ? 'P2_HealthBar' : 'P1_HealthBar');
		container.addComponent('element', { type: pc.ELEMENTTYPE_GROUP, anchor });

		const bg = new pc.Entity('BG');
		bg.addComponent('element', {
			type: pc.ELEMENTTYPE_IMAGE,
			texture: this.healthBgTex as any,
			anchor: new pc.Vec4(0, 0, 1, 1),
			color: new pc.Color(1, 1, 1, 0.95)
		} as any);

		const fill = new pc.Entity('Fill');
		fill.addComponent('element', {
			type: pc.ELEMENTTYPE_IMAGE,
			texture: this.healthFillTex as any,
			anchor: flip ? new pc.Vec4(0.999, 0, 1, 1) : new pc.Vec4(0, 0, 1, 1),
			color: new pc.Color(1, 1, 1, 1)
		} as any);

		container.addChild(bg);
		container.addChild(fill);
		this.hud!.addChild(container);

		if (flip) this.p2HealthFill = fill; else this.p1HealthFill = fill;
		return container;
	}

	private createMeterBar(anchor: pc.Vec4, flip: boolean, segments: number): { container: pc.Entity; segments: pc.Entity[] } {
		const container = new pc.Entity(flip ? 'P2_Meter' : 'P1_Meter');
		container.addComponent('element', { type: pc.ELEMENTTYPE_GROUP, anchor });

		const bg = new pc.Entity('BG');
		bg.addComponent('element', {
			type: pc.ELEMENTTYPE_IMAGE,
			texture: this.healthBgTex as any,
			anchor: new pc.Vec4(0, 0, 1, 1),
			color: new pc.Color(1, 1, 1, 0.9)
		} as any);
		container.addChild(bg);

		const segs: pc.Entity[] = [];
		for (let i = 0; i < segments; i++) {
			const left = i / segments;
			const right = (i + 1) / segments;
			const seg = new pc.Entity('Seg_' + i);
			seg.addComponent('element', {
				type: pc.ELEMENTTYPE_IMAGE,
				texture: this.meterSegTex as any,
				anchor: new pc.Vec4(left + 0.01, 0.15, right - 0.01, 0.85),
				color: new pc.Color(1, 1, 1, 1)
			} as any);
			seg.enabled = false;
			container.addChild(seg);
			segs.push(seg);
		}

		this.hud!.addChild(container);
		return { container, segments: segs };
	}

	private createRoundPips(name: string, anchor: pc.Vec4, flip: boolean): pc.Entity {
		const container = new pc.Entity(name);
		container.addComponent('element', { type: pc.ELEMENTTYPE_GROUP, anchor });
		for (let i = 0; i < 3; i++) {
			const pip = new pc.Entity('pip_' + i);
			const w = 0.08;
			const spacing = 0.02;
			const left = (flip ? 1 - (i + 1) * (w + spacing) : i * (w + spacing));
			pip.addComponent('element', {
				type: pc.ELEMENTTYPE_IMAGE,
				anchor: new pc.Vec4(left, 0, left + w, 1),
				color: new pc.Color(0.25, 0.25, 0.3, 0.9)
			} as any);
			container.addChild(pip);
		}
		this.hud!.addChild(container);
		return container;
	}
}

