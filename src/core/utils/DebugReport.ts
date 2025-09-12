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
    deviceMemoryGb: number | null;
    hardwareConcurrency: number | null;
    colorScheme: string | null;
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
  };
  performance: {
    timeOrigin: number | null;
    nowMs: number | null;
    navigationType: string | null;
    memory: { jsHeapSizeLimit?: number; totalJSHeapSize?: number; usedJSHeapSize?: number } | null;
    resourcesSample: Array<{ name: string; initiatorType?: string; duration?: number; transferSize?: number; decodedBodySize?: number; encodedBodySize?: number }>;
  };
  errors?: Array<{ message: string; filename?: string; lineno?: number; colno?: number }>; // reserved, not used yet
};

function safeWindow(): any {
  try { return window as any; } catch { return {}; }
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
    const sample = entries.slice(-300); // keep report small
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
  return {
    timeOrigin: typeof performance !== 'undefined' ? performance.timeOrigin : null,
    nowMs: typeof performance !== 'undefined' ? performance.now() : null,
    navigationType,
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

export async function collectDebugReport(): Promise<DebugReport> {
  const w: any = safeWindow();
  const doc: any = (typeof document !== 'undefined') ? document : null;
  const meta: DebugReport['meta'] = {
    generatedAt: new Date().toISOString(),
    generatedAtEpochMs: Date.now(),
    buildVersion: (w && w.__BUILD_VERSION__) || null,
    assetKey: (w && w.__ASSET_KEY__) || null,
    url: (typeof location !== 'undefined') ? location.href : null,
    referrer: doc?.referrer || null,
    userAgent: (typeof navigator !== 'undefined') ? navigator.userAgent : null,
    languages: (typeof navigator !== 'undefined' && Array.isArray((navigator as any).languages)) ? (navigator as any).languages.slice() : null,
    viewport: (typeof window !== 'undefined') ? { width: window.innerWidth, height: window.innerHeight } : null,
    deviceMemoryGb: (typeof (navigator as any)?.deviceMemory === 'number') ? (navigator as any).deviceMemory : null,
    hardwareConcurrency: (typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number') ? navigator.hardwareConcurrency : null,
    colorScheme: (typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light'
  };
  const overlay = (LoadingOverlay as any).getDebugState?.() ?? { error: 'no_overlay' };
  const storage = collectStorage(/^(sf3_|pc_|playcanvas|debug|__.*)$/i);
  const performanceInfo = collectPerformance();
  const playcanvas = collectPlayCanvasSummary();
  const report: DebugReport = { meta, overlay, storage, performance: performanceInfo, playcanvas };
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

