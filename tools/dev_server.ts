import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5173;
const publicDir = path.join(process.cwd(), 'public');

app.use('/bundle.js', express.static(path.join(publicDir, 'bundle.js')));
app.use('/bundle.js.map', express.static(path.join(publicDir, 'bundle.js.map')));
app.use('/data', express.static(path.join(publicDir, 'data')));
app.use('/assets', express.static(path.join(publicDir, 'assets')));

app.get('/', (_req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SF3 3rd Strike</title><script src="https://code.playcanvas.com/playcanvas-stable.min.js"></script></head><body style="margin:0;background:#000"><script src="/bundle.js"></script><script>(function(){if(window.SF3App&&typeof window.SF3App.defaultStart==='function'){window.SF3App.defaultStart(null);}else{document.body.innerHTML='<div style=\"color:#fff;padding:16px\">Failed to load game bundle</div>';}})();</script></body></html>`);
});

app.listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}`);
});

