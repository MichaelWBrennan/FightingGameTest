/**
 * zutil.ts - target dependent utility functions for the compression library
 * Converted from C to TypeScript with proper bounds checking
 */
export const ZLIB_VERSION = "1.1.4";
export const z_errmsg = [
    "need dictionary", /* Z_NEED_DICT       2  */
    "stream end", /* Z_STREAM_END      1  */
    "", /* Z_OK              0  */
    "file error", /* Z_ERRNO         (-1) */
    "stream error", /* Z_STREAM_ERROR  (-2) */
    "data error", /* Z_DATA_ERROR    (-3) */
    "insufficient memory", /* Z_MEM_ERROR     (-4) */
    "buffer error", /* Z_BUF_ERROR     (-5) */
    "incompatible version", /* Z_VERSION_ERROR (-6) */
    ""
];
export function zlibVersion() {
    return ZLIB_VERSION;
}
export function zError(err) {
    const index = 2 - err;
    if (index >= 0 && index < z_errmsg.length) {
        return z_errmsg[index];
    }
    return "unknown error";
}
export function zmemcpy(dest, source, len) {
    if (len === 0)
        return;
    const copyLen = Math.min(len, dest.length, source.length);
    for (let i = 0; i < copyLen; i++) {
        dest[i] = source[i];
    }
}
export function zmemcmp(s1, s2, len) {
    const compareLen = Math.min(len, s1.length, s2.length);
    for (let j = 0; j < compareLen; j++) {
        if (s1[j] !== s2[j]) {
            return s1[j] > s2[j] ? 1 : -1;
        }
    }
    return 0;
}
export function zmemzero(dest, len) {
    if (len === 0)
        return;
    const zeroLen = Math.min(len, dest.length);
    for (let i = 0; i < zeroLen; i++) {
        dest[i] = 0;
    }
}
export function zcalloc(_opaque, items, size) {
    return new Uint8Array(items * size);
}
export function zcfree(_opaque, _ptr) {
    // JavaScript garbage collection handles this
}
//# sourceMappingURL=zutil.js.map