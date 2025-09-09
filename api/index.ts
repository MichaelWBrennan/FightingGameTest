export default function handler(_req: any, res: any) {
	try {
		const assetKey = process.env.ASSET_KEY || 'dev-asset-key-change-me';
		res.setHeader('Content-Type', 'text/html; charset=utf-8');
		res.status(200).send(`<!DOCTYPE html>
		<html lang="en">
		  <head>
		    <meta charset="utf-8" />
		    <meta name="viewport" content="width=device-width,initial-scale=1" />
		    <title>SF3 3rd Strike</title>
		    <style>html,body{margin:0;height:100%;background:#000}</style>
		  </head>
		  <body>
		    <script src="https://code.playcanvas.com/1.65.3/playcanvas.min.js"></script>
		    <script>window.__ASSET_KEY__='${'${assetKey}'.replace(/'/g, "\\'")}';</script>
		    <script src="/bundle.js"></script>
		    <script>(function(){
		      var __runtimeBanner__=null;var __errorCounts__=Object.create(null);
		      window.addEventListener('error',function(e){try{var key=((e&&e.message)||'Unknown error')+'|' + (e&&e.filename||'')+':' + (e&&e.lineno||0)+':' + (e&&e.colno||0);__errorCounts__[key]=(__errorCounts__[key]||0)+1;var msg=(e&&e.error&&e.error.stack)?e.error.stack:((e&&e.message)||'Unknown error');var meta=(e&&e.filename)?(' @ '+e.filename+':'+e.lineno+':'+e.colno):'';if(!__runtimeBanner__){__runtimeBanner__=document.createElement('div');__runtimeBanner__.id='__runtime_banner__';__runtimeBanner__.style.cssText='position:fixed;left:0;right:0;top:0;background:#200;color:#f88;padding:8px;white-space:pre-wrap;font:12px monospace;z-index:99999;';document.body.appendChild(__runtimeBanner__);}__runtimeBanner__.textContent='Runtime Error: '+msg+meta+'  ('+__errorCounts__[key]+'x)';}catch{}});
		      window.addEventListener('unhandledrejection',function(e){try{var msg=(e&&e.reason&&(e.reason.stack||e.reason.message))?(e.reason.stack||e.reason.message):'Unhandled promise rejection';var el=document.getElementById('__unhandled_banner__');if(!el){el=document.createElement('div');el.id='__unhandled_banner__';el.style.cssText='position:fixed;left:0;right:0;top:32px;background:#220;color:#faa;padding:8px;white-space:pre-wrap;font:12px monospace;z-index:99998;';document.body.appendChild(el);}el.textContent='Unhandled Rejection: '+msg;}catch{}});
		      if (window.SF3App && typeof window.SF3App.defaultStart==='function') { Promise.resolve(window.SF3App.defaultStart(null)).catch(function(err){ try{ console.error('Game failed to start:', err); }catch{} }); }
		      else { document.body.innerHTML='<div style="color:#fff;padding:16px">Failed to load game bundle</div>'; }
		    })();</script>
		  </body>
		</html>`);
	} catch (e: any) {
		try { res.status(500).json({ error: 'index render error', message: e?.message || String(e) }); } catch {}
	}
}