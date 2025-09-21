export class RoundManager {
  private wins: Record<string, number> = {};
  private bestOf: number;
  private onSetWin?: (winnerId: string) => void;

  constructor(bestOf: number = 3) { this.bestOf = Math.max(1, bestOf|0); }

  setOnSetWin(cb: (winnerId: string) => void): void { this.onSetWin = cb; }
  setBestOf(n: number): void { this.bestOf = Math.max(1, n|0); }

  onVictory(winnerId: string): { setWon: boolean; roundWins: number } {
    this.wins[winnerId] = (this.wins[winnerId] || 0) + 1;
    const need = Math.floor(this.bestOf / 2) + 1;
    const setWon = this.wins[winnerId] >= need;
    if (setWon) {
      try { this.onSetWin?.(winnerId); } catch {}
      // Reset for next set
      this.wins = {};
    }
    return { setWon, roundWins: this.wins[winnerId] || 0 };
  }

  getWinsFor(playerId: string): number { return this.wins[playerId] || 0; }
  resetRounds(): void { this.wins = {}; }
}

