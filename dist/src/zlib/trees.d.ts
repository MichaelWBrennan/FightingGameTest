export interface CtData {
    freq: number;
    code: number;
    dad: number;
    len: number;
}
export interface TreeDesc {
    dyn_tree: CtData[];
    max_code: number;
    stat_desc: StaticTreeDesc;
}
export interface StaticTreeDesc {
    static_tree: CtData[] | null;
    extra_bits: number[] | null;
    extra_base: number;
    elems: number;
    max_length: number;
}
export interface DeflateState {
    dyn_ltree: CtData[];
    dyn_dtree: CtData[];
    bl_tree: CtData[];
    l_desc: TreeDesc;
    d_desc: TreeDesc;
    bl_desc: TreeDesc;
    bl_count: number[];
    heap: number[];
    heap_len: number;
    heap_max: number;
    depth: number[];
    l_buf: Uint8Array;
    lit_bufsize: number;
    last_lit: number;
    d_buf: Uint16Array;
    opt_len: number;
    static_len: number;
    matches: number;
    last_eob_len: number;
    bi_buf: number;
    bi_valid: number;
    pending_buf: Uint8Array;
    pending: number;
    pending_out: number;
    data_type: number;
    method: number;
    bits_sent: number;
    compressed_len: number;
}
export declare function _tr_init(s: DeflateState): void;
export declare function _tr_tally(s: DeflateState, dist: number, lc: number): boolean;
export declare function _tr_flush_block(s: DeflateState, buf: Uint8Array | null, stored_len: number, eof: boolean): void;
export declare function _tr_stored_block(s: DeflateState, buf: Uint8Array | null, stored_len: number, eof: boolean): void;
export declare function _tr_align(s: DeflateState): void;
//# sourceMappingURL=trees.d.ts.map