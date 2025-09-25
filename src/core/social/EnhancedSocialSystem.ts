import { pc } from 'playcanvas';
import { Logger } from '../utils/Logger';

export interface Guild {
  id: string;
  name: string;
  description: string;
  tag: string;
  level: number;
  experience: number;
  maxMembers: number;
  members: GuildMember[];
  leader: GuildMember;
  officers: GuildMember[];
  stats: {
    totalWins: number;
    totalLosses: number;
    winRate: number;
    totalExperience: number;
    totalMoney: number;
  };
  features: {
    chat: boolean;
    tournaments: boolean;
    training: boolean;
    spectating: boolean;
    customMatches: boolean;
  };
  permissions: {
    inviteMembers: 'leader' | 'officer' | 'member';
    kickMembers: 'leader' | 'officer';
    manageTournaments: 'leader' | 'officer';
    manageTraining: 'leader' | 'officer' | 'member';
  };
  treasury: {
    money: number;
    items: GuildItem[];
  };
  announcements: GuildAnnouncement[];
  events: GuildEvent[];
}

export interface GuildMember {
  id: string;
  name: string;
  rank: 'leader' | 'officer' | 'member';
  joinDate: number;
  lastActive: number;
  contribution: {
    experience: number;
    money: number;
    wins: number;
    losses: number;
  };
  permissions: string[];
  status: 'online' | 'offline' | 'away' | 'busy';
}

export interface GuildItem {
  id: string;
  name: string;
  description: string;
  type: 'equipment' | 'consumable' | 'cosmetic' | 'special';
  quantity: number;
  donatedBy: string;
  donatedDate: number;
}

export interface GuildAnnouncement {
  id: string;
  title: string;
  content: string;
  author: string;
  createdDate: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresDate?: number;
}

export interface GuildEvent {
  id: string;
  name: string;
  description: string;
  type: 'tournament' | 'training' | 'meeting' | 'social';
  startDate: number;
  endDate: number;
  maxParticipants: number;
  participants: string[];
  requirements: {
    level?: number;
    rank?: string;
    characterUnlocked?: string;
  };
  rewards: {
    experience?: number;
    money?: number;
    items?: string[];
  };
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  type: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  format: '1v1' | '2v2' | '3v3' | 'free_for_all';
  status: 'upcoming' | 'registration' | 'active' | 'completed' | 'cancelled';
  startDate: number;
  endDate: number;
  maxParticipants: number;
  participants: TournamentParticipant[];
  brackets: TournamentBracket[];
  rules: TournamentRules;
  rewards: TournamentRewards;
  organizer: {
    type: 'player' | 'guild' | 'system';
    id: string;
    name: string;
  };
  stream: {
    enabled: boolean;
    url?: string;
    viewers: number;
  };
}

export interface TournamentParticipant {
  id: string;
  name: string;
  character: string;
  guild?: string;
  seed: number;
  wins: number;
  losses: number;
  status: 'active' | 'eliminated' | 'disqualified';
  stats: {
    totalDamage: number;
    totalCombo: number;
    averageCombo: number;
    perfectVictories: number;
  };
}

export interface TournamentBracket {
  id: string;
  name: string;
  round: number;
  matches: TournamentMatch[];
  status: 'upcoming' | 'active' | 'completed';
}

export interface TournamentMatch {
  id: string;
  participants: string[];
  winner?: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
  replay?: string;
  stats: {
    totalDamage: number;
    totalCombo: number;
    averageCombo: number;
    perfectVictories: number;
  };
}

export interface TournamentRules {
  characterSelection: 'free' | 'locked' | 'random';
  stageSelection: 'free' | 'random' | 'voting';
  timeLimit: number;
  roundLimit: number;
  allowSpectators: boolean;
  allowReplays: boolean;
  allowPauses: boolean;
  maxPauseTime: number;
}

export interface TournamentRewards {
  first: {
    experience?: number;
    money?: number;
    items?: string[];
    title?: string;
  };
  second: {
    experience?: number;
    money?: number;
    items?: string[];
    title?: string;
  };
  third: {
    experience?: number;
    money?: number;
    items?: string[];
    title?: string;
  };
  participation: {
    experience?: number;
    money?: number;
    items?: string[];
  };
}

export interface SpectatorMode {
  id: string;
  matchId: string;
  spectators: Spectator[];
  maxSpectators: number;
  features: {
    chat: boolean;
    replay: boolean;
    slowMotion: boolean;
    cameraControl: boolean;
    statistics: boolean;
  };
  camera: {
    mode: 'auto' | 'manual' | 'follow_player1' | 'follow_player2';
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    zoom: number;
  };
  statistics: {
    realTime: boolean;
    history: boolean;
    predictions: boolean;
  };
}

export interface Spectator {
  id: string;
  name: string;
  joinTime: number;
  permissions: {
    chat: boolean;
    camera: boolean;
    statistics: boolean;
  };
  status: 'watching' | 'paused' | 'left';
}

export class EnhancedSocialSystem {
  private app: pc.Application;
  private guilds: Map<string, Guild> = new Map();
  private tournaments: Map<string, Tournament> = new Map();
  private spectatorModes: Map<string, SpectatorMode> = new Map();
  private playerGuilds: Map<string, string> = new Map();
  private playerTournaments: Map<string, string[]> = new Map();
  private playerSpectating: Map<string, string> = new Map();

  constructor(app: pc.Application) {
    this.app = app;
    this.initializeSocialSystem();
  }

  private initializeSocialSystem(): void {
    this.initializeGuilds();
    this.initializeTournaments();
    this.initializeSpectatorModes();
  }

  private initializeGuilds(): void {
    // Create some default guilds
    const defaultGuilds: Guild[] = [
      {
        id: 'warriors_guild',
        name: 'Warriors Guild',
        description: 'A guild for dedicated fighters',
        tag: 'WAR',
        level: 1,
        experience: 0,
        maxMembers: 50,
        members: [],
        leader: {
          id: 'guild_leader_1',
          name: 'Guild Leader',
          rank: 'leader',
          joinDate: Date.now(),
          lastActive: Date.now(),
          contribution: { experience: 0, money: 0, wins: 0, losses: 0 },
          permissions: ['all'],
          status: 'online'
        },
        officers: [],
        stats: { totalWins: 0, totalLosses: 0, winRate: 0, totalExperience: 0, totalMoney: 0 },
        features: {
          chat: true,
          tournaments: true,
          training: true,
          spectating: true,
          customMatches: true
        },
        permissions: {
          inviteMembers: 'officer',
          kickMembers: 'officer',
          manageTournaments: 'officer',
          manageTraining: 'member'
        },
        treasury: { money: 0, items: [] },
        announcements: [],
        events: []
      }
    ];

    for (const guild of defaultGuilds) {
      this.guilds.set(guild.id, guild);
    }
  }

  private initializeTournaments(): void {
    // Create some default tournaments
    const defaultTournaments: Tournament[] = [
      {
        id: 'weekly_tournament',
        name: 'Weekly Tournament',
        description: 'A weekly tournament for all players',
        type: 'single_elimination',
        format: '1v1',
        status: 'upcoming',
        startDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
        endDate: Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000, // 2 hours duration
        maxParticipants: 32,
        participants: [],
        brackets: [],
        rules: {
          characterSelection: 'free',
          stageSelection: 'random',
          timeLimit: 99,
          roundLimit: 3,
          allowSpectators: true,
          allowReplays: true,
          allowPauses: true,
          maxPauseTime: 60
        },
        rewards: {
          first: { experience: 1000, money: 5000, title: 'Weekly Champion' },
          second: { experience: 750, money: 3000, title: 'Weekly Runner-up' },
          third: { experience: 500, money: 2000, title: 'Weekly Third Place' },
          participation: { experience: 100, money: 500 }
        },
        organizer: {
          type: 'system',
          id: 'system',
          name: 'System'
        },
        stream: {
          enabled: true,
          viewers: 0
        }
      }
    ];

    for (const tournament of defaultTournaments) {
      this.tournaments.set(tournament.id, tournament);
    }
  }

  private initializeSpectatorModes(): void {
    // Initialize spectator mode system
  }

  // Guild Management
  public async createGuild(name: string, description: string, tag: string, creatorId: string): Promise<boolean> {
    try {
      const guildId = `guild_${Date.now()}`;
      const guild: Guild = {
        id: guildId,
        name,
        description,
        tag,
        level: 1,
        experience: 0,
        maxMembers: 20,
        members: [],
        leader: {
          id: creatorId,
          name: 'Creator', // This would get the actual player name
          rank: 'leader',
          joinDate: Date.now(),
          lastActive: Date.now(),
          contribution: { experience: 0, money: 0, wins: 0, losses: 0 },
          permissions: ['all'],
          status: 'online'
        },
        officers: [],
        stats: { totalWins: 0, totalLosses: 0, winRate: 0, totalExperience: 0, totalMoney: 0 },
        features: {
          chat: true,
          tournaments: true,
          training: true,
          spectating: true,
          customMatches: true
        },
        permissions: {
          inviteMembers: 'officer',
          kickMembers: 'officer',
          manageTournaments: 'officer',
          manageTraining: 'member'
        },
        treasury: { money: 0, items: [] },
        announcements: [],
        events: []
      };

      this.guilds.set(guildId, guild);
      this.playerGuilds.set(creatorId, guildId);

      this.app.fire('guild:created', { guild });
      Logger.info(`Created guild ${name} (${tag})`);
      return true;
    } catch (error) {
      Logger.error('Error creating guild:', error);
      return false;
    }
  }

  public async joinGuild(guildId: string, playerId: string): Promise<boolean> {
    const guild = this.guilds.get(guildId);
    if (!guild) {
      Logger.warn(`Guild ${guildId} not found`);
      return false;
    }

    if (guild.members.length >= guild.maxMembers) {
      Logger.warn(`Guild ${guildId} is full`);
      return false;
    }

    if (this.playerGuilds.has(playerId)) {
      Logger.warn(`Player ${playerId} is already in a guild`);
      return false;
    }

    const member: GuildMember = {
      id: playerId,
      name: 'Player', // This would get the actual player name
      rank: 'member',
      joinDate: Date.now(),
      lastActive: Date.now(),
      contribution: { experience: 0, money: 0, wins: 0, losses: 0 },
      permissions: ['chat', 'training'],
      status: 'online'
    };

    guild.members.push(member);
    this.playerGuilds.set(playerId, guildId);

    this.app.fire('guild:member_joined', { guildId, member });
    Logger.info(`Player ${playerId} joined guild ${guild.name}`);
    return true;
  }

  public async leaveGuild(playerId: string): Promise<boolean> {
    const guildId = this.playerGuilds.get(playerId);
    if (!guildId) {
      Logger.warn(`Player ${playerId} is not in a guild`);
      return false;
    }

    const guild = this.guilds.get(guildId);
    if (!guild) {
      Logger.warn(`Guild ${guildId} not found`);
      return false;
    }

    // Remove member from guild
    guild.members = guild.members.filter(member => member.id !== playerId);
    this.playerGuilds.delete(playerId);

    // If leader left, promote an officer or disband guild
    if (guild.leader.id === playerId) {
      if (guild.officers.length > 0) {
        const newLeader = guild.officers[0];
        guild.leader = newLeader;
        guild.officers = guild.officers.filter(officer => officer.id !== newLeader.id);
      } else {
        // Disband guild if no officers
        this.guilds.delete(guildId);
        this.app.fire('guild:disbanded', { guildId });
        Logger.info(`Guild ${guild.name} disbanded`);
        return true;
      }
    }

    this.app.fire('guild:member_left', { guildId, playerId });
    Logger.info(`Player ${playerId} left guild ${guild.name}`);
    return true;
  }

  public async promoteMember(guildId: string, memberId: string, promoterId: string): Promise<boolean> {
    const guild = this.guilds.get(guildId);
    if (!guild) {
      Logger.warn(`Guild ${guildId} not found`);
      return false;
    }

    const promoter = guild.members.find(m => m.id === promoterId);
    if (!promoter || (promoter.rank !== 'leader' && promoter.rank !== 'officer')) {
      Logger.warn(`Player ${promoterId} cannot promote members`);
      return false;
    }

    const member = guild.members.find(m => m.id === memberId);
    if (!member) {
      Logger.warn(`Member ${memberId} not found in guild`);
      return false;
    }

    if (member.rank === 'officer') {
      Logger.warn(`Member ${memberId} is already an officer`);
      return false;
    }

    member.rank = 'officer';
    guild.officers.push(member);

    this.app.fire('guild:member_promoted', { guildId, memberId, promoterId });
    Logger.info(`Member ${memberId} promoted to officer in guild ${guild.name}`);
    return true;
  }

  // Tournament Management
  public async createTournament(tournament: Omit<Tournament, 'id'>): Promise<string> {
    const tournamentId = `tournament_${Date.now()}`;
    const newTournament: Tournament = {
      ...tournament,
      id: tournamentId
    };

    this.tournaments.set(tournamentId, newTournament);

    this.app.fire('tournament:created', { tournament: newTournament });
    Logger.info(`Created tournament ${newTournament.name}`);
    return tournamentId;
  }

  public async joinTournament(tournamentId: string, playerId: string, character: string): Promise<boolean> {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      Logger.warn(`Tournament ${tournamentId} not found`);
      return false;
    }

    if (tournament.status !== 'registration') {
      Logger.warn(`Tournament ${tournamentId} is not accepting registrations`);
      return false;
    }

    if (tournament.participants.length >= tournament.maxParticipants) {
      Logger.warn(`Tournament ${tournamentId} is full`);
      return false;
    }

    if (tournament.participants.some(p => p.id === playerId)) {
      Logger.warn(`Player ${playerId} is already registered for tournament ${tournamentId}`);
      return false;
    }

    const participant: TournamentParticipant = {
      id: playerId,
      name: 'Player', // This would get the actual player name
      character,
      seed: tournament.participants.length + 1,
      wins: 0,
      losses: 0,
      status: 'active',
      stats: {
        totalDamage: 0,
        totalCombo: 0,
        averageCombo: 0,
        perfectVictories: 0
      }
    };

    tournament.participants.push(participant);
    this.playerTournaments.set(playerId, [
      ...(this.playerTournaments.get(playerId) || []),
      tournamentId
    ]);

    this.app.fire('tournament:participant_joined', { tournamentId, participant });
    Logger.info(`Player ${playerId} joined tournament ${tournament.name}`);
    return true;
  }

  public async startTournament(tournamentId: string): Promise<boolean> {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      Logger.warn(`Tournament ${tournamentId} not found`);
      return false;
    }

    if (tournament.status !== 'registration') {
      Logger.warn(`Tournament ${tournamentId} cannot be started`);
      return false;
    }

    if (tournament.participants.length < 2) {
      Logger.warn(`Tournament ${tournamentId} needs at least 2 participants`);
      return false;
    }

    tournament.status = 'active';
    tournament.brackets = this.generateBrackets(tournament);

    this.app.fire('tournament:started', { tournament });
    Logger.info(`Tournament ${tournament.name} started`);
    return true;
  }

  private generateBrackets(tournament: Tournament): TournamentBracket[] {
    const brackets: TournamentBracket[] = [];
    const participants = tournament.participants;
    const numRounds = Math.ceil(Math.log2(participants.length));

    for (let round = 0; round < numRounds; round++) {
      const bracket: TournamentBracket = {
        id: `bracket_${round}`,
        name: `Round ${round + 1}`,
        round: round + 1,
        matches: [],
        status: 'upcoming'
      };

      const matchesPerRound = Math.ceil(participants.length / Math.pow(2, round + 1));
      for (let match = 0; match < matchesPerRound; match++) {
        const tournamentMatch: TournamentMatch = {
          id: `match_${round}_${match}`,
          participants: [],
          stats: {
            totalDamage: 0,
            totalCombo: 0,
            averageCombo: 0,
            perfectVictories: 0
          }
        };

        bracket.matches.push(tournamentMatch);
      }

      brackets.push(bracket);
    }

    return brackets;
  }

  // Spectator Mode
  public async startSpectating(matchId: string, spectatorId: string): Promise<boolean> {
    let spectatorMode = this.spectatorModes.get(matchId);
    if (!spectatorMode) {
      spectatorMode = {
        id: matchId,
        matchId,
        spectators: [],
        maxSpectators: 100,
        features: {
          chat: true,
          replay: true,
          slowMotion: true,
          cameraControl: true,
          statistics: true
        },
        camera: {
          mode: 'auto',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          zoom: 1
        },
        statistics: {
          realTime: true,
          history: true,
          predictions: true
        }
      };
      this.spectatorModes.set(matchId, spectatorMode);
    }

    if (spectatorMode.spectators.length >= spectatorMode.maxSpectators) {
      Logger.warn(`Spectator mode for match ${matchId} is full`);
      return false;
    }

    const spectator: Spectator = {
      id: spectatorId,
      name: 'Spectator', // This would get the actual player name
      joinTime: Date.now(),
      permissions: {
        chat: true,
        camera: false,
        statistics: true
      },
      status: 'watching'
    };

    spectatorMode.spectators.push(spectator);
    this.playerSpectating.set(spectatorId, matchId);

    this.app.fire('spectator:joined', { matchId, spectator });
    Logger.info(`Player ${spectatorId} started spectating match ${matchId}`);
    return true;
  }

  public async stopSpectating(spectatorId: string): Promise<boolean> {
    const matchId = this.playerSpectating.get(spectatorId);
    if (!matchId) {
      Logger.warn(`Player ${spectatorId} is not spectating`);
      return false;
    }

    const spectatorMode = this.spectatorModes.get(matchId);
    if (!spectatorMode) {
      Logger.warn(`Spectator mode for match ${matchId} not found`);
      return false;
    }

    spectatorMode.spectators = spectatorMode.spectators.filter(s => s.id !== spectatorId);
    this.playerSpectating.delete(spectatorId);

    this.app.fire('spectator:left', { matchId, spectatorId });
    Logger.info(`Player ${spectatorId} stopped spectating match ${matchId}`);
    return true;
  }

  // Getters
  public getGuilds(): Guild[] {
    return Array.from(this.guilds.values());
  }

  public getGuild(guildId: string): Guild | undefined {
    return this.guilds.get(guildId);
  }

  public getPlayerGuild(playerId: string): Guild | undefined {
    const guildId = this.playerGuilds.get(playerId);
    if (!guildId) return undefined;
    return this.guilds.get(guildId);
  }

  public getTournaments(): Tournament[] {
    return Array.from(this.tournaments.values());
  }

  public getTournament(tournamentId: string): Tournament | undefined {
    return this.tournaments.get(tournamentId);
  }

  public getPlayerTournaments(playerId: string): Tournament[] {
    const tournamentIds = this.playerTournaments.get(playerId) || [];
    return tournamentIds.map(id => this.tournaments.get(id)).filter(Boolean) as Tournament[];
  }

  public getSpectatorMode(matchId: string): SpectatorMode | undefined {
    return this.spectatorModes.get(matchId);
  }

  public getPlayerSpectating(playerId: string): string | undefined {
    return this.playerSpectating.get(playerId);
  }

  public destroy(): void {
    this.guilds.clear();
    this.tournaments.clear();
    this.spectatorModes.clear();
    this.playerGuilds.clear();
    this.playerTournaments.clear();
    this.playerSpectating.clear();
  }
}