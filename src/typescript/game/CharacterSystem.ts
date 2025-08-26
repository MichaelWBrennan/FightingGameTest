
/**
 * Street Fighter III Character System
 * Converted from character-related C files
 */

export interface CharacterData {
  id: number;
  name: string;
  health: number;
  maxHealth: number;
  meter: number;
  maxMeter: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  facing: 'left' | 'right';
  state: string;
  animation: string;
  frameIndex: number;
}

export interface MoveData {
  name: string;
  input: string[];
  damage: number;
  startup: number;
  active: number;
  recovery: number;
  blockstun: number;
  hitstun: number;
}

export class SF3CharacterSystem {
  private characters: Map<number, CharacterData> = new Map();
  private movesets: Map<string, MoveData[]> = new Map();

  constructor() {
    this.initializeCharacters();
    this.initializeMovesets();
  }

  private initializeCharacters(): void {
    // Ryu
    this.createCharacter({
      id: 0,
      name: 'Ryu',
      health: 1000,
      maxHealth: 1000,
      meter: 0,
      maxMeter: 100,
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      facing: 'right',
      state: 'idle',
      animation: 'idle',
      frameIndex: 0
    });

    // Ken
    this.createCharacter({
      id: 1,
      name: 'Ken',
      health: 1000,
      maxHealth: 1000,
      meter: 0,
      maxMeter: 100,
      position: { x: 200, y: 0 },
      velocity: { x: 0, y: 0 },
      facing: 'left',
      state: 'idle',
      animation: 'idle',
      frameIndex: 0
    });

    // Add other characters (Chun-Li, Akuma, etc.)
  }

  private initializeMovesets(): void {
    // Ryu moveset
    this.movesets.set('Ryu', [
      {
        name: 'Hadoken',
        input: ['down', 'down-forward', 'forward', 'punch'],
        damage: 60,
        startup: 13,
        active: 2,
        recovery: 39,
        blockstun: 12,
        hitstun: 16
      },
      {
        name: 'Shoryuken',
        input: ['forward', 'down', 'down-forward', 'punch'],
        damage: 120,
        startup: 3,
        active: 4,
        recovery: 31,
        blockstun: 15,
        hitstun: 20
      },
      {
        name: 'Tatsumaki',
        input: ['down', 'down-back', 'back', 'kick'],
        damage: 80,
        startup: 14,
        active: 15,
        recovery: 18,
        blockstun: 10,
        hitstun: 14
      }
    ]);

    // Ken moveset
    this.movesets.set('Ken', [
      {
        name: 'Hadoken',
        input: ['down', 'down-forward', 'forward', 'punch'],
        damage: 60,
        startup: 13,
        active: 2,
        recovery: 39,
        blockstun: 12,
        hitstun: 16
      },
      {
        name: 'Shoryuken',
        input: ['forward', 'down', 'down-forward', 'punch'],
        damage: 140,
        startup: 3,
        active: 4,
        recovery: 29,
        blockstun: 15,
        hitstun: 22
      }
    ]);
  }

  createCharacter(data: CharacterData): void {
    this.characters.set(data.id, { ...data });
  }

  getCharacter(id: number): CharacterData | null {
    return this.characters.get(id) || null;
  }

  updateCharacter(id: number, updates: Partial<CharacterData>): void {
    const character = this.characters.get(id);
    if (character) {
      Object.assign(character, updates);
    }
  }

  executeMove(characterId: number, moveName: string): boolean {
    const character = this.characters.get(characterId);
    if (!character) return false;

    const moveset = this.movesets.get(character.name);
    if (!moveset) return false;

    const move = moveset.find(m => m.name === moveName);
    if (!move) return false;

    // Execute move logic
    character.state = 'attacking';
    character.animation = moveName.toLowerCase();
    character.frameIndex = 0;

    return true;
  }

  takeDamage(characterId: number, damage: number): void {
    const character = this.characters.get(characterId);
    if (character) {
      character.health = Math.max(0, character.health - damage);
      if (character.health === 0) {
        character.state = 'knocked_out';
      }
    }
  }

  addMeter(characterId: number, amount: number): void {
    const character = this.characters.get(characterId);
    if (character) {
      character.meter = Math.min(character.maxMeter, character.meter + amount);
    }
  }

  update(): void {
    for (const character of this.characters.values()) {
      // Update position
      character.position.x += character.velocity.x;
      character.position.y += character.velocity.y;

      // Apply gravity if in air
      if (character.position.y < 0) {
        character.velocity.y += 0.8; // gravity
      } else {
        character.position.y = 0;
        character.velocity.y = 0;
      }

      // Update animation frame
      character.frameIndex++;
    }
  }

  getCharacters(): CharacterData[] {
    return Array.from(this.characters.values());
  }

  getMoves(characterName: string): MoveData[] {
    return this.movesets.get(characterName) || [];
  }
}
