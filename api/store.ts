import * as fs from 'fs';
import * as path from 'path';

export default function handler(req: any, res: any) {
  try {
    if (req.url?.includes('/catalog')) {
      const p = path.join(process.cwd(), 'public', 'data', 'store', 'catalog.json');
      const buf = fs.readFileSync(p, 'utf8');
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.status(200).send(buf);
    }
    res.status(404).json({ error: 'not found' });
  } catch (e: any) {
    res.status(500).json({ error: 'store error', message: e?.message || String(e) });
  }
}

