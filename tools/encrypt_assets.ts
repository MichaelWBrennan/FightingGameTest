#!/usr/bin/env ts-node
import * as fs from 'fs';
import * as path from 'path';
import { createHash, randomBytes, createCipheriv } from 'crypto';

function ensureDir(dir: string) { fs.mkdirSync(dir, { recursive: true }); }
function listFiles(dir: string): string[] {
  const out: string[] = [];
  (function walk(d: string) {
    for (const e of fs.readdirSync(d)) {
      const p = path.join(d, e);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p); else out.push(p);
    }
  })(dir);
  return out;
}

function deriveKey(): Buffer {
  const k = process.env.ASSET_KEY || 'dev-asset-key-change-me';
  return createHash('sha256').update(k).digest();
}

function encryptAesGcm(key: Buffer, data: Buffer): { iv: Buffer; enc: Buffer; tag: Buffer } {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv, enc, tag };
}

function main() {
  const srcDir = path.join(process.cwd(), 'data');
  const outRoot = path.join(process.cwd(), 'public', 'data');
  ensureDir(outRoot);
  const key = deriveKey();
  if (!fs.existsSync(srcDir)) return;
  const files = listFiles(srcDir);
  for (const f of files) {
    const rel = path.relative(srcDir, f).replace(/\\/g, '/');
    const outPath = path.join(outRoot, rel);
    ensureDir(path.dirname(outPath));
    const data = fs.readFileSync(f);
    const { iv, enc, tag } = encryptAesGcm(key, data);
    const payload = `ENC1|${iv.toString('base64')}|${tag.toString('base64')}|${enc.toString('base64')}`;
    fs.writeFileSync(outPath, payload);
  }
  console.log(`Encrypted ${files.length} assets to ${outRoot}`);
}

main();

