export interface PlayerRank {
  playerId: string;
  rank: string;
  tier: number;
  points: number;
  wins: number;
  losses: number;
  winRate: number;
  streak: number;
  maxStreak: number;
  lastPlayed: Date;
  season: string;
}

export interface RankTier {
  name: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  icon: string;
  demotionProtection: boolean;
  promotionThreshold: number;
}

export interface Season {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  rewards: SeasonReward[];
}

export interface SeasonReward {
  rank: string;
  rewards: {
    currency: number;
    titles: string[];
    cosmetics: string[];
    frames: string[];
  };
}

export interface MatchResult {
  playerId: string;
  opponentId: string;
  result: 'win' | 'loss' | 'draw';
  pointsChange: number;
  timestamp: Date;
  character: string;
  opponentCharacter: string;
  matchDuration: number;
  roundsWon: number;
  roundsLost: number;
}

export class RankingSystem {
  private players: Map<string, PlayerRank> = new Map();
  private tiers: RankTier[] = [];
  private currentSeason: Season | null = null;
  private matchHistory: MatchResult[] = [];
  private isInitialized = false;

  constructor() {
    this.initializeTiers();
  }

  private initializeTiers(): void {
    this.tiers = [
      {
        name: 'Bronze',
        minPoints: 0,
        maxPoints: 999,
        color: '#CD7F32',
        icon: 'bronze_icon',
        demotionProtection: true,
        promotionThreshold: 1000
      },
      {
        name: 'Silver',
        minPoints: 1000,
        maxPoints: 1999,
        color: '#C0C0C0',
        icon: 'silver_icon',
        demotionProtection: true,
        promotionThreshold: 2000
      },
      {
        name: 'Gold',
        minPoints: 2000,
        maxPoints: 2999,
        color: '#FFD700',
        icon: 'gold_icon',
        demotionProtection: true,
        promotionThreshold: 3000
      },
      {
        name: 'Platinum',
        minPoints: 3000,
        maxPoints: 3999,
        color: '#E5E4E2',
        icon: 'platinum_icon',
        demotionProtection: false,
        promotionThreshold: 4000
      },
      {
        name: 'Diamond',
        minPoints: 4000,
        maxPoints: 4999,
        color: '#B9F2FF',
        icon: 'diamond_icon',
        demotionProtection: false,
        promotionThreshold: 5000
      },
      {
        name: 'Master',
        minPoints: 5000,
        maxPoints: 5999,
        color: '#8A2BE2',
        icon: 'master_icon',
        demotionProtection: false,
        promotionThreshold: 6000
      },
      {
        name: 'Grandmaster',
        minPoints: 6000,
        maxPoints: 6999,
        color: '#FF6B35',
        icon: 'grandmaster_icon',
        demotionProtection: false,
        promotionThreshold: 7000
      },
      {
        name: 'Champion',
        minPoints: 7000,
        maxPoints: 9999,
        color: '#FF0000',
        icon: 'champion_icon',
        demotionProtection: false,
        promotionThreshold: 10000
      }
    ];
  }

  public initialize(season: Season): void {
    this.currentSeason = season;
    this.isInitialized = true;
  }

  public registerPlayer(playerId: string): void {
    if (this.players.has(playerId)) return;

    const playerRank: PlayerRank = {
      playerId,
      rank: 'Bronze',
      tier: 0,
      points: 1000, // Start at Silver
      wins: 0,
      losses: 0,
      winRate: 0,
      streak: 0,
      maxStreak: 0,
      lastPlayed: new Date(),
      season: this.currentSeason?.id || 'default'
    };

    this.players.set(playerId, playerRank);
  }

  public processMatchResult(result: MatchResult): void {
    if (!this.isInitialized) return;

    const player = this.players.get(result.playerId);
    const opponent = this.players.get(result.opponentId);

    if (!player || !opponent) return;

    // Calculate points change based on ELO system
    const pointsChange = this.calculatePointsChange(player, opponent, result.result);
    
    // Update player stats
    if (result.result === 'win') {
      player.wins++;
      player.streak = player.streak > 0 ? player.streak + 1 : 1;
      player.maxStreak = Math.max(player.maxStreak, player.streak);
    } else if (result.result === 'loss') {
      player.losses++;
      player.streak = player.streak < 0 ? player.streak - 1 : -1;
    } else {
      // Draw - no streak change
    }

    // Update points
    player.points = Math.max(0, player.points + pointsChange);
    player.lastPlayed = result.timestamp;
    player.winRate = player.wins / (player.wins + player.losses);

    // Update rank
    this.updatePlayerRank(player);

    // Store match result
    this.matchHistory.push(result);

    // Update opponent stats (simplified)
    if (opponent) {
      if (result.result === 'win') {
        opponent.losses++;
        opponent.streak = opponent.streak < 0 ? opponent.streak - 1 : -1;
      } else if (result.result === 'loss') {
        opponent.wins++;
        opponent.streak = opponent.streak > 0 ? opponent.streak + 1 : 1;
        opponent.maxStreak = Math.max(opponent.maxStreak, opponent.streak);
      }
      opponent.winRate = opponent.wins / (opponent.wins + opponent.losses);
      this.updatePlayerRank(opponent);
    }
  }

  private calculatePointsChange(player: PlayerRank, opponent: PlayerRank, result: 'win' | 'loss' | 'draw'): number {
    const expectedScore = 1 / (1 + Math.pow(10, (opponent.points - player.points) / 400));
    const actualScore = result === 'win' ? 1 : result === 'loss' ? 0 : 0.5;
    const kFactor = this.getKFactor(player);
    
    return Math.round(kFactor * (actualScore - expectedScore));
  }

  private getKFactor(player: PlayerRank): number {
    // Higher K-factor for new players, lower for experienced ones
    const totalGames = player.wins + player.losses;
    
    if (totalGames < 30) return 40; // New player
    if (totalGames < 100) return 30; // Developing player
    if (player.points < 2000) return 25; // Lower ranks
    if (player.points < 4000) return 20; // Mid ranks
    return 15; // High ranks
  }

  private updatePlayerRank(player: PlayerRank): void {
    const newTier = this.getTierForPoints(player.points);
    const newRank = this.tiers[newTier].name;
    
    // Check for promotion
    if (newTier > player.tier) {
      player.rank = newRank;
      player.tier = newTier;
      // Trigger promotion event
      this.onPlayerPromoted(player);
    }
    // Check for demotion
    else if (newTier < player.tier) {
      const currentTier = this.tiers[player.tier];
      // Check demotion protection
      if (!currentTier.demotionProtection || player.points < currentTier.minPoints) {
        player.rank = newRank;
        player.tier = newTier;
        // Trigger demotion event
        this.onPlayerDemoted(player);
      }
    }
  }

  private getTierForPoints(points: number): number {
    for (let i = this.tiers.length - 1; i >= 0; i--) {
      if (points >= this.tiers[i].minPoints) {
        return i;
      }
    }
    return 0;
  }

  private onPlayerPromoted(player: PlayerRank): void {
    console.log(`Player ${player.playerId} promoted to ${player.rank}!`);
    // Trigger UI notification, sound effect, etc.
  }

  private onPlayerDemoted(player: PlayerRank): void {
    console.log(`Player ${player.playerId} demoted to ${player.rank}.`);
    // Trigger UI notification, sound effect, etc.
  }

  public getPlayerRank(playerId: string): PlayerRank | null {
    return this.players.get(playerId) || null;
  }

  public getLeaderboard(limit: number = 100): PlayerRank[] {
    return Array.from(this.players.values())
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
  }

  public getTierLeaderboard(tier: number, limit: number = 50): PlayerRank[] {
    return Array.from(this.players.values())
      .filter(player => player.tier === tier)
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
  }

  public getPlayerHistory(playerId: string, limit: number = 50): MatchResult[] {
    return this.matchHistory
      .filter(match => match.playerId === playerId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  public getTierInfo(tier: number): RankTier | null {
    return this.tiers[tier] || null;
  }

  public getAllTiers(): RankTier[] {
    return [...this.tiers];
  }

  public getCurrentSeason(): Season | null {
    return this.currentSeason;
  }

  public getPlayerStats(playerId: string): {
    rank: PlayerRank | null;
    history: MatchResult[];
    winRate: number;
    streak: number;
    maxStreak: number;
    totalGames: number;
    averageMatchDuration: number;
    favoriteCharacter: string;
    recentOpponents: string[];
  } {
    const player = this.players.get(playerId);
    const history = this.getPlayerHistory(playerId, 100);
    
    if (!player) {
      return {
        rank: null,
        history: [],
        winRate: 0,
        streak: 0,
        maxStreak: 0,
        totalGames: 0,
        averageMatchDuration: 0,
        favoriteCharacter: '',
        recentOpponents: []
      };
    }

    const totalGames = player.wins + player.losses;
    const averageMatchDuration = history.length > 0 
      ? history.reduce((sum, match) => sum + match.matchDuration, 0) / history.length 
      : 0;

    const characterUsage = new Map<string, number>();
    history.forEach(match => {
      const count = characterUsage.get(match.character) || 0;
      characterUsage.set(match.character, count + 1);
    });

    const favoriteCharacter = characterUsage.size > 0
      ? Array.from(characterUsage.entries()).sort((a, b) => b[1] - a[1])[0][0]
      : '';

    const recentOpponents = [...new Set(history.slice(0, 10).map(match => match.opponentId))];

    return {
      rank: player,
      history,
      winRate: player.winRate,
      streak: player.streak,
      maxStreak: player.maxStreak,
      totalGames,
      averageMatchDuration,
      favoriteCharacter,
      recentOpponents
    };
  }

  public resetSeason(): void {
    // Reset all player ranks to starting values
    for (const player of this.players.values()) {
      player.rank = 'Bronze';
      player.tier = 0;
      player.points = 1000;
      player.wins = 0;
      player.losses = 0;
      player.winRate = 0;
      player.streak = 0;
      player.maxStreak = 0;
      player.lastPlayed = new Date();
    }

    this.matchHistory = [];
  }

  public exportData(): string {
    return JSON.stringify({
      players: Array.from(this.players.entries()),
      matchHistory: this.matchHistory,
      currentSeason: this.currentSeason,
      tiers: this.tiers
    });
  }

  public importData(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      this.players = new Map(parsed.players);
      this.matchHistory = parsed.matchHistory;
      this.currentSeason = parsed.currentSeason;
      this.tiers = parsed.tiers;
      return true;
    } catch (error) {
      console.error('Failed to import ranking data:', error);
      return false;
    }
  }
}