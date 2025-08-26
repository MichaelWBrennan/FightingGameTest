
import * as pc from 'playcanvas';
import { Character, CharacterConfig } from '../../types/character';
import { Logger } from '../utils/Logger';

export class CharacterManager {
  private app: pc.Application;
  private characters = new Map<string, Character>();
  private characterConfigs = new Map<string, CharacterConfig>();
  private activeCharacters: Character[] = [];

  constructor(app: pc.Application) {
    this.app = app;
  }

  public async initialize(): Promise<void> {
    await this.loadCharacterConfigs();
    Logger.info('Character manager initialized');
  }

  private async loadCharacterConfigs(): Promise<void> {
    const characterNames = ['ryu', 'ken', 'chun_li', 'sagat', 'zangief'];
    
    for (const name of characterNames) {
      try {
        const response = await fetch(`/data/characters/${name}.json`);
        const config: CharacterConfig = await response.json();
        this.characterConfigs.set(name, config);
        Logger.info(`Loaded character config: ${name}`);
      } catch (error) {
        Logger.error(`Failed to load character ${name}:`, error);
      }
    }
  }

  public createCharacter(characterId: string, position: pc.Vec3): Character | null {
    const config = this.characterConfigs.get(characterId);
    if (!config) {
      Logger.error(`Character config not found: ${characterId}`);
      return null;
    }

    const characterEntity = new pc.Entity(characterId);
    characterEntity.setPosition(position);
    
    const character: Character = {
      id: characterId,
      entity: characterEntity,
      config: config,
      health: config.stats.health,
      meter: 0,
      state: 'idle',
      currentMove: null,
      frameData: {
        startup: 0,
        active: 0,
        recovery: 0,
        advantage: 0
      }
    };

    this.characters.set(characterId, character);
    this.app.root.addChild(characterEntity);
    
    Logger.info(`Created character: ${characterId}`);
    return character;
  }

  public getCharacter(characterId: string): Character | undefined {
    return this.characters.get(characterId);
  }

  public setActiveCharacters(player1Id: string, player2Id: string): void {
    const p1 = this.characters.get(player1Id);
    const p2 = this.characters.get(player2Id);
    
    if (p1 && p2) {
      this.activeCharacters = [p1, p2];
      Logger.info(`Active characters set: ${player1Id} vs ${player2Id}`);
    }
  }

  public getActiveCharacters(): Character[] {
    return this.activeCharacters;
  }

  public update(deltaTime: number): void {
    for (const character of this.activeCharacters) {
      this.updateCharacterState(character, deltaTime);
    }
  }

  private updateCharacterState(character: Character, deltaTime: number): void {
    // Update character animation, physics, and state
    // This will be expanded based on your specific needs
  }

  public getAvailableCharacters(): string[] {
    return Array.from(this.characterConfigs.keys());
  }
}
