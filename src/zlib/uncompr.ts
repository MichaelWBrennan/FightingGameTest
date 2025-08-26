
/* uncompr.ts -- decompress a memory buffer
 * Converted from C to TypeScript
 */

import { inflateInit, inflate, inflateEnd, Z_OK, Z_STREAM_END, Z_BUF_ERROR, Z_FINISH } from './inflate';

interface ZStream {
    next_in: Uint8Array;
    avail_in: number;
    total_in: number;
    next_out: Uint8Array;
    avail_out: number;
    total_out: number;
    msg?: string;
    state?: any;
    zalloc?: any;
    zfree?: any;
    opaque?: any;
}

export function uncompress(dest: Uint8Array, destLen: { value: number }, source: Uint8Array, sourceLen: number): number {
    const stream: ZStream = {
        next_in: source,
        avail_in: sourceLen,
        next_out: dest,
        avail_out: destLen.value,
        total_in: 0,
        total_out: 0,
        zalloc: null,
        zfree: null
    };

    if (stream.avail_in !== sourceLen) return Z_BUF_ERROR;
    if (stream.avail_out !== destLen.value) return Z_BUF_ERROR;

    let err = inflateInit(stream);
    if (err !== Z_OK) return err;

    err = inflate(stream, Z_FINISH);
    if (err !== Z_STREAM_END) {
        inflateEnd(stream);
        return err === Z_OK ? Z_BUF_ERROR : err;
    }
    destLen.value = stream.total_out;

    err = inflateEnd(stream);
    return err;
}
