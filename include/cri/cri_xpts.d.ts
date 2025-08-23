// Converted from sfiii-decomp/include/cri/cri_xpts.h

// Module: cri_xpts

// NULL, FALSE, TRUE, OFF, ON, OK, NG definitions
export declare const NULL: any; // Represents (0) or ((void *)0)
export declare const FALSE: number;
export declare const TRUE: number;
export declare const OFF: number;
export declare const ON: number;
export declare const OK: number;
export declare const NG: number;

// Basic Data Type Declarations
export type Uint8 = number;
export type Sint8 = number;
export type Uint16 = number;
export type Sint16 = number;

// Platform-specific type definitions
// Based on the #ifdefs in the header file

// For XPT_TGT_EE
export type Uint32_EE = number;
export type Sint32_EE = number;
export type Uint64_EE = number;
export type Sint64_EE = number;

// For XPT_TGT_GC
export type Uint64_GC = number;
export type Sint64_GC = number;
export interface Uint128_GC {
    h: Uint64_GC;
    l: Uint64_GC;
}
export interface Sint128_GC {
    h: Uint64_GC;
    l: Uint64_GC;
}

// For XPT_TGT_XB or XPT_TGT_PC
export type Uint64_XB_PC = number;
export type Sint64_XB_PC = number;
export interface Uint128_XB_PC {
    h: Uint64_XB_PC;
    l: Uint64_XB_PC;
}
export interface Sint128_XB_PC {
    h: Sint64_XB_PC;
    l: Uint64_XB_PC;
}

// For XPT_TGT_IOP
export type Uint32_IOP = number;
export type Sint32_IOP = number;

// For other targets (defaulting to uint32/sint32)
export type Uint32 = number;
export type Sint32 = number;

// Float types
export type Float16 = number;
export type Float32 = number;
export type Float64 = number;

// Other common types
export type Fixed32 = number;
export type Bool = number;
export type Char8 = string;

// Function Declarations for math.h (assuming they are standard math functions)
export declare function atan2(value1: number, value2: number): number;
export declare function sqrt(value: number): number;
export declare function cosf(value: number): number;

// Function Declarations for stdio.h
export declare function printf(format: string, ...args: any[]): number;
export declare function vsprintf(buf: string, fmt: string, ...args: any[]): number;

// Function Declarations for stdlib.h
export declare function malloc(size: number): any | null; // void*
export declare function free(ptr: any | null): void;

// Function Declarations for string.h
export declare function memset(s: any, c: number, n: number): any;
export declare function strlen(s: string): number;
export declare function strcpy(dest: string, src: string): string;
export declare function strcat(dest: string, src: string): string;
export declare function strupr(str: string): string;
export declare function strchr(s: string, c: number): string | null;