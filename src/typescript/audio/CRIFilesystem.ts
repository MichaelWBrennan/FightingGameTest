
/**
 * CRI Virtual Filesystem
 * Converted from CRI library C code to TypeScript
 */

export interface CRIFileEntry {
  id: number;
  name: string;
  offset: number;
  size: number;
  attributes: number;
}

export interface CRIHeader {
  signature: string;
  version: number;
  fileCount: number;
  directoryOffset: number;
}

export class CRIFilesystem {
  private header: CRIHeader | null = null;
  private files: Map<string, CRIFileEntry> = new Map();
  private data: ArrayBuffer | null = null;

  async loadArchive(buffer: ArrayBuffer): Promise<boolean> {
    const view = new DataView(buffer);
    this.data = buffer;
    
    // Read header
    const signature = String.fromCharCode(
      view.getUint8(0), view.getUint8(1), 
      view.getUint8(2), view.getUint8(3)
    );
    
    if (signature !== 'CRIW') return false;
    
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
      
      const entry: CRIFileEntry = {
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

  getFile(filename: string): ArrayBuffer | null {
    const entry = this.files.get(filename);
    if (!entry || !this.data) return null;
    
    return this.data.slice(entry.offset, entry.offset + entry.size);
  }

  listFiles(): string[] {
    return Array.from(this.files.keys());
  }

  getFileInfo(filename: string): CRIFileEntry | null {
    return this.files.get(filename) || null;
  }
}
