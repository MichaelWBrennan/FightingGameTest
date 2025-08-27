
import { GameEngine } from './core/GameEngine';
import { Logger } from './core/utils/Logger';
import * as pc from 'playcanvas';

async function defaultStart(canvas: HTMLCanvasElement | null): Promise<void> {
  const targetCanvas = canvas || (document.getElementById('application-canvas') as HTMLCanvasElement);
  const engine = new GameEngine(targetCanvas);
  Logger.info('Starting Street Fighter III: 3rd Strike - PlayCanvas Edition');
  await engine.initialize();

  const characterManager = engine.getCharacterManager();
  const ryu = characterManager.createCharacter('ryu', new pc.Vec3(-2, 0, 0));
  const ken = characterManager.createCharacter('ken', new pc.Vec3(2, 0, 0));
  if (ryu && ken) {
    characterManager.setActiveCharacters('ryu', 'ken');
  }
}

export { defaultStart };
