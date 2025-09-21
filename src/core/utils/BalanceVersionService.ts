export class BalanceVersionService {
  private current = 'dev';
  private history: string[] = [];
  setVersion(v: string): void { if (this.current !== v) { this.history.push(this.current); this.current = v; } }
  getVersion(): string { return this.current; }
  getHistory(): string[] { return this.history.slice(); }
}

