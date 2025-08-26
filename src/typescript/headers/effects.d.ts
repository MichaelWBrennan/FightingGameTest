
/**
 * Street Fighter III Effects System TypeScript definitions
 * Converted from EFF*.h headers
 */

export interface EffectWork {
  id: number;
  type: number;
  status: number;
  priority: number;
  x: number;
  y: number;
  z: number;
  velX: number;
  velY: number;
  velZ: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  alpha: number;
  red: number;
  green: number;
  blue: number;
  frame: number;
  maxFrame: number;
  animSpeed: number;
  spriteId: number;
  paletteId: number;
  flags: number;
  userData: any;
}

export interface ParticleSystem {
  maxParticles: number;
  activeParticles: number;
  particles: EffectWork[];
  gravity: number;
  wind: number;
  friction: number;
  emissionRate: number;
  emissionTimer: number;
}

export interface EffectSprite {
  id: number;
  width: number;
  height: number;
  originX: number;
  originY: number;
  textureId: number;
  uvX: number;
  uvY: number;
  uvWidth: number;
  uvHeight: number;
}

export const EFF_STATUS_INACTIVE = 0;
export const EFF_STATUS_ACTIVE = 1;
export const EFF_STATUS_PAUSE = 2;
export const EFF_STATUS_FADEOUT = 3;

export const EFF_TYPE_SPARK = 0x00;
export const EFF_TYPE_HIT = 0x01;
export const EFF_TYPE_GUARD = 0x02;
export const EFF_TYPE_PROJECTILE = 0x04;
export const EFF_TYPE_SUPER = 0x07;
export const EFF_TYPE_COMBO = 0x09;
export const EFF_TYPE_KO = 0x10;
export const EFF_TYPE_PERFECT = 0x11;

export const EFF_FLAG_LOOP = 0x01;
export const EFF_FLAG_REVERSE = 0x02;
export const EFF_FLAG_PINGPONG = 0x04;
export const EFF_FLAG_BILLBOARD = 0x08;
export const EFF_FLAG_ADDITIVE = 0x10;
export const EFF_FLAG_MULTIPLY = 0x20;
