// Bundle PlayCanvas engine locally and expose the global `pc` for our codebase.
// Prefer the module export when bundled (CommonJS/ESM) and ensure it is assigned
// to globalThis.pc so the rest of the codebase (via the shim) can access it.
// Import directly from node_modules to avoid being remapped by the alias
// that points bare "playcanvas" imports to this vendor module.
// Starting with PlayCanvas 1.65.x, the distributed builds are .mjs files.
import * as pcModule from '../../node_modules/playcanvas/build/playcanvas.mjs';

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

