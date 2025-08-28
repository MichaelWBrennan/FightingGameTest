
import * as pc from 'playcanvas';
import { Character, CharacterConfig } from '../../../types/character';
import { Logger } from '../utils/Logger';
import { PreloadManager } from '../utils/PreloadManager';
import { ProceduralFrameGenerator } from '../procgen/ProceduralFrameGenerator';

export class CharacterManager {
  private app: pc.Application;
  private characters = new Map<string, Character>();
  private characterConfigs = new Map<string, CharacterConfig>();
  private activeCharacters: Character[] = [];
  private preloader: PreloadManager | null = null;
  private frameGen: ProceduralFrameGenerator = new ProceduralFrameGenerator();

  constructor(app: pc.Application) {
    this.app = app;
  }

  public async initialize(): Promise<void> {
    try {
      // Attempt to resolve preloader from global services if present
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const services = (this.app as any)._services as any;
      if (services && services.resolve) {
        this.preloader = services.resolve('preloader') as PreloadManager;
      }
    } catch {}
    await this.loadCharacterConfigs();
    Logger.info('Character manager initialized');
  }

  private async loadCharacterConfigs(): Promise<void> {
    // Prefer a consolidated database file if available
    try {
      const dbResponse = await fetch('/data/characters_db.json');
      if (dbResponse.ok) {
        const db = await dbResponse.json();
        const keys = Object.keys(db);
        for (const key of keys) {
          let cfg = this.normalizeCharacterConfig(db[key] as CharacterConfig);
          cfg = this.frameGen.generateForCharacter(cfg);
          this.characterConfigs.set(key, cfg);
        }
        Logger.info(`Loaded ${keys.length} characters from consolidated database`);
        return;
      }
    } catch (e) {
      Logger.warn('Consolidated character database not found; falling back to individual files');
    }

    // Fallback to individual files
    const characterNames = ['ryu', 'ken', 'chun_li', 'sagat', 'zangief'];
    for (const name of characterNames) {
      try {
        const response = await fetch(`/data/characters/${name}.json`);
        const rawConfig: CharacterConfig = await response.json();
        let config = this.normalizeCharacterConfig(rawConfig);
        config = this.frameGen.generateForCharacter(config);
        this.characterConfigs.set(name, config);
        Logger.info(`Loaded character config: ${name}`);
      } catch (error) {
        Logger.error(`Failed to load character ${name}:`, error);
      }
    }
  }

  private normalizeCharacterConfig(config: CharacterConfig): CharacterConfig {
    // Ensure stats exist with required fields using top-level fallbacks
    const normalizedStats = {
      health: (config as any).stats?.health ?? (config as any).health ?? 1000,
      walkSpeed: (config as any).stats?.walkSpeed ?? (config as any).walkSpeed ?? 2
    } as any;

    // Flatten nested move groups like { moves: { normals: { ... }, specials: { ... } } }
    let flattenedMoves: Record<string, any> | undefined = undefined;
    const movesAny = (config as any).moves as any;
    if (movesAny && typeof movesAny === 'object') {
      const groups = ['normals', 'specials', 'supers', 'throws', 'unique'];
      flattenedMoves = {};
      for (const key of Object.keys(movesAny)) {
        if (groups.includes(key) && movesAny[key] && typeof movesAny[key] === 'object') {
          Object.assign(flattenedMoves, movesAny[key]);
        } else if (movesAny[key] && typeof movesAny[key] === 'object') {
          // Top-level moves already
          flattenedMoves[key] = movesAny[key];
        }
      }
    }

    const normalized = {
      ...config,
      stats: normalizedStats,
      moves: flattenedMoves ?? (config as any).moves
    } as CharacterConfig as any;

    return normalized;
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
