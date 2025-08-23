// Converted from sfiii-decomp/include/common.h
export declare const NULL: number;
export declare function REINTERPRET_AS_U32(num: any): number;
export declare function BOOL(expr: boolean): number;
export declare const SPR: number;
export declare const S32_MAX: number;
export declare function S32_INCREMENT_WRAPAROUND(val: number): number;
export declare function ALIGN_UP(x: number, a: number): number;

// Macros from common.h that don't directly translate to simple declarations
// For example, GNU C specific includes and macros related to assembly.
// These would require more complex handling or might be omitted if not translatable.
// Example:
// #if defined(__GNUC__) && !defined(M2CTX) && !defined(TARGET_SDL3)
// #define INCLUDE_ASM(FOLDER, NAME) ...
// #endif
// For declaration files, we'd typically omit implementations of macros that are conditional
// or rely on specific compiler features unless they represent essential exported functionalities.
// Declaring functions for them might be an approximation.
// The defines LO_16_BITS and HI_16_BITS are also macro functions that were not directly translated.
// They can be represented as functions as well.
export declare function LO_16_BITS(val: number): number;
export declare function HI_16_BITS(val: number): number;