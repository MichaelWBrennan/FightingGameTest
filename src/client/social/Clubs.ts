/**
 * Clubs - Social team formation and community features
 * 
 * Provides opt-in social features for player retention:
 * - Club creation and management
 * - Shared objectives and group trophies
 * - Mentor matchmaking within clubs
 * - Social progression tracking
 * 
 * Usage:
 * const clubs = new Clubs({
 *   retentionClient,
 *   apiEndpoint: 'https://api.yourgame.com',
 *   userId: 'u_123'
 * });
 * 
 * clubs.createClub({ name: 'Fighting Legends', description: '...' });
 * clubs.joinClub('c_456');
 * 
 * How to extend:
 * - Add new club objective types in ClubObjective interface
 * - Extend club roles by modifying ClubRole enum
 * - Add social features by extending ClubActivity interface
 * - Customize club discovery by overriding searchClubs()
 */

import { EventEmitter } from 'eventemitter3';
import type { RetentionClient } from '../retention/RetentionClient';

export interface ClubsConfig {
  retentionClient: RetentionClient;
  apiEndpoint: string;
  userId: string;
  enablePushNotifications?: boolean;
  maxClubsPerUser?: number;
  debugMode?: boolean;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  tag: string; // Short club identifier (3-4 chars)
  level: number;
  xp: number;
  memberCount: number;
  maxMembers: number;
  isPublic: boolean;
  requiresApproval: boolean;
  createdAt: number;
  region?: string;
  language?: string;
  settings: {
    allowInvites: boolean;
    requiresActivity: boolean;
    activityThresholdDays: number;
  };
  banner?: {
    color: string;
    icon: string;
  };
  currentObjectives: ClubObjective[];
  trophies: ClubTrophy[];
  stats: {
    totalMatches: number;
    totalWins: number;
    winRate: number;
    avgMemberLevel: number;
  };
}

export interface ClubMember {
  userId: string;
  username: string;
  role: ClubRole;
  joinedAt: number;
  lastActive: number;
  contributionXp: number;
  accountLevel: number;
  mainCharacter?: string;
  status: 'active' | 'inactive' | 'pending';
}

export interface ClubObjective {
  id: string;
  name: string;
  description: string;
  type: 'matches_played' | 'matches_won' | 'collective_xp' | 'mentor_hours' | 'tournament_participation';
  target: number;
  progress: number;
  startTime: number;
  endTime: number;
  rewards: Array<{
    type: 'club_xp' | 'cosmetic' | 'title';
    amount?: number;
    itemId?: string;
  }>;
  completed: boolean;
  completedAt?: number;
}

export interface ClubTrophy {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum';
  earnedAt: number;
  earnedBy: string[]; // User IDs who contributed
}

export interface ClubActivity {
  id: string;
  type: 'member_joined' | 'member_left' | 'objective_completed' | 'trophy_earned' | 'level_up' | 'promotion' | 'match_result';
  timestamp: number;
  userId?: string;
  username?: string;
  data: {
    [key: string]: any;
  };
  message: string;
}

export interface ClubInvite {
  id: string;
  clubId: string;
  clubName: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  message?: string;
  createdAt: number;
  expiresAt: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface ClubSearchFilter {
  region?: string;
  language?: string;
  memberCount?: { min: number; max: number };
  level?: { min: number; max: number };
  isRecruiting?: boolean;
  hasOpenSlots?: boolean;
  searchQuery?: string;
}

export type ClubRole = 'member' | 'officer' | 'leader';

export class Clubs extends EventEmitter {
  private config: ClubsConfig;
  private userClubs: Map<string, Club> = new Map();
  private clubMembers: Map<string, ClubMember[]> = new Map();
  private clubActivities: Map<string, ClubActivity[]> = new Map();
  private pendingInvites: ClubInvite[] = [];

  constructor(config: ClubsConfig) {
    super();
    this.config = {
      enablePushNotifications: false,
      maxClubsPerUser: 3,
      debugMode: false,
      ...config
    };
    
    this.setupPolling();
  }

  /**
   * Create a new club
   */
  public async createClub(clubData: {
    name: string;
    description: string;
    tag: string;
    isPublic?: boolean;
    requiresApproval?: boolean;
    region?: string;
    language?: string;
  }): Promise<Club> {
    try {
      if (this.userClubs.size >= this.config.maxClubsPerUser!) {
        throw new Error(`Maximum ${this.config.maxClubsPerUser} clubs per user`);
      }

      const response = await fetch(`${this.config.apiEndpoint}/clubs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          ...clubData,
          creatorId: this.config.userId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create club: ${response.statusText}`);
      }

      const club = await response.json();
      this.userClubs.set(club.id, club);

      // Track club creation (use public API event shape)
      this.config.retentionClient.trackClubEvent({
        clubId: club.id,
        action: 'created',
        clubRole: 'leader',
        clubSize: 1,
        clubLevel: 1
      });

      this.emit('club_created', club);
      return club;

    } catch (error) {
      this.log('Failed to create club:', error);
      throw error;
    }
  }

  /**
   * Join an existing club
   */
  public async joinClub(clubId: string, message?: string): Promise<void> {
    try {
      if (this.userClubs.size >= this.config.maxClubsPerUser!) {
        throw new Error(`Maximum ${this.config.maxClubsPerUser} clubs per user`);
      }

      const response = await fetch(`${this.config.apiEndpoint}/clubs/${clubId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          userId: this.config.userId,
          message
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to join club: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.requiresApproval) {
        this.emit('join_request_sent', { clubId, message });
      } else {
        const club = await this.getClub(clubId);
        if (club) {
          this.userClubs.set(clubId, club);
          
          // Track club join
          this.trackClubEvent(clubId, 'joined', {
            clubRole: 'member',
            clubSize: club.memberCount,
            clubLevel: club.level
          });

          this.emit('club_joined', club);
        }
      }

    } catch (error) {
      this.log('Failed to join club:', error);
      throw error;
    }
  }

  /**
   * Leave a club
   */
  public async leaveClub(clubId: string): Promise<void> {
    try {
      const club = this.userClubs.get(clubId);
      if (!club) {
        throw new Error('Not a member of this club');
      }

      const response = await fetch(`${this.config.apiEndpoint}/clubs/${clubId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          userId: this.config.userId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to leave club: ${response.statusText}`);
      }

      this.userClubs.delete(clubId);
      this.clubMembers.delete(clubId);

      // Track club leave
      this.trackClubEvent(clubId, 'left', {
        clubRole: 'member',
        clubSize: club.memberCount - 1,
        clubLevel: club.level
      });

      this.emit('club_left', { clubId });

    } catch (error) {
      this.log('Failed to leave club:', error);
      throw error;
    }
  }

  /**
   * Invite a user to join a club
   */
  public async inviteToClub(clubId: string, targetUserId: string, message?: string): Promise<void> {
    try {
      const club = this.userClubs.get(clubId);
      if (!club) {
        throw new Error('Not a member of this club');
      }

      const response = await fetch(`${this.config.apiEndpoint}/clubs/${clubId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          fromUserId: this.config.userId,
          toUserId: targetUserId,
          message
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send invite: ${response.statusText}`);
      }

      // Track club invite
      this.trackClubEvent(clubId, 'invited', {
        targetUserId,
        clubRole: this.getUserRole(clubId),
        clubSize: club.memberCount,
        clubLevel: club.level
      });

      this.emit('invite_sent', { clubId, targetUserId, message });

    } catch (error) {
      this.log('Failed to invite to club:', error);
      throw error;
    }
  }

  /**
   * Get user's clubs
   */
  public getUserClubs(): Club[] {
    return Array.from(this.userClubs.values());
  }

  /**
   * Get club members
   */
  public async getClubMembers(clubId: string): Promise<ClubMember[]> {
    if (this.clubMembers.has(clubId)) {
      return this.clubMembers.get(clubId)!;
    }

    try {
      const response = await fetch(`${this.config.apiEndpoint}/clubs/${clubId}/members`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get club members: ${response.statusText}`);
      }

      const members = await response.json();
      this.clubMembers.set(clubId, members);
      return members;

    } catch (error) {
      this.log('Failed to get club members:', error);
      return [];
    }
  }

  /**
   * Get club activities/feed
   */
  public async getClubActivities(clubId: string, limit: number = 50): Promise<ClubActivity[]> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/clubs/${clubId}/activities?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get club activities: ${response.statusText}`);
      }

      const activities = await response.json();
      this.clubActivities.set(clubId, activities);
      return activities;

    } catch (error) {
      this.log('Failed to get club activities:', error);
      return [];
    }
  }

  /**
   * Search for clubs
   */
  public async searchClubs(filter: ClubSearchFilter): Promise<Club[]> {
    try {
      const params = new URLSearchParams();
      
      if (filter.region) params.append('region', filter.region);
      if (filter.language) params.append('language', filter.language);
      if (filter.searchQuery) params.append('q', filter.searchQuery);
      if (filter.isRecruiting) params.append('recruiting', 'true');
      if (filter.hasOpenSlots) params.append('hasSlots', 'true');
      
      if (filter.memberCount) {
        params.append('minMembers', filter.memberCount.min.toString());
        params.append('maxMembers', filter.memberCount.max.toString());
      }
      
      if (filter.level) {
        params.append('minLevel', filter.level.min.toString());
        params.append('maxLevel', filter.level.max.toString());
      }

      const response = await fetch(`${this.config.apiEndpoint}/clubs/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to search clubs: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      this.log('Failed to search clubs:', error);
      return [];
    }
  }

  /**
   * Get pending invites for user
   */
  public async getPendingInvites(): Promise<ClubInvite[]> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/clubs/invites/${this.config.userId}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get pending invites: ${response.statusText}`);
      }

      this.pendingInvites = await response.json();
      return this.pendingInvites;

    } catch (error) {
      this.log('Failed to get pending invites:', error);
      return [];
    }
  }

  /**
   * Respond to club invite
   */
  public async respondToInvite(inviteId: string, accept: boolean): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/clubs/invites/${inviteId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          userId: this.config.userId,
          accept
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to respond to invite: ${response.statusText}`);
      }

      const invite = this.pendingInvites.find(i => i.id === inviteId);
      if (invite) {
        if (accept) {
          const club = await this.getClub(invite.clubId);
          if (club) {
            this.userClubs.set(invite.clubId, club);
            this.trackClubEvent(invite.clubId, 'joined', {
              clubRole: 'member',
              clubSize: club.memberCount,
              clubLevel: club.level
            });
            this.emit('club_joined', club);
          }
        }
        
        this.pendingInvites = this.pendingInvites.filter(i => i.id !== inviteId);
      }

    } catch (error) {
      this.log('Failed to respond to invite:', error);
      throw error;
    }
  }

  /**
   * Contribute to club objective
   */
  public async contributeToObjective(clubId: string, objectiveId: string, amount: number): Promise<void> {
    const club = this.userClubs.get(clubId);
    if (!club) return;

    const objective = club.currentObjectives.find(obj => obj.id === objectiveId);
    if (!objective || objective.completed) return;

    // Update local progress optimistically
    objective.progress = Math.min(objective.progress + amount, objective.target);
    
    if (objective.progress >= objective.target && !objective.completed) {
      objective.completed = true;
      objective.completedAt = Date.now();

      // Track objective completion
      this.trackClubEvent(clubId, 'objective_completed', {
        objectiveId,
        clubRole: this.getUserRole(clubId),
        clubSize: club.memberCount,
        clubLevel: club.level
      });

      this.emit('objective_completed', { clubId, objective });
    }

    this.emit('objective_progress', { clubId, objective, contribution: amount });
  }

  /**
   * Get specific club details
   */
  public async getClub(clubId: string): Promise<Club | null> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/clubs/${clubId}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();

    } catch (error) {
      this.log('Failed to get club:', error);
      return null;
    }
  }

  private trackClubEvent(clubId: string, action: 'created' | 'joined' | 'left' | 'invited' | 'objective_completed', additionalData: any = {}): void {
    this.config.retentionClient.trackClubEvent({
      clubId,
      action,
      ...additionalData
    });
  }

  private getUserRole(clubId: string): ClubRole {
    const members = this.clubMembers.get(clubId);
    const userMember = members?.find(m => m.userId === this.config.userId);
    return userMember?.role || 'member';
  }

  private setupPolling(): void {
    // Poll for club updates every 30 seconds
    setInterval(async () => {
      for (const clubId of this.userClubs.keys()) {
        try {
          const updatedClub = await this.getClub(clubId);
          if (updatedClub) {
            this.userClubs.set(clubId, updatedClub);
          }
        } catch (error) {
          // Fail silently for polling errors
        }
      }
    }, 30000);

    // Poll for pending invites every 60 seconds
    setInterval(async () => {
      try {
        await this.getPendingInvites();
      } catch (error) {
        // Fail silently for polling errors
      }
    }, 60000);
  }

  private getAuthToken(): string {
    // In production, this would retrieve the user's auth token
    return 'mock-auth-token';
  }

  private generateSessionHash(): string {
    // Generate a simple session hash for tracking
    return `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(message: string, ...args: any[]): void {
    if (this.config.debugMode) {
      console.log(`[Clubs] ${message}`, ...args);
    }
  }
}