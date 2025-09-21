export type MoveSpec = { name: string; startup?: number; active?: number; recovery?: number; onHit?: number; onBlock?: number; cancel?: string[] };

export class MoveValidator {
  validate(moves: MoveSpec[]): { ok: boolean; errors: string[] } {
    const errors: string[] = [];
    for (const m of moves) {
      if (!m.name || typeof m.name !== 'string') errors.push(`Move missing name`);
      const s = m.startup ?? 0, a = m.active ?? 0, r = m.recovery ?? 0;
      if (s < 0 || a < 0 || r < 0) errors.push(`${m.name}: negative frame counts`);
      if (s + a + r <= 0) errors.push(`${m.name}: zero total frames`);
      if (m.cancel && !Array.isArray(m.cancel)) errors.push(`${m.name}: cancel must be array`);
    }
    return { ok: errors.length === 0, errors };
  }
}

