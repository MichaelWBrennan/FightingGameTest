#!/usr/bin/env ts-node
import * as fs from 'fs';
import * as path from 'path';

interface ManifestEntry { path: string; type: 'json' | 'image' | 'audio' | 'other'; }

function guessType(p: string): ManifestEntry['type'] {
	const ext = p.split('.').pop()?.toLowerCase();
	switch (ext) {
		case 'json': return 'json';
		case 'png': case 'jpg': case 'jpeg': case 'webp': return 'image';
		case 'ogg': case 'mp3': case 'wav': return 'audio';
		default: return 'other';
	}
}

function walk(dir: string, baseOut: string, out: ManifestEntry[]): void {
	for (const entry of fs.readdirSync(dir)) {
		const p = path.join(dir, entry);
		const stat = fs.statSync(p);
		if (stat.isDirectory()) walk(p, baseOut, out);
		else {
			const rel = path.relative(baseOut, p).replace(/\\/g, '/');
			out.push({ path: `/data/${rel}`, type: guessType(rel) });
		}
	}
}

function main() {
	const dataDir = path.join(process.cwd(), 'data');
	const publicAssetsDir = path.join(process.cwd(), 'public', 'assets');
	const outFile = path.join(publicAssetsDir, 'manifest.json');
	const entries: ManifestEntry[] = [];
	if (fs.existsSync(dataDir)) walk(dataDir, dataDir, entries);
	fs.mkdirSync(publicAssetsDir, { recursive: true });
	fs.writeFileSync(outFile, JSON.stringify({ assets: entries }, null, 2));
	console.log(`Wrote manifest: ${outFile} with ${entries.length} assets`);
}

main();