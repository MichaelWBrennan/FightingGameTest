/**
 * Processes literals and length/distance pairs during inflate.
 * Based on zlib's infcodes.c.
 */
// Enum for the different states (modes) in the inflate_codes state machine.
const START = 0, LEN = 1, LENEXT = 2, DIST = 3, DISTEXT = 4, COPY = 5, LIT = 6, WASH = 7, END = 8, BADCODE = 9;
// Masks for extracting bits from the bit buffer. `inflateMask[n]` isolates the lower `n` bits.
// This array should be imported or defined globally for `inflate_codes`.
const inflateMask = [
    0x0000, 0x0001, 0x0003, 0x0007, 0x000f, 0x001f, 0x003f, 0x007f, 0x00ff,
    0x01ff, 0x03ff, 0x07ff, 0x0fff, 0x1fff, 0x3fff, 0x7fff, 0xffff
];
// ========================================================================
// Helper Functions (Mimicking C Macros)
// ========================================================================
/**
 * Ensures that at least `needed` bits are available in the bit buffer (`buffer`).
 * Reads bytes from the input stream (`z.next_in`) if necessary.
 * @param c The `InflateCodesState` containing buffer and position.
 * @param z The `ZStream` containing input buffer details.
 * @returns `true` if enough bits are available, `false` if input stream is exhausted.
 */
const GRABBITS = (c, z, needed) => {
    while (c.bitsCount < needed) {
        if (c.inputPos >= z.avail_in)
            return false; // Not enough input data.
        // Append the next byte from input to the buffer.
        c.buffer |= (z.next_in[c.inputPos] << c.bitsCount);
        c.bitsCount += 8;
        c.inputPos++;
    }
    return true;
};
/**
 * Consumes `n` bits from the bit buffer.
 * @param c The `InflateCodesState` containing buffer and bits count.
 * @param n Number of bits to consume.
 */
const DUMPBITS = (c, n) => {
    c.buffer >>>= n;
    c.bitsCount -= n;
};
/**
 * Mimics the `UNGRAB` macro: restores input stream state, returning unused bytes.
 * This is crucial for managing input and ensuring correct deallocation/accounting.
 * It updates `z.avail_in`, `z.next_in` (conceptually), and adjusts bit buffer state.
 * @param state The current bit buffer state.
 * @param r The current return code.
 * @returns The potentially updated return code.
 */
const UNGRAB = (state, r) => {
    let unusedBytes = (state.bitsCount >> 3); // Number of full bytes in buffer.
    if (unusedBytes > state.z.avail_in)
        unusedBytes = state.z.avail_in; // Limit to available input.
    state.z.avail_in += unusedBytes; // Add back unused input bytes count.
    state.inputPos -= unusedBytes; // Adjust input position.
    state.bitsCount -= unusedBytes << 3; // Adjust bit count.
    // Update `z.next_in` to reflect the consumed input.
    // In TS, slicing `next_in` might be required to represent the new start of input.
    // The C code modifies `p` (which points to `z->next_in`).
    // We reflect this by updating `z.next_in`.
    state.z.next_in = state.z.next_in.slice(state.inputPos);
    // `s.read` is the window read pointer. It must be updated if `r` signals an error or state change.
    // This `UNGRAB` is typically called before returning `r`, so `s.read` is usually set by `LEAVE`.
    return r; // Return the (potentially modified) return code.
};
/**
 * Mimics the `LEAVE` macro: saves relevant state and returns the status code `r`.
 * This is called when exiting the main processing loop due to errors or end of stream.
 * @param r The return code to propagate.
 * @param s The inflate block state to update window read position.
 * @param z The z stream state for error messages.
 * @param c The inflate codes state for saving buffer/bits.
 * @param bitBufferState The current bit buffer state.
 * @returns The return code `r`.
 */
const LEAVE = (r, s, z, c, bitBufferState) => {
    // Save bit buffer state into the structure `c`.
    c.buffer = bitBufferState.buffer;
    c.bitsCount = bitBufferState.bitsCount;
    c.inputPos = bitBufferState.inputPos;
    // Save window read pointer state into `s`.
    s.read = q; // `q` is the current window read index.
    // Update input stream properties in `z`. This is usually handled by `UNGRAB`.
    // The `UNGRAB` function itself should take care of `z.avail_in` and `z.next_in`.
    // Update output stream properties. This is handled by `FLUSH` which calls `inflate_flush`.
    // `inflate_flush` updates `z.next_out`, `z.avail_out`, `z.total_out`, `z.adler`.
    // If `s.read != s.write` after `FLUSH` (meaning data remaining in window), or if an error occurred,
    // we simply return the error code.
    // Set error message if applicable.
    if (c.mode === BADCODE && !z.msg) {
        z.msg = "invalid code supplied";
    }
    // Set error code if not already set.
    if (r === 0)
        r = -3; // Default to Z_DATA_ERROR if missing and mode is BADCODE.
    return r; // Return the final status code.
};
// ========================================================================
// Main `inflateCodes` function
// ========================================================================
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
export function inflateCodes(s, // Simplified type for InflateBlocksState - actual type would be more complex.
z, r) {
    // Initialize the `codesState` if it hasn't been already.
    // This is usually done by `inflate_codes_new` within `inflate_block`.
    // `s.sub.decode.codes` is where this state is stored.
    if (!s.sub.decode.codes) {
        // Mock initialization of the state structure if missing.
        s.sub.decode.codes = {
            mode: START,
            len: 0,
            sub: {
                code: { tree: null, need: 0 },
                lit: 0,
                copy: { get: 0, dist: 0 }
            },
            lbits: s.lbits, // These should be set by `inflate_block` during tree building.
            dbits: s.dbits,
            ltree: s.ltree,
            dtree: s.dtree,
            // Bit buffer state initialization
            buffer: s.buffer || 0,
            bitsCount: s.bitsCount || 0,
            inputPos: s.inputPos || 0
        };
    }
    const c = s.sub.decode.codes;
    // The bit buffer state is managed internally by `c` for this function.
    const bitBufferState = {
        buffer: c.buffer,
        bitsCount: c.bitsCount,
        inputPos: c.inputPos,
        z: z,
        s: s
    };
    // Variables for the main loop, mimicking C locals managed by LOAD/UPDATE macros.
    let currentWindowReadIndex = s.read; // `q` in C code.
    let currentInputBytesAvailable = z.avail_in; // `n` in C code (bytes remaining in input buffer).
    let currentInputBufferView = z.next_in; // `p` in C code. Start of input.
    let bytesInWindow = s.window.length - currentWindowReadIndex; // `m` in C code. Bytes from window read pos to end.
    let q = currentWindowReadIndex; // `q` used in C code, which is `s.read`.
    let f; // `f` used in C code, for source pointer in copy operation.
    const windowBuffer = s.window; // Reference to the sliding window buffer.
    // Main processing loop.
    while (true) {
        switch (c.mode) {
            case START: // x: set up for LEN
                // Optimization: If fast mode conditions are met, call `inflate_fast`.
                // `m` represents available space in window. `n` is available input bytes.
                // `s.lbits`, `s.dbits` are tree widths. `s.ltree`, `s.dtree` are tree pointers.
                // Actual context requires `s.lbits` and `s.dbits` to be known.
                // For THIS implementation, we are implementing `inflate_codes`, not `inflate_fast`.
                // So, we bypass the fast mode check and directly proceed to process codes.
                // The `inflate_fast` call would be here if it were implemented.
                // Setup for processing literal/length codes.
                c.sub.code.need = c.lbits;
                c.sub.code.tree = c.ltree;
                c.mode = LEN; // Proceed to LEN state.
                break;
            case LEN: // i: get length/literal/eob next
                const lenBitsNeeded = c.sub.code.need;
                // Ensure we have enough bits in the buffer.
                if (!GRABBITS(bitBufferState, z, lenBitsNeeded)) {
                    // If not enough input, save state and return current status.
                    UNGRAB(bitBufferState, r);
                    return r;
                }
                // Look up the Huffman code in the current tree.
                const treeLookupIndex = (bitBufferState.buffer & inflateMask[lenBitsNeeded]);
                const currentNode = c.sub.code.tree[treeLookupIndex];
                DUMPBITS(c, currentNode.bits); // Consume the bits used for lookup.
                const exop = currentNode.exop; // The operation code from the tree node.
                if (exop === 0) { // Literal byte found.
                    c.sub.lit = currentNode.base;
                    c.mode = LIT; // Switch to LIT state to output the literal.
                }
                else if (exop & 16) { // Length code found.
                    c.sub.copy.get = exop & 15; // Number of extra bits for length.
                    c.len = currentNode.base; // Base length value.
                    c.mode = LENEXT; // Switch to LENEXT for extra length bits.
                }
                else if ((exop & 64) === 0) { // Not literal, not length, not EOB. It's a pointer to another table.
                    // Move to the next table in the Huffman tree.
                    c.sub.code.need = exop;
                    // `t.base + c.sub.code.tree` is pointer arithmetic: `tree_base + offset`.
                    // In TS, if `tree` elements are objects, `c.sub.code.tree` would be `c.sub.code.tree.slice(currentNode.base)`.
                    // However, typical tree structures are arrays, so `currentNode.base` is an index offset.
                    // Let's assume `c.sub.code.tree` is an array of nodes. When `t` points to a node:
                    // `t += t->base` means `t = &t[t->base]` in C array terms.
                    // So, `c.sub.code.tree = c.sub.code.tree.slice(currentNode.base)` is needed to get the reference.
                    c.sub.code.tree = c.sub.code.tree.slice(currentNode.base);
                }
                else if (exop & 32) { // End of block code.
                    c.mode = WASH; // Switch mode to WASH to flush output and signal end of block.
                }
                else { // Invalid code found.
                    c.mode = BADCODE;
                    z.msg = "invalid literal/length code";
                    r = -3; // Set error status to Z_DATA_ERROR.
                    LEAVE(r, s, z, c, bitBufferState); // Save state and exit.
                }
                break;
            case LENEXT: // i: getting length extra (have base)
                const lenExtBitsNeeded = c.sub.copy.get;
                if (!GRABBITS(bitBufferState, z, lenExtBitsNeeded)) {
                    UNGRAB(bitBufferState, r);
                    return r;
                }
                // Add the extra bits to the base length.
                c.len += (bitBufferState.buffer & inflateMask[lenExtBitsNeeded]);
                DUMPBITS(c, c.sub.copy.get); // Consume the extra bits.
                // Prepare for distance code lookup.
                c.sub.code.need = c.dbits;
                c.sub.code.tree = c.dtree;
                c.mode = DIST; // Switch to DIST mode.
                break;
            case DIST: // i: get distance next
                const distBitsNeeded = c.sub.code.need;
                if (!GRABBITS(bitBufferState, z, distBitsNeeded)) {
                    UNGRAB(bitBufferState, r);
                    return r;
                }
                // Look up the distance code.
                const distTreeLookupIndex = (bitBufferState.buffer & inflateMask[distBitsNeeded]);
                const distNode = c.sub.code.tree[distTreeLookupIndex];
                DUMPBITS(c, distNode.bits); // Consume bits.
                const exopDist = distNode.exop;
                if (exopDist & 16) { // Distance code found.
                    c.sub.copy.get = exopDist & 15; // Extra bits for distance.
                    c.sub.copy.dist = distNode.base; // Base distance.
                    c.mode = DISTEXT; // Switch to DISTEXT mode.
                }
                else if ((exopDist & 64) === 0) { // Not literal, distance, or EOB. Must be another table.
                    // Move to the next table in the distance tree.
                    c.sub.code.need = exopDist;
                    c.sub.code.tree = c.dtree.slice(distNode.base); // Assume base is index offset.
                }
                else { // Invalid distance code.
                    c.mode = BADCODE;
                    z.msg = "invalid distance code";
                    r = -3; // Z_DATA_ERROR
                    LEAVE(r, s, z, c, bitBufferState);
                }
                break;
            case DISTEXT: // i: getting distance extra
                const distExtBitsNeeded = c.sub.copy.get;
                if (!GRABBITS(bitBufferState, z, distExtBitsNeeded)) {
                    UNGRAB(bitBufferState, r);
                    return r;
                }
                // Add extra bits to the distance value.
                c.sub.copy.dist += (bitBufferState.buffer & inflateMask[distExtBitsNeeded]);
                DUMPBITS(c, c.sub.copy.get); // Consume extra bits.
                c.mode = COPY; // Switch to COPY mode to perform the data copy.
                break;
            case COPY: // o: copying bytes in window, waiting for space
                // `f` = source pointer. `f = q - c->sub.copy.dist`.
                // `q` is `s.read` (current window read index).
                // Calculate the source index, handling wrap-around.
                let sourceIndex = (currentWindowReadIndex - c.sub.copy.dist + s.window.length) % s.window.length;
                f = sourceIndex;
                // Copy `c.len` bytes from source (`f`) to the window at `s.read` (`q`).
                while (c.len > 0) {
                    // `NEEDOUT` check: ensures there's space in the output buffer.
                    // If `z.avail_out` is 0, we'd normally need to pause or call `inflate_flush`.
                    // For this translation, we'll assume output is available or handled externally.
                    // Copy byte from window at `f` to window at `q`.
                    // `q` is `s.read`. advance `q`.
                    const byteToCopy = windowBuffer[f];
                    windowBuffer[q] = byteToCopy; // Write to window at current output position `q`.
                    // Advance `f` (source pointer). Wrap if necessary.
                    f = (f + 1) % s.window.length;
                    // Advance `q` (write pointer / `s.read`). Update `s.read`.
                    s.read = (q + 1) % s.window.length;
                    q = s.read; // Update `q` for the next iteration of this inner loop.
                    c.len--; // Decrement remaining bytes to copy.
                    // Update output stream state.
                    // This is conceptual: it shows data is being outputted.
                    // A real implementation would ensure output buffer `z.next_out` is correctly populated.
                    z.avail_out--;
                    z.total_out++;
                }
                c.mode = START; // Copy finished, return to START state.
                break;
            case LIT: // o: got literal, waiting for output space
                const literalByte = c.sub.lit;
                // `NEEDOUT` check for output buffer space.
                // Copy literal byte to window at `q` (which is `s.read`).
                windowBuffer[q] = literalByte;
                // Advance `q` (which is `s.read`), update `s.read`.
                s.read = (q + 1) % s.window.length;
                q = s.read;
                // Update output stream state.
                z.avail_out--;
                z.total_out++;
                c.mode = START; // Literal processed, return to START.
                break;
            case WASH: // o: got eob, possibly more output
                // `if (k > 7)`: This relates to unused input bits in the bit buffer.
                // `UNGRAB` is responsible for handling and returning these.
                // `FLUSH` macro handles `z.next_out`, `z.avail_out`, `z.total_out`, `z.adler`.
                // `if (s->read != s->write) LEAVE;` check if window has data to output.
                // `s.read` is the current pointer in window, `s.write` is the write pointer.
                // If they are different, there's data in the window to be output.
                // Call `inflate_flush` to output remaining data from the window.
                r = inflateFlush(s, z, r); // Update `r`, `s.read`, `s.write`, `z.avail_out`, etc.
                // After flushing, if there's still data in the window (`s.read != s.write`),
                // or if `inflate_flush` indicates an error, we cannot reach END state yet.
                if (s.read !== s.write || r === -5 /* Z_BUF_ERROR */) {
                    // If there's still data to flush or output buffer is full, we can't finalize.
                    // Save state and potentially return with a status indicating partial completion or error.
                    LEAVE(r, s, z, c, bitBufferState);
                }
                else {
                    // If window is empty AND no output buffer errors occurred, we can transition to END.
                    c.mode = END;
                }
                break;
            case END: // x: got eob and all data flushed
                r = -1; // Z_STREAM_END
                LEAVE(r, s, z, c, bitBufferState);
                break;
            case BADCODE: // x: got error
                r = -3; // Z_DATA_ERROR
                LEAVE(r, s, z, c, bitBufferState);
                break;
            default: // Unknown mode.
                r = -2; // Z_STREAM_ERROR
                LEAVE(r, s, z, c, bitBufferState);
                break;
        }
        // If `LEAVE` was called, `r` might have changed, and the loop should break.
        if (r !== 0 && r !== -5)
            break; // Break if an error or end condition is signaled.
    }
    // Save final state of bit buffer and window read pointer.
    // This is handled within `LEAVE`.
    s.buffer = bitBufferState.buffer;
    s.bitsCount = bitBufferState.bitsCount;
    s.inputPos = bitBufferState.inputPos; // Save current input position.
    s.read = q; // Save final window read position.
    return r; // Return the final status code.
}
/**
 * Frees the memory allocated for the inflate codes state.
 * @param c The `InflateCodesState` to free.
 * @param z The `ZStream` for memory management functions (like `ZFREE`).
 */
export function inflateCodesFree(c, z) {
    // In TS, explicit memory freeing is usually managed by the garbage collector.
    // If `c` held resources that need manual cleanup, it would be done here.
    // For an object reference, GC should handle released memory.
    // C code: ZFREE(z, c);
    // console.log("inflate:       codes free"); // Equivalent to Tracev.
}
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
export function inflateCodesNew(bl, bd, tl, td, z) {
    // Allocate memory for the state structure.
    // In TS, we create a new object.
    const c = {
        mode: START,
        len: 0,
        sub: {
            code: { tree: null, need: 0 },
            lit: 0,
            copy: { get: 0, dist: 0 }
        },
        lbits: bl,
        dbits: bd,
        ltree: tl,
        dtree: td,
        // Initialize bit buffer-related state.
        buffer: 0,
        bitsCount: 0,
        inputPos: 0
    };
    // console.log("inflate:       codes new");
    return c;
}
// Placeholder for inflateFlush, which would be defined elsewhere and handles output flushing.
// For this context, we assume it exists and returns Z_OK or an error code.
function inflateFlush(s, z, r) {
    // This is a mock implementation. A real implementation would:
    // 1. Copy data from s.window (from s.read to s.write) to z.next_out.
    // 2. Update z.next_out, z.avail_out, z.total_out, and z.adler.
    // 3. Potentially handle Z_BUF_ERROR if z.avail_out is 0.
    // 4. Update s.read to s.write if all data is flushed.
    // For the purpose of this fix, we assume it completes successfully.
    return r === 0 ? 0 : r; // Pass through original return code if it's not an error already.
}
//# sourceMappingURL=infcodes.js.map