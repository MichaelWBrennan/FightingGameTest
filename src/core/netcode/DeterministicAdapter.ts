import { PlayerInputs } from '../input/InputManager';
import { GameStateSnapshot, FrameNumber, checksum32FromObject } from './types';
import { CombatSystem } from '../combat/CombatSystem';
import { CharacterManager } from '../characters/CharacterManager';
import * as pc from 'playcanvas';

export interface DeterministicAdapter {
  saveState(frame: FrameNumber): GameStateSnapshot;
  loadState(snapshot: GameStateSnapshot): void;
  step(frame: FrameNumber, p0: PlayerInputs, p1: PlayerInputs): void;
}

export class CombatDeterministicAdapter implements DeterministicAdapter {
  constructor(private combat: CombatSystem, private chars: CharacterManager) {}

  saveState(frame: FrameNumber): GameStateSnapshot {
    const characters = this.chars.getActiveCharacters().map(c => ({
      id: c.id,
      health: c.health,
      state: c.state,
      currentMove: c.currentMove ? {
        name: c.currentMove.name,
        currentFrame: c.currentMove.currentFrame,
        phase: c.currentMove.phase
      } : null,
      frameData: c.frameData ? { ...c.frameData } : null,
      position: (() => { const p = c.entity.getPosition(); return { x: p.x, y: p.y, z: p.z }; })()
    }));
    const payload = {
      frame: this.combat.getCurrentFrame(),
      hitstop: (this.combat as any).hitstop ?? 0,
      characters
    };
    return { frame, payload, checksum: checksum32FromObject(payload) };
  }

  loadState(snapshot: GameStateSnapshot): void {
    const p = snapshot.payload;
    // restore frame and hitstop
    (this.combat as any).frameCounter = p.frame;
    (this.combat as any).hitstop = p.hitstop;
    // restore characters
    const active = this.chars.getActiveCharacters();
    for (const ch of active) {
      const src = p.characters.find((x: any) => x.id === ch.id);
      if (!src) continue;
      ch.health = src.health;
      ch.state = src.state;
      ch.currentMove = src.currentMove ? { name: src.currentMove.name, data: ch.config.moves[src.currentMove.name], currentFrame: src.currentMove.currentFrame, phase: src.currentMove.phase } : null;
      ch.frameData = src.frameData ? { ...src.frameData } : null;
      ch.entity.setPosition(new pc.Vec3(src.position.x, src.position.y, src.position.z));
    }
  }

  step(frame: FrameNumber, p0: PlayerInputs, p1: PlayerInputs): void {
    this.combat.stepWithInputs(p0, p1);
    try {
      const det: any = (this.combat as any).app?._services?.resolve?.('det');
      const cs = checksum32FromObject({ frame, chars: this.chars.getActiveCharacters().map(c => ({ id: c.id, hp: c.health, pos: (()=>{ const p = c.entity.getPosition(); return { x:p.x,y:p.y,z:p.z }; })() })) });
      const ok = det?.validate?.(frame, cs);
      const dbg: any = (this.combat as any).app?._debugOverlay;
      // Surface via DebugOverlay in engine update loop; service stores state
    } catch {}
  }
}

