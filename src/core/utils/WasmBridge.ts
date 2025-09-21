export class WasmBridge {
  private ready = false;
  private mod: any = null;
  async load(url: string): Promise<void> {
    try {
      // @ts-ignore
      const resp = await fetch(url);
      // @ts-ignore
      const { instance } = await WebAssembly.instantiateStreaming(resp, {});
      this.mod = instance?.exports || null;
      this.ready = !!this.mod;
    } catch {}
  }
  isReady(): boolean { return this.ready; }
  call(name: string, ...args: any[]): any { try { return this.mod?.[name]?.(...args); } catch { return null; } }
}

