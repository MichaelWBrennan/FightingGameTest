import { LoadingOverlay } from '../ui/LoadingOverlay';

export type DebugReport = {
  meta: {
    generatedAt: string;
    generatedAtEpochMs: number;
    buildVersion: string | null;
    assetKey: string | null;
    url: string | null;
    referrer: string | null;
    userAgent: string | null;
    languages: string[] | null;
    viewport: { width: number; height: number } | null;
    screen: { width: number; height: number; availWidth?: number; availHeight?: number } | null;
    devicePixelRatio: number | null;
    deviceMemoryGb: number | null;
    hardwareConcurrency: number | null;
    platform: string | null;
    vendor: string | null;
    timezone: string | null;
    colorScheme: string | null;
    reducedMotion: boolean | null;
    orientation: string | null;
    crossOriginIsolated: boolean | null;
    onLine: boolean | null;
  };
  env: {
    importMetaEnv?: any;
    processEnv?: any;
    globals?: Record<string, any>;
  };
  document: {
    readyState: string | null;
    visibilityState: string | null;
    hidden: boolean | null;
    title: string | null;
    hasFocus: boolean | null;
    activeElement: string | null;
    scripts: string[];
    stylesheets: string[];
    canvas: Array<{ id: string | null; width: number | null; height: number | null }>;
  };
  graphics: {
    webgl: {
      supported: boolean;
      contextType: 'webgl2' | 'webgl' | null;
      attributes?: any;
      info?: { vendor?: string; renderer?: string; version?: string; shadingLanguageVersion?: string };
      parameters?: Partial<Record<string, number>> & { maxTextureSize?: number; maxTextureImageUnits?: number; maxCubeMapSize?: number; maxRenderbufferSize?: number; maxVaryingVectors?: number };
      extensions?: string[];
    };
    webgpu: { supported: boolean };
  };
  playcanvas: {
    available: boolean;
    version: string | null;
    hasApplication: boolean;
    hasGraphicsDevice: boolean;
  };
  overlay: import('../ui/LoadingOverlay').LoadingOverlayDebugState | { error: string };
  storage: {
    localStorage: Record<string, string>;
    sessionStorage: Record<string, string>;
    cookies: string | null;
    indexedDB?: Array<{ name?: string; version?: number }> | { error: string };
  };
  network: {
    online: boolean | null;
    connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean } | null;
    serviceWorkers?: Array<{ scope: string; state: string }> | { error: string };
    caches?: string[] | { error: string };
    battery?: { charging?: boolean; level?: number } | { error: string } | null;
  };
  performance: {
    timeOrigin: number | null;
    nowMs: number | null;
    navigationType: string | null;
    navigationEntry?: any;
    paint?: Array<{ name: string; startTime: number }>; 
    memory: { jsHeapSizeLimit?: number; totalJSHeapSize?: number; usedJSHeapSize?: number } | null;
    resourcesSample: Array<{ name: string; initiatorType?: string; duration?: number; transferSize?: number; decodedBodySize?: number; encodedBodySize?: number }>;
  };
  errors?: Array<{ message: string; filename?: string; lineno?: number; colno?: number }>; // reserved
};

function safeWindow(): any {
  try { return window as any; } catch { return {}; }
}

function safeDocument(): any {
  try { return document as any; } catch { return null; }
}

function safeNavigator(): any {
  try { return navigator as any; } catch { return null; }
}

function collectStorage(prefixFilter?: RegExp): { localStorage: Record<string, string>; sessionStorage: Record<string, string> } {
  const out = { localStorage: {} as Record<string, string>, sessionStorage: {} as Record<string, string> };
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      if (!prefixFilter || prefixFilter.test(key)) {
        try { out.localStorage[key] = String(localStorage.getItem(key)); } catch {}
      }
    }
  } catch {}
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)!;
      if (!prefixFilter || prefixFilter.test(key)) {
        try { out.sessionStorage[key] = String(sessionStorage.getItem(key)); } catch {}
      }
    }
  } catch {}
  return out;
}

function collectPerformance(): DebugReport['performance'] {
  let memory: any = null;
  try {
    const perfAny: any = (performance as any);
    if (perfAny && perfAny.memory) {
      memory = {
        jsHeapSizeLimit: Number(perfAny.memory.jsHeapSizeLimit) || undefined,
        totalJSHeapSize: Number(perfAny.memory.totalJSHeapSize) || undefined,
        usedJSHeapSize: Number(perfAny.memory.usedJSHeapSize) || undefined
      };
    }
  } catch {}
  let resources: Array<{ name: string; initiatorType?: string; duration?: number; transferSize?: number; decodedBodySize?: number; encodedBodySize?: number }> = [];
  try {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const sample = entries.slice(-1000); // broader sample for diagnostics
    resources = sample.map(e => ({
      name: e.name,
      initiatorType: (e as any).initiatorType,
      duration: e.duration,
      transferSize: (e as any).transferSize,
      decodedBodySize: (e as any).decodedBodySize,
      encodedBodySize: (e as any).encodedBodySize
    }));
  } catch {}
  let navigationType: string | null = null;
  try {
    const nav = performance.getEntriesByType('navigation')[0] as any;
    navigationType = (nav && (nav.type || nav.entryType)) || null;
  } catch {}
  let navigationEntry: any = null;
  try {
    const nav = (performance.getEntriesByType('navigation')[0] as any) || null;
    if (nav) navigationEntry = { ...nav };
  } catch {}
  let paint: Array<{ name: string; startTime: number }> = [];
  try {
    const paints = performance.getEntriesByType('paint') as any[];
    paint = (paints || []).map(p => ({ name: p.name, startTime: p.startTime }));
  } catch {}
  return {
    timeOrigin: typeof performance !== 'undefined' ? performance.timeOrigin : null,
    nowMs: typeof performance !== 'undefined' ? performance.now() : null,
    navigationType,
    navigationEntry,
    paint,
    memory,
    resourcesSample: resources
  };
}

function collectPlayCanvasSummary(): DebugReport['playcanvas'] {
  try {
    const pcAny: any = (safeWindow() as any).pc;
    return {
      available: !!pcAny,
      version: pcAny?.revision || null,
      hasApplication: !!pcAny?.Application,
      hasGraphicsDevice: !!pcAny?.GraphicsDevice
    };
  } catch {
    return { available: false, version: null, hasApplication: false, hasGraphicsDevice: false };
  }
}

function collectGraphicsInfo(): DebugReport['graphics'] {
  const result: DebugReport['graphics'] = {
    webgl: { supported: false, contextType: null },
    webgpu: { supported: false }
  };
  try {
    const canvas = document.createElement('canvas');
    const ctx2 = canvas.getContext('webgl2', { antialias: true }) as any;
    const ctx = ctx2 || (canvas.getContext('webgl', { antialias: true }) as any) || (canvas.getContext('experimental-webgl', { antialias: true }) as any);
    if (ctx) {
      result.webgl.supported = true;
      result.webgl.contextType = (ctx2 ? 'webgl2' : 'webgl');
      try { result.webgl.attributes = (ctx.getContextAttributes && ctx.getContextAttributes()) || null; } catch {}
      try {
        const dbg = ctx.getExtension && ctx.getExtension('WEBGL_debug_renderer_info');
        const VENDOR = dbg && dbg.UNMASKED_VENDOR_WEBGL;
        const RENDERER = dbg && dbg.UNMASKED_RENDERER_WEBGL;
        result.webgl.info = {
          vendor: (VENDOR && ctx.getParameter(VENDOR)) || undefined,
          renderer: (RENDERER && ctx.getParameter(RENDERER)) || undefined,
          version: ctx.getParameter && ctx.getParameter(ctx.VERSION),
          shadingLanguageVersion: ctx.getParameter && ctx.getParameter(ctx.SHADING_LANGUAGE_VERSION)
        };
      } catch {}
      try {
        const params: any = {};
        const tryGet = (p: any, key: string) => {
          try { params[key] = Number(ctx.getParameter(p)); } catch {}
        };
        if (ctx.MAX_TEXTURE_SIZE) tryGet(ctx.MAX_TEXTURE_SIZE, 'maxTextureSize');
        if (ctx.MAX_TEXTURE_IMAGE_UNITS) tryGet(ctx.MAX_TEXTURE_IMAGE_UNITS, 'maxTextureImageUnits');
        if (ctx.MAX_CUBE_MAP_TEXTURE_SIZE) tryGet(ctx.MAX_CUBE_MAP_TEXTURE_SIZE, 'maxCubeMapSize');
        if (ctx.MAX_RENDERBUFFER_SIZE) tryGet(ctx.MAX_RENDERBUFFER_SIZE, 'maxRenderbufferSize');
        if (ctx.MAX_VARYING_VECTORS) tryGet(ctx.MAX_VARYING_VECTORS, 'maxVaryingVectors');
        result.webgl.parameters = params;
      } catch {}
      try { result.webgl.extensions = (ctx.getSupportedExtensions && ctx.getSupportedExtensions()) || undefined; } catch {}
    }
  } catch {}
  try { result.webgpu.supported = !!(safeNavigator() as any)?.gpu; } catch {}
  return result;
}

function collectDocumentInfo(): DebugReport['document'] {
  const doc: any = safeDocument();
  const out: DebugReport['document'] = {
    readyState: doc?.readyState || null,
    visibilityState: doc?.visibilityState || null,
    hidden: typeof doc?.hidden === 'boolean' ? !!doc.hidden : null,
    title: doc?.title || null,
    hasFocus: typeof doc?.hasFocus === 'function' ? !!doc.hasFocus() : null,
    activeElement: doc?.activeElement ? (doc.activeElement.tagName || doc.activeElement.nodeName || 'unknown') : null,
    scripts: [],
    stylesheets: [],
    canvas: []
  };
  try {
    const scripts = Array.from(doc?.scripts || []) as any[];
    out.scripts = scripts.map(s => s?.src || '[inline]');
  } catch {}
  try {
    const links = Array.from(doc?.querySelectorAll('link[rel="stylesheet"]') || []) as any[];
    out.stylesheets = links.map(l => l?.href || '');
  } catch {}
  try {
    const canvases = Array.from(doc?.getElementsByTagName('canvas') || []) as HTMLCanvasElement[];
    out.canvas = canvases.map(c => ({ id: c.id || null, width: (c as any)?.width ?? null, height: (c as any)?.height ?? null }));
  } catch {}
  return out;
}

async function collectNetworkInfo(): Promise<DebugReport['network']> {
  const n: any = safeNavigator();
  const out: DebugReport['network'] = {
    online: typeof n?.onLine === 'boolean' ? !!n.onLine : null,
    connection: null,
    serviceWorkers: undefined,
    caches: undefined,
    battery: null
  };
  try {
    if (n && n.connection) {
      out.connection = {
        effectiveType: n.connection.effectiveType,
        downlink: n.connection.downlink,
        rtt: n.connection.rtt,
        saveData: n.connection.saveData
      };
    }
  } catch {}
  try {
    if (n && n.getBattery) {
      const b = await n.getBattery();
      out.battery = { charging: !!b?.charging, level: typeof b?.level === 'number' ? b.level : undefined };
    }
  } catch { out.battery = { error: 'battery_unavailable' } as any; }
  try {
    if (n && n.serviceWorker && n.serviceWorker.getRegistrations) {
      const regs = await n.serviceWorker.getRegistrations();
      out.serviceWorkers = regs.map((r: any) => ({ scope: r.scope, state: r.active?.state || r.installing?.state || r.waiting?.state || 'unknown' }));
    }
  } catch { out.serviceWorkers = { error: 'sw_unavailable' } as any; }
  try {
    const cachesAny: any = (safeWindow() as any).caches;
    if (cachesAny && cachesAny.keys) {
      out.caches = await cachesAny.keys();
    }
  } catch { out.caches = { error: 'cache_unavailable' } as any; }
  return out;
}

async function collectIndexedDBSummary(): Promise<Array<{ name?: string; version?: number }> | { error: string }> {
  try {
    const anyIDB: any = (safeWindow() as any).indexedDB;
    if (anyIDB && typeof anyIDB.databases === 'function') {
      const dbs = await anyIDB.databases();
      return (dbs || []).map((d: any) => ({ name: d?.name, version: d?.version }));
    }
    return { error: 'indexeddb_list_unavailable' };
  } catch {
    return { error: 'indexeddb_error' };
  }
}

function collectMeta(): DebugReport['meta'] {
  const w: any = safeWindow();
  const doc: any = safeDocument();
  const nav: any = safeNavigator();
  let orientation: string | null = null;
  try { orientation = (screen as any)?.orientation?.type || (w?.orientation != null ? String(w.orientation) : null); } catch {}
  let screenInfo: any = null;
  try { screenInfo = { width: (screen as any)?.width, height: (screen as any)?.height, availWidth: (screen as any)?.availWidth, availHeight: (screen as any)?.availHeight }; } catch {}
  let tz: string | null = null;
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || null; } catch {}
  let reducedMotion: boolean | null = null;
  try { reducedMotion = typeof matchMedia !== 'undefined' ? !!matchMedia('(prefers-reduced-motion: reduce)').matches : null; } catch {}
  return {
    generatedAt: new Date().toISOString(),
    generatedAtEpochMs: Date.now(),
    buildVersion: (w && w.__BUILD_VERSION__) || null,
    assetKey: (w && w.__ASSET_KEY__) || null,
    url: (typeof location !== 'undefined') ? location.href : null,
    referrer: doc?.referrer || null,
    userAgent: (typeof navigator !== 'undefined') ? navigator.userAgent : null,
    languages: (typeof navigator !== 'undefined' && Array.isArray((navigator as any).languages)) ? (navigator as any).languages.slice() : null,
    viewport: (typeof window !== 'undefined') ? { width: window.innerWidth, height: window.innerHeight } : null,
    screen: screenInfo,
    devicePixelRatio: (typeof window !== 'undefined' && typeof window.devicePixelRatio === 'number') ? window.devicePixelRatio : null,
    deviceMemoryGb: (typeof (navigator as any)?.deviceMemory === 'number') ? (navigator as any).deviceMemory : null,
    hardwareConcurrency: (typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number') ? navigator.hardwareConcurrency : null,
    platform: nav?.platform || null,
    vendor: nav?.vendor || null,
    timezone: tz,
    colorScheme: (typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light',
    reducedMotion,
    orientation,
    crossOriginIsolated: typeof (w as any).crossOriginIsolated === 'boolean' ? (w as any).crossOriginIsolated : null,
    onLine: typeof (navigator as any)?.onLine === 'boolean' ? (navigator as any).onLine : null
  };
}

export async function collectDebugReport(): Promise<DebugReport> {
  const meta = collectMeta();
  const overlay = (LoadingOverlay as any).getDebugState?.() ?? { error: 'no_overlay' };
  const storageBasic = collectStorage();
  let cookies: string | null = null;
  try { cookies = typeof document !== 'undefined' ? document.cookie || '' : null; } catch { cookies = null; }
  const [indexedDbSummary, networkInfo] = await Promise.all([
    collectIndexedDBSummary(),
    collectNetworkInfo()
  ]);
  const performanceInfo = collectPerformance();
  const playcanvas = collectPlayCanvasSummary();
  const graphics = collectGraphicsInfo();
  const docInfo = collectDocumentInfo();
  let env: DebugReport['env'] = { } as any;
  try { env.importMetaEnv = (import.meta as any)?.env; } catch {}
  try { env.processEnv = (typeof (window as any)?.process?.env !== 'undefined') ? (window as any).process.env : undefined; } catch {}
  try {
    const w: any = safeWindow();
    env.globals = {
      __BUILD_VERSION__: w.__BUILD_VERSION__,
      __ASSET_KEY__: w.__ASSET_KEY__,
      __DEBUG_REPORT_DOWNLOADED__: w.__DEBUG_REPORT_DOWNLOADED__,
      __DEBUG_REPORT_SCHEDULED__: w.__DEBUG_REPORT_SCHEDULED__
    };
  } catch {}
  const report: DebugReport = {
    meta,
    env,
    document: docInfo,
    graphics,
    playcanvas,
    overlay,
    storage: { ...storageBasic, cookies, indexedDB: indexedDbSummary },
    network: networkInfo,
    performance: performanceInfo
  };
  return report;
}

function downloadBlob(filename: string, blob: Blob): void {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try { document.body.removeChild(a); } catch {}
      try { URL.revokeObjectURL(url); } catch {}
    }, 0);
  } catch {}
}

export async function downloadDebugReport(trigger: 'auto' | 'manual' = 'auto'): Promise<void> {
  try {
    const already = (safeWindow() as any).__DEBUG_REPORT_DOWNLOADED__;
    if (trigger === 'auto' && already) return;
    const report = await collectDebugReport();
    const pretty = JSON.stringify(report, null, 2);
    const blob = new Blob([pretty], { type: 'application/json' });
    const version = report.meta.buildVersion || 'dev';
    const ts = new Date(report.meta.generatedAtEpochMs).toISOString().replace(/[:.]/g, '-');
    const filename = `sf3-debug-${version}-${ts}.json`;
    downloadBlob(filename, blob);
    (safeWindow() as any).__DEBUG_REPORT_DOWNLOADED__ = true;
  } catch {}
}

export function scheduleAutoDebugReportDownload(delayMs: number = 250): void {
  try {
    if ((safeWindow() as any).__DEBUG_REPORT_SCHEDULED__) return;
    (safeWindow() as any).__DEBUG_REPORT_SCHEDULED__ = true;
    setTimeout(() => { downloadDebugReport('auto'); }, Math.max(0, delayMs));
  } catch {}
}

