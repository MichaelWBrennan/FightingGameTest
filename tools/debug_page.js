const puppeteer = require('puppeteer');

(async () => {
	const url = process.env.URL || 'http://localhost:5000';
	const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
	const page = await browser.newPage();
	page.on('console', msg => { try { console.log('[console]', msg.type(), msg.text()); } catch {} });
	page.on('pageerror', err => { try { console.error('[pageerror]', err.stack || err.message); } catch {} });
	page.on('requestfailed', req => { try { console.warn('[requestfailed]', req.url(), req.failure()?.errorText); } catch {} });
	await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
	await page.waitForTimeout(2000);
	const overlayLogs = await page.evaluate(() => {
		try {
			const el = document.getElementById('pc-loading-log');
			if (!el) return { ok: false, lines: [] };
			const lines = Array.from(el.querySelectorAll('div')).map(d => d.textContent || '').slice(-100);
			return { ok: true, lines };
		} catch { return { ok: false, lines: [] }; }
	});
	console.log('overlayLogs.ok=', overlayLogs.ok);
	for (const line of overlayLogs.lines) console.log(line);
	const info = await page.evaluate(() => {
		const canvas = document.getElementById('application-canvas');
		const pcAny = window.pc;
		return {
			canvas: !!canvas,
			canvasSize: canvas ? { w: canvas.width, h: canvas.height } : null,
			pcAvailable: !!pcAny,
			pcVersion: pcAny && pcAny.revision || null,
			bundleStartFn: typeof window.SF3App?.defaultStart === 'function'
		};
	});
	console.log('pageInfo:', info);
	await browser.close();
	process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });