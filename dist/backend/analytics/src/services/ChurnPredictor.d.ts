/**
 * ChurnPredictor - Ethical churn prediction and winback system
 *
 * Predicts player churn risk based on behavioral patterns while maintaining
 * ethical standards. Focuses on value creation rather than manipulation.
 * Provides transparent risk explanations and respectful intervention strategies.
 */
import { DatabaseManager } from '../database/DatabaseManager';
import { ClickHouseManager } from '../database/ClickHouseManager';
export interface ChurnRiskScore {
    userId: string;
    riskTier: 'low' | 'medium' | 'high';
    score: number;
    confidence: number;
    explanation: string[];
    keyFactors: ChurnFactor[];
    recommendedActions: WinbackAction[];
    calculatedAt: Date;
    validUntil: Date;
}
export interface ChurnFactor {
    factor: string;
    impact: 'positive' | 'negative';
    weight: number;
    description: string;
}
export interface WinbackAction {
    type: 'practice_unlock' | 'mentor_priority' | 'cosmetic_trial' | 'content_reminder' | 'skill_feedback';
    title: string;
    description: string;
    estimatedImpact: 'low' | 'medium' | 'high';
    ethicalRating: 'green' | 'yellow' | 'red';
    implementationCost: 'low' | 'medium' | 'high';
}
export interface ChurnModel {
    version: string;
    features: string[];
    weights: Record<string, number>;
    thresholds: {
        lowRisk: number;
        mediumRisk: number;
        highRisk: number;
    };
    accuracy: number;
    lastTrained: Date;
}
export interface PlayerBehaviorProfile {
    userId: string;
    daysSinceInstall: number;
    sessionsLast7Days: number;
    sessionsLast14Days: number;
    sessionsLast30Days: number;
    avgSessionDuration: number;
    sessionVariance: number;
    firstMatchOutcome: 'win' | 'loss' | 'disconnect';
    onboardingCompletion: number;
    rageQuitRate: number;
    mmrDelta: number;
    mmrVolatility: number;
    labCompletions: number;
    clubMembership: boolean;
    mentorActivity: number;
    catalogViews: number;
    purchaseCount: number;
    socialConnections: number;
    lastActive: Date;
}
export declare class ChurnPredictor {
    private db;
    private clickhouse;
    private currentModel;
    private predictionCache;
    constructor(db: DatabaseManager, clickhouse: ClickHouseManager);
    /**
     * Calculate churn risk score for a user
     */
    calculateChurnRisk(userId: string, forceRefresh?: boolean): Promise<ChurnRiskScore>;
    /**
     * Get winback recommendations for at-risk players
     */
    getWinbackRecommendations(userId: string): Promise<WinbackAction[]>;
    /**
     * Run daily churn scoring job
     */
    runDailyChurnScoring(): Promise<{
        processed: number;
        highRisk: number;
        mediumRisk: number;
        lowRisk: number;
    }>;
    /**
     * Get player behavior profile from analytics data
     */
    private getPlayerBehaviorProfile;
    /**
     * Apply cold-start heuristics for new players
     */
    private calculateColdStartRisk;
    /**
     * Apply trained churn model
     */
    private applyChurnModel;
    /**
     * Generate ethical winback actions
     */
    private generateWinbackActions;
    private extractFeatures;
    private generateExplanation;
    private getFactorDescription;
    private getDefaultModel;
    private getMinimalProfile;
    private getActiveUsers;
    private storePrediction;
}
