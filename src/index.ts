
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
  LoadingOverlay.beginTask('engine_create', 'Creating engine', 1);
  const engine = new GameEngine(targetCanvas);
  LoadingOverlay.endTask('engine_create', true);
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

export { defaultStart };
