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
import { RetentionClient } from './RetentionClient';
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
    characterId?: string;
    archetypeId?: string;
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
export type XPSource = 'match_victory' | 'match_participation' | 'daily_objective' | 'weekly_objective' | 'lab_completion' | 'mentor_activity' | 'perfect_round' | 'combo_performance' | 'first_time_bonus';
export type PerformanceTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export declare class MasteryEngine extends EventEmitter {
    private config;
    private data;
    private rewardTable;
    private archetypeChallenges;
    constructor(config: MasteryConfig);
    /**
     * Grant account-level XP
     */
    grantAccountXP(amount: number, source: XPSource, performanceTier?: PerformanceTier): void;
    /**
     * Grant character-specific XP
     */
    grantCharacterXP(characterId: string, amount: number, source: XPSource, performanceTier?: PerformanceTier): void;
    /**
     * Grant archetype mastery XP and update challenges
     */
    grantArchetypeXP(archetypeId: string, amount: number, source: XPSource): void;
    /**
     * Trigger prestige for account mastery
     */
    prestigeAccount(): boolean;
    /**
     * Trigger prestige for character mastery
     */
    prestigeCharacter(characterId: string): boolean;
    /**
     * Get current mastery data (read-only)
     */
    getMasteryData(): Readonly<MasteryData>;
    /**
     * Get rewards for a specific level and track type
     */
    getRewardsForLevel(trackType: 'account' | string, level: number): LevelReward | null;
    /**
     * Check if account can prestige
     */
    canPrestigeAccount(): boolean;
    /**
     * Check if character can prestige
     */
    canPrestigeCharacter(characterId: string): boolean;
    private calculateXP;
    private calculateLevel;
    private getPrestigeThreshold;
    private checkAccountLevelUp;
    private checkCharacterLevelUp;
    private checkArchetypeLevelUp;
    private checkAccountPrestige;
    private checkCharacterPrestige;
    private grantLevelRewards;
    private grantPrestigeRewards;
    private updateArchetypeChallenges;
    private hasSeenPrestigePrompt;
    private initializeCharacter;
    private initializeArchetype;
    private loadMasteryData;
    private saveMasteryData;
    private setupRewardTables;
    private setupArchetypeChallenges;
}
