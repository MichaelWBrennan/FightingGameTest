// Bundle PlayCanvas engine locally and expose the global `pc` for our codebase.
// This imports the UMD build which attaches `pc` to globalThis.
import 'playcanvas/build/playcanvas.js';

const pcGlobal: any = (globalThis as any).pc;
export = pcGlobal;

