// Irosu: picks the language of the home page from the visitor's country (Cloudflare Pages "advanced mode" worker).
// localise.py fills in ROUTING and writes this file as irosu-site/_worker.js. Nothing is logged or stored about the visitor:
// only the two-letter country code is read, to choose a page, and the choice is remembered only in the visitor's own cookie.
const ROUTING = /*ROUTING*/{};

const COOKIE = 'irosu_lang';
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|embedly|whatsapp|telegram|discord/i;

function fromAcceptLanguage(header) {
  for (const part of (header || '').split(',')) {
    const tag = part.split(';')[0].trim().toLowerCase();
    if (!tag) continue;
    if (tag === 'zh-tw' || tag === 'zh-hk' || tag === 'zh-mo' || tag.startsWith('zh-hant')) return 'zh-tw';
    if (tag.startsWith('zh')) return 'zh-cn';
    const base = tag.split('-')[0];
    if (['ja', 'ko', 'vi', 'id'].includes(base)) return base;
    if (base === 'in') return 'id';   // old code some browsers still send for Indonesian
    if (tag === 'en-us') return 'en-us';
    if (base === 'en') return 'en';
  }
  return null;
}

// Returns the locale code to serve. Order: the visitor's own choice (cookie, then ?lang=) -> their country -> their browser language.
export function pickLocale({ country, acceptLanguage, cookie, query }) {
  const known = (c) => c && Object.prototype.hasOwnProperty.call(ROUTING.files, c);
  const englishFor = () => (ROUTING.countries[(country || '').toUpperCase()] === 'en-us' ? 'en-us' : 'en');
  for (const chosen of [query, cookie]) {
    if (chosen === 'en') return englishFor();
    if (known(chosen)) return chosen;
  }
  const byCountry = ROUTING.countries[(country || '').toUpperCase()];
  if (byCountry && byCountry !== 'en-us' && byCountry !== 'en') return byCountry;
  const byBrowser = fromAcceptLanguage(acceptLanguage);
  if (byBrowser && !['en', 'en-us'].includes(byBrowser)) return byBrowser;   // e.g. a Japanese reader travelling in the US
  return byCountry || (byBrowser === 'en-us' ? 'en-us' : ROUTING.default);
}

function readCookie(header, name) {
  const m = (header || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if ((url.pathname === '/' || url.pathname === '/index.html') && request.method === 'GET') {
      const bot = BOT.test(request.headers.get('user-agent') || '');
      const code = bot ? ROUTING.default : pickLocale({
        country: request.cf?.country || request.headers.get('cf-ipcountry') || '',
        acceptLanguage: request.headers.get('accept-language') || '',
        cookie: readCookie(request.headers.get('cookie'), COOKIE),
        query: url.searchParams.get('lang'),
      });
      const file = ROUTING.files[code];
      if (file && file !== 'index.html') {
        const target = new URL('/' + file.replace(/\.html$/, ''), url);
        return new Response(null, { status: 302, headers: { Location: target.pathname, 'Cache-Control': 'private, no-store', Vary: 'Cookie, Accept-Language' } });
      }
      const res = await env.ASSETS.fetch(request);
      const out = new Response(res.body, res);
      out.headers.set('Vary', 'Cookie, Accept-Language');
      out.headers.set('Cache-Control', 'private, no-store');
      return out;
    }
    return env.ASSETS.fetch(request);
  },
};
