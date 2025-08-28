export default function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    res.status(200).json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: 'analytics error', message: e?.message || String(e) });
  }
}

