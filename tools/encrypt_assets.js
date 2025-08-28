#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function listFiles(dir) {
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d)) {
      const p = path.join(d, e);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p); else out.push(p);
    }
  })(dir);
  return out;
}

function deriveKey() {
  const k = process.env.ASSET_KEY || 'dev-asset-key-change-me';
  return crypto.createHash('sha256').update(k).digest();
}

function encryptAesGcm(key, data) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
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

