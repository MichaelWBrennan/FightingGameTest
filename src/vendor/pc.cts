// Bundle PlayCanvas engine locally and expose the global `pc` for our codebase.
// Prefer the module export when bundled (CommonJS/ESM) and ensure it is assigned
// to globalThis.pc so the rest of the codebase (via the shim) can access it.
// Import directly from node_modules to avoid being remapped by the alias
// that points bare "playcanvas" imports to this vendor module.
// Starting with PlayCanvas 1.65.x, the distributed builds are .mjs files.
// Import explicit index.js to avoid directory resolution issues in some bundlers
import * as pcModule from '../../node_modules/playcanvas/build/playcanvas.mjs/index.js';
// Attempt to import PlayCanvas extras (CanvasFont, etc.) so runtime text works without editor assets.
// Use dynamic import without top-level await to remain compatible with IIFE bundling.
let extrasModule: any = null;
Promise.resolve().then(() => import('../../node_modules/playcanvas/build/playcanvas-extras.mjs/index.js'))
.then((m) => { extrasModule = m; })
.catch(() => Promise.resolve().then(() => import('../../node_modules/playcanvas/build/playcanvas-extras.mjs'))
.then((m) => { extrasModule = m; })
.catch(() => { /* extras not available; text will rely on DOM fallback or asset fonts */ }));

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

// Wire extras (notably CanvasFont) onto the pc namespace when available
// When extras load, wire CanvasFont onto the pc namespace
try {
  const attachExtras = () => {
    try {
      const pcNS: any = (globalThis as any).pc || pcGlobal || {};
      const extrasAny: any = (extrasModule as any)?.default || (extrasModule as any) || {};
      const CanvasFont = extrasAny.CanvasFont || extrasAny.canvasfont?.CanvasFont || extrasAny.canvasFont?.CanvasFont || extrasAny['CanvasFont'];
      if (CanvasFont && pcNS && !pcNS.CanvasFont) {
        pcNS.CanvasFont = CanvasFont;
      }
    } catch {}
  };
  // Try now (in case extras resolved synchronously in bundle), and again on microtask
  attachExtras();
  Promise.resolve().then(attachExtras);
} catch {}

export = (globalThis as any).pc || pcGlobal || {};

