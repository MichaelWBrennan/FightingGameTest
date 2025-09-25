import { Character } from '../../../types/character';

export interface StoryChapter {
  id: string;
  title: string;
  description: string;
  characterId: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  stages: StoryStage[];
  unlockRequirements?: {
    previousChapters?: string[];
    characterLevel?: number;
    completionRate?: number;
  };
  rewards: {
    experience: number;
    currency: number;
    unlocks: string[];
  };
}

export interface StoryStage {
  id: string;
  title: string;
  description: string;
  opponentId: string;
  opponentLevel: number;
  stageId: string;
  musicTrack: string;
  dialogue: StoryDialogue[];
  preFightCutscene?: string;
  postFightCutscene?: string;
  winCondition: {
    type: 'ko' | 'time' | 'perfect' | 'combo';
    value?: number;
  };
  loseCondition: {
    type: 'ko' | 'time';
    value?: number;
  };
  specialRules?: {
    noBlocking?: boolean;
    noJumping?: boolean;
    timeLimit?: number;
    healthMultiplier?: number;
    meterStart?: number;
  };
  rewards: {
    experience: number;
    currency: number;
    unlocks: string[];
  };
}

export interface StoryDialogue {
  speaker: 'player' | 'opponent' | 'narrator' | 'other';
  characterId?: string;
  text: string;
  emotion?: 'neutral' | 'angry' | 'happy' | 'sad' | 'surprised' | 'determined';
  duration?: number;
  voiceClip?: string;
}

export interface StoryProgress {
  completedChapters: string[];
  completedStages: string[];
  currentChapter?: string;
  currentStage?: string;
  totalExperience: number;
  totalCurrency: number;
  unlockedCharacters: string[];
  unlockedStages: string[];
  unlockedMusic: string[];
  bestScores: Map<string, number>;
  completionTimes: Map<string, number>;
}

export class StoryMode {
  private chapters: Map<string, StoryChapter> = new Map();
  private progress: StoryProgress;
  private currentChapter: StoryChapter | null = null;
  private currentStage: StoryStage | null = null;
  private isPlaying = false;

  constructor() {
    this.progress = {
      completedChapters: [],
      completedStages: [],
      totalExperience: 0,
      totalCurrency: 0,
      unlockedCharacters: ['ryu', 'ken'], // Start with basic characters
      unlockedStages: ['training_room'],
      unlockedMusic: ['main_theme'],
      bestScores: new Map(),
      completionTimes: new Map()
    };

    this.initializeDefaultChapters();
  }

  private initializeDefaultChapters(): void {
    // Ryu's Story
    this.addChapter({
      id: 'ryu_chapter_1',
      title: 'The Wandering Warrior',
      description: 'Ryu seeks to test his skills against worthy opponents.',
      characterId: 'ryu',
      difficulty: 'easy',
      stages: [
        {
          id: 'ryu_stage_1',
          title: 'First Steps',
          description: 'Ryu faces a local fighter in a small dojo.',
          opponentId: 'ken',
          opponentLevel: 1,
          stageId: 'training_room',
          musicTrack: 'battle_theme_1',
          dialogue: [
            {
              speaker: 'opponent',
              characterId: 'ken',
              text: 'Hey Ryu! Ready for another sparring session?',
              emotion: 'happy'
            },
            {
              speaker: 'player',
              characterId: 'ryu',
              text: 'I am always ready to test my skills.',
              emotion: 'determined'
            }
          ],
          winCondition: { type: 'ko' },
          loseCondition: { type: 'ko' },
          rewards: {
            experience: 100,
            currency: 50,
            unlocks: ['ryu_costume_2']
          }
        },
        {
          id: 'ryu_stage_2',
          title: 'The Challenge',
          description: 'A mysterious fighter challenges Ryu to a duel.',
          opponentId: 'akuma',
          opponentLevel: 3,
          stageId: 'mountain_temple',
          musicTrack: 'boss_theme',
          dialogue: [
            {
              speaker: 'opponent',
              characterId: 'akuma',
              text: 'You have grown stronger, but are you ready for the true power of the Satsui no Hado?',
              emotion: 'angry'
            },
            {
              speaker: 'player',
              characterId: 'ryu',
              text: 'I will not be corrupted by that power!',
              emotion: 'determined'
            }
          ],
          winCondition: { type: 'ko' },
          loseCondition: { type: 'ko' },
          specialRules: {
            healthMultiplier: 1.2,
            meterStart: 50
          },
          rewards: {
            experience: 200,
            currency: 100,
            unlocks: ['ryu_super_2', 'akuma_character']
          }
        }
      ],
      rewards: {
        experience: 300,
        currency: 150,
        unlocks: ['ryu_ending', 'new_stage']
      }
    });

    // Ken's Story
    this.addChapter({
      id: 'ken_chapter_1',
      title: 'The American Dream',
      description: 'Ken Masters returns to America to defend his family business.',
      characterId: 'ken',
      difficulty: 'easy',
      stages: [
        {
          id: 'ken_stage_1',
          title: 'Homecoming',
          description: 'Ken faces street thugs threatening his family.',
          opponentId: 'zangief',
          opponentLevel: 2,
          stageId: 'city_street',
          musicTrack: 'battle_theme_2',
          dialogue: [
            {
              speaker: 'opponent',
              characterId: 'zangief',
              text: 'You think you can stop me with your fancy karate?',
              emotion: 'angry'
            },
            {
              speaker: 'player',
              characterId: 'ken',
              text: 'I\'ll show you what real fighting is about!',
              emotion: 'determined'
            }
          ],
          winCondition: { type: 'ko' },
          loseCondition: { type: 'ko' },
          rewards: {
            experience: 150,
            currency: 75,
            unlocks: ['ken_costume_2']
          }
        }
      ],
      rewards: {
        experience: 150,
        currency: 75,
        unlocks: ['ken_ending']
      }
    });

    // Chun-Li's Story
    this.addChapter({
      id: 'chunli_chapter_1',
      title: 'Justice Never Sleeps',
      description: 'Chun-Li investigates a criminal organization.',
      characterId: 'chun_li',
      difficulty: 'medium',
      stages: [
        {
          id: 'chunli_stage_1',
          title: 'The Investigation',
          description: 'Chun-Li confronts a suspect in a dark alley.',
          opponentId: 'sagat',
          opponentLevel: 4,
          stageId: 'dark_alley',
          musicTrack: 'battle_theme_1',
          dialogue: [
            {
              speaker: 'opponent',
              characterId: 'sagat',
              text: 'You should not have come here alone, little girl.',
              emotion: 'angry'
            },
            {
              speaker: 'player',
              characterId: 'chun_li',
              text: 'I am not alone - I have justice on my side!',
              emotion: 'determined'
            }
          ],
          winCondition: { type: 'ko' },
          loseCondition: { type: 'ko' },
          specialRules: {
            timeLimit: 60,
            healthMultiplier: 0.8
          },
          rewards: {
            experience: 200,
            currency: 100,
            unlocks: ['chunli_costume_2']
          }
        }
      ],
      rewards: {
        experience: 200,
        currency: 100,
        unlocks: ['chunli_ending']
      }
    });
  }

  public addChapter(chapter: StoryChapter): void {
    this.chapters.set(chapter.id, chapter);
  }

  public getChapter(chapterId: string): StoryChapter | null {
    return this.chapters.get(chapterId) || null;
  }

  public getAllChapters(): StoryChapter[] {
    return Array.from(this.chapters.values());
  }

  public getAvailableChapters(): StoryChapter[] {
    return this.getAllChapters().filter(chapter => this.isChapterAvailable(chapter));
  }

  public isChapterAvailable(chapter: StoryChapter): boolean {
    if (!chapter.unlockRequirements) return true;

    const req = chapter.unlockRequirements;

    // Check previous chapters requirement
    if (req.previousChapters) {
      for (const prevChapterId of req.previousChapters) {
        if (!this.progress.completedChapters.includes(prevChapterId)) {
          return false;
        }
      }
    }

    // Check character level requirement
    if (req.characterLevel) {
      // This would need to be implemented with a character progression system
      // For now, assume all characters are level 1
      return true;
    }

    // Check completion rate requirement
    if (req.completionRate) {
      const totalChapters = this.getAllChapters().length;
      const completedChapters = this.progress.completedChapters.length;
      const completionRate = completedChapters / totalChapters;
      return completionRate >= req.completionRate;
    }

    return true;
  }

  public startChapter(chapterId: string): boolean {
    const chapter = this.getChapter(chapterId);
    if (!chapter || !this.isChapterAvailable(chapter)) {
      return false;
    }

    this.currentChapter = chapter;
    this.progress.currentChapter = chapterId;
    this.isPlaying = true;

    return true;
  }

  public startStage(stageId: string): boolean {
    if (!this.currentChapter) return false;

    const stage = this.currentChapter.stages.find(s => s.id === stageId);
    if (!stage) return false;

    this.currentStage = stage;
    this.progress.currentStage = stageId;

    return true;
  }

  public completeStage(stageId: string, score: number, completionTime: number): void {
    if (!this.currentStage || this.currentStage.id !== stageId) return;

    // Add to completed stages
    if (!this.progress.completedStages.includes(stageId)) {
      this.progress.completedStages.push(stageId);
    }

    // Update best score
    const currentBest = this.progress.bestScores.get(stageId) || 0;
    if (score > currentBest) {
      this.progress.bestScores.set(stageId, score);
    }

    // Update completion time
    const currentTime = this.progress.completionTimes.get(stageId) || Infinity;
    if (completionTime < currentTime) {
      this.progress.completionTimes.set(stageId, completionTime);
    }

    // Add rewards
    this.progress.totalExperience += this.currentStage.rewards.experience;
    this.progress.totalCurrency += this.currentStage.rewards.currency;

    // Unlock new content
    for (const unlock of this.currentStage.rewards.unlocks) {
      this.unlockContent(unlock);
    }

    // Check if chapter is complete
    if (this.isChapterComplete()) {
      this.completeChapter();
    }
  }

  private isChapterComplete(): boolean {
    if (!this.currentChapter) return false;

    return this.currentChapter.stages.every(stage => 
      this.progress.completedStages.includes(stage.id)
    );
  }

  private completeChapter(): void {
    if (!this.currentChapter) return;

    // Add to completed chapters
    if (!this.progress.completedChapters.includes(this.currentChapter.id)) {
      this.progress.completedChapters.push(this.currentChapter.id);
    }

    // Add chapter rewards
    this.progress.totalExperience += this.currentChapter.rewards.experience;
    this.progress.totalCurrency += this.currentChapter.rewards.currency;

    // Unlock new content
    for (const unlock of this.currentChapter.rewards.unlocks) {
      this.unlockContent(unlock);
    }

    // Clear current chapter
    this.currentChapter = null;
    this.progress.currentChapter = undefined;
    this.isPlaying = false;
  }

  private unlockContent(unlock: string): void {
    if (unlock.startsWith('character_')) {
      const characterId = unlock.replace('character_', '');
      if (!this.progress.unlockedCharacters.includes(characterId)) {
        this.progress.unlockedCharacters.push(characterId);
      }
    } else if (unlock.startsWith('stage_')) {
      const stageId = unlock.replace('stage_', '');
      if (!this.progress.unlockedStages.includes(stageId)) {
        this.progress.unlockedStages.push(stageId);
      }
    } else if (unlock.startsWith('music_')) {
      const musicId = unlock.replace('music_', '');
      if (!this.progress.unlockedMusic.includes(musicId)) {
        this.progress.unlockedMusic.push(musicId);
      }
    }
  }

  public getCurrentChapter(): StoryChapter | null {
    return this.currentChapter;
  }

  public getCurrentStage(): StoryStage | null {
    return this.currentStage;
  }

  public getProgress(): StoryProgress {
    return { ...this.progress };
  }

  public isPlayingStory(): boolean {
    return this.isPlaying;
  }

  public getCompletionPercentage(): number {
    const totalStages = this.getAllChapters().reduce((sum, chapter) => sum + chapter.stages.length, 0);
    const completedStages = this.progress.completedStages.length;
    return totalStages > 0 ? (completedStages / totalStages) * 100 : 0;
  }

  public getChapterProgress(chapterId: string): number {
    const chapter = this.getChapter(chapterId);
    if (!chapter) return 0;

    const completedStages = chapter.stages.filter(stage => 
      this.progress.completedStages.includes(stage.id)
    ).length;

    return (completedStages / chapter.stages.length) * 100;
  }

  public resetProgress(): void {
    this.progress = {
      completedChapters: [],
      completedStages: [],
      totalExperience: 0,
      totalCurrency: 0,
      unlockedCharacters: ['ryu', 'ken'],
      unlockedStages: ['training_room'],
      unlockedMusic: ['main_theme'],
      bestScores: new Map(),
      completionTimes: new Map()
    };

    this.currentChapter = null;
    this.currentStage = null;
    this.isPlaying = false;
  }

  public saveProgress(): string {
    return JSON.stringify({
      ...this.progress,
      bestScores: Array.from(this.progress.bestScores.entries()),
      completionTimes: Array.from(this.progress.completionTimes.entries())
    });
  }

  public loadProgress(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      this.progress = {
        ...parsed,
        bestScores: new Map(parsed.bestScores || []),
        completionTimes: new Map(parsed.completionTimes || [])
      };
      return true;
    } catch (error) {
      console.error('Failed to load story progress:', error);
      return false;
    }
  }
}