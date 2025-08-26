
/**
 * TypeScript definitions for zlib functionality
 * Converted from C header files
 */

export interface ZlibState {
  next_in: Uint8Array | null;
  avail_in: number;
  total_in: number;
  next_out: Uint8Array | null;
  avail_out: number;
  total_out: number;
  msg: string | null;
  state: any;
  zalloc: ((opaque: any, items: number, size: number) => any) | null;
  zfree: ((opaque: any, address: any) => void) | null;
  opaque: any;
  data_type: number;
  adler: number;
  reserved: number;
}

export interface DeflateState {
  strm: ZlibState;
  status: number;
  pending_buf: Uint8Array | null;
  pending_buf_size: number;
  pending_out: number;
  pending: number;
  wrap: number;
  gzhead: any;
  gzindex: number;
  method: number;
  last_flush: number;
  w_size: number;
  w_bits: number;
  w_mask: number;
  window: Uint8Array | null;
  window_size: number;
  prev: Uint16Array | null;
  head: Uint16Array | null;
  ins_h: number;
  hash_size: number;
  hash_bits: number;
  hash_mask: number;
  hash_shift: number;
  block_start: number;
  match_length: number;
  prev_match: number;
  match_available: number;
  strstart: number;
  match_start: number;
  lookahead: number;
  prev_length: number;
  max_chain_length: number;
  max_lazy_match: number;
  level: number;
  strategy: number;
  good_match: number;
  nice_match: number;
  dyn_ltree: Array<{ freq: number; code: number }>;
  dyn_dtree: Array<{ freq: number; code: number }>;
  bl_tree: Array<{ freq: number; code: number }>;
  l_desc: any;
  d_desc: any;
  bl_desc: any;
  bl_count: Uint16Array;
  heap: Int32Array;
  heap_len: number;
  heap_max: number;
  depth: Uint8Array;
  l_buf: Uint8Array;
  lit_bufsize: number;
  last_lit: number;
  d_buf: Uint16Array;
  opt_len: number;
  static_len: number;
  matches: number;
  insert: number;
  bi_buf: number;
  bi_valid: number;
}

export const Z_NO_FLUSH = 0;
export const Z_PARTIAL_FLUSH = 1;
export const Z_SYNC_FLUSH = 2;
export const Z_FULL_FLUSH = 3;
export const Z_FINISH = 4;
export const Z_BLOCK = 5;
export const Z_TREES = 6;

export const Z_OK = 0;
export const Z_STREAM_END = 1;
export const Z_NEED_DICT = 2;
export const Z_ERRNO = -1;
export const Z_STREAM_ERROR = -2;
export const Z_DATA_ERROR = -3;
export const Z_MEM_ERROR = -4;
export const Z_BUF_ERROR = -5;
export const Z_VERSION_ERROR = -6;
