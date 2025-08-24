// TypeScript definitions for the Emscripten-compiled uncompr module.
// This file describes the interface exposed by the uncompr.wasm module.

import type { EmscriptenModule } from './wasm-loader';

/**
 * Minimal ZStream interface required by uncompress.
 * Corresponds to `z_stream` in C.
 */
interface ZStreamForUncompress {
  next_in: Uint8Array;      // Input buffer pointer (view).
  avail_in: number;         // Available input bytes.
  next_out: Uint8Array;     // Output buffer pointer (view).
  avail_out: number;        // Available output bytes.
  total_out: number;        // Total bytes written to `next_out` across all inflate calls.
  // zalloc and zfree are not used by uncompress in zlib, so they are omitted.
  // msg?: string;            // Error message string, might be present in Module.
}

/**
 * Represents the Emscripten Module instance for the uncompr Wasm module.
 * Extends the base EmscriptenModule with specific exported functions.
 */
interface WasiUncomprModule extends EmscriptenModule {
  /**
   * Decompresses a source buffer into a destination buffer.
   * Corresponds to `uncompress` in C.
   *
   * @param dest Destination buffer (Uint8Array).
   * @param destLen A reference (e.g., Int32Array of length 1) to the total size of the destination buffer. The actual size used will be updated here.
   * @param source Source buffer (Uint8Array).
   * @param sourceLen Source buffer length.
   * @returns Z_OK on success, or an error code (Z_MEM_ERROR, Z_BUF_ERROR, Z_DATA_ERROR).
   */
  _uncompress(dest: Uint8Array, destLen: Int32Array, source: Uint8Array, sourceLen: number): number;
  // Note: In Emscripten, pointers like `destLen` (a `uLongf *` in C) are often passed as
  // a reference type, typically an array (like `Int32Array` or `Uint32Array`).
  // The `destLen` parameter's type reflects this Emscripten convention.
  // The size of the output buffer `destLen[0]` will be updated by the Wasm function.
}

export default WasiUncomprModule;