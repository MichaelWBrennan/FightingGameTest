// Converted from sfiii-decomp/include/sf33rd/AcrSDK/common/memfound.h

// Assuming MEM_BLOCK, structs.h, and types.h are handled implicitly or globally.
declare type MEM_BLOCK = any;
declare type BlockHandle = number; // u32

// Function declarations
export declare function mflInit(mem_ptr: any | null, memsize: number, memalign: number): void;
export declare function mflGetSpace(): BlockHandle; // u32
export declare function mflGetFreeSpace(): number; // size_t
export declare function mflRegisterS(len: number): BlockHandle; // u32
export declare function mflRegister(len: number): BlockHandle; // u32
export declare function mflTemporaryUse(len: number): any | null; // void*
export declare function mflRetrieve(handle: BlockHandle): any | null; // void*
export declare function mflRelease(handle: BlockHandle): number; // s32
export declare function mflCompact(): any | null; // void*
