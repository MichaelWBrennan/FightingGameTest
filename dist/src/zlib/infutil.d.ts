/**
 * Utility functions for the inflate process.
 * Based on zlib's infutil.c.
 */
/**
 * Represents the state needed for processing inflate blocks.
 * Contains window buffer, read/write pointers, checksum, etc.
 */
interface InflateBlocksState {
    read: number;
    write: number;
    window: Uint8Array;
    end: number;
    checkfn: ((check: number, buffer: Uint8Array, length: number) => number) | null;
    check: number;
}
/**
 * Represents the state of the zlib stream (input/output).
 * Contains input buffer, output buffer, and remaining counts.
 */
interface ZStream {
    next_out: Uint8Array;
    avail_out: number;
    total_out: number;
    adler: number;
    msg?: string;
}
export declare const inflateMask: number[];
/**
 * Copies as much data as possible from the sliding window to the output area.
 * This function is crucial for flushing decompressed data. It handles the
 * circular nature of the window buffer, copying data from `s.read` towards
 * the logical end of the decompressed data in the window, limited by
 * `z.avail_out`. It also updates checksums and window pointers.
 *
 * @param s The `InflateBlocksState` containing window buffer and related state.
 * @param z The `ZStream` state, containing output buffer and stream information.
 * @param r The current return code from the inflate process.
 * @returns The updated return code, potentially changed from Z_BUF_ERROR to Z_OK if data was copied.
 */
export declare function inflateFlush(s: InflateBlocksState, z: ZStream, r: number): number;
export {};
//# sourceMappingURL=infutil.d.ts.map