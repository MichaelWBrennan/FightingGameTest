// TypeScript definitions for the Emscripten-compiled inffast module.
// This file describes the interface exposed by the inffast.wasm module.

/**
 * Inffast module type definitions
 */

export interface WasiInffastModule {
  _inffast_process(stream: number, start: number): void;
  _inffast_init(): number;
}