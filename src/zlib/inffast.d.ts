// TypeScript definitions for the Emscripten-compiled inffast module.
// This file describes the interface exposed by the inffast.wasm module.

import type { EmscriptenModule } from './wasm-loader';

/**
 * Represents the Emscripten Module instance for the inffast Wasm module.
 * Extends the base EmscriptenModule with specific exported functions.
 */
interface WasiInffastModule extends EmscriptenModule {
  /**
   * Processes literals and length/distance pairs efficiently.
   * Corresponds to `inflate_fast` in C.
   *
   * @param bl - Number of bits for the literal/length tree lookup.
   * @param bd - Number of bits for the distance tree lookup.
   * @param tl - The literal/length Huffman tree.
   * @param td - The distance Huffman tree.
   * @param s - Simplified inflate blocks state (includes window, read/write pointers).
   * @param z - ZStream state (input/output buffers, etc.).
   * @returns The status code of the operation (e.g., Z_OK, Z_STREAM_END, Z_DATA_ERROR).
   */
  _inflate_fast(bl: number, bd: number, tl: any, td: any, s: any, z: ZStream): number;
}

// Note: The exact types for `tl`, `td`, `s`, and `z` would need to be
// defined or imported for proper type checking. `any` is used as a placeholder.
// The `ZStream` and `InflateBlocksState` interfaces would be more detailed
// in a full implementation.

export default WasiInffastModule;