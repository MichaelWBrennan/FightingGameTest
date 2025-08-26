
/**
 * Binary character table utilities
 * Converted from C to TypeScript
 */

export interface CharTableEntry {
  charCode: number;
  width: number;
  height: number;
  xOffset: number;
  yOffset: number;
  advance: number;
}

export class BinaryCharTable {
  private entries: Map<number, CharTableEntry> = new Map();

  constructor(data?: ArrayBuffer) {
    if (data) {
      this.loadFromBuffer(data);
    }
  }

  private loadFromBuffer(buffer: ArrayBuffer): void {
    const view = new DataView(buffer);
    let offset = 0;

    // Read header
    const entryCount = view.getUint32(offset, true);
    offset += 4;

    // Read entries
    for (let i = 0; i < entryCount; i++) {
      const entry: CharTableEntry = {
        charCode: view.getUint16(offset, true),
        width: view.getUint8(offset + 2),
        height: view.getUint8(offset + 3),
        xOffset: view.getInt8(offset + 4),
        yOffset: view.getInt8(offset + 5),
        advance: view.getUint8(offset + 6)
      };
      
      this.entries.set(entry.charCode, entry);
      offset += 7;
    }
  }

  getCharEntry(charCode: number): CharTableEntry | undefined {
    return this.entries.get(charCode);
  }

  getAllEntries(): CharTableEntry[] {
    return Array.from(this.entries.values());
  }
}
