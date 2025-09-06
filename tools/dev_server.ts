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
  res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SF3 3rd Strike</title></head><body style="margin:0;background:#000"><script src="/bundle.js"></script><script>(function(){var __runtimeBanner__=null;var __errorCounts__=Object.create(null);window.addEventListener('error',function(e){try{var key=((e&&e.message)||'Unknown error')+'|'+(e&&e.filename||'')+':'+(e&&e.lineno||0)+':'+(e&&e.colno||0);__errorCounts__[key]=(__errorCounts__[key]||0)+1;var msg=(e&&e.error&&e.error.stack)?e.error.stack:((e&&e.message)||'Unknown error');var meta=(e&&e.filename)?(' @ '+e.filename+':'+e.lineno+':'+e.colno):'';if(!__runtimeBanner__){__runtimeBanner__=document.createElement('div');__runtimeBanner__.id='__runtime_banner__';__runtimeBanner__.style.cssText='position:fixed;left:0;right:0;top:0;background:#200;color:#f88;padding:8px;white-space:pre-wrap;font:12px monospace;z-index:99999;';document.body.appendChild(__runtimeBanner__);}__runtimeBanner__.textContent='Runtime Error: '+msg+meta+'  ('+__errorCounts__[key]+'x)';}catch{}});window.addEventListener('unhandledrejection',function(e){try{var msg=(e&&e.reason&&((e.reason&&e.reason.stack)||e.reason.message))?((e.reason&&e.reason.stack)||e.reason.message):'Unhandled promise rejection';var el=document.getElementById('__unhandled_banner__');if(!el){el=document.createElement('div');el.id='__unhandled_banner__';el.style.cssText='position:fixed;left:0;right:0;top:32px;background:#220;color:#faa;padding:8px;white-space:pre-wrap;font:12px monospace;z-index:99998;';document.body.appendChild(el);}el.textContent='Unhandled Rejection: '+msg;}catch{}});if(window.SF3App&&typeof window.SF3App.defaultStart==='function'){Promise.resolve(window.SF3App.defaultStart(null)).catch(function(err){try{console.error('Game failed to start:',err);}catch{}});}else{document.body.innerHTML='<div style=\"color:#fff;padding:16px\">Failed to load game bundle</div>';}})();</script></body></html>`);
});

app.listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}`);
});

