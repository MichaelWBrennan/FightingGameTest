import type { pc } from 'playcanvas';
import { Logger } from '../utils/Logger';

export interface MatchmakingPlayer {
  id: string;
  name: string;
  character: string;
  rank: string;
  level: number;
  playstyle: 'aggressive' | 'defensive' | 'balanced' | 'rushdown' | 'zoning' | 'grappler';
  region: string;
  connectionQuality: number;
  preferences: PlayerPreferences;
  statistics: PlayerStatistics;
  availability: PlayerAvailability;
}

export interface PlayerPreferences {
  maxPing: number;
  preferredOpponents: string[];
  avoidList: string[];
  characterBalance: boolean;
  playstyleMatching: boolean;
  regionPriority: boolean;
  timeOfDay: {
    preferred: string[];
    avoided: string[];
  };
  skillRange: {
    min: number;
    max: number;
  };
}

export interface PlayerStatistics {
  winRate: number;
  averageCombo: number;
  reactionTime: number;
  inputAccuracy: number;
  characterExperience: number;
  recentPerformance: number;
  consistency: number;
  adaptation: number;
}

export interface PlayerAvailability {
  online: boolean;
  inMatch: boolean;
  inQueue: boolean;
  lastSeen: number;
  timezone: string;
  playTime: {
    start: number;
    end: number;
  };
}

export interface MatchmakingCriteria {
  skillBased: boolean;
  regionBased: boolean;
  connectionQuality: boolean;
  playstyleMatching: boolean;
  characterBalance: boolean;
  timeOfDay: boolean;
  preferredOpponents: boolean;
  avoidList: boolean;
  recentOpponents: boolean;
  pingLimit: number;
  skillRange: number;
  playstyleWeight: number;
  characterWeight: number;
  regionWeight: number;
  connectionWeight: number;
}

export interface MatchmakingResult {
  success: boolean;
  matchId?: string;
  players: MatchmakingPlayer[];
  estimatedWaitTime: number;
  matchQuality: number;
  reasons: string[];
  alternatives: MatchmakingAlternative[];
}

export interface MatchmakingAlternative {
  type: 'different_region' | 'different_skill' | 'different_playstyle' | 'different_time';
  description: string;
  estimatedWaitTime: number;
  matchQuality: number;
}

export interface MatchmakingQueue {
  id: string;
  name: string;
  type: 'ranked' | 'casual' | 'tournament' | 'custom';
  criteria: MatchmakingCriteria;
  players: MatchmakingPlayer[];
  maxPlayers: number;
  minPlayers: number;
  estimatedWaitTime: number;
  averageWaitTime: number;
  successRate: number;
}

export interface MatchmakingAlgorithm {
  name: string;
  description: string;
  parameters: {
    skillWeight: number;
    regionWeight: number;
    connectionWeight: number;
    playstyleWeight: number;
    characterWeight: number;
    timeWeight: number;
  };
  functions: {
    calculateScore: (player1: MatchmakingPlayer, player2: MatchmakingPlayer) => number;
    findBestMatch: (player: MatchmakingPlayer, candidates: MatchmakingPlayer[]) => MatchmakingPlayer | null;
    optimizeQueue: (queue: MatchmakingQueue) => MatchmakingQueue;
  };
}

export class AdvancedMatchmakingSystem {
  private app: pc.Application;
  private matchmakingQueues: Map<string, MatchmakingQueue> = new Map();
  private players: Map<string, MatchmakingPlayer> = new Map();
  private algorithms: Map<string, MatchmakingAlgorithm> = new Map();
  private currentAlgorithm: string = 'balanced';
  private matchmakingHistory: Map<string, any[]> = new Map();

  constructor(app: pc.Application) {
    this.app = app;
    this.initializeAdvancedMatchmakingSystem();
  }

  private initializeAdvancedMatchmakingSystem(): void {
    this.initializeMatchmakingQueues();
    this.initializeAlgorithms();
  }

  private initializeMatchmakingQueues(): void {
    // Ranked Queue
    this.addMatchmakingQueue({
      id: 'ranked_queue',
      name: 'Ranked Matchmaking',
      type: 'ranked',
      criteria: {
        skillBased: true,
        regionBased: true,
        connectionQuality: true,
        playstyleMatching: false,
        characterBalance: false,
        timeOfDay: false,
        preferredOpponents: true,
        avoidList: true,
        recentOpponents: true,
        pingLimit: 100,
        skillRange: 200,
        playstyleWeight: 0.1,
        characterWeight: 0.1,
        regionWeight: 0.3,
        connectionWeight: 0.5
      },
      players: [],
      maxPlayers: 2,
      minPlayers: 2,
      estimatedWaitTime: 30,
      averageWaitTime: 45,
      successRate: 0.85
    });

    // Casual Queue
    this.addMatchmakingQueue({
      id: 'casual_queue',
      name: 'Casual Matchmaking',
      type: 'casual',
      criteria: {
        skillBased: true,
        regionBased: true,
        connectionQuality: true,
        playstyleMatching: true,
        characterBalance: true,
        timeOfDay: true,
        preferredOpponents: false,
        avoidList: true,
        recentOpponents: false,
        pingLimit: 150,
        skillRange: 500,
        playstyleWeight: 0.3,
        characterWeight: 0.2,
        regionWeight: 0.2,
        connectionWeight: 0.3
      },
      players: [],
      maxPlayers: 2,
      minPlayers: 2,
      estimatedWaitTime: 15,
      averageWaitTime: 25,
      successRate: 0.95
    });

    // Tournament Queue
    this.addMatchmakingQueue({
      id: 'tournament_queue',
      name: 'Tournament Matchmaking',
      type: 'tournament',
      criteria: {
        skillBased: true,
        regionBased: false,
        connectionQuality: true,
        playstyleMatching: false,
        characterBalance: false,
        timeOfDay: false,
        preferredOpponents: false,
        avoidList: false,
        recentOpponents: false,
        pingLimit: 80,
        skillRange: 100,
        playstyleWeight: 0.0,
        characterWeight: 0.0,
        regionWeight: 0.0,
        connectionWeight: 0.8
      },
      players: [],
      maxPlayers: 2,
      minPlayers: 2,
      estimatedWaitTime: 60,
      averageWaitTime: 90,
      successRate: 0.70
    });
  }

  private initializeAlgorithms(): void {
    // Balanced Algorithm
    this.addMatchmakingAlgorithm({
      name: 'balanced',
      description: 'Balanced matchmaking considering all factors',
      parameters: {
        skillWeight: 0.4,
        regionWeight: 0.2,
        connectionWeight: 0.2,
        playstyleWeight: 0.1,
        characterWeight: 0.05,
        timeWeight: 0.05
      },
      functions: {
        calculateScore: this.calculateBalancedScore,
        findBestMatch: this.findBestBalancedMatch,
        optimizeQueue: this.optimizeBalancedQueue
      }
    });

    // Skill-Focused Algorithm
    this.addMatchmakingAlgorithm({
      name: 'skill_focused',
      description: 'Matchmaking focused on skill level matching',
      parameters: {
        skillWeight: 0.7,
        regionWeight: 0.1,
        connectionWeight: 0.1,
        playstyleWeight: 0.05,
        characterWeight: 0.03,
        timeWeight: 0.02
      },
      functions: {
        calculateScore: this.calculateSkillFocusedScore,
        findBestMatch: this.findBestSkillFocusedMatch,
        optimizeQueue: this.optimizeSkillFocusedQueue
      }
    });

    // Connection-Focused Algorithm
    this.addMatchmakingAlgorithm({
      name: 'connection_focused',
      description: 'Matchmaking focused on connection quality',
      parameters: {
        skillWeight: 0.2,
        regionWeight: 0.3,
        connectionWeight: 0.4,
        playstyleWeight: 0.05,
        characterWeight: 0.03,
        timeWeight: 0.02
      },
      functions: {
        calculateScore: this.calculateConnectionFocusedScore,
        findBestMatch: this.findBestConnectionFocusedMatch,
        optimizeQueue: this.optimizeConnectionFocusedQueue
      }
    });
  }

  public addMatchmakingQueue(queue: MatchmakingQueue): void {
    this.matchmakingQueues.set(queue.id, queue);
    this.app.fire('matchmaking:queue_added', { queue });
    Logger.info(`Added matchmaking queue: ${queue.name}`);
  }

  public addMatchmakingAlgorithm(algorithm: MatchmakingAlgorithm): void {
    this.algorithms.set(algorithm.name, algorithm);
    this.app.fire('matchmaking:algorithm_added', { algorithm });
    Logger.info(`Added matchmaking algorithm: ${algorithm.name}`);
  }

  public joinQueue(playerId: string, queueId: string): boolean {
    const player = this.players.get(playerId);
    const queue = this.matchmakingQueues.get(queueId);
    
    if (!player || !queue) {
      Logger.warn(`Player ${playerId} or queue ${queueId} not found`);
      return false;
    }

    if (player.availability.inQueue) {
      Logger.warn(`Player ${playerId} is already in a queue`);
      return false;
    }

    if (queue.players.length >= queue.maxPlayers) {
      Logger.warn(`Queue ${queueId} is full`);
      return false;
    }

    // Add player to queue
    queue.players.push(player);
    player.availability.inQueue = true;

    // Try to find a match
    this.tryFindMatch(queue);

    this.app.fire('matchmaking:player_joined_queue', { playerId, queueId });
    Logger.info(`Player ${playerId} joined queue ${queueId}`);
    return true;
  }

  public leaveQueue(playerId: string, queueId: string): boolean {
    const queue = this.matchmakingQueues.get(queueId);
    if (!queue) {
      Logger.warn(`Queue ${queueId} not found`);
      return false;
    }

    const playerIndex = queue.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      Logger.warn(`Player ${playerId} not found in queue ${queueId}`);
      return false;
    }

    // Remove player from queue
    queue.players.splice(playerIndex, 1);
    
    const player = this.players.get(playerId);
    if (player) {
      player.availability.inQueue = false;
    }

    this.app.fire('matchmaking:player_left_queue', { playerId, queueId });
    Logger.info(`Player ${playerId} left queue ${queueId}`);
    return true;
  }

  private tryFindMatch(queue: MatchmakingQueue): void {
    if (queue.players.length < queue.minPlayers) return;

    const algorithm = this.algorithms.get(this.currentAlgorithm);
    if (!algorithm) return;

    // Find best match using current algorithm
    const match = algorithm.functions.findBestMatch(queue.players[0], queue.players.slice(1));
    if (match) {
      this.createMatch(queue, [queue.players[0], match]);
    }
  }

  private createMatch(queue: MatchmakingQueue, players: MatchmakingPlayer[]): void {
    const matchId = `match_${Date.now()}`;
    
    // Remove players from queue
    for (const player of players) {
      const playerIndex = queue.players.findIndex(p => p.id === player.id);
      if (playerIndex !== -1) {
        queue.players.splice(playerIndex, 1);
      }
      player.availability.inQueue = false;
      player.availability.inMatch = true;
    }

    // Create match
    const match = {
      id: matchId,
      players,
      queue: queue.id,
      createdAt: Date.now(),
      status: 'starting'
    };

    this.app.fire('matchmaking:match_created', { match });
    Logger.info(`Created match ${matchId} with ${players.length} players`);
  }

  private calculateBalancedScore(player1: MatchmakingPlayer, player2: MatchmakingPlayer): number {
    const algorithm = this.algorithms.get('balanced');
    if (!algorithm) return 0;

    let score = 0;

    // Skill difference
    const skillDiff = Math.abs(player1.statistics.winRate - player2.statistics.winRate);
    score += (1 - skillDiff) * algorithm.parameters.skillWeight;

    // Region match
    const regionMatch = player1.region === player2.region ? 1 : 0;
    score += regionMatch * algorithm.parameters.regionWeight;

    // Connection quality
    const connectionScore = Math.min(player1.connectionQuality, player2.connectionQuality);
    score += connectionScore * algorithm.parameters.connectionWeight;

    // Playstyle match
    const playstyleMatch = player1.playstyle === player2.playstyle ? 1 : 0;
    score += playstyleMatch * algorithm.parameters.playstyleWeight;

    // Character balance
    const characterBalance = this.calculateCharacterBalance(player1.character, player2.character);
    score += characterBalance * algorithm.parameters.characterWeight;

    return score;
  }

  private calculateSkillFocusedScore(player1: MatchmakingPlayer, player2: MatchmakingPlayer): number {
    const algorithm = this.algorithms.get('skill_focused');
    if (!algorithm) return 0;

    let score = 0;

    // Skill difference (higher weight)
    const skillDiff = Math.abs(player1.statistics.winRate - player2.statistics.winRate);
    score += (1 - skillDiff) * algorithm.parameters.skillWeight;

    // Other factors with lower weights
    const regionMatch = player1.region === player2.region ? 1 : 0;
    score += regionMatch * algorithm.parameters.regionWeight;

    const connectionScore = Math.min(player1.connectionQuality, player2.connectionQuality);
    score += connectionScore * algorithm.parameters.connectionWeight;

    return score;
  }

  private calculateConnectionFocusedScore(player1: MatchmakingPlayer, player2: MatchmakingPlayer): number {
    const algorithm = this.algorithms.get('connection_focused');
    if (!algorithm) return 0;

    let score = 0;

    // Connection quality (higher weight)
    const connectionScore = Math.min(player1.connectionQuality, player2.connectionQuality);
    score += connectionScore * algorithm.parameters.connectionWeight;

    // Region match (higher weight)
    const regionMatch = player1.region === player2.region ? 1 : 0;
    score += regionMatch * algorithm.parameters.regionWeight;

    // Skill difference (lower weight)
    const skillDiff = Math.abs(player1.statistics.winRate - player2.statistics.winRate);
    score += (1 - skillDiff) * algorithm.parameters.skillWeight;

    return score;
  }

  private findBestBalancedMatch(player: MatchmakingPlayer, candidates: MatchmakingPlayer[]): MatchmakingPlayer | null {
    let bestMatch: MatchmakingPlayer | null = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      const score = this.calculateBalancedScore(player, candidate);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    return bestMatch;
  }

  private findBestSkillFocusedMatch(player: MatchmakingPlayer, candidates: MatchmakingPlayer[]): MatchmakingPlayer | null {
    let bestMatch: MatchmakingPlayer | null = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      const score = this.calculateSkillFocusedScore(player, candidate);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    return bestMatch;
  }

  private findBestConnectionFocusedMatch(player: MatchmakingPlayer, candidates: MatchmakingPlayer[]): MatchmakingPlayer | null {
    let bestMatch: MatchmakingPlayer | null = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      const score = this.calculateConnectionFocusedScore(player, candidate);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    return bestMatch;
  }

  private calculateCharacterBalance(character1: string, character2: string): number {
    // Simple character balance calculation
    // This would use actual character balance data
    const balanceData = {
      'ryu': { 'ken': 0.9, 'chun_li': 0.8, 'zangief': 0.7 },
      'ken': { 'ryu': 0.9, 'chun_li': 0.8, 'zangief': 0.7 },
      'chun_li': { 'ryu': 0.8, 'ken': 0.8, 'zangief': 0.6 },
      'zangief': { 'ryu': 0.7, 'ken': 0.7, 'chun_li': 0.6 }
    };

    return balanceData[character1]?.[character2] || 0.5;
  }

  private optimizeBalancedQueue(queue: MatchmakingQueue): MatchmakingQueue {
    // Optimize queue for balanced matchmaking
    return queue;
  }

  private optimizeSkillFocusedQueue(queue: MatchmakingQueue): MatchmakingQueue {
    // Optimize queue for skill-focused matchmaking
    return queue;
  }

  private optimizeConnectionFocusedQueue(queue: MatchmakingQueue): MatchmakingQueue {
    // Optimize queue for connection-focused matchmaking
    return queue;
  }

  public setMatchmakingAlgorithm(algorithmName: string): boolean {
    if (!this.algorithms.has(algorithmName)) {
      Logger.warn(`Matchmaking algorithm ${algorithmName} not found`);
      return false;
    }

    this.currentAlgorithm = algorithmName;
    this.app.fire('matchmaking:algorithm_changed', { algorithm: algorithmName });
    Logger.info(`Changed matchmaking algorithm to: ${algorithmName}`);
    return true;
  }

  public getMatchmakingQueues(): MatchmakingQueue[] {
    return Array.from(this.matchmakingQueues.values());
  }

  public getMatchmakingQueue(id: string): MatchmakingQueue | undefined {
    return this.matchmakingQueues.get(id);
  }

  public getMatchmakingAlgorithms(): MatchmakingAlgorithm[] {
    return Array.from(this.algorithms.values());
  }

  public getCurrentAlgorithm(): string {
    return this.currentAlgorithm;
  }

  public destroy(): void {
    this.matchmakingQueues.clear();
    this.players.clear();
    this.algorithms.clear();
    this.matchmakingHistory.clear();
  }
}