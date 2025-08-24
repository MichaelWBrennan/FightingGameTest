/**
 * TypeScript definitions for Emscripten-generated Wasm modules.
 * This file provides a common interface for loading and interacting with
 * Emscripten-compiled WebAssembly modules.
 */

/**
 * Represents the Emscripten Module object.
 * Emscripten generates a JavaScript object that acts as a loader and interface to the Wasm module.
 * This interface describes the essential properties of that Module object.
 */
interface EmscriptenModule {
  // Path to the Wasm file.
  wasmSource?: string | ArrayBuffer | Response;
  // Path to the JS glue code file.
  glueCode?: string;
  // Options for module loading and execution.
  // This is a simplification; Emscripten Module has many more options.
  onRuntimeInitialized?: () => void;
  print?: (text: string) => void;
  printErr?: (text: string) => void;

  // Dynamically generated functions and memory.
  [key: string]: any;
}

/**
 * A type for the Emscripten Module loader function.
 * It typically takes an options object and returns a Promise that resolves
 * with the EmscriptenModule instance once it's ready.
 */
type EmscriptenModuleLoader = (options?: any) => Promise<EmscriptenModule>;

// Export a type for the loader function.
export type { EmscriptenModule, EmscriptenModuleLoader, HuffmanTreeType };

// Note: This is a foundational type. The actual Emscripten Module object
// will have many more methods and properties dynamically generated based on
// the Emscripten compilation flags and the C code's exported functions.
// For example, if `_inflate_codes` is exported, `Module._inflate_codes` will
// be available on the loaded Module.