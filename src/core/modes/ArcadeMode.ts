import type { pc } from 'playcanvas';
import { Character } from '../../../types/character';
import { Logger } from '../utils/Logger';

export interface ArcadeOpponent {
  id: string;
  name: string;
  character: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  health: number;
  maxHealth: number;
  meter: number;
  maxMeter: number;
  aiLevel: number;
  specialMoves: string[];
  taunts: string[];
  victoryQuote: string;
  defeatQuote: string;
  backgroundMusic: string;
  stage: string;
}

export interface ArcadePath {
  id: string;
  name: string;
  description: string;
  opponents: ArcadeOpponent[];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  rewards: {
    experience?: number;
    money?: number;
    characterUnlock?: string;
    moveUnlock?: string;
    title?: string;
  };
  requirements: {
    level?: number;
    characterUnlocked?: string;
    storyProgress?: number;
  };
}

export interface ArcadeEnding {
  id: string;
  character: string;
  path: string;
  title: string;
  description: string;
  image: string;
  video?: string;
  requirements: {
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    perfectVictory?: boolean;
    timeLimit?: number;
  };
}

export interface ArcadeProgress {
  currentOpponent: number;
  totalOpponents: number;
  wins: number;
  losses: number;
  perfectVictories: number;
  totalTime: number;
  currentPath: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  score: number;
  combo: number;
  maxCombo: number;
  damageDealt: number;
  damageTaken: number;
}

export class ArcadeMode {
  private app: pc.Application;
  private paths: Map<string, ArcadePath> = new Map();
  private endings: Map<string, ArcadeEnding[]> = new Map();
  private currentPath: ArcadePath | null = null;
  private currentOpponent: ArcadeOpponent | null = null;
  private progress: ArcadeProgress;
  private isActive: boolean = false;
  private startTime: number = 0;
  private pauseTime: number = 0;
  private totalPauseTime: number = 0;

  constructor(app: pc.Application) {
    this.app = app;
    this.initializeArcadeMode();
  }

  private initializeArcadeMode(): void {
    this.initializePaths();
    this.initializeEndings();
    this.initializeProgress();
  }

  private initializePaths(): void {
    // Ryu's Path
    this.paths.set('ryu_path', {
      id: 'ryu_path',
      name: 'The Way of the Warrior',
      description: 'Follow Ryu\'s journey to become the ultimate warrior',
      difficulty: 'medium',
      opponents: [
        {
          id: 'ken_1',
          name: 'Ken Masters',
          character: 'ken',
          difficulty: 'easy',
          health: 1000,
          maxHealth: 1000,
          meter: 0,
          maxMeter: 100,
          aiLevel: 1,
          specialMoves: ['hadoken', 'shoryuken', 'tatsumaki'],
          taunts: ['Come on!', 'Let\'s fight!', 'Show me what you got!'],
          victoryQuote: 'You\'re not ready yet!',
          defeatQuote: 'Good fight, but I\'ll get you next time!',
          backgroundMusic: 'ken_theme',
          stage: 'metro_city'
        },
        {
          id: 'chun_li_1',
          name: 'Chun-Li',
          character: 'chun_li',
          difficulty: 'easy',
          health: 1000,
          maxHealth: 1000,
          meter: 0,
          maxMeter: 100,
          aiLevel: 2,
          specialMoves: ['kikoken', 'spinning_bird_kick', 'lightning_kick'],
          taunts: ['I\'ll show you my power!', 'Don\'t underestimate me!'],
          victoryQuote: 'You need more training!',
          defeatQuote: 'You\'re getting stronger!',
          backgroundMusic: 'chun_li_theme',
          stage: 'china_town'
        },
        {
          id: 'zangief_1',
          name: 'Zangief',
          character: 'zangief',
          difficulty: 'medium',
          health: 1200,
          maxHealth: 1200,
          meter: 0,
          maxMeter: 100,
          aiLevel: 3,
          specialMoves: ['spinning_piledriver', 'double_lariat', 'banishing_flat'],
          taunts: ['I will crush you!', 'You are weak!'],
          victoryQuote: 'You are not ready for the Red Cyclone!',
          defeatQuote: 'You are strong, but not strong enough!',
          backgroundMusic: 'zangief_theme',
          stage: 'russia'
        },
        {
          id: 'dhalsim_1',
          name: 'Dhalsim',
          character: 'dhalsim',
          difficulty: 'medium',
          health: 1000,
          maxHealth: 1000,
          meter: 0,
          maxMeter: 100,
          aiLevel: 4,
          specialMoves: ['yoga_fire', 'yoga_flame', 'yoga_teleport'],
          taunts: ['Yoga!', 'Find your inner peace!'],
          victoryQuote: 'You must find balance!',
          defeatQuote: 'You have found your inner strength!',
          backgroundMusic: 'dhalsim_theme',
          stage: 'india'
        },
        {
          id: 'akuma_1',
          name: 'Akuma',
          character: 'akuma',
          difficulty: 'hard',
          health: 1000,
          maxHealth: 1000,
          meter: 0,
          maxMeter: 100,
          aiLevel: 5,
          specialMoves: ['hadoken', 'shoryuken', 'tatsumaki', 'demon_palm'],
          taunts: ['You are not worthy!', 'Face the power of the demon!'],
          victoryQuote: 'You are weak!',
          defeatQuote: 'You have proven yourself worthy!',
          backgroundMusic: 'akuma_theme',
          stage: 'demon_world'
        },
        {
          id: 'ryu_final',
          name: 'Ryu (Final)',
          character: 'ryu',
          difficulty: 'expert',
          health: 1500,
          maxHealth: 1500,
          meter: 0,
          maxMeter: 100,
          aiLevel: 6,
          specialMoves: ['hadoken', 'shoryuken', 'tatsumaki', 'denjin_hadoken'],
          taunts: ['Show me your true power!', 'Let\'s see who is stronger!'],
          victoryQuote: 'You must train harder!',
          defeatQuote: 'You have become a true warrior!',
          backgroundMusic: 'ryu_final_theme',
          stage: 'mountain_dojo'
        }
      ],
      rewards: {
        experience: 1000,
        money: 2000,
        characterUnlock: 'akuma',
        moveUnlock: 'denjin_hadoken',
        title: 'Warrior of the Way'
      },
      requirements: {}
    });

    // Ken's Path
    this.paths.set('ken_path', {
      id: 'ken_path',
      name: 'The American Dream',
      description: 'Follow Ken\'s journey to become the ultimate fighter',
      difficulty: 'medium',
      opponents: [
        {
          id: 'ryu_1',
          name: 'Ryu',
          character: 'ryu',
          difficulty: 'easy',
          health: 1000,
          maxHealth: 1000,
          meter: 0,
          maxMeter: 100,
          aiLevel: 1,
          specialMoves: ['hadoken', 'shoryuken', 'tatsumaki'],
          taunts: ['Let\'s fight!', 'Show me your power!'],
          victoryQuote: 'You need more training!',
          defeatQuote: 'You\'re getting stronger!',
          backgroundMusic: 'ryu_theme',
          stage: 'japan'
        },
        {
          id: 'chun_li_2',
          name: 'Chun-Li',
          character: 'chun_li',
          difficulty: 'easy',
          health: 1000,
          maxHealth: 1000,
          meter: 0,
          maxMeter: 100,
          aiLevel: 2,
          specialMoves: ['kikoken', 'spinning_bird_kick', 'lightning_kick'],
          taunts: ['I\'ll show you my power!', 'Don\'t underestimate me!'],
          victoryQuote: 'You need more training!',
          defeatQuote: 'You\'re getting stronger!',
          backgroundMusic: 'chun_li_theme',
          stage: 'china_town'
        },
        {
          id: 'zangief_2',
          name: 'Zangief',
          character: 'zangief',
          difficulty: 'medium',
          health: 1200,
          maxHealth: 1200,
          meter: 0,
          maxMeter: 100,
          aiLevel: 3,
          specialMoves: ['spinning_piledriver', 'double_lariat', 'banishing_flat'],
          taunts: ['I will crush you!', 'You are weak!'],
          victoryQuote: 'You are not ready for the Red Cyclone!',
          defeatQuote: 'You are strong, but not strong enough!',
          backgroundMusic: 'zangief_theme',
          stage: 'russia'
        },
        {
          id: 'dhalsim_2',
          name: 'Dhalsim',
          character: 'dhalsim',
          difficulty: 'medium',
          health: 1000,
          maxHealth: 1000,
          meter: 0,
          maxMeter: 100,
          aiLevel: 4,
          specialMoves: ['yoga_fire', 'yoga_flame', 'yoga_teleport'],
          taunts: ['Yoga!', 'Find your inner peace!'],
          victoryQuote: 'You must find balance!',
          defeatQuote: 'You have found your inner strength!',
          backgroundMusic: 'dhalsim_theme',
          stage: 'india'
        },
        {
          id: 'akuma_2',
          name: 'Akuma',
          character: 'akuma',
          difficulty: 'hard',
          health: 1000,
          maxHealth: 1000,
          meter: 0,
          maxMeter: 100,
          aiLevel: 5,
          specialMoves: ['hadoken', 'shoryuken', 'tatsumaki', 'demon_palm'],
          taunts: ['You are not worthy!', 'Face the power of the demon!'],
          victoryQuote: 'You are weak!',
          defeatQuote: 'You have proven yourself worthy!',
          backgroundMusic: 'akuma_theme',
          stage: 'demon_world'
        },
        {
          id: 'ken_final',
          name: 'Ken (Final)',
          character: 'ken',
          difficulty: 'expert',
          health: 1500,
          maxHealth: 1500,
          meter: 0,
          maxMeter: 100,
          aiLevel: 6,
          specialMoves: ['hadoken', 'shoryuken', 'tatsumaki', 'jinrai_mode'],
          taunts: ['Show me your true power!', 'Let\'s see who is stronger!'],
          victoryQuote: 'You must train harder!',
          defeatQuote: 'You have become a true fighter!',
          backgroundMusic: 'ken_final_theme',
          stage: 'america'
        }
      ],
      rewards: {
        experience: 1000,
        money: 2000,
        characterUnlock: 'akuma',
        moveUnlock: 'jinrai_mode',
        title: 'American Fighter'
      },
      requirements: {}
    });

    // Chun-Li's Path
    this.paths.set('chun_li_path', {
      id: 'chun_li_path',
      name: 'The Strongest Woman in the World',
      description: 'Follow Chun-Li\'s journey to become the ultimate fighter',
      difficulty: 'medium',
      opponents: [
        {
          id: 'ryu_2',
          name: 'Ryu',
          character: 'ryu',
          difficulty: 'easy',
          health: 1000,
          maxHealth: 1000,
          meter: 0,
          maxMeter: 100,
          aiLevel: 1,
          specialMoves: ['hadoken', 'shoryuken', 'tatsumaki'],
          taunts: ['Let\'s fight!', 'Show me your power!'],
          victoryQuote: 'You need more training!',
          defeatQuote: 'You\'re getting stronger!',
          backgroundMusic: 'ryu_theme',
          stage: 'japan'
        },
        {
          id: 'ken_2',
          name: 'Ken Masters',
          character: 'ken',
          difficulty: 'easy',
          health: 1000,
          maxHealth: 1000,
          meter: 0,
          maxMeter: 100,
          aiLevel: 2,
          specialMoves: ['hadoken', 'shoryuken', 'tatsumaki'],
          taunts: ['Come on!', 'Let\'s fight!'],
          victoryQuote: 'You\'re not ready yet!',
          defeatQuote: 'Good fight, but I\'ll get you next time!',
          backgroundMusic: 'ken_theme',
          stage: 'metro_city'
        },
        {
          id: 'zangief_3',
          name: 'Zangief',
          character: 'zangief',
          difficulty: 'medium',
          health: 1200,
          maxHealth: 1200,
          meter: 0,
          maxMeter: 100,
          aiLevel: 3,
          specialMoves: ['spinning_piledriver', 'double_lariat', 'banishing_flat'],
          taunts: ['I will crush you!', 'You are weak!'],
          victoryQuote: 'You are not ready for the Red Cyclone!',
          defeatQuote: 'You are strong, but not strong enough!',
          backgroundMusic: 'zangief_theme',
          stage: 'russia'
        },
        {
          id: 'dhalsim_3',
          name: 'Dhalsim',
          character: 'dhalsim',
          difficulty: 'medium',
          health: 1000,
          maxHealth: 1000,
          meter: 0,
          maxMeter: 100,
          aiLevel: 4,
          specialMoves: ['yoga_fire', 'yoga_flame', 'yoga_teleport'],
          taunts: ['Yoga!', 'Find your inner peace!'],
          victoryQuote: 'You must find balance!',
          defeatQuote: 'You have found your inner strength!',
          backgroundMusic: 'dhalsim_theme',
          stage: 'india'
        },
        {
          id: 'akuma_3',
          name: 'Akuma',
          character: 'akuma',
          difficulty: 'hard',
          health: 1000,
          maxHealth: 1000,
          meter: 0,
          maxMeter: 100,
          aiLevel: 5,
          specialMoves: ['hadoken', 'shoryuken', 'tatsumaki', 'demon_palm'],
          taunts: ['You are not worthy!', 'Face the power of the demon!'],
          victoryQuote: 'You are weak!',
          defeatQuote: 'You have proven yourself worthy!',
          backgroundMusic: 'akuma_theme',
          stage: 'demon_world'
        },
        {
          id: 'chun_li_final',
          name: 'Chun-Li (Final)',
          character: 'chun_li',
          difficulty: 'expert',
          health: 1500,
          maxHealth: 1500,
          meter: 0,
          maxMeter: 100,
          aiLevel: 6,
          specialMoves: ['kikoken', 'spinning_bird_kick', 'lightning_kick', 'legs_of_fury'],
          taunts: ['Show me your true power!', 'Let\'s see who is stronger!'],
          victoryQuote: 'You must train harder!',
          defeatQuote: 'You have become a true fighter!',
          backgroundMusic: 'chun_li_final_theme',
          stage: 'china_town'
        }
      ],
      rewards: {
        experience: 1000,
        money: 2000,
        characterUnlock: 'akuma',
        moveUnlock: 'legs_of_fury',
        title: 'Strongest Woman in the World'
      },
      requirements: {}
    });

    // Add more paths as needed
  }

  private initializeEndings(): void {
    // Ryu's Endings
    this.endings.set('ryu', [
      {
        id: 'ryu_ending_1',
        character: 'ryu',
        path: 'ryu_path',
        title: 'The Way of the Warrior',
        description: 'Ryu has mastered the way of the warrior and achieved true strength.',
        image: 'ryu_ending_1.jpg',
        video: 'ryu_ending_1.mp4',
        requirements: {
          difficulty: 'easy',
          perfectVictory: false
        }
      },
      {
        id: 'ryu_ending_2',
        character: 'ryu',
        path: 'ryu_path',
        title: 'The Perfect Warrior',
        description: 'Ryu has achieved perfect mastery of the fighting arts.',
        image: 'ryu_ending_2.jpg',
        video: 'ryu_ending_2.mp4',
        requirements: {
          difficulty: 'expert',
          perfectVictory: true
        }
      }
    ]);

    // Ken's Endings
    this.endings.set('ken', [
      {
        id: 'ken_ending_1',
        character: 'ken',
        path: 'ken_path',
        title: 'The American Dream',
        description: 'Ken has achieved the American dream of becoming the ultimate fighter.',
        image: 'ken_ending_1.jpg',
        video: 'ken_ending_1.mp4',
        requirements: {
          difficulty: 'easy',
          perfectVictory: false
        }
      },
      {
        id: 'ken_ending_2',
        character: 'ken',
        path: 'ken_path',
        title: 'The Perfect American',
        description: 'Ken has achieved perfect mastery of the American fighting style.',
        image: 'ken_ending_2.jpg',
        video: 'ken_ending_2.mp4',
        requirements: {
          difficulty: 'expert',
          perfectVictory: true
        }
      }
    ]);

    // Chun-Li's Endings
    this.endings.set('chun_li', [
      {
        id: 'chun_li_ending_1',
        character: 'chun_li',
        path: 'chun_li_path',
        title: 'The Strongest Woman',
        description: 'Chun-Li has proven herself to be the strongest woman in the world.',
        image: 'chun_li_ending_1.jpg',
        video: 'chun_li_ending_1.mp4',
        requirements: {
          difficulty: 'easy',
          perfectVictory: false
        }
      },
      {
        id: 'chun_li_ending_2',
        character: 'chun_li',
        path: 'chun_li_path',
        title: 'The Perfect Woman',
        description: 'Chun-Li has achieved perfect mastery of the fighting arts.',
        image: 'chun_li_ending_2.jpg',
        video: 'chun_li_ending_2.mp4',
        requirements: {
          difficulty: 'expert',
          perfectVictory: true
        }
      }
    ]);
  }

  private initializeProgress(): void {
    this.progress = {
      currentOpponent: 0,
      totalOpponents: 0,
      wins: 0,
      losses: 0,
      perfectVictories: 0,
      totalTime: 0,
      currentPath: '',
      difficulty: 'medium',
      score: 0,
      combo: 0,
      maxCombo: 0,
      damageDealt: 0,
      damageTaken: 0
    };
  }

  public async startArcadeMode(pathId: string, difficulty: 'easy' | 'medium' | 'hard' | 'expert'): Promise<boolean> {
    const path = this.paths.get(pathId);
    if (!path) {
      Logger.warn(`Arcade path ${pathId} not found`);
      return false;
    }

    // Check requirements
    if (!this.checkPathRequirements(path)) {
      Logger.warn(`Requirements not met for arcade path ${pathId}`);
      return false;
    }

    // Initialize arcade mode
    this.currentPath = path;
    this.progress.currentPath = pathId;
    this.progress.difficulty = difficulty;
    this.progress.currentOpponent = 0;
    this.progress.totalOpponents = path.opponents.length;
    this.progress.wins = 0;
    this.progress.losses = 0;
    this.progress.perfectVictories = 0;
    this.progress.totalTime = 0;
    this.progress.score = 0;
    this.progress.combo = 0;
    this.progress.maxCombo = 0;
    this.progress.damageDealt = 0;
    this.progress.damageTaken = 0;
    this.isActive = true;
    this.startTime = Date.now();
    this.totalPauseTime = 0;

    // Start first opponent
    await this.startNextOpponent();

    // Emit arcade started event
    this.app.fire('arcade:started', {
      pathId,
      path,
      difficulty,
      progress: this.progress
    });

    Logger.info(`Started arcade mode: ${path.name} (${difficulty})`);
    return true;
  }

  private checkPathRequirements(path: ArcadePath): boolean {
    // Check level requirement
    if (path.requirements.level && this.getPlayerLevel() < path.requirements.level) {
      return false;
    }

    // Check character unlock requirement
    if (path.requirements.characterUnlocked && !this.isCharacterUnlocked(path.requirements.characterUnlocked)) {
      return false;
    }

    // Check story progress requirement
    if (path.requirements.storyProgress && this.getStoryProgress() < path.requirements.storyProgress) {
      return false;
    }

    return true;
  }

  private getPlayerLevel(): number {
    // This would get the player's current level
    return 1; // Placeholder
  }

  private isCharacterUnlocked(characterId: string): boolean {
    // This would check if the character is unlocked
    return true; // Placeholder
  }

  private getStoryProgress(): number {
    // This would get the player's story progress
    return 0; // Placeholder
  }

  private async startNextOpponent(): Promise<void> {
    if (!this.currentPath) return;

    const opponent = this.currentPath.opponents[this.progress.currentOpponent];
    if (!opponent) return;

    this.currentOpponent = opponent;

    // Emit opponent started event
    this.app.fire('arcade:opponent_started', {
      opponent,
      progress: this.progress
    });

    Logger.info(`Started fight against ${opponent.name}`);
  }

  public async onFightResult(won: boolean, perfectVictory: boolean, damageDealt: number, damageTaken: number, combo: number): Promise<void> {
    if (!this.isActive || !this.currentOpponent) return;

    // Update progress
    if (won) {
      this.progress.wins++;
      if (perfectVictory) {
        this.progress.perfectVictories++;
      }
    } else {
      this.progress.losses++;
    }

    this.progress.damageDealt += damageDealt;
    this.progress.damageTaken += damageTaken;
    this.progress.combo = combo;
    this.progress.maxCombo = Math.max(this.progress.maxCombo, combo);

    // Calculate score
    const baseScore = won ? 1000 : 0;
    const perfectBonus = perfectVictory ? 500 : 0;
    const comboBonus = combo * 10;
    const damageBonus = damageDealt * 2;
    const timeBonus = Math.max(0, 300 - this.getCurrentFightTime()) * 5;
    
    this.progress.score += baseScore + perfectBonus + comboBonus + damageBonus + timeBonus;

    // Check if arcade is complete
    if (won && this.progress.currentOpponent >= this.progress.totalOpponents - 1) {
      await this.completeArcadeMode();
    } else if (won) {
      // Move to next opponent
      this.progress.currentOpponent++;
      await this.startNextOpponent();
    } else {
      // Game over
      await this.gameOver();
    }

    // Emit fight result event
    this.app.fire('arcade:fight_result', {
      won,
      perfectVictory,
      damageDealt,
      damageTaken,
      combo,
      progress: this.progress
    });
  }

  private getCurrentFightTime(): number {
    return (Date.now() - this.startTime - this.totalPauseTime) / 1000;
  }

  private async completeArcadeMode(): Promise<void> {
    if (!this.currentPath) return;

    // Calculate final score
    const timeBonus = Math.max(0, 1800 - this.getCurrentFightTime()) * 10; // 30 minutes max
    const perfectBonus = this.progress.perfectVictories * 1000;
    const winBonus = this.progress.wins * 500;
    
    this.progress.score += timeBonus + perfectBonus + winBonus;

    // Give rewards
    await this.giveRewards(this.currentPath.rewards);

    // Check for ending
    const ending = this.getEnding(this.currentPath.id, this.progress.difficulty, this.progress.perfectVictories === this.progress.totalOpponents);
    if (ending) {
      await this.showEnding(ending);
    }

    // Emit arcade completed event
    this.app.fire('arcade:completed', {
      path: this.currentPath,
      progress: this.progress,
      ending
    });

    Logger.info(`Completed arcade mode: ${this.currentPath.name}`);
    this.isActive = false;
  }

  private async gameOver(): Promise<void> {
    // Emit game over event
    this.app.fire('arcade:game_over', {
      progress: this.progress
    });

    Logger.info('Arcade mode game over');
    this.isActive = false;
  }

  private async giveRewards(rewards: any): Promise<void> {
    // Give experience
    if (rewards.experience) {
      // This would add experience to the player
    }

    // Give money
    if (rewards.money) {
      // This would add money to the player
    }

    // Unlock character
    if (rewards.characterUnlock) {
      // This would unlock the character
    }

    // Unlock move
    if (rewards.moveUnlock) {
      // This would unlock the move
    }

    // Give title
    if (rewards.title) {
      // This would give the title to the player
    }
  }

  private getEnding(pathId: string, difficulty: string, perfectVictory: boolean): ArcadeEnding | undefined {
    // Find the appropriate ending based on path, difficulty, and perfect victory
    for (const [character, endings] of this.endings.entries()) {
      for (const ending of endings) {
        if (ending.path === pathId && 
            ending.requirements.difficulty === difficulty && 
            (!ending.requirements.perfectVictory || perfectVictory)) {
          return ending;
        }
      }
    }
    return undefined;
  }

  private async showEnding(ending: ArcadeEnding): Promise<void> {
    // Show ending cutscene
    // This would display the ending image/video and text

    // Emit ending shown event
    this.app.fire('arcade:ending_shown', {
      ending,
      progress: this.progress
    });

    Logger.info(`Showed ending: ${ending.title}`);
  }

  public pauseArcadeMode(): void {
    if (!this.isActive) return;

    this.pauseTime = Date.now();
    
    // Emit pause event
    this.app.fire('arcade:paused', {
      progress: this.progress
    });

    Logger.info('Arcade mode paused');
  }

  public resumeArcadeMode(): void {
    if (!this.isActive || this.pauseTime === 0) return;

    this.totalPauseTime += Date.now() - this.pauseTime;
    this.pauseTime = 0;
    
    // Emit resume event
    this.app.fire('arcade:resumed', {
      progress: this.progress
    });

    Logger.info('Arcade mode resumed');
  }

  public quitArcadeMode(): void {
    if (!this.isActive) return;

    this.isActive = false;
    this.currentPath = null;
    this.currentOpponent = null;
    
    // Emit quit event
    this.app.fire('arcade:quit', {
      progress: this.progress
    });

    Logger.info('Arcade mode quit');
  }

  public getAvailablePaths(): ArcadePath[] {
    return Array.from(this.paths.values()).filter(path => 
      this.checkPathRequirements(path)
    );
  }

  public getCurrentPath(): ArcadePath | null {
    return this.currentPath;
  }

  public getCurrentOpponent(): ArcadeOpponent | null {
    return this.currentOpponent;
  }

  public getProgress(): ArcadeProgress {
    return this.progress;
  }

  public isArcadeActive(): boolean {
    return this.isActive;
  }

  public getEndingsForCharacter(characterId: string): ArcadeEnding[] {
    return this.endings.get(characterId) || [];
  }

  public destroy(): void {
    this.paths.clear();
    this.endings.clear();
    this.isActive = false;
    this.currentPath = null;
    this.currentOpponent = null;
  }
}