import puppeteer from 'puppeteer';

async function run() {
	const url = process.env.URL || 'http://localhost:5000';
	const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
	const page = await browser.newPage();
	page.on('console', msg => {
		try { console.log('[console]', msg.type(), msg.text()); } catch {}
	});
	page.on('pageerror', err => {
		try { console.error('[pageerror]', err.stack || err.message); } catch {}
	});
	page.on('requestfailed', req => {
		try { console.warn('[requestfailed]', req.url(), req.failure()?.errorText); } catch {}
	});
	await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
	// Wait a bit for engine init
	await page.waitForTimeout(2000);
	// Extract overlay logs and debug state if present
	const overlayLogs = await page.evaluate(() => {
		try {
			const el = document.getElementById('pc-loading-log');
			if (!el) return { ok: false, lines: [] as string[] };
			const lines = Array.from(el.querySelectorAll('div')).map(d => d.textContent || '').slice(-100);
			return { ok: true, lines };
		} catch { return { ok: false, lines: [] as string[] }; }
	});
	console.log('overlayLogs.ok=', overlayLogs.ok);
	for (const line of overlayLogs.lines) console.log(line);
	// Also check if app created a canvas and if window.pc exists
	const info = await page.evaluate(() => {
		const canvas = document.getElementById('application-canvas') as HTMLCanvasElement | null;
		const pcAny: any = (window as any).pc;
		return {
			canvas: !!canvas,
			canvasSize: canvas ? { w: (canvas as any).width, h: (canvas as any).height } : null,
			pcAvailable: !!pcAny,
			pcVersion: pcAny?.revision || null,
			bundleStartFn: typeof (window as any).SF3App?.defaultStart === 'function'
		};
	});
	console.log('pageInfo:', info);
	await browser.close();
}

run().catch(err => { console.error(err); process.exit(1); });