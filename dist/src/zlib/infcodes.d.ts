/**
 * Processes literals and length/distance pairs during inflate.
 * Based on zlib's infcodes.c.
 */
/**
 * Represents the state of the zlib stream (input/output).
 * Corresponds to `z_stream` in C.
 */
interface ZStream {
    next_in: Uint8Array;
    avail_in: number;
    next_out: Uint8Array;
    avail_out: number;
    total_out: number;
    adler: number;
    msg?: string;
}
/**
 * Represents the state of the inflate codes processing.
 * Corresponds to `struct inflate_codes_state` in C.
 */
interface InflateCodesState {
    mode: number;
    len: number;
    sub: {
        code: {
            tree: HuffmanTreeType[] | null;
            need: number;
        };
        lit: number;
        copy: {
            get: number;
            dist: number;
        };
    };
    lbits: number;
    dbits: number;
    ltree: HuffmanTreeType[] | null;
    dtree: HuffmanTreeType[] | null;
}
/**
 * A simplified representation of a Huffman tree node.
 * Corresponds to `inflate_huft` in C.
 */
type HuffmanTreeType = {
    bits: number;
    exop: number;
    base: number;
};
/**
 * Core function to process literals, lengths, and distances during decompression.
 * It drives the state machine according to the Huffman codes found in the input stream.
 * Handles literals, length/distance pairs, end-of-block signals, and errors.
 *
 * @param s The `InflateBlocksState` containing window buffer and related state.
 * @param z The `ZStream` state for input/output buffer management.
 * @param r The initial return code.
 * @returns The final status code of the operation (e.g., Z_OK, Z_STREAM_END, Z_DATA_ERROR).
 */
export declare function inflateCodes(s: any, // Simplified type for InflateBlocksState - actual type would be more complex.
z: ZStream, r: number): number;
/**
 * Frees the memory allocated for the inflate codes state.
 * @param c The `InflateCodesState` to free.
 * @param z The `ZStream` for memory management functions (like `ZFREE`).
 */
export declare function inflateCodesFree(c: any, z: ZStream): void;
/**
 * `inflate_codes_new`: Creates and initializes the inflate codes state.
 * This is called by `inflate_block` after Huffman trees are built.
 * It takes the tree structures and their associated bit widths (`bl`, `bd`).
 *
 * @param bl Literal/length tree bits.
 * @param bd Distance tree bits.
 * @param tl Literal/length Huffman tree.
 * @param td Distance Huffman tree.
 * @param z The ZStream reference.
 * @returns A new `InflateCodesState` object, or null if memory allocation fails.
 */
export declare function inflateCodesNew(bl: number, bd: number, tl: HuffmanTreeType[] | null, td: HuffmanTreeType[] | null, z: ZStream): InflateCodesState | null;
export {};
