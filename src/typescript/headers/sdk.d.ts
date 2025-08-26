
/**
 * PlayStation 2 SDK TypeScript definitions
 * Converted from PS2 SDK headers
 */

export interface PS2Thread {
  id: number;
  status: number;
  func: (() => void) | null;
  stack: Uint8Array | null;
  stackSize: number;
  initPriority: number;
  currentPriority: number;
}

export interface PS2Timer {
  id: number;
  mode: number;
  count: number;
  target: number;
  handler: (() => void) | null;
}

export interface PS2DMAChannel {
  chcr: number;
  madr: number;
  qwc: number;
  tadr: number;
  asr0: number;
  asr1: number;
  sadr: number;
}

export interface PS2Memory {
  base: number;
  size: number;
  type: 'main' | 'scratchpad' | 'gs' | 'spu';
}

export interface PS2Pad {
  mode: number;
  lock: number;
  modeTable: Uint8Array;
  actTable: Uint8Array;
  currentSlot: number;
  frame: number;
  findFree: number;
  findPadArea: number;
  enabled: number;
  connected: number;
}

export interface VU0Registers {
  vf: Float32Array[32];  // Vector registers
  vi: Uint32Array[16];   // Integer registers
  acc: Float32Array[4];  // Accumulator
  p: number;             // P register
  q: number;             // Q register
  r: number;             // R register
  i: number;             // I register
  status: number;        // Status register
  mac: number;           // MAC register
  clip: number;          // Clipping register
}

export const EE_THREAD_READY = 0x01;
export const EE_THREAD_WAIT = 0x02;
export const EE_THREAD_DORMANT = 0x04;

export const TIM2_RGB16 = 0;
export const TIM2_RGB24 = 1;
export const TIM2_RGB32 = 2;
export const TIM2_IDTEX4 = 3;
export const TIM2_IDTEX8 = 4;
