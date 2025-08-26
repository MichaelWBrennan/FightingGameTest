/**
 * ADX Audio Codec Implementation
 * Converted from CRI libadxe C library to TypeScript
 */
export class ADXDecoder {
    constructor() {
        Object.defineProperty(this, "header", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "channelStates", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
    }
    decodeHeader(buffer) {
        const view = new DataView(buffer);
        if (view.getUint16(0, false) !== 0x8000)
            return false;
        this.header = {
            signature: 'ADX',
            dataOffset: view.getUint16(2, false) + 4,
            encoding: view.getUint8(4),
            blockSize: view.getUint8(5),
            sampleBits: view.getUint8(6),
            channelCount: view.getUint8(7),
            sampleRate: view.getUint32(8, false),
            totalSamples: view.getUint32(12, false)
        };
        this.channelStates = Array(this.header.channelCount).fill(null).map(() => ({
            s1: 0,
            s2: 0
        }));
        return true;
    }
    decodeBlock(blockData, channel) {
        if (!this.header)
            throw new Error('Header not decoded');
        const samples = new Int16Array(32);
        const state = this.channelStates[channel];
        const scale = ADXDecoder.SCALE_TABLE[blockData[0] >> 4];
        for (let i = 0; i < 32; i++) {
            const byteIndex = 2 + Math.floor(i / 2);
            const nibble = (i % 2 === 0) ?
                (blockData[byteIndex] >> 4) :
                (blockData[byteIndex] & 0x0F);
            const delta = (nibble < 8) ? nibble : nibble - 16;
            const prediction = ((state.s1 * 0x0F00) - (state.s2 * 0x0700)) >> 12;
            const sample = Math.max(-32768, Math.min(32767, prediction + ((delta * scale) >> 12)));
            samples[i] = sample;
            state.s2 = state.s1;
            state.s1 = sample;
        }
        return samples;
    }
    getHeader() {
        return this.header;
    }
}
Object.defineProperty(ADXDecoder, "SCALE_TABLE", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: [
        0x0000, 0x0800, 0x0880, 0x0900, 0x0980, 0x0A00, 0x0A80, 0x0B00,
        0x0B80, 0x0C00, 0x0C80, 0x0D00, 0x0D80, 0x0E00, 0x0E80, 0x0F00
    ]
});
export class ADXEncoder {
    static encode(pcmData, sampleRate, channels) {
        // Basic ADX encoding implementation
        const header = new ArrayBuffer(36);
        const headerView = new DataView(header);
        headerView.setUint16(0, 0x8000, false);
        headerView.setUint16(2, 32, false);
        headerView.setUint8(4, 3); // encoding
        headerView.setUint8(5, 18); // block size
        headerView.setUint8(6, 4); // sample bits
        headerView.setUint8(7, channels);
        headerView.setUint32(8, sampleRate, false);
        headerView.setUint32(12, pcmData.length / channels, false);
        // Simplified encoding - just return header for now
        return header;
    }
}
//# sourceMappingURL=ADXCodec.js.map