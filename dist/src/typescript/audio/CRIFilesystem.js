/**
 * CRI Virtual Filesystem
 * Converted from CRI library C code to TypeScript
 */
export class CRIFilesystem {
    constructor() {
        Object.defineProperty(this, "header", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "files", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "data", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
    }
    async loadArchive(buffer) {
        const view = new DataView(buffer);
        this.data = buffer;
        // Read header
        const signature = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
        if (signature !== 'CRIW')
            return false;
        this.header = {
            signature,
            version: view.getUint32(4, true),
            fileCount: view.getUint32(8, true),
            directoryOffset: view.getUint32(12, true)
        };
        // Read file entries
        let offset = this.header.directoryOffset;
        for (let i = 0; i < this.header.fileCount; i++) {
            const nameLength = view.getUint8(offset);
            offset++;
            let name = '';
            for (let j = 0; j < nameLength; j++) {
                name += String.fromCharCode(view.getUint8(offset + j));
            }
            offset += nameLength;
            const entry = {
                id: view.getUint32(offset, true),
                name,
                offset: view.getUint32(offset + 4, true),
                size: view.getUint32(offset + 8, true),
                attributes: view.getUint32(offset + 12, true)
            };
            this.files.set(name, entry);
            offset += 16;
        }
        return true;
    }
    getFile(filename) {
        const entry = this.files.get(filename);
        if (!entry || !this.data)
            return null;
        return this.data.slice(entry.offset, entry.offset + entry.size);
    }
    listFiles() {
        return Array.from(this.files.keys());
    }
    getFileInfo(filename) {
        return this.files.get(filename) || null;
    }
}
//# sourceMappingURL=CRIFilesystem.js.map