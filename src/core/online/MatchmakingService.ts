export type Region = 'NA' | 'EU' | 'AS' | 'SA' | 'OC' | 'AF';

export interface PlayerProfile { id: string; name: string; mmr: number; region: Region; friends: string[] }
export interface Lobby { id: string; hostId: string; name: string; region: Region; players: string[]; max: number }

export class MatchmakingService {
  private profile: PlayerProfile;
  private lobbies: Map<string, Lobby> = new Map();
  private listeners: Array<(e: any) => void> = [];
  // Bayesian (Beta) rating: alpha/beta represent wins/losses with priors
  private ratingAlpha = 1;
  private ratingBeta = 1;

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

  // Bayesian updates (Beta): alpha/beta accumulate outcomes; opponent can weight via reliability
  reportMatchBayes(won: boolean, opponentReliability: number = 1): void {
    const w = Math.max(0.25, Math.min(2.0, opponentReliability));
    if (won) this.ratingAlpha += w; else this.ratingBeta += w;
    this.updateMmrFromBayes();
  }
  reportMatchVs(opponentMmr: number, won: boolean, opponentReliability: number = 1): void {
    // Map opponent mmr to a reliability heuristic (closer to our mmr => higher info)
    const my = this.profile.mmr || 1000;
    const gap = Math.abs(opponentMmr - my);
    const rel = Math.max(0.25, Math.min(2.0, 1.5 - Math.min(1.0, gap / 600)));
    this.reportMatchBayes(won, (opponentReliability || 1) * rel);
  }
  private updateMmrFromBayes(): void {
    const a = Math.max(1e-6, this.ratingAlpha);
    const b = Math.max(1e-6, this.ratingBeta);
    const mean = a / (a + b); // expected win probability
    this.profile.mmr = Math.round(1000 * mean);
    this.emit({ t: 'mmr', mmr: this.profile.mmr, bayes: { alpha: a, beta: b } });
  }
}

