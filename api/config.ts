export default function handler(req: any, res: any) {
  try {
    const resource = (req.query && req.query.resource) || '';
    if (resource === 'events') {
      res.status(200).json({ events: [ { id: 'launch', start: 0 } ] });
      return;
    }
    res.status(200).json({
      matchmaking_enabled: false,
      storefront_endpoint: '/api/store/catalog',
      analytics_enabled: true,
      netcode: { enabled: true, mode: 'local', delay: 2, maxRollback: 12 }
    });
  } catch (e: any) {
    res.status(500).json({ error: 'config error', message: e?.message || String(e) });
  }
}

