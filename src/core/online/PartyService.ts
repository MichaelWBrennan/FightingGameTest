export class PartyService {
  private bc = new BroadcastChannel('fg-party');
  private listeners: Array<(e: any) => void> = [];
  private members: Set<string> = new Set();
  private id: string;
  constructor() {
    this.id = Math.random().toString(36).slice(2, 8);
    this.members.add(this.id);
    this.bc.onmessage = (e) => this.listeners.forEach(cb => { try { cb(e.data); } catch {} });
  }
  getId(): string { return this.id; }
  on(cb: (e: any) => void): void { this.listeners.push(cb); }
  invite(code: string): void { try { this.bc.postMessage({ t: 'party_invite', from: this.id, to: code }); } catch {} }
  join(code: string): void { try { this.members.add(code); this.bc.postMessage({ t: 'party_join', id: this.id, code }); } catch {} }
  getMembers(): string[] { return Array.from(this.members.values()); }
}

