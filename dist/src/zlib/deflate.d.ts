export declare const Z_OK = 0;
export declare const Z_STREAM_END = 1;
export declare const Z_NEED_DICT = 2;
export declare const Z_ERRNO = -1;
export declare const Z_STREAM_ERROR = -2;
export declare const Z_DATA_ERROR = -3;
export declare const Z_MEM_ERROR = -4;
export declare const Z_BUF_ERROR = -5;
export declare const Z_VERSION_ERROR = -6;
export declare const Z_NO_FLUSH = 0;
export declare const Z_PARTIAL_FLUSH = 1;
export declare const Z_SYNC_FLUSH = 2;
export declare const Z_FULL_FLUSH = 3;
export declare const Z_FINISH = 4;
export declare const Z_DEFAULT_COMPRESSION = -1;
export declare const Z_BEST_SPEED = 1;
export declare const Z_BEST_COMPRESSION = 9;
interface ZStream {
    next_in: Uint8Array;
    avail_in: number;
    total_in: number;
    next_out: Uint8Array;
    avail_out: number;
    total_out: number;
    msg?: string;
    state?: DeflateState;
    zalloc?: any;
    zfree?: any;
    opaque?: any;
}
interface DeflateState {
    status: number;
    level: number;
    method: number;
    wrap: number;
    gzhead?: any;
    pending: number;
    pending_buf: Uint8Array;
    pending_buf_size: number;
    pending_out: number;
    wrap_pending: boolean;
    data_type: number;
    adler: number;
    gzindex: number;
}
export declare function deflateInit(strm: ZStream, level: number): number;
export declare function deflateInit2(strm: ZStream, level: number, method: number, windowBits: number, memLevel: number, strategy: number): number;
export declare function deflate(strm: ZStream, flush: number): number;
export declare function deflateEnd(strm: ZStream): number;
export {};
//# sourceMappingURL=deflate.d.ts.map