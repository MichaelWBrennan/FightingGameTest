/**
 * CoachOverlay - Contextual gameplay tips and coaching system
 *
 * Provides frame-data tips, matchup primers, and post-round guidance
 * based on telemetry. Fully client-side with no additional latency.
 * Helps players improve without affecting match fairness.
 *
 * Usage:
 * const coach = new CoachOverlay({
 *   gameState: gameStateManager,
 *   playerProfile: userProfile,
 *   enableDuringMatches: true
 * });
 *
 * coach.showMatchupTip('grappler_vs_zoner');
 * coach.analyzeRound(roundData);
 *
 * How to extend:
 * - Add new tip categories by extending TipType enum
 * - Customize tip triggering by modifying shouldShowTip()
 * - Add new analysis types in RoundAnalysis interface
 * - Extend coaching data by updating CoachingData interface
 */
import { EventEmitter } from 'eventemitter3';
import { IGameState } from '../../../types/game';
export interface CoachOverlayConfig {
    gameState: IGameState;
    playerProfile: any;
    enableDuringMatches?: boolean;
    enableFrameData?: boolean;
    enableMatchupTips?: boolean;
    enablePostRoundAnalysis?: boolean;
    maxTipsPerRound?: number;
    tipDisplayDurationMs?: number;
    debugMode?: boolean;
}
export interface CoachingTip {
    id: string;
    type: TipType;
    title: string;
    content: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    timing: 'pre_match' | 'between_rounds' | 'post_match' | 'lab_session';
    conditions: {
        characterId?: string;
        opponentCharacter?: string;
        skillLevel?: 'beginner' | 'intermediate' | 'advanced';
        situation?: string;
    };
    displayOptions: {
        duration: number;
        position: 'top' | 'bottom' | 'center' | 'corner';
        animated: boolean;
        dismissible: boolean;
    };
    learnMoreUrl?: string;
    relatedTips?: string[];
}
export interface MatchupData {
    characterA: string;
    characterB: string;
    advantageRating: number;
    keyStrategies: string[];
    commonMistakes: string[];
    frameTraps: Array<{
        situation: string;
        advantage: number;
        followup: string;
    }>;
    punishWindows: Array<{
        move: string;
        recovery: number;
        punishOptions: string[];
    }>;
}
export interface RoundAnalysis {
    roundNumber: number;
    playerCharacter: string;
    opponentCharacter: string;
    result: 'win' | 'loss';
    duration: number;
    playerStats: {
        hitsTaken: number;
        hitsLanded: number;
        comboCount: number;
        blockPercentage: number;
        reversalAttempts: number;
    };
    identifiedIssues: Array<{
        type: 'defense' | 'offense' | 'spacing' | 'timing' | 'matchup_knowledge';
        severity: 'minor' | 'moderate' | 'major';
        description: string;
        suggestion: string;
    }>;
    improvements: Array<{
        area: string;
        description: string;
        practiceScenario?: string;
    }>;
}
export interface CoachingData {
    matchupDatabase: Map<string, MatchupData>;
    characterTips: Map<string, CoachingTip[]>;
    situationalTips: Map<string, CoachingTip[]>;
    frameData: Map<string, any>;
    playerProgress: {
        weaknesses: string[];
        strengths: string[];
        focusAreas: string[];
        recentImprovements: string[];
    };
}
export interface LabScenario {
    id: string;
    name: string;
    description: string;
    characterId: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    objectives: Array<{
        description: string;
        target: number;
        currentProgress: number;
    }>;
    cpuBehavior: string;
    tips: string[];
    unlockConditions?: Array<{
        type: 'level' | 'completion' | 'mastery';
        value: string;
    }>;
}
export type TipType = 'matchup_general' | 'matchup_specific' | 'frame_data' | 'combo_suggestion' | 'defense_tip' | 'spacing_advice' | 'character_specific' | 'lab_exercise' | 'mistake_prevention';
export declare class CoachOverlay extends EventEmitter {
    private config;
    private coachingData;
    private activeTips;
    private roundHistory;
    private sessionTipCount;
    private lastTipTimestamp;
    constructor(config: CoachOverlayConfig);
    /**
     * Show a specific matchup tip
     */
    showMatchupTip(matchupKey: string): void;
    /**
     * Analyze a completed round and provide feedback
     */
    analyzeRound(roundData: any): RoundAnalysis;
    /**
     * Get recommended lab scenarios for player improvement
     */
    getRecommendedLabScenarios(): LabScenario[];
    /**
     * Show frame data tip for current situation
     */
    showFrameDataTip(moveId: string, situation: 'startup' | 'recovery' | 'advantage'): void;
    /**
     * Start a coaching lab session
     */
    startLabSession(scenarioId: string): void;
    /**
     * Get coaching summary for recent performance
     */
    getCoachingSummary(): {
        overallTrend: 'improving' | 'stable' | 'declining';
        keyInsights: string[];
        recommendedFocus: string[];
        nextSteps: string[];
    };
    /**
     * Update player progress based on match results
     */
    updatePlayerProgress(matchData: any): void;
    private performRoundAnalysis;
    private displayTip;
    private dismissTip;
    private shouldShowPostRoundTips;
    private showPostRoundTips;
    private getMatchupTips;
    private initializeCoachingData;
    private setupGameStateListeners;
    private getPlayerSkillLevel;
    private getCurrentGamePhase;
    private getCurrentCharacter;
    private getTipPriority;
    private getTipsForIssue;
    private getRecentPerformanceMetrics;
    private calculatePerformanceTrend;
    private generateKeyInsights;
    private getRecommendedFocusAreas;
    private generateNextSteps;
    private detectImprovements;
    private detectWeaknesses;
    private updateFocusAreas;
    private getLabScenariosForWeakness;
    private meetsUnlockConditions;
    private scoreSuitability;
    private getLabScenario;
    private showLabTip;
    private getStartupAdvice;
    private getRecoveryAdvice;
    private getAdvantageAdvice;
    private log;
}
//# sourceMappingURL=CoachOverlay.d.ts.map