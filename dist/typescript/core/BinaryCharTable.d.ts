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
export declare class BinaryCharTable {
    private entries;
    constructor(data?: ArrayBuffer);
    private loadFromBuffer;
    getCharEntry(charCode: number): CharTableEntry | undefined;
    getAllEntries(): CharTableEntry[];
}
