import * as pc from 'playcanvas';
import { GameState } from './GameStateStack';
import { UIManager } from '../ui/UIManager';
import { CharacterManager } from '../characters/CharacterManager';

export class MatchState implements GameState {
	public name = 'match';
	private app: pc.Application;
	private events: any;
	private spawned = false;

	constructor(app: pc.Application, events: any) {
		this.app = app;
		this.events = events;
	}

	enter(): void {
		const ui = (this.app as any)._ui as UIManager | undefined;
		ui?.showHUD();
		this.spawnCharactersFromSelection();
	}

	exit(): void {}

	update(dt: number): void {}

	private spawnCharactersFromSelection(): void {
		if (this.spawned) return;
		this.spawned = true;
		try {
			const services = (this.app as any)._services as any;
			const characterManager: CharacterManager = services.resolve('characters');
			let selections: any = null;
			try { selections = services.resolve('selections'); } catch {}
			if (!selections) {
				try { const raw = localStorage.getItem('sf3_selections'); if (raw) selections = JSON.parse(raw); } catch {}
			}
			const p1Id = selections?.player1?.characterId || 'ryu';
			const p2Id = selections?.player2?.characterId || 'ken';
			const p1 = characterManager.createCharacter(p1Id, new pc.Vec3(-2, 0, 0));
			const p2 = characterManager.createCharacter(p2Id, new pc.Vec3(2, 0, 0));
			if (p1 && p2) {
				characterManager.setActiveCharacters(p1Id, p2Id);
			}
		} catch {}
	}
}

