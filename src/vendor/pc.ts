// Bundle PlayCanvas engine locally and expose the global `pc` for our codebase.
// Prefer the module export when bundled (CommonJS/ESM) and ensure it is assigned
// to globalThis.pc so the rest of the codebase (via the shim) can access it.
import * as pcModule from 'playcanvas/build/playcanvas.js';

let pcGlobal: any = (globalThis as any).pc;
try {
  if (!pcGlobal) {
    // Attempt common interop patterns used by UMD/CJS builds when bundled
    const maybeNamespace: any = (pcModule as any)?.default || (pcModule as any)?.pc || (pcModule as any);
    if (maybeNamespace && typeof maybeNamespace === 'object') {
      // Some bundlers wrap the export; detect by presence of expected API
      if (maybeNamespace.Application || maybeNamespace.Vec3 || Object.keys(maybeNamespace).length > 0) {
        (globalThis as any).pc = maybeNamespace;
        pcGlobal = maybeNamespace;
      }
    }
  }
} catch {}

export = (globalThis as any).pc || pcGlobal || {};

