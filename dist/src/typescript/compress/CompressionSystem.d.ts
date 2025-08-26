/**
 * Compression System
 * Converted from Lz77 and zlibApp C files
 */
export interface CompressionHeader {
    signature: string;
    uncompressedSize: number;
    compressedSize: number;
    method: 'lz77' | 'zlib' | 'raw';
}
export declare class SF3CompressionSystem {
    private static readonly LZ77_SIGNATURE;
    private static readonly ZLIB_SIGNATURE;
    static decompress(data: ArrayBuffer): ArrayBuffer;
    private static decompressLZ77;
    private static decompressZlib;
    static compress(data: ArrayBuffer, method?: 'lz77' | 'zlib'): ArrayBuffer;
    private static compressLZ77;
    private static findLongestMatch;
    private static compressZlib;
}
//# sourceMappingURL=CompressionSystem.d.ts.map