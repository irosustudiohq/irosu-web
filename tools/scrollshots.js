// Scroll-through screenshots of a page with headless Chrome (no npm deps; uses the DevTools protocol).
// node scrollshots.js <url> <outDir> [stepPx=450] [width=1440] [height=900] [settleMs=700]
// Writes <outDir>/0000.png, 0001.png ... one per scroll step, after letting scroll animations settle.
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const [url, outDir, stepArg, wArg, hArg, settleArg] = process.argv.slice(2);
const STEP = Number(stepArg) || 450, W = Number(wArg) || 1440, H = Number(hArg) || 900, SETTLE = Number(settleArg) || 700;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9400 + Math.floor(Math.random() * 400);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'shots-'));
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`,
    `--window-size=${W},${H}`, '--hide-scrollbars', '--mute-audio', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  let target;
  for (let i = 0; i < 100 && !target; i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === 'page'); } catch {}
    if (!target) await sleep(150);
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0;
  const send = (method, params = {}) => new Promise((res) => {
    const my = ++id;
    ws.addEventListener('message', function h(e) { const m = JSON.parse(e.data); if (m.id === my) { ws.removeEventListener('message', h); res(m.result); } });
    ws.send(JSON.stringify({ id: my, method, params }));
  });
  const evaluate = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value;
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await send('Page.enable');
  await send('Page.navigate', { url });
  await sleep(Number(process.env.WAIT) || 9000); // loader + intro animation
  // dismiss a cookie banner if present
  await evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(b => /^(ok|accept|got it)$/i.test(b.textContent.trim())); if (b) b.click(); })()`);
  const total = await evaluate('document.documentElement.scrollHeight');
  let n = 0;
  for (let y = 0; y <= total - H + STEP; y += STEP) {
    // wheel events so smooth-scroll libraries and scroll-triggered animations see real input
    await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: W / 2, y: H / 2, deltaX: 0, deltaY: y === 0 ? 0 : STEP });
    await sleep(SETTLE);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, String(n++).padStart(4, '0') + '.png'), Buffer.from(shot.data, 'base64'));
    const at = await evaluate('Math.round(scrollY)');
    if (at + H >= total - 2 && y > 0) break;
  }
  console.log(`saved ${n} shots, page height ${total}`);
  ws.close(); chrome.kill();
})().catch((e) => { console.error(e); process.exit(1); });
