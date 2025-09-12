
import { GameEngine } from './core/GameEngine';
import { LoadingOverlay } from './core/ui/LoadingOverlay';
import { Logger, LogLevel, LogSink } from './core/utils/Logger';
import * as pc from 'playcanvas';

// Wire LoadingOverlay as a sink for real-time, user-facing logs
const overlaySink: LogSink = {
  log(event) {
    try {
      const level = event.level === LogLevel.ERROR ? 'error'
        : event.level === LogLevel.WARN ? 'warn'
        : event.level === LogLevel.DEBUG ? 'debug'
        : 'info';
      const parts: string[] = [];
      parts.push(String(event.message ?? ''));
      for (const arg of event.args || []) {
        try {
          if (arg == null) { parts.push(String(arg)); continue; }
          if (typeof arg === 'string') { parts.push(arg); continue; }
          if (arg instanceof Error) { parts.push(arg.stack || arg.message); continue; }
          const isDom = typeof Node !== 'undefined' && arg instanceof Node;
          parts.push(isDom ? '[DOM Node]' : JSON.stringify(arg, (_k, v) => typeof v === 'bigint' ? String(v) : v));
        } catch {
          try { parts.push(String(arg)); } catch {}
        }
      }
      const msg = parts.filter(Boolean).join(' ');
      LoadingOverlay.log(msg, level as any);
    } catch {}
  }
};
try { Logger.registerSink(overlaySink); } catch {}

// Forward global runtime errors to the overlay log
if (typeof window !== 'undefined') {
  try {
    window.addEventListener('error', (e) => {
      try {
        const meta = e && (e.filename ? ` @ ${e.filename}:${e.lineno}:${e.colno}` : '');
        const msg = (e as any)?.error?.stack || e?.message || 'Unknown error';
        LoadingOverlay.log(`Runtime error: ${msg}${meta || ''}`, 'error');
      } catch {}
    });
    window.addEventListener('unhandledrejection', (e) => {
      try {
        const r: any = (e as any)?.reason;
        const msg = (r && (r.stack || r.message)) ? (r.stack || r.message) : String(r);
        LoadingOverlay.log(`Unhandled rejection: ${msg}`, 'error');
      } catch {}
    });
  } catch {}
}

function isInstantMode(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    const val = (params.get('instant') || '').toLowerCase();
    if (val && ['1', 'true', 'on', 'yes', 'fast'].includes(val)) return true;
    const ls = localStorage.getItem('sf3_instant') || '';
    return ['1', 'true', 'on', 'yes', 'fast'].includes(ls.toLowerCase());
  } catch {
    return false;
  }
}

async function defaultStart(canvas: HTMLCanvasElement | null): Promise<void> {
  LoadingOverlay.initialize();
  try { LoadingOverlay.enableNetworkTracking(); } catch {}
  LoadingOverlay.beginTask('prepare', 'Preparing renderer', 1);
  const targetCanvas = canvas || createCanvas();
  LoadingOverlay.endTask('prepare', true);
  // Ensure PlayCanvas engine library is available before creating the app
  try {
    LoadingOverlay.beginTask('pc_lib', 'Loading PlayCanvas engine', 1);
    await ensurePlayCanvasLoaded();
    LoadingOverlay.endTask('pc_lib', true);
  } catch (e) {
    try { LoadingOverlay.endTask('pc_lib', false); } catch {}
    try {
      const diag = (LoadingOverlay as any).getDebugState?.() ?? {};
      Logger.error('PlayCanvas engine failed to load', { error: e as any, overlay: diag });
    } catch {
      Logger.error('PlayCanvas engine failed to load', e as any);
    }
    throw e;
  }
  LoadingOverlay.beginTask('engine_create', 'Creating engine', 1);
  let engine: GameEngine;
  try {
    engine = new GameEngine(targetCanvas);
    LoadingOverlay.endTask('engine_create', true);
  } catch (e) {
    try { LoadingOverlay.endTask('engine_create', false); } catch {}
    try {
      const diag = (LoadingOverlay as any).getDebugState?.() ?? {};
      const env = {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'n/a',
        url: typeof location !== 'undefined' ? location.href : 'n/a',
        canvas: {
          width: (targetCanvas as any)?.width,
          height: (targetCanvas as any)?.height,
          id: (targetCanvas as any)?.id
        },
        playcanvas: {
          available: !!((globalThis as any).pc),
          version: (globalThis as any).pc?.revision || (pc as any)?.revision || 'unknown'
        },
        instantMode: isInstantMode()
      };
      Logger.error('Engine creation failed', { error: e as any, overlay: diag, env });
    } catch {
      Logger.error('Engine creation failed', e as any);
    }
    throw e;
  }
  Logger.info('Starting Street Fighter III: 3rd Strike - PlayCanvas Edition');
  const instant = isInstantMode();
  if (instant) {
    // Initialize in background and hide overlay instantly
    engine.initialize().catch((err: unknown) => {
      try { Logger.error('Background initialization failed', err as any); } catch {}
    });
    LoadingOverlay.complete(true);
  } else {
    await engine.initialize();
    LoadingOverlay.complete();
  }
}

function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.id = 'application-canvas';
  Object.assign(canvas.style, {
    width: '100vw',
    height: '100vh',
    display: 'block',
    background: '#000',
    position: 'fixed',
    inset: '0'
  } as CSSStyleDeclaration);
  document.body.appendChild(canvas);
  return canvas;
}

async function ensurePlayCanvasLoaded(timeoutMs: number = 15000): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const isReady = () => {
    const pcAny = (globalThis as any).pc;
    return !!(pcAny && typeof pcAny.Application === 'function');
  };
  if (isReady()) return;
  const sources: string[] = [
    'https://code.playcanvas.com/1.65.3/playcanvas.min.js',
    'https://cdn.jsdelivr.net/npm/playcanvas@1.65.3/build/playcanvas.min.js',
    'https://unpkg.com/playcanvas@1.65.3/build/playcanvas.min.js'
  ];
  let lastError: any = null;
  const log = (msg: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info') => {
    try { LoadingOverlay.log(msg, level); } catch {}
  };
  const loadFrom = (src: string) => new Promise<void>((resolve, reject) => {
    try {
      const script = document.createElement('script');
      script.src = src;
      (script as any).async = true;
      (script as any).defer = false;
      (script as any).crossOrigin = 'anonymous';
      script.addEventListener('load', () => resolve());
      script.addEventListener('error', (e) => {
        lastError = e || new Error('Script load error: ' + src);
        log('PlayCanvas load error: ' + src, 'warn');
        reject(lastError);
      });
      document.head.appendChild(script);
    } catch (e) {
      lastError = e;
      reject(e as any);
    }
  });
  const existing = (document.querySelector('script[src*="code.playcanvas.com"]') as HTMLScriptElement | null)?.src;
  const orderedSources = existing ? [existing, ...sources.filter(s => s !== existing)] : sources.slice();
  const overallStart = Date.now();
  for (const src of orderedSources) {
    if (isReady()) break;
    try {
      log('Attempting to load PlayCanvas: ' + src, 'debug');
      await loadFrom(src);
    } catch {}
    const attemptStart = Date.now();
    while (!isReady() && Date.now() - attemptStart < 4000) {
      await new Promise(r => setTimeout(r, 50));
    }
    if (isReady()) break;
  }
  if (!isReady()) {
    const remaining = Math.max(0, timeoutMs - (Date.now() - overallStart));
    const endStart = Date.now();
    while (!isReady() && Date.now() - endStart < remaining) {
      await new Promise(r => setTimeout(r, 50));
    }
  }
  if (!isReady()) {
    throw lastError || new Error('Timed out waiting for PlayCanvas');
  }
}

export { defaultStart };
