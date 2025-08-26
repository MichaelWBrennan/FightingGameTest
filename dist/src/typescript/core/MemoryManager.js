/**
 * Memory Manager - TypeScript conversion from MemMan.c
 * Handles dynamic memory allocation and management for the game
 */
export class MemoryManager {
    constructor() {
        Object.defineProperty(this, "pools", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "totalMemory", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "usedMemory", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "defaultAlignment", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 16
        });
        Object.defineProperty(this, "debugMode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        this.initializeDefaultPools();
    }
    /**
     * Initialize default memory pools
     */
    initializeDefaultPools() {
        // Main game memory pool
        this.createPool('main', 0x1000000, 32 * 1024 * 1024); // 32MB
        // Graphics memory pool
        this.createPool('graphics', 0x3000000, 16 * 1024 * 1024); // 16MB
        // Audio memory pool
        this.createPool('audio', 0x4000000, 8 * 1024 * 1024); // 8MB
        // Character data pool
        this.createPool('character', 0x5000000, 8 * 1024 * 1024); // 8MB
        // Effects pool
        this.createPool('effects', 0x6000000, 4 * 1024 * 1024); // 4MB
    }
    /**
     * Create a new memory pool
     */
    createPool(name, baseAddress, size, alignment = 16) {
        if (this.pools.has(name)) {
            console.warn(`Memory pool '${name}' already exists`);
            return false;
        }
        const pool = {
            name,
            baseAddress,
            totalSize: size,
            usedSize: 0,
            blocks: [],
            alignment
        };
        this.pools.set(name, pool);
        this.totalMemory += size;
        if (this.debugMode) {
            console.log(`Created memory pool '${name}': ${size} bytes at 0x${baseAddress.toString(16)}`);
        }
        return true;
    }
    /**
     * Allocate memory from a specific pool
     */
    allocate(poolName, size, tag) {
        const pool = this.pools.get(poolName);
        if (!pool) {
            console.error(`Memory pool '${poolName}' not found`);
            return null;
        }
        // Align size
        const alignedSize = this.alignSize(size, pool.alignment);
        // Find free space
        const address = this.findFreeSpace(pool, alignedSize);
        if (address === null) {
            console.error(`Not enough memory in pool '${poolName}' for ${alignedSize} bytes`);
            return null;
        }
        // Create memory block
        const block = {
            address,
            size: alignedSize,
            allocated: true,
            tag
        };
        pool.blocks.push(block);
        pool.usedSize += alignedSize;
        this.usedMemory += alignedSize;
        if (this.debugMode) {
            console.log(`Allocated ${alignedSize} bytes at 0x${address.toString(16)} in pool '${poolName}'${tag ? ` (${tag})` : ''}`);
        }
        return address;
    }
    /**
     * Free memory block
     */
    free(poolName, address) {
        const pool = this.pools.get(poolName);
        if (!pool) {
            console.error(`Memory pool '${poolName}' not found`);
            return false;
        }
        const blockIndex = pool.blocks.findIndex(block => block.address === address && block.allocated);
        if (blockIndex === -1) {
            console.error(`Memory block at 0x${address.toString(16)} not found in pool '${poolName}'`);
            return false;
        }
        const block = pool.blocks[blockIndex];
        block.allocated = false;
        pool.usedSize -= block.size;
        this.usedMemory -= block.size;
        if (this.debugMode) {
            console.log(`Freed ${block.size} bytes at 0x${address.toString(16)} in pool '${poolName}'${block.tag ? ` (${block.tag})` : ''}`);
        }
        // Remove block from list (optional - could keep for debugging)
        pool.blocks.splice(blockIndex, 1);
        return true;
    }
    /**
     * Find free space in pool
     */
    findFreeSpace(pool, size) {
        // Sort blocks by address
        const sortedBlocks = pool.blocks
            .filter(block => block.allocated)
            .sort((a, b) => a.address - b.address);
        let currentAddress = pool.baseAddress;
        for (const block of sortedBlocks) {
            if (block.address - currentAddress >= size) {
                return currentAddress;
            }
            currentAddress = block.address + block.size;
        }
        // Check if there's space at the end
        if (pool.baseAddress + pool.totalSize - currentAddress >= size) {
            return currentAddress;
        }
        return null;
    }
    /**
     * Align size to boundary
     */
    alignSize(size, alignment) {
        return Math.ceil(size / alignment) * alignment;
    }
    /**
     * Get memory pool statistics
     */
    getPoolStats(poolName) {
        return this.pools.get(poolName) || null;
    }
    /**
     * Get total memory statistics
     */
    getGlobalStats() {
        return {
            total: this.totalMemory,
            used: this.usedMemory,
            free: this.totalMemory - this.usedMemory,
            pools: this.pools.size
        };
    }
    /**
     * Defragment a memory pool
     */
    defragmentPool(poolName) {
        const pool = this.pools.get(poolName);
        if (!pool) {
            console.error(`Memory pool '${poolName}' not found`);
            return false;
        }
        // Sort allocated blocks by address
        const allocatedBlocks = pool.blocks
            .filter(block => block.allocated)
            .sort((a, b) => a.address - b.address);
        let currentAddress = pool.baseAddress;
        // Compact blocks
        for (const block of allocatedBlocks) {
            if (block.address !== currentAddress) {
                // Move block data (in real implementation, would copy memory)
                block.address = currentAddress;
            }
            currentAddress += block.size;
        }
        if (this.debugMode) {
            console.log(`Defragmented pool '${poolName}'`);
        }
        return true;
    }
    /**
     * Clear all allocations in a pool
     */
    clearPool(poolName) {
        const pool = this.pools.get(poolName);
        if (!pool) {
            console.error(`Memory pool '${poolName}' not found`);
            return false;
        }
        this.usedMemory -= pool.usedSize;
        pool.usedSize = 0;
        pool.blocks = [];
        if (this.debugMode) {
            console.log(`Cleared all allocations in pool '${poolName}'`);
        }
        return true;
    }
    /**
     * Enable/disable debug mode
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
    /**
     * Get all allocated blocks with their tags
     */
    getAllocatedBlocks() {
        const blocks = [];
        for (const [poolName, pool] of this.pools) {
            for (const block of pool.blocks) {
                if (block.allocated) {
                    blocks.push({ poolName, block });
                }
            }
        }
        return blocks;
    }
    /**
     * Check for memory leaks
     */
    checkForLeaks() {
        const leaks = [];
        for (const [poolName, pool] of this.pools) {
            const poolLeaks = pool.blocks.filter(block => block.allocated && !block.tag?.includes('persistent'));
            if (poolLeaks.length > 0) {
                leaks.push({ poolName, leaks: poolLeaks });
            }
        }
        return leaks;
    }
    /**
     * Shutdown memory manager
     */
    shutdown() {
        // Check for leaks before shutdown
        const leaks = this.checkForLeaks();
        if (leaks.length > 0) {
            console.warn('Memory leaks detected during shutdown:', leaks);
        }
        // Clear all pools
        for (const poolName of this.pools.keys()) {
            this.clearPool(poolName);
        }
        this.pools.clear();
        this.totalMemory = 0;
        this.usedMemory = 0;
        if (this.debugMode) {
            console.log('Memory manager shutdown complete');
        }
    }
}
// Global memory manager instance
export const memoryManager = new MemoryManager();
//# sourceMappingURL=MemoryManager.js.map