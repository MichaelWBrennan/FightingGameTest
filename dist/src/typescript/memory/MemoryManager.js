/**
 * Memory Manager - Converted from MemMan.c
 * Handles memory allocation and management for the game
 */
export class MemoryManager {
    static getInstance() {
        if (!MemoryManager.instance) {
            MemoryManager.instance = new MemoryManager();
        }
        return MemoryManager.instance;
    }
    constructor() {
        this.heaps = new Map();
        this.nextAddress = 0x10000000; // Mock starting address
        // Initialize main memory buffer (64MB mock)
        this.memoryMap = new ArrayBuffer(64 * 1024 * 1024);
        this.memoryView = new Uint8Array(this.memoryMap);
        this.initializeDefaultHeaps();
    }
    /**
     * Initialize default memory heaps
     */
    initializeDefaultHeaps() {
        // Main game heap
        this.createHeap('MAIN', 32 * 1024 * 1024);
        // Graphics heap
        this.createHeap('GRAPHICS', 16 * 1024 * 1024);
        // Sound heap
        this.createHeap('SOUND', 8 * 1024 * 1024);
        // Effects heap
        this.createHeap('EFFECTS', 4 * 1024 * 1024);
    }
    /**
     * Create a new memory heap
     */
    createHeap(name, size) {
        if (this.heaps.has(name)) {
            console.warn(`Heap '${name}' already exists`);
            return false;
        }
        const heap = {
            name,
            baseAddress: this.nextAddress,
            totalSize: size,
            freeSize: size,
            blocks: []
        };
        this.heaps.set(name, heap);
        this.nextAddress += size;
        console.log(`Created heap '${name}' at 0x${heap.baseAddress.toString(16)} (${size} bytes)`);
        return true;
    }
    /**
     * Allocate memory - converted from mmAlloc()
     */
    mmAlloc(size, heapName = 'MAIN') {
        return this.mmAllocSub(size, heapName, null);
    }
    /**
     * Internal allocation function - converted from mmAllocSub()
     */
    mmAllocSub(size, heapName, userData) {
        const heap = this.heaps.get(heapName);
        if (!heap) {
            console.error(`Heap '${heapName}' not found`);
            return 0;
        }
        if (heap.freeSize < size) {
            console.error(`Insufficient memory in heap '${heapName}': requested ${size}, available ${heap.freeSize}`);
            return 0;
        }
        // Find a suitable free block or create a new one
        const address = this.findFreeBlock(heap, size);
        if (address === 0) {
            return 0;
        }
        const block = {
            address,
            size,
            allocated: true,
            userData
        };
        heap.blocks.push(block);
        heap.freeSize -= size;
        console.log(`Allocated ${size} bytes at 0x${address.toString(16)} in heap '${heapName}'`);
        return address;
    }
    /**
     * Find a free block of the specified size
     */
    findFreeBlock(heap, size) {
        // Simple linear allocation strategy
        let currentAddress = heap.baseAddress;
        // Sort blocks by address
        const sortedBlocks = heap.blocks
            .filter(block => block.allocated)
            .sort((a, b) => a.address - b.address);
        // Find gaps between allocated blocks
        for (const block of sortedBlocks) {
            if (block.address - currentAddress >= size) {
                return currentAddress;
            }
            currentAddress = block.address + block.size;
        }
        // Check if there's space at the end
        if (heap.baseAddress + heap.totalSize - currentAddress >= size) {
            return currentAddress;
        }
        return 0; // No suitable block found
    }
    /**
     * Free allocated memory
     */
    mmFree(address, heapName = 'MAIN') {
        const heap = this.heaps.get(heapName);
        if (!heap) {
            console.error(`Heap '${heapName}' not found`);
            return false;
        }
        const blockIndex = heap.blocks.findIndex(block => block.address === address && block.allocated);
        if (blockIndex === -1) {
            console.error(`Block at address 0x${address.toString(16)} not found in heap '${heapName}'`);
            return false;
        }
        const block = heap.blocks[blockIndex];
        block.allocated = false;
        heap.freeSize += block.size;
        // Remove the block from the array
        heap.blocks.splice(blockIndex, 1);
        console.log(`Freed ${block.size} bytes at 0x${address.toString(16)} in heap '${heapName}'`);
        return true;
    }
    /**
     * Get heap information
     */
    getHeapInfo(heapName) {
        return this.heaps.get(heapName) || null;
    }
    /**
     * Get total allocated memory across all heaps
     */
    getTotalAllocated() {
        let total = 0;
        for (const heap of this.heaps.values()) {
            total += heap.totalSize - heap.freeSize;
        }
        return total;
    }
    /**
     * Get memory statistics
     */
    getMemoryStats() {
        const stats = {};
        for (const [name, heap] of this.heaps.entries()) {
            stats[name] = {
                total: heap.totalSize,
                used: heap.totalSize - heap.freeSize,
                free: heap.freeSize
            };
        }
        return stats;
    }
    /**
     * Compact heap by defragmenting free space
     */
    compactHeap(heapName) {
        const heap = this.heaps.get(heapName);
        if (!heap) {
            return;
        }
        // Sort blocks by address
        heap.blocks.sort((a, b) => a.address - b.address);
        // Compact allocated blocks
        let currentAddress = heap.baseAddress;
        for (const block of heap.blocks) {
            if (block.allocated) {
                if (block.address !== currentAddress) {
                    // Move block data (in a real implementation)
                    console.log(`Moving block from 0x${block.address.toString(16)} to 0x${currentAddress.toString(16)}`);
                    block.address = currentAddress;
                }
                currentAddress += block.size;
            }
        }
        console.log(`Compacted heap '${heapName}'`);
    }
}
//# sourceMappingURL=MemoryManager.js.map