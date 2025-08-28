export default function handler(_req: any, res: any) {
	try {
		res.setHeader('Content-Type', 'text/html; charset=utf-8');
		res.setHeader('Cache-Control', 'no-store, max-age=0');
		const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SF3 3rd Strike</title><script src="https://code.playcanvas.com/playcanvas-stable.min.js"></script></head><body style="margin:0;background:#000"><script src="/bundle.js"></script><script>(function(){if(window.SF3App&&typeof window.SF3App.defaultStart==='function'){window.SF3App.defaultStart(null);}else{document.body.innerHTML='<div style=\\"color:#fff;padding:16px\\">Failed to load game bundle</div>';}})();</script></body></html>`;
		res.status(200).send(html);
	} catch (e: any) {
		res.status(500).json({ error: 'Serverless render failed', message: e?.message || String(e) });
	}
}