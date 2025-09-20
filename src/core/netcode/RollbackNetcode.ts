import { DeterministicAdapter } from './DeterministicAdapter';
import { bitsToInputs, FrameNumber, GameStateSnapshot } from './types';

export interface Transport {
  connect(): void;
  disconnect(): void;
  sendLocalInput(frame: number, bits: number): void;
  onRemoteInput?: (frame: number, bits: number) => void;
}

export class RollbackNetcode {
  private currentFrame: FrameNumber = 0;
  private confirmedRemoteFrame: FrameNumber = -1;
  private localInputs: Map<number, number> = new Map();
  private remoteInputs: Map<number, number> = new Map();
  private predictedRemote: Map<number, number> = new Map();
  private snapshots: Map<number, GameStateSnapshot> = new Map();
  private running = false;
  private rollbackEvents = 0;
  private rollbackFrames = 0;
  private maxRollbackSpan = 0;
  private maxSnapshots = 180; // ~3 seconds at 60fps

  constructor(
    private adapter: DeterministicAdapter,
    private transport: Transport,
    private frameDelay: number = 2,
    private maxRollback: number = 10
  ) {
    this.transport.onRemoteInput = (f, bits) => this.onRemoteInput(f, bits);
  }

  start(): void {
    this.running = true;
  }

  stop(): void {
    this.running = false;
  }

  setFrameDelay(frames: number): void {
    const f = Math.max(0, Math.min(10, Math.floor(frames)));
    (this as any).frameDelay = f;
  }

  pushLocal(bits: number): void {
    const targetFrame = this.currentFrame + this.frameDelay;
    this.localInputs.set(targetFrame, bits);
    this.transport.sendLocalInput(targetFrame, bits);
  }

  private onRemoteInput(frame: number, bits: number): void {
    this.remoteInputs.set(frame, bits);
    if (frame > this.confirmedRemoteFrame) this.confirmedRemoteFrame = frame;
  }

  advance(): void {
    if (!this.running) return;
    const frame = this.currentFrame;
    // save snapshot BEFORE stepping
    this.snapshots.set(frame, this.adapter.saveState(frame));
    this.pruneSnapshots();

    const local = this.localInputs.get(frame) ?? 0;
    let remote = this.remoteInputs.get(frame);
    const predicted = this.predictedRemote.get(frame);
    if (remote == null) {
      // predict: use last known, else 0
      const lastRemote = this.remoteInputs.get(frame - 1);
      remote = lastRemote != null ? lastRemote : (predicted != null ? predicted : 0);
      this.predictedRemote.set(frame, remote);
    }

    this.adapter.step(frame, bitsToInputs(local), bitsToInputs(remote));
    this.currentFrame++;

    // check for mismatches when remote arrives late
    const mismatchFrame = this.findMismatchFrame();
    if (mismatchFrame != null) {
      this.rollbackTo(mismatchFrame);
    }
  }

  private findMismatchFrame(): number | null {
    // scan last maxRollback frames for any frame where remote input exists and differs from prediction
    let start = Math.max(0, this.currentFrame - this.maxRollback);
    for (let f = start; f < this.currentFrame; f++) {
      const r = this.remoteInputs.get(f);
      const p = this.predictedRemote.get(f);
      if (r != null && p != null && r !== p) return f;
    }
    return null;
  }

  private rollbackTo(frame: number): void {
    const snap = this.snapshots.get(frame);
    if (!snap) return;
    this.rollbackEvents++;
    const span = Math.max(0, this.currentFrame - frame);
    this.rollbackFrames += span;
    if (span > this.maxRollbackSpan) this.maxRollbackSpan = span;
    this.adapter.loadState(snap);

    // re-simulate from frame to currentFrame-1
    for (let f = frame; f < this.currentFrame; f++) {
      const local = this.localInputs.get(f) ?? 0;
      const remote = this.remoteInputs.get(f) ?? this.predictedRemote.get(f) ?? 0;
      this.adapter.step(f, bitsToInputs(local), bitsToInputs(remote));
      // refresh snapshot for determinism checking if desired
      this.snapshots.set(f, this.adapter.saveState(f));
      // once confirmed, clear prediction
      if (this.remoteInputs.has(f)) this.predictedRemote.delete(f);
    }
  }

  public getStats(): { frameDelay: number; rollbacks: number; rbFrames: number; rbMax: number; cur: number; confirmed: number } {
    return { frameDelay: this.frameDelay, rollbacks: this.rollbackEvents, rbFrames: this.rollbackFrames, rbMax: this.maxRollbackSpan, cur: this.currentFrame, confirmed: this.confirmedRemoteFrame };
  }

  private pruneSnapshots(): void {
    if (this.snapshots.size <= this.maxSnapshots) return;
    // remove oldest
    const keys = Array.from(this.snapshots.keys()).sort((a,b)=>a-b);
    const excess = this.snapshots.size - this.maxSnapshots;
    for (let i = 0; i < excess; i++) this.snapshots.delete(keys[i]);
  }
}

