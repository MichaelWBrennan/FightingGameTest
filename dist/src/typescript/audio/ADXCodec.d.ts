/**
 * ADX Audio Codec Implementation
 * Converted from CRI libadxe C library to TypeScript
 */
export interface ADXHeader {
    signature: string;
    dataOffset: number;
    encoding: number;
    blockSize: number;
    sampleBits: number;
    channelCount: number;
    sampleRate: number;
    totalSamples: number;
}
export interface ADXChannelState {
    s1: number;
    s2: number;
}
export declare class ADXDecoder {
    private header;
    private channelStates;
    private static readonly SCALE_TABLE;
    decodeHeader(buffer: ArrayBuffer): boolean;
    decodeBlock(blockData: Uint8Array, channel: number): Int16Array;
    getHeader(): ADXHeader | null;
}
export declare class ADXEncoder {
    static encode(pcmData: Int16Array, sampleRate: number, channels: number): ArrayBuffer;
}
//# sourceMappingURL=ADXCodec.d.ts.map