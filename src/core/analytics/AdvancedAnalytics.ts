import { pc } from 'playcanvas';
import { Logger } from '../utils/Logger';

export interface AnalyticsSettings {
  enabled: boolean;
  dataCollection: boolean;
  crashReporting: boolean;
  performanceTracking: boolean;
  userBehavior: boolean;
  gameplayMetrics: boolean;
}

export interface GameplayMetrics {
  matches: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
    averageMatchDuration: number;
    perfectVictories: number;
    totalDamage: number;
    totalCombo: number;
    averageCombo: number;
    maxCombo: number;
    specialMoves: number;
    throws: number;
    blocks: number;
    counters: number;
    inputAccuracy: number;
    reactionTime: number;
  };
  combos: {
    totalCombos: number;
    averageCombo: number;
    maxCombo: number;
    comboSuccessRate: number;
  };
  training: {
    totalSessions: number;
    totalTime: number;
    drillsCompleted: number;
    successRate: number;
    improvement: number;
  };
  social: {
    friends: number;
    matchesPlayed: number;
    winRate: number;
    totalPlayTime: number;
    achievements: number;
    contentCreated: number;
  };
  progression: {
    level: number;
    experience: number;
    rank: string;
    totalMatches: number;
    winRate: number;
    achievements: number;
  };
}

export class AdvancedAnalytics {
  private app: pc.Application;
  private analyticsSettings: AnalyticsSettings;
  private gameplayMetrics: GameplayMetrics;

  constructor(app: pc.Application) {
    this.app = app;
    this.initializeAdvancedAnalytics();
  }

  private initializeAdvancedAnalytics(): void {
    this.analyticsSettings = {
      enabled: true,
      dataCollection: true,
      crashReporting: true,
      performanceTracking: true,
      userBehavior: true,
      gameplayMetrics: true
    };

    this.gameplayMetrics = {
      matches: {
        totalMatches: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        averageMatchDuration: 0,
        perfectVictories: 0,
        totalDamage: 0,
        totalCombo: 0,
        averageCombo: 0,
        maxCombo: 0,
        specialMoves: 0,
        throws: 0,
        blocks: 0,
        counters: 0,
        inputAccuracy: 0,
        reactionTime: 0
      },
      combos: {
        totalCombos: 0,
        averageCombo: 0,
        maxCombo: 0,
        comboSuccessRate: 0
      },
      training: {
        totalSessions: 0,
        totalTime: 0,
        drillsCompleted: 0,
        successRate: 0,
        improvement: 0
      },
      social: {
        friends: 0,
        matchesPlayed: 0,
        winRate: 0,
        totalPlayTime: 0,
        achievements: 0,
        contentCreated: 0
      },
      progression: {
        level: 1,
        experience: 0,
        rank: 'Bronze',
        totalMatches: 0,
        winRate: 0,
        achievements: 0
      }
    };
  }

  public trackEvent(event: any): void {
    if (!this.analyticsSettings.enabled) return;
    this.app.fire('analytics:event_tracked', { event });
    Logger.info(`Tracked event: ${event.type}`);
  }

  public trackError(error: any): void {
    if (!this.analyticsSettings.enabled) return;
    this.app.fire('analytics:error_tracked', { error });
    Logger.info(`Tracked error: ${error.type}`);
  }

  public updateGameplayMetrics(metrics: Partial<GameplayMetrics>): void {
    if (!this.analyticsSettings.enabled) return;
    Object.assign(this.gameplayMetrics, metrics);
    this.app.fire('analytics:gameplay_metrics_updated', { metrics });
  }

  public getGameplayMetrics(): GameplayMetrics {
    return this.gameplayMetrics;
  }

  public getAnalyticsSettings(): AnalyticsSettings {
    return this.analyticsSettings;
  }

  public destroy(): void {
    // Cleanup
  }
}