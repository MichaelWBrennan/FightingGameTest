/* trees.ts -- output deflated data using Huffman coding
 * Converted from C to TypeScript
 */
const MAX_BITS = 15;
const BL_CODES = 19;
const D_CODES = 30;
const LITERALS = 256;
const L_CODES = LITERALS + 1 + 29;
const LENGTH_CODES = 29;
const HEAP_SIZE = 2 * L_CODES + 1;
const extra_lbits = [
    0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0
];
const extra_dbits = [
    0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13
];
const extra_blbits = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7
];
export function _tr_init(s) {
    s.l_desc.dyn_tree = s.dyn_ltree;
    s.d_desc.dyn_tree = s.dyn_dtree;
    s.bl_desc.dyn_tree = s.bl_tree;
    s.bi_buf = 0;
    s.bi_valid = 0;
    s.last_eob_len = 8;
    initBlock(s);
}
function initBlock(s) {
    // Initialize the trees
    for (let n = 0; n < L_CODES; n++)
        s.dyn_ltree[n].freq = 0;
    for (let n = 0; n < D_CODES; n++)
        s.dyn_dtree[n].freq = 0;
    for (let n = 0; n < BL_CODES; n++)
        s.bl_tree[n].freq = 0;
    s.dyn_ltree[256].freq = 1; // END_BLOCK
    s.opt_len = s.static_len = 0;
    s.last_lit = s.matches = 0;
}
export function _tr_tally(s, dist, lc) {
    s.d_buf[s.last_lit] = dist;
    s.l_buf[s.last_lit++] = lc;
    if (s.dyn_ltree && s.dyn_ltree[lc]) {
        s.dyn_ltree[lc].freq++;
    }
    if (dist !== 0) {
        s.last_lit++;
        if (s.dyn_ltree && s.dyn_ltree[lengthCode(lc) + LITERALS + 1]) {
            s.dyn_ltree[lengthCode(lc) + LITERALS + 1].freq++;
        }
        if (s.dyn_dtree && s.dyn_dtree[dCode(dist)]) {
            s.dyn_dtree[dCode(dist)].freq++;
        }
    }
    return (s.last_lit === s.lit_bufsize - 1);
}
function lengthCode(len) {
    return len < 256 ? len : 256 + ((len >>> 7) & 0xff);
}
function dCode(dist) {
    return dist < 256 ? dist : 256 + ((dist >>> 7) & 0xff);
}
export function _tr_flush_block(s, buf, stored_len, eof) {
    // Simplified implementation
    s.compressed_len += stored_len * 8;
    initBlock(s);
}
export function _tr_stored_block(s, buf, stored_len, eof) {
    // Send block type and store the block
    s.compressed_len += (stored_len + 4) * 8;
}
export function _tr_align(s) {
    // Send alignment bits
    s.compressed_len += 10;
}
//# sourceMappingURL=trees.js.map