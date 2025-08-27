/**
 * A generic utility for loading Emscripten-generated WebAssembly modules.
 * Provides a consistent way to instantiate Wasm modules and access their exported functions.
 *
 * Assumes Emscripten generates a JS glue file that exports a factory function
 * or a `Module` object constructor.
 */
import type { EmscriptenModuleBase } from './wasm-loader';
import type { WasiInflateModule } from './inflate.d';
import type { WasiInffastModule } from './inffast.d';
import type { WasiUncomprModule } from './uncompr.d';
type WasmModuleOptions<T extends EmscriptenModuleBase> = {
    moduleName: string;
    wasmPath: string;
    createModule: () => T;
    onRuntimeInitialized?: () => void;
    print?: (text: string) => void;
    printErr?: (text: string) => void;
};
/**
 * Loads an Emscripten Wasm module asynchronously.
 *
 * @param options Configuration options for loading the module.
 * @returns A Promise that resolves with the instantiated EmscriptenModule.
 */
export declare function loadWasmModule<T extends EmscriptenModuleBase>(options: WasmModuleOptions<T>): Promise<T>;
/**
 * Loads the inflate Wasm module.
 * @returns A Promise resolving to the loaded inflate Wasm module instance.
 */
export declare const loadInflateModule: () => Promise<WasiInflateModule>;
/**
 * Loads the inffast Wasm module.
 * @returns A Promise resolving to the loaded inffast Wasm module instance.
 */
export declare const loadInffastModule: () => Promise<WasiInffastModule>;
/**
 * Loads the uncompress Wasm module.
 * @returns A Promise resolving to the loaded uncompress Wasm module instance.
 */
export declare const loadUncompressModule: () => Promise<WasiUncomprModule>;
export {};
