/**
 * Inflate module type definitions
 */

export interface WasiInflateModule {
  _inflate_init(): number;
  _inflate_process(input: number, inputSize: number, output: number, outputSize: number): number;
  _inflate_end(): number;
}