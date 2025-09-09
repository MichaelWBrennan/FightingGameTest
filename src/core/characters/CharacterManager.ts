
import * as pc from 'playcanvas';
import { Character, CharacterConfig } from '../../../types/character';
import { Logger } from '../utils/Logger';
import { PreloadManager } from '../utils/PreloadManager';
import { DecompDataService } from '../utils/DecompDataService';
import { ProceduralFrameGenerator } from '../procgen/ProceduralFrameGenerator';

export class CharacterManager {
  private app: pc.Application;
  private characters = new Map<string, Character>();
  private characterConfigs = new Map<string, CharacterConfig>();
  private activeCharacters: Character[] = [];
  private preloader: PreloadManager | null = null;
  private frameGen: ProceduralFrameGenerator = new ProceduralFrameGenerator();
  private decomp: DecompDataService | null = null;

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
        try { this.decomp = services.resolve('decomp') as DecompDataService; } catch {}
      }
    } catch {}
    await this.loadCharacterConfigs();
    Logger.info('Character manager initialized');
  }

  private async loadCharacterConfigs(): Promise<void> {
    const fetchJson = async (path: string) => {
      try {
        if (this.preloader) return await this.preloader.getJson<any>(path);
        const r = await fetch(path, { cache: 'no-store' });
        return await r.json();
      } catch (e) {
        throw e;
      }
    };
    // Prefer a consolidated database file if available
    try {
      try { (await import('../ui/LoadingOverlay')).LoadingOverlay.beginTask('characters_db', 'Loading characters db', 3); } catch {}
      const db = await fetchJson('/data/characters_db.json');
      if (db) {
        const keys = Object.keys(db);
        let processed = 0;
        for (const key of keys) {
          let cfg = this.normalizeCharacterConfig(db[key] as CharacterConfig);
          cfg = this.frameGen.generateForCharacter(cfg);
          this.characterConfigs.set(key, cfg);
          processed++;
          try { (await import('../ui/LoadingOverlay')).LoadingOverlay.updateTask('characters_db', processed / Math.max(1, keys.length), `Loading characters db (${processed}/${keys.length})`); } catch {}
        }
        Logger.info(`Loaded ${keys.length} characters from consolidated database`);
        try { (await import('../ui/LoadingOverlay')).LoadingOverlay.endTask('characters_db', true); } catch {}
        return;
      }
    } catch (e) {
      Logger.warn('Consolidated character database not found; falling back to individual files');
      try { (await import('../ui/LoadingOverlay')).LoadingOverlay.endTask('characters_db', false); } catch {}
    }

    // Fallback to individual files
    const characterNames = ['ryu', 'ken', 'chun_li', 'sagat', 'zangief'];
    try { (await import('../ui/LoadingOverlay')).LoadingOverlay.beginTask('characters_files', 'Loading character files', characterNames.length || 1); } catch {}
    let processed = 0;
    for (const name of characterNames) {
      try {
        const rawConfig: CharacterConfig = await fetchJson(`/data/characters/${name}.json`);
        let config = this.normalizeCharacterConfig(rawConfig);
        config = this.frameGen.generateForCharacter(config);
        this.characterConfigs.set(name, config);
        Logger.info(`Loaded character config: ${name}`);
      } catch (error) {
        Logger.error(`Failed to load character ${name}:`, error);
      }
      processed++;
      try { (await import('../ui/LoadingOverlay')).LoadingOverlay.updateTask('characters_files', processed / Math.max(1, characterNames.length), `Loading character files (${processed}/${characterNames.length})`); } catch {}
    }
    try { (await import('../ui/LoadingOverlay')).LoadingOverlay.endTask('characters_files', true); } catch {}

    // Optionally load a ground-truth seed from decomp import if present, or derive at runtime
    try {
      let cfg: CharacterConfig | null = null;
      try {
        cfg = (await fetchJson('/data/characters_decomp/sf3_ground_truth_seed.json')) as CharacterConfig;
      } catch {}
      if (!cfg && this.decomp) cfg = (await this.decomp.deriveFromDecompIfAvailable()) as CharacterConfig | null;
      if (cfg) {
        const norm = this.normalizeCharacterConfig(cfg);
        const finalCfg = this.frameGen.generateForCharacter(norm);
        this.characterConfigs.set(cfg.characterId || 'sf3_ground_truth_seed', finalCfg);
        Logger.info('Loaded ground-truth character seed');
      }
    } catch {}
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
    // Entitlement gating (player-respecting monetization)
    try {
      const services = (this.app as any)._services as any;
      const entitlement = services?.resolve?.('entitlement');
      if (entitlement && !entitlement.hasCharacterAccess?.(characterId, 'casual')) {
        Logger.warn(`Access denied by entitlements for character: ${characterId}`);
        return null;
      }
    } catch {}

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
