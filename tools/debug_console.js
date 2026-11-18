// Print every console message, exception and failed request of a page after N seconds (headless Chrome).
//   node tools/debug_console.js <url> [waitMs=8000] [width=1440] [height=900]
const { spawn } = require('node:child_process');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const [url, waitArg, w, h] = process.argv.slice(2);
const PORT = 9300 + Math.floor(Math.random() * 400), sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'dbg-'));
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`,
    `--window-size=${w || 1440},${h || 900}`, '--mute-audio', '--no-first-run', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
  let t;
  for (let i = 0; i < 100 && !t; i++) { try { t = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((x) => x.type === 'page'); } catch {} if (!t) await sleep(200); }
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0;
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.method === 'Runtime.exceptionThrown') { const d = m.params.exceptionDetails; console.log('EXCEPTION', d.text, d.exception?.description?.slice(0, 600), `line ${d.lineNumber}:${d.columnNumber}`, d.url || ''); }
    if (m.method === 'Runtime.consoleAPICalled') console.log('console.' + m.params.type, m.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 300));
    if (m.method === 'Log.entryAdded') console.log('log', m.params.entry.level, m.params.entry.text.slice(0, 200), m.params.entry.url || '');
    if (m.method === 'Network.loadingFailed') console.log('FAILED', m.params.errorText, m.params.requestId);
    if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) console.log('HTTP', m.params.response.status, m.params.response.url);
  });
  const send = (method, params = {}) => new Promise((res) => { const my = ++id; ws.addEventListener('message', function f(e) { const m = JSON.parse(e.data); if (m.id === my) { ws.removeEventListener('message', f); res(m.result); } }); ws.send(JSON.stringify({ id: my, method, params })); });
  await send('Runtime.enable'); await send('Log.enable'); await send('Network.enable');
  await send('Page.navigate', { url });
  const t0 = Date.now(), limit = Number(waitArg) || 8000;
  let cleared = null;
  while (Date.now() - t0 < limit) {            // note when the page's loading screen finishes
    await sleep(400);
    const c = await send('Runtime.evaluate', { expression: 'document.documentElement.classList.contains("is-loading")', returnByValue: true });
    if (c.result.value === false && cleared === null) { cleared = Date.now() - t0; if (!process.env.FULL_WAIT) break; }
  }
  const r = await send('Runtime.evaluate', { expression: 'document.documentElement.className', returnByValue: true });
  console.log('html class:', r.result.value, '| loading screen cleared after', cleared === null ? 'NEVER (within ' + limit + 'ms)' : cleared + 'ms');
  chrome.kill(); process.exit(0);
})();
