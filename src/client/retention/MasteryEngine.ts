/**
 * MasteryEngine - Deterministic XP allocation and prestige logic
 * 
 * Handles account mastery, character mastery, and archetype challenges.
 * All progression is power-neutral - only cosmetic rewards are granted.
 * 
 * Usage:
 * const mastery = new MasteryEngine({
 *   retentionClient,
 *   saveCallback: (data) => localStorage.setItem('mastery', JSON.stringify(data))
 * });
 * 
 * mastery.grantXP('account', 150, 'match_victory');
 * mastery.grantCharacterXP('grappler_a', 200, 'lab_completion');
 * 
 * How to extend:
 * - Add new XP sources by extending XPSource enum
 * - Modify XP calculations in calculateXP() method
 * - Add new cosmetic reward types in CosmeticReward interface
 * - Customize prestige requirements in getPrestigeThreshold()
 */

import { EventEmitter } from 'eventemitter3';
import type { RetentionClient } from './RetentionClient';

export interface MasteryConfig {
  retentionClient: RetentionClient;
  saveCallback: (data: MasteryData) => void;
  loadCallback: () => MasteryData | null;
  enableLocalStorage?: boolean;
}

export interface MasteryData {
  account: {
    level: number;
    xp: number;
    totalXp: number;
    prestigeLevel: number;
    lastPrestigeXp: number;
  };
  characters: Record<string, {
    level: number;
    xp: number;
    totalXp: number;
    prestigeLevel: number;
    lastPrestigeXp: number;
  }>;
  archetypes: Record<string, {
    level: number;
    xp: number;
    totalXp: number;
    challenges: Record<string, {
      progress: number;
      completed: boolean;
      completedAt?: number;
    }>;
  }>;
  unlockedRewards: string[];
  lastUpdated: number;
}

export interface CosmeticReward {
  id: string;
  type: 'title' | 'banner' | 'announcer' | 'vfx_palette' | 'stage_variant' | 'profile_badge';
  name: string;
  description: string;
  characterId?: string; // For character-specific rewards
  archetypeId?: string; // For archetype-specific rewards
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface LevelReward {
  level: number;
  rewards: CosmeticReward[];
  isPrestigeUnlock?: boolean;
}

export interface ArchetypeChallenge {
  id: string;
  name: string;
  description: string;
  archetype: string;
  target: number;
  rewards: CosmeticReward[];
}

export type XPSource = 
  | 'match_victory' 
  | 'match_participation' 
  | 'daily_objective' 
  | 'weekly_objective' 
  | 'lab_completion' 
  | 'mentor_activity'
  | 'perfect_round'
  | 'combo_performance'
  | 'first_time_bonus';

export type PerformanceTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export class MasteryEngine extends EventEmitter {
  private config: MasteryConfig;
  private data: MasteryData;
  private rewardTable: Record<string, LevelReward[]> = {};
  private archetypeChallenges: ArchetypeChallenge[] = [];

  constructor(config: MasteryConfig) {
    super();
    this.config = config;
    this.data = this.loadMasteryData();
    this.setupRewardTables();
    this.setupArchetypeChallenges();
  }

  /**
   * Grant account-level XP
   */
  public grantAccountXP(amount: number, source: XPSource, performanceTier?: PerformanceTier): void {
    const adjustedAmount = this.calculateXP(amount, source, performanceTier);
    const previousLevel = this.data.account.level;
    
    this.data.account.xp += adjustedAmount;
    this.data.account.totalXp += adjustedAmount;
    
    const newLevel = this.calculateLevel(this.data.account.xp);
    this.data.account.level = newLevel;

    // Check for level ups and prestige
    this.checkAccountLevelUp(previousLevel, newLevel);
    this.checkAccountPrestige();

    // Track progression event
    this.config.retentionClient.trackProgression({
      grantType: 'account_xp',
      amount: adjustedAmount,
      reason: source,
      previousLevel,
      newLevel,
      prestigeLevel: this.data.account.prestigeLevel
    });

    this.saveMasteryData();
    this.emit('account_xp_granted', { amount: adjustedAmount, newLevel, source });
  }

  /**
   * Grant character-specific XP
   */
  public grantCharacterXP(characterId: string, amount: number, source: XPSource, performanceTier?: PerformanceTier): void {
    if (!this.data.characters[characterId]) {
      this.initializeCharacter(characterId);
    }

    const adjustedAmount = this.calculateXP(amount, source, performanceTier);
    const character = this.data.characters[characterId];
    const previousLevel = character.level;
    
    character.xp += adjustedAmount;
    character.totalXp += adjustedAmount;
    
    const newLevel = this.calculateLevel(character.xp);
    character.level = newLevel;

    // Check for level ups and prestige
    this.checkCharacterLevelUp(characterId, previousLevel, newLevel);
    this.checkCharacterPrestige(characterId);

    // Track progression event
    this.config.retentionClient.trackProgression({
      grantType: 'character_xp',
      amount: adjustedAmount,
      reason: source,
      characterId,
      previousLevel,
      newLevel,
      prestigeLevel: character.prestigeLevel
    });

    this.saveMasteryData();
    this.emit('character_xp_granted', { characterId, amount: adjustedAmount, newLevel, source });
  }

  /**
   * Grant archetype mastery XP and update challenges
   */
  public grantArchetypeXP(archetypeId: string, amount: number, source: XPSource): void {
    if (!this.data.archetypes[archetypeId]) {
      this.initializeArchetype(archetypeId);
    }

    const archetype = this.data.archetypes[archetypeId];
    const previousLevel = archetype.level;
    
    archetype.xp += amount;
    archetype.totalXp += amount;
    
    const newLevel = this.calculateLevel(archetype.xp);
    archetype.level = newLevel;

    // Update archetype challenges
    this.updateArchetypeChallenges(archetypeId, source, amount);

    // Check for level ups
    this.checkArchetypeLevelUp(archetypeId, previousLevel, newLevel);

    // Track progression event
    this.config.retentionClient.trackProgression({
      grantType: 'mastery_points',
      amount,
      reason: source,
      previousLevel,
      newLevel
    });

    this.saveMasteryData();
    this.emit('archetype_xp_granted', { archetypeId, amount, newLevel, source });
  }

  /**
   * Trigger prestige for account mastery
   */
  public prestigeAccount(): boolean {
    if (!this.canPrestigeAccount()) {
      return false;
    }

    const currentLevel = this.data.account.level;
    this.data.account.prestigeLevel++;
    this.data.account.lastPrestigeXp = this.data.account.totalXp;
    this.data.account.xp = 0;
    this.data.account.level = 1;

    // Grant prestige rewards
    this.grantPrestigeRewards('account', this.data.account.prestigeLevel);

    // Track progression event
    this.config.retentionClient.trackProgression({
      grantType: 'achievement',
      amount: 1,
      reason: 'prestige',
      itemId: `account_prestige_${this.data.account.prestigeLevel}`,
      previousLevel: currentLevel,
      newLevel: 1,
      prestigeLevel: this.data.account.prestigeLevel
    });

    this.saveMasteryData();
    this.emit('account_prestige', { prestigeLevel: this.data.account.prestigeLevel });
    return true;
  }

  /**
   * Trigger prestige for character mastery
   */
  public prestigeCharacter(characterId: string): boolean {
    const character = this.data.characters[characterId];
    if (!character || !this.canPrestigeCharacter(characterId)) {
      return false;
    }

    const currentLevel = character.level;
    character.prestigeLevel++;
    character.lastPrestigeXp = character.totalXp;
    character.xp = 0;
    character.level = 1;

    // Grant prestige rewards
    this.grantPrestigeRewards('character', character.prestigeLevel, characterId);

    // Track progression event
    this.config.retentionClient.trackProgression({
      grantType: 'achievement',
      amount: 1,
      reason: 'prestige',
      characterId,
      itemId: `character_prestige_${character.prestigeLevel}`,
      previousLevel: currentLevel,
      newLevel: 1,
      prestigeLevel: character.prestigeLevel
    });

    this.saveMasteryData();
    this.emit('character_prestige', { characterId, prestigeLevel: character.prestigeLevel });
    return true;
  }

  /**
   * Get current mastery data (read-only)
   */
  public getMasteryData(): Readonly<MasteryData> {
    return { ...this.data };
  }

  /**
   * Get rewards for a specific level and track type
   */
  public getRewardsForLevel(trackType: 'account' | string, level: number): LevelReward | null {
    const rewards = this.rewardTable[trackType];
    return rewards?.find(r => r.level === level) || null;
  }

  /**
   * Check if account can prestige
   */
  public canPrestigeAccount(): boolean {
    return this.data.account.level >= this.getPrestigeThreshold('account');
  }

  /**
   * Check if character can prestige
   */
  public canPrestigeCharacter(characterId: string): boolean {
    const character = this.data.characters[characterId];
    return character && character.level >= this.getPrestigeThreshold('character');
  }

  private calculateXP(baseAmount: number, source: XPSource, performanceTier?: PerformanceTier): number {
    let multiplier = 1.0;

    // Source-based multipliers
    switch (source) {
      case 'match_victory':
        multiplier = 1.5;
        break;
      case 'daily_objective':
        multiplier = 1.2;
        break;
      case 'weekly_objective':
        multiplier = 2.0;
        break;
      case 'lab_completion':
        multiplier = 1.3;
        break;
      case 'mentor_activity':
        multiplier = 1.4;
        break;
      case 'perfect_round':
        multiplier = 1.8;
        break;
      case 'first_time_bonus':
        multiplier = 3.0;
        break;
    }

    // Performance tier multipliers
    if (performanceTier) {
      switch (performanceTier) {
        case 'bronze':
          multiplier *= 1.0;
          break;
        case 'silver':
          multiplier *= 1.1;
          break;
        case 'gold':
          multiplier *= 1.25;
          break;
        case 'platinum':
          multiplier *= 1.5;
          break;
      }
    }

    return Math.floor(baseAmount * multiplier);
  }

  private calculateLevel(xp: number): number {
    // Quadratic XP curve: level = floor(sqrt(xp / 100)) + 1
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  private getPrestigeThreshold(trackType: 'account' | 'character'): number {
    // Account prestige at level 100, character prestige at level 50
    return trackType === 'account' ? 100 : 50;
  }

  private checkAccountLevelUp(previousLevel: number, newLevel: number): void {
    for (let level = previousLevel + 1; level <= newLevel; level++) {
      const rewards = this.getRewardsForLevel('account', level);
      if (rewards) {
        this.grantLevelRewards(rewards.rewards, level, 'account');
      }
    }
  }

  private checkCharacterLevelUp(characterId: string, previousLevel: number, newLevel: number): void {
    for (let level = previousLevel + 1; level <= newLevel; level++) {
      const rewards = this.getRewardsForLevel(characterId, level);
      if (rewards) {
        this.grantLevelRewards(rewards.rewards, level, 'character', characterId);
      }
    }
  }

  private checkArchetypeLevelUp(archetypeId: string, previousLevel: number, newLevel: number): void {
    for (let level = previousLevel + 1; level <= newLevel; level++) {
      const rewards = this.getRewardsForLevel(archetypeId, level);
      if (rewards) {
        this.grantLevelRewards(rewards.rewards, level, 'archetype', archetypeId);
      }
    }
  }

  private checkAccountPrestige(): void {
    if (this.canPrestigeAccount() && !this.hasSeenPrestigePrompt('account')) {
      this.emit('prestige_available', { type: 'account' });
    }
  }

  private checkCharacterPrestige(characterId: string): void {
    if (this.canPrestigeCharacter(characterId) && !this.hasSeenPrestigePrompt('character', characterId)) {
      this.emit('prestige_available', { type: 'character', characterId });
    }
  }

  private grantLevelRewards(rewards: CosmeticReward[], level: number, trackType: string, trackId?: string): void {
    rewards.forEach(reward => {
      if (!this.data.unlockedRewards.includes(reward.id)) {
        this.data.unlockedRewards.push(reward.id);
        
        // Track unlock event
        this.config.retentionClient.trackProgression({
          grantType: 'cosmetic_unlock',
          amount: 1,
          reason: 'match_participation', // Level-based unlock
          itemId: reward.id,
          characterId: trackId
        });

        this.emit('cosmetic_unlocked', { reward, level, trackType, trackId });
      }
    });
  }

  private grantPrestigeRewards(trackType: 'account' | 'character', prestigeLevel: number, characterId?: string): void {
    const prestigeReward: CosmeticReward = {
      id: `${trackType}_prestige_${prestigeLevel}_${characterId || 'global'}`,
      type: 'title',
      name: `Prestige ${prestigeLevel}`,
      description: `Achieved prestige level ${prestigeLevel} in ${trackType} mastery`,
      characterId,
      rarity: 'legendary'
    };

    this.data.unlockedRewards.push(prestigeReward.id);
    this.emit('cosmetic_unlocked', { reward: prestigeReward, prestige: true });
  }

  private updateArchetypeChallenges(archetypeId: string, _source: XPSource, amount: number): void {
    const relevantChallenges = this.archetypeChallenges.filter(c => c.archetype === archetypeId);
    
    relevantChallenges.forEach(challenge => {
      const challengeData = this.data.archetypes[archetypeId].challenges[challenge.id];
      if (!challengeData.completed) {
        challengeData.progress += amount;
        
        if (challengeData.progress >= challenge.target) {
          challengeData.completed = true;
          challengeData.completedAt = Date.now();
          
          // Grant challenge rewards
          challenge.rewards.forEach(reward => {
            if (!this.data.unlockedRewards.includes(reward.id)) {
              this.data.unlockedRewards.push(reward.id);
              
              this.config.retentionClient.trackProgression({
                grantType: 'achievement',
                amount: 1,
                reason: 'match_participation',
                itemId: reward.id
              });

              this.emit('challenge_completed', { challenge, reward });
            }
          });
        }
      }
    });
  }

  private hasSeenPrestigePrompt(_type: 'account' | 'character', _characterId?: string): boolean {
    // Implementation would track whether user has seen prestige prompt
    // This prevents spam notifications
    return false;
  }

  private initializeCharacter(characterId: string): void {
    this.data.characters[characterId] = {
      level: 1,
      xp: 0,
      totalXp: 0,
      prestigeLevel: 0,
      lastPrestigeXp: 0
    };
  }

  private initializeArchetype(archetypeId: string): void {
    this.data.archetypes[archetypeId] = {
      level: 1,
      xp: 0,
      totalXp: 0,
      challenges: {}
    };

    // Initialize challenge tracking
    this.archetypeChallenges
      .filter(c => c.archetype === archetypeId)
      .forEach(challenge => {
        this.data.archetypes[archetypeId].challenges[challenge.id] = {
          progress: 0,
          completed: false
        };
      });
  }

  private loadMasteryData(): MasteryData {
    try {
      const loaded = this.config.loadCallback();
      if (loaded) {
        return loaded;
      }
    } catch (error) {
      console.warn('MasteryEngine: Failed to load data:', error);
    }

    // Return default data structure
    return {
      account: { level: 1, xp: 0, totalXp: 0, prestigeLevel: 0, lastPrestigeXp: 0 },
      characters: {},
      archetypes: {},
      unlockedRewards: [],
      lastUpdated: Date.now()
    };
  }

  private saveMasteryData(): void {
    try {
      this.data.lastUpdated = Date.now();
      this.config.saveCallback(this.data);
    } catch (error) {
      console.warn('MasteryEngine: Failed to save data:', error);
    }
  }

  private setupRewardTables(): void {
    // Example reward tables - in production these would be loaded from configuration
    this.rewardTable['account'] = [
      { level: 5, rewards: [{ id: 'title_novice', type: 'title', name: 'Novice Fighter', description: 'Reached account level 5', rarity: 'common' }] },
      { level: 10, rewards: [{ id: 'banner_bronze', type: 'banner', name: 'Bronze Banner', description: 'Reached account level 10', rarity: 'common' }] },
      { level: 25, rewards: [{ id: 'announcer_classic', type: 'announcer', name: 'Classic Announcer', description: 'Reached account level 25', rarity: 'rare' }] },
      { level: 50, rewards: [{ id: 'vfx_gold', type: 'vfx_palette', name: 'Golden Effects', description: 'Reached account level 50', rarity: 'epic' }] },
      { level: 100, rewards: [{ id: 'title_master', type: 'title', name: 'Fighting Master', description: 'Reached account level 100', rarity: 'legendary' }], isPrestigeUnlock: true }
    ];
  }

  private setupArchetypeChallenges(): void {
    // Example archetype challenges
    this.archetypeChallenges = [
      {
        id: 'grappler_100_throws',
        name: 'Throw Master',
        description: 'Land 100 throws with grappler characters',
        archetype: 'grappler',
        target: 100,
        rewards: [{ id: 'title_throw_master', type: 'title', name: 'Throw Master', description: 'Mastered the art of grappling', rarity: 'rare' }]
      },
      {
        id: 'rushdown_50_combos',
        name: 'Combo Artist',
        description: 'Perform 50 extended combos with rushdown characters',
        archetype: 'rushdown',
        target: 50,
        rewards: [{ id: 'vfx_combo_sparks', type: 'vfx_palette', name: 'Combo Sparks', description: 'Flashy effects for combo masters', rarity: 'epic' }]
      }
    ];
  }
}