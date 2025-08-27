/**
 * PS2 Memory Manager
 * Converted from C to TypeScript with WebAssembly support
 */
export class PS2MemoryManager {
    constructor() {
        this.regions = [];
        this.allocations = new Map();
        this.freeBlocks = new Map(); // address -> size
        this.memory = new ArrayBuffer(PS2MemoryManager.MAIN_MEMORY_SIZE +
            PS2MemoryManager.SOUND_MEMORY_SIZE +
            PS2MemoryManager.VIDEO_MEMORY_SIZE);
        this.initializeRegions();
    }
    initializeRegions() {
        let offset = 0;
        // Main memory
        this.regions.push({
            start: offset,
            size: PS2MemoryManager.MAIN_MEMORY_SIZE,
            type: 'main',
            allocated: false
        });
        this.freeBlocks.set(offset, PS2MemoryManager.MAIN_MEMORY_SIZE);
        offset += PS2MemoryManager.MAIN_MEMORY_SIZE;
        // Sound memory
        this.regions.push({
            start: offset,
            size: PS2MemoryManager.SOUND_MEMORY_SIZE,
            type: 'sound',
            allocated: false
        });
        this.freeBlocks.set(offset, PS2MemoryManager.SOUND_MEMORY_SIZE);
        offset += PS2MemoryManager.SOUND_MEMORY_SIZE;
        // Video memory
        this.regions.push({
            start: offset,
            size: PS2MemoryManager.VIDEO_MEMORY_SIZE,
            type: 'video',
            allocated: false
        });
        this.freeBlocks.set(offset, PS2MemoryManager.VIDEO_MEMORY_SIZE);
    }
    malloc(size, alignment = 16, tag = 'unknown') {
        const alignedSize = Math.ceil(size / alignment) * alignment;
        for (const [address, blockSize] of this.freeBlocks) {
            if (blockSize >= alignedSize) {
                // Remove from free blocks
                this.freeBlocks.delete(address);
                // Add remainder back if any
                if (blockSize > alignedSize) {
                    this.freeBlocks.set(address + alignedSize, blockSize - alignedSize);
                }
                // Track allocation
                this.allocations.set(address, {
                    address,
                    size: alignedSize,
                    alignment,
                    tag
                });
                return address;
            }
        }
        throw new Error(`Failed to allocate ${size} bytes`);
    }
    free(address) {
        const allocation = this.allocations.get(address);
        if (!allocation) {
            throw new Error(`Invalid free at address ${address}`);
        }
        this.allocations.delete(address);
        this.freeBlocks.set(address, allocation.size);
        // Coalesce adjacent free blocks
        this.coalesceBlocks();
    }
    coalesceBlocks() {
        const sortedAddresses = Array.from(this.freeBlocks.keys()).sort((a, b) => a - b);
        for (let i = 0; i < sortedAddresses.length - 1; i++) {
            const currentAddr = sortedAddresses[i];
            const currentSize = this.freeBlocks.get(currentAddr);
            const nextAddr = sortedAddresses[i + 1];
            if (currentAddr + currentSize === nextAddr) {
                const nextSize = this.freeBlocks.get(nextAddr);
                this.freeBlocks.delete(nextAddr);
                this.freeBlocks.set(currentAddr, currentSize + nextSize);
                sortedAddresses.splice(i + 1, 1);
                i--;
            }
        }
    }
    readBytes(address, length) {
        return new Uint8Array(this.memory, address, length);
    }
    writeBytes(address, data) {
        const view = new Uint8Array(this.memory, address, data.length);
        view.set(data);
    }
    readUint32(address) {
        const view = new DataView(this.memory, address, 4);
        return view.getUint32(0, true);
    }
    writeUint32(address, value) {
        const view = new DataView(this.memory, address, 4);
        view.setUint32(0, value, true);
    }
    getMemoryUsage() {
        const total = this.memory.byteLength;
        const allocated = Array.from(this.allocations.values())
            .reduce((sum, alloc) => sum + alloc.size, 0);
        const free = total - allocated;
        return { allocated, free, total };
    }
    getAllocations() {
        return Array.from(this.allocations.values());
    }
    dumpMemoryMap() {
        console.log('Memory Map:');
        console.log('Allocations:');
        for (const alloc of this.allocations.values()) {
            console.log(`  ${alloc.address.toString(16).padStart(8, '0')}: ${alloc.size} bytes (${alloc.tag})`);
        }
        console.log('Free blocks:');
        for (const [addr, size] of this.freeBlocks) {
            console.log(`  ${addr.toString(16).padStart(8, '0')}: ${size} bytes`);
        }
    }
}
PS2MemoryManager.MAIN_MEMORY_SIZE = 32 * 1024 * 1024; // 32MB
PS2MemoryManager.SOUND_MEMORY_SIZE = 2 * 1024 * 1024; // 2MB
PS2MemoryManager.VIDEO_MEMORY_SIZE = 4 * 1024 * 1024; // 4MB
//# sourceMappingURL=PS2MemoryManager.js.map