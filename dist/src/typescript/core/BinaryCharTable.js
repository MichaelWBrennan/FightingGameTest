/**
 * Binary character table utilities
 * Converted from C to TypeScript
 */
export class BinaryCharTable {
    constructor(data) {
        Object.defineProperty(this, "entries", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        if (data) {
            this.loadFromBuffer(data);
        }
    }
    loadFromBuffer(buffer) {
        const view = new DataView(buffer);
        let offset = 0;
        // Read header
        const entryCount = view.getUint32(offset, true);
        offset += 4;
        // Read entries
        for (let i = 0; i < entryCount; i++) {
            const entry = {
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
    getCharEntry(charCode) {
        return this.entries.get(charCode);
    }
    getAllEntries() {
        return Array.from(this.entries.values());
    }
}
//# sourceMappingURL=BinaryCharTable.js.map