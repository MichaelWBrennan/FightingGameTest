import { RollbackNetcode } from './RollbackNetcode';
import { CombatDeterministicAdapter } from './DeterministicAdapter';
import { LocalTransport } from './LocalTransport';
import { WebRTCTransport } from './WebRTCTransport';
import { InputManager, PlayerInputs } from '../input/InputManager';
import { CharacterManager } from '../characters/CharacterManager';
import { CombatSystem } from '../combat/CombatSystem';
import { inputsToBits } from './types';

export class NetcodeService {
  private netcode?: RollbackNetcode;
  private enabled = false;
  private desiredDelay = 2;

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

  enableWebRTC(signaling: { send(s: any): void; on(cb: (s: any) => void): void }, isOfferer: boolean): void {
    const adapter = new CombatDeterministicAdapter(this.combat, this.chars);
    const rtc = new WebRTCTransport(isOfferer, signaling);
    this.netcode = new RollbackNetcode(adapter, rtc, 2, 12);
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
    // Adaptive frame delay based on transport RTT if available
    try {
      const anyNc: any = this.netcode as any;
      const tr = (anyNc.transport || anyNc._transport || (anyNc as any));
      const rtt = tr?.getRttMs?.();
      if (typeof rtt === 'number' && isFinite(rtt)) {
        const frames = Math.max(0, Math.min(6, Math.round(rtt / 50)));
        (this.netcode as any).setFrameDelay?.(Math.max(frames, this.desiredDelay));
      } else {
        (this.netcode as any).setFrameDelay?.(this.desiredDelay);
      }
    } catch { (this.netcode as any).setFrameDelay?.(this.desiredDelay); }
    this.netcode.advance();
  }

  getStats(): { rtt?: number; delay?: number; rollbacks?: number } {
    try {
      const rb = (this.netcode as any).getStats?.();
      return { delay: rb?.frameDelay ?? 0, rollbacks: rb?.rollbacks ?? 0 };
    } catch { return {}; }
  }

  setDesiredDelay(frames: number): void { this.desiredDelay = Math.max(0, Math.min(10, Math.floor(frames))); }
}

