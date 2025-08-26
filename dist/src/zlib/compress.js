/* compress.ts -- compress a memory buffer
 * Converted from C to TypeScript
 */
import { deflateInit, deflate, deflateEnd, Z_OK, Z_STREAM_END, Z_BUF_ERROR, Z_DEFAULT_COMPRESSION, Z_FINISH } from './deflate';
export function compress2(dest, destLen, source, sourceLen, level) {
    const stream = {
        next_in: source,
        avail_in: sourceLen,
        next_out: dest,
        avail_out: destLen.value,
        total_in: 0,
        total_out: 0,
        zalloc: null,
        zfree: null,
        opaque: null
    };
    if (stream.avail_out !== destLen.value)
        return Z_BUF_ERROR;
    let err = deflateInit(stream, level);
    if (err !== Z_OK)
        return err;
    err = deflate(stream, Z_FINISH);
    if (err !== Z_STREAM_END) {
        deflateEnd(stream);
        return err === Z_OK ? Z_BUF_ERROR : err;
    }
    destLen.value = stream.total_out;
    err = deflateEnd(stream);
    return err;
}
export function compress(dest, destLen, source, sourceLen) {
    return compress2(dest, destLen, source, sourceLen, Z_DEFAULT_COMPRESSION);
}
//# sourceMappingURL=compress.js.map