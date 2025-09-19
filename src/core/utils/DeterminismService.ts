export class DeterminismService {
  private checksums: number[] = [];

  record(frame: number, checksum: number): void {
    this.checksums[frame] = checksum >>> 0;
  }

  validate(frame: number, checksum: number): boolean {
    const prev = this.checksums[frame];
    if (prev == null) { this.checksums[frame] = checksum >>> 0; return true; }
    return (prev >>> 0) === (checksum >>> 0);
  }

  reset(): void { this.checksums = []; }
}

