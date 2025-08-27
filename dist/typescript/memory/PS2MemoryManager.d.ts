/**
 * PS2 Memory Manager
 * Converted from C to TypeScript with WebAssembly support
 */
export interface MemoryRegion {
    start: number;
    size: number;
    type: 'main' | 'sound' | 'video' | 'scratch';
    allocated: boolean;
}
export interface AllocationBlock {
    address: number;
    size: number;
    alignment: number;
    tag: string;
}
export declare class PS2MemoryManager {
    private memory;
    private regions;
    private allocations;
    private freeBlocks;
    private static readonly MAIN_MEMORY_SIZE;
    private static readonly SOUND_MEMORY_SIZE;
    private static readonly VIDEO_MEMORY_SIZE;
    constructor();
    private initializeRegions;
    malloc(size: number, alignment?: number, tag?: string): number;
    free(address: number): void;
    private coalesceBlocks;
    readBytes(address: number, length: number): Uint8Array;
    writeBytes(address: number, data: Uint8Array): void;
    readUint32(address: number): number;
    writeUint32(address: number, value: number): void;
    getMemoryUsage(): {
        allocated: number;
        free: number;
        total: number;
    };
    getAllocations(): AllocationBlock[];
    dumpMemoryMap(): void;
}
