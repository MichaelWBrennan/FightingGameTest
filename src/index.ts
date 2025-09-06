
import { GameEngine } from './core/GameEngine';
import { Logger } from './core/utils/Logger';
import * as pc from 'playcanvas';

async function defaultStart(canvas: HTMLCanvasElement | null): Promise<void> {
  const targetCanvas = canvas || createCanvas();
  const engine = new GameEngine(targetCanvas);
  Logger.info('Starting Street Fighter III: 3rd Strike - PlayCanvas Edition');
  await engine.initialize();
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
