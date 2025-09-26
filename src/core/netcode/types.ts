import type { PlayerInputs } from '../../core/input/InputManager';

export type FrameNumber = number;

export interface SerializedInputFrame {
  frame: FrameNumber;
  bits: number;
}

export interface GameStateSnapshot {
  frame: FrameNumber;
  payload: any;
  checksum: number;
}

export function inputsToBits(i: PlayerInputs): number {
  let b = 0;
  b |= i.up ? 1 << 0 : 0;
  b |= i.down ? 1 << 1 : 0;
  b |= i.left ? 1 << 2 : 0;
  b |= i.right ? 1 << 3 : 0;
  b |= i.lightPunch ? 1 << 4 : 0;
  b |= i.mediumPunch ? 1 << 5 : 0;
  b |= i.heavyPunch ? 1 << 6 : 0;
  b |= i.lightKick ? 1 << 7 : 0;
  b |= i.mediumKick ? 1 << 8 : 0;
  b |= i.heavyKick ? 1 << 9 : 0;
  b |= i.hadoken ? 1 << 10 : 0;
  b |= i.shoryuken ? 1 << 11 : 0;
  b |= i.tatsumaki ? 1 << 12 : 0;
  return b >>> 0;
}

export function bitsToInputs(bits: number): PlayerInputs {
  return {
    up: !!(bits & (1 << 0)),
    down: !!(bits & (1 << 1)),
    left: !!(bits & (1 << 2)),
    right: !!(bits & (1 << 3)),
    lightPunch: !!(bits & (1 << 4)),
    mediumPunch: !!(bits & (1 << 5)),
    heavyPunch: !!(bits & (1 << 6)),
    lightKick: !!(bits & (1 << 7)),
    mediumKick: !!(bits & (1 << 8)),
    heavyKick: !!(bits & (1 << 9)),
    hadoken: !!(bits & (1 << 10)),
    shoryuken: !!(bits & (1 << 11)),
    tatsumaki: !!(bits & (1 << 12))
  };
}

export function checksum32FromObject(obj: any): number {
  const s = JSON.stringify(obj);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

