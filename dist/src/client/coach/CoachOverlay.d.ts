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
export interface CoachingData {
    frameAdvantage: number;
    hitConfirm: boolean;
    punishOpportunity: boolean;
    spacing: 'optimal' | 'suboptimal' | 'dangerous';
    nextAction: string;
}
export declare class CoachOverlay {
    private element;
    private isVisible;
    constructor();
    private createElement;
    show(data: CoachingData): void;
    hide(): void;
    toggle(): void;
    private getActionColor;
}
