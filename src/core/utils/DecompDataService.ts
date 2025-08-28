import { CharacterData } from '../../../types/character';

export class DecompDataService {
  public async loadGroundTruthCharacter(): Promise<CharacterData | null> {
    try {
      const res = await fetch('/data/characters_decomp/sf3_ground_truth_seed.json');
      if (!res.ok) return null;
      const data = await res.json();
      return data as CharacterData;
    } catch {
      return null;
    }
  }

  // Browser-side fallback: if json not present, attempt to fetch raw decomp table and heuristically parse
  public async deriveFromDecompIfAvailable(): Promise<CharacterData | null> {
    try {
      const urlCandidates = [
        '/sfiii-decomp/src/anniversary/bin2obj/char_table.c',
        'https://raw.githubusercontent.com/apstygo/sfiii-decomp/main/src/anniversary/bin2obj/char_table.c'
      ];
      let text: string | null = null;
      for (const u of urlCandidates) {
        try {
          const r = await fetch(u, { cache: 'no-store' });
          if (r.ok) { text = await r.text(); break; }
        } catch {}
      }
      if (!text) return null;

      const triplets = this.parseHeuristicMoveTriplets(text);
      const moves = this.assignToMockMoveNames(triplets);
      const characterId = 'sf3_ground_truth_seed';
      const animations: any = {};
      for (const k of Object.keys(moves)) {
        const total = Math.max(1, moves[k].startup + moves[k].active + moves[k].recovery);
        animations[`move_${k}`] = { frameCount: total, duration: Math.max(83, total * 16.6), loop: false };
      }
      const json: CharacterData = {
        characterId,
        name: characterId,
        displayName: characterId,
        archetype: 'technical' as any,
        spritePath: `/assets/sprites/${characterId}.png`,
        health: 1000,
        walkSpeed: 150,
        dashSpeed: 300,
        jumpHeight: 380,
        complexity: 'medium',
        strengths: [],
        weaknesses: [],
        uniqueMechanics: [],
        moves: moves as any,
        animations
      } as any;
      return json;
    } catch {
      return null;
    }
  }

  private parseHeuristicMoveTriplets(source: string): Array<{ startup: number; active: number; recovery: number }> {
    const hexOrDec = /0x[0-9A-Fa-f]+|\d+/g;
    const numbers: number[] = [];
    for (const m of source.matchAll(hexOrDec)) {
      const t = m[0];
      const v = t.startsWith('0x') ? parseInt(t, 16) : parseInt(t, 10);
      if (!Number.isFinite(v)) continue;
      numbers.push(v >>> 0);
    }
    const smalls = numbers.filter(n => n > 0 && n <= 120);
    const triplets: Array<{ startup: number; active: number; recovery: number }> = [];
    for (let i = 0; i + 2 < smalls.length; i += 3) {
      const a = smalls[i + 0];
      const b = smalls[i + 1];
      const c = smalls[i + 2];
      if (a + b + c <= 0) continue;
      if (a > 60 || b > 60 || c > 90) continue;
      triplets.push({ startup: a, active: b, recovery: c });
    }
    return triplets;
  }

  private assignToMockMoveNames(triplets: Array<{ startup: number; active: number; recovery: number }>): Record<string, any> {
    const names = [
      'light_punch','medium_punch','heavy_punch',
      'light_kick','medium_kick','heavy_kick',
      'special_1','special_2','special_3','super_1'
    ];
    const out: Record<string, any> = {};
    for (let i = 0; i < names.length && i < triplets.length; i++) {
      out[names[i]] = triplets[i];
    }
    return out;
  }
}

