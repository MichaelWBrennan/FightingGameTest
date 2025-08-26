/**
 * Memory Manager - Converted from MemMan.c
 * Handles memory allocation and management for the game
 */
export interface MemoryBlock {
    address: number;
    size: number;
    allocated: boolean;
    userData?: any;
}
export interface MemoryHeap {
    name: string;
    baseAddress: number;
    totalSize: number;
    freeSize: number;
    blocks: MemoryBlock[];
}
export declare class MemoryManager {
    private static instance;
    private heaps;
    private memoryMap;
    private memoryView;
    private nextAddress;
    static getInstance(): MemoryManager;
    private constructor();
    /**
     * Initialize default memory heaps
     */
    private initializeDefaultHeaps;
    /**
     * Create a new memory heap
     */
    createHeap(name: string, size: number): boolean;
    /**
     * Allocate memory - converted from mmAlloc()
     */
    mmAlloc(size: number, heapName?: string): number;
    /**
     * Internal allocation function - converted from mmAllocSub()
     */
    mmAllocSub(size: number, heapName: string, userData: any): number;
    /**
     * Find a free block of the specified size
     */
    private findFreeBlock;
    /**
     * Free allocated memory
     */
    mmFree(address: number, heapName?: string): boolean;
    /**
     * Get heap information
     */
    getHeapInfo(heapName: string): MemoryHeap | null;
    /**
     * Get total allocated memory across all heaps
     */
    getTotalAllocated(): number;
    /**
     * Get memory statistics
     */
    getMemoryStats(): {
        [heapName: string]: {
            total: number;
            used: number;
            free: number;
        };
    };
    /**
     * Compact heap by defragmenting free space
     */
    compactHeap(heapName: string): void;
}
//# sourceMappingURL=MemoryManager.d.ts.map