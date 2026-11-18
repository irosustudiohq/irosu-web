// Local preview of the Irosu site through the real _worker.js (the same code that runs on Cloudflare Pages).
//   node tools/serve_irosu.js [port=8797]
// Pretend to be in another country:  http://127.0.0.1:8797/?geo=JP   (remembered in a cookie; ?geo=off to forget)
// Without ?geo= no country is known locally, so the browser's language (Accept-Language) decides.
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const SITE = path.resolve(__dirname, '..', 'irosu-site');
const PORT = Number(process.argv[2]) || 8797;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.xml': 'application/xml', '.ico': 'image/x-icon' };

function assetPath(urlPath) {
  let p = decodeURIComponent(urlPath);
  if (p.endsWith('/')) p += 'index.html';
  const full = path.resolve(SITE, '.' + p);
  if (!full.startsWith(SITE)) return null;
  for (const c of [full, full + '.html']) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;   // /ja -> ja.html, like Cloudflare Pages
  return null;
}

async function loadWorker() {
  const src = fs.readFileSync(path.join(SITE, '_worker.js'), 'utf8');   // re-read on every request so a rebuild shows up at once
  return import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).filter((c) => c[0]));
    const setCookies = [];
    let geo = url.searchParams.get('geo');
    if (geo) { setCookies.push(`irosu_geo=${geo === 'off' ? '' : geo.toUpperCase()}; Path=/; Max-Age=${geo === 'off' ? 0 : 86400}`); if (geo === 'off') geo = ''; }
    else geo = cookies.irosu_geo || '';
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
    if (geo) headers.set('cf-ipcountry', geo.toUpperCase());
    url.searchParams.delete('geo');
    const request = new Request(url, { method: req.method, headers });
    const env = { ASSETS: { fetch: async (r) => {
      const file = assetPath(new URL(r.url).pathname);
      if (!file) return new Response('Not found', { status: 404 });
      return new Response(fs.readFileSync(file), { status: 200, headers: { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' } });
    } } };
    const worker = await loadWorker();
    const out = await worker.default.fetch(request, env);
    const h = {};
    out.headers.forEach((v, k) => { h[k] = v; });
    if (setCookies.length) h['set-cookie'] = setCookies;
    res.writeHead(out.status, h);
    res.end(Buffer.from(await out.arrayBuffer()));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(String(e && e.stack || e));
  }
}).listen(PORT, '127.0.0.1', () => console.log(`Irosu site: http://127.0.0.1:${PORT}/  (add ?geo=JP, KR, CN, TW, VN, US ... to pretend to be there)`));
