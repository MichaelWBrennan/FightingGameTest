import { createHmac, randomBytes } from 'crypto';

export default async function handler(_req: any, res: any) {
  try {
    const userId = 'guest';
    const nonce = randomBytes(16).toString('hex');
    const ts = Math.floor(Date.now() / 1000);
    const payload = `${userId}.${ts}.${nonce}`;
    const secret = process.env.SESSION_SECRET || 'dev-insecure-secret';
    const sig = createHmac('sha256', secret).update(payload).digest('hex');
    const token = `${payload}.${sig}`;
    res.status(200).json({ token, userId, ts });
  } catch (e: any) {
    res.status(500).json({ error: 'Session error', message: e?.message || String(e) });
  }
}

