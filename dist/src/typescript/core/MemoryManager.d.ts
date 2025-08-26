/**
 * Memory Manager - TypeScript conversion from MemMan.c
 * Handles dynamic memory allocation and management for the game
 */
export interface MemoryBlock {
    address: number;
    size: number;
    allocated: boolean;
    tag?: string;
}
export interface MemoryPool {
    name: string;
    baseAddress: number;
    totalSize: number;
    usedSize: number;
    blocks: MemoryBlock[];
    alignment: number;
}
export declare class MemoryManager {
    private pools;
    private totalMemory;
    private usedMemory;
    private defaultAlignment;
    private debugMode;
    constructor();
    /**
     * Initialize default memory pools
     */
    private initializeDefaultPools;
    /**
     * Create a new memory pool
     */
    createPool(name: string, baseAddress: number, size: number, alignment?: number): boolean;
    /**
     * Allocate memory from a specific pool
     */
    allocate(poolName: string, size: number, tag?: string): number | null;
    /**
     * Free memory block
     */
    free(poolName: string, address: number): boolean;
    /**
     * Find free space in pool
     */
    private findFreeSpace;
    /**
     * Align size to boundary
     */
    private alignSize;
    /**
     * Get memory pool statistics
     */
    getPoolStats(poolName: string): MemoryPool | null;
    /**
     * Get total memory statistics
     */
    getGlobalStats(): {
        total: number;
        used: number;
        free: number;
        pools: number;
    };
    /**
     * Defragment a memory pool
     */
    defragmentPool(poolName: string): boolean;
    /**
     * Clear all allocations in a pool
     */
    clearPool(poolName: string): boolean;
    /**
     * Enable/disable debug mode
     */
    setDebugMode(enabled: boolean): void;
    /**
     * Get all allocated blocks with their tags
     */
    getAllocatedBlocks(): {
        poolName: string;
        block: MemoryBlock;
    }[];
    /**
     * Check for memory leaks
     */
    checkForLeaks(): {
        poolName: string;
        leaks: MemoryBlock[];
    }[];
    /**
     * Shutdown memory manager
     */
    shutdown(): void;
}
export declare const memoryManager: MemoryManager;
//# sourceMappingURL=MemoryManager.d.ts.map