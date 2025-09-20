export type Region = 'NA' | 'EU' | 'AS' | 'SA' | 'OC' | 'AF';

export interface PlayerProfile { id: string; name: string; mmr: number; region: Region; friends: string[] }
export interface Lobby { id: string; hostId: string; name: string; region: Region; players: string[]; max: number }

export class MatchmakingService {
  private profile: PlayerProfile;
  private lobbies: Map<string, Lobby> = new Map();
  private listeners: Array<(e: any) => void> = [];

  constructor() {
    const id = (Math.random().toString(36).slice(2, 10));
    this.profile = { id, name: `Player_${id}`, mmr: 1000, region: 'NA', friends: [] };
  }

  on(cb: (e: any) => void): void { this.listeners.push(cb); }
  private emit(e: any): void { for (const cb of this.listeners) try { cb(e); } catch {} }

  getProfile(): PlayerProfile { return { ...this.profile, friends: [...this.profile.friends] }; }
  setRegion(r: Region): void { this.profile.region = r; this.emit({ t: 'profile', profile: this.getProfile() }); }
  setName(n: string): void { this.profile.name = n; this.emit({ t: 'profile', profile: this.getProfile() }); }

  // Simple local lobby store (stub)
  createLobby(name: string, max: number = 2): Lobby {
    const id = Math.random().toString(36).slice(2, 8);
    const lobby: Lobby = { id, hostId: this.profile.id, name, region: this.profile.region, players: [this.profile.id], max: Math.max(2, Math.min(8, max|0)) };
    this.lobbies.set(id, lobby);
    this.emit({ t: 'lobby:create', lobby });
    return lobby;
  }
  listLobbies(region?: Region): Lobby[] { return Array.from(this.lobbies.values()).filter(l => !region || l.region === region); }
  joinLobby(id: string): boolean {
    const l = this.lobbies.get(id); if (!l) return false; if (l.players.length >= l.max) return false;
    if (!l.players.includes(this.profile.id)) l.players.push(this.profile.id);
    this.emit({ t: 'lobby:join', lobby: l }); return true;
  }
  leaveLobby(id: string): void { const l = this.lobbies.get(id); if (!l) return; l.players = l.players.filter(p => p !== this.profile.id); this.emit({ t: 'lobby:leave', lobby: l }); }

  // Friends/follows (local stub)
  addFriend(pid: string): void { if (!this.profile.friends.includes(pid)) this.profile.friends.push(pid); this.emit({ t: 'friends', friends: [...this.profile.friends] }); }
  removeFriend(pid: string): void { this.profile.friends = this.profile.friends.filter(f => f !== pid); this.emit({ t: 'friends', friends: [...this.profile.friends] }); }

  // MMR updates (stub)
  reportMatch(won: boolean): void { const delta = won ? 15 : -10; this.profile.mmr = Math.max(0, this.profile.mmr + delta); this.emit({ t: 'mmr', mmr: this.profile.mmr }); }
}

