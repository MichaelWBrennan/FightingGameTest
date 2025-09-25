export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'interactive' | 'demonstration' | 'practice';
  content: {
    text?: string;
    image?: string;
    video?: string;
    audio?: string;
    animation?: string;
  };
  requirements: {
    input?: string[];
    timing?: number;
    position?: { x: number; y: number };
    condition?: string;
  };
  hints: string[];
  successCondition: string;
  failureCondition?: string;
  nextStep?: string;
  skipAllowed: boolean;
  duration?: number;
}

export interface TutorialLesson {
  id: string;
  title: string;
  description: string;
  category: 'basics' | 'combat' | 'advanced' | 'character_specific' | 'online';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  characterId?: string;
  prerequisites: string[];
  steps: TutorialStep[];
  rewards: {
    experience: number;
    currency: number;
    unlocks: string[];
  };
  estimatedTime: number;
  completionRate: number;
}

export interface TutorialProgress {
  completedLessons: string[];
  completedSteps: string[];
  currentLesson?: string;
  currentStep?: string;
  totalTimeSpent: number;
  lastPlayed: Date;
  achievements: string[];
}

export class TutorialSystem {
  private lessons: Map<string, TutorialLesson> = new Map();
  private progress: TutorialProgress;
  private currentLesson: TutorialLesson | null = null;
  private currentStep: TutorialStep | null = null;
  private stepStartTime: number = 0;
  private isPlaying = false;

  constructor() {
    this.progress = {
      completedLessons: [],
      completedSteps: [],
      totalTimeSpent: 0,
      lastPlayed: new Date(),
      achievements: []
    };

    this.initializeDefaultLessons();
  }

  private initializeDefaultLessons(): void {
    // Basic Movement Tutorial
    this.addLesson({
      id: 'basic_movement',
      title: 'Basic Movement',
      description: 'Learn the fundamentals of character movement',
      category: 'basics',
      difficulty: 'beginner',
      prerequisites: [],
      estimatedTime: 5,
      completionRate: 0,
      steps: [
        {
          id: 'movement_intro',
          title: 'Introduction to Movement',
          description: 'Learn how to move your character around the stage',
          type: 'info',
          content: {
            text: 'Use the directional inputs to move your character. Left and right move horizontally, up jumps, and down crouches.',
            image: '/images/tutorial/movement_basics.png'
          },
          requirements: {},
          hints: ['Try moving left and right with the arrow keys or WASD'],
          successCondition: 'movement_detected',
          skipAllowed: true,
          duration: 10
        },
        {
          id: 'walking_practice',
          title: 'Walking Practice',
          description: 'Practice walking left and right',
          type: 'practice',
          content: {
            text: 'Walk to the left side of the stage, then walk to the right side.',
            animation: 'walking_demo'
          },
          requirements: {
            input: ['left', 'right'],
            position: { x: -2, y: 0 }
          },
          hints: ['Hold left to walk left, hold right to walk right'],
          successCondition: 'position_reached',
          nextStep: 'jumping_practice'
        },
        {
          id: 'jumping_practice',
          title: 'Jumping Practice',
          description: 'Learn how to jump',
          type: 'practice',
          content: {
            text: 'Press up to jump. Try jumping over the training dummy.',
            animation: 'jumping_demo'
          },
          requirements: {
            input: ['up'],
            timing: 2
          },
          hints: ['Press and hold up to jump higher'],
          successCondition: 'jump_performed',
          nextStep: 'crouching_practice'
        },
        {
          id: 'crouching_practice',
          title: 'Crouching Practice',
          description: 'Learn how to crouch',
          type: 'practice',
          content: {
            text: 'Press down to crouch. Crouching makes you smaller and can avoid high attacks.',
            animation: 'crouching_demo'
          },
          requirements: {
            input: ['down'],
            timing: 2
          },
          hints: ['Hold down to stay crouched'],
          successCondition: 'crouch_performed'
        }
      ],
      rewards: {
        experience: 50,
        currency: 25,
        unlocks: ['movement_master_badge']
      }
    });

    // Basic Attacks Tutorial
    this.addLesson({
      id: 'basic_attacks',
      title: 'Basic Attacks',
      description: 'Learn the fundamental attack buttons',
      category: 'basics',
      difficulty: 'beginner',
      prerequisites: ['basic_movement'],
      estimatedTime: 8,
      completionRate: 0,
      steps: [
        {
          id: 'attack_intro',
          title: 'Introduction to Attacks',
          description: 'Learn about the different attack buttons',
          type: 'info',
          content: {
            text: 'There are 6 basic attack buttons: 3 punches (light, medium, heavy) and 3 kicks (light, medium, heavy).',
            image: '/images/tutorial/attack_buttons.png'
          },
          requirements: {},
          hints: ['Punches are typically faster but weaker, kicks are slower but stronger'],
          successCondition: 'info_read',
          skipAllowed: true,
          duration: 15
        },
        {
          id: 'light_punch_practice',
          title: 'Light Punch Practice',
          description: 'Practice using light punch',
          type: 'practice',
          content: {
            text: 'Press the light punch button to perform a quick jab.',
            animation: 'light_punch_demo'
          },
          requirements: {
            input: ['light_punch'],
            timing: 3
          },
          hints: ['Light punch is the fastest attack but does the least damage'],
          successCondition: 'light_punch_performed',
          nextStep: 'medium_punch_practice'
        },
        {
          id: 'medium_punch_practice',
          title: 'Medium Punch Practice',
          description: 'Practice using medium punch',
          type: 'practice',
          content: {
            text: 'Press the medium punch button for a stronger attack.',
            animation: 'medium_punch_demo'
          },
          requirements: {
            input: ['medium_punch'],
            timing: 3
          },
          hints: ['Medium punch is balanced between speed and power'],
          successCondition: 'medium_punch_performed',
          nextStep: 'heavy_punch_practice'
        },
        {
          id: 'heavy_punch_practice',
          title: 'Heavy Punch Practice',
          description: 'Practice using heavy punch',
          type: 'practice',
          content: {
            text: 'Press the heavy punch button for the strongest punch attack.',
            animation: 'heavy_punch_demo'
          },
          requirements: {
            input: ['heavy_punch'],
            timing: 3
          },
          hints: ['Heavy punch is slow but very powerful'],
          successCondition: 'heavy_punch_performed',
          nextStep: 'kick_practice'
        },
        {
          id: 'kick_practice',
          title: 'Kick Practice',
          description: 'Practice using kick attacks',
          type: 'practice',
          content: {
            text: 'Try all three kick buttons: light, medium, and heavy kicks.',
            animation: 'kick_demo'
          },
          requirements: {
            input: ['light_kick', 'medium_kick', 'heavy_kick'],
            timing: 5
          },
          hints: ['Kicks often have different ranges and properties than punches'],
          successCondition: 'all_kicks_performed'
        }
      ],
      rewards: {
        experience: 75,
        currency: 40,
        unlocks: ['attack_master_badge']
      }
    });

    // Special Moves Tutorial
    this.addLesson({
      id: 'special_moves',
      title: 'Special Moves',
      description: 'Learn how to perform special moves',
      category: 'combat',
      difficulty: 'intermediate',
      prerequisites: ['basic_attacks'],
      estimatedTime: 12,
      completionRate: 0,
      steps: [
        {
          id: 'special_intro',
          title: 'Introduction to Special Moves',
          description: 'Learn about special moves and motion inputs',
          type: 'info',
          content: {
            text: 'Special moves are powerful attacks that require specific input sequences. The most common is the Hadoken (fireball).',
            image: '/images/tutorial/special_moves.png',
            video: '/videos/tutorial/hadoken_demo.mp4'
          },
          requirements: {},
          hints: ['Special moves require precise timing and input sequences'],
          successCondition: 'info_read',
          skipAllowed: true,
          duration: 20
        },
        {
          id: 'hadoken_practice',
          title: 'Hadoken Practice',
          description: 'Learn to perform the Hadoken (fireball)',
          type: 'practice',
          content: {
            text: 'Perform the Hadoken: Quarter-circle forward + Punch (236P)',
            animation: 'hadoken_input_demo'
          },
          requirements: {
            input: ['down', 'down_forward', 'forward', 'punch'],
            timing: 10
          },
          hints: ['Start with down, then roll to forward, then press punch'],
          successCondition: 'hadoken_performed',
          nextStep: 'shoryuken_practice'
        },
        {
          id: 'shoryuken_practice',
          title: 'Shoryuken Practice',
          description: 'Learn to perform the Shoryuken (dragon punch)',
          type: 'practice',
          content: {
            text: 'Perform the Shoryuken: Forward, down, down-forward + Punch (623P)',
            animation: 'shoryuken_input_demo'
          },
          requirements: {
            input: ['forward', 'down', 'down_forward', 'punch'],
            timing: 10
          },
          hints: ['This is a Z-shaped motion: forward, down, then diagonal'],
          successCondition: 'shoryuken_performed',
          nextStep: 'tatsumaki_practice'
        },
        {
          id: 'tatsumaki_practice',
          title: 'Tatsumaki Practice',
          description: 'Learn to perform the Tatsumaki (hurricane kick)',
          type: 'practice',
          content: {
            text: 'Perform the Tatsumaki: Quarter-circle back + Kick (214K)',
            animation: 'tatsumaki_input_demo'
          },
          requirements: {
            input: ['down', 'down_back', 'back', 'kick'],
            timing: 10
          },
          hints: ['This is the reverse of the Hadoken motion'],
          successCondition: 'tatsumaki_performed'
        }
      ],
      rewards: {
        experience: 100,
        currency: 60,
        unlocks: ['special_moves_master_badge', 'hadoken_unlock']
      }
    });

    // Combo Tutorial
    this.addLesson({
      id: 'basic_combos',
      title: 'Basic Combos',
      description: 'Learn how to chain attacks together',
      category: 'combat',
      difficulty: 'intermediate',
      prerequisites: ['special_moves'],
      estimatedTime: 15,
      completionRate: 0,
      steps: [
        {
          id: 'combo_intro',
          title: 'Introduction to Combos',
          description: 'Learn about chaining attacks together',
          type: 'info',
          content: {
            text: 'Combos are sequences of attacks that connect together. They deal more damage than single attacks.',
            image: '/images/tutorial/combos.png',
            video: '/videos/tutorial/combo_demo.mp4'
          },
          requirements: {},
          hints: ['Timing is crucial for combos - press the next attack just as the previous one hits'],
          successCondition: 'info_read',
          skipAllowed: true,
          duration: 25
        },
        {
          id: 'light_combo_practice',
          title: 'Light Combo Practice',
          description: 'Practice a simple light attack combo',
          type: 'practice',
          content: {
            text: 'Perform: Light Punch → Light Kick → Medium Punch',
            animation: 'light_combo_demo'
          },
          requirements: {
            input: ['light_punch', 'light_kick', 'medium_punch'],
            timing: 15
          },
          hints: ['Press each button quickly after the previous one hits'],
          successCondition: 'light_combo_performed',
          nextStep: 'medium_combo_practice'
        },
        {
          id: 'medium_combo_practice',
          title: 'Medium Combo Practice',
          description: 'Practice a medium attack combo',
          type: 'practice',
          content: {
            text: 'Perform: Medium Punch → Medium Kick → Heavy Punch',
            animation: 'medium_combo_demo'
          },
          requirements: {
            input: ['medium_punch', 'medium_kick', 'heavy_punch'],
            timing: 20
          },
          hints: ['Medium combos require more precise timing'],
          successCondition: 'medium_combo_performed',
          nextStep: 'special_combo_practice'
        },
        {
          id: 'special_combo_practice',
          title: 'Special Combo Practice',
          description: 'Practice ending a combo with a special move',
          type: 'practice',
          content: {
            text: 'Perform: Light Punch → Medium Punch → Hadoken',
            animation: 'special_combo_demo'
          },
          requirements: {
            input: ['light_punch', 'medium_punch', 'down', 'down_forward', 'forward', 'punch'],
            timing: 25
          },
          hints: ['Cancel the medium punch into the Hadoken motion'],
          successCondition: 'special_combo_performed'
        }
      ],
      rewards: {
        experience: 150,
        currency: 80,
        unlocks: ['combo_master_badge', 'combo_training_unlock']
      }
    });

    // Character-Specific Tutorial (Ryu)
    this.addLesson({
      id: 'ryu_advanced',
      title: 'Ryu Advanced Techniques',
      description: 'Master Ryu\'s unique abilities',
      category: 'character_specific',
      difficulty: 'advanced',
      characterId: 'ryu',
      prerequisites: ['basic_combos'],
      estimatedTime: 20,
      completionRate: 0,
      steps: [
        {
          id: 'ryu_intro',
          title: 'Ryu\'s Fighting Style',
          description: 'Learn about Ryu\'s balanced approach to combat',
          type: 'info',
          content: {
            text: 'Ryu is a well-rounded fighter with strong fundamentals. He excels at mid-range combat and has powerful special moves.',
            image: '/images/tutorial/ryu_style.png'
          },
          requirements: {},
          hints: ['Ryu\'s strength lies in his versatility and solid fundamentals'],
          successCondition: 'info_read',
          skipAllowed: true,
          duration: 30
        },
        {
          id: 'ryu_fireball_zoning',
          title: 'Fireball Zoning',
          description: 'Learn to use Hadoken for controlling space',
          type: 'practice',
          content: {
            text: 'Use Hadoken to keep your opponent at a distance. Practice firing Hadokens at different ranges.',
            animation: 'ryu_fireball_zoning_demo'
          },
          requirements: {
            input: ['down', 'down_forward', 'forward', 'punch'],
            timing: 30
          },
          hints: ['Fireballs are great for controlling the pace of the match'],
          successCondition: 'fireball_zoning_performed',
          nextStep: 'ryu_anti_air_practice'
        },
        {
          id: 'ryu_anti_air_practice',
          title: 'Anti-Air Practice',
          description: 'Learn to use Shoryuken as an anti-air',
          type: 'practice',
          content: {
            text: 'When your opponent jumps at you, use Shoryuken to knock them out of the air.',
            animation: 'ryu_anti_air_demo'
          },
          requirements: {
            input: ['forward', 'down', 'down_forward', 'punch'],
            timing: 20
          },
          hints: ['Timing is crucial - use Shoryuken just as they\'re about to land'],
          successCondition: 'anti_air_performed'
        }
      ],
      rewards: {
        experience: 200,
        currency: 120,
        unlocks: ['ryu_master_badge', 'ryu_costume_2']
      }
    });
  }

  public addLesson(lesson: TutorialLesson): void {
    this.lessons.set(lesson.id, lesson);
  }

  public getLesson(lessonId: string): TutorialLesson | null {
    return this.lessons.get(lessonId) || null;
  }

  public getAllLessons(): TutorialLesson[] {
    return Array.from(this.lessons.values());
  }

  public getLessonsByCategory(category: string): TutorialLesson[] {
    return this.getAllLessons().filter(lesson => lesson.category === category);
  }

  public getLessonsByDifficulty(difficulty: string): TutorialLesson[] {
    return this.getAllLessons().filter(lesson => lesson.difficulty === difficulty);
  }

  public getLessonsForCharacter(characterId: string): TutorialLesson[] {
    return this.getAllLessons().filter(lesson => 
      !lesson.characterId || lesson.characterId === characterId
    );
  }

  public getAvailableLessons(): TutorialLesson[] {
    return this.getAllLessons().filter(lesson => 
      this.isLessonAvailable(lesson)
    );
  }

  public isLessonAvailable(lesson: TutorialLesson): boolean {
    // Check prerequisites
    for (const prereq of lesson.prerequisites) {
      if (!this.progress.completedLessons.includes(prereq)) {
        return false;
      }
    }
    return true;
  }

  public startLesson(lessonId: string): boolean {
    const lesson = this.getLesson(lessonId);
    if (!lesson || !this.isLessonAvailable(lesson)) {
      return false;
    }

    this.currentLesson = lesson;
    this.currentStep = lesson.steps[0];
    this.isPlaying = true;
    this.stepStartTime = Date.now();

    return true;
  }

  public completeStep(stepId: string): boolean {
    if (!this.currentStep || this.currentStep.id !== stepId) {
      return false;
    }

    // Add to completed steps
    if (!this.progress.completedSteps.includes(stepId)) {
      this.progress.completedSteps.push(stepId);
    }

    // Move to next step
    if (this.currentStep.nextStep) {
      const nextStep = this.currentLesson?.steps.find(s => s.id === this.currentStep!.nextStep);
      if (nextStep) {
        this.currentStep = nextStep;
        this.stepStartTime = Date.now();
        return true;
      }
    }

    // Check if lesson is complete
    if (this.currentLesson && this.isLessonComplete(this.currentLesson)) {
      this.completeLesson(this.currentLesson.id);
    }

    return true;
  }

  public skipStep(): boolean {
    if (!this.currentStep || !this.currentStep.skipAllowed) {
      return false;
    }

    return this.completeStep(this.currentStep.id);
  }

  public completeLesson(lessonId: string): void {
    if (!this.progress.completedLessons.includes(lessonId)) {
      this.progress.completedLessons.push(lessonId);
    }

    // Process rewards
    const lesson = this.getLesson(lessonId);
    if (lesson) {
      this.processLessonRewards(lesson);
    }

    this.currentLesson = null;
    this.currentStep = null;
    this.isPlaying = false;
  }

  private isLessonComplete(lesson: TutorialLesson): boolean {
    return lesson.steps.every(step => 
      this.progress.completedSteps.includes(step.id)
    );
  }

  private processLessonRewards(lesson: TutorialLesson): void {
    // This would integrate with the progression system
    console.log(`Processing rewards for ${lesson.title}:`, lesson.rewards);
  }

  public getCurrentLesson(): TutorialLesson | null {
    return this.currentLesson;
  }

  public getCurrentStep(): TutorialStep | null {
    return this.currentStep;
  }

  public isPlayingTutorial(): boolean {
    return this.isPlaying;
  }

  public getProgress(): TutorialProgress {
    return { ...this.progress };
  }

  public getCompletionPercentage(): number {
    const totalLessons = this.getAllLessons().length;
    const completedLessons = this.progress.completedLessons.length;
    return totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  }

  public exportData(): string {
    return JSON.stringify(this.progress);
  }

  public importData(data: string): boolean {
    try {
      this.progress = JSON.parse(data);
      return true;
    } catch (error) {
      console.error('Failed to import tutorial data:', error);
      return false;
    }
  }
}