export default function handler(req: any, res: any) {
  try {
    if (req.url?.includes('/catalog')) {
      // Serve from static file deployed in public/data
      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.redirect(307, '/data/store/catalog.json');
    }
    res.status(404).json({ error: 'not found' });
  } catch (e: any) {
    res.status(500).json({ error: 'store error', message: e?.message || String(e) });
  }
}

