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
		// Initialize nameplates once characters are ready (next frame)
		setTimeout(() => {
			try {
				const services = (this.app as any)._services as any;
				const characterManager: CharacterManager = services.resolve('characters');
				const active = characterManager.getActiveCharacters();
				if (active[0] && active[1]) {
					ui?.setNameplates(active[0].config.displayName || active[0].config.name || 'Player 1', active[1].config.displayName || active[1].config.name || 'Player 2', active[0].id, active[1].id);
				}
			} catch {}
		}, 0);
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

