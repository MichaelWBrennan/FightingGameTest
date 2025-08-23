// Converted from sfiii-decomp/include/gcc/memory.h

// Assuming 'types.h' is implicitly handled or its types are globally available.
// size_t is typically represented as 'number' in TypeScript.
export declare function memchr(p: any, c: number, n: number): any | null; // const void*
export declare function memcmp(s1: any, s2: any, n: number): number; // const void*
export declare function memcpy(dest: any, src: any, n: number): any; // void*, const void*
export declare function memmove(dest: any, src: any, n: number): any; // void*, const void*
export declare function memset(s: any, c: number, n: number): any; // void*

// Commented-out functions (bcmp, bcopy, bzero) and IOP original functions are omitted as they are not commonly used or rely on specific platform details.