#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function parseHeuristicMoveTriplets(source) {
  const hexOrDec = /0x[0-9A-Fa-f]+|\d+/g;
  const numbers = [];
  for (const m of source.matchAll(hexOrDec)) {
    const t = m[0];
    const v = t.startsWith('0x') ? parseInt(t, 16) : parseInt(t, 10);
    if (!Number.isFinite(v)) continue;
    numbers.push(v >>> 0);
  }
  const smalls = numbers.filter(n => n > 0 && n <= 120);
  const triplets = [];
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

function assignToMockMoveNames(triplets) {
  const names = [
    'light_punch','medium_punch','heavy_punch',
    'light_kick','medium_kick','heavy_kick',
    'special_1','special_2','special_3','super_1'
  ];
  const out = {};
  for (let i = 0; i < names.length && i < triplets.length; i++) {
    out[names[i]] = triplets[i];
  }
  return out;
}

function buildCharacterJson(characterId, moves) {
  const animations = {};
  for (const k of Object.keys(moves)) {
    const total = Math.max(1, moves[k].startup + moves[k].active + moves[k].recovery);
    animations[`move_${k}`] = { frameCount: total, duration: Math.max(83, total * 16.6), loop: false };
  }
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
    animations
  };
}

function main() {
  const repoRoot = process.cwd();
  const srcPath = path.join(repoRoot, 'sfiii-decomp', 'src', 'anniversary', 'bin2obj', 'char_table.c');
  if (!fs.existsSync(srcPath)) {
    // No-op if the decomp repo is not present.
    console.log('[import_sf3_char_data] sfiii-decomp not found; skipping import.');
    return;
  }
  const outDir = path.join(repoRoot, 'data', 'characters_decomp');
  ensureDir(outDir);

  const text = readFile(srcPath);
  const triplets = parseHeuristicMoveTriplets(text);
  const moves = assignToMockMoveNames(triplets);

  const characterId = 'sf3_ground_truth_seed';
  const json = buildCharacterJson(characterId, moves);
  const outFile = path.join(outDir, `${characterId}.json`);
  fs.writeFileSync(outFile, JSON.stringify(json, null, 2));
  console.log(`Wrote ${outFile}`);
}

main();

