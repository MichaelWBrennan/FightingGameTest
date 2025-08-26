/**
 * Uncompress module type definitions
 */

export interface WasiUncomprModule {
  _uncompress(dest: number, destLen: number, source: number, sourceLen: number): number;
}