import type { pc } from 'playcanvas';
import { Character } from '../../../types/character';
import { Logger } from '../utils/Logger';

export interface StoryChapter {
  id: string;
  name: string;
  description: string;
  character: string;
  chapterNumber: number;
  objectives: StoryObjective[];
  cutscenes: StoryCutscene[];
  fights: StoryFight[];
  rewards: {
    experience?: number;
    money?: number;
    items?: string[];
    characterUnlock?: string;
    moveUnlock?: string;
  };
  requirements: {
    level?: number;
    storyProgress?: number;
    characterUnlocked?: string;
    previousChapter?: string;
  };
  status: 'locked' | 'available' | 'in_progress' | 'completed';
}

export interface StoryObjective {
  id: string;
  name: string;
  description: string;
  type: 'fight' | 'cutscene' | 'exploration' | 'dialogue' | 'collection';
  target: string;
  count: number;
  current: number;
  completed: boolean;
  rewards: {
    experience?: number;
    money?: number;
    items?: string[];
  };
}

export interface StoryCutscene {
  id: string;
  name: string;
  description: string;
  type: 'dialogue' | 'cinematic' | 'flashback' | 'narration';
  content: {
    text?: string;
    audio?: string;
    video?: string;
    image?: string;
    character?: string;
    emotion?: string;
  };
  duration: number;
  skipable: boolean;
  choices?: StoryChoice[];
}

export interface StoryChoice {
  id: string;
  text: string;
  consequence: {
    experience?: number;
    money?: number;
    storyBranch?: string;
    characterRelationship?: number;
  };
  requirements?: {
    level?: number;
    storyProgress?: number;
    characterUnlocked?: string;
  };
}

export interface StoryFight {
  id: string;
  name: string;
  description: string;
  opponent: {
    character: string;
    name: string;
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    health: number;
    maxHealth: number;
    meter: number;
    maxMeter: number;
    aiLevel: number;
  };
  stage: string;
  backgroundMusic: string;
  conditions: {
    winCondition: 'defeat_opponent' | 'survive_time' | 'deal_damage';
    timeLimit?: number;
    damageRequired?: number;
  };
  rewards: {
    experience?: number;
    money?: number;
    items?: string[];
    storyProgress?: number;
  };
}

export interface CharacterStory {
  characterId: string;
  characterName: string;
  description: string;
  chapters: StoryChapter[];
  totalChapters: number;
  completedChapters: number;
  progress: number;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  rewards: {
    experience?: number;
    money?: number;
    items?: string[];
    characterUnlock?: string;
    moveUnlock?: string;
    title?: string;
  };
}

export class CharacterStoryMode {
  private app: pc.Application;
  private characterStories: Map<string, CharacterStory> = new Map();
  private currentStory: CharacterStory | null = null;
  private currentChapter: StoryChapter | null = null;
  private storyProgress: Map<string, number> = new Map();
  private completedChapters: Set<string> = new Set();
  private storyChoices: Map<string, string> = new Map();

  constructor(app: pc.Application) {
    this.app = app;
    this.initializeCharacterStories();
  }

  private initializeCharacterStories(): void {
    this.initializeRyuStory();
    this.initializeKenStory();
    this.initializeChunLiStory();
    this.initializeZangiefStory();
    this.initializeDhalsimStory();
    this.initializeAkumaStory();
  }

  private initializeRyuStory(): void {
    const ryuStory: CharacterStory = {
      characterId: 'ryu',
      characterName: 'Ryu',
      description: 'Follow Ryu\'s journey to master the way of the warrior',
      chapters: [
        {
          id: 'ryu_chapter_1',
          name: 'The Beginning',
          description: 'Ryu starts his journey as a young fighter',
          character: 'ryu',
          chapterNumber: 1,
          objectives: [
            {
              id: 'ryu_chapter_1_objective_1',
              name: 'Complete Training',
              description: 'Complete basic training with Master Gouken',
              type: 'fight',
              target: 'training_fight',
              count: 1,
              current: 0,
              completed: false,
              rewards: { experience: 100, money: 200 }
            },
            {
              id: 'ryu_chapter_1_objective_2',
              name: 'Learn Hadoken',
              description: 'Master the Hadoken technique',
              type: 'cutscene',
              target: 'hadoken_training',
              count: 1,
              current: 0,
              completed: false,
              rewards: { experience: 150, moveUnlock: 'hadoken' }
            }
          ],
          cutscenes: [
            {
              id: 'ryu_chapter_1_cutscene_1',
              name: 'Training with Gouken',
              description: 'Ryu trains with his master',
              type: 'dialogue',
              content: {
                text: 'Gouken: "Ryu, the way of the warrior is long and difficult. You must train hard every day."',
                audio: 'gouken_dialogue_1.mp3',
                character: 'gouken',
                emotion: 'serious'
              },
              duration: 5000,
              skipable: true
            }
          ],
          fights: [
            {
              id: 'ryu_chapter_1_fight_1',
              name: 'Training Fight',
              description: 'Fight against training dummy',
              opponent: {
                character: 'training_dummy',
                name: 'Training Dummy',
                difficulty: 'easy',
                health: 500,
                maxHealth: 500,
                meter: 0,
                maxMeter: 100,
                aiLevel: 1
              },
              stage: 'training_grounds',
              backgroundMusic: 'training_theme.mp3',
              conditions: {
                winCondition: 'defeat_opponent'
              },
              rewards: { experience: 200, money: 100 }
            }
          ],
          rewards: { experience: 500, money: 300, moveUnlock: 'hadoken' },
          requirements: {},
          status: 'available'
        },
        {
          id: 'ryu_chapter_2',
          name: 'The Rival',
          description: 'Ryu faces his rival Ken in a friendly match',
          character: 'ryu',
          chapterNumber: 2,
          objectives: [
            {
              id: 'ryu_chapter_2_objective_1',
              name: 'Defeat Ken',
              description: 'Win the friendly match against Ken',
              type: 'fight',
              target: 'ken_fight',
              count: 1,
              current: 0,
              completed: false,
              rewards: { experience: 300, money: 500 }
            }
          ],
          cutscenes: [
            {
              id: 'ryu_chapter_2_cutscene_1',
              name: 'Meeting Ken',
              description: 'Ryu meets his rival Ken',
              type: 'dialogue',
              content: {
                text: 'Ken: "Hey Ryu! Ready for another match? I\'ve been practicing!"',
                audio: 'ken_dialogue_1.mp3',
                character: 'ken',
                emotion: 'excited'
              },
              duration: 3000,
              skipable: true
            }
          ],
          fights: [
            {
              id: 'ryu_chapter_2_fight_1',
              name: 'Fight Against Ken',
              description: 'Friendly match against Ken',
              opponent: {
                character: 'ken',
                name: 'Ken Masters',
                difficulty: 'medium',
                health: 1000,
                maxHealth: 1000,
                meter: 0,
                maxMeter: 100,
                aiLevel: 3
              },
              stage: 'metro_city',
              backgroundMusic: 'ken_theme.mp3',
              conditions: {
                winCondition: 'defeat_opponent'
              },
              rewards: { experience: 400, money: 300 }
            }
          ],
          rewards: { experience: 700, money: 800, characterUnlock: 'ken' },
          requirements: { previousChapter: 'ryu_chapter_1' },
          status: 'locked'
        }
      ],
      totalChapters: 2,
      completedChapters: 0,
      progress: 0,
      status: 'available',
      rewards: { experience: 1200, money: 1100, characterUnlock: 'ken', title: 'Warrior of the Way' }
    };

    this.characterStories.set('ryu', ryuStory);
  }

  private initializeKenStory(): void {
    const kenStory: CharacterStory = {
      characterId: 'ken',
      characterName: 'Ken Masters',
      description: 'Follow Ken\'s journey to become the ultimate American fighter',
      chapters: [
        {
          id: 'ken_chapter_1',
          name: 'The American Dream',
          description: 'Ken starts his journey in America',
          character: 'ken',
          chapterNumber: 1,
          objectives: [
            {
              id: 'ken_chapter_1_objective_1',
              name: 'Win Street Fight',
              description: 'Win a street fight in Metro City',
              type: 'fight',
              target: 'street_fight',
              count: 1,
              current: 0,
              completed: false,
              rewards: { experience: 200, money: 300 }
            }
          ],
          cutscenes: [
            {
              id: 'ken_chapter_1_cutscene_1',
              name: 'Arrival in Metro City',
              description: 'Ken arrives in Metro City',
              type: 'dialogue',
              content: {
                text: 'Ken: "Time to show these street fighters what I\'m made of!"',
                audio: 'ken_arrival.mp3',
                character: 'ken',
                emotion: 'confident'
              },
              duration: 4000,
              skipable: true
            }
          ],
          fights: [
            {
              id: 'ken_chapter_1_fight_1',
              name: 'Street Fight',
              description: 'Fight against street thugs',
              opponent: {
                character: 'street_thug',
                name: 'Street Thug',
                difficulty: 'easy',
                health: 800,
                maxHealth: 800,
                meter: 0,
                maxMeter: 100,
                aiLevel: 2
              },
              stage: 'metro_city_street',
              backgroundMusic: 'street_fight_theme.mp3',
              conditions: {
                winCondition: 'defeat_opponent'
              },
              rewards: { experience: 300, money: 200 }
            }
          ],
          rewards: { experience: 500, money: 500 },
          requirements: {},
          status: 'available'
        }
      ],
      totalChapters: 1,
      completedChapters: 0,
      progress: 0,
      status: 'available',
      rewards: { experience: 500, money: 500, title: 'American Fighter' }
    };

    this.characterStories.set('ken', kenStory);
  }

  private initializeChunLiStory(): void {
    const chunLiStory: CharacterStory = {
      characterId: 'chun_li',
      characterName: 'Chun-Li',
      description: 'Follow Chun-Li\'s journey to become the strongest woman in the world',
      chapters: [
        {
          id: 'chun_li_chapter_1',
          name: 'The Strongest Woman',
          description: 'Chun-Li begins her quest for strength',
          character: 'chun_li',
          chapterNumber: 1,
          objectives: [
            {
              id: 'chun_li_chapter_1_objective_1',
              name: 'Master Leg Techniques',
              description: 'Master advanced leg techniques',
              type: 'fight',
              target: 'leg_training',
              count: 1,
              current: 0,
              completed: false,
              rewards: { experience: 250, money: 300 }
            }
          ],
          cutscenes: [
            {
              id: 'chun_li_chapter_1_cutscene_1',
              name: 'Training in China',
              description: 'Chun-Li trains in her homeland',
              type: 'dialogue',
              content: {
                text: 'Chun-Li: "I will become the strongest woman in the world!"',
                audio: 'chun_li_dialogue_1.mp3',
                character: 'chun_li',
                emotion: 'determined'
              },
              duration: 4000,
              skipable: true
            }
          ],
          fights: [
            {
              id: 'chun_li_chapter_1_fight_1',
              name: 'Leg Training',
              description: 'Training fight to master leg techniques',
              opponent: {
                character: 'training_partner',
                name: 'Training Partner',
                difficulty: 'medium',
                health: 1000,
                maxHealth: 1000,
                meter: 0,
                maxMeter: 100,
                aiLevel: 3
              },
              stage: 'china_town',
              backgroundMusic: 'chun_li_theme.mp3',
              conditions: {
                winCondition: 'defeat_opponent'
              },
              rewards: { experience: 400, money: 250 }
            }
          ],
          rewards: { experience: 650, money: 550, moveUnlock: 'spinning_bird_kick' },
          requirements: {},
          status: 'available'
        }
      ],
      totalChapters: 1,
      completedChapters: 0,
      progress: 0,
      status: 'available',
      rewards: { experience: 650, money: 550, title: 'Strongest Woman in the World' }
    };

    this.characterStories.set('chun_li', chunLiStory);
  }

  private initializeZangiefStory(): void {
    const zangiefStory: CharacterStory = {
      characterId: 'zangief',
      characterName: 'Zangief',
      description: 'Follow Zangief\'s journey to become the Red Cyclone',
      chapters: [
        {
          id: 'zangief_chapter_1',
          name: 'The Red Cyclone',
          description: 'Zangief begins his journey in Russia',
          character: 'zangief',
          chapterNumber: 1,
          objectives: [
            {
              id: 'zangief_chapter_1_objective_1',
              name: 'Master Grappling',
              description: 'Master advanced grappling techniques',
              type: 'fight',
              target: 'grappling_training',
              count: 1,
              current: 0,
              completed: false,
              rewards: { experience: 300, money: 400 }
            }
          ],
          cutscenes: [
            {
              id: 'zangief_chapter_1_cutscene_1',
              name: 'Training in Russia',
              description: 'Zangief trains in the harsh Russian winter',
              type: 'dialogue',
              content: {
                text: 'Zangief: "I will crush all who stand in my way!"',
                audio: 'zangief_dialogue_1.mp3',
                character: 'zangief',
                emotion: 'fierce'
              },
              duration: 4000,
              skipable: true
            }
          ],
          fights: [
            {
              id: 'zangief_chapter_1_fight_1',
              name: 'Grappling Training',
              description: 'Training fight to master grappling',
              opponent: {
                character: 'wrestling_opponent',
                name: 'Wrestling Opponent',
                difficulty: 'medium',
                health: 1200,
                maxHealth: 1200,
                meter: 0,
                maxMeter: 100,
                aiLevel: 3
              },
              stage: 'russia',
              backgroundMusic: 'zangief_theme.mp3',
              conditions: {
                winCondition: 'defeat_opponent'
              },
              rewards: { experience: 500, money: 300 }
            }
          ],
          rewards: { experience: 800, money: 700, moveUnlock: 'spinning_piledriver' },
          requirements: {},
          status: 'available'
        }
      ],
      totalChapters: 1,
      completedChapters: 0,
      progress: 0,
      status: 'available',
      rewards: { experience: 800, money: 700, title: 'Red Cyclone' }
    };

    this.characterStories.set('zangief', zangiefStory);
  }

  private initializeDhalsimStory(): void {
    const dhalsimStory: CharacterStory = {
      characterId: 'dhalsim',
      characterName: 'Dhalsim',
      description: 'Follow Dhalsim\'s journey to master yoga and find inner peace',
      chapters: [
        {
          id: 'dhalsim_chapter_1',
          name: 'The Yoga Master',
          description: 'Dhalsim begins his spiritual journey',
          character: 'dhalsim',
          chapterNumber: 1,
          objectives: [
            {
              id: 'dhalsim_chapter_1_objective_1',
              name: 'Master Yoga',
              description: 'Master advanced yoga techniques',
              type: 'fight',
              target: 'yoga_training',
              count: 1,
              current: 0,
              completed: false,
              rewards: { experience: 200, money: 300 }
            }
          ],
          cutscenes: [
            {
              id: 'dhalsim_chapter_1_cutscene_1',
              name: 'Meditation in India',
              description: 'Dhalsim meditates in the mountains',
              type: 'dialogue',
              content: {
                text: 'Dhalsim: "Yoga is the path to inner peace and strength."',
                audio: 'dhalsim_dialogue_1.mp3',
                character: 'dhalsim',
                emotion: 'peaceful'
              },
              duration: 5000,
              skipable: true
            }
          ],
          fights: [
            {
              id: 'dhalsim_chapter_1_fight_1',
              name: 'Yoga Training',
              description: 'Training fight to master yoga',
              opponent: {
                character: 'yoga_student',
                name: 'Yoga Student',
                difficulty: 'medium',
                health: 1000,
                maxHealth: 1000,
                meter: 0,
                maxMeter: 100,
                aiLevel: 3
              },
              stage: 'india',
              backgroundMusic: 'dhalsim_theme.mp3',
              conditions: {
                winCondition: 'defeat_opponent'
              },
              rewards: { experience: 400, money: 250 }
            }
          ],
          rewards: { experience: 600, money: 550, moveUnlock: 'yoga_fire' },
          requirements: {},
          status: 'available'
        }
      ],
      totalChapters: 1,
      completedChapters: 0,
      progress: 0,
      status: 'available',
      rewards: { experience: 600, money: 550, title: 'Yoga Master' }
    };

    this.characterStories.set('dhalsim', dhalsimStory);
  }

  private initializeAkumaStory(): void {
    const akumaStory: CharacterStory = {
      characterId: 'akuma',
      characterName: 'Akuma',
      description: 'Follow Akuma\'s journey to embrace the power of the demon',
      chapters: [
        {
          id: 'akuma_chapter_1',
          name: 'The Demon\'s Path',
          description: 'Akuma begins his dark journey',
          character: 'akuma',
          chapterNumber: 1,
          objectives: [
            {
              id: 'akuma_chapter_1_objective_1',
              name: 'Embrace the Demon',
              description: 'Embrace the power of the demon',
              type: 'fight',
              target: 'demon_training',
              count: 1,
              current: 0,
              completed: false,
              rewards: { experience: 400, money: 500 }
            }
          ],
          cutscenes: [
            {
              id: 'akuma_chapter_1_cutscene_1',
              name: 'The Demon Awakens',
              description: 'Akuma awakens his demonic power',
              type: 'dialogue',
              content: {
                text: 'Akuma: "The power of the demon flows through me!"',
                audio: 'akuma_dialogue_1.mp3',
                character: 'akuma',
                emotion: 'dark'
              },
              duration: 4000,
              skipable: true
            }
          ],
          fights: [
            {
              id: 'akuma_chapter_1_fight_1',
              name: 'Demon Training',
              description: 'Training fight to master demonic power',
              opponent: {
                character: 'demon_opponent',
                name: 'Demon Opponent',
                difficulty: 'hard',
                health: 1500,
                maxHealth: 1500,
                meter: 0,
                maxMeter: 100,
                aiLevel: 4
              },
              stage: 'demon_world',
              backgroundMusic: 'akuma_theme.mp3',
              conditions: {
                winCondition: 'defeat_opponent'
              },
              rewards: { experience: 600, money: 400 }
            }
          ],
          rewards: { experience: 1000, money: 900, moveUnlock: 'demon_palm' },
          requirements: { level: 10 },
          status: 'locked'
        }
      ],
      totalChapters: 1,
      completedChapters: 0,
      progress: 0,
      status: 'locked',
      rewards: { experience: 1000, money: 900, title: 'Master of the Demon' }
    };

    this.characterStories.set('akuma', akumaStory);
  }

  public async startCharacterStory(characterId: string): Promise<boolean> {
    const story = this.characterStories.get(characterId);
    if (!story) {
      Logger.warn(`Character story not found for ${characterId}`);
      return false;
    }

    if (story.status === 'locked') {
      Logger.warn(`Character story is locked for ${characterId}`);
      return false;
    }

    this.currentStory = story;
    this.currentChapter = story.chapters[0];

    // Emit story started event
    this.app.fire('story:started', {
      characterId,
      story,
      chapter: this.currentChapter
    });

    Logger.info(`Started character story for ${characterId}`);
    return true;
  }

  public async startChapter(chapterId: string): Promise<boolean> {
    if (!this.currentStory) {
      Logger.warn('No current story');
      return false;
    }

    const chapter = this.currentStory.chapters.find(c => c.id === chapterId);
    if (!chapter) {
      Logger.warn(`Chapter ${chapterId} not found`);
      return false;
    }

    if (chapter.status === 'locked') {
      Logger.warn(`Chapter ${chapterId} is locked`);
      return false;
    }

    this.currentChapter = chapter;
    chapter.status = 'in_progress';

    // Emit chapter started event
    this.app.fire('story:chapter_started', {
      chapterId,
      chapter,
      story: this.currentStory
    });

    Logger.info(`Started chapter ${chapter.name}`);
    return true;
  }

  public async completeObjective(objectiveId: string): Promise<boolean> {
    if (!this.currentChapter) {
      Logger.warn('No current chapter');
      return false;
    }

    const objective = this.currentChapter.objectives.find(o => o.id === objectiveId);
    if (!objective) {
      Logger.warn(`Objective ${objectiveId} not found`);
      return false;
    }

    objective.current++;
    if (objective.current >= objective.count) {
      objective.completed = true;
      
      // Give rewards
      this.giveRewards(objective.rewards);
      
      // Emit objective completed event
      this.app.fire('story:objective_completed', {
        objectiveId,
        objective,
        chapter: this.currentChapter
      });

      Logger.info(`Completed objective ${objective.name}`);
      
      // Check if chapter is complete
      this.checkChapterCompletion();
    }

    return true;
  }

  private checkChapterCompletion(): void {
    if (!this.currentChapter) return;

    const allObjectivesCompleted = this.currentChapter.objectives.every(obj => obj.completed);
    if (allObjectivesCompleted) {
      this.completeChapter();
    }
  }

  private async completeChapter(): Promise<void> {
    if (!this.currentChapter || !this.currentStory) return;

    this.currentChapter.status = 'completed';
    this.completedChapters.add(this.currentChapter.id);
    this.currentStory.completedChapters++;

    // Give chapter rewards
    this.giveRewards(this.currentChapter.rewards);

    // Update story progress
    this.currentStory.progress = (this.currentStory.completedChapters / this.currentStory.totalChapters) * 100;

    // Check if story is complete
    if (this.currentStory.completedChapters >= this.currentStory.totalChapters) {
      this.completeStory();
    }

    // Emit chapter completed event
    this.app.fire('story:chapter_completed', {
      chapter: this.currentChapter,
      story: this.currentStory
    });

    Logger.info(`Completed chapter ${this.currentChapter.name}`);
  }

  private async completeStory(): Promise<void> {
    if (!this.currentStory) return;

    this.currentStory.status = 'completed';

    // Give story rewards
    this.giveRewards(this.currentStory.rewards);

    // Emit story completed event
    this.app.fire('story:completed', {
      story: this.currentStory
    });

    Logger.info(`Completed story for ${this.currentStory.characterName}`);
  }

  private giveRewards(rewards: any): void {
    // Give experience
    if (rewards.experience) {
      // This would add experience to the player
    }

    // Give money
    if (rewards.money) {
      // This would add money to the player
    }

    // Give items
    if (rewards.items) {
      for (const itemId of rewards.items) {
        // This would add items to the player's inventory
      }
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

  public getCharacterStories(): CharacterStory[] {
    return Array.from(this.characterStories.values());
  }

  public getCharacterStory(characterId: string): CharacterStory | undefined {
    return this.characterStories.get(characterId);
  }

  public getCurrentStory(): CharacterStory | null {
    return this.currentStory;
  }

  public getCurrentChapter(): StoryChapter | null {
    return this.currentChapter;
  }

  public getAvailableStories(): CharacterStory[] {
    return Array.from(this.characterStories.values()).filter(story => 
      story.status === 'available' || story.status === 'in_progress'
    );
  }

  public getCompletedStories(): CharacterStory[] {
    return Array.from(this.characterStories.values()).filter(story => 
      story.status === 'completed'
    );
  }

  public destroy(): void {
    this.characterStories.clear();
    this.currentStory = null;
    this.currentChapter = null;
    this.storyProgress.clear();
    this.completedChapters.clear();
    this.storyChoices.clear();
  }
}