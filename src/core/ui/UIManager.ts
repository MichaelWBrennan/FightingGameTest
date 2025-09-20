import * as pc from 'playcanvas';
import { Platform } from '../utils/Platform';

export class UIManager {
	private app: pc.Application;
	private root: pc.Entity | null = null;
	private menu: pc.Entity | null = null;
	private hud: pc.Entity | null = null;
	// Runtime-generated font to ensure text renders without Editor font assets
	private canvasFont: any | null = null;
	private touchOverlay: HTMLDivElement | null = null;
	private touchDpad: HTMLDivElement | null = null;
	private touchButtons: HTMLDivElement | null = null;
	private domContainer: HTMLDivElement | null = null;
	private domP1: HTMLDivElement | null = null;
	private domP2: HTMLDivElement | null = null;
	// HUD elements (image-based, fighting game style)
	private p1HealthContainer: pc.Entity | null = null;
	private p2HealthContainer: pc.Entity | null = null;
	private p1HealthFill: pc.Entity | null = null;
	private p2HealthFill: pc.Entity | null = null;
	// Delayed white chip for health bars
	private p1HealthChip: pc.Entity | null = null;
	private p2HealthChip: pc.Entity | null = null;
	private p1MeterContainer: pc.Entity | null = null;
	private p2MeterContainer: pc.Entity | null = null;
	private p1MeterSegments: pc.Entity[] = [];
	private p2MeterSegments: pc.Entity[] = [];
	// Drive gauges (SF6 style)
	private p1DriveContainer: pc.Entity | null = null;
	private p2DriveContainer: pc.Entity | null = null;
	private p1DriveSegments: pc.Entity[] = [];
	private p2DriveSegments: pc.Entity[] = [];
	private p1BurnoutOverlay: pc.Entity | null = null;
	private p2BurnoutOverlay: pc.Entity | null = null;
	private roundTimerText: pc.Entity | null = null;
	private roundTimerCapsule: pc.Entity | null = null;
	private p1Pips: pc.Entity | null = null;
	private p2Pips: pc.Entity | null = null;
	// Nameplates & portraits
	private p1NameText: pc.Entity | null = null;
	private p2NameText: pc.Entity | null = null;
	private p1Portrait: pc.Entity | null = null;
	private p2Portrait: pc.Entity | null = null;
	// Combo & announcer banners
	private comboP1: { container: pc.Entity; hits: pc.Entity; dmg: pc.Entity } | null = null;
	private comboP2: { container: pc.Entity; hits: pc.Entity; dmg: pc.Entity } | null = null;
	private bannerText: pc.Entity | null = null;
	// Textures
	private healthBgTex: pc.Texture | null = null;
	private healthFillTex: pc.Texture | null = null;
	private meterSegTex: pc.Texture | null = null;
	private glossTex: pc.Texture | null = null;
	private pipTex: pc.Texture | null = null;
	private capsuleTex: pc.Texture | null = null;
	private nameplateTex: pc.Texture | null = null;

	// Style
	private style: 'modern' | 'classic' = 'modern';

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
		// Ensure we have a runtime text font available for all text elements
		this.ensureCanvasFont();
		// Retry on next tick in case CanvasFont extras attach after vendor loads
		setTimeout(() => {
			try {
				if (!this.canvasFont && (pc as any).CanvasFont) {
					this.ensureCanvasFont();
					this.applyFontToAllText(this.root || undefined);
				}
			} catch {}
		}, 0);
		this.ensureDomFallback();
		this.ensureTouchControls();
		this.applySafeAreaInsets();
		try { const i18n: any = (this.app as any)._services?.resolve?.('i18n'); if (i18n) { (this as any)._i18n = i18n; } } catch {}
		this.bindResizeHandlers();
		this.updateResponsiveLayout();
		this.setupEventListeners();
		try { (await import('./LoadingOverlay')).LoadingOverlay.endTask('ui_init', true); } catch {}
	}
	private bindResizeHandlers(): void {
		try {
			const handler = () => {
				try { this.applySafeAreaInsets(); } catch {}
				try { this.updateResponsiveLayout(); } catch {}
			};
			window.addEventListener('resize', handler);
			window.addEventListener('orientationchange', handler as any);
		} catch {}
	}

	private updateResponsiveLayout(): void {
		try {
			const w = Math.max(1, window.innerWidth || 1);
			const h = Math.max(1, window.innerHeight || 1);
			const portrait = h >= w;
			// Adjust screen reference if available (helps text scale feel consistent)
			if (this.root && (this.root as any).screen) {
				const refW = portrait ? 1080 : 1920;
				const refH = portrait ? 1920 : 1080;
				(this.root as any).screen.referenceResolution = new pc.Vec2(refW, refH);
			}
			// Apply HUD orientation layout
			this.applyHudOrientationLayout(portrait);
			// Resize touch controls for mobile
			if (this.touchOverlay && Platform.kind() === 'mobile') {
				const minDim = Math.min(w, h);
				const dpadSize = Math.round(Math.max(120, Math.min(240, minDim * (portrait ? 0.28 : 0.22))));
				const buttonSize = Math.round(Math.max(64, Math.min(112, minDim * (portrait ? 0.12 : 0.10))));
				const gap = Math.round(buttonSize * 0.18);
				if (this.touchDpad) {
					this.touchDpad.style.width = `${dpadSize}px`;
					this.touchDpad.style.height = `${dpadSize}px`;
				}
				if (this.touchButtons) {
					this.touchButtons.style.width = `${buttonSize * 3 + gap * 2}px`;
					this.touchButtons.style.height = `${buttonSize * 2 + gap}px`;
					(this.touchButtons.style as any).gap = `${gap}px`;
					Array.from(this.touchButtons.querySelectorAll('button')).forEach((el: Element) => {
						const b = el as HTMLButtonElement;
						b.style.width = `${buttonSize}px`;
						b.style.height = `${buttonSize}px`;
					});
				}
			}
		} catch {}
	}

	private applyHudOrientationLayout(portrait: boolean): void {
		try {
			if (!this.hud) return;
			const set = (e: pc.Entity | null | undefined, a: pc.Vec4) => { try { if (e && (e as any).element) (e as any).element.anchor = a; } catch {} };
			if (portrait) {
				// Top: health bars slightly narrower with bigger center gap
				set(this.p1HealthContainer, new pc.Vec4(0.05, 0.885, 0.48, 0.965));
				set(this.p2HealthContainer, new pc.Vec4(0.52, 0.885, 0.95, 0.965));
				// Drive just below
				set(this.p1DriveContainer, new pc.Vec4(0.05, 0.870, 0.48, 0.885));
				set(this.p2DriveContainer, new pc.Vec4(0.52, 0.870, 0.95, 0.885));
				// Timer in center
				set(this.roundTimerCapsule, new pc.Vec4(0.43, 0.86, 0.57, 0.985));
				set(this.roundTimerText, new pc.Vec4(0.47, 0.875, 0.53, 0.970));
				// Pips
				set(this.p1Pips, new pc.Vec4(0.18, 0.83, 0.32, 0.86));
				set(this.p2Pips, new pc.Vec4(0.68, 0.83, 0.82, 0.86));
				// Nameplate containers
				const p1Plate = (this.p1NameText && (this.p1NameText.parent as pc.Entity)) || null;
				const p2Plate = (this.p2NameText && (this.p2NameText.parent as pc.Entity)) || null;
				set(p1Plate, new pc.Vec4(0.05, 0.76, 0.40, 0.82));
				set(p2Plate, new pc.Vec4(0.60, 0.76, 0.95, 0.82));
				// Bottom meters a bit wider
				set(this.p1MeterContainer, new pc.Vec4(0.05, 0.05, 0.45, 0.085));
				set(this.p2MeterContainer, new pc.Vec4(0.55, 0.05, 0.95, 0.085));
			} else {
				// Restore landscape defaults
				set(this.p1HealthContainer, new pc.Vec4(0.03, 0.90, 0.47, 0.97));
				set(this.p2HealthContainer, new pc.Vec4(0.53, 0.90, 0.97, 0.97));
				set(this.p1DriveContainer, new pc.Vec4(0.03, 0.885, 0.47, 0.900));
				set(this.p2DriveContainer, new pc.Vec4(0.53, 0.885, 0.97, 0.900));
				set(this.roundTimerCapsule, new pc.Vec4(0.44, 0.86, 0.56, 0.98));
				set(this.roundTimerText, new pc.Vec4(0.47, 0.885, 0.53, 0.975));
				set(this.p1Pips, new pc.Vec4(0.25, 0.86, 0.35, 0.89));
				set(this.p2Pips, new pc.Vec4(0.65, 0.86, 0.75, 0.89));
				set(this.p1MeterContainer, new pc.Vec4(0.03, 0.05, 0.35, 0.085));
				set(this.p2MeterContainer, new pc.Vec4(0.65, 0.05, 0.97, 0.085));
				const p1Plate = (this.p1NameText && (this.p1NameText.parent as pc.Entity)) || null;
				const p2Plate = (this.p2NameText && (this.p2NameText.parent as pc.Entity)) || null;
				set(p1Plate, new pc.Vec4(0.03, 0.79, 0.30, 0.85));
				set(p2Plate, new pc.Vec4(0.70, 0.79, 0.97, 0.85));
			}
		} catch {}
	}

	public showMenu(): void {
		this.hideHUD();
		if (this.menu) { this.menu.enabled = true; return; }
		this.menu = new pc.Entity('MenuUI');
		this.menu.addComponent('element', { type: pc.ELEMENTTYPE_GROUP, anchor: new pc.Vec4(0,0,1,1) });
		// Image-based background splash
		const bg = new pc.Entity('MenuBackground');
		bg.addComponent('element', {
			type: pc.ELEMENTTYPE_IMAGE,
			anchor: new pc.Vec4(0, 0, 1, 1),
			// Use gold background if available
			texture: null as any,
			color: new pc.Color(0,0,0,1),
		} as any);
		this.menu.addChild(bg);
		// Title/logo area (center top)
		const title = new pc.Entity('MenuTitle');
		title.addComponent('element', {
			type: pc.ELEMENTTYPE_TEXT,
			text: ((this as any)._i18n?.t?.('title') || 'Street Fighter III'),
			fontSize: 56,
			color: new pc.Color(1,1,1,1),
			anchor: new pc.Vec4(0.5, 0.12, 0.5, 0.12),
			pivot: new pc.Vec2(0.5, 0.5)
		} as any);
		this.applyTextFont(title);
		this.menu.addChild(title);
		// Start button styled as image-based button
		const startButton = new pc.Entity('StartButton');
		startButton.addComponent('element', {
			type: pc.ELEMENTTYPE_IMAGE,
			anchor: new pc.Vec4(0.4, 0.75, 0.6, 0.85),
			color: new pc.Color(0.15, 0.35, 0.85, 0.95)
		} as any);
		startButton.addComponent('button', { imageEntity: startButton });
		const startText = new pc.Entity('StartText');
		startText.addComponent('element', {
			type: pc.ELEMENTTYPE_TEXT,
			text: Platform.kind() === 'mobile' ? 'Tap to Start' : 'Press Enter',
			fontSize: 28,
			color: new pc.Color(1,1,1,1),
			anchor: new pc.Vec4(0,0,1,1),
			pivot: new pc.Vec2(0.5,0.5)
		} as any);
		this.applyTextFont(startText);
		startButton.addChild(startText);
		startButton.button!.on('click', () => {
			try {
				// Synthesize Enter key for existing flow
				const ev = new KeyboardEvent('keydown', { key: 'Enter' });
				window.dispatchEvent(ev);
			} catch {}
		});
		this.menu.addChild(startButton);
		this.root?.addChild(this.menu);
		this.setDomVisible(false);
		// Attempt to load textures asynchronously for background and button skin
		void (async () => {
			try {
				const bgTex = await this.loadTexture('/assets/fighting_ui/ui/health_bars/health_bars/gold_background.png');
				if ((bg as any).element) { (bg as any).element.texture = bgTex; (bg as any).element.color = new pc.Color(1,1,1,1); }
			} catch {}
			try {
				const btnTex = await this.loadTexture('/assets/fighting_ui/ui/kenney_ui-pack/PNG/Blue/Default/button_rectangle_flat.png');
				if ((startButton as any).element) { (startButton as any).element.texture = btnTex; (startButton as any).element.color = new pc.Color(1,1,1,1); }
			} catch {}
		})();
	}

	public hideMenu(): void {
		if (this.menu) this.menu.enabled = false;
	}

	public showHUD(): void {
		this.hideMenu();
		if (this.hud) { this.hud.enabled = true; this.setDomVisible(false); return; }
		this.hud = new pc.Entity('MatchHUD');
		this.hud.addComponent('element', { type: pc.ELEMENTTYPE_GROUP, anchor: new pc.Vec4(0,0,1,1) });
		this.root?.addChild(this.hud);
		// Build textured HUD asynchronously
		void this.ensureFightingHudBuilt();
		this.setDomVisible(false);
	}

	public hideHUD(): void {
		if (this.hud) this.hud.enabled = false;
		this.setDomVisible(false);
	}

	public updateHUD(p1Health: number, p2Health: number, p1Meter?: number, p2Meter?: number, p1Max?: number, p2Max?: number, p1Drive?: number, p2Drive?: number): void {
		if (!this.hud) return;
		const h1 = Math.max(0, Math.floor(p1Health));
		const h2 = Math.max(0, Math.floor(p2Health));
		const max1 = Math.max(1, Math.floor(p1Max ?? 1000));
		const max2 = Math.max(1, Math.floor(p2Max ?? 1000));
		const m1 = Math.max(0, Math.min(100, Math.floor((p1Meter ?? 0))));
		const m2 = Math.max(0, Math.min(100, Math.floor((p2Meter ?? 0))));
		const d1 = Math.max(0, Math.min(100, Math.floor((p1Drive ?? 100))));
		const d2 = Math.max(0, Math.min(100, Math.floor((p2Drive ?? 100))));

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
			// Animate chip bars toward the fill ratio
			if (this.p1HealthChip && this.p1HealthChip.element) {
				const a = this.p1HealthChip.element.anchor as pc.Vec4;
				const current = a.z;
				const target = Math.max(0.001, h1 / max1);
				const next = current + (target - current) * 0.08; // slow catch-up
				this.p1HealthChip.element.anchor = new pc.Vec4(0, a.y, Math.max(0.001, next), a.w);
			}
			if (this.p2HealthChip && this.p2HealthChip.element) {
				const a = this.p2HealthChip.element.anchor as pc.Vec4;
				const currentLeft = a.x;
				const targetLeft = Math.max(0, 1 - (h2 / max2));
				const next = currentLeft + (targetLeft - currentLeft) * 0.08;
				this.p2HealthChip.element.anchor = new pc.Vec4(Math.max(0, next), a.y, 1, a.w);
			}
		} catch {}

		// Update super meters as 3 segments based on percentage (SF6 SA levels)
		try {
			const segs1 = Math.max(0, Math.min(3, Math.floor((m1 / 100) * 3 + 0.0001)));
			const segs2 = Math.max(0, Math.min(3, Math.floor((m2 / 100) * 3 + 0.0001)));
			this.p1MeterSegments.forEach((e, i) => e.enabled = i < segs1);
			this.p2MeterSegments.forEach((e, i) => e.enabled = i < segs2);
		} catch {}

		// Update drive gauges as 6 segments, burnout overlay when 0
		try {
			const dSegs1 = Math.max(0, Math.min(6, Math.floor((d1 / 100) * 6 + 0.0001)));
			const dSegs2 = Math.max(0, Math.min(6, Math.floor((d2 / 100) * 6 + 0.0001)));
			this.p1DriveSegments.forEach((e, i) => e.enabled = i < dSegs1);
			this.p2DriveSegments.forEach((e, i) => e.enabled = i < dSegs2);
			if (this.p1BurnoutOverlay && this.p1BurnoutOverlay.element) this.p1BurnoutOverlay.enabled = (dSegs1 === 0);
			if (this.p2BurnoutOverlay && this.p2BurnoutOverlay.element) this.p2BurnoutOverlay.enabled = (dSegs2 === 0);
		} catch {}

		// Fallback DOM text (debug/diagnostic) is disabled for production HUD
		if (false) {
			if (this.domP1) this.domP1.textContent = `P1: ${h1}${p1Max ? '/' + Math.floor(p1Max) : ''} | ${m1}%`;
			if (this.domP2) this.domP2.textContent = `P2: ${h2}${p2Max ? '/' + Math.floor(p2Max) : ''} | ${m2}%`;
		}
	}

	public setNameplates(p1Name: string, p2Name: string, p1PortraitId?: string, p2PortraitId?: string): void {
		// Create if missing
		if (!this.hud) return;
		if (!this.p1NameText || !this.p2NameText) {
			const left = this.createNameplate(new pc.Vec4(0.03, 0.79, 0.30, 0.85), false);
			const right = this.createNameplate(new pc.Vec4(0.70, 0.79, 0.97, 0.85), true);
			this.p1NameText = left.text; this.p1Portrait = left.portrait;
			this.p2NameText = right.text; this.p2Portrait = right.portrait;
		}
		if (this.p1NameText?.element) this.p1NameText.element.text = `PLAYER 1: ${(p1Name || 'PLAYER 1').toUpperCase()}`;
		if (this.p2NameText?.element) this.p2NameText.element.text = `PLAYER 2: ${(p2Name || 'PLAYER 2').toUpperCase()}`;
		// Try to load portraits from conventional path; fall back to solid
		if (p1PortraitId) this.setPortraitTexture(this.p1Portrait!, `/assets/portraits/${p1PortraitId}.png`, new pc.Color(0.12,0.12,0.12,1));
		if (p2PortraitId) this.setPortraitTexture(this.p2Portrait!, `/assets/portraits/${p2PortraitId}.png`, new pc.Color(0.12,0.12,0.12,1));
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

	// ====== Touch Controls Overlay (Mobile) ======
	private ensureTouchControls(): void {
		if (Platform.kind() !== 'mobile') return;
		try {
			if (this.touchOverlay) return;
			const overlay = document.createElement('div');
			overlay.id = 'touch-controls';
			overlay.style.position = 'fixed';
			overlay.style.left = '0';
			overlay.style.right = '0';
			overlay.style.top = '0';
			overlay.style.bottom = '0';
			overlay.style.pointerEvents = 'none';
			overlay.style.zIndex = '10001';
			// D-Pad container (left)
			const dpad = document.createElement('div');
			dpad.style.position = 'absolute';
			dpad.style.left = '16px';
			dpad.style.bottom = '16px';
			dpad.style.width = '180px';
			dpad.style.height = '180px';
			dpad.style.opacity = '0.75';
			dpad.style.pointerEvents = 'auto';
			dpad.style.touchAction = 'none';
			// Buttons container (right)
			const buttons = document.createElement('div');
			buttons.style.position = 'absolute';
			buttons.style.right = '16px';
			buttons.style.bottom = '24px';
			buttons.style.width = '260px';
			buttons.style.height = '220px';
			buttons.style.display = 'grid';
			buttons.style.gridTemplateColumns = 'repeat(3, 1fr)';
			buttons.style.gridTemplateRows = 'repeat(2, 1fr)';
			buttons.style.gap = '12px';
			buttons.style.opacity = '0.75';
			buttons.style.pointerEvents = 'auto';
			buttons.style.touchAction = 'none';

			const mkBtn = (label: string) => {
				const b = document.createElement('button');
				b.textContent = label;
				b.style.width = '80px';
				b.style.height = '80px';
				b.style.borderRadius = '50%';
				b.style.border = 'none';
				b.style.background = 'rgba(20,40,120,0.6)';
				b.style.color = '#fff';
				b.style.fontWeight = 'bold';
				b.style.textShadow = '0 1px 2px rgba(0,0,0,0.6)';
				b.style.boxShadow = '0 2px 8px rgba(0,0,0,0.35) inset, 0 2px 6px rgba(0,0,0,0.2)';
				b.style.pointerEvents = 'auto';
				b.oncontextmenu = (e) => { e.preventDefault(); };
				return b;
			};

			// Build dpad (up, left, right, down)
			const mkD = (name: string) => {
				const d = document.createElement('div');
				d.style.position = 'absolute';
				d.style.width = '64px';
				d.style.height = '64px';
				d.style.borderRadius = '16px';
				d.style.background = 'rgba(20,20,24,0.45)';
				d.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25) inset, 0 2px 6px rgba(0,0,0,0.2)';
				d.setAttribute('data-dir', name);
				return d;
			};
			const up = mkD('up'); up.style.left = '58px'; up.style.top = '0';
			const left = mkD('left'); left.style.left = '0'; left.style.top = '58px';
			const right = mkD('right'); right.style.right = '0'; right.style.left = '116px'; right.style.top = '58px';
			const down = mkD('down'); down.style.left = '58px'; down.style.top = '116px';
			dpad.appendChild(up); dpad.appendChild(left); dpad.appendChild(right); dpad.appendChild(down);

			// Build attack buttons (LP, MP, HP, LK, MK, HK)
			const labels = [
				{ t: 'LP', a: 'lightPunch' },
				{ t: 'MP', a: 'mediumPunch' },
				{ t: 'HP', a: 'heavyPunch' },
				{ t: 'LK', a: 'lightKick' },
				{ t: 'MK', a: 'mediumKick' },
				{ t: 'HK', a: 'heavyKick' }
			] as const;
			for (const it of labels) {
				const b = mkBtn(it.t);
				b.setAttribute('data-action', it.a);
				buttons.appendChild(b);
			}

			overlay.appendChild(dpad);
			overlay.appendChild(buttons);
			document.body.appendChild(overlay);
			this.touchOverlay = overlay;
			this.touchDpad = dpad;
			this.touchButtons = buttons;
			// Initial responsive sizing
			this.updateResponsiveLayout();

			// Wire events to InputManager touch API
			const services: any = (this.app as any)._services;
			const input: any = services?.resolve?.('input');
			if (!input) return;

			const pressDir = (dir: 'up'|'down'|'left'|'right', pressed: boolean) => {
				try { input.setTouchDpad(dir, pressed); } catch {}
			};
			const pressAct = (act: 'lightPunch'|'mediumPunch'|'heavyPunch'|'lightKick'|'mediumKick'|'heavyKick', pressed: boolean) => {
				try { input.setTouchButton(act, pressed); } catch {}
			};

			const bindPress = (el: HTMLElement, onPress: () => void, onRelease: () => void) => {
				const downEv = (e: Event) => { e.preventDefault(); onPress(); };
				const upEv = (e: Event) => { e.preventDefault(); onRelease(); };
				el.addEventListener('touchstart', downEv, { passive: false });
				el.addEventListener('touchend', upEv, { passive: false });
				el.addEventListener('touchcancel', upEv, { passive: false });
				el.addEventListener('mousedown', downEv);
				el.addEventListener('mouseup', upEv);
				el.addEventListener('mouseleave', upEv);
			};

			[dpad.querySelector('[data-dir="up"]')!, dpad.querySelector('[data-dir="down"]')!, dpad.querySelector('[data-dir="left"]')!, dpad.querySelector('[data-dir="right"]')!]
				.forEach((el) => {
					const dir = el.getAttribute('data-dir') as 'up'|'down'|'left'|'right';
					bindPress(el as HTMLElement, () => pressDir(dir, true), () => pressDir(dir, false));
				});

			Array.from(buttons.querySelectorAll('button')).forEach((el) => {
				const act = el.getAttribute('data-action') as 'lightPunch'|'mediumPunch'|'heavyPunch'|'lightKick'|'mediumKick'|'heavyKick';
				bindPress(el as HTMLElement, () => pressAct(act, true), () => pressAct(act, false));
			});
		} catch {}
	}

	private setDomVisible(visible: boolean): void {
		if (!this.domContainer) return;
		this.domContainer.style.display = visible ? 'block' : 'none';
	}

	// Respect mobile safe-area insets by padding the screen element anchors
	private applySafeAreaInsets(): void {
		try {
			const style = getComputedStyle(document.documentElement);
			const l = parseFloat(style.getPropertyValue('env(safe-area-inset-left)') || '0') || 0;
			const r = parseFloat(style.getPropertyValue('env(safe-area-inset-right)') || '0') || 0;
			const t = parseFloat(style.getPropertyValue('env(safe-area-inset-top)') || '0') || 0;
			const b = parseFloat(style.getPropertyValue('env(safe-area-inset-bottom)') || '0') || 0;
			// Convert px to normalized anchor padding (approx using window size)
			const w = Math.max(1, window.innerWidth);
			const h = Math.max(1, window.innerHeight);
			const padX = Math.max(0, Math.min(0.06, l / w + r / w));
			const padY = Math.max(0, Math.min(0.08, t / h + b / h));
			if (this.root && (this.root as any).screen) {
				// Adjust reference resolution anchor indirectly by adding an overlay padding entity if needed
				(this.root as any).screen.referenceResolution = new pc.Vec2(1920, 1080);
			}
			// Shift HUD groups down from the very edge
			if (this.hud && this.hud.element) {
				const a = this.hud.element.anchor as pc.Vec4;
				this.hud.element.anchor = new pc.Vec4(a.x + padX * 0.5, a.y + padY * 0.5, a.z - padX * 0.5, a.w - padY * 0.5);
			}
		} catch {}
	}

	// ================== Fighting HUD helpers ==================
	private async ensureFightingHudBuilt(): Promise<void> {
		try {
			await this.loadUiTextures();
			this.buildFightingHud();
			// Apply font to any text created during build
			this.applyFontToAllText(this.hud || undefined);
			// Hide DOM fallback only if a runtime font is available
			if (this.canvasFont) this.setDomVisible(false); else this.setDomVisible(true);
		} catch {}
	}

	private async loadUiTextures(): Promise<void> {
		// Load only once
		if (this.healthBgTex && this.healthFillTex && this.meterSegTex) return;

		if (this.style === 'modern') {
			// Generate modern textures procedurally (crisp, minimal, scalable)
			this.healthBgTex = this.createRoundedGradientTexture(512, 28, 12, '#0f172a', '#111827', '#334155');
			this.healthFillTex = this.createGradientTexture('#22c55e', '#16a34a');
			this.meterSegTex = this.createGradientTexture('#60a5fa', '#2563eb');
			this.glossTex = this.createVerticalAlphaGradientTexture(256, 28, 0.15, 0.0);
			this.pipTex = this.createCircleTexture(22, '#94a3b8', 0.12);
			this.capsuleTex = this.createRoundedGradientTexture(320, 80, 40, '#0b1220', '#0f172a', '#1f2937');
			this.nameplateTex = this.createRoundedGradientTexture(420, 48, 16, '#0b1220', '#0f172a', '#1f2937');
			return;
		}

		// Classic image-based fallback
		const bg = await this.tryLoadTexture(
			'/assets/fighting_ui/ui/health_bars/health_bars/gray_bar.png',
			new pc.Color(0.25, 0.25, 0.25, 1)
		);
		const fill = await this.tryLoadTexture(
			'/assets/fighting_ui/ui/health_bars/health_bars/green_bar.png',
			new pc.Color(0.0, 0.9, 0.0, 1)
		);
		const seg = await this.tryLoadTexture(
			'/assets/fighting_ui/ui/health_bars/health_bars/yellow_bar.png',
			new pc.Color(1.0, 0.9, 0.0, 1)
		);
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

	private async tryLoadTexture(url: string, fallbackColor: pc.Color): Promise<pc.Texture> {
		try {
			return await this.loadTexture(url);
		} catch {
			return this.createSolidTexture(fallbackColor);
		}
	}

	private async setPortraitTexture(entity: pc.Entity, url: string, bg: pc.Color): Promise<void> {
		try {
			const tex = await this.loadTexture(url);
			if (entity.element) { (entity.element as any).texture = tex; (entity.element as any).color = new pc.Color(1,1,1,1); }
		} catch {
			if (entity.element) { (entity.element as any).texture = this.createSolidTexture(bg) as any; (entity.element as any).color = new pc.Color(1,1,1,1); }
		}
	}

	private createSolidTexture(color: pc.Color): pc.Texture {
		const canvas = document.createElement('canvas');
		canvas.width = 2;
		canvas.height = 2;
		const ctx = canvas.getContext('2d');
		if (ctx) {
			ctx.fillStyle = `rgba(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)},${color.a ?? 1})`;
			ctx.fillRect(0, 0, 2, 2);
		}
		const tex = new pc.Texture(this.app.graphicsDevice, {
			width: 2,
			height: 2,
			format: pc.PIXELFORMAT_R8_G8_B8_A8,
			autoMipmap: true
		});
		tex.setSource(canvas as unknown as HTMLImageElement);
		tex.minFilter = pc.FILTER_NEAREST;
		tex.magFilter = pc.FILTER_NEAREST;
		return tex;
	}

	private createGradientTexture(start: string, end: string): pc.Texture {
		const canvas = document.createElement('canvas');
		canvas.width = 256;
		canvas.height = 16;
		const ctx = canvas.getContext('2d')!;
		const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
		grad.addColorStop(0, start);
		grad.addColorStop(1, end);
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		// subtle gloss line
		ctx.fillStyle = 'rgba(255,255,255,0.08)';
		ctx.fillRect(0, 0, canvas.width, 2);
		const tex = new pc.Texture(this.app.graphicsDevice, {
			width: canvas.width,
			height: canvas.height,
			format: pc.PIXELFORMAT_R8_G8_B8_A8,
			autoMipmap: true
		});
		tex.setSource(canvas as unknown as HTMLImageElement);
		tex.minFilter = pc.FILTER_LINEAR;
		tex.magFilter = pc.FILTER_LINEAR;
		return tex;
	}

	private createVerticalAlphaGradientTexture(width: number, height: number, topA: number, bottomA: number): pc.Texture {
		const canvas = document.createElement('canvas');
		canvas.width = Math.max(2, width|0);
		canvas.height = Math.max(2, height|0);
		const ctx = canvas.getContext('2d')!;
		const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
		grad.addColorStop(0, `rgba(255,255,255,${Math.max(0, Math.min(1, topA))})`);
		grad.addColorStop(1, `rgba(255,255,255,${Math.max(0, Math.min(1, bottomA))})`);
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		const tex = new pc.Texture(this.app.graphicsDevice, {
			width: canvas.width,
			height: canvas.height,
			format: pc.PIXELFORMAT_R8_G8_B8_A8,
			autoMipmap: true
		});
		tex.setSource(canvas as unknown as HTMLImageElement);
		tex.minFilter = pc.FILTER_LINEAR;
		tex.magFilter = pc.FILTER_LINEAR;
		return tex;
	}

	private createRoundedGradientTexture(width: number, height: number, radius: number, start: string, end: string, border: string | null = null): pc.Texture {
		const canvas = document.createElement('canvas');
		canvas.width = Math.max(2, width|0);
		canvas.height = Math.max(2, height|0);
		const ctx = canvas.getContext('2d')!;
		const r = Math.max(0, radius|0);
		const w = canvas.width, h = canvas.height;
		const path = new Path2D();
		path.moveTo(r, 0);
		path.lineTo(w - r, 0);
		path.quadraticCurveTo(w, 0, w, r);
		path.lineTo(w, h - r);
		path.quadraticCurveTo(w, h, w - r, h);
		path.lineTo(r, h);
		path.quadraticCurveTo(0, h, 0, h - r);
		path.lineTo(0, r);
		path.quadraticCurveTo(0, 0, r, 0);
		path.closePath();
		const grad = ctx.createLinearGradient(0, 0, w, 0);
		grad.addColorStop(0, start);
		grad.addColorStop(1, end);
		ctx.fillStyle = grad;
		ctx.fill(path);
		if (border) {
			ctx.strokeStyle = border;
			ctx.lineWidth = Math.max(1, Math.round(h * 0.06));
			ctx.stroke(path);
		}
		const tex = new pc.Texture(this.app.graphicsDevice, {
			width: canvas.width,
			height: canvas.height,
			format: pc.PIXELFORMAT_R8_G8_B8_A8,
			autoMipmap: true
		});
		tex.setSource(canvas as unknown as HTMLImageElement);
		tex.minFilter = pc.FILTER_LINEAR;
		tex.magFilter = pc.FILTER_LINEAR;
		return tex;
	}

	private createCircleTexture(diameter: number, color: string, glow: number = 0): pc.Texture {
		const d = Math.max(8, diameter|0);
		const canvas = document.createElement('canvas');
		canvas.width = d;
		canvas.height = d;
		const ctx = canvas.getContext('2d')!;
		const r = d / 2;
		if (glow > 0) {
			const g = ctx.createRadialGradient(r, r, r * 0.2, r, r, r);
			g.addColorStop(0, color);
			g.addColorStop(1, 'rgba(0,0,0,0)');
			ctx.fillStyle = g;
			ctx.fillRect(0, 0, d, d);
		}
		ctx.beginPath();
		ctx.arc(r, r, r * 0.8, 0, Math.PI * 2);
		ctx.closePath();
		ctx.fillStyle = color;
		ctx.fill();
		const tex = new pc.Texture(this.app.graphicsDevice, {
			width: d,
			height: d,
			format: pc.PIXELFORMAT_R8_G8_B8_A8,
			autoMipmap: true
		});
		tex.setSource(canvas as unknown as HTMLImageElement);
		tex.minFilter = pc.FILTER_LINEAR;
		tex.magFilter = pc.FILTER_LINEAR;
		return tex;
	}

	private buildFightingHud(): void {
		if (!this.hud || !this.root) return;
		// Clear any leftovers
		try {
			this.hud.children.slice().forEach(c => c.destroy());
		} catch {}

		// Health bars (top) - slightly lower and wider for modern look
		this.p1HealthContainer = this.createHealthBar(new pc.Vec4(0.03, 0.90, 0.47, 0.97), false);
		this.p2HealthContainer = this.createHealthBar(new pc.Vec4(0.53, 0.90, 0.97, 0.97), true);

		// Drive gauges (just below health bars) - 6 segments, burnout overlay
		const p1d = this.createDriveGauge(new pc.Vec4(0.03, 0.885, 0.47, 0.900), false, 6);
		const p2d = this.createDriveGauge(new pc.Vec4(0.53, 0.885, 0.97, 0.900), true, 6);
		this.p1DriveContainer = p1d.container; this.p1DriveSegments = p1d.segments; this.p1BurnoutOverlay = p1d.burnout;
		this.p2DriveContainer = p2d.container; this.p2DriveSegments = p2d.segments; this.p2BurnoutOverlay = p2d.burnout;

		// Super/EX meters (bottom) - 3 segments for SA1-SA3
		const p1m = this.createMeterBar(new pc.Vec4(0.03, 0.05, 0.35, 0.085), false, 3);
		const p2m = this.createMeterBar(new pc.Vec4(0.65, 0.05, 0.97, 0.085), true, 3);
		this.p1MeterContainer = p1m.container; this.p1MeterSegments = p1m.segments;
		this.p2MeterContainer = p2m.container; this.p2MeterSegments = p2m.segments;

		// Round timer (center top) with capsule background
		if (this.capsuleTex) {
			this.roundTimerCapsule = new pc.Entity('TimerCapsule');
			this.roundTimerCapsule.addComponent('element', {
				type: pc.ELEMENTTYPE_IMAGE,
				texture: this.capsuleTex as any,
				anchor: new pc.Vec4(0.44, 0.86, 0.56, 0.98),
				color: new pc.Color(1,1,1,0.96)
			} as any);
			this.hud.addChild(this.roundTimerCapsule);
		}

		// Round timer (center top)
		this.roundTimerText = new pc.Entity('RoundTimer');
		this.roundTimerText.addComponent('element', {
			type: pc.ELEMENTTYPE_TEXT,
			text: '99',
			fontSize: 64,
			color: new pc.Color(0.96, 0.98, 1),
			// Give the timer a non-zero width so text is visible
			anchor: new pc.Vec4(0.47, 0.885, 0.53, 0.975),
			alignment: new pc.Vec2(0.5, 0.5),
			pivot: new pc.Vec2(0.5, 0.5)
		} as any);
		this.applyTextFont(this.roundTimerText);
		this.hud.addChild(this.roundTimerText);

		// Round pips
		this.p1Pips = this.createRoundPips('P1Pips', new pc.Vec4(0.25, 0.86, 0.35, 0.89), false);
		this.p2Pips = this.createRoundPips('P2Pips', new pc.Vec4(0.65, 0.86, 0.75, 0.89), true);

		// Nameplates & portraits (lowered slightly to avoid overlapping health/drive bars)
		const left = this.createNameplate(new pc.Vec4(0.03, 0.79, 0.30, 0.85), false);
		const right = this.createNameplate(new pc.Vec4(0.70, 0.79, 0.97, 0.85), true);
		this.p1NameText = left.text; this.p1Portrait = left.portrait;
		this.p2NameText = right.text; this.p2Portrait = right.portrait;

		// Combo displays
		this.comboP1 = this.createComboDisplay(new pc.Vec4(0.08, 0.70, 0.22, 0.80), new pc.Color(1, 0.92, 0.65));
		this.comboP2 = this.createComboDisplay(new pc.Vec4(0.78, 0.70, 0.92, 0.80), new pc.Color(0.80, 0.92, 1));

		// Announcer banner
		this.bannerText = new pc.Entity('BannerText');
		this.bannerText.addComponent('element', {
			type: pc.ELEMENTTYPE_TEXT,
			text: '',
			fontSize: 84,
			color: new pc.Color(1, 1, 1, 1),
			anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
			pivot: new pc.Vec2(0.5, 0.5)
		} as any);
		this.applyTextFont(this.bannerText);
		this.bannerText.enabled = false;
		this.hud.addChild(this.bannerText);
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

		// Chip bar (white delayed damage)
		const chip = new pc.Entity('Chip');
		chip.addComponent('element', {
			type: pc.ELEMENTTYPE_IMAGE,
			texture: this.createGradientTexture('#ffffff', '#d1d5db') as any,
			anchor: flip ? new pc.Vec4(0.999, 0, 1, 1) : new pc.Vec4(0, 0, 1, 1),
			color: new pc.Color(1, 1, 1, 0.5)
		} as any);

		// Subtle gloss overlay for modern look
		if (this.glossTex) {
			const gloss = new pc.Entity('Gloss');
			gloss.addComponent('element', {
				type: pc.ELEMENTTYPE_IMAGE,
				texture: this.glossTex as any,
				anchor: new pc.Vec4(0, 0, 1, 1),
				color: new pc.Color(1, 1, 1, 0.45)
			} as any);
			container.addChild(gloss);
		}

		container.addChild(bg);
		container.addChild(fill);
		container.addChild(chip);
		this.hud!.addChild(container);

		if (flip) { this.p2HealthFill = fill; this.p2HealthChip = chip; } else { this.p1HealthFill = fill; this.p1HealthChip = chip; }
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

	private createDriveGauge(anchor: pc.Vec4, flip: boolean, segments: number): { container: pc.Entity; segments: pc.Entity[]; burnout: pc.Entity } {
		const container = new pc.Entity(flip ? 'P2_Drive' : 'P1_Drive');
		container.addComponent('element', { type: pc.ELEMENTTYPE_GROUP, anchor });

		const bg = new pc.Entity('BG');
		bg.addComponent('element', {
			type: pc.ELEMENTTYPE_IMAGE,
			texture: this.healthBgTex as any,
			anchor: new pc.Vec4(0, 0, 1, 1),
			color: new pc.Color(1, 1, 1, 0.75)
		} as any);
		container.addChild(bg);

		const segs: pc.Entity[] = [];
		for (let i = 0; i < segments; i++) {
			const left = i / segments;
			const right = (i + 1) / segments;
			const seg = new pc.Entity('DriveSeg_' + i);
			seg.addComponent('element', {
				type: pc.ELEMENTTYPE_IMAGE,
				texture: this.createGradientTexture('#38bdf8', '#0ea5e9') as any,
				anchor: new pc.Vec4(left + 0.005, 0.2, right - 0.005, 0.8),
				color: new pc.Color(1, 1, 1, 1)
			} as any);
			seg.enabled = true;
			container.addChild(seg);
			segs.push(seg);
		}

		// Burnout overlay (red tint when empty)
		const burnout = new pc.Entity('Burnout');
		burnout.addComponent('element', {
			type: pc.ELEMENTTYPE_IMAGE,
			texture: this.createSolidTexture(new pc.Color(0.75, 0.10, 0.12, 1)) as any,
			anchor: new pc.Vec4(0, 0, 1, 1),
			color: new pc.Color(1, 1, 1, 0.0)
		} as any);
		burnout.enabled = false;
		container.addChild(burnout);

		this.hud!.addChild(container);
		return { container, segments: segs, burnout };
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
				texture: this.pipTex as any,
				anchor: new pc.Vec4(left, 0, left + w, 1),
				color: new pc.Color(1, 1, 1, 0.95)
			} as any);
			container.addChild(pip);
		}
		this.hud!.addChild(container);
		return container;
	}

	private createNameplate(anchor: pc.Vec4, flip: boolean): { root: pc.Entity; text: pc.Entity; portrait: pc.Entity } {
		const container = new pc.Entity(flip ? 'P2_Nameplate' : 'P1_Nameplate');
		container.addComponent('element', { type: pc.ELEMENTTYPE_GROUP, anchor });
		const bg = new pc.Entity('BG');
		bg.addComponent('element', {
			type: pc.ELEMENTTYPE_IMAGE,
			texture: this.nameplateTex as any,
			anchor: new pc.Vec4(0, 0, 1, 1),
			color: new pc.Color(1, 1, 1, 0.95)
		} as any);
		container.addChild(bg);
		// Portrait on outer side
		const portrait = new pc.Entity('Portrait');
		const pLeft = flip ? 0.78 : 0.02;
		const pRight = flip ? 0.98 : 0.22;
		portrait.addComponent('element', {
			type: pc.ELEMENTTYPE_IMAGE,
			texture: this.createSolidTexture(new pc.Color(0.12,0.12,0.12,1)) as any,
			anchor: new pc.Vec4(pLeft, 0.05, pRight, 0.95),
			color: new pc.Color(1,1,1,1)
		} as any);
		container.addChild(portrait);
		// Name text centered toward inner side
		const text = new pc.Entity('NameText');
		text.addComponent('element', {
			type: pc.ELEMENTTYPE_TEXT,
			text: flip ? 'PLAYER 2' : 'PLAYER 1',
			fontSize: 24,
			color: new pc.Color(0.95, 0.98, 1, 1),
			anchor: new pc.Vec4(flip ? 0.05 : 0.25, 0, flip ? 0.75 : 0.98, 1),
			pivot: new pc.Vec2(0, 0.5)
		} as any);
		this.applyTextFont(text);
		container.addChild(text);
		this.hud!.addChild(container);
		return { root: container, text, portrait };
	}

	private createComboDisplay(anchor: pc.Vec4, color: pc.Color): { container: pc.Entity; hits: pc.Entity; dmg: pc.Entity } {
		const container = new pc.Entity('Combo');
		container.addComponent('element', { type: pc.ELEMENTTYPE_GROUP, anchor });
		const hits = new pc.Entity('Hits');
		hits.addComponent('element', {
			type: pc.ELEMENTTYPE_TEXT,
			text: '',
			fontSize: 44,
			color,
			anchor: new pc.Vec4(0, 0.15, 1, 0.85),
			pivot: new pc.Vec2(0.5, 0.5)
		} as any);
		this.applyTextFont(hits);
		container.addChild(hits);
		const dmg = new pc.Entity('Damage');
		dmg.addComponent('element', {
			type: pc.ELEMENTTYPE_TEXT,
			text: '',
			fontSize: 22,
			color: new pc.Color(1,1,1,1),
			anchor: new pc.Vec4(0, 0, 1, 0.4),
			pivot: new pc.Vec2(0.5, 0.5)
		} as any);
		this.applyTextFont(dmg);
		container.addChild(dmg);
		container.enabled = false;
		this.hud!.addChild(container);
		return { container, hits, dmg };
	}

	// ================== Text rendering helpers ==================
	private ensureCanvasFont(): void {
		if (this.canvasFont) return;
		try {
			const CanvasFont = (pc as any).CanvasFont;
			if (CanvasFont) {
				// Prefer a legible system font; if custom fonts are loaded via CSS, the browser will use them
				try {
					this.canvasFont = new CanvasFont(this.app.graphicsDevice, {
						fontName: 'KenPixel, KenneyFuture, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
						fontSize: 48,
						maxAtlasWidth: 2048,
						maxAtlasHeight: 2048
					});
				} catch (e) {
					// Fallback to older constructor signature if engine version differs
					try {
						this.canvasFont = new CanvasFont(this.app.graphicsDevice, 'system-ui, Arial', 48);
					} catch {}
				}
			}
		} catch {}
	}

	public getRuntimeFont(): any | null {
		return this.canvasFont;
	}

	private applyTextFont(entity: pc.Entity): void {
		try {
			if (!this.canvasFont) this.ensureCanvasFont();
			if (this.canvasFont && (entity as any).element) {
				(entity as any).element.font = this.canvasFont;
			}
		} catch {}
	}

	private applyFontToAllText(root?: pc.Entity | null): void {
		try {
			if (!this.canvasFont) return;
			const start = root || this.root;
			if (!start) return;
			const stack: pc.Entity[] = [start];
			while (stack.length) {
				const ent = stack.pop()!;
				if ((ent as any).element) {
					try {
						(ent as any).element.font = this.canvasFont;
					} catch {}
				}
				try { ent.children.forEach((c) => stack.push(c)); } catch {}
			}
		} catch {}
	}

	private setupEventListeners(): void {
		// Combo counter events
		(this.app as any).on?.('ui:combo', (data: any) => {
			try {
				const side = (data?.playerId === 'player2') ? this.comboP2 : this.comboP1;
				if (!side) return;
				if (side.hits.element) side.hits.element.text = `${Math.max(1, Number(data?.hits || 1))} HITS`;
				if (side.dmg.element) {
					const dmg = Math.max(0, Math.floor(Number(data?.damage || 0)));
					side.dmg.element.text = dmg > 0 ? `${dmg} dmg` : '';
				}
				side.container.enabled = true;
				// Auto-hide after a short delay
				setTimeout(() => { try { side.container.enabled = false; } catch {} }, 1200);
			} catch {}
		});
		// Victory banner + rounds/rematch flow
		(this.app as any).on?.('match:victory', (_winnerId: string) => {
			this.showBanner('KO!');
			try {
				const on = (this as any);
				on._roundWins = on._roundWins || { p1: 0, p2: 0 };
				const isP1 = _winnerId === (this.app as any)._services?.resolve?.('characters')?.getActiveCharacters?.()[0]?.id;
				if (isP1) on._roundWins.p1++; else on._roundWins.p2++;
				(this.app as any).fire?.('ui:roundwins', isP1 ? 'player1' : 'player2', isP1 ? on._roundWins.p1 : on._roundWins.p2);
				setTimeout(() => { try { this.showRematchPrompt(); } catch {} }, 1200);
			} catch {}
		});
		// Training overlay toggles
		try {
			const onKey = (e: KeyboardEvent) => {
				if (e.key === 'F1') {
					const b = this.bannerText;
					if (b) { b.enabled = !b.enabled; if (b.element) b.element.text = b.enabled ? 'TRAINING' : ''; }
				}
			};
			window.addEventListener('keydown', onKey);
		} catch {}
	}

	private showBanner(text: string): void {
		if (!this.bannerText || !this.bannerText.element) return;
		this.bannerText.element.text = text;
		this.bannerText.enabled = true;
		try {
			// Fade out
			setTimeout(() => { try { if (this.bannerText) this.bannerText.enabled = false; } catch {} }, 1400);
		} catch {}
	}

	private showRematchPrompt(): void {
		try {
			const container = new pc.Entity('RematchPrompt');
			container.addComponent('element', { type: pc.ELEMENTTYPE_GROUP, anchor: new pc.Vec4(0.35, 0.42, 0.65, 0.58) });
			const bg = new pc.Entity('BG');
			bg.addComponent('element', { type: pc.ELEMENTTYPE_IMAGE, texture: this.capsuleTex as any, anchor: new pc.Vec4(0,0,1,1), color: new pc.Color(1,1,1,0.95) } as any);
			container.addChild(bg);
			const text = new pc.Entity('Text');
			text.addComponent('element', { type: pc.ELEMENTTYPE_TEXT, text: 'Rematch?  [Enter] Yes   [Esc] No', fontSize: 28, color: new pc.Color(1,1,1,1), anchor: new pc.Vec4(0,0,1,1), pivot: new pc.Vec2(0.5,0.5), alignment: new pc.Vec2(0.5,0.5) } as any);
			this.applyTextFont(text);
			container.addChild(text);
			this.hud?.addChild(container);
			const onKey = (e: KeyboardEvent) => {
				if (e.key === 'Enter') { this.requestRematch(true); cleanup(); }
				if (e.key === 'Escape') { this.requestRematch(false); cleanup(); }
			};
			const cleanup = () => { try { window.removeEventListener('keydown', onKey); container.destroy(); } catch {} };
			window.addEventListener('keydown', onKey);
		} catch {}
	}

	private requestRematch(yes: boolean): void {
		try {
			(this.app as any).fire?.('match:rematch', { accept: yes });
			if (yes) {
				// Reset health and positions
				const chars: any = (this.app as any)._services?.resolve?.('characters');
				const list = chars?.getActiveCharacters?.() || [];
				if (list[0] && list[1]) {
					list[0].health = list[0].maxHealth || 1000; list[1].health = list[1].maxHealth || 1000;
					const a = list[0].entity.getPosition().clone(); const b = list[1].entity.getPosition().clone(); a.x = -1.2; b.x = 1.2; a.y = b.y = 0; list[0].entity.setPosition(a); list[1].entity.setPosition(b);
					list[0].state = list[1].state = 'idle'; list[0].currentMove = list[1].currentMove = null;
				}
			}
		} catch {}
	}
}

