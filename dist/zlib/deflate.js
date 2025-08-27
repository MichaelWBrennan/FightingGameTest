/* deflate.ts -- compress data using the deflation algorithm
 * Converted from C to TypeScript
 */
export const Z_OK = 0;
export const Z_STREAM_END = 1;
export const Z_NEED_DICT = 2;
export const Z_ERRNO = -1;
export const Z_STREAM_ERROR = -2;
export const Z_DATA_ERROR = -3;
export const Z_MEM_ERROR = -4;
export const Z_BUF_ERROR = -5;
export const Z_VERSION_ERROR = -6;
export const Z_NO_FLUSH = 0;
export const Z_PARTIAL_FLUSH = 1;
export const Z_SYNC_FLUSH = 2;
export const Z_FULL_FLUSH = 3;
export const Z_FINISH = 4;
export const Z_DEFAULT_COMPRESSION = -1;
export const Z_BEST_SPEED = 1;
export const Z_BEST_COMPRESSION = 9;
const DEF_WBITS = 15;
const DEF_MEM_LEVEL = 8;
export function deflateInit(strm, level) {
    return deflateInit2(strm, level, 8, DEF_WBITS, DEF_MEM_LEVEL, 0);
}
export function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
    if (!strm)
        return Z_STREAM_ERROR;
    // Create a minimal deflate state
    const state = {
        status: 0,
        level: level === Z_DEFAULT_COMPRESSION ? 6 : level,
        method: method,
        wrap: windowBits < 0 ? 0 : 1,
        pending: 0,
        pending_buf: new Uint8Array(65536),
        pending_buf_size: 65536,
        pending_out: 0,
        wrap_pending: false,
        data_type: 0,
        adler: 1,
        gzindex: 0
    };
    strm.state = state;
    strm.total_in = strm.total_out = 0;
    strm.msg = undefined;
    return Z_OK;
}
export function deflate(strm, flush) {
    if (!strm || !strm.state)
        return Z_STREAM_ERROR;
    // Simplified deflate implementation - just copy input to output
    const state = strm.state;
    const input = strm.next_in;
    const output = strm.next_out;
    let have = strm.avail_in;
    let left = strm.avail_out;
    const copy = Math.min(have, left);
    if (copy > 0) {
        for (let i = 0; i < copy; i++) {
            output[strm.total_out + i] = input[strm.total_in + i];
        }
        strm.total_in += copy;
        strm.total_out += copy;
        strm.avail_in -= copy;
        strm.avail_out -= copy;
    }
    if (flush === Z_FINISH && strm.avail_in === 0) {
        return Z_STREAM_END;
    }
    return strm.avail_out === 0 ? Z_OK : Z_OK;
}
export function deflateEnd(strm) {
    if (!strm || !strm.state)
        return Z_STREAM_ERROR;
    strm.state = undefined;
    return Z_OK;
}
//# sourceMappingURL=deflate.js.map