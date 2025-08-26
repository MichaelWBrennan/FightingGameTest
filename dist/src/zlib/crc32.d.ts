/**
 * CRC-32 checksum calculation.
 * Based on the zlib crc32.c implementation.
 */
export declare function get_crc_table(): number[];
export declare function crc32(crc: number, buf: Uint8Array | null, len: number): number;
//# sourceMappingURL=crc32.d.ts.map