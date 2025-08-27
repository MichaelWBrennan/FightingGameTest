/**
 * Inflate decompression algorithm
 * Converted from C to TypeScript with proper exports
 */
export declare const Z_OK = 0;
export declare const Z_STREAM_END = 1;
export declare const Z_NEED_DICT = 2;
export declare const Z_ERRNO = -1;
export declare const Z_STREAM_ERROR = -2;
export declare const Z_DATA_ERROR = -3;
export declare const Z_MEM_ERROR = -4;
export declare const Z_BUF_ERROR = -5;
export declare const Z_VERSION_ERROR = -6;
export declare const Z_FINISH = 4;
export interface ZStream {
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
export declare function inflateInit(stream: ZStream): number;
export declare function inflate(stream: ZStream, flush: number): number;
export declare function inflateEnd(stream: ZStream): number;
