
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

export class PS2MemoryManager {
  private memory: ArrayBuffer;
  private regions: MemoryRegion[] = [];
  private allocations: Map<number, AllocationBlock> = new Map();
  private freeBlocks: Map<number, number> = new Map(); // address -> size
  
  private static readonly MAIN_MEMORY_SIZE = 32 * 1024 * 1024; // 32MB
  private static readonly SOUND_MEMORY_SIZE = 2 * 1024 * 1024; // 2MB
  private static readonly VIDEO_MEMORY_SIZE = 4 * 1024 * 1024; // 4MB

  constructor() {
    this.memory = new ArrayBuffer(PS2MemoryManager.MAIN_MEMORY_SIZE + 
                                  PS2MemoryManager.SOUND_MEMORY_SIZE + 
                                  PS2MemoryManager.VIDEO_MEMORY_SIZE);
    this.initializeRegions();
  }

  private initializeRegions(): void {
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

  malloc(size: number, alignment = 16, tag = 'unknown'): number {
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

  free(address: number): void {
    const allocation = this.allocations.get(address);
    if (!allocation) {
      throw new Error(`Invalid free at address ${address}`);
    }
    
    this.allocations.delete(address);
    this.freeBlocks.set(address, allocation.size);
    
    // Coalesce adjacent free blocks
    this.coalesceBlocks();
  }

  private coalesceBlocks(): void {
    const sortedAddresses = Array.from(this.freeBlocks.keys()).sort((a, b) => a - b);
    
    for (let i = 0; i < sortedAddresses.length - 1; i++) {
      const currentAddr = sortedAddresses[i];
      const currentSize = this.freeBlocks.get(currentAddr)!;
      const nextAddr = sortedAddresses[i + 1];
      
      if (currentAddr + currentSize === nextAddr) {
        const nextSize = this.freeBlocks.get(nextAddr)!;
        this.freeBlocks.delete(nextAddr);
        this.freeBlocks.set(currentAddr, currentSize + nextSize);
        sortedAddresses.splice(i + 1, 1);
        i--;
      }
    }
  }

  readBytes(address: number, length: number): Uint8Array {
    return new Uint8Array(this.memory, address, length);
  }

  writeBytes(address: number, data: Uint8Array): void {
    const view = new Uint8Array(this.memory, address, data.length);
    view.set(data);
  }

  readUint32(address: number): number {
    const view = new DataView(this.memory, address, 4);
    return view.getUint32(0, true);
  }

  writeUint32(address: number, value: number): void {
    const view = new DataView(this.memory, address, 4);
    view.setUint32(0, value, true);
  }

  getMemoryUsage(): { allocated: number; free: number; total: number } {
    const total = this.memory.byteLength;
    const allocated = Array.from(this.allocations.values())
      .reduce((sum, alloc) => sum + alloc.size, 0);
    const free = total - allocated;
    
    return { allocated, free, total };
  }

  getAllocations(): AllocationBlock[] {
    return Array.from(this.allocations.values());
  }

  dumpMemoryMap(): void {
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
