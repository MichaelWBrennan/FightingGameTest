/**
 * TypeScript definitions for Emscripten-generated Wasm modules.
 * This file provides a common interface for loading and interacting with
 * Emscripten-compiled WebAssembly modules.
 */

/**
 * WebAssembly Module Loader Type Definitions
 */

export interface EmscriptenModule {
  wasmSource?: string;
  onRuntimeInitialized?: () => void;
  print?: (text: string) => void;
  printErr?: (text: string) => void;
  FS?: any;
  HEAP8?: Int8Array;
  HEAP16?: Int16Array;
  HEAP32?: Int32Array;
  HEAPU8?: Uint8Array;
  HEAPU16?: Uint16Array;
  HEAPU32?: Uint32Array;
  [key: string]: any;
}

export interface EmscriptenModuleBase extends EmscriptenModule {
  _malloc?(size: number): number;
  _free?(ptr: number): void;
  getValue?(ptr: number, type: string): number;
  setValue?(ptr: number, value: number, type: string): void;
}

/**
 * A type for the Emscripten Module loader function.
 * It typically takes an options object and returns a Promise that resolves
 * with the EmscriptenModule instance once it's ready.
 */
type EmscriptenModuleLoader = (options?: any) => Promise<EmscriptenModule>;

// Export the types for the loader function and module interfaces.
export type { EmscriptenModule, EmscriptenModuleLoader, EmscriptenModuleBase };

// Note: This is a foundational type. The actual Emscripten Module object
// will have many more methods and properties dynamically generated based on
// the Emscripten compilation flags and the C code's exported functions.
// For example, if `_inflate_codes` is exported, `Module._inflate_codes` will
// be available on the loaded Module.