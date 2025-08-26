/**
 * ProgressionEngine - Core progression logic and XP calculations
 *
 * Handles deterministic XP allocation, level calculations, and prestige logic.
 * All progression is power-neutral and maintains competitive integrity.
 */
import { DatabaseManager } from '../database/DatabaseManager';
import { XPGrantRequest, MasteryState } from '../types/Progression';
import { RewardGrant } from '../types/Rewards';
export declare class ProgressionEngine {
    private db;
    private xpMultipliers;
    private performanceMultipliers;
    constructor(db: DatabaseManager);
    /**
     * Grant XP with validation and level calculation
     */
    grantXP(request: XPGrantRequest): Promise<{
        success: boolean;
        newLevel?: number;
        levelUp?: boolean;
        rewardsGranted?: RewardGrant[];
        error?: string;
    }>;
    /**
     * Get user's mastery state for a specific track
     */
    getMasteryState(userId: string, trackType: string, trackId?: string): Promise<MasteryState>;
    /**
     * Trigger prestige for a mastery track
     */
    triggerPrestige(userId: string, trackType: string, trackId?: string): Promise<{
        success: boolean;
        newPrestigeLevel?: number;
        rewardsGranted?: RewardGrant[];
        error?: string;
    }>;
    /**
     * Get all mastery tracks for a user
     */
    getAllMasteryTracks(userId: string): Promise<MasteryState[]>;
    /**
     * Calculate level from XP using quadratic curve
     */
    private calculateLevel;
    /**
     * Calculate XP required for a specific level
     */
    private calculateXPForLevel;
    /**
     * Calculate adjusted XP amount with multipliers
     */
    private calculateAdjustedXP;
    /**
     * Get prestige threshold for track type
     */
    private getPrestigeThreshold;
    /**
     * Validate XP grant request
     */
    private validateXPRequest;
    /**
     * Initialize a new mastery track
     */
    private initializeMasteryTrack;
    /**
     * Update mastery record with new values
     */
    private updateMasteryRecord;
    /**
     * Grant level-up rewards
     */
    private grantLevelUpRewards;
    /**
     * Grant prestige rewards
     */
    private grantPrestigeRewards;
    /**
     * Get rewards for a specific level
     */
    private getLevelRewards;
    /**
     * Grant a reward to user
     */
    private grantReward;
    /**
     * Log XP grant for analytics
     */
    private logXPGrant;
}
//# sourceMappingURL=ProgressionEngine.d.ts.map