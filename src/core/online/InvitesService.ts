export class InvitesService {
  private bc = new BroadcastChannel('fg-invites');
  private listeners: Array<(m: any) => void> = [];
  constructor() { this.bc.onmessage = (e) => this.listeners.forEach(cb => { try { cb(e.data); } catch {} }); }
  on(cb: (m: any) => void): void { this.listeners.push(cb); }
  sendInvite(toId: string, fromId: string, lobbyId: string): void { this.bc.postMessage({ t: 'invite', to: toId, from: fromId, lobby: lobbyId }); }
}

