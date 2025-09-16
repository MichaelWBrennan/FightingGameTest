// @ts-nocheck
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createHash } from 'crypto';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5173;
const publicDir = path.join(process.cwd(), 'public');

// Serve static with caching headers for assets; index will set build version
const staticOpts = { maxAge: '7d', etag: true } as any;
app.use('/bundle.js', express.static(path.join(publicDir, 'bundle.js'), staticOpts));
app.use('/bundle.js.map', express.static(path.join(publicDir, 'bundle.js.map'), staticOpts));
app.use('/data', express.static(path.join(publicDir, 'data'), staticOpts));
app.use('/assets', express.static(path.join(publicDir, 'assets'), staticOpts));

// On-the-fly manifest if not present on disk
app.get('/assets/manifest.json', (_req, res, next) => {
  const manifestPath = path.join(publicDir, 'assets', 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    res.set('Content-Type', 'application/json; charset=utf-8');
    res.set('Cache-Control', 'no-store');
    res.send(fs.readFileSync(manifestPath, 'utf-8'));
    return;
  }
  try {
    const entries: Array<{ path: string; type: string; sha256?: string; size?: number }> = [];
    const dataDir = path.join(publicDir, 'data');
    const assetsDataDir = path.join(publicDir, 'assets', 'data');
    const guessType = (p: string) => {
      const ext = p.split('.').pop()?.toLowerCase();
      if (ext === 'json') return 'json';
      if (ext && ['png','jpg','jpeg','webp'].includes(ext)) return 'image';
      if (ext && ['ogg','mp3','wav'].includes(ext)) return 'audio';
      return 'other';
    };
    const hashFile = (p: string) => {
      try { return createHash('sha256').update(fs.readFileSync(p)).digest('hex'); } catch { return undefined; }
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
          entries.push({ path: urlPath, type: guessType(rel), sha256: hashFile(p), size: st.size });
        }
      }
    };
    walk(dataDir, dataDir, '/data');
    walk(assetsDataDir, assetsDataDir, '/assets/data');
    res.set('Content-Type', 'application/json; charset=utf-8');
    res.set('Cache-Control', 'no-store');
    res.send(JSON.stringify({ assets: entries }, null, 2));
  } catch (e) {
    next(e);
  }
});

app.get('/', (_req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  const buildVersion = process.env.BUILD_VERSION || require(path.join(process.cwd(), 'package.json')).version || 'dev';
  res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SF3 3rd Strike</title></head><body style="margin:0;background:#000"><script>window.__ASSET_KEY__='dev-asset-key-change-me';window.__BUILD_VERSION__='${buildVersion}';</script><script src="/bundle.js"></script><script>(function(){var __runtimeBanner__=null;var __errorCounts__=Object.create(null);window.addEventListener('error',function(e){try{var key=((e&&e.message)||'Unknown error')+'|' + (e&&e.filename||'')+':' + (e&&e.lineno||0)+':' + (e&&e.colno||0);__errorCounts__[key]=(__errorCounts__[key]||0)+1;var msg=(e&&e.error&&e.error.stack)?e.error.stack:((e&&e.message)||'Unknown error');var meta=(e&&e.filename)?(' @ '+e.filename+':'+e.lineno+':'+e.colno):'';if(!__runtimeBanner__){__runtimeBanner__=document.createElement('div');__runtimeBanner__.id='__runtime_banner__';__runtimeBanner__.style.cssText='position:fixed;left:0;right:0;top:0;background:#200;color:#f88;padding:8px;white-space:pre-wrap;font:12px monospace;z-index:99999;';document.body.appendChild(__runtimeBanner__);}__runtimeBanner__.textContent='Runtime Error: '+msg+meta+'  ('+__errorCounts__[key]+'x)';}catch{}});window.addEventListener('unhandledrejection',function(e){try{var msg=(e&&e.reason&&((e.reason&&e.reason.stack)||e.reason.message))?((e.reason&&e.reason.stack)||e.reason.message):'Unhandled promise rejection';var el=document.getElementById('__unhandled_banner__');if(!el){el=document.createElement('div');el.id='__unhandled_banner__';el.style.cssText='position:fixed;left:0;right:0;top:32px;background:#220;color:#faa;padding:8px;white-space:pre-wrap;font:12px monospace;z-index:99998;';document.body.appendChild(el);}el.textContent='Unhandled Rejection: '+msg;}catch{}});if(window.SF3App&&typeof window.SF3App.defaultStart==='function'){Promise.resolve(window.SF3App.defaultStart(null)).catch(function(err){try{console.error('Game failed to start:',err);}catch{}});}else{document.body.innerHTML='<div style=\\"color:#fff;padding:16px\\">Failed to load game bundle</div>';}})();</script></body></html>`);
});

// Lightweight stub APIs used by the client during boot
app.get('/api/manifest', (_req, res) => {
  res.set('Content-Type', 'application/json; charset=utf-8');
  res.set('Cache-Control', 'no-store');
  res.send(JSON.stringify({ assets: [] }));
});
app.get('/api/session', (_req, res) => {
  res.set('Content-Type', 'application/json; charset=utf-8');
  res.send({ token: 'dev', userId: 'guest' });
});
app.all('/api/analytics/events', (_req, res) => {
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}`);
});

