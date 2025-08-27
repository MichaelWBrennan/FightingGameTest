/**
 * Progression types and interfaces
 */
export interface MasteryState {
    userId: string;
    trackType: string;
    trackId?: string;
    level: number;
    xp: number;
    totalXp: number;
    prestigeLevel: number;
    lastPrestigeXp: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface XPGrantRequest {
    userId: string;
    trackType: string;
    trackId?: string;
    baseAmount: number;
    source: XPSource;
    reason: string;
    sessionHash: string;
    performanceTier?: PerformanceTier;
    characterId?: string;
    matchId?: string;
}
export interface ObjectiveState {
    id: string;
    userId: string;
    objectiveType: ObjectiveType;
    name: string;
    description: string;
    target: number;
    progress: number;
    completed: boolean;
    completedAt?: Date;
    expiresAt: Date;
    createdAt: Date;
    rewards: ObjectiveReward[];
}
export interface ObjectiveCompletion {
    objectiveId: string;
    userId: string;
    progress: number;
    sessionHash: string;
    context?: string;
}
export type XPSource = 'match_victory' | 'match_participation' | 'daily_objective' | 'weekly_objective' | 'lab_completion' | 'mentor_activity' | 'prestige' | 'perfect_round' | 'combo_performance' | 'first_time_bonus';
export type PerformanceTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type ObjectiveType = 'matches_played' | 'matches_won' | 'perfect_rounds' | 'lab_completed' | 'mentor_session' | 'weekly_wins' | 'archetype_mastery' | 'ranked_progression' | 'club_participation' | 'mentor_hours';
export interface ObjectiveReward {
    type: 'account_xp' | 'character_xp' | 'mastery_points' | 'cosmetic_unlock' | 'title_unlock';
    amount?: number;
    itemId?: string;
    characterSpecific?: boolean;
}
export interface PrestigeRequest {
    userId: string;
    trackType: string;
    trackId?: string;
}
