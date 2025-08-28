import * as pc from 'playcanvas';

export class UIManager {
	private app: pc.Application;
	private root: pc.Entity | null = null;
	private menu: pc.Entity | null = null;
	private hud: pc.Entity | null = null;

	constructor(app: pc.Application) {
		this.app = app;
	}

	public async initialize(): Promise<void> {
		this.root = new pc.Entity('UIRoot');
		this.root.addComponent('screen', {
			referenceResolution: new pc.Vec2(1920, 1080),
			scaleMode: pc.SCALEMODE_BLEND,
			scaleBlend: 0.5,
			screenSpace: true
		});
		this.app.root.addChild(this.root);
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
	}

	public hideMenu(): void {
		if (this.menu) this.menu.enabled = false;
	}

	public showHUD(): void {
		this.hideMenu();
		if (this.hud) { this.hud.enabled = true; return; }
		this.hud = new pc.Entity('MatchHUD');
		this.hud.addComponent('element', { type: pc.ELEMENTTYPE_GROUP, anchor: new pc.Vec4(0,0,1,1) });
		const p1 = new pc.Entity('P1');
		p1.addComponent('element', { type: pc.ELEMENTTYPE_TEXT, text: 'P1: 1000', fontSize: 32, anchor: new pc.Vec4(0,1,0,1), pivot: new pc.Vec2(0,1) });
		const p2 = new pc.Entity('P2');
		p2.addComponent('element', { type: pc.ELEMENTTYPE_TEXT, text: 'P2: 1000', fontSize: 32, anchor: new pc.Vec4(1,1,1,1), pivot: new pc.Vec2(1,1) });
		this.hud.addChild(p1);
		this.hud.addChild(p2);
		this.root?.addChild(this.hud);
	}

	public hideHUD(): void {
		if (this.hud) this.hud.enabled = false;
	}

	public updateHUD(p1Health: number, p2Health: number): void {
		if (!this.hud) return;
		const p1 = this.hud.findByName('P1');
		const p2 = this.hud.findByName('P2');
		if (p1 && p1.element) {
			p1.element.text = `P1: ${Math.max(0, Math.floor(p1Health))}`;
		}
		if (p2 && p2.element) {
			p2.element.text = `P2: ${Math.max(0, Math.floor(p2Health))}`;
		}
	}
}

