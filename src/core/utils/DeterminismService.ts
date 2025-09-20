export class DeterminismService {
  private checksums: number[] = [];
  private lastMismatchFrame: number = -1;
  private lastValidatedFrame: number = -1;

  record(frame: number, checksum: number): void {
    this.checksums[frame] = checksum >>> 0;
  }

  validate(frame: number, checksum: number): boolean {
    const prev = this.checksums[frame];
    if (prev == null) { this.checksums[frame] = checksum >>> 0; return true; }
    const ok = (prev >>> 0) === (checksum >>> 0);
    this.lastValidatedFrame = frame;
    if (!ok) this.lastMismatchFrame = frame;
    return ok;
  }

  reset(): void { this.checksums = []; this.lastMismatchFrame = -1; this.lastValidatedFrame = -1; }

  getLastMismatchFrame(): number { return this.lastMismatchFrame; }
  getLastValidatedFrame(): number { return this.lastValidatedFrame; }
  getStatus(): { ok: boolean; lastValidatedFrame: number; lastMismatchFrame: number } {
    return { ok: this.lastMismatchFrame < 0 || this.lastValidatedFrame >= this.lastMismatchFrame, lastValidatedFrame: this.lastValidatedFrame, lastMismatchFrame: this.lastMismatchFrame };
  }
}

