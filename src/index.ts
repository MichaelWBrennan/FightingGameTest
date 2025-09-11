
import { GameEngine } from './core/GameEngine';
import { LoadingOverlay } from './core/ui/LoadingOverlay';
import { Logger } from './core/utils/Logger';
import * as pc from 'playcanvas';

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
  LoadingOverlay.enableNetworkTracking();
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
    Logger.error('PlayCanvas engine failed to load', e as any);
    throw e;
  }
  LoadingOverlay.beginTask('engine_create', 'Creating engine', 1);
  let engine: GameEngine;
  try {
    engine = new GameEngine(targetCanvas);
    LoadingOverlay.endTask('engine_create', true);
  } catch (e) {
    try { LoadingOverlay.endTask('engine_create', false); } catch {}
    Logger.error('Engine creation failed', e as any);
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
  // Inject CDN script if not present
  try {
    const hasScript = !!document.querySelector('script[src*="code.playcanvas.com"]');
    if (!hasScript) {
      const script = document.createElement('script');
      script.src = 'https://code.playcanvas.com/1.65.3/playcanvas.min.js';
      // Ensure execution order
      (script as any).defer = false;
      (script as any).async = false;
      document.head.appendChild(script);
    }
  } catch {}
  await new Promise<void>((resolve, reject) => {
    const start = Date.now();
    (function tick() {
      if (isReady()) { resolve(); return; }
      if (Date.now() - start > timeoutMs) { reject(new Error('Timed out waiting for PlayCanvas')); return; }
      setTimeout(tick, 50);
    })();
  });
}

export { defaultStart };
