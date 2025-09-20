import { RollbackNetcode } from './RollbackNetcode';
import { CombatDeterministicAdapter } from './DeterministicAdapter';
import { LocalTransport } from './LocalTransport';
import { WebRTCTransport } from './WebRTCTransport';
import { InputManager, PlayerInputs } from '../input/InputManager';
import { CharacterManager } from '../characters/CharacterManager';
import { CombatSystem } from '../combat/CombatSystem';
import { inputsToBits, bitsToInputs, GameStateSnapshot } from './types';

export class NetcodeService {
  private netcode?: RollbackNetcode;
  private enabled = false;
  private desiredDelay = 2;
  private jitterBufferFrames = 1; // target smoothing frames for jitter
  private frameBudget = 10; // rollback budget window

  constructor(private combat: CombatSystem, private chars: CharacterManager, private input: InputManager) {}
  public useWorker = false;
  private worker?: Worker;
  private snapshots: Map<number, GameStateSnapshot> = new Map();

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

  enableWebRTC(signaling: { send(s: any): void; on(cb: (s: any) => void): void }, isOfferer: boolean, ice?: RTCIceServer[]): void {
    const adapter = new CombatDeterministicAdapter(this.combat, this.chars);
    const rtc = new WebRTCTransport(isOfferer, signaling, ice);
    this.netcode = new RollbackNetcode(adapter, rtc, 2, 12);
    this.enabled = true;
    this.netcode.start();
    try { (rtc as any).sendClockProbe?.(); } catch {}
    if (this.useWorker && typeof Worker !== 'undefined') {
      try {
        // @ts-ignore
        this.worker = new Worker(new URL('./NetcodeWorker.ts', import.meta.url));
        this.worker.onmessage = (e: MessageEvent<any>) => {
          const m = e.data;
          if (m?.t === 'stats') { /* optionally surface */ }
          else if (m?.t === 'save') {
            try {
              const snap = (this.netcode as any).adapter?.saveState?.(m.frame);
              if (snap) this.snapshots.set(m.frame | 0, snap);
            } catch {}
          } else if (m?.t === 'load') {
            try {
              const snap = this.snapshots.get(m.frame | 0);
              if (snap) (this.netcode as any).adapter?.loadState?.(snap);
            } catch {}
          } else if (m?.t === 'step') {
            try {
              const p0 = bitsToInputs(m.localBits >>> 0);
              const p1 = bitsToInputs(m.remoteBits >>> 0);
              (this.netcode as any).adapter?.step?.(m.frame, p0, p1);
            } catch {}
          }
        };
        this.worker.postMessage({ t: 'init', delay: 2, maxRb: 12 });
      } catch {}
    }
    // In worker mode, forward remote inputs to worker
    if (this.useWorker) {
      try { const tr: any = (this.netcode as any).transport; if (tr) tr.onRemoteInput = (f: number, b: number) => { try { this.worker?.postMessage({ t: 'remote', frame: f|0, bits: b>>>0 }); } catch {} }; } catch {}
    }
  }

  disable(): void { this.enabled = false; this.netcode?.stop(); }

  isEnabled(): boolean { return this.enabled; }

  step(): void {
    if (!this.enabled || !this.netcode) return;
    if (this.useWorker) {
      try {
        const p1 = this.input.getPlayerInputs(0);
        const bits = inputsToBits(p1);
        // still send to transport via netcode pipeline for the peer
        this.netcode.pushLocal(bits);
        // also inform worker
        this.worker?.postMessage({ t: 'local', bits });
        // adaptive delay -> worker
        try {
          const anyNc: any = this.netcode as any;
          const tr = (anyNc.transport || anyNc._transport || (anyNc as any));
          const rtt = tr?.getRttMs?.(); const jitter = tr?.getJitterMs?.();
          if (typeof rtt === 'number') {
            const base = Math.round(rtt / 50); const jf = typeof jitter==='number'?Math.round(jitter/50):0;
            const frames = Math.max(0, Math.min(8, base + Math.min(this.jitterBufferFrames, jf)));
            this.worker?.postMessage({ t: 'setDelay', delay: Math.max(frames, this.desiredDelay) });
          }
        } catch {}
        this.worker?.postMessage({ t: 'tick' });
        return;
      } catch {}
    }
    // acquire local inputs (P1) and treat P2 as remote via transport
    const p1 = this.input.getPlayerInputs(0);
    const bits = inputsToBits(p1);
    this.netcode.pushLocal(bits);
    // Adaptive frame delay based on transport RTT & jitter if available
    try {
      const anyNc: any = this.netcode as any;
      const tr = (anyNc.transport || anyNc._transport || (anyNc as any));
      const rtt = tr?.getRttMs?.();
      const jitter = tr?.getJitterMs?.();
      if (typeof rtt === 'number' && isFinite(rtt)) {
        const base = Math.round(rtt / 50);
        const jitterFrames = typeof jitter === 'number' ? Math.round(jitter / 50) : 0;
        const frames = Math.max(0, Math.min(8, base + Math.min(this.jitterBufferFrames, jitterFrames)));
        (this.netcode as any).setFrameDelay?.(Math.max(frames, this.desiredDelay));
      } else {
        (this.netcode as any).setFrameDelay?.(this.desiredDelay);
      }
    } catch { (this.netcode as any).setFrameDelay?.(this.desiredDelay); }
    this.netcode.advance();
  }

  getStats(): { rtt?: number; jitter?: number; delay?: number; rollbacks?: number; ooo?: number; loss?: number; tx?: number; rx?: number; cur?: number; confirmed?: number } {
    try {
      const rb = (this.netcode as any).getStats?.();
      const tr: any = (this.netcode as any).transport || {};
      return {
        rtt: tr?.getRttMs?.(),
        jitter: tr?.getJitterMs?.(),
        delay: rb?.frameDelay ?? 0,
        rollbacks: rb?.rollbacks ?? 0,
        ooo: tr?.getOutOfOrderCount?.(),
        loss: tr?.getLossSuspectCount?.(),
        tx: tr?.getBytesTx?.(),
        rx: tr?.getBytesRx?.(),
        cur: rb?.cur ?? 0,
        confirmed: rb?.confirmed ?? 0
      };
    } catch { return {}; }
  }

  setDesiredDelay(frames: number): void { this.desiredDelay = Math.max(0, Math.min(10, Math.floor(frames))); }
  setJitterBuffer(frames: number): void { this.jitterBufferFrames = Math.max(0, Math.min(4, Math.floor(frames))); }
  enableWorker(on: boolean): void {
    this.useWorker = !!on;
    if (on && typeof Worker !== 'undefined') {
      try {
        // @ts-ignore: bundler should inline worker or use proper loader
        this.worker = new Worker(new URL('./NetcodeWorker.ts', import.meta.url));
        this.worker.postMessage({ t: 'init' });
      } catch {}
    }
  }
  applyTransportJitterWindow(): void {
    try {
      const anyNc: any = this.netcode as any;
      const tr = (anyNc.transport || anyNc._transport || (anyNc as any));
      tr?.setJitterWindow?.(this.jitterBufferFrames);
    } catch {}
  }
}

