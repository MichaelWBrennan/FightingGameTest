
/* zutil.ts -- target dependent utility functions for the compression library
 * Converted from C to TypeScript
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
    return z_errmsg[2 - err];
}

export function zmemcpy(dest: Uint8Array, source: Uint8Array, len: number): void {
    if (len === 0) return;
    for (let i = 0; i < len; i++) {
        dest[i] = source[i];
    }
}

export function zmemcmp(s1: Uint8Array, s2: Uint8Array, len: number): number {
    for (let j = 0; j < len; j++) {
        if (s1[j] !== s2[j]) return 2 * (s1[j] > s2[j] ? 1 : 0) - 1;
    }
    return 0;
}

export function zmemzero(dest: Uint8Array, len: number): void {
    if (len === 0) return;
    for (let i = 0; i < len; i++) {
        dest[i] = 0;
    }
}

export function zcalloc(opaque: any, items: number, size: number): Uint8Array {
    return new Uint8Array(items * size);
}

export function zcfree(opaque: any, ptr: any): void {
    // JavaScript garbage collection handles this
}
