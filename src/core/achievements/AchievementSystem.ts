export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'combat' | 'progression' | 'social' | 'collection' | 'special' | 'online';
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  points: number;
  icon: string;
  hidden: boolean;
  requirements: AchievementRequirement[];
  rewards: {
    experience: number;
    currency: number;
    unlocks: string[];
    titles: string[];
    cosmetics: string[];
  };
  prerequisites?: string[];
  characterSpecific?: string;
  seasonSpecific?: string;
}

export interface AchievementRequirement {
  type: 'wins' | 'losses' | 'kills' | 'deaths' | 'combos' | 'special_moves' | 'perfect_wins' | 'comebacks' | 'time_played' | 'characters_used' | 'stages_played' | 'online_matches' | 'tournament_wins' | 'rank_achieved' | 'streak' | 'damage_dealt' | 'damage_taken' | 'blocks' | 'parries' | 'throws' | 'supers_used' | 'custom_condition';
  value: number;
  characterId?: string;
  stageId?: string;
  rank?: string;
  condition?: string;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

export interface AchievementProgress {
  achievementId: string;
  playerId: string;
  progress: number;
  maxProgress: number;
  completed: boolean;
  completedAt?: Date;
  progressHistory: {
    value: number;
    timestamp: Date;
  }[];
}

export interface AchievementCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  achievements: string[];
}

export class AchievementSystem {
  private achievements: Map<string, Achievement> = new Map();
  private categories: Map<string, AchievementCategory> = new Map();
  private progress: Map<string, AchievementProgress> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeDefaultAchievements();
  }

  private initializeDefaultAchievements(): void {
    // Combat Achievements
    this.addAchievement({
      id: 'first_win',
      name: 'First Victory',
      description: 'Win your first match',
      category: 'combat',
      rarity: 'common',
      points: 10,
      icon: 'first_win_icon',
      hidden: false,
      requirements: [{ type: 'wins', value: 1 }],
      rewards: {
        experience: 50,
        currency: 25,
        unlocks: ['victory_celebration'],
        titles: ['Fighter'],
        cosmetics: []
      }
    });

    this.addAchievement({
      id: 'win_streak_5',
      name: 'Hot Streak',
      description: 'Win 5 matches in a row',
      category: 'combat',
      rarity: 'rare',
      points: 50,
      icon: 'win_streak_icon',
      hidden: false,
      requirements: [{ type: 'streak', value: 5 }],
      rewards: {
        experience: 200,
        currency: 100,
        unlocks: ['streak_celebration'],
        titles: ['Hot Streak'],
        cosmetics: ['fire_aura']
      }
    });

    this.addAchievement({
      id: 'perfect_victory',
      name: 'Flawless Victory',
      description: 'Win a match without taking damage',
      category: 'combat',
      rarity: 'epic',
      points: 100,
      icon: 'perfect_victory_icon',
      hidden: false,
      requirements: [{ type: 'perfect_wins', value: 1 }],
      rewards: {
        experience: 500,
        currency: 250,
        unlocks: ['perfect_victory_celebration'],
        titles: ['Flawless'],
        cosmetics: ['golden_aura']
      }
    });

    this.addAchievement({
      id: 'combo_master',
      name: 'Combo Master',
      description: 'Perform a 10-hit combo',
      category: 'combat',
      rarity: 'rare',
      points: 75,
      icon: 'combo_master_icon',
      hidden: false,
      requirements: [{ type: 'combos', value: 10 }],
      rewards: {
        experience: 300,
        currency: 150,
        unlocks: ['combo_training_advanced'],
        titles: ['Combo Master'],
        cosmetics: ['combo_trail']
      }
    });

    this.addAchievement({
      id: 'parry_king',
      name: 'Parry King',
      description: 'Perform 50 successful parries',
      category: 'combat',
      rarity: 'epic',
      points: 150,
      icon: 'parry_king_icon',
      hidden: false,
      requirements: [{ type: 'parries', value: 50 }],
      rewards: {
        experience: 750,
        currency: 375,
        unlocks: ['parry_training'],
        titles: ['Parry King'],
        cosmetics: ['parry_effect']
      }
    });

    // Progression Achievements
    this.addAchievement({
      id: 'level_10',
      name: 'Rising Star',
      description: 'Reach level 10',
      category: 'progression',
      rarity: 'common',
      points: 25,
      icon: 'level_10_icon',
      hidden: false,
      requirements: [{ type: 'time_played', value: 1000 }], // 1000 minutes
      rewards: {
        experience: 100,
        currency: 50,
        unlocks: ['new_character'],
        titles: ['Rising Star'],
        cosmetics: []
      }
    });

    this.addAchievement({
      id: 'level_50',
      name: 'Veteran Fighter',
      description: 'Reach level 50',
      category: 'progression',
      rarity: 'rare',
      points: 100,
      icon: 'level_50_icon',
      hidden: false,
      requirements: [{ type: 'time_played', value: 5000 }], // 5000 minutes
      rewards: {
        experience: 500,
        currency: 250,
        unlocks: ['veteran_rewards'],
        titles: ['Veteran'],
        cosmetics: ['veteran_badge']
      }
    });

    this.addAchievement({
      id: 'level_100',
      name: 'Master Fighter',
      description: 'Reach level 100',
      category: 'progression',
      rarity: 'legendary',
      points: 250,
      icon: 'level_100_icon',
      hidden: false,
      requirements: [{ type: 'time_played', value: 10000 }], // 10000 minutes
      rewards: {
        experience: 1000,
        currency: 500,
        unlocks: ['master_rewards'],
        titles: ['Master'],
        cosmetics: ['master_crown']
      }
    });

    // Character Achievements
    this.addAchievement({
      id: 'ryu_master',
      name: 'Ryu Master',
      description: 'Win 100 matches with Ryu',
      category: 'combat',
      rarity: 'epic',
      points: 200,
      icon: 'ryu_master_icon',
      hidden: false,
      requirements: [{ type: 'wins', value: 100, characterId: 'ryu' }],
      characterSpecific: 'ryu',
      rewards: {
        experience: 1000,
        currency: 500,
        unlocks: ['ryu_master_costume'],
        titles: ['Ryu Master'],
        cosmetics: ['ryu_master_aura']
      }
    });

    this.addAchievement({
      id: 'character_collector',
      name: 'Character Collector',
      description: 'Play with 10 different characters',
      category: 'collection',
      rarity: 'rare',
      points: 100,
      icon: 'character_collector_icon',
      hidden: false,
      requirements: [{ type: 'characters_used', value: 10 }],
      rewards: {
        experience: 500,
        currency: 250,
        unlocks: ['character_unlock'],
        titles: ['Collector'],
        cosmetics: ['rainbow_aura']
      }
    });

    // Online Achievements
    this.addAchievement({
      id: 'online_warrior',
      name: 'Online Warrior',
      description: 'Win 50 online matches',
      category: 'online',
      rarity: 'epic',
      points: 150,
      icon: 'online_warrior_icon',
      hidden: false,
      requirements: [{ type: 'online_matches', value: 50 }],
      rewards: {
        experience: 750,
        currency: 375,
        unlocks: ['online_rewards'],
        titles: ['Online Warrior'],
        cosmetics: ['network_aura']
      }
    });

    this.addAchievement({
      id: 'ranked_champion',
      name: 'Ranked Champion',
      description: 'Reach Champion rank',
      category: 'online',
      rarity: 'mythic',
      points: 500,
      icon: 'ranked_champion_icon',
      hidden: false,
      requirements: [{ type: 'rank_achieved', value: 1, rank: 'champion' }],
      rewards: {
        experience: 2000,
        currency: 1000,
        unlocks: ['champion_rewards'],
        titles: ['Champion'],
        cosmetics: ['champion_crown', 'champion_aura']
      }
    });

    // Special Achievements
    this.addAchievement({
      id: 'secret_technique',
      name: 'Secret Technique',
      description: 'Discover a hidden technique',
      category: 'special',
      rarity: 'legendary',
      points: 300,
      icon: 'secret_technique_icon',
      hidden: true,
      requirements: [{ type: 'custom_condition', value: 1, condition: 'secret_technique_discovered' }],
      rewards: {
        experience: 1500,
        currency: 750,
        unlocks: ['secret_technique_unlock'],
        titles: ['Secret Keeper'],
        cosmetics: ['mystical_aura']
      }
    });

    this.addAchievement({
      id: 'perfect_timing',
      name: 'Perfect Timing',
      description: 'Execute a just-frame technique',
      category: 'special',
      rarity: 'legendary',
      points: 400,
      icon: 'perfect_timing_icon',
      hidden: true,
      requirements: [{ type: 'custom_condition', value: 1, condition: 'just_frame_executed' }],
      rewards: {
        experience: 2000,
        currency: 1000,
        unlocks: ['just_frame_training'],
        titles: ['Perfect Timing'],
        cosmetics: ['time_aura']
      }
    });

    // Initialize categories
    this.initializeCategories();
  }

  private initializeCategories(): void {
    this.addCategory({
      id: 'combat',
      name: 'Combat',
      description: 'Fighting and battle achievements',
      icon: 'sword_icon',
      color: '#FF4444',
      achievements: ['first_win', 'win_streak_5', 'perfect_victory', 'combo_master', 'parry_king', 'ryu_master']
    });

    this.addCategory({
      id: 'progression',
      name: 'Progression',
      description: 'Level and experience achievements',
      icon: 'star_icon',
      color: '#44FF44',
      achievements: ['level_10', 'level_50', 'level_100']
    });

    this.addCategory({
      id: 'collection',
      name: 'Collection',
      description: 'Collecting and unlocking achievements',
      icon: 'treasure_icon',
      color: '#4444FF',
      achievements: ['character_collector']
    });

    this.addCategory({
      id: 'online',
      name: 'Online',
      description: 'Online multiplayer achievements',
      icon: 'globe_icon',
      color: '#FF44FF',
      achievements: ['online_warrior', 'ranked_champion']
    });

    this.addCategory({
      id: 'special',
      name: 'Special',
      description: 'Hidden and special achievements',
      icon: 'mystery_icon',
      color: '#FFFF44',
      achievements: ['secret_technique', 'perfect_timing']
    });
  }

  public addAchievement(achievement: Achievement): void {
    this.achievements.set(achievement.id, achievement);
  }

  public addCategory(category: AchievementCategory): void {
    this.categories.set(category.id, category);
  }

  public getAchievement(achievementId: string): Achievement | null {
    return this.achievements.get(achievementId) || null;
  }

  public getCategory(categoryId: string): AchievementCategory | null {
    return this.categories.get(categoryId) || null;
  }

  public getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  public getAllCategories(): AchievementCategory[] {
    return Array.from(this.categories.values());
  }

  public getAchievementsByCategory(categoryId: string): Achievement[] {
    const category = this.categories.get(categoryId);
    if (!category) return [];

    return category.achievements
      .map(id => this.achievements.get(id))
      .filter(achievement => achievement !== undefined) as Achievement[];
  }

  public getVisibleAchievements(): Achievement[] {
    return this.getAllAchievements().filter(achievement => !achievement.hidden);
  }

  public getHiddenAchievements(): Achievement[] {
    return this.getAllAchievements().filter(achievement => achievement.hidden);
  }

  public getAchievementsByRarity(rarity: string): Achievement[] {
    return this.getAllAchievements().filter(achievement => achievement.rarity === rarity);
  }

  public getPlayerProgress(playerId: string, achievementId: string): AchievementProgress | null {
    return this.progress.get(`${playerId}_${achievementId}`) || null;
  }

  public getAllPlayerProgress(playerId: string): AchievementProgress[] {
    return Array.from(this.progress.values())
      .filter(progress => progress.playerId === playerId);
  }

  public updateProgress(playerId: string, achievementId: string, value: number): boolean {
    const achievement = this.getAchievement(achievementId);
    if (!achievement) return false;

    const progressKey = `${playerId}_${achievementId}`;
    let progress = this.progress.get(progressKey);

    if (!progress) {
      progress = {
        achievementId,
        playerId,
        progress: 0,
        maxProgress: this.calculateMaxProgress(achievement),
        completed: false,
        progressHistory: []
      };
      this.progress.set(progressKey, progress);
    }

    if (progress.completed) return false;

    // Update progress
    progress.progress = Math.min(progress.maxProgress, value);
    progress.progressHistory.push({
      value: progress.progress,
      timestamp: new Date()
    });

    // Check if completed
    if (progress.progress >= progress.maxProgress) {
      progress.completed = true;
      progress.completedAt = new Date();
      this.onAchievementCompleted(playerId, achievement);
    }

    return true;
  }

  private calculateMaxProgress(achievement: Achievement): number {
    return achievement.requirements.reduce((max, req) => Math.max(max, req.value), 0);
  }

  private onAchievementCompleted(playerId: string, achievement: Achievement): void {
    // This would integrate with the notification system
    console.log(`Achievement completed: ${achievement.name} by player ${playerId}`);
    
    // Process rewards
    this.processRewards(playerId, achievement.rewards);
  }

  private processRewards(playerId: string, rewards: Achievement['rewards']): void {
    // This would integrate with the progression system
    console.log(`Processing rewards for player ${playerId}:`, rewards);
  }

  public getCompletedAchievements(playerId: string): Achievement[] {
    const completedProgress = this.getAllPlayerProgress(playerId)
      .filter(progress => progress.completed);

    return completedProgress
      .map(progress => this.getAchievement(progress.achievementId))
      .filter(achievement => achievement !== null) as Achievement[];
  }

  public getInProgressAchievements(playerId: string): Achievement[] {
    const inProgress = this.getAllPlayerProgress(playerId)
      .filter(progress => !progress.completed && progress.progress > 0);

    return inProgress
      .map(progress => this.getAchievement(progress.achievementId))
      .filter(achievement => achievement !== null) as Achievement[];
  }

  public getCompletionPercentage(playerId: string): number {
    const totalAchievements = this.getAllAchievements().length;
    const completedAchievements = this.getCompletedAchievements(playerId).length;
    return totalAchievements > 0 ? (completedAchievements / totalAchievements) * 100 : 0;
  }

  public getCategoryCompletionPercentage(playerId: string, categoryId: string): number {
    const categoryAchievements = this.getAchievementsByCategory(categoryId);
    const completedAchievements = this.getCompletedAchievements(playerId)
      .filter(achievement => categoryAchievements.includes(achievement));
    
    return categoryAchievements.length > 0 
      ? (completedAchievements.length / categoryAchievements.length) * 100 
      : 0;
  }

  public getTotalPoints(playerId: string): number {
    const completedAchievements = this.getCompletedAchievements(playerId);
    return completedAchievements.reduce((total, achievement) => total + achievement.points, 0);
  }

  public getRarityCount(playerId: string): Record<string, number> {
    const completedAchievements = this.getCompletedAchievements(playerId);
    const counts: Record<string, number> = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      mythic: 0
    };

    completedAchievements.forEach(achievement => {
      counts[achievement.rarity]++;
    });

    return counts;
  }

  public searchAchievements(query: string): Achievement[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllAchievements().filter(achievement =>
      achievement.name.toLowerCase().includes(lowerQuery) ||
      achievement.description.toLowerCase().includes(lowerQuery)
    );
  }

  public getRecentAchievements(playerId: string, limit: number = 5): Achievement[] {
    const completedProgress = this.getAllPlayerProgress(playerId)
      .filter(progress => progress.completed && progress.completedAt)
      .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())
      .slice(0, limit);

    return completedProgress
      .map(progress => this.getAchievement(progress.achievementId))
      .filter(achievement => achievement !== null) as Achievement[];
  }

  public exportData(): string {
    return JSON.stringify({
      achievements: Array.from(this.achievements.entries()),
      categories: Array.from(this.categories.entries()),
      progress: Array.from(this.progress.entries())
    });
  }

  public importData(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      this.achievements = new Map(parsed.achievements || []);
      this.categories = new Map(parsed.categories || []);
      this.progress = new Map(parsed.progress || []);
      return true;
    } catch (error) {
      console.error('Failed to import achievement data:', error);
      return false;
    }
  }
}