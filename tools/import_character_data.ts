#!/usr/bin/env ts-node
import * as fs from 'fs';
import * as path from 'path';

type MoveTiming = { startup: number; active: number; recovery: number };
type CharacterMoves = Record<string, MoveTiming>;

interface ImportResult {
  characterId: string;
  moves: CharacterMoves;
}

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

// NOTE: char_table.c is a large constant table of 32-bit values. Without symbol names, we apply
// a heuristic to extract contiguous triplets that look like (startup, active, recovery) in small ranges.
// This is a best-effort importer intended to seed data; you can refine mappings later.
function parseHeuristicMoveTriplets(source: string): MoveTiming[] {
  const hexOrDec = /0x[0-9A-Fa-f]+|\d+/g;
  const numbers: number[] = [];
  for (const m of source.matchAll(hexOrDec)) {
    const t = m[0];
    const v = t.startsWith('0x') ? parseInt(t, 16) : parseInt(t, 10);
    if (!Number.isFinite(v)) continue;
    numbers.push(v >>> 0);
  }

  // Collect plausible small timings: 1..120 (frames), ignore large words that are pointers or flags
  const smalls = numbers.filter(n => n > 0 && n <= 120);
  const triplets: MoveTiming[] = [];
  for (let i = 0; i + 2 < smalls.length; i += 3) {
    const a = smalls[i + 0];
    const b = smalls[i + 1];
    const c = smalls[i + 2];
    // Filter out non-sensical patterns
    if (a + b + c <= 0) continue;
    if (a > 60 || b > 60 || c > 90) continue;
    triplets.push({ startup: a, active: b, recovery: c });
  }
  return triplets;
}

function assignToMockMoveNames(triplets: MoveTiming[]): CharacterMoves {
  const names = [
    'light_punch','medium_punch','heavy_punch',
    'light_kick','medium_kick','heavy_kick',
    'special_1','special_2','special_3','super_1'
  ];
  const out: CharacterMoves = {};
  for (let i = 0; i < names.length && i < triplets.length; i++) {
    out[names[i]] = triplets[i];
  }
  return out;
}

function buildCharacterJson(characterId: string, moves: CharacterMoves) {
  return {
    characterId,
    name: characterId,
    displayName: characterId,
    archetype: 'technical',
    spritePath: `/assets/sprites/${characterId}.png`,
    health: 1000,
    walkSpeed: 150,
    dashSpeed: 300,
    jumpHeight: 380,
    complexity: 'medium',
    strengths: [],
    weaknesses: [],
    uniqueMechanics: [],
    moves,
    animations: Object.fromEntries(Object.keys(moves).map(k => [
      `move_${k}`, {
        frameCount: Math.max(1, moves[k].startup + moves[k].active + moves[k].recovery),
        duration: Math.max(83, (moves[k].startup + moves[k].active + moves[k].recovery) * 16.6),
        loop: false
      }
    ]))
  };
}

function main() {
  const repoRoot = process.cwd();
  const srcPath = path.join(repoRoot, 'sfiii-decomp', 'src', 'anniversary', 'bin2obj', 'char_table.c');
  if (!fs.existsSync(srcPath)) {
    console.log('[import_sf3_char_data] sfiii-decomp not found; skipping import.');
    return;
  }
  const outDir = path.join(repoRoot, 'data', 'characters_decomp');
  ensureDir(outDir);

  const text = readFile(srcPath);
  const triplets = parseHeuristicMoveTriplets(text);
  const moves = assignToMockMoveNames(triplets);

  // For now emit one synthesized character file from global table; later we could map per-character offsets.
  const characterId = 'fightforge_ground_truth_seed';
  const json = buildCharacterJson(characterId, moves);
  const outFile = path.join(outDir, `${characterId}.json`);
  fs.writeFileSync(outFile, JSON.stringify(json, null, 2));
  console.log(`Wrote ${outFile}`);
}

main();

