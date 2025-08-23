// Converted from sfiii-decomp/include/sf33rd/AcrSDK/common/fbms.h

// Assuming 'structs.h' and 'types.h' are implicitly handled or their types are globally available.
// Forward declare types that are not defined here.
declare type FL_FMS = any;
declare type FMS_FRAME = any;
declare type s32 = number;

// Function declarations
export declare function fmsCalcSpace(lp: FL_FMS): s32;
export declare function fmsInitialize(lp: FL_FMS, memory_ptr: any | null, memsize: number, memalign: number): s32;
export declare function fmsAllocMemory(lp: FL_FMS, bytes: number, heapnum: number): any | null; // void*
export declare function fmsGetFrame(lp: FL_FMS, heapnum: number, frame: FMS_FRAME): s32;