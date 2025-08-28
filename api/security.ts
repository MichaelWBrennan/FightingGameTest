export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }
    // Minimal telemetry collector; in a real deployment this would persist securely
    const body = await parseJson(req);
    res.status(200).json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: 'Security telemetry error', message: e?.message || String(e) });
  }
}

async function parseJson(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: string) => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(e); }
    });
  });
}

