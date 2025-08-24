/**
 * Adler-32 checksum calculation.
 * Based on the zlib adler32.c implementation.
 */

// Constants from zlib/adler32.c
const BASE = 65521; // largest prime smaller than 65536
const NMAX = 5552;
// NMAX is the largest n such that 255*n*(n+1)/2 + (n+1)*(BASE-1) <= 2^32-1

/**
 * Computes a single byte step for Adler-32 checksum.
 * @param s1 Current sum 1.
 * @param s2 Current sum 2.
 * @param byte The byte to process.
 * @returns A tuple [new_s1, new_s2].
 */
const do1 = (s1: number, s2: number, byte: number): [number, number] => {
  // Ensure byte is treated as an unsigned 8-bit integer for calculations
  const unsignedByte = byte & 0xff;
  s1 = (s1 + unsignedByte) % BASE;
  s2 = (s2 + s1) % BASE;
  return [s1, s2];
};

/**
 * Computes the Adler-32 checksum of a data stream.
 *
 * @param adler The current Adler-32 checksum value. Defaults to 1 (as per zlib's initial return for null buffer).
 * @param buf The data buffer. Can be a Uint8Array or ArrayBuffer. If null, the initial checksum is returned without processing.
 * @param len The number of bytes to process from the buffer. If not provided, the entire buffer is processed.
 * @returns The computed Adler-32 checksum.
 */
export function adler32(adler: number = 1, buf: Uint8Array | ArrayBuffer | null = null, len?: number): number {
  // Handle null buffer case upfront, returning the initial checksum as per zlib's C code.
  // if (buf == Z_NULL) return 1L;
  if (!buf) {
    return adler;
  }

  let byteArray: Uint8Array;
  let bufferLength: number;

  // Standardize input buffer to Uint8Array.
  if (buf instanceof ArrayBuffer) {
    byteArray = new Uint8Array(buf);
    bufferLength = len === undefined ? buf.byteLength : len;
  } else if (buf instanceof Uint8Array) {
    byteArray = buf;
    bufferLength = len === undefined ? buf.length : len;
  } else {
      // Throw an error for any unsupported input type.
    throw new Error("Unsupported buffer type for adler32 calculation. Expected Uint8Array or ArrayBuffer.");
  }

  // Ensure the effective length does not exceed the actual buffer size.
  bufferLength = Math.min(bufferLength, byteArray.length);

  // If the effective length is 0, return the initial checksum.
  if (bufferLength === 0) {
    return adler;
  }

  // Initialize s1 and s2 based on the input adler checksum.
  // Ensure they are treated as 32-bit unsigned integers initially.
  let s1 = adler & 0xffff;
  let s2 = (adler >>> 16) & 0xffff;

  // Track the total bytes remaining to process.
  let remainingLength = bufferLength;
  // Track the current offset within the byteArray.
  let currentOffset = 0;

  // Main loop: process the entire buffer in chunks.
  while (remainingLength > 0) {
    // Determine the number of bytes to process in this iteration, up to NMAX.
    let n = remainingLength < NMAX ? remainingLength : NMAX;
    remainingLength -= n; // Decrease the total remaining length.

    // Process 'n' bytes for the current block.
    // The C code uses DO16, DO8, DO4, DO2, DO1 macros for optimization.
    // We simulate this by processing bytes. The loop structure below ensures
    // that we correctly account for `currentOffset` and `n`.
    // All indices derived from `currentOffset` and `n` are guaranteed safe due to checks on `bufferLength`.

    let bytesToProcessInChunk = n; // Number of bytes to process from this NMAX chunk.

    // Process in 16-byte blocks if `bytesToProcessInChunk` is large enough.
    // This loop processes as many full 16-byte chunks as possible within `bytesToProcessInChunk`.
    while (bytesToProcessInChunk >= 16) {
      // Process 16 bytes using the do1 helper function.
      for (let i = 0; i < 16; i++) {
        // Access byte using currentOffset. Since we are in a loop that ensures
        // at least 16 bytes are available at `currentOffset`, `byteArray[currentOffset + i]` is safe.
        // The `!` assertion is generally safe here as array access within bounds yields a number.
        [s1, s2] = do1(s1, s2, byteArray[currentOffset + i]!); // Safe access due to loop condition
      }
      currentOffset += 16; // Advance offset by 16 bytes.
      bytesToProcessInChunk -= 16; // Reduce bytes remaining in this NMAX chunk.
    }

    // Process any remaining bytes (< 16) specifically for this NMAX chunk.
    // This loop handles the tail end of the NMAX chunk.
    for (; bytesToProcessInChunk > 0; bytesToProcessInChunk--) {
      // Access byte using currentOffset. Safe due to loop condition.
      [s1, s2] = do1(s1, s2, byteArray[currentOffset]!); // Safe access
      currentOffset += 1; // Advance offset by 1 byte.
    }

    // Apply modulo BASE after processing 'n' bytes. This step is critical for Adler-32.
    // The modulo is applied after the entire NMAX block (or its remainder) is processed.
    s1 %= BASE;
    s2 %= BASE;
  }

  // Combine s1 and s2 into the final Adler-32 checksum.
  return (s2 << 16) | s1;
}