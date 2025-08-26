
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

export class SF3CompressionSystem {
  private static readonly LZ77_SIGNATURE = 'LZ77';
  private static readonly ZLIB_SIGNATURE = 'ZLIB';

  static decompress(data: ArrayBuffer): ArrayBuffer {
    const view = new DataView(data);
    const signature = String.fromCharCode(
      view.getUint8(0), view.getUint8(1), 
      view.getUint8(2), view.getUint8(3)
    );

    switch (signature) {
      case this.LZ77_SIGNATURE:
        return this.decompressLZ77(data);
      case this.ZLIB_SIGNATURE:
        return this.decompressZlib(data);
      default:
        return data; // Return as-is if not compressed
    }
  }

  private static decompressLZ77(data: ArrayBuffer): ArrayBuffer {
    const view = new DataView(data);
    let offset = 8; // Skip header
    
    const uncompressedSize = view.getUint32(4, true);
    const output = new Uint8Array(uncompressedSize);
    let outputPos = 0;

    while (offset < data.byteLength && outputPos < uncompressedSize) {
      const flags = view.getUint8(offset++);
      
      for (let i = 0; i < 8 && offset < data.byteLength && outputPos < uncompressedSize; i++) {
        if (flags & (1 << i)) {
          // Literal byte
          output[outputPos++] = view.getUint8(offset++);
        } else {
          // Length-distance pair
          const lengthDistance = view.getUint16(offset, true);
          offset += 2;
          
          const distance = (lengthDistance & 0x0FFF) + 1;
          const length = ((lengthDistance >> 12) & 0x000F) + 3;
          
          for (let j = 0; j < length && outputPos < uncompressedSize; j++) {
            output[outputPos] = output[outputPos - distance];
            outputPos++;
          }
        }
      }
    }

    return output.buffer;
  }

  private static decompressZlib(data: ArrayBuffer): ArrayBuffer {
    // Use our existing zlib implementation
    const view = new DataView(data);
    const uncompressedSize = view.getUint32(4, true);
    const compressedData = new Uint8Array(data, 8);
    
    // This would use our existing zlib TypeScript implementation
    // For now, return a placeholder
    return new ArrayBuffer(uncompressedSize);
  }

  static compress(data: ArrayBuffer, method: 'lz77' | 'zlib' = 'lz77'): ArrayBuffer {
    switch (method) {
      case 'lz77':
        return this.compressLZ77(data);
      case 'zlib':
        return this.compressZlib(data);
      default:
        return data;
    }
  }

  private static compressLZ77(data: ArrayBuffer): ArrayBuffer {
    const input = new Uint8Array(data);
    const output: number[] = [];
    
    // Add header
    output.push(0x4C, 0x5A, 0x37, 0x37); // 'LZ77'
    output.push(
      (input.length >> 0) & 0xFF,
      (input.length >> 8) & 0xFF,
      (input.length >> 16) & 0xFF,
      (input.length >> 24) & 0xFF
    );

    let pos = 0;
    while (pos < input.length) {
      let flags = 0;
      const flagPos = output.length;
      output.push(0); // Placeholder for flags
      
      for (let bit = 0; bit < 8 && pos < input.length; bit++) {
        const match = this.findLongestMatch(input, pos);
        
        if (match.length >= 3) {
          // Encode match
          const encoded = ((match.length - 3) << 12) | ((match.distance - 1) & 0x0FFF);
          output.push(encoded & 0xFF, (encoded >> 8) & 0xFF);
          pos += match.length;
        } else {
          // Literal byte
          flags |= (1 << bit);
          output.push(input[pos++]);
        }
      }
      
      output[flagPos] = flags;
    }

    return new Uint8Array(output).buffer;
  }

  private static findLongestMatch(data: Uint8Array, pos: number): { length: number; distance: number } {
    let bestLength = 0;
    let bestDistance = 0;
    
    const maxDistance = Math.min(pos, 4096);
    const maxLength = Math.min(18, data.length - pos);
    
    for (let distance = 1; distance <= maxDistance; distance++) {
      let length = 0;
      while (length < maxLength && data[pos + length] === data[pos + length - distance]) {
        length++;
      }
      
      if (length > bestLength) {
        bestLength = length;
        bestDistance = distance;
      }
    }
    
    return { length: bestLength, distance: bestDistance };
  }

  private static compressZlib(data: ArrayBuffer): ArrayBuffer {
    // Placeholder for zlib compression
    return data;
  }
}
