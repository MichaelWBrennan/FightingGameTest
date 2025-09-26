export interface GameMode {
  id: string;
  name: string;
  description: string;
  type: 'single' | 'multiplayer' | 'online' | 'training';
  maxPlayers: number;
  minPlayers: number;
  timeLimit?: number;
  rounds: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  unlockRequirements?: {
    level?: number;
    characters?: string[];
    previousModes?: string[];
  };
  rewards: {
    experience: number;
    currency: number;
    unlocks: string[];
  };
}

export interface ArcadeMode extends GameMode {
  type: 'single';
  opponents: ArcadeOpponent[];
  boss?: ArcadeBoss;
  ending: {
    text: string;
    image: string;
    music: string;
  };
}

export interface ArcadeOpponent {
  characterId: string;
  level: number;
  stage: string;
  music: string;
  dialogue?: {
    preFight: string;
    postFight: string;
  };
}

export interface ArcadeBoss extends ArcadeOpponent {
  isBoss: true;
  specialRules?: {
    healthMultiplier: number;
    damageMultiplier: number;
    meterStart: number;
  };
}

export interface SurvivalMode extends GameMode {
  type: 'single';
  healthRegen: number;
  difficultyIncrease: number;
  maxWaves: number;
  currentWave: number;
  enemies: SurvivalEnemy[];
}

export interface SurvivalEnemy {
  characterId: string;
  level: number;
  healthMultiplier: number;
  damageMultiplier: number;
  specialRules?: Record<string, any>;
}

export interface TournamentMode extends GameMode {
  type: 'multiplayer';
  bracketType: 'single' | 'double' | 'round_robin';
  maxParticipants: number;
  currentParticipants: string[];
  bracket: TournamentMatch[];
  currentRound: number;
  prizes: TournamentPrize[];
}

export interface TournamentMatch {
  id: string;
  round: number;
  player1: string;
  player2: string;
  winner?: string;
  completed: boolean;
  scheduledTime?: Date;
}

export interface TournamentPrize {
  position: number;
  rewards: {
    currency: number;
    titles: string[];
    cosmetics: string[];
  };
}

export class GameModeManager {
  private modes: Map<string, GameMode> = new Map();
  private currentMode: GameMode | null = null;
  private modeHistory: string[] = [];
  private isInitialized = false;

  constructor() {
    this.initializeDefaultModes();
  }

  private initializeDefaultModes(): void {
    // Story Mode
    this.addMode({
      id: 'story',
      name: 'Story Mode',
      description: 'Experience the epic tales of each fighter',
      type: 'single',
      maxPlayers: 1,
      minPlayers: 1,
      rounds: 3,
      rewards: {
        experience: 100,
        currency: 50,
        unlocks: ['story_unlock']
      }
    });

    // Arcade Mode
    this.addMode({
      id: 'arcade',
      name: 'Arcade Mode',
      description: 'Classic arcade ladder with 8 opponents',
      type: 'single',
      maxPlayers: 1,
      minPlayers: 1,
      rounds: 3,
      timeLimit: 99,
      rewards: {
        experience: 200,
        currency: 100,
        unlocks: ['arcade_unlock']
      }
    } as ArcadeMode);

    // Versus Mode
    this.addMode({
      id: 'versus',
      name: 'Versus Mode',
      description: 'Local multiplayer battles',
      type: 'multiplayer',
      maxPlayers: 2,
      minPlayers: 2,
      rounds: 3,
      timeLimit: 99,
      rewards: {
        experience: 50,
        currency: 25,
        unlocks: []
      }
    });

    // Training Mode
    this.addMode({
      id: 'training',
      name: 'Training Mode',
      description: 'Practice your skills with advanced tools',
      type: 'training',
      maxPlayers: 1,
      minPlayers: 1,
      rounds: 1,
      rewards: {
        experience: 10,
        currency: 5,
        unlocks: []
      }
    });

    // Online Ranked
    this.addMode({
      id: 'online_ranked',
      name: 'Online Ranked',
      description: 'Compete for ranking points online',
      type: 'online',
      maxPlayers: 2,
      minPlayers: 2,
      rounds: 3,
      timeLimit: 99,
      unlockRequirements: {
        level: 5
      },
      rewards: {
        experience: 100,
        currency: 50,
        unlocks: ['ranked_unlock']
      }
    });

    // Online Casual
    this.addMode({
      id: 'online_casual',
      name: 'Online Casual',
      description: 'Casual online matches for fun',
      type: 'online',
      maxPlayers: 2,
      minPlayers: 2,
      rounds: 3,
      timeLimit: 99,
      rewards: {
        experience: 75,
        currency: 35,
        unlocks: []
      }
    });

    // Tournament Mode
    this.addMode({
      id: 'tournament',
      name: 'Tournament Mode',
      description: 'Organize and participate in tournaments',
      type: 'multiplayer',
      maxPlayers: 16,
      minPlayers: 4,
      rounds: 3,
      timeLimit: 99,
      unlockRequirements: {
        level: 10
      },
      rewards: {
        experience: 300,
        currency: 150,
        unlocks: ['tournament_unlock']
      }
    } as TournamentMode);

    // Survival Mode
    this.addMode({
      id: 'survival',
      name: 'Survival Mode',
      description: 'Fight endless waves of enemies',
      type: 'single',
      maxPlayers: 1,
      minPlayers: 1,
      rounds: 1,
      rewards: {
        experience: 150,
        currency: 75,
        unlocks: ['survival_unlock']
      }
    } as SurvivalMode);

    // Time Attack
    this.addMode({
      id: 'time_attack',
      name: 'Time Attack',
      description: 'Defeat opponents as quickly as possible',
      type: 'single',
      maxPlayers: 1,
      minPlayers: 1,
      rounds: 1,
      timeLimit: 60,
      rewards: {
        experience: 125,
        currency: 60,
        unlocks: ['time_attack_unlock']
      }
    });

    // Team Battle
    this.addMode({
      id: 'team_battle',
      name: 'Team Battle',
      description: '3v3 team battles',
      type: 'multiplayer',
      maxPlayers: 6,
      minPlayers: 6,
      rounds: 1,
      timeLimit: 99,
      unlockRequirements: {
        level: 15
      },
      rewards: {
        experience: 250,
        currency: 125,
        unlocks: ['team_battle_unlock']
      }
    });

    // Practice Mode
    this.addMode({
      id: 'practice',
      name: 'Practice Mode',
      description: 'Free practice with customizable settings',
      type: 'training',
      maxPlayers: 1,
      minPlayers: 1,
      rounds: 1,
      rewards: {
        experience: 5,
        currency: 2,
        unlocks: []
      }
    });

    // Mission Mode
    this.addMode({
      id: 'mission',
      name: 'Mission Mode',
      description: 'Complete specific challenges and objectives',
      type: 'single',
      maxPlayers: 1,
      minPlayers: 1,
      rounds: 1,
      unlockRequirements: {
        level: 3
      },
      rewards: {
        experience: 80,
        currency: 40,
        unlocks: ['mission_unlock']
      }
    });

    // Boss Rush
    this.addMode({
      id: 'boss_rush',
      name: 'Boss Rush',
      description: 'Face all bosses in sequence',
      type: 'single',
      maxPlayers: 1,
      minPlayers: 1,
      rounds: 1,
      unlockRequirements: {
        level: 8
      },
      rewards: {
        experience: 300,
        currency: 150,
        unlocks: ['boss_rush_unlock']
      }
    });

    // Endless Mode
    this.addMode({
      id: 'endless',
      name: 'Endless Mode',
      description: 'Fight until you lose - how long can you last?',
      type: 'single',
      maxPlayers: 1,
      minPlayers: 1,
      rounds: 1,
      unlockRequirements: {
        level: 6
      },
      rewards: {
        experience: 200,
        currency: 100,
        unlocks: ['endless_unlock']
      }
    });

    // Combo Challenge
    this.addMode({
      id: 'combo_challenge',
      name: 'Combo Challenge',
      description: 'Master complex combo sequences',
      type: 'training',
      maxPlayers: 1,
      minPlayers: 1,
      rounds: 1,
      unlockRequirements: {
        level: 4
      },
      rewards: {
        experience: 60,
        currency: 30,
        unlocks: ['combo_challenge_unlock']
      }
    });

    // Tag Team
    this.addMode({
      id: 'tag_team',
      name: 'Tag Team',
      description: '2v2 tag team battles with character switching',
      type: 'multiplayer',
      maxPlayers: 4,
      minPlayers: 4,
      rounds: 3,
      timeLimit: 99,
      unlockRequirements: {
        level: 12
      },
      rewards: {
        experience: 180,
        currency: 90,
        unlocks: ['tag_team_unlock']
      }
    });

    // King of the Hill
    this.addMode({
      id: 'king_of_hill',
      name: 'King of the Hill',
      description: 'Winner stays, loser goes - last fighter standing wins',
      type: 'multiplayer',
      maxPlayers: 8,
      minPlayers: 3,
      rounds: 1,
      timeLimit: 99,
      unlockRequirements: {
        level: 7
      },
      rewards: {
        experience: 120,
        currency: 60,
        unlocks: ['king_of_hill_unlock']
      }
    });

    // Custom Match
    this.addMode({
      id: 'custom_match',
      name: 'Custom Match',
      description: 'Create your own match with custom rules',
      type: 'multiplayer',
      maxPlayers: 8,
      minPlayers: 2,
      rounds: 1,
      timeLimit: 99,
      unlockRequirements: {
        level: 5
      },
      rewards: {
        experience: 40,
        currency: 20,
        unlocks: []
      }
    });

  }

  public addMode(mode: GameMode): void {
    this.modes.set(mode.id, mode);
  }

  public getMode(modeId: string): GameMode | null {
    return this.modes.get(modeId) || null;
  }

  public getAllModes(): GameMode[] {
    return Array.from(this.modes.values());
  }

  public getAvailableModes(playerLevel: number = 1, unlockedCharacters: string[] = []): GameMode[] {
    return this.getAllModes().filter(mode => this.isModeAvailable(mode, playerLevel, unlockedCharacters));
  }

  public isModeAvailable(mode: GameMode, playerLevel: number = 1, unlockedCharacters: string[] = []): boolean {
    if (!mode.unlockRequirements) return true;

    const req = mode.unlockRequirements;

    // Check level requirement
    if (req.level && playerLevel < req.level) return false;

    // Check character requirements
    if (req.characters) {
      for (const charId of req.characters) {
        if (!unlockedCharacters.includes(charId)) return false;
      }
    }

    // Check previous mode requirements
    if (req.previousModes) {
      for (const modeId of req.previousModes) {
        if (!this.modeHistory.includes(modeId)) return false;
      }
    }

    return true;
  }

  public startMode(modeId: string, players: string[] = [], isOnline: boolean = false): boolean {
    const mode = this.getMode(modeId);
    if (!mode) return false;

    // Validate player count
    if (players.length < mode.minPlayers || players.length > mode.maxPlayers) {
      return false;
    }

    this.currentMode = mode;
    this.modeHistory.push(modeId);

    // Initialize mode-specific logic
    this.initializeMode(mode, isOnline);

    return true;
  }

  private initializeMode(mode: GameMode, isOnline: boolean = false): void {
    switch (mode.type) {
      case 'single':
        this.initializeSinglePlayerMode(mode, isOnline);
        break;
      case 'multiplayer':
        this.initializeMultiplayerMode(mode, isOnline);
        break;
      case 'online':
        this.initializeOnlineMode(mode);
        break;
      case 'training':
        this.initializeTrainingMode(mode, isOnline);
        break;
    }
  }

  private initializeSinglePlayerMode(mode: GameMode, isOnline: boolean): void {
    if (mode.id === 'arcade') {
      this.initializeArcadeMode(mode as ArcadeMode, isOnline);
    } else if (mode.id === 'survival') {
      this.initializeSurvivalMode(mode as SurvivalMode, isOnline);
    } else if (mode.id === 'mission') {
      this.initializeMissionMode(mode, isOnline);
    } else if (mode.id === 'boss_rush') {
      this.initializeBossRushMode(mode, isOnline);
    } else if (mode.id === 'endless') {
      this.initializeEndlessMode(mode, isOnline);
    }
  }

  private initializeArcadeMode(mode: ArcadeMode, isOnline: boolean): void {
    // Arcade mode specific initialization
    console.log('Initializing Arcade Mode', isOnline ? '(Online)' : '(Offline)');
  }

  private initializeSurvivalMode(mode: SurvivalMode, isOnline: boolean): void {
    // Survival mode specific initialization
    console.log('Initializing Survival Mode', isOnline ? '(Online)' : '(Offline)');
  }

  private initializeMultiplayerMode(mode: GameMode, isOnline: boolean): void {
    if (mode.id === 'tournament') {
      this.initializeTournamentMode(mode as TournamentMode, isOnline);
    } else if (mode.id === 'tag_team') {
      this.initializeTagTeamMode(mode, isOnline);
    } else if (mode.id === 'king_of_hill') {
      this.initializeKingOfHillMode(mode, isOnline);
    } else if (mode.id === 'custom_match') {
      this.initializeCustomMatchMode(mode, isOnline);
    }
  }

  private initializeTournamentMode(mode: TournamentMode, isOnline: boolean): void {
    // Tournament mode specific initialization
    console.log('Initializing Tournament Mode', isOnline ? '(Online)' : '(Offline)');
  }

  private initializeOnlineMode(mode: GameMode): void {
    // Online mode specific initialization - always procedural stages
    console.log('Initializing Online Mode - Procedural stages only');
  }

  private initializeTrainingMode(mode: GameMode, isOnline: boolean): void {
    if (mode.id === 'practice') {
      this.initializePracticeMode(mode, isOnline);
    } else if (mode.id === 'combo_challenge') {
      this.initializeComboChallengeMode(mode, isOnline);
    } else {
      // Default training mode
      console.log('Initializing Training Mode', isOnline ? '(Online)' : '(Offline)');
    }
  }

  // New mode initialization methods
  private initializeMissionMode(mode: GameMode, isOnline: boolean): void {
    console.log('Initializing Mission Mode', isOnline ? '(Online)' : '(Offline)');
  }

  private initializeBossRushMode(mode: GameMode, isOnline: boolean): void {
    console.log('Initializing Boss Rush Mode', isOnline ? '(Online)' : '(Offline)');
  }

  private initializeEndlessMode(mode: GameMode, isOnline: boolean): void {
    console.log('Initializing Endless Mode', isOnline ? '(Online)' : '(Offline)');
  }


  private initializeTagTeamMode(mode: GameMode, isOnline: boolean): void {
    console.log('Initializing Tag Team Mode', isOnline ? '(Online)' : '(Offline)');
  }

  private initializeKingOfHillMode(mode: GameMode, isOnline: boolean): void {
    console.log('Initializing King of the Hill Mode', isOnline ? '(Online)' : '(Offline)');
  }

  private initializeCustomMatchMode(mode: GameMode, isOnline: boolean): void {
    console.log('Initializing Custom Match Mode', isOnline ? '(Online)' : '(Offline)');
  }

  private initializePracticeMode(mode: GameMode, isOnline: boolean): void {
    console.log('Initializing Practice Mode', isOnline ? '(Online)' : '(Offline)');
  }

  private initializeComboChallengeMode(mode: GameMode, isOnline: boolean): void {
    console.log('Initializing Combo Challenge Mode', isOnline ? '(Online)' : '(Offline)');
  }

  public endMode(): void {
    if (this.currentMode) {
      // Process mode completion rewards
      this.processModeRewards(this.currentMode);
      this.currentMode = null;
    }
  }

  private processModeRewards(mode: GameMode): void {
    // This would integrate with the progression system
    console.log(`Processing rewards for ${mode.name}:`, mode.rewards);
  }

  public getCurrentMode(): GameMode | null {
    return this.currentMode;
  }

  public getModeHistory(): string[] {
    return [...this.modeHistory];
  }

  public getModesByType(type: GameMode['type']): GameMode[] {
    return this.getAllModes().filter(mode => mode.type === type);
  }

  public getModesByDifficulty(difficulty: string): GameMode[] {
    return this.getAllModes().filter(mode => mode.difficulty === difficulty);
  }

  public searchModes(query: string): GameMode[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllModes().filter(mode => 
      mode.name.toLowerCase().includes(lowerQuery) ||
      mode.description.toLowerCase().includes(lowerQuery)
    );
  }

  public getPopularModes(): GameMode[] {
    // This would be based on actual usage statistics
    return this.getAllModes().slice(0, 5);
  }

  public getRecommendedModes(playerLevel: number, unlockedCharacters: string[]): GameMode[] {
    const available = this.getAvailableModes(playerLevel, unlockedCharacters);
    
    // Simple recommendation algorithm
    return available
      .filter(mode => mode.type === 'single' || mode.type === 'training')
      .sort((a, b) => {
        // Prioritize modes with lower unlock requirements
        const aReq = a.unlockRequirements?.level || 0;
        const bReq = b.unlockRequirements?.level || 0;
        return aReq - bReq;
      })
      .slice(0, 3);
  }

  public exportData(): string {
    return JSON.stringify({
      modes: Array.from(this.modes.entries()),
      modeHistory: this.modeHistory,
      currentMode: this.currentMode?.id || null
    });
  }

  public importData(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      this.modes = new Map(parsed.modes);
      this.modeHistory = parsed.modeHistory;
      this.currentMode = parsed.currentMode ? this.modes.get(parsed.currentMode) || null : null;
      return true;
    } catch (error) {
      console.error('Failed to import game mode data:', error);
      return false;
    }
  }
}