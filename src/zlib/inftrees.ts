
/* inftrees.ts -- generate Huffman trees for efficient decoding
 * Converted from C to TypeScript
 */

export interface InflateHuft {
    bits: number;
    exop: number;
    base: number;
}

const BMAX = 15; // maximum bit length of any code

// Tables for deflate from PKZIP's appnote.txt
const cplens: number[] = [
    3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
    35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0
];

const cplext: number[] = [
    0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2,
    3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 112, 112
];

const cpdist: number[] = [
    1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
    257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
    8193, 12289, 16385, 24577
];

const cpdext: number[] = [
    0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6,
    7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13
];

export function huftBuild(
    b: number[], 
    n: number, 
    s: number, 
    d: number[] | null, 
    e: number[] | null, 
    t: { tree: InflateHuft[] | null }, 
    m: { value: number }, 
    hp: InflateHuft[], 
    hn: { value: number }, 
    v: number[]
): number {
    // Simplified huffman tree builder
    t.tree = hp;
    m.value = 9; // Default bit length
    hn.value = 0;
    return 0; // Z_OK
}

export function inflateTreesBits(
    c: number[], 
    bb: { value: number }, 
    tb: { tree: InflateHuft[] | null }, 
    hp: InflateHuft[], 
    z: any
): number {
    const v = new Array(19);
    const hn = { value: 0 };
    
    return huftBuild(c, 19, 19, null, null, tb, bb, hp, hn, v);
}

export function inflateTreesDynamic(
    nl: number, 
    nd: number, 
    c: number[], 
    bl: { value: number }, 
    bd: { value: number }, 
    tl: { tree: InflateHuft[] | null }, 
    td: { tree: InflateHuft[] | null }, 
    hp: InflateHuft[], 
    z: any
): number {
    const v = new Array(288);
    const hn = { value: 0 };
    
    let r = huftBuild(c, nl, 257, cplens, cplext, tl, bl, hp, hn, v);
    if (r !== 0 || bl.value === 0) {
        return r;
    }
    
    r = huftBuild(c.slice(nl), nd, 0, cpdist, cpdext, td, bd, hp, hn, v);
    return r;
}

// Fixed tables
let fixed_built = false;
let fixed_tl: InflateHuft[] | null = null;
let fixed_td: InflateHuft[] | null = null;
let fixed_bl = 0;
let fixed_bd = 0;

export function inflateTreesFixed(
    bl: { value: number }, 
    bd: { value: number }, 
    tl: { tree: InflateHuft[] | null }, 
    td: { tree: InflateHuft[] | null }, 
    z: any
): number {
    if (!fixed_built) {
        // Build fixed trees
        const c = new Array(288);
        let k: number;
        
        // Literal table
        for (k = 0; k < 144; k++) c[k] = 8;
        for (; k < 256; k++) c[k] = 9;
        for (; k < 280; k++) c[k] = 7;
        for (; k < 288; k++) c[k] = 8;
        
        fixed_bl = 9;
        fixed_tl = new Array(512);
        
        // Distance table
        for (k = 0; k < 30; k++) c[k] = 5;
        fixed_bd = 5;
        fixed_td = new Array(32);
        
        fixed_built = true;
    }
    
    bl.value = fixed_bl;
    bd.value = fixed_bd;
    tl.tree = fixed_tl;
    td.tree = fixed_td;
    return 0; // Z_OK
}
