import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	res.status(200).send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SF3 3rd Strike</title><script src="https://code.playcanvas.com/playcanvas-stable.min.js"></script></head><body style="margin:0;background:#000"><script src="/bundle.js"></script><script>(function(){if(window.SF3App&&typeof window.SF3App.defaultStart==='function'){window.SF3App.defaultStart(null);}else{document.body.innerHTML='<div style=\"color:#fff;padding:16px\">Failed to load game bundle</div>';}})();</script></body></html>`);
}