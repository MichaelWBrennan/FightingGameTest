/**
 * Reward types and interfaces
 */
export interface RewardGrant {
    rewardId: string;
    rewardType: RewardType;
    grantedAt: Date;
    source: RewardSource;
    context?: string;
}
export interface UserReward {
    userId: string;
    rewardId: string;
    rewardType: RewardType;
    name: string;
    description: string;
    rarity: RewardRarity;
    grantedAt: Date;
    source: RewardSource;
    characterId?: string;
}
export interface RewardDefinition {
    id: string;
    name: string;
    description: string;
    type: RewardType;
    rarity: RewardRarity;
    characterId?: string;
    archetypeId?: string;
    previewAssets?: {
        thumbnail?: string;
        preview?: string;
    };
    unlockConditions?: Array<{
        type: 'level' | 'prestige' | 'achievement' | 'objective';
        value: string;
    }>;
}
export type RewardType = 'title' | 'banner' | 'announcer' | 'vfx_palette' | 'stage_variant' | 'profile_badge' | 'cosmetic' | 'skin';
export type RewardRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type RewardSource = 'level_up' | 'prestige' | 'objective_completion' | 'achievement' | 'event_participation' | 'progression';
export interface RewardQuery {
    userId: string;
    rewardType?: RewardType;
    characterId?: string;
    includeUnlocked?: boolean;
}
//# sourceMappingURL=Rewards.d.ts.map