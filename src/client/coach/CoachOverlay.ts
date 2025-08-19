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
  gameState: IGameState; // Game state manager interface
  playerProfile: any; // User profile with skill level, preferences
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
  advantageRating: number; // -3 to +3, 0 is even
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

export type TipType = 
  | 'matchup_general' 
  | 'matchup_specific' 
  | 'frame_data' 
  | 'combo_suggestion' 
  | 'defense_tip' 
  | 'spacing_advice' 
  | 'character_specific'
  | 'lab_exercise'
  | 'mistake_prevention';

export class CoachOverlay extends EventEmitter {
  private config: CoachOverlayConfig;
  private coachingData: CoachingData;
  private activeTips: Map<string, CoachingTip> = new Map();
  private roundHistory: RoundAnalysis[] = [];
  private sessionTipCount: number = 0;
  private lastTipTimestamp: number = 0;

  constructor(config: CoachOverlayConfig) {
    super();
    this.config = {
      enableDuringMatches: true,
      enableFrameData: true,
      enableMatchupTips: true,
      enablePostRoundAnalysis: true,
      maxTipsPerRound: 2,
      tipDisplayDurationMs: 8000,
      debugMode: false,
      ...config
    };

    this.coachingData = this.initializeCoachingData();
    this.setupGameStateListeners();
  }

  /**
   * Show a specific matchup tip
   */
  public showMatchupTip(matchupKey: string): void {
    if (!this.config.enableMatchupTips) return;

    const matchupData = this.coachingData.matchupDatabase.get(matchupKey);
    if (!matchupData) return;

    const playerSkill = this.getPlayerSkillLevel();
    const tips = this.getMatchupTips(matchupData, playerSkill);
    
    if (tips.length > 0) {
      this.displayTip(tips[0]);
    }
  }

  /**
   * Analyze a completed round and provide feedback
   */
  public analyzeRound(roundData: any): RoundAnalysis {
    const analysis = this.performRoundAnalysis(roundData);
    this.roundHistory.push(analysis);

    // Keep only last 10 rounds
    if (this.roundHistory.length > 10) {
      this.roundHistory.shift();
    }

    // Show post-round tips if enabled
    if (this.config.enablePostRoundAnalysis && this.shouldShowPostRoundTips()) {
      this.showPostRoundTips(analysis);
    }

    this.emit('round_analyzed', analysis);
    return analysis;
  }

  /**
   * Get recommended lab scenarios for player improvement
   */
  public getRecommendedLabScenarios(): LabScenario[] {
    const playerProgress = this.coachingData.playerProgress;
    const scenarios: LabScenario[] = [];

    // Recommend scenarios based on identified weaknesses
    playerProgress.weaknesses.forEach(weakness => {
      const relatedScenarios = this.getLabScenariosForWeakness(weakness);
      scenarios.push(...relatedScenarios);
    });

    // Sort by relevance and difficulty
    return scenarios
      .filter(scenario => this.meetsUnlockConditions(scenario))
      .sort((a, b) => this.scoreSuitability(b) - this.scoreSuitability(a))
      .slice(0, 5);
  }

  /**
   * Show frame data tip for current situation
   */
  public showFrameDataTip(moveId: string, situation: 'startup' | 'recovery' | 'advantage'): void {
    if (!this.config.enableFrameData) return;

    const frameData = this.coachingData.frameData.get(moveId);
    if (!frameData) return;

    let tipContent = '';
    switch (situation) {
      case 'startup':
        tipContent = `${frameData.name}: ${frameData.startup} frame startup. ${this.getStartupAdvice(frameData)}`;
        break;
      case 'recovery':
        tipContent = `${frameData.name}: ${frameData.recovery} frame recovery. ${this.getRecoveryAdvice(frameData)}`;
        break;
      case 'advantage':
        tipContent = `${frameData.name}: ${frameData.advantage} frame advantage. ${this.getAdvantageAdvice(frameData)}`;
        break;
    }

    const tip: CoachingTip = {
      id: `frame_${moveId}_${situation}_${Date.now()}`,
      type: 'frame_data',
      title: 'Frame Data',
      content: tipContent,
      priority: 'medium',
      timing: 'between_rounds',
      conditions: {},
      displayOptions: {
        duration: 5000,
        position: 'corner',
        animated: true,
        dismissible: true
      }
    };

    this.displayTip(tip);
  }

  /**
   * Start a coaching lab session
   */
  public startLabSession(scenarioId: string): void {
    const scenario = this.getLabScenario(scenarioId);
    if (!scenario) return;

    this.sessionTipCount = 0;
    this.emit('lab_session_started', scenario);

    // Show initial tips for the scenario
    scenario.tips.forEach((tip, index) => {
      setTimeout(() => {
        this.showLabTip(tip, scenario);
      }, index * 3000);
    });
  }

  /**
   * Get coaching summary for recent performance
   */
  public getCoachingSummary(): {
    overallTrend: 'improving' | 'stable' | 'declining';
    keyInsights: string[];
    recommendedFocus: string[];
    nextSteps: string[];
  } {
    const recentRounds = this.roundHistory.slice(-5);
    
    const overallTrend = this.calculatePerformanceTrend(recentRounds);
    const keyInsights = this.generateKeyInsights(recentRounds);
    const recommendedFocus = this.getRecommendedFocusAreas();
    const nextSteps = this.generateNextSteps();

    return {
      overallTrend,
      keyInsights,
      recommendedFocus,
      nextSteps
    };
  }

  /**
   * Update player progress based on match results
   */
  public updatePlayerProgress(matchData: any): void {
    // Analyze match for progress indicators
    const improvements = this.detectImprovements(matchData);
    const newWeaknesses = this.detectWeaknesses(matchData);

    // Update progress tracking
    improvements.forEach(improvement => {
      if (!this.coachingData.playerProgress.recentImprovements.includes(improvement)) {
        this.coachingData.playerProgress.recentImprovements.push(improvement);
      }
    });

    newWeaknesses.forEach(weakness => {
      if (!this.coachingData.playerProgress.weaknesses.includes(weakness)) {
        this.coachingData.playerProgress.weaknesses.push(weakness);
      }
    });

    // Update focus areas based on recent patterns
    this.updateFocusAreas();

    this.emit('progress_updated', this.coachingData.playerProgress);
  }

  private performRoundAnalysis(roundData: any): RoundAnalysis {
    const analysis: RoundAnalysis = {
      roundNumber: roundData.roundNumber,
      playerCharacter: roundData.playerCharacter,
      opponentCharacter: roundData.opponentCharacter,
      result: roundData.result,
      duration: roundData.duration,
      playerStats: {
        hitsTaken: roundData.hitsTaken || 0,
        hitsLanded: roundData.hitsLanded || 0,
        comboCount: roundData.comboCount || 0,
        blockPercentage: roundData.blockPercentage || 0,
        reversalAttempts: roundData.reversalAttempts || 0
      },
      identifiedIssues: [],
      improvements: []
    };

    // Analyze common issues
    if (analysis.playerStats.blockPercentage < 0.6) {
      analysis.identifiedIssues.push({
        type: 'defense',
        severity: 'major',
        description: 'Low blocking percentage indicates defensive struggles',
        suggestion: 'Practice blocking mixups in training mode'
      });
    }

    if (analysis.playerStats.comboCount === 0 && analysis.playerStats.hitsLanded > 3) {
      analysis.identifiedIssues.push({
        type: 'offense',
        severity: 'moderate',
        description: 'Missing combo opportunities after successful hits',
        suggestion: 'Learn basic combo routes for your character'
      });
    }

    // Identify improvements
    const recentPerformance = this.getRecentPerformanceMetrics();
    if (analysis.playerStats.blockPercentage > recentPerformance.avgBlockPercentage) {
      analysis.improvements.push({
        area: 'defense',
        description: 'Improved blocking compared to recent matches'
      });
    }

    return analysis;
  }

  private displayTip(tip: CoachingTip): void {
    if (this.sessionTipCount >= this.config.maxTipsPerRound!) {
      return;
    }

    if (Date.now() - this.lastTipTimestamp < 3000) {
      return; // Rate limit tips
    }

    this.activeTips.set(tip.id, tip);
    this.sessionTipCount++;
    this.lastTipTimestamp = Date.now();

    this.emit('tip_displayed', tip);

    // Auto-dismiss tip after duration
    setTimeout(() => {
      this.dismissTip(tip.id);
    }, tip.displayOptions.duration);

    this.log(`Displaying tip: ${tip.title} - ${tip.content}`);
  }

  private dismissTip(tipId: string): void {
    const tip = this.activeTips.get(tipId);
    if (tip) {
      this.activeTips.delete(tipId);
      this.emit('tip_dismissed', tip);
    }
  }

  private shouldShowTip(tip: CoachingTip): boolean {
    // Check timing conditions
    const gamePhase = this.getCurrentGamePhase();
    if (tip.timing !== gamePhase) {
      return false;
    }

    // Check character conditions
    if (tip.conditions.characterId && tip.conditions.characterId !== this.getCurrentCharacter()) {
      return false;
    }

    // Check skill level
    if (tip.conditions.skillLevel && tip.conditions.skillLevel !== this.getPlayerSkillLevel()) {
      return false;
    }

    // Check if tip was recently shown
    const recentTips = Array.from(this.activeTips.values())
      .filter(t => t.type === tip.type)
      .length;
    
    return recentTips === 0;
  }

  private shouldShowPostRoundTips(): boolean {
    // Don't show tips if player is in a flow state (winning streak)
    const recentResults = this.roundHistory.slice(-3).map(r => r.result);
    const winStreak = recentResults.every(r => r === 'win');
    
    if (winStreak) return false;

    // Show tips more frequently for beginners
    const skillLevel = this.getPlayerSkillLevel();
    if (skillLevel === 'beginner') return true;
    
    // Show tips less frequently for advanced players
    return Math.random() < (skillLevel === 'advanced' ? 0.3 : 0.6);
  }

  private showPostRoundTips(analysis: RoundAnalysis): void {
    // Prioritize tips based on analysis
    const tipCandidates: CoachingTip[] = [];

    analysis.identifiedIssues.forEach(issue => {
      const tips = this.getTipsForIssue(issue);
      tipCandidates.push(...tips);
    });

    // Sort by priority and relevance
    tipCandidates
      .sort((a, b) => this.getTipPriority(b) - this.getTipPriority(a))
      .slice(0, 1) // Show only one post-round tip
      .forEach(tip => {
        setTimeout(() => this.displayTip(tip), 2000); // Delay to not interrupt flow
      });
  }

  private getMatchupTips(matchupData: MatchupData, skillLevel: string): CoachingTip[] {
    const tips: CoachingTip[] = [];

    if (skillLevel === 'beginner') {
      // Focus on basic strategies
      matchupData.keyStrategies.slice(0, 1).forEach(strategy => {
        tips.push({
          id: `matchup_basic_${Date.now()}`,
          type: 'matchup_general',
          title: 'Matchup Strategy',
          content: strategy,
          priority: 'high',
          timing: 'pre_match',
          conditions: {},
          displayOptions: {
            duration: 10000,
            position: 'center',
            animated: true,
            dismissible: true
          }
        });
      });
    } else {
      // Show advanced strategies and frame data
      matchupData.frameTraps.slice(0, 1).forEach(trap => {
        tips.push({
          id: `matchup_advanced_${Date.now()}`,
          type: 'matchup_specific',
          title: 'Frame Trap Opportunity',
          content: `${trap.situation}: ${trap.advantage} frame advantage. Try: ${trap.followup}`,
          priority: 'medium',
          timing: 'between_rounds',
          conditions: {},
          displayOptions: {
            duration: 8000,
            position: 'corner',
            animated: true,
            dismissible: true
          }
        });
      });
    }

    return tips;
  }

  private initializeCoachingData(): CoachingData {
    // In a real implementation, this data would be loaded from a server
    // or from local data files. For now, we use dummy data.
    const { dummyCoachingData } = require('./coachingData');
    return dummyCoachingData;
  }

  private setupGameStateListeners(): void {
    // In a real implementation, these would listen to actual game events
    this.config.gameState?.on?.('round_start', () => {
      this.sessionTipCount = 0;
    });

    this.config.gameState?.on?.('match_start', (matchData: any) => {
      const matchupKey = `${matchData.playerCharacter}_vs_${matchData.opponentCharacter}`;
      this.showMatchupTip(matchupKey);
    });
  }

  private getPlayerSkillLevel(): 'beginner' | 'intermediate' | 'advanced' {
    return this.config.playerProfile?.skillLevel || 'beginner';
  }

  private getCurrentGamePhase(): 'pre_match' | 'between_rounds' | 'post_match' | 'lab_session' {
    return this.config.gameState?.phase || 'between_rounds';
  }

  private getCurrentCharacter(): string {
    return this.config.gameState?.playerCharacter || '';
  }

  private getTipPriority(tip: CoachingTip): number {
    const priorityValues = { critical: 4, high: 3, medium: 2, low: 1 };
    return priorityValues[tip.priority];
  }

  private getTipsForIssue(issue: any): CoachingTip[] {
    // Return relevant tips based on issue type
    return [];
  }

  private getRecentPerformanceMetrics(): any {
    const recent = this.roundHistory.slice(-5);
    return {
      avgBlockPercentage: recent.reduce((sum, r) => sum + r.playerStats.blockPercentage, 0) / recent.length || 0
    };
  }

  private calculatePerformanceTrend(rounds: RoundAnalysis[]): 'improving' | 'stable' | 'declining' {
    if (rounds.length < 3) return 'stable';
    
    const winRates = rounds.map(r => r.result === 'win' ? 1 : 0);
    const early = winRates.slice(0, Math.floor(winRates.length / 2));
    const late = winRates.slice(Math.floor(winRates.length / 2));
    
    const earlyAvg = early.reduce((a, b) => a + b, 0) / early.length;
    const lateAvg = late.reduce((a, b) => a + b, 0) / late.length;
    
    if (lateAvg > earlyAvg + 0.2) return 'improving';
    if (lateAvg < earlyAvg - 0.2) return 'declining';
    return 'stable';
  }

  private generateKeyInsights(rounds: RoundAnalysis[]): string[] {
    // Generate insights based on round analysis
    return ['Focus on improving defense', 'Good combo execution'];
  }

  private getRecommendedFocusAreas(): string[] {
    return this.coachingData.playerProgress.focusAreas;
  }

  private generateNextSteps(): string[] {
    return ['Practice blocking mixups', 'Learn advanced combos'];
  }

  private detectImprovements(matchData: any): string[] {
    // Detect areas where player has improved
    return [];
  }

  private detectWeaknesses(matchData: any): string[] {
    // Detect new weaknesses from match data
    return [];
  }

  private updateFocusAreas(): void {
    // Update focus areas based on recent performance
  }

  private getLabScenariosForWeakness(weakness: string): LabScenario[] {
    // Return lab scenarios that address specific weakness
    return [];
  }

  private meetsUnlockConditions(scenario: LabScenario): boolean {
    // Check if player meets unlock conditions for scenario
    return true;
  }

  private scoreSuitability(scenario: LabScenario): number {
    // Score how suitable a scenario is for current player
    return 1;
  }

  private getLabScenario(scenarioId: string): LabScenario | null {
    // Get specific lab scenario by ID
    return null;
  }

  private showLabTip(tip: string, scenario: LabScenario): void {
    const labTip: CoachingTip = {
      id: `lab_${scenario.id}_${Date.now()}`,
      type: 'lab_exercise',
      title: 'Lab Tip',
      content: tip,
      priority: 'medium',
      timing: 'lab_session',
      conditions: {},
      displayOptions: {
        duration: 6000,
        position: 'top',
        animated: true,
        dismissible: true
      }
    };

    this.displayTip(labTip);
  }

  private getStartupAdvice(frameData: any): string {
    return frameData.startup <= 8 ? 'Fast enough to interrupt gaps' : 'Use for reads and punishes';
  }

  private getRecoveryAdvice(frameData: any): string {
    return frameData.recovery >= 20 ? 'Punishable on block - use carefully' : 'Relatively safe option';
  }

  private getAdvantageAdvice(frameData: any): string {
    if (frameData.advantage >= 3) return 'Good for pressure and mixups';
    if (frameData.advantage >= 0) return 'Safe for continued offense';
    return 'Opponent\'s turn - focus on defense';
  }

  private log(message: string, ...args: any[]): void {
    if (this.config.debugMode) {
      console.log(`[CoachOverlay] ${message}`, ...args);
    }
  }
}