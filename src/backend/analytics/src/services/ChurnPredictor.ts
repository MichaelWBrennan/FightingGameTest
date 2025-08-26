/**
 * ChurnPredictor - Ethical churn prediction and winback system
 * 
 * Predicts player churn risk based on behavioral patterns while maintaining
 * ethical standards. Focuses on value creation rather than manipulation.
 * Provides transparent risk explanations and respectful intervention strategies.
 */

import { DatabaseManager } from '../database/DatabaseManager';
import { ClickHouseManager } from '../database/ClickHouseManager';
import { Logger } from '../utils/Logger';

const logger = Logger.getInstance();

export interface ChurnRiskScore {
  userId: string;
  riskTier: 'low' | 'medium' | 'high';
  score: number; // 0-100
  confidence: number; // 0-100
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
  ethicalRating: 'green' | 'yellow' | 'red'; // Ethics check
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
  onboardingCompletion: number; // 0-100%
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

export class ChurnPredictor {
  private db: DatabaseManager;
  private clickhouse: ClickHouseManager;
  private currentModel: ChurnModel;
  private predictionCache: Map<string, ChurnRiskScore> = new Map();

  constructor(db: DatabaseManager, clickhouse: ClickHouseManager) {
    this.db = db;
    this.clickhouse = clickhouse;
    this.currentModel = this.getDefaultModel();
  }

  /**
   * Calculate churn risk score for a user
   */
  async calculateChurnRisk(userId: string, forceRefresh: boolean = false): Promise<ChurnRiskScore> {
    try {
      // Check cache first
      if (!forceRefresh && this.predictionCache.has(userId)) {
        const cached = this.predictionCache.get(userId)!;
        if (cached.validUntil > new Date()) {
          return cached;
        }
      }

      // Get player behavior profile
      const profile = await this.getPlayerBehaviorProfile(userId);
      
      // Apply cold-start heuristics for new players
      if (profile.daysSinceInstall <= 7) {
        return this.calculateColdStartRisk(profile);
      }

      // Apply trained model for established players
      const prediction = await this.applyChurnModel(profile);
      
      // Cache result
      this.predictionCache.set(userId, prediction);
      
      // Store prediction for tracking
      await this.storePrediction(prediction);

      logger.info('Churn risk calculated', {
        userId,
        riskTier: prediction.riskTier,
        score: prediction.score
      });

      return prediction;

    } catch (error) {
      logger.error('Failed to calculate churn risk:', error);
      throw error;
    }
  }

  /**
   * Get winback recommendations for at-risk players
   */
  async getWinbackRecommendations(userId: string): Promise<WinbackAction[]> {
    try {
      const churnRisk = await this.calculateChurnRisk(userId);
      
      if (churnRisk.riskTier === 'low') {
        return []; // No intervention needed
      }

      const profile = await this.getPlayerBehaviorProfile(userId);
      return this.generateWinbackActions(profile, churnRisk);

    } catch (error) {
      logger.error('Failed to get winback recommendations:', error);
      return [];
    }
  }

  /**
   * Run daily churn scoring job
   */
  async runDailyChurnScoring(): Promise<{
    processed: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  }> {
    try {
      logger.info('Starting daily churn scoring job');

      // Get active users from last 30 days
      const activeUsers = await this.getActiveUsers(30);
      
      let processed = 0;
      let highRisk = 0;
      let mediumRisk = 0;
      let lowRisk = 0;

      for (const userId of activeUsers) {
        try {
          const risk = await this.calculateChurnRisk(userId, true);
          processed++;

          switch (risk.riskTier) {
            case 'high':
              highRisk++;
              break;
            case 'medium':
              mediumRisk++;
              break;
            case 'low':
              lowRisk++;
              break;
          }

          // Rate limit to avoid overwhelming the system
          if (processed % 100 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

        } catch (error) {
          logger.error(`Failed to score user ${userId}:`, error);
        }
      }

      logger.info('Daily churn scoring completed', {
        processed,
        highRisk,
        mediumRisk,
        lowRisk
      });

      return { processed, highRisk, mediumRisk, lowRisk };

    } catch (error) {
      logger.error('Daily churn scoring failed:', error);
      throw error;
    }
  }

  /**
   * Get player behavior profile from analytics data
   */
  private async getPlayerBehaviorProfile(userId: string): Promise<PlayerBehaviorProfile> {
    try {
      // Query ClickHouse for behavioral metrics
      const behaviorQuery = `
        SELECT 
          user_id,
          dateDiff('day', MIN(ts), NOW()) as days_since_install,
          countIf(event = 'session_start' AND ts >= NOW() - INTERVAL 7 DAY) as sessions_7d,
          countIf(event = 'session_start' AND ts >= NOW() - INTERVAL 14 DAY) as sessions_14d,
          countIf(event = 'session_start' AND ts >= NOW() - INTERVAL 30 DAY) as sessions_30d,
          AVG(session_duration) as avg_session_duration,
          stddevPop(session_duration) as session_variance,
          countIf(event = 'match_result' AND disconnect = true) / countIf(event = 'match_result') as rage_quit_rate,
          countIf(event = 'lab_completion') as lab_completions,
          countIf(event = 'store_impression') as catalog_views,
          countIf(event = 'purchase_completed') as purchase_count,
          MAX(ts) as last_active
        FROM events 
        WHERE user_id = ? AND ts >= NOW() - INTERVAL 90 DAY
        GROUP BY user_id
      `;

      const behaviorResult = await this.clickhouse.query(behaviorQuery, [userId]);
      
      if (behaviorResult.length === 0) {
        // New user with minimal data
        return this.getMinimalProfile(userId);
      }

      const row = behaviorResult[0];

      // Get additional data from PostgreSQL
      const profileQuery = `
        SELECT 
          onboarding_completion,
          first_match_outcome,
          club_membership,
          mentor_sessions,
          social_connections,
          mmr_current,
          mmr_peak
        FROM user_profiles WHERE user_id = $1
      `;

      const profileResult = await this.db.query(profileQuery, [userId]);
      const profile = (profileResult as any).rows ? (profileResult as any).rows[0] || {} : profileResult[0] || {};

      return {
        userId,
        daysSinceInstall: row.days_since_install || 0,
        sessionsLast7Days: row.sessions_7d || 0,
        sessionsLast14Days: row.sessions_14d || 0,
        sessionsLast30Days: row.sessions_30d || 0,
        avgSessionDuration: row.avg_session_duration || 0,
        sessionVariance: row.session_variance || 0,
        firstMatchOutcome: profile.first_match_outcome || 'loss',
        onboardingCompletion: profile.onboarding_completion || 0,
        rageQuitRate: row.rage_quit_rate || 0,
        mmrDelta: (profile.mmr_current || 1000) - (profile.mmr_peak || 1000),
        mmrVolatility: Math.abs(profile.mmr_current - profile.mmr_peak) || 0,
        labCompletions: row.lab_completions || 0,
        clubMembership: profile.club_membership || false,
        mentorActivity: profile.mentor_sessions || 0,
        catalogViews: row.catalog_views || 0,
        purchaseCount: row.purchase_count || 0,
        socialConnections: profile.social_connections || 0,
        lastActive: new Date(row.last_active || Date.now())
      };

    } catch (error) {
      logger.error('Failed to get player behavior profile:', error);
      return this.getMinimalProfile(userId);
    }
  }

  /**
   * Apply cold-start heuristics for new players
   */
  private calculateColdStartRisk(profile: PlayerBehaviorProfile): ChurnRiskScore {
    let score = 50; // Start neutral
    const factors: ChurnFactor[] = [];
    
    // Days since install
    if (profile.daysSinceInstall <= 1) {
      score -= 20;
      factors.push({
        factor: 'new_player',
        impact: 'positive',
        weight: 0.3,
        description: 'Very new player, normal exploration phase'
      });
    }

    // First match outcome
    if (profile.firstMatchOutcome === 'loss') {
      score += 15;
      factors.push({
        factor: 'first_match_loss',
        impact: 'negative',
        weight: 0.25,
        description: 'Lost first match, may impact retention'
      });
    }

    // Onboarding completion
    if (profile.onboardingCompletion < 50) {
      score += 20;
      factors.push({
        factor: 'incomplete_onboarding',
        impact: 'negative',
        weight: 0.4,
        description: 'Has not completed onboarding tutorial'
      });
    }

    // Session frequency
    if (profile.sessionsLast7Days >= 3) {
      score -= 25;
      factors.push({
        factor: 'engaged_sessions',
        impact: 'positive',
        weight: 0.35,
        description: 'Playing regularly in first week'
      });
    }

    const riskTier = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
    
    return {
      userId: profile.userId,
      riskTier,
      score: Math.max(0, Math.min(100, score)),
      confidence: 60, // Lower confidence for cold-start
      explanation: this.generateExplanation(riskTier, factors),
      keyFactors: factors,
      recommendedActions: this.generateWinbackActions(profile, { riskTier } as ChurnRiskScore),
      calculatedAt: new Date(),
      validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours
    };
  }

  /**
   * Apply trained churn model
   */
  private async applyChurnModel(profile: PlayerBehaviorProfile): Promise<ChurnRiskScore> {
    const features = this.extractFeatures(profile);
    let score = 0;
    const factors: ChurnFactor[] = [];

    // Apply model weights
    for (const [feature, value] of Object.entries(features)) {
      const weight = this.currentModel.weights[feature] || 0;
      const contribution = value * weight;
      score += contribution;

      if (Math.abs(contribution) > 5) { // Only include significant factors
        factors.push({
          factor: feature,
          impact: contribution > 0 ? 'negative' : 'positive',
          weight: Math.abs(weight),
          description: this.getFactorDescription(feature, value)
        });
      }
    }

    // Normalize score to 0-100 range
    score = Math.max(0, Math.min(100, score * 10));
    
    const riskTier = score >= this.currentModel.thresholds.highRisk ? 'high' :
                    score >= this.currentModel.thresholds.mediumRisk ? 'medium' : 'low';

    return {
      userId: profile.userId,
      riskTier,
      score,
      confidence: this.currentModel.accuracy,
      explanation: this.generateExplanation(riskTier, factors),
      keyFactors: factors.slice(0, 5), // Top 5 factors
      recommendedActions: this.generateWinbackActions(profile, { riskTier } as ChurnRiskScore),
      calculatedAt: new Date(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }

  /**
   * Generate ethical winback actions
   */
  private generateWinbackActions(profile: PlayerBehaviorProfile, risk: ChurnRiskScore): WinbackAction[] {
    const actions: WinbackAction[] = [];

    if (risk.riskTier === 'high') {
      // High-risk players get more comprehensive support
      if (profile.labCompletions < 3) {
        actions.push({
          type: 'practice_unlock',
          title: 'Unlock Advanced Training',
          description: 'Gain permanent access to all training modes to improve your skills',
          estimatedImpact: 'high',
          ethicalRating: 'green',
          implementationCost: 'low'
        });
      }

      if (!profile.clubMembership) {
        actions.push({
          type: 'mentor_priority',
          title: 'Priority Mentor Matching',
          description: 'Get matched with experienced players who can help improve your game',
          estimatedImpact: 'medium',
          ethicalRating: 'green',
          implementationCost: 'medium'
        });
      }

      if (profile.rageQuitRate > 0.3) {
        actions.push({
          type: 'skill_feedback',
          title: 'Personalized Skill Analysis',
          description: 'Receive detailed feedback on areas for improvement',
          estimatedImpact: 'medium',
          ethicalRating: 'green',
          implementationCost: 'medium'
        });
      }
    }

    if (risk.riskTier === 'medium') {
      // Medium-risk players get lighter interventions
      if (profile.catalogViews > 5 && profile.purchaseCount === 0) {
        actions.push({
          type: 'cosmetic_trial',
          title: 'Preview Cosmetics',
          description: 'Try out cosmetic items in training mode (no purchase pressure)',
          estimatedImpact: 'low',
          ethicalRating: 'yellow',
          implementationCost: 'low'
        });
      }

      actions.push({
        type: 'content_reminder',
        title: 'New Content Available',
        description: 'Check out new characters, stages, or community events',
        estimatedImpact: 'low',
        ethicalRating: 'green',
        implementationCost: 'low'
      });
    }

    // Filter out unethical actions
    return actions.filter(action => action.ethicalRating !== 'red');
  }

  private extractFeatures(profile: PlayerBehaviorProfile): Record<string, number> {
    return {
      days_since_install: profile.daysSinceInstall,
      session_frequency_7d: profile.sessionsLast7Days,
      session_frequency_14d: profile.sessionsLast14Days,
      session_frequency_30d: profile.sessionsLast30Days,
      avg_session_duration: profile.avgSessionDuration,
      session_variance: profile.sessionVariance,
      onboarding_completion: profile.onboardingCompletion,
      rage_quit_rate: profile.rageQuitRate,
      mmr_delta: profile.mmrDelta,
      mmr_volatility: profile.mmrVolatility,
      lab_completions: profile.labCompletions,
      club_membership: profile.clubMembership ? 1 : 0,
      mentor_activity: profile.mentorActivity,
      catalog_views: profile.catalogViews,
      purchase_count: profile.purchaseCount,
      social_connections: profile.socialConnections,
      first_match_win: profile.firstMatchOutcome === 'win' ? 1 : 0,
      days_since_last_active: Math.floor((Date.now() - profile.lastActive.getTime()) / (1000 * 60 * 60 * 24))
    };
  }

  private generateExplanation(riskTier: string, factors: ChurnFactor[]): string[] {
    const explanations: string[] = [];

    switch (riskTier) {
      case 'high':
        explanations.push('This player shows signs of potential churn in the near future.');
        break;
      case 'medium':
        explanations.push('This player has some concerning engagement patterns.');
        break;
      case 'low':
        explanations.push('This player shows healthy engagement patterns.');
        break;
    }

    // Add top factors
    const topFactors = factors.slice(0, 3);
    if (topFactors.length > 0) {
      explanations.push('Key factors include:');
      topFactors.forEach(factor => {
        explanations.push(`• ${factor.description}`);
      });
    }

    return explanations;
  }

  private getFactorDescription(feature: string, value: number): string {
    const descriptions: Record<string, string> = {
      'session_frequency_7d': value < 2 ? 'Low session frequency this week' : 'Good session frequency',
      'rage_quit_rate': value > 0.2 ? 'High disconnection rate in matches' : 'Low disconnection rate',
      'onboarding_completion': value < 80 ? 'Incomplete onboarding experience' : 'Completed onboarding',
      'lab_completions': value < 3 ? 'Limited training mode usage' : 'Active in training modes',
      'club_membership': value === 0 ? 'Not part of any club' : 'Active club member',
      'days_since_last_active': value > 3 ? 'Has not played recently' : 'Recently active'
    };

    return descriptions[feature] || `${feature}: ${value}`;
  }

  private getDefaultModel(): ChurnModel {
    return {
      version: '1.0.0',
      features: [
        'days_since_install', 'session_frequency_7d', 'session_frequency_14d',
        'avg_session_duration', 'rage_quit_rate', 'onboarding_completion',
        'lab_completions', 'club_membership', 'days_since_last_active'
      ],
      weights: {
        'days_since_install': 0.1,
        'session_frequency_7d': -0.8,
        'session_frequency_14d': -0.6,
        'avg_session_duration': -0.4,
        'rage_quit_rate': 0.7,
        'onboarding_completion': -0.3,
        'lab_completions': -0.2,
        'club_membership': -0.3,
        'days_since_last_active': 0.9
      },
      thresholds: {
        lowRisk: 30,
        mediumRisk: 50,
        highRisk: 70
      },
      accuracy: 75,
      lastTrained: new Date()
    };
  }

  private getMinimalProfile(userId: string): PlayerBehaviorProfile {
    return {
      userId,
      daysSinceInstall: 0,
      sessionsLast7Days: 0,
      sessionsLast14Days: 0,
      sessionsLast30Days: 0,
      avgSessionDuration: 0,
      sessionVariance: 0,
      firstMatchOutcome: 'loss',
      onboardingCompletion: 0,
      rageQuitRate: 0,
      mmrDelta: 0,
      mmrVolatility: 0,
      labCompletions: 0,
      clubMembership: false,
      mentorActivity: 0,
      catalogViews: 0,
      purchaseCount: 0,
      socialConnections: 0,
      lastActive: new Date()
    };
  }

  private async getActiveUsers(days: number): Promise<string[]> {
    const result = await this.clickhouse.query(
      `SELECT DISTINCT user_id FROM events WHERE ts >= NOW() - INTERVAL ${days} DAY`,
      []
    );
    return result.map(row => row.user_id);
  }

  private async storePrediction(prediction: ChurnRiskScore): Promise<void> {
    await this.db.query(
      `INSERT INTO churn_predictions (
        user_id, risk_tier, score, confidence, calculated_at, valid_until, model_version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) DO UPDATE SET
        risk_tier = EXCLUDED.risk_tier,
        score = EXCLUDED.score,
        confidence = EXCLUDED.confidence,
        calculated_at = EXCLUDED.calculated_at,
        valid_until = EXCLUDED.valid_until,
        model_version = EXCLUDED.model_version`,
      [
        prediction.userId,
        prediction.riskTier,
        prediction.score,
        prediction.confidence,
        prediction.calculatedAt,
        prediction.validUntil,
        this.currentModel.version
      ]
    );
  }
}