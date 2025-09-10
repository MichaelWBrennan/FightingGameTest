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
		this.createSelectors();
		this.attachInput();
	}

	exit(): void {
		this.detachInput();
	}

	update(dt: number): void {}

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
		k.on(pc.EVENT_KEYDOWN, this.keyHandler, this);
	}

	private detachInput(): void {
		if (!this.handlersBound) return;
		const k = this.app.keyboard!;
		if (this.keyHandler) k.off(pc.EVENT_KEYDOWN, this.keyHandler, this);
		this.keyHandler = null;
		this.handlersBound = false;
	}

	private createSelectors(): void {
		const screen = (this.app as any)._ui as UIManager;
		const root = (screen as any)['root'] as pc.Entity | null;
		if (!root) return;
		const makeLabel = (name: string, anchor: any) => {
			const e = new pc.Entity(name);
			e.addComponent('element', { type: pc.ELEMENTTYPE_TEXT, text: '', fontSize: 24, anchor });
			root.addChild(e);
			return e;
		};
		const p1 = makeLabel('P1Selector', new pc.Vec4(0.25, 0.85, 0.25, 0.85));
		const p2 = makeLabel('P2Selector', new pc.Vec4(0.75, 0.85, 0.75, 0.85));
		const st = makeLabel('StageSelector', new pc.Vec4(0.5, 0.1, 0.5, 0.1));
		(p1.element as any).pivot = new pc.Vec2(0.5, 0.5);
		(p2.element as any).pivot = new pc.Vec2(0.5, 0.5);
		(st.element as any).pivot = new pc.Vec2(0.5, 0.5);
		this.refreshSelectorText();
	}

	private refreshSelectorText(): void {
		const ui = (this.app as any)._ui as UIManager;
		const root = (ui as any)['root'] as pc.Entity | null;
		if (!root) return;
		const p1 = root.findByName('P1Selector');
		const p2 = root.findByName('P2Selector');
		const st = root.findByName('StageSelector');
		const p1Id = this.roster[this.p1Idx] || 'ryu';
		const p2Id = this.roster[this.p2Idx] || 'ken';
		const theme = this.themes[this.stageIdx] || 'training';
		if (p1?.element) p1.element.text = `P1: ${p1Id.toUpperCase()}  (A/D)`;
		if (p2?.element) p2.element.text = `P2: ${p2Id.toUpperCase()}  (←/→)`;
		if (st?.element) st.element.text = `STAGE: ${theme.toUpperCase()}  (W/S or ↑/↓)`;
	}

	private spawnPreviewFighters(): void {
		const p1Id = this.roster[this.p1Idx] || 'ryu';
		const p2Id = this.roster[this.p2Idx] || 'ken';
		this.chars.removeCharacter(p1Id);
		this.chars.removeCharacter(p2Id);
		const p1 = this.chars.createCharacter(p1Id, new pc.Vec3(-2, 0, 0));
		const p2 = this.chars.createCharacter(p2Id, new pc.Vec3(2, 0, 0));
		if (p1 && p2) this.chars.setActiveCharacters(p1Id, p2Id);
	}

	private cycleP1(delta: number): void {
		this.p1Idx = (this.p1Idx + delta + this.roster.length) % this.roster.length;
		this.spawnPreviewFighters();
		this.refreshHUD();
		this.refreshSelectorText();
	}

	private cycleP2(delta: number): void {
		this.p2Idx = (this.p2Idx + delta + this.roster.length) % this.roster.length;
		this.spawnPreviewFighters();
		this.refreshHUD();
		this.refreshSelectorText();
	}

	private cycleStage(delta: number): void {
		this.stageIdx = (this.stageIdx + delta + this.themes.length) % this.themes.length;
		const theme = this.themes[this.stageIdx];
		this.stages.loadTheme(theme).catch(() => {});
		this.refreshSelectorText();
	}

	private refreshHUD(): void {
		const active = this.chars.getActiveCharacters();
		const p1 = active[0];
		const p2 = active[1];
		if (!p1 || !p2) return;
		const p1Max = p1.maxHealth || p1.health;
		const p2Max = p2.maxHealth || p2.health;
		(this.app as any)._ui.updateHUD(p1.health, p2.health, p1.meter, p2.meter, p1Max, p2Max);
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
}

