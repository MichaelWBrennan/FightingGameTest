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
export class CoachOverlay extends EventEmitter {
    constructor(config) {
        super();
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "coachingData", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "activeTips", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "roundHistory", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "sessionTipCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "lastTipTimestamp", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
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
    showMatchupTip(matchupKey) {
        if (!this.config.enableMatchupTips)
            return;
        const matchupData = this.coachingData.matchupDatabase.get(matchupKey);
        if (!matchupData)
            return;
        const playerSkill = this.getPlayerSkillLevel();
        const tips = this.getMatchupTips(matchupData, playerSkill);
        if (tips.length > 0) {
            this.displayTip(tips[0]);
        }
    }
    /**
     * Analyze a completed round and provide feedback
     */
    analyzeRound(roundData) {
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
    getRecommendedLabScenarios() {
        const playerProgress = this.coachingData.playerProgress;
        const scenarios = [];
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
    showFrameDataTip(moveId, situation) {
        if (!this.config.enableFrameData)
            return;
        const frameData = this.coachingData.frameData.get(moveId);
        if (!frameData)
            return;
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
        const tip = {
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
    startLabSession(scenarioId) {
        const scenario = this.getLabScenario(scenarioId);
        if (!scenario)
            return;
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
    getCoachingSummary() {
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
    updatePlayerProgress(matchData) {
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
    performRoundAnalysis(roundData) {
        const analysis = {
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
    displayTip(tip) {
        if (this.sessionTipCount >= this.config.maxTipsPerRound) {
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
    dismissTip(tipId) {
        const tip = this.activeTips.get(tipId);
        if (tip) {
            this.activeTips.delete(tipId);
            this.emit('tip_dismissed', tip);
        }
    }
    shouldShowPostRoundTips() {
        // Don't show tips if player is in a flow state (winning streak)
        const recentResults = this.roundHistory.slice(-3).map(r => r.result);
        const winStreak = recentResults.every(r => r === 'win');
        if (winStreak)
            return false;
        // Show tips more frequently for beginners
        const skillLevel = this.getPlayerSkillLevel();
        if (skillLevel === 'beginner')
            return true;
        // Show tips less frequently for advanced players
        return Math.random() < (skillLevel === 'advanced' ? 0.3 : 0.6);
    }
    showPostRoundTips(analysis) {
        // Prioritize tips based on analysis
        const tipCandidates = [];
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
    getMatchupTips(matchupData, skillLevel) {
        const tips = [];
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
        }
        else {
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
    initializeCoachingData() {
        // In a real implementation, this data would be loaded from a server
        // or from local data files. For now, we use dummy data.
        const { dummyCoachingData } = require('./coachingData');
        return dummyCoachingData;
    }
    setupGameStateListeners() {
        // In a real implementation, these would listen to actual game events
        this.config.gameState?.on?.('round_start', () => {
            this.sessionTipCount = 0;
        });
        this.config.gameState?.on?.('match_start', (matchData) => {
            const matchupKey = `${matchData.playerCharacter}_vs_${matchData.opponentCharacter}`;
            this.showMatchupTip(matchupKey);
        });
    }
    getPlayerSkillLevel() {
        return this.config.playerProfile?.skillLevel || 'beginner';
    }
    getCurrentGamePhase() {
        // Fallback since IGameState does not expose phase directly
        return 'between_rounds';
    }
    getCurrentCharacter() {
        // Use IGameState API to resolve current player's character if available
        try {
            const playerId = this.playerId ?? 'player1';
            return this.config.gameState.getPlayerCharacter?.(playerId) ?? '';
        }
        catch {
            return '';
        }
    }
    getTipPriority(tip) {
        const priorityValues = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityValues[tip.priority];
    }
    getTipsForIssue(_issue) {
        // Return relevant tips based on issue type
        return [];
    }
    getRecentPerformanceMetrics() {
        const recent = this.roundHistory.slice(-5);
        const count = recent.length || 1;
        const total = recent.reduce((sum, r) => sum + r.playerStats.blockPercentage, 0);
        return {
            avgBlockPercentage: total / count
        };
    }
    calculatePerformanceTrend(rounds) {
        if (rounds.length < 3)
            return 'stable';
        const winRates = rounds.map(r => r.result === 'win' ? 1 : 0);
        const early = winRates.slice(0, Math.floor(winRates.length / 2));
        const late = winRates.slice(Math.floor(winRates.length / 2));
        const earlyAvg = early.reduce((a, b) => a + b, 0) / (early.length || 1);
        const lateAvg = late.reduce((a, b) => a + b, 0) / (late.length || 1);
        if (lateAvg > earlyAvg + 0.2)
            return 'improving';
        if (lateAvg < earlyAvg - 0.2)
            return 'declining';
        return 'stable';
    }
    generateKeyInsights(_rounds) {
        // Generate insights based on round analysis
        return ['Focus on improving defense', 'Good combo execution'];
    }
    getRecommendedFocusAreas() {
        return this.coachingData.playerProgress.focusAreas;
    }
    generateNextSteps() {
        return ['Practice blocking mixups', 'Learn advanced combos'];
    }
    detectImprovements(_matchData) {
        // Detect areas where player has improved
        return [];
    }
    detectWeaknesses(_matchData) {
        // Detect new weaknesses from match data
        return [];
    }
    updateFocusAreas() {
        // Update focus areas based on recent performance
    }
    getLabScenariosForWeakness(_weakness) {
        // Return lab scenarios that address specific weakness
        return [];
    }
    meetsUnlockConditions(_scenario) {
        // Check if player meets unlock conditions for scenario
        return true;
    }
    scoreSuitability(_scenario) {
        // Score how suitable a scenario is for current player
        return 1;
    }
    getLabScenario(_scenarioId) {
        // Get specific lab scenario by ID
        return null;
    }
    showLabTip(tip, scenario) {
        const labTip = {
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
    getStartupAdvice(frameData) {
        return frameData.startup <= 8 ? 'Fast enough to interrupt gaps' : 'Use for reads and punishes';
    }
    getRecoveryAdvice(frameData) {
        return frameData.recovery >= 20 ? 'Punishable on block - use carefully' : 'Relatively safe option';
    }
    getAdvantageAdvice(frameData) {
        if (frameData.advantage >= 3)
            return 'Good for pressure and mixups';
        if (frameData.advantage >= 0)
            return 'Safe for continued offense';
        return 'Opponent\'s turn - focus on defense';
    }
    log(message, ...args) {
        if (this.config.debugMode) {
            console.log(`[CoachOverlay] ${message}`, ...args);
        }
    }
}
//# sourceMappingURL=CoachOverlay.js.map