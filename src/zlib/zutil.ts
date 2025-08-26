/**
 * zutil.ts - target dependent utility functions for the compression library
 * Converted from C to TypeScript with proper bounds checking
 */

export const ZLIB_VERSION = "1.1.4";

export const z_errmsg: string[] = [
    "need dictionary",     /* Z_NEED_DICT       2  */
    "stream end",          /* Z_STREAM_END      1  */
    "",                    /* Z_OK              0  */
    "file error",          /* Z_ERRNO         (-1) */
    "stream error",        /* Z_STREAM_ERROR  (-2) */
    "data error",          /* Z_DATA_ERROR    (-3) */
    "insufficient memory", /* Z_MEM_ERROR     (-4) */
    "buffer error",        /* Z_BUF_ERROR     (-5) */
    "incompatible version",/* Z_VERSION_ERROR (-6) */
    ""
];

export function zlibVersion(): string {
    return ZLIB_VERSION;
}

export function zError(err: number): string {
    const index = 2 - err;
    if (index >= 0 && index < z_errmsg.length) {
        return z_errmsg[index];
    }
    return "unknown error";
}

export function zmemcpy(dest: Uint8Array, source: Uint8Array, len: number): void {
    if (len === 0) return;
    const copyLen = Math.min(len, dest.length, source.length);
    for (let i = 0; i < copyLen; i++) {
        dest[i] = source[i];
    }
}

export function zmemcmp(s1: Uint8Array, s2: Uint8Array, len: number): number {
    const compareLen = Math.min(len, s1.length, s2.length);
    for (let j = 0; j < compareLen; j++) {
        if (s1[j] !== s2[j]) {
            return s1[j] > s2[j] ? 1 : -1;
        }
    }
    return 0;
}

export function zmemzero(dest: Uint8Array, len: number): void {
    if (len === 0) return;
    const zeroLen = Math.min(len, dest.length);
    for (let i = 0; i < zeroLen; i++) {
        dest[i] = 0;
    }
}

export function zcalloc(_opaque: any, items: number, size: number): Uint8Array {
    return new Uint8Array(items * size);
}

export function zcfree(_opaque: any, _ptr: any): void {
    // JavaScript garbage collection handles this
}

export function copyArray(dest: Uint8Array | null, destStart: number, source: Uint8Array | null, sourceStart: number, length: number): void {
    if (!dest || !source) return;

    for (let i = 0; i < length && i + destStart < dest.length && i + sourceStart < source.length; i++) {
        dest[i + destStart] = source[i + sourceStart];
    }
}

export function compareStrings(s1: string, s2: string): number {
    const len = Math.min(s1.length, s2.length);

    for (let j = 0; j < len; j++) {
        const c1 = s1[j];
        const c2 = s2[j];
        if (c1 !== undefined && c2 !== undefined && c1 !== c2) {
            return c1 > c2 ? 1 : -1;
        }
    }

    return s1.length - s2.length;
}