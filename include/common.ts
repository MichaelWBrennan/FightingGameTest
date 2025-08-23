/**
 * Placeholder conversion of C header file to TypeScript.
 * Manual adaptation and type checks are required.
 * Original file: include/common.h
 */

// Assuming types.ts defines these, or they are globally available
// type u32 = number;
// type s32 = number;
// type s8 = string | null; // Placeholder

export const NULL = 0;
export const REINTERPRET_AS_U32 = (num: any): number => `/* Manual implementation needed for REINTERPRET_AS_U32 */`;
export const BOOL = (expr: any): number => (expr ? 1 : 0);
export const SPR = 0x70000000;

export const S32_MAX = 0x7FFFFFFF;
export const S32_INCREMENT_WRAPAROUND = (val: number): number => (val !== S32_MAX) ? ((val + 1) % 0x80000000) : 0; // Potential wrap-around logic

export const ALIGN_UP = (x: number, a: number): number => (((x) + ((a) - 1)) & ~((a) - 1));

// Macros for assembly inclusion - these are not directly translatable to TS
// Keeping them as comments or placeholder functions.
const INCLUDE_ASM = (FOLDER: string, NAME: string): void => {
    console.warn(`INCLUDE_ASM is a C macro for assembly - '${FOLDER}/${NAME}.s'`);
};
const INCLUDE_RODATA = (FOLDER: string, NAME: string): void => {
    console.warn(`INCLUDE_RODATA is a C macro for read-only data - '${FOLDER}/${NAME}'`);
};

// Conditional macros are complex to replicate directly.
// Placeholder for __attribute__((aligned(value)))
const ATTR_ALIGNED = (value: number) => { /* Alignment is a compiler concern for memory layout */ };

// Function declarations from C, need their TS equivalents.
// If TARGET_PS2 is not defined, these would be available.
// For now, define them as stubs.
function fatal_error(fmt: string, ...args: any[]): never {
    console.error(`FATAL ERROR: ${fmt}`, ...args);
    throw new Error("Fatal error called");
}
function not_implemented(func: string): never {
    console.error(`Function '${func}' is not implemented.`);
    throw new Error(`Not implemented: ${func}`);
}
function debug_print(fmt: string, ...args: any[]): void {
    console.log(`DEBUG: ${fmt}`, ...args);
}

export const LO_16_BITS = (val: number): number => val & 0xFFFF;
export const HI_16_BITS = (val: number): number => (val & 0xFFFF0000) >> 16;

// End of file marker, typically removed in TS
// #endif