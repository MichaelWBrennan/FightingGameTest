// Lightweight physics worker for airborne updates (scaffold)
// Message protocol:
// { t: 'air', items: Array<{ x:number; y:number; vx:number; vy:number }>, g:number, fr:number, bf:number }
// -> { t: 'air_ret', items: Array<{ x:number; y:number; vx:number; vy:number }> }

self.onmessage = (e: MessageEvent<any>) => {
  const m = e.data;
  if (!m || typeof m !== 'object') return;
  if (m.t === 'air') {
    try {
      const g = Number(m.g) || 0.012;
      const fr = Number(m.fr) || 0.98;
      const bf = Number(m.bf) || 0.42;
      const out = (m.items || []).map((it: any) => {
        let vx = Number(it.vx) || 0;
        let vy = Number(it.vy) || 0;
        let x = Number(it.x) || 0;
        let y = Number(it.y) || 0;
        vy = vy - g;
        vx = vx * fr;
        x += vx; y += vy;
        if (y <= 0) { y = 0; vy = Math.abs(vy) > 0.08 ? -vy * bf : 0; }
        return { x, y, vx, vy };
      });
      // @ts-ignore
      postMessage({ t: 'air_ret', items: out });
    } catch {
      // @ts-ignore
      postMessage({ t: 'air_ret', items: [] });
    }
  }
};

