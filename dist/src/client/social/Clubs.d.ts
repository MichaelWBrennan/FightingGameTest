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
import { RetentionClient } from '../retention/RetentionClient';
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
    tag: string;
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
    earnedBy: string[];
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
    memberCount?: {
        min: number;
        max: number;
    };
    level?: {
        min: number;
        max: number;
    };
    isRecruiting?: boolean;
    hasOpenSlots?: boolean;
    searchQuery?: string;
}
export type ClubRole = 'member' | 'officer' | 'leader';
export declare class Clubs extends EventEmitter {
    private config;
    private userClubs;
    private clubMembers;
    private clubActivities;
    private pendingInvites;
    constructor(config: ClubsConfig);
    /**
     * Create a new club
     */
    createClub(clubData: {
        name: string;
        description: string;
        tag: string;
        isPublic?: boolean;
        requiresApproval?: boolean;
        region?: string;
        language?: string;
    }): Promise<Club>;
    /**
     * Join an existing club
     */
    joinClub(clubId: string, message?: string): Promise<void>;
    /**
     * Leave a club
     */
    leaveClub(clubId: string): Promise<void>;
    /**
     * Invite a user to join a club
     */
    inviteToClub(clubId: string, targetUserId: string, message?: string): Promise<void>;
    /**
     * Get user's clubs
     */
    getUserClubs(): Club[];
    /**
     * Get club members
     */
    getClubMembers(clubId: string): Promise<ClubMember[]>;
    /**
     * Get club activities/feed
     */
    getClubActivities(clubId: string, limit?: number): Promise<ClubActivity[]>;
    /**
     * Search for clubs
     */
    searchClubs(filter: ClubSearchFilter): Promise<Club[]>;
    /**
     * Get pending invites for user
     */
    getPendingInvites(): Promise<ClubInvite[]>;
    /**
     * Respond to club invite
     */
    respondToInvite(inviteId: string, accept: boolean): Promise<void>;
    /**
     * Contribute to club objective
     */
    contributeToObjective(clubId: string, objectiveId: string, amount: number): Promise<void>;
    /**
     * Get specific club details
     */
    getClub(clubId: string): Promise<Club | null>;
    private trackClubEvent;
    private getUserRole;
    private setupPolling;
    private getAuthToken;
    private generateSessionHash;
    private log;
}
//# sourceMappingURL=Clubs.d.ts.map