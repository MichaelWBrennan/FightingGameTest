import { RollbackNetcode } from './RollbackNetcode';
import { CombatDeterministicAdapter } from './DeterministicAdapter';
import { LocalTransport } from './LocalTransport';
import { InputManager, PlayerInputs } from '../input/InputManager';
import { CharacterManager } from '../characters/CharacterManager';
import { CombatSystem } from '../combat/CombatSystem';
import { inputsToBits } from './types';

export class NetcodeService {
  private netcode?: RollbackNetcode;
  private enabled = false;

  constructor(private combat: CombatSystem, private chars: CharacterManager, private input: InputManager) {}

  enableLocalP2(): void {
    const adapter = new CombatDeterministicAdapter(this.combat, this.chars);
    const a = new LocalTransport();
    const b = new LocalTransport();
    a.setPeer(b); b.setPeer(a);
    // single Rollback instance drives both players; peer delivers remote inputs
    this.netcode = new RollbackNetcode(adapter, a, 2, 12);
    this.enabled = true;
    this.netcode.start();
  }

  disable(): void { this.enabled = false; this.netcode?.stop(); }

  isEnabled(): boolean { return this.enabled; }

  step(): void {
    if (!this.enabled || !this.netcode) return;
    // acquire local inputs (P1) and treat P2 as remote via transport
    const p1 = this.input.getPlayerInputs(0);
    const bits = inputsToBits(p1);
    this.netcode.pushLocal(bits);
    this.netcode.advance();
  }
}

