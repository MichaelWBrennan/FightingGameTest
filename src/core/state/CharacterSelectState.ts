import * as pc from 'playcanvas';
import { GameState } from './GameStateStack';
import { UIManager } from '../ui/UIManager';
import { CharacterManager } from '../characters/CharacterManager';
import { StageManager } from '../stages/StageManager';

export class CharacterSelectState implements GameState {
	public name = 'characterselect';
	private app: pc.Application;
	private events: any;
	private ui!: UIManager;
	private chars!: CharacterManager;
	private stages!: StageManager;
	private handlersBound = false;
	private p1Idx = 0;
	private p2Idx = 1;
	private stageIdx = 0;
	private roster: string[] = [];
	private themes: ('training'|'gothic'|'urban')[] = ['training','gothic','urban'];
	private keyHandler: ((e: any) => void) | null = null;

	// World-space selector entities
	private p1Selector: pc.Entity | null = null;
	private p2Selector: pc.Entity | null = null;
	private stageSelector: pc.Entity | null = null;
	private selectorTime = 0;

	constructor(app: pc.Application, events: any) {
		this.app = app;
		this.events = events;
	}

	async enter(): Promise<void> {
		const services = (this.app as any)._services as any;
		this.ui = (this.app as any)._ui as UIManager;
		this.chars = services.resolve('characters') as CharacterManager;
		this.stages = services.resolve('stages') as StageManager;

		// Ensure small roster exists
		this.roster = this.chars.getAvailableCharacters();
		if (this.roster.length < 2) {
			this.chars.seedMinimalCharacters(['ryu','ken','chun_li','sagat']);
			this.roster = this.chars.getAvailableCharacters();
		}

		this.spawnPreviewFighters();
		this.ui.showHUD();
		this.refreshHUD();
		this.createWorldSelectors();
		this.attachInput();
	}

	exit(): void {
		this.detachInput();
	}

	update(dt: number): void {
		this.selectorTime += dt;
		this.animateSelectors(dt);
		this.updateSelectorPositions();
	}

	private attachInput(): void {
		if (this.handlersBound) return;
		this.handlersBound = true;
		const k = this.app.keyboard!;
		this.keyHandler = (e: any) => {
			if (e.key === pc.KEY_A) this.cycleP1(-1);
			if (e.key === pc.KEY_D) this.cycleP1(1);
			if (e.key === pc.KEY_LEFT) this.cycleP2(-1);
			if (e.key === pc.KEY_RIGHT) this.cycleP2(1);
			if (e.key === pc.KEY_W || e.key === pc.KEY_UP) this.cycleStage(1);
			if (e.key === pc.KEY_S || e.key === pc.KEY_DOWN) this.cycleStage(-1);
			if (e.key === pc.KEY_RETURN || e.key === pc.KEY_NUMPAD_ENTER) this.commitAndStart();
		};
		k.on(pc.EVENT_KEYDOWN, this.keyHandler as any);
	}

	private detachInput(): void {
		if (!this.handlersBound) return;
		const k = this.app.keyboard!;
		if (this.keyHandler) k.off(pc.EVENT_KEYDOWN, this.keyHandler as any);
		this.keyHandler = null;
		this.handlersBound = false;
	}

	// ============= 2.5D WORLD-SPACE SELECTORS =============
	private createWorldSelectors(): void {
		// Create selector groups if missing
		if (!this.p1Selector) this.p1Selector = this.createSelectorGroup('P1WorldSelector', new pc.Color(1, 0.85, 0.2));
		if (!this.p2Selector) this.p2Selector = this.createSelectorGroup('P2WorldSelector', new pc.Color(0.7, 0.85, 1));
		if (!this.stageSelector) this.stageSelector = this.createSelectorGroup('StageWorldSelector', new pc.Color(0.9, 0.9, 0.9));
		this.app.root.addChild(this.p1Selector);
		this.app.root.addChild(this.p2Selector);
		this.app.root.addChild(this.stageSelector);
		this.updateSelectorPositions();
	}

	private createSelectorGroup(name: string, color: pc.Color): pc.Entity {
		const group = new pc.Entity(name);
		// Left arrow
		const left = this.createArrowEntity('Left', color, -1);
		left.setLocalPosition(-0.75, 0, 0);
		group.addChild(left);
		// Right arrow
		const right = this.createArrowEntity('Right', color, 1);
		right.setLocalPosition(0.75, 0, 0);
		group.addChild(right);
		// Glow base (subtle)
		const base = new pc.Entity('BaseGlow');
		const baseMat = new pc.StandardMaterial();
		baseMat.emissive = color.clone().mulScalar(0.15);
		baseMat.opacity = 0.6 as unknown as number;
		baseMat.blendType = pc.BLEND_NORMAL;
		baseMat.update();
		base.addComponent('render', { type: 'plane', material: baseMat as unknown as pc.Material });
		base.setLocalScale(2.0, 0.15, 1);
		base.setEulerAngles(90, 0, 0);
		base.setLocalPosition(0, -0.9, 0);
		group.addChild(base);
		return group;
	}

	private createArrowEntity(name: string, color: pc.Color, dir: -1 | 1): pc.Entity {
		const e = new pc.Entity(`${name}Arrow`);
		const mat = new pc.StandardMaterial();
		mat.emissive = color.clone();
		mat.useLighting = false;
		mat.update();
		// Use cone primitive as a chevron
		e.addComponent('render', { type: 'cone', material: mat as unknown as pc.Material });
		e.setLocalScale(0.3, 0.6, 0.3);
		// Point along +/- X
		const yaw = dir > 0 ? 90 : -90;
		e.setEulerAngles(0, yaw, 0);
		return e;
	}

	private updateSelectorPositions(): void {
		try {
			const active = this.chars.getActiveCharacters();
			const p1 = active[0]?.entity;
			const p2 = active[1]?.entity;
			if (p1 && this.p1Selector) {
				const pos = p1.getPosition().clone();
				this.p1Selector.setPosition(pos.x, pos.y + 2.2, pos.z);
			}
			if (p2 && this.p2Selector) {
				const pos = p2.getPosition().clone();
				this.p2Selector.setPosition(pos.x, pos.y + 2.2, pos.z);
			}
			if (this.stageSelector) {
				// Place near stage center
				this.stageSelector.setPosition(0, 2.2, -0.5);
			}
		} catch {}
	}

	private animateSelectors(dt: number): void {
		const bob = Math.sin(this.selectorTime * 3.0) * 0.08;
		[this.p1Selector, this.p2Selector, this.stageSelector].forEach((g) => {
			if (!g) return;
			const p = g.getPosition();
			g.setPosition(p.x, p.y + bob, p.z);
		});
	}

	private spawnPreviewFighters(): void {
		const p1Id = this.roster[this.p1Idx] || 'ryu';
		const p2Id = this.roster[this.p2Idx] || 'ken';
		this.chars.removeCharacter(p1Id);
		this.chars.removeCharacter(p2Id);
		const p1 = this.chars.createCharacter(p1Id, new pc.Vec3(-2, 0, 0));
		const p2 = this.chars.createCharacter(p2Id, new pc.Vec3(2, 0, 0));
		if (p1 && p2) this.chars.setActiveCharacters(p1Id, p2Id);
		this.updateSelectorPositions();
	}

	private cycleP1(delta: number): void {
		this.p1Idx = (this.p1Idx + delta + this.roster.length) % this.roster.length;
		this.spawnPreviewFighters();
		this.refreshHUD();
		this.updateSelectorPositions();
	}

	private cycleP2(delta: number): void {
		this.p2Idx = (this.p2Idx + delta + this.roster.length) % this.roster.length;
		this.spawnPreviewFighters();
		this.refreshHUD();
		this.updateSelectorPositions();
	}

	private cycleStage(delta: number): void {
		this.stageIdx = (this.stageIdx + delta + this.themes.length) % this.themes.length;
		const theme = this.themes[this.stageIdx];
		this.stages.loadTheme(theme).catch(() => {});
		this.updateSelectorPositions();
	}

	private refreshHUD(): void {
		const active = this.chars.getActiveCharacters();
		const p1 = active[0];
		const p2 = active[1];
		if (!p1 || !p2) return;
		const p1Max = p1.maxHealth || p1.health;
		const p2Max = p2.maxHealth || p2.health;
		// Update HUD bars and set nameplates
		(this.app as any)._ui.updateHUD(p1.health, p2.health, p1.meter, p2.meter, p1Max, p2Max, 100, 100);
		(this.app as any)._ui.setNameplates(p1.config.displayName || p1.config.name || 'Player 1', p2.config.displayName || p2.config.name || 'Player 2', p1.id, p2.id);
	}

	private commitAndStart(): void {
		try {
			const services = (this.app as any)._services;
			const selections = {
				player1: { characterId: this.roster[this.p1Idx] },
				player2: { characterId: this.roster[this.p2Idx] },
				stage: { theme: this.themes[this.stageIdx] }
			};
			services.register('selections', selections);
			localStorage.setItem('sf3_selections', JSON.stringify(selections));
		} catch {}
		this.events.emit('state:goto', { state: 'match' });
	}

	private destroySelectors(): void {
		try { this.p1Selector?.destroy(); } catch {}
		try { this.p2Selector?.destroy(); } catch {}
		try { this.stageSelector?.destroy(); } catch {}
		this.p1Selector = null;
		this.p2Selector = null;
		this.stageSelector = null;
	}
}

