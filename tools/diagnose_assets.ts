#!/usr/bin/env ts-node
/*
  Headless diagnostics for asset loading and runtime errors.

  Usage:
    ts-node tools/diagnose_assets.ts --url http://localhost:5000/ --timeout 30000 --screenshot diag.png

  Exits with code 1 if console errors, page errors, or failed network requests were observed.
*/
// @ts-nocheck
import fs from 'fs';
import path from 'path';
import puppeteer, { HTTPResponse, HTTPRequest, ConsoleMessage } from 'puppeteer';

type Args = { url: string; timeout: number; screenshot?: string; headless: boolean };

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const out: Args = { url: 'http://localhost:5000/', timeout: 30000, headless: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url' && argv[i+1]) { out.url = argv[++i]; continue; }
    if (a === '--timeout' && argv[i+1]) { out.timeout = Number(argv[++i]) || out.timeout; continue; }
    if (a === '--screenshot' && argv[i+1]) { out.screenshot = argv[++i]; continue; }
    if (a === '--headed') { out.headless = false; continue; }
  }
  return out;
}

type NetEvent = {
  url: string;
  method: string;
  type?: string;
  status?: number;
  fromCache?: boolean;
  fromServiceWorker?: boolean;
  failureText?: string | null;
};

async function main() {
  const args = parseArgs();
  const browser = await puppeteer.launch({ headless: args.headless ? 'new' : false, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 });

  const network: NetEvent[] = [];
  const consoleLogs: { type: string; text: string }[] = [];
  const pageErrors: string[] = [];

  page.on('request', (req: HTTPRequest) => {
    try {
      const e: NetEvent = { url: req.url(), method: req.method(), type: req.resourceType() };
      (req as any)._diag = e; // link for later
      network.push(e);
    } catch {}
  });
  page.on('response', (res: HTTPResponse) => {
    try {
      const req: any = res.request();
      const e: NetEvent | undefined = (req as any)?._diag;
      if (e) {
        e.status = res.status();
        e.fromCache = res.fromCache();
        e.fromServiceWorker = res.fromServiceWorker();
      }
    } catch {}
  });
  page.on('requestfailed', (req: HTTPRequest) => {
    try {
      const e: NetEvent | undefined = (req as any)?._diag;
      if (e) e.failureText = req.failure()?.errorText || 'failed';
    } catch {}
  });
  page.on('console', (msg: ConsoleMessage) => {
    try {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
    } catch {}
  });
  page.on('pageerror', (err: Error) => { try { pageErrors.push(err.stack || err.message); } catch {} });
  page.on('error', (err: Error) => { try { pageErrors.push(err.stack || err.message); } catch {} });

  const navStart = Date.now();
  const nav = await page.goto(args.url, { waitUntil: 'networkidle2', timeout: args.timeout });
  const navMs = Date.now() - navStart;

  // Give the app some time to boot and preload background assets
  await page.waitForTimeout(1500);

  // Pull some page diagnostics
  const pageInfo = await page.evaluate(() => {
    const w: any = window as any;
    const overlayLog = (() => {
      try {
        const el = document.getElementById('pc-loading-log');
        return el ? (el.textContent || '').split('\n').slice(-200) : [];
      } catch { return []; }
    })();
    const overlayTasks = (() => {
      try {
        const el = document.getElementById('pc-loading-tasks');
        if (!el) return [] as string[];
        const items = Array.from(el.children) as any[];
        return items.map(it => (it.textContent || '').trim());
      } catch { return []; }
    })();
    const canvases = Array.from(document.getElementsByTagName('canvas')).map(c => ({ id: c.id, w: (c as any).width, h: (c as any).height }));
    const hasSF3 = !!(w.SF3App);
    return {
      buildVersion: w.__BUILD_VERSION__ || null,
      assetKey: w.__ASSET_KEY__ || null,
      hasSF3,
      overlayTasks,
      overlayLog,
      title: document.title,
      canvases,
      location: (window.location || {}).href
    };
  });

  if (args.screenshot) {
    const outPath = path.resolve(process.cwd(), args.screenshot);
    await page.screenshot({ path: outPath, fullPage: true });
  }

  await browser.close();

  // Analyze network
  const failed = network.filter(n => (n.status == null || n.status >= 400) || n.failureText);
  const important = network.filter(n => /\/bundle\.js$|\/assets\/manifest\.json|\/data\/|\/assets\/data\//.test(n.url));
  const importantFailures = important.filter(n => (n.status == null || n.status >= 400) || n.failureText);

  const summary = {
    url: args.url,
    navStatus: nav?.status?.(),
    navTimeMs: navMs,
    totalRequests: network.length,
    failedRequests: failed.length,
    importantRequests: important.length,
    importantFailures: importantFailures.length,
    pageErrors,
    consoleErrors: consoleLogs.filter(l => l.type === 'error').map(l => l.text),
    consoleWarns: consoleLogs.filter(l => l.type === 'warning' || l.type === 'warn').map(l => l.text),
    pageInfo
  } as const;

  const detail = {
    failed,
    importantFailures,
    importantRequests: important,
  } as const;

  // Pretty print
  console.log('=== Diagnostics Summary ===');
  console.log(JSON.stringify(summary, null, 2));
  console.log('=== Important Failures ===');
  console.log(JSON.stringify(detail.importantFailures, null, 2));
  console.log('=== All Failed Requests ===');
  console.log(JSON.stringify(detail.failed, null, 2));

  const hasProblems = summary.failedRequests > 0 || summary.consoleErrors.length > 0 || summary.pageErrors.length > 0 || summary.importantFailures > 0;
  if (hasProblems) {
    process.exitCode = 1;
  }
}

main().catch(err => {
  console.error('diagnose_assets failed:', err);
  process.exit(2);
});

