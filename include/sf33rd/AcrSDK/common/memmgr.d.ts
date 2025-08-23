// Converted from sfiii-decomp/include/sf33rd/AcrSDK/common/memmgr.h

// Assuming types.h is handled implicitly or globally.
// Define basic types if not already globally available.
export type u8 = number;
export type u16 = number;
export type u32 = number;
export type s32 = number;

// MEM_BLOCK structure
export interface MEM_BLOCK {
    ptr: Uint8Array | null; // u8*
    len: u32;
    align: u16;
    id: u16;
    prev: u16;
    next: u16;
}

// MEM_MGR structure
export interface MEM_MGR {
    cnt: s32;
    memsize: s32;
    block: MEM_BLOCK[] | null; // MEM_BLOCK*
    direction: s32;
    memnow: Uint8Array | null; // u8*
    memptr: Uint8Array | null; // u8*
    memalign: s32;
    used_size: s32;
    tmemsize: s32;
    blocklist: u32;
}

// Function declarations
export declare const MEM_NULL_HANDLE: u16;

export declare function plmemInit(memmgr: MEM_MGR, block: MEM_BLOCK[] | null, count: number, mem_ptr: any | null, memsize: number, memalign: number, direction: number): void;
export declare function plmemRegister(memmgr: MEM_MGR, len: number): u32;
export declare function plmemRegisterAlign(memmgr: MEM_MGR, len: number, align: number): u32;
export declare function plmemRegisterS(memmgr: MEM_MGR, len: number): u32;
export declare function plmemTemporaryUse(memmgr: MEM_MGR, len: number): any | null; // void*
export declare function plmemRetrieve(memmgr: MEM_MGR, handle: u32): any | null; // void*
export declare function plmemRelease(memmgr: MEM_MGR, handle: u32): s32;
export declare function plmemCompact(memmgr: MEM_MGR): any | null; // void*
export declare function plmemGetSpace(memmgr: MEM_MGR): u32;
export declare function plmemGetFreeSpace(memmgr: MEM_MGR): number; // size_t