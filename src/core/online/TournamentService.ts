export class TournamentService {
  createBracket(players: string[]): Array<{ a: string; b: string }> {
    const arr = players.slice();
    while (arr.length % 2 !== 0) arr.push('BYE');
    const pairs: Array<{ a: string; b: string }> = [];
    for (let i = 0; i < arr.length; i += 2) pairs.push({ a: arr[i], b: arr[i+1] });
    return pairs;
  }
}

