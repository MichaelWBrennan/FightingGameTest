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
  private snapshots: Map<number, { frame: number; checksum: number; buf: ArrayBuffer }> = new Map();
  private encoder: TextEncoder = new TextEncoder();
  private decoder: TextDecoder = new TextDecoder();

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
              if (snap) {
                const data = this.compressSnapshot(snap);
                this.snapshots.set(m.frame | 0, data);
                // return snapshot to worker to store
                try { const buf = data.buf; this.worker?.postMessage({ t: 'saved', frame: data.frame, checksum: data.checksum, buf }, [buf]); } catch { this.worker?.postMessage({ t: 'saved', frame: data.frame, checksum: data.checksum }); }
              }
            } catch {}
          } else if (m?.t === 'load') {
            try {
              const cs = m?.cs ? { frame: m.frame|0, checksum: m.checksum|0, buf: m.cs as ArrayBuffer } : this.snapshots.get(m.frame | 0);
              if (cs) { const snap = this.decompressSnapshot(cs as any); (this.netcode as any).adapter?.loadState?.(snap); }
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

  private compressSnapshot(snap: GameStateSnapshot): { frame: number; checksum: number; buf: ArrayBuffer } {
    try {
      const chars = Array.isArray((snap as any).payload?.characters) ? (snap as any).payload.characters : [];
      const num = Math.min(2, chars.length);
      const idLens = new Array<number>(num).fill(0).map((_, i) => Math.min(255, (chars[i]?.id?.length || 0)));
      let size = 0;
      size += 4 /*frame*/ + 2 /*hitstop*/ + 1 /*num*/;
      for (let i = 0; i < num; i++) {
        size += 1 + idLens[i];
        size += 4 /*health*/ + 4*3 /*pos*/ + 1 /*state*/ + 1 /*has*/;
        const has = chars[i]?.currentMove ? 1 : 0;
        if (has) size += 2 /*currentFrame*/ + 1 /*phase*/;
      }
      const buf = new ArrayBuffer(size);
      const view = new DataView(buf);
      let off = 0;
      view.setUint32(off, (snap as any).payload?.frame ?? snap.frame, true); off += 4;
      view.setUint16(off, ((snap as any).payload?.hitstop ?? 0) & 0xffff, true); off += 2;
      view.setUint8(off, num); off += 1;
      for (let i = 0; i < num; i++) {
        const c = chars[i];
        const id = (c?.id || '').slice(0, idLens[i]);
        view.setUint8(off, id.length); off += 1;
        for (let j = 0; j < id.length; j++) view.setUint8(off + j, id.charCodeAt(j) & 0xff);
        off += id.length;
        view.setFloat32(off, (c?.health ?? 0), true); off += 4;
        const p = c?.position || { x: 0, y: 0, z: 0 };
        view.setFloat32(off, p.x ?? 0, true); off += 4;
        view.setFloat32(off, p.y ?? 0, true); off += 4;
        view.setFloat32(off, p.z ?? 0, true); off += 4;
        view.setFloat32(off, (c?.meter ?? 0), true); off += 4;
        view.setFloat32(off, (c?.guardMeter ?? 100), true); off += 4;
        view.setInt8(off, this.stateToCode(c?.state)); off += 1;
        const has = c?.currentMove ? 1 : 0; view.setUint8(off, has); off += 1;
        if (has) {
          view.setUint16(off, (c.currentMove.currentFrame | 0) & 0xffff, true); off += 2;
          view.setInt8(off, this.phaseToCode(c.currentMove.phase)); off += 1;
        }
      }
      return { frame: snap.frame, checksum: snap.checksum, buf };
    } catch {
      const payload = JSON.stringify(snap.payload);
      const buf = this.encoder.encode(payload).buffer;
      return { frame: snap.frame, checksum: snap.checksum, buf };
    }
  }
  private decompressSnapshot(cs: { frame: number; checksum: number; buf: ArrayBuffer }): GameStateSnapshot {
    try {
      const view = new DataView(cs.buf);
      let off = 0;
      const frame = view.getUint32(off, true); off += 4;
      const hitstop = view.getUint16(off, true); off += 2;
      const num = view.getUint8(off); off += 1;
      const characters: any[] = [];
      for (let i = 0; i < num; i++) {
        const idLen = view.getUint8(off); off += 1;
        let id = '';
        for (let j = 0; j < idLen; j++) id += String.fromCharCode(view.getUint8(off + j));
        off += idLen;
        const health = view.getFloat32(off, true); off += 4;
        const x = view.getFloat32(off, true); off += 4;
        const y = view.getFloat32(off, true); off += 4;
        const z = view.getFloat32(off, true); off += 4;
        const meter = view.getFloat32(off, true); off += 4;
        const guardMeter = view.getFloat32(off, true); off += 4;
        const state = this.codeToState(view.getInt8(off)); off += 1;
        const has = view.getUint8(off); off += 1;
        let currentMove: any = null;
        if (has) {
          const cf = view.getUint16(off, true); off += 2;
          const ph = this.codeToPhase(view.getInt8(off)); off += 1;
          currentMove = { name: '', currentFrame: cf, phase: ph };
        }
        characters.push({ id, health, meter, guardMeter, state, currentMove, frameData: null, position: { x, y, z } });
      }
      const payload = { frame, hitstop, characters };
      return { frame: cs.frame, checksum: cs.checksum, payload } as GameStateSnapshot;
    } catch {
      const json = this.decoder.decode(new Uint8Array(cs.buf));
      const payload = JSON.parse(json);
      return { frame: cs.frame, checksum: cs.checksum, payload } as GameStateSnapshot;
    }
  }

  private stateToCode(state: string): number {
    switch ((state || '').toLowerCase()) {
      case 'idle': return 0; case 'walking': return 1; case 'attacking': return 2; case 'hitstun': return 3; case 'blockstun': return 4; case 'ko': return 5; default: return 0;
    }
  }
  private codeToState(code: number): string {
    switch (code | 0) { case 0: return 'idle'; case 1: return 'walking'; case 2: return 'attacking'; case 3: return 'hitstun'; case 4: return 'blockstun'; case 5: return 'ko'; default: return 'idle'; }
  }
  private phaseToCode(phase: string): number { switch ((phase || '').toLowerCase()) { case 'startup': return 0; case 'active': return 1; case 'recovery': return 2; default: return 0; } }
  private codeToPhase(code: number): 'startup'|'active'|'recovery' { switch (code | 0) { case 0: return 'startup'; case 1: return 'active'; case 2: return 'recovery'; default: return 'startup'; } }
}

