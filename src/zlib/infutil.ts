/**
 * Utility functions for the inflate process.
 * Based on zlib's infutil.c.
 */

// Placeholder types for clarity. In a real project, these would be properly defined
// and imported from other modules (e.g., ZStream interface in a core zlib module).

/**
 * Represents the state needed for processing inflate blocks.
 * Contains window buffer, read/write pointers, checksum, etc.
 */
interface InflateBlocksState {
  read: number; // Current read index in the window buffer.
  write: number; // Current write index in the window buffer.
  window: Uint8Array; // The circular buffer for decompression.
  end: number; // The capacity of the window buffer (`window.length`).
  checkfn: ((check: number, buffer: Uint8Array, length: number) => number) | null; // Checksum function to use.
  check: number; // Current checksum value.
  // Other members might be present in a full implementation (e.g., for tree decoding).
}

/**
 * Represents the state of the zlib stream (input/output).
 * Contains input buffer, output buffer, and remaining counts.
 */
interface ZStream {
  next_out: Uint8Array; // Current output buffer view. The function will advance this.
  avail_out: number;    // Number of bytes available in `next_out`.
  total_out: number;    // Total bytes written to `next_out` across all calls.
  adler: number;        // Adler-32 checksum for the output.
  // `msg` property for error reporting.
  msg?: string;
}


// Masks for extracting bits from the input bit buffer.
// `inflateMask[n]` provides a mask for the lower `n` bits.
export const inflateMask: number[] = [
    0x0000,
    0x0001, 0x0003, 0x0007, 0x000f, 0x001f, 0x003f, 0x007f, 0x00ff,
    0x01ff, 0x03ff, 0x07ff, 0x0fff, 0x1fff, 0x3fff, 0x7fff, 0xffff
];

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
export function inflateFlush(
    s: InflateBlocksState,
    z: ZStream,
    r: number
): number {
    let bytesToCopy: number;
    const sourceBuffer = s.window; // The circular window buffer where decompressed data is stored.

    // Calculate available contiguous bytes in the window from the current read position (`s.read`).
    // This accounts for the circular buffer logic where data might wrap around the end.
    if (s.read <= s.write) {
        // If the read pointer is before or at the write pointer, the data segment is contiguous
        // from `s.read` up to `s.write`.
        bytesToCopy = s.write - s.read;
    } else {
        // If the read pointer has wrapped around (is past the write pointer),
        // the available data is in two potential segments:
        // 1. From `s.read` to the end of the buffer (`s.window.length`).
        // 2. From the start of the buffer (`0`) up to `s.write`.
        // The `inflate_flush` C code's `n = (q <= s->write ? s->write : s->end) - q` implies
        // we copy up to the logical end of the data, which is `s.write`.
        // If `q` has wrapped, the count is to the physical end (`s.end`).
        // The number of bytes to copy is from `s.read` up to the logical end of valid data.
        // This is calculated as bytes from `s.read` to `s.window.length`.
        bytesToCopy = s.window.length - s.read;
    }

    // Limit `bytesToCopy` to the amount of space available in the output buffer (`z.avail_out`).
    if (bytesToCopy > z.avail_out) {
        bytesToCopy = z.avail_out;
    }

    // If we successfully copied some bytes (`bytesToCopy > 0`) and the current status `r`
    // was `Z_BUF_ERROR` (indicating output buffer was full), we can now consider the status Z_OK.
    if (bytesToCopy && r === -5 /* Z_BUF_ERROR */) {
        r = 0; // Set return code to Z_OK.
    }

    // Update output buffer counters: decrement available output space, increment total output.
    z.avail_out -= bytesToCopy;
    z.total_out += bytesToCopy;

    // Update checksum if a check function is provided.
    if (s.checkfn !== null) {
        // Extract the segment of data from the window that is being copied.
        const segment = s.window.slice(s.read, s.read + bytesToCopy);
        // Apply the checksum function to update the check value.
        s.check = s.checkfn(s.check, segment, bytesToCopy);
        z.adler = s.check; // Update the stream's Adler checksum.
    }
    
    // Advance the read pointer within the window buffer.
    // Use modulo arithmetic to handle wrap-around correctly.
    s.read = (s.read + bytesToCopy) % s.window.length;

    // Check if the read pointer has reached the logical end of the window buffer.
    // If `s.read` is now equal to `s.window.length`, it means we've read up to the buffer's capacity,
    // so we should reset it to the beginning (0).
    if (s.read === s.window.length) {
        s.read = 0;
        // If the write pointer was also at the end (meaning the window is full and wrapped), reset it too.
        if (s.write === s.window.length) {
            s.write = 0;
        }
    }

    // Return the current return code.
    return r;
}