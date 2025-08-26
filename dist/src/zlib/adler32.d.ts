/**
 * Adler-32 checksum calculation.
 * Based on the zlib adler32.c implementation.
 */
/**
 * Computes the Adler-32 checksum of a data stream.
 *
 * @param adler The current Adler-32 checksum value. Defaults to 1 (as per zlib's initial return for null buffer).
 * @param buf The data buffer. Can be a Uint8Array or ArrayBuffer. If null, the initial checksum is returned without processing.
 * @param len The number of bytes to process from the buffer. If not provided, the entire buffer is processed.
 * @returns The computed Adler-32 checksum.
 */
export declare function adler32(adler?: number, buf?: Uint8Array | ArrayBuffer | null, len?: number): number;
//# sourceMappingURL=adler32.d.ts.map