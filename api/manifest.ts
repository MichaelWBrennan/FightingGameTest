// @ts-nocheck
import * as fs from 'fs';
import * as path from 'path';

export default function handler(_req: any, res: any) {
	try {
		const entries: Array<{ path: string; type: string }> = [];
		const cwd = process.cwd();
		// Prefer deployed static directories under public/ when running on Vercel
		const dataDir = fs.existsSync(path.join(cwd, 'public', 'data'))
			? path.join(cwd, 'public', 'data')
			: path.join(cwd, 'data');
		const assetsDataDir = fs.existsSync(path.join(cwd, 'public', 'assets', 'data'))
			? path.join(cwd, 'public', 'assets', 'data')
			: path.join(cwd, 'assets', 'data');
		const assetsUiDir = fs.existsSync(path.join(cwd, 'public', 'assets', 'fighting_ui'))
			? path.join(cwd, 'public', 'assets', 'fighting_ui')
			: path.join(cwd, 'assets', 'fighting_ui');
		const guessType = (p: string) => {
			const ext = p.split('.').pop()?.toLowerCase();
			if (ext === 'json') return 'json';
			if (ext && ['png','jpg','jpeg','webp'].includes(ext)) return 'image';
			if (ext && ['ogg','mp3','wav'].includes(ext)) return 'audio';
			return 'other';
		};
		const walk = (dir: string, baseOut: string, baseUrl: string) => {
			if (!fs.existsSync(dir)) return;
			for (const entry of fs.readdirSync(dir)) {
				const p = path.join(dir, entry);
				const st = fs.statSync(p);
				if (st.isDirectory()) walk(p, baseOut, baseUrl);
				else {
					const rel = path.relative(baseOut, p).replace(/\\/g, '/');
					if (/encrypted\.bin$/i.test(rel) || /\.bin$/i.test(rel)) continue;
					const urlPath = `${baseUrl}/${rel}`.replace(/\\/g, '/');
					entries.push({ path: urlPath, type: guessType(rel) });
				}
			}
		};
		walk(dataDir, dataDir, '/data');
		walk(assetsDataDir, assetsDataDir, '/assets/data');
		walk(assetsUiDir, assetsUiDir, '/assets/fighting_ui');

		// If we still have nothing, try serving the prebuilt manifest.json if available
		if (entries.length === 0) {
			try {
				const manifestPath = path.join(cwd, 'public', 'assets', 'manifest.json');
				if (fs.existsSync(manifestPath)) {
					const txt = fs.readFileSync(manifestPath, 'utf-8');
					res.setHeader('Content-Type', 'application/json; charset=utf-8');
					return res.status(200).send(txt);
				}
			} catch {}
		}
		res.setHeader('Content-Type', 'application/json; charset=utf-8');
		res.status(200).send(JSON.stringify({ assets: entries }, null, 2));
	} catch (e: any) {
		try { res.status(500).json({ error: 'manifest error', message: e?.message || String(e) }); } catch {}
	}
}

