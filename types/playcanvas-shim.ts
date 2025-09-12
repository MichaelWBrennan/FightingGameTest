// Runtime shim to map module 'playcanvas' imports to the global `pc` provided
// by the PlayCanvas engine script tag.
// Important: Do NOT capture the global at bundle time. Always resolve at runtime.

function getPc(): any {
  // Resolve the runtime global inserted by the PlayCanvas CDN script tag
  return (globalThis as any).pc || {};
}

// Minimal fallback EventHandler to avoid crashes if accessed before the engine loads
class FallbackEventHandler {
  private _handlers: Map<string, Set<Function>> = new Map();
  on(evt: string, cb: Function): void {
    if (!this._handlers.has(evt)) this._handlers.set(evt, new Set());
    this._handlers.get(evt)!.add(cb);
  }
  off(evt: string, cb?: Function): void {
    if (!this._handlers.has(evt)) return;
    if (cb) this._handlers.get(evt)!.delete(cb); else this._handlers.set(evt, new Set());
  }
  fire(evt: string, ...args: any[]): void {
    const set = this._handlers.get(evt);
    if (!set) return;
    for (const cb of set) {
      try { cb(...args); } catch {}
    }
  }
  destroy(): void {
    this._handlers.clear();
  }
}

// Proxy that forwards property access to the live global `pc` at runtime
const pcProxy: any = new Proxy({}, {
  get(_target, prop: PropertyKey) {
    const pc = getPc();
    // Provide a safe fallback for EventHandler early-access
    if (prop === 'EventHandler' && pc && !pc.EventHandler) {
      return FallbackEventHandler;
    }
    return pc ? pc[prop as any] : undefined;
  },
  set(_target, prop: PropertyKey, value: any) {
    const pc = getPc();
    if (pc) {
      pc[prop as any] = value;
      return true;
    }
    return false;
  },
  has(_target, prop: PropertyKey) {
    const pc = getPc();
    return pc ? (prop in pc) : false;
  }
});

// Default export to be ESM-friendly while allowing `import * as pc` usage via esbuild
export default pcProxy;

