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
export declare class CRIFilesystem {
    private header;
    private files;
    private data;
    loadArchive(buffer: ArrayBuffer): Promise<boolean>;
    getFile(filename: string): ArrayBuffer | null;
    listFiles(): string[];
    getFileInfo(filename: string): CRIFileEntry | null;
}
