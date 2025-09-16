import * as pc from 'playcanvas';

export class UIManager {
	private app: pc.Application;
	private root: pc.Entity | null = null;
	private menu: pc.Entity | null = null;
	private hud: pc.Entity | null = null;
	private domContainer: HTMLDivElement | null = null;
	private domP1: HTMLDivElement | null = null;
	private domP2: HTMLDivElement | null = null;

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
		const p1 = new pc.Entity('P1');
		p1.addComponent('element', { type: pc.ELEMENTTYPE_TEXT, text: 'P1: 1000 | 0%', fontSize: 32, anchor: new pc.Vec4(0,1,0,1), pivot: new pc.Vec2(0,1) });
		const p2 = new pc.Entity('P2');
		p2.addComponent('element', { type: pc.ELEMENTTYPE_TEXT, text: 'P2: 1000 | 0%', fontSize: 32, anchor: new pc.Vec4(1,1,1,1), pivot: new pc.Vec2(1,1) });
		this.hud.addChild(p1);
		this.hud.addChild(p2);
		this.root?.addChild(this.hud);
		this.setDomVisible(true);
	}

	public hideHUD(): void {
		if (this.hud) this.hud.enabled = false;
		this.setDomVisible(false);
	}

	public updateHUD(p1Health: number, p2Health: number, p1Meter?: number, p2Meter?: number, p1Max?: number, p2Max?: number): void {
		if (!this.hud) return;
		const p1 = this.hud.findByName('P1');
		const p2 = this.hud.findByName('P2');
		const h1 = Math.max(0, Math.floor(p1Health));
		const h2 = Math.max(0, Math.floor(p2Health));
		const m1 = Math.max(0, Math.min(100, Math.floor((p1Meter ?? 0))));
		const m2 = Math.max(0, Math.min(100, Math.floor((p2Meter ?? 0))));
		if (p1 && p1.element) p1.element.text = `P1: ${h1}${p1Max ? '/' + Math.floor(p1Max) : ''} | ${m1}%`;
		if (p2 && p2.element) p2.element.text = `P2: ${h2}${p2Max ? '/' + Math.floor(p2Max) : ''} | ${m2}%`;
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
}

