
/**
 * CRI Middleware ADX Audio Library TypeScript definitions
 * Converted from CRI headers
 */

export interface ADXHandle {
  id: number;
  status: number;
  buffer: Uint8Array | null;
  bufferSize: number;
  sampleRate: number;
  channels: number;
  totalSamples: number;
  currentSample: number;
  loopStart: number;
  loopEnd: number;
  volume: number;
  pan: number;
}

export interface ADXHeader {
  signature: number;
  copyright: string;
  version: number;
  encoding: number;
  blockSize: number;
  sampleBitdepth: number;
  channelCount: number;
  sampleRate: number;
  totalSamples: number;
  highCutoff: number;
  lowCutoff: number;
  loopFlag: number;
  loopBeginSample: number;
  loopBeginByte: number;
  loopEndSample: number;
  loopEndByte: number;
}

export interface CRIFileSystem {
  fileCount: number;
  files: Array<{
    name: string;
    offset: number;
    size: number;
    compressed: boolean;
  }>;
  baseOffset: number;
  totalSize: number;
}

export interface SoundRequest {
  id: number;
  type: 'bgm' | 'se' | 'voice';
  priority: number;
  volume: number;
  pan: number;
  pitch: number;
  fadeIn: number;
  fadeOut: number;
  loop: boolean;
}

export const ADX_STATUS_STOP = 0;
export const ADX_STATUS_PREP = 1;
export const ADX_STATUS_PLAYING = 2;
export const ADX_STATUS_PAUSE = 3;

export const CRI_ERR_OK = 0;
export const CRI_ERR_NG = -1;
export const CRI_ERR_INVALID_PARAMETER = -2;
export const CRI_ERR_INSUFFICIENT_MEMORY = -3;
export const CRI_ERR_UNSUPPORTED_FORMAT = -4;
