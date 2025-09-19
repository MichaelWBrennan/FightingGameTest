
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

  /**
   * Ultra-fast initialization that avoids network fetches and seeds minimal
   * built-in configurations for a small default roster so gameplay can start
   * immediately. Heavier configs can load later and replace these.
   */
  public async initializeLite(defaultRoster: string[] = ['ryu', 'ken']): Promise<void> {
    try {
      const services = (this.app as any)._services as any;
      if (services && services.resolve) {
        try { this.decomp = services.resolve('decomp') as DecompDataService; } catch {}
      }
    } catch {}
    this.seedMinimalCharacters(defaultRoster);
    Logger.info(`Character manager initialized (lite) with ${defaultRoster.join(', ')}`);
  }

  /**
   * Inserts minimal character configs for the provided ids, if not already loaded.
   */
  public seedMinimalCharacters(ids: string[]): void {
    for (const id of ids) {
      if (!this.characterConfigs.has(id)) {
        const cfg = this.generateMinimalConfig(id);
        const finalCfg = this.frameGen.generateForCharacter(cfg);
        this.characterConfigs.set(id, finalCfg);
      }
    }
  }

  private async loadCharacterConfigs(): Promise<void> {
    const fetchJson = async (path: string) => {
      try {
        if (this.preloader) return await this.preloader.getJson<any>(path);
        const ver = (typeof window !== 'undefined' && (window as any).__BUILD_VERSION__) ? (window as any).__BUILD_VERSION__ : 'dev';
        const sep = path.includes('?') ? '&' : '?';
        const r = await fetch(`${path}${sep}v=${encodeURIComponent(String(ver))}`);
        return await r.json();
      } catch (e) {
        throw e;
      }
    };
    // Prefer a consolidated database file if available
    try {
      try { (await import('../ui/LoadingOverlay')).LoadingOverlay.beginTask('characters_db', 'Loading characters db', 3); } catch {}
      try { (await import('../ui/LoadingOverlay')).LoadingOverlay.log('[characters] fetching /data/characters_db.json', 'info'); } catch {}
      const db = await fetchJson('/data/characters_db.json');
      if (db) {
        const keys = Object.keys(db);
        let processed = 0;
        for (const key of keys) {
          try { (await import('../ui/LoadingOverlay')).LoadingOverlay.log(`[characters] db entry ${key}`, 'debug'); } catch {}
          let cfg = this.normalizeCharacterConfig(db[key] as CharacterConfig);
          cfg = this.frameGen.generateForCharacter(cfg);
          this.characterConfigs.set(key, cfg);
          processed++;
          try { (await import('../ui/LoadingOverlay')).LoadingOverlay.updateTask('characters_db', processed / Math.max(1, keys.length), `Loading characters db (${processed}/${keys.length})`); } catch {}
        }
        Logger.info(`Loaded ${keys.length} characters from consolidated database`);
        try { (await import('../ui/LoadingOverlay')).LoadingOverlay.log(`[characters] loaded db (${keys.length} entries)`, 'info'); } catch {}
        try { (await import('../ui/LoadingOverlay')).LoadingOverlay.endTask('characters_db', true); } catch {}
        return;
      }
    } catch (e) {
      Logger.warn('Consolidated character database not found; falling back to individual files');
      try { (await import('../ui/LoadingOverlay')).LoadingOverlay.log('[characters] db not found, falling back to individual files', 'warn'); } catch {}
      try { (await import('../ui/LoadingOverlay')).LoadingOverlay.endTask('characters_db', false); } catch {}
    }

    // Fallback to individual files
    const characterNames = ['ryu', 'ken', 'chun_li', 'sagat', 'zangief'];
    try { (await import('../ui/LoadingOverlay')).LoadingOverlay.beginTask('characters_files', 'Loading character files', characterNames.length || 1); } catch {}
    let processed = 0;
    for (const name of characterNames) {
      try {
        try { (await import('../ui/LoadingOverlay')).LoadingOverlay.log(`[characters] fetching /data/characters/${name}.json`, 'info'); } catch {}
        const rawConfig: CharacterConfig = await fetchJson(`/data/characters/${name}.json`);
        let config = this.normalizeCharacterConfig(rawConfig);
        config = this.frameGen.generateForCharacter(config);
        this.characterConfigs.set(name, config);
        Logger.info(`Loaded character config: ${name}`);
        try { (await import('../ui/LoadingOverlay')).LoadingOverlay.log(`[characters] ok ${name}`, 'info'); } catch {}
      } catch (error) {
        Logger.error(`Failed to load character ${name}:`, error);
        try { (await import('../ui/LoadingOverlay')).LoadingOverlay.log(`[characters] failed ${name}: ${(error as any)?.message || String(error)}`, 'error'); } catch {}
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

  private generateMinimalConfig(characterId: string): CharacterConfig {
    // Create a tiny, self-contained config sufficient for spawning and moving
    const baseStats = {
      health: 1000,
      walkSpeed: 150
    } as any;
    const basicMoves: Record<string, any> = {
      light_punch: { damage: 30, startup: 4, active: 2, recovery: 8, blockAdvantage: -1, hitAdvantage: 1 },
      heavy_punch: { damage: 90, startup: 10, active: 3, recovery: 16, blockAdvantage: -4, hitAdvantage: 2 },
      light_kick: { damage: 25, startup: 3, active: 2, recovery: 7, blockAdvantage: 0, hitAdvantage: 1 }
    };
    const cfg = {
      characterId,
      name: characterId.toUpperCase(),
      displayName: characterId.replace(/_/g, ' '),
      archetype: 'shoto',
      spritePath: '',
      health: baseStats.health,
      walkSpeed: baseStats.walkSpeed,
      dashSpeed: 300,
      jumpHeight: 380,
      stats: baseStats,
      complexity: 'easy',
      strengths: ['fundamentals'],
      weaknesses: ['specialization'],
      uniqueMechanics: ['hadoken'],
      moves: basicMoves
    } as unknown as CharacterConfig;
    return cfg;
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

    let config = this.characterConfigs.get(characterId);
    if (!config) {
      // Fallback to a minimal built-in config for instant play
      config = this.generateMinimalConfig(characterId);
      const finalCfg = this.frameGen.generateForCharacter(config);
      this.characterConfigs.set(characterId, finalCfg);
      config = finalCfg;
      Logger.warn(`Character config not found on disk; using minimal fallback for: ${characterId}`);
    }

    const characterEntity = new pc.Entity(characterId);
    characterEntity.setPosition(position);

    // Ensure the character is visible even before sprite systems attach
    // Add a simple billboarded plane with a rim-lit material as a placeholder
    try {
      const placeholder = new pc.Entity(`${characterId}_placeholder`);
      // Create a simple unlit material as a fallback immediately; upgrade to rim later
      const basicMat = new pc.StandardMaterial();
      basicMat.useLighting = false;
      basicMat.diffuse = new pc.Color(0.9, 0.9, 0.9);
      basicMat.update();
      placeholder.addComponent('render', { type: 'plane', material: basicMat as unknown as pc.Material });
      placeholder.setLocalScale(1.2, 1.8, 1);
      // Upgrade to rim-lit when shaders util is loaded
      import('../graphics/ShaderUtils').then(({ ShaderUtils }) => {
        try {
          const rimMat = ShaderUtils.createRimLightingMaterial(this.app);
          placeholder.render!.material = rimMat as unknown as pc.Material;
        } catch {}
      }).catch(() => {});
      characterEntity.addChild(placeholder);

      // Billboard toward the main camera every frame
      const app = this.app;
      const onUpdate = (dt: number) => {
        try {
          const camera = app.root.findByName('MainCamera');
          if (camera && placeholder) {
            placeholder.lookAt(camera.getPosition());
          }
        } catch {}
      };
      // Attach and remember handler so entity cleanup is safe
      (placeholder as any)._billboardHandler = onUpdate;
      this.app.on('update', onUpdate);
      // Remove update handler when entity is destroyed
      placeholder.on('destroy', () => {
        try { this.app.off('update', (placeholder as any)._billboardHandler); } catch {}
      });
    } catch {}
    
    const character: Character = {
      id: characterId,
      entity: characterEntity,
      config: config,
      health: config.stats.health,
      maxHealth: config.stats.health,
      meter: 0,
      state: 'idle',
      currentMove: null,
      frameData: {
        startup: 0,
        active: 0,
        recovery: 0,
        advantage: 0
      },
      facing: 1,
      guardMeter: 100
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

  public removeCharacter(characterId: string): void {
    const character = this.characters.get(characterId);
    if (!character) return;
    try {
      if (character.entity && character.entity.parent) {
        character.entity.parent.removeChild(character.entity);
      }
    } catch {}
    try { character.entity.destroy(); } catch {}
    this.characters.delete(characterId);
    this.activeCharacters = this.activeCharacters.filter(c => c.id !== characterId);
    Logger.info(`Removed character: ${characterId}`);
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
