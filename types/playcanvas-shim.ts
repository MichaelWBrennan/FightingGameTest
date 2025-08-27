// Runtime shim to map module 'playcanvas' imports to the global `pc` provided
// by the PlayCanvas engine script tag.
// This is intentionally minimal and relies on the engine being loaded first.

const pcGlobal: any = (globalThis as any).pc;

// Use CommonJS-style default export so that `import * as pc from 'playcanvas'`
// receives the entire namespace object across our TypeScript sources.
export = pcGlobal;

