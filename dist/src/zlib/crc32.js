/**
 * CRC-32 checksum calculation.
 * Based on the zlib crc32.c implementation.
 */
// Module-level scope for the CRC-32 lookup table.
// It's initialized lazily when the crc32 function is first called.
let crcTable;
/**
 * Generates the CRC-32 lookup table.
 * This function is called only once. Populates the module-level `crcTable`.
 */
const makeCrcTable = () => {
    // The polynomial value used in the C implementation (0xedb88320L) for generating CRC table entries.
    const polynomial = 0xedb88320;
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            // Perform the bitwise operations as in the C code.
            // `c & 1` checks the least significant bit.
            // `c >>> 1` is an unsigned right shift, equivalent to C's `c >> 1` for unsigned integers.
            c = c & 1 ? polynomial ^ (c >>> 1) : c >>> 1;
        }
        table[n] = c;
    }
    return table;
};
/**
 * Safely retrieves the CRC-32 lookup table, initializing it if necessary.
 * This ensures that `crcTable` is always defined when accessed.
 * @returns The initialized CRC-32 lookup table.
 */
const getCrcTable = () => {
    if (!crcTable) {
        crcTable = makeCrcTable();
    }
    return crcTable; // Non-null assertion is safe here because makeCrcTable initializes it.
};
/**
 * Computes the CRC-32 checksum of a data stream.
 *
 * @param crc The current CRC-32 checksum value. Defaults to 0.
 * @param buf The data buffer. Can be a Uint8Array or ArrayBuffer. If null, the initial CRC value is returned.
 * @param len The number of bytes to process from the buffer. If not provided, the entire buffer is processed.
 * @returns The computed CRC-32 checksum.
 */
export function crc32(crc = 0, buf = null, len) {
    // Get the CRC table, initializing it if it hasn't been already.
    // `getCrcTable()` ensures that `crcTable` is initialized and returns it.
    const table = getCrcTable();
    // Handle null buffer case upfront, returning an initial CRC value as in zlib's C code.
    if (!buf) {
        // According to zlib's crc32.c: if (buf == Z_NULL) return 0L;
        // Apply final XOR if no data is processed.
        return crc ^ 0xffffffff;
    }
    let byteArray;
    let bufferLength;
    // Process the input buffer: convert to Uint8Array if it's an ArrayBuffer.
    if (buf instanceof ArrayBuffer) {
        byteArray = new Uint8Array(buf);
        bufferLength = len === undefined ? buf.byteLength : len;
    }
    else if (buf instanceof Uint8Array) {
        byteArray = buf;
        bufferLength = len === undefined ? buf.length : len;
    }
    else {
        // Throw an error for any unsupported input type.
        throw new Error("Unsupported buffer type for crc32 calculation. Expected Uint8Array or ArrayBuffer.");
    }
    // Ensure the effective length does not exceed the actual buffer size.
    bufferLength = Math.min(bufferLength, byteArray.length);
    // If the effective length is 0, return the initial CRC state after XOR, as per zlib's logic.
    if (bufferLength === 0) {
        return crc ^ 0xffffffff;
    }
    // Initialize current CRC value with the input CRC and the final XOR.
    let currentCrc = crc ^ 0xffffffff;
    let offset = 0; // Use an offset to manage reading from the byteArray.
    // Process the buffer in chunks of 8 bytes, leveraging the pre-computed lookup table.
    // The loop continues as long as there are at least 8 bytes remaining from the current offset.
    for (; bufferLength - offset >= 8; offset += 8) {
        let c = currentCrc; // Use a temporary variable for current CRC for easier manipulation.
        // Apply the logic of the DO8 macro (which expands to 8 DO1 calls from zlib/crc32.c).
        // Each DO1 step involves: lookup[byte ^ (crc & 0xff)] ^ (crc >>> 8).
        // The `!` non-null assertions on `table` are safe because `getCrcTable` guarantees it.
        // The `!` on `byteArray[offset + byteIndex]` is asserted safe due to loop boundary checks.
        c = table[byteArray[offset + 0] ^ (c & 0xff)] ^ (c >>> 8);
        c = table[byteArray[offset + 1] ^ (c & 0xff)] ^ (c >>> 8);
        c = table[byteArray[offset + 2] ^ (c & 0xff)] ^ (c >>> 8);
        c = table[byteArray[offset + 3] ^ (c & 0xff)] ^ (c >>> 8);
        c = table[byteArray[offset + 4] ^ (c & 0xff)] ^ (c >>> 8);
        c = table[byteArray[offset + 5] ^ (c & 0xff)] ^ (c >>> 8);
        c = table[byteArray[offset + 6] ^ (c & 0xff)] ^ (c >>> 8);
        c = table[byteArray[offset + 7] ^ (c & 0xff)] ^ (c >>> 8);
        currentCrc = c; // Update the main CRC value.
    }
    // Process any remaining bytes (less than 8) using standard DO1 logic.
    // This loop ensures that any bytes after the last full 8-byte chunk are also processed.
    for (; offset < bufferLength; offset++) {
        // `!` assertion on `table` is safe because it's guaranteed to be defined.
        // `byteArray[offset]` access is safe as `offset` iterates up to `bufferLength`, which is checked and constrained.
        currentCrc = table[byteArray[offset] ^ (currentCrc & 0xff)] ^ (currentCrc >>> 8);
    }
    // Return the final CRC value after applying the final XOR mask.
    return currentCrc ^ 0xffffffff;
}
;
//# sourceMappingURL=crc32.js.map