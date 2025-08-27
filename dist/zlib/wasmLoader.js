/**
 * A generic utility for loading Emscripten-generated WebAssembly modules.
 * Provides a consistent way to instantiate Wasm modules and access their exported functions.
 *
 * Assumes Emscripten generates a JS glue file that exports a factory function
 * or a `Module` object constructor.
 */
/**
 * Loads an Emscripten Wasm module asynchronously.
 *
 * @param options Configuration options for loading the module.
 * @returns A Promise that resolves with the instantiated EmscriptenModule.
 */
export async function loadWasmModule(options) {
    const { moduleName, wasmPath, createModule, ...moduleArgs } = options;
    return new Promise((resolve, reject) => {
        const Module = createModule();
        // Set common properties for the Emscripten module.
        Module.wasmSource = wasmPath; // Path to the Wasm file.
        Module.onRuntimeInitialized = () => {
            console.log(`Wasm module '${moduleName}' loaded and runtime initialized.`);
            resolve(Module); // Resolve with the typed module instance.
        };
        // Assign standard Emscripten callbacks or custom ones provided.
        Module.print = moduleArgs.print || console.log;
        Module.printErr = moduleArgs.printErr || console.error;
        // Other provided args are also assigned directly to the Module object.
        Object.assign(Module, moduleArgs);
        // Emscripten's JS glue code handles the actual loading and instantiation
        // when the Module factory function is called.
        try {
            Module(); // This kicks off the Wasm loading and setup.
        }
        catch (error) {
            console.error(`Error loading Wasm module '${moduleName}' at ${wasmPath}:`, error);
            reject(error);
        }
    });
}
// --- Specific Loader Functions ---
/**
 * Loads the inflate Wasm module.
 * @returns A Promise resolving to the loaded inflate Wasm module instance.
 */
export const loadInflateModule = async () => {
    // The path to the WASM file. Adjust if your project structure differs.
    const wasmPath = '/src/zlib/inflate.wasm';
    return loadWasmModule({
        moduleName: 'inflate',
        wasmPath: wasmPath,
        createModule: inflateFactory, // Use the factory for inflate
        // Add any specific options for inflate module if needed
    });
};
/**
 * Loads the inffast Wasm module.
 * @returns A Promise resolving to the loaded inffast Wasm module instance.
 */
export const loadInffastModule = async () => {
    const wasmPath = '/src/zlib/inffast.wasm';
    return loadWasmModule({
        moduleName: 'inffast',
        wasmPath: wasmPath,
        createModule: inffastFactory, // Use the factory for inffast
    });
};
/**
 * Loads the uncompress Wasm module.
 * @returns A Promise resolving to the loaded uncompress Wasm module instance.
 */
export const loadUncompressModule = async () => {
    const wasmPath = '/src/zlib/uncompr.wasm';
    return loadWasmModule({
        moduleName: 'uncompress',
        wasmPath: wasmPath,
        createModule: uncompressFactory, // Use the factory for uncompress
    });
};
// Example usage (would be in another TS file):
/*
async function main() {
  try {
    const { inflateModule, inffastModule, uncompressModule } = await Promise.all({
      inflateModule: loadInflateModule(),
      inffastModule: loadInffastModule(),
      uncompressModule: loadUncompressModule()
    });

    // Now you can access exported functions, e.g.:
    // const inflateCodesFn = inflateModule._inflate_codes;
    // const uncompressFn = uncompressModule._uncompress;

    console.log("All zlib Wasm modules loaded successfully.");

  } catch (error) {
    console.error("Failed to load zlib Wasm modules:", error);
  }
}

main();
*/ 
//# sourceMappingURL=wasmLoader.js.map