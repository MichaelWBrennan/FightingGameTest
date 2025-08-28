export default function handler(req: any, res: any) {
  try {
    if (req.url?.includes('/catalog')) {
      return res.status(200).json(require('../data/store/catalog.json'));
    }
    res.status(404).json({ error: 'not found' });
  } catch (e: any) {
    res.status(500).json({ error: 'store error', message: e?.message || String(e) });
  }
}

