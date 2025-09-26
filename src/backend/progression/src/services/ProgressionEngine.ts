/**
 * ProgressionEngine - Core progression logic and XP calculations
 * 
 * Handles deterministic XP allocation, level calculations, and prestige logic.
 * All progression is power-neutral and maintains competitive integrity.
 */

import type { DatabaseManager } from '../database/DatabaseManager';
import { Logger } from '../utils/Logger';
import type { XPGrantRequest, MasteryState, XPSource, PerformanceTier } from '../types/Progression';
import type { RewardGrant } from '../types/Rewards';

const logger = Logger.getInstance();

export class ProgressionEngine {
  private db: DatabaseManager;
  private xpMultipliers: Record<XPSource, number> = {
    'match_victory': 1.5,
    'match_participation': 1.0,
    'daily_objective': 1.2,
    'weekly_objective': 2.0,
    'lab_completion': 1.3,
    'mentor_activity': 1.4,
    'prestige': 3.0,
    'perfect_round': 1.8,
    'combo_performance': 1.1,
    'first_time_bonus': 3.0
  };

  private performanceMultipliers: Record<PerformanceTier, number> = {
    'bronze': 1.0,
    'silver': 1.1,
    'gold': 1.25,
    'platinum': 1.5
  };

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * Grant XP with validation and level calculation
   */
  async grantXP(request: XPGrantRequest): Promise<{
    success: boolean;
    newLevel?: number;
    levelUp?: boolean;
    rewardsGranted?: RewardGrant[];
    error?: string;
  }> {
    try {
      // Validate request
      if (!this.validateXPRequest(request)) {
        return { success: false, error: 'Invalid XP grant request' };
      }

      // Calculate adjusted XP amount
      const adjustedAmount = this.calculateAdjustedXP(
        request.baseAmount,
        request.source,
        request.performanceTier
      );

      // Start transaction
      await this.db.query('BEGIN');

      try {
        // Get current mastery state
        const currentState = await this.getMasteryState(request.userId, request.trackType, request.trackId);

        // Calculate new XP and level
        const newXP = currentState.xp + adjustedAmount;
        const newTotalXP = currentState.totalXp + adjustedAmount;
        const newLevel = this.calculateLevel(newXP);
        const levelUp = newLevel > currentState.level;

        // Update mastery record
        await this.updateMasteryRecord(
          request.userId,
          request.trackType,
          request.trackId,
          newXP,
          newTotalXP,
          newLevel
        );

        // Grant level-up rewards if applicable
        const rewardsGranted: RewardGrant[] = [];
        if (levelUp) {
          const rewards = await this.grantLevelUpRewards(
            request.userId,
            request.trackType,
            request.trackId,
            currentState.level + 1,
            newLevel
          );
          rewardsGranted.push(...rewards);
        }

        // Log XP grant
        await this.logXPGrant(request, adjustedAmount, newLevel, currentState.level);

        await this.db.query('COMMIT');

        logger.info('XP granted successfully', {
          userId: request.userId,
          trackType: request.trackType,
          trackId: request.trackId,
          amount: adjustedAmount,
          newLevel,
          levelUp
        });

        return {
          success: true,
          newLevel,
          levelUp,
          rewardsGranted: rewardsGranted.length > 0 ? rewardsGranted : undefined
        };

      } catch (error) {
        await this.db.query('ROLLBACK');
        throw error;
      }

    } catch (error) {
      logger.error('Failed to grant XP:', error);
      return { success: false, error: 'Failed to grant XP' };
    }
  }

  /**
   * Get user's mastery state for a specific track
   */
  async getMasteryState(userId: string, trackType: string, trackId?: string): Promise<MasteryState> {
    try {
      const result = await this.db.query(
        `SELECT level, xp, total_xp, prestige_level, last_prestige_xp, created_at, updated_at
         FROM mastery_tracks 
         WHERE user_id = $1 AND track_type = $2 AND track_id = $3`,
        [userId, trackType, trackId || null]
      );

      if (result.rows.length === 0) {
        // Initialize new mastery track
        return await this.initializeMasteryTrack(userId, trackType, trackId);
      }

      const row = result.rows[0];
      return {
        userId,
        trackType,
        trackId,
        level: row.level,
        xp: row.xp,
        totalXp: row.total_xp,
        prestigeLevel: row.prestige_level,
        lastPrestigeXp: row.last_prestige_xp,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };

    } catch (error) {
      logger.error('Failed to get mastery state:', error);
      throw error;
    }
  }

  /**
   * Trigger prestige for a mastery track
   */
  async triggerPrestige(userId: string, trackType: string, trackId?: string): Promise<{
    success: boolean;
    newPrestigeLevel?: number;
    rewardsGranted?: RewardGrant[];
    error?: string;
  }> {
    try {
      const currentState = await this.getMasteryState(userId, trackType, trackId);

      // Check if prestige is available
      const prestigeThreshold = this.getPrestigeThreshold(trackType);
      if (currentState.level < prestigeThreshold) {
        return { 
          success: false, 
          error: `Level ${prestigeThreshold} required for prestige` 
        };
      }

      await this.db.query('BEGIN');

      try {
        const newPrestigeLevel = currentState.prestigeLevel + 1;

        // Reset level and XP, increment prestige
        await this.db.query(
          `UPDATE mastery_tracks 
           SET level = 1, xp = 0, prestige_level = $1, last_prestige_xp = $2, updated_at = NOW()
           WHERE user_id = $3 AND track_type = $4 AND track_id = $5`,
          [newPrestigeLevel, currentState.totalXp, userId, trackType, trackId || null]
        );

        // Grant prestige rewards
        const rewardsGranted = await this.grantPrestigeRewards(
          userId,
          trackType,
          trackId,
          newPrestigeLevel
        );

        // Log prestige event
        await this.logXPGrant({
          userId,
          trackType,
          trackId,
          baseAmount: 1,
          source: 'prestige',
          reason: 'Prestige level up',
          sessionHash: `prestige_${Date.now()}`
        }, 0, 1, currentState.level);

        await this.db.query('COMMIT');

        logger.info('Prestige triggered successfully', {
          userId,
          trackType,
          trackId,
          newPrestigeLevel
        });

        return {
          success: true,
          newPrestigeLevel,
          rewardsGranted
        };

      } catch (error) {
        await this.db.query('ROLLBACK');
        throw error;
      }

    } catch (error) {
      logger.error('Failed to trigger prestige:', error);
      return { success: false, error: 'Failed to trigger prestige' };
    }
  }

  /**
   * Get all mastery tracks for a user
   */
  async getAllMasteryTracks(userId: string): Promise<MasteryState[]> {
    try {
      const result = await this.db.query(
        `SELECT track_type, track_id, level, xp, total_xp, prestige_level, 
         last_prestige_xp, created_at, updated_at
         FROM mastery_tracks WHERE user_id = $1
         ORDER BY track_type, track_id`,
        [userId]
      );

      return result.rows.map(row => ({
        userId,
        trackType: row.track_type,
        trackId: row.track_id,
        level: row.level,
        xp: row.xp,
        totalXp: row.total_xp,
        prestigeLevel: row.prestige_level,
        lastPrestigeXp: row.last_prestige_xp,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

    } catch (error) {
      logger.error('Failed to get all mastery tracks:', error);
      throw error;
    }
  }

  /**
   * Calculate level from XP using quadratic curve
   */
  private calculateLevel(xp: number): number {
    // Quadratic XP curve: level = floor(sqrt(xp / 100)) + 1
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  /**
   * Calculate XP required for a specific level
   */
  private calculateXPForLevel(level: number): number {
    // Inverse of level calculation: xp = (level - 1)^2 * 100
    return Math.pow(level - 1, 2) * 100;
  }

  /**
   * Calculate adjusted XP amount with multipliers
   */
  private calculateAdjustedXP(
    baseAmount: number,
    source: XPSource,
    performanceTier?: PerformanceTier
  ): number {
    let multiplier = this.xpMultipliers[source] || 1.0;

    if (performanceTier) {
      multiplier *= this.performanceMultipliers[performanceTier];
    }

    return Math.floor(baseAmount * multiplier);
  }

  /**
   * Get prestige threshold for track type
   */
  private getPrestigeThreshold(trackType: string): number {
    const thresholds: Record<string, number> = {
      'account': 100,
      'character': 50,
      'archetype': 75
    };
    return thresholds[trackType] || 100;
  }

  /**
   * Validate XP grant request
   */
  private validateXPRequest(request: XPGrantRequest): boolean {
    return !!(
      request.userId &&
      request.trackType &&
      request.baseAmount > 0 &&
      request.source &&
      request.reason &&
      request.sessionHash
    );
  }

  /**
   * Initialize a new mastery track
   */
  private async initializeMasteryTrack(
    userId: string,
    trackType: string,
    trackId?: string
  ): Promise<MasteryState> {
    try {
      const result = await this.db.query(
        `INSERT INTO mastery_tracks (
          user_id, track_type, track_id, level, xp, total_xp, 
          prestige_level, last_prestige_xp, created_at, updated_at
        ) VALUES ($1, $2, $3, 1, 0, 0, 0, 0, NOW(), NOW())
        RETURNING level, xp, total_xp, prestige_level, last_prestige_xp, created_at, updated_at`,
        [userId, trackType, trackId || null]
      );

      const row = result.rows[0];
      return {
        userId,
        trackType,
        trackId,
        level: row.level,
        xp: row.xp,
        totalXp: row.total_xp,
        prestigeLevel: row.prestige_level,
        lastPrestigeXp: row.last_prestige_xp,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };

    } catch (error) {
      logger.error('Failed to initialize mastery track:', error);
      throw error;
    }
  }

  /**
   * Update mastery record with new values
   */
  private async updateMasteryRecord(
    userId: string,
    trackType: string,
    trackId: string | undefined,
    newXP: number,
    newTotalXP: number,
    newLevel: number
  ): Promise<void> {
    await this.db.query(
      `UPDATE mastery_tracks 
       SET xp = $1, total_xp = $2, level = $3, updated_at = NOW()
       WHERE user_id = $4 AND track_type = $5 AND track_id = $6`,
      [newXP, newTotalXP, newLevel, userId, trackType, trackId || null]
    );
  }

  /**
   * Grant level-up rewards
   */
  private async grantLevelUpRewards(
    userId: string,
    trackType: string,
    trackId: string | undefined,
    fromLevel: number,
    toLevel: number
  ): Promise<RewardGrant[]> {
    const rewards: RewardGrant[] = [];

    for (let level = fromLevel; level <= toLevel; level++) {
      const levelRewards = await this.getLevelRewards(trackType, trackId, level);

      for (const reward of levelRewards) {
        await this.grantReward(userId, reward);
        rewards.push({
          rewardId: reward.id,
          rewardType: reward.type,
          grantedAt: new Date(),
          source: 'level_up',
          context: `Level ${level} reward`
        });
      }
    }

    return rewards;
  }

  /**
   * Grant prestige rewards
   */
  private async grantPrestigeRewards(
    userId: string,
    trackType: string,
    trackId: string | undefined,
    prestigeLevel: number
  ): Promise<RewardGrant[]> {
    const rewards: RewardGrant[] = [];

    // Grant prestige-specific rewards
    const prestigeReward = {
      id: `${trackType}_prestige_${prestigeLevel}_${trackId || 'global'}`,
      type: 'title' as const,
      name: `Prestige ${prestigeLevel}`,
      description: `Achieved prestige level ${prestigeLevel}`,
      rarity: 'legendary' as const
    };

    await this.grantReward(userId, prestigeReward);
    rewards.push({
      rewardId: prestigeReward.id,
      rewardType: prestigeReward.type,
      grantedAt: new Date(),
      source: 'prestige',
      context: `Prestige level ${prestigeLevel}`
    });

    return rewards;
  }

  /**
   * Get rewards for a specific level
   */
  private async getLevelRewards(trackType: string, trackId: string | undefined, level: number): Promise<any[]> {
    // In production, this would query a rewards configuration table
    // For now, return sample rewards
    const sampleRewards = [
      { id: `${trackType}_level_${level}`, type: 'cosmetic', name: `Level ${level} Reward`, rarity: 'common' }
    ];

    return level % 5 === 0 ? sampleRewards : []; // Rewards every 5 levels
  }

  /**
   * Grant a reward to user
   */
  private async grantReward(userId: string, reward: any): Promise<void> {
    await this.db.query(
      `INSERT INTO user_rewards (user_id, reward_id, reward_type, granted_at, source)
       VALUES ($1, $2, $3, NOW(), 'progression')
       ON CONFLICT (user_id, reward_id) DO NOTHING`,
      [userId, reward.id, reward.type]
    );
  }

  /**
   * Log XP grant for analytics
   */
  private async logXPGrant(
    request: XPGrantRequest,
    adjustedAmount: number,
    newLevel: number,
    previousLevel: number
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO xp_grants (
        user_id, track_type, track_id, base_amount, adjusted_amount,
        source, reason, session_hash, previous_level, new_level, granted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        request.userId,
        request.trackType,
        request.trackId || null,
        request.baseAmount,
        adjustedAmount,
        request.source,
        request.reason,
        request.sessionHash,
        previousLevel,
        newLevel
      ]
    );
  }
}