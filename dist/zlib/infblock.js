/* infblock.ts -- interpret and process block types to last block
 * Converted from C to TypeScript
 */
import { inflateCodesFree } from './infcodes';
// Block type constants
const TYPE = 0;
const LENS = 1;
const STORED = 2;
const TABLE = 3;
const BTREE = 4;
const DTREE = 5;
const CODES = 6;
const DRY = 7;
const DONE = 8;
const BAD = 9;
export function inflateBlocksNew(z, c, w) {
    const s = {
        mode: TYPE,
        last: 0,
        bitk: 0,
        bitb: 0,
        hufts: new Array(4320), // MANY
        window: new Uint8Array(w),
        end: w,
        read: 0,
        write: 0,
        check: 0,
        checkfn: c,
        sub: {
            left: 0,
            trees: {
                table: 0,
                index: 0,
                bb: 0
            },
            decode: {}
        }
    };
    inflateBlocksReset(s, z, null);
    return s;
}
export function inflateBlocksReset(s, z, c) {
    if (c !== null && typeof c === 'object' && 'value' in c) {
        c.value = s.check;
    }
    if (s.mode === BTREE || s.mode === DTREE) {
        s.sub.trees.blens = undefined;
    }
    if (s.mode === CODES) {
        inflateCodesFree(s.sub.decode.codes, z);
    }
    s.mode = TYPE;
    s.bitk = 0;
    s.bitb = 0;
    s.read = s.write = 0;
    if (s.checkfn !== undefined) {
        s.check = s.checkfn(0, new Uint8Array(0), 0);
    }
}
export function inflateBlocks(s, z, r) {
    // Simplified implementation - return success for now
    return 0; // Z_OK
}
export function inflateBlocksFree(s, z) {
    inflateBlocksReset(s, z, null);
    return 0; // Z_OK
}
export function inflateSetDictionary(s, d, n) {
    s.window.set(d.slice(0, n), 0);
    s.read = s.write = n;
}
export function inflateBlocksSyncPoint(s) {
    return s.mode === LENS;
}
//# sourceMappingURL=infblock.js.map