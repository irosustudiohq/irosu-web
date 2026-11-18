// One screenshot of a page with headless Chrome. node shot.js <url> <out.png> [width=1440] [height=900] [waitMs=3000] [scrollY=0]
// Also prints console errors and failed requests, so it doubles as a smoke test.
const { spawn } = require('node:child_process');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const [url, out, w, h, waitArg, scrollArg] = process.argv.slice(2);
const W = Number(w) || 1440, H = Number(h) || 900, WAIT = Number(waitArg) || 3000, SY = Number(scrollArg) || 0;
const PORT = 9800 + Math.floor(Math.random() * 150);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'shot-'));
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${prof}`, `--window-size=${W},${H}`, '--hide-scrollbars', '--mute-audio', '--no-first-run', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
  let t;
  for (let i = 0; i < 100 && !t; i++) { try { t = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((x) => x.type === 'page'); } catch {} if (!t) await sleep(150); }
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const errors = [];
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.method === 'Runtime.exceptionThrown') errors.push('exception: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).split('\n')[0]);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push('console: ' + m.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 200));
    if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) errors.push(`http ${m.params.response.status}: ${m.params.response.url.replace(/^https?:\/\/[^/]+/, '')}`);
  });
  const send = (method, params = {}) => new Promise((res) => { const my = ++id; ws.addEventListener('message', function h(e) { const m = JSON.parse(e.data); if (m.id === my) { ws.removeEventListener('message', h); res(m.result); } }); ws.send(JSON.stringify({ id: my, method, params })); });
  await send('Runtime.enable'); await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 768 });
  await send('Page.navigate', { url });
  await sleep(WAIT);
  if (SY) { await send('Runtime.evaluate', { expression: `(window.lenis||null)?.scrollTo?.(${SY},{immediate:true}); window.scrollTo(0,${SY})` }); await sleep(1500); }
  if (process.env.EVAL) { const r = await send('Runtime.evaluate', { expression: process.env.EVAL, returnByValue: true, awaitPromise: true }); console.log('EVAL', JSON.stringify(r.result.value ?? r.result.description ?? r, null, 1)); }
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
  console.log('saved', out); if (errors.length) console.log([...new Set(errors)].join('\n'));
  ws.close(); chrome.kill();
})().catch((e) => { console.error(e); process.exit(1); });
