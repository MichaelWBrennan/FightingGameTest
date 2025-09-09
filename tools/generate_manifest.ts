#!/usr/bin/env ts-node
// @ts-nocheck
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

interface ManifestEntry { path: string; type: 'json' | 'image' | 'audio' | 'other'; sha256?: string; size?: number; }

function guessType(p: string): ManifestEntry['type'] {
	const ext = p.split('.').pop()?.toLowerCase();
	switch (ext) {
		case 'json': return 'json';
		case 'png': case 'jpg': case 'jpeg': case 'webp': return 'image';
		case 'ogg': case 'mp3': case 'wav': return 'audio';
		default: return 'other';
	}
}

function hashFile(filePath: string): string | undefined {
	try {
		const buf = fs.readFileSync(filePath);
		return createHash('sha256').update(buf).digest('hex');
	} catch {
		return undefined;
	}
}

function walk(dir: string, baseOut: string, out: ManifestEntry[]): void {
	for (const entry of fs.readdirSync(dir)) {
		const p = path.join(dir, entry);
		const stat = fs.statSync(p);
		if (stat.isDirectory()) walk(p, baseOut, out);
		else {
			const rel = path.relative(baseOut, p).replace(/\\/g, '/');
			out.push({ path: `/data/${rel}`, type: guessType(rel), sha256: hashFile(p), size: stat.size });
		}
	}
}

function main() {
	const dataDir = path.join(process.cwd(), 'data');
	const publicAssetsDir = path.join(process.cwd(), 'public', 'assets');
	const outFile = path.join(publicAssetsDir, 'manifest.json');
	const entries: ManifestEntry[] = [];
	if (fs.existsSync(dataDir)) walk(dataDir, dataDir, entries);

	// Also include assets/data files that are shipped but referenced at runtime
	const assetsDataDir = path.join(process.cwd(), 'assets', 'data');
	if (fs.existsSync(assetsDataDir)) {
		// Copy rotation.config.json into public/data and list it (service expects /data path)
		const rotationCfg = path.join(assetsDataDir, 'rotation.config.json');
		if (fs.existsSync(rotationCfg)) {
			const publicDataDir = path.join(process.cwd(), 'public', 'data');
			fs.mkdirSync(publicDataDir, { recursive: true });
			const dest = path.join(publicDataDir, 'rotation.config.json');
			fs.copyFileSync(rotationCfg, dest);
			entries.push({ path: '/data/rotation.config.json', type: 'json', sha256: hashFile(dest) });
		}

		// Recursively copy all of assets/data into public/assets/data and include in manifest under /assets/data
		const publicAssetsDataDir = path.join(process.cwd(), 'public', 'assets', 'data');
		fs.mkdirSync(publicAssetsDataDir, { recursive: true });
		const stack: string[] = [assetsDataDir];
		while (stack.length) {
			const dir = stack.pop()!;
			for (const entry of fs.readdirSync(dir)) {
				const p = path.join(dir, entry);
				const st = fs.statSync(p);
				if (st.isDirectory()) {
					stack.push(p);
				} else {
					const rel = path.relative(assetsDataDir, p).replace(/\\/g, '/');
					const dest = path.join(publicAssetsDataDir, rel);
					fs.mkdirSync(path.dirname(dest), { recursive: true });
					fs.copyFileSync(p, dest);
					const sz = fs.statSync(dest).size;
					entries.push({ path: `/assets/data/${rel}`, type: guessType(rel), sha256: hashFile(dest), size: sz });
				}
			}
		}
	}
	// Ensure store catalog listed if present
	const catalogPath = path.join(dataDir, 'store', 'catalog.json');
	if (fs.existsSync(catalogPath) && !entries.find(e => e.path.endsWith('/store/catalog.json'))) {
		const catStat = fs.statSync(catalogPath);
		entries.push({ path: '/data/store/catalog.json', type: 'json', sha256: hashFile(catalogPath), size: catStat.size });
	}
	fs.mkdirSync(publicAssetsDir, { recursive: true });
	fs.writeFileSync(outFile, JSON.stringify({ assets: entries }, null, 2));
	console.log(`Wrote manifest: ${outFile} with ${entries.length} assets`);
}

main();