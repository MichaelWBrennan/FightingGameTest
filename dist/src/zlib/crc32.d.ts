/**
 * CRC-32 checksum calculation.
 * Based on the zlib crc32.c implementation.
 */
/**
 * Computes the CRC-32 checksum of a data stream.
 *
 * @param crc The current CRC-32 checksum value. Defaults to 0.
 * @param buf The data buffer. Can be a Uint8Array or ArrayBuffer. If null, the initial CRC value is returned.
 * @param len The number of bytes to process from the buffer. If not provided, the entire buffer is processed.
 * @returns The computed CRC-32 checksum.
 */
export declare function crc32(crc?: number, buf?: Uint8Array | ArrayBuffer | null, len?: number): number;
//# sourceMappingURL=crc32.d.ts.map