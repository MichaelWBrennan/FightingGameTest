
import { GameEngine } from './core/GameEngine';
import { LoadingOverlay } from './core/ui/LoadingOverlay';
import { Logger } from './core/utils/Logger';
import * as pc from 'playcanvas';

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
  await engine.initialize();
  LoadingOverlay.complete();
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
