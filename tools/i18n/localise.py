"""Make every language version of the site from the English pages.

    python tools/i18n/localise.py [--strict]

Reads   tools/i18n/_src/index.html        (written by build_irosu_site.py)
        tools/i18n/access-source.html     (the waitlist page, hand-written)
        tools/i18n/locales/<code>.json    (translations: {"strings": {english: translated}, "js": {...}})
        tools/i18n/routing.json           (which country gets which language)
Writes  irosu-site/index.html, ja.html, ko.html ...   and   access.html, access-ja.html ...
        irosu-site/_worker.js             (country -> language redirect, Cloudflare Pages)
        irosu-site/sitemap-index.xml

--strict stops on any missing translation; without it, missing text stays English and is listed.
Layout, CSS and animation code are never touched; only text, links, lang attributes and a language switcher are added.
"""
import html, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..'))
import extract  # noqa: E402
from extract import collect, norm  # noqa: E402

SITE = extract.SITE
SITE_URL = 'https://irosu.com/'   # keep in step with build_irosu_site.SITE_URL
ROUTING = json.load(open(os.path.join(HERE, 'routing.json'), encoding='utf-8'))
LOCALES = ROUTING['locales']          # code -> {name, html_lang, og_locale, file_slug, font, spelling?}
ORDER = list(LOCALES)                 # switcher order

# American spelling for visitors in the US (the international English text uses British spelling)
US_SPELLING = [('colour', 'color'), ('Colour', 'Color'), ('COLOUR', 'COLOR')]


def spell_us(t):
    for a, b in US_SPELLING:
        t = t.replace(a, b)
    return t


def deep(o, f):
    if isinstance(o, str):
        return f(o)
    if isinstance(o, list):
        return [deep(x, f) for x in o]
    if isinstance(o, dict):
        return {k: deep(v, f) for k, v in o.items()}
    return o


def index_name(code):
    return 'index.html' if code == 'en' else LOCALES[code]['file_slug'] + '.html'


def access_name(code):
    return 'access.html' if code == 'en' else 'access-' + LOCALES[code]['file_slug'] + '.html'


def load_locale(code, src):
    """Returns (strings dict english->translated, js lists, problems)."""
    problems = []
    if code == 'en':
        return {s['en']: s['en'] for s in src['strings']}, src['js'], problems
    if code == 'en-us':
        return {s['en']: spell_us(s['en']) for s in src['strings']}, deep(src['js'], spell_us), problems
    path = os.path.join(HERE, 'locales', code + '.json')
    if not os.path.exists(path):
        return None, None, ['no translation file ' + path]
    data = json.load(open(path, encoding='utf-8'))
    strings = data.get('strings', {})
    for s in src['strings']:
        if s['en'] not in strings or not str(strings[s['en']]).strip():
            problems.append('missing string: ' + s['en'][:80])
    js = data.get('js', {})
    for en_item, tr_item in zip(src['js']['Yt'], js.get('Yt', [])):   # colour-chart source lines: use the page translation of the same text
        if isinstance(tr_item, dict) and tr_item.get('source') == en_item['source'] and en_item['source'] in strings:
            tr_item['source'] = strings[en_item['source']]
    problems += check_js(src['js'], js)
    return strings, js, problems


def check_js(en, tr, path='js'):
    """Same shape as the English lists; identifiers (source, tools, color, app) unchanged."""
    out = []
    FIXED = {'source', 'tools', 'color'}
    if isinstance(en, dict):
        if not isinstance(tr, dict) or set(en) != set(tr):
            return [f'{path}: keys differ ({sorted(en)} vs {sorted(tr) if isinstance(tr, dict) else type(tr).__name__})']
        for k in en:
            # `source` is an icon id (chat/call/figma) in the gap list but readable text in the colour-chart list
            if k in FIXED and not (k == 'source' and en[k] not in ('chat', 'call', 'figma')):
                if en[k] != tr[k]:
                    out.append(f'{path}.{k}: must stay {en[k]!r}')
            else:
                out += check_js(en[k], tr[k], f'{path}.{k}')
    elif isinstance(en, list):
        if not isinstance(tr, list) or len(en) != len(tr):
            return [f'{path}: list length differs']
        for i, (a, b) in enumerate(zip(en, tr)):
            out += check_js(a, b, f'{path}[{i}]')
    elif isinstance(en, str):
        if not isinstance(tr, str) or not tr.strip():
            out.append(f'{path}: empty or not text')
    elif en is None:
        pass
    return out


def esc_text(t):
    return html.escape(t, quote=False)


def esc_attr(t):
    return html.escape(t, quote=True)


def translate_html(s, strings, missing, code):
    """Swap every collected text node / attribute value for its translation (right to left so offsets stay valid)."""
    items = collect(s)
    for kind, a, b, key, where in sorted(items, key=lambda x: -x[1]):
        tr = strings.get(key)
        if tr is None or not str(tr).strip():
            missing.add(key)
            continue
        if kind == 'text':
            raw = s[a:b]
            lead = re.match(r'\s*', raw).group(0)
            trail = re.search(r'\s*$', raw).group(0)
            s = s[:a] + lead + esc_text(tr) + trail + s[b:]
        else:
            s = s[:a] + esc_attr(tr) + s[b:]
    return s


def tr_json_strings(obj, strings, missing):
    def f(v):
        k = norm(v)
        if not extract.translatable(k) or k.startswith(('http', '#')) or ' ' not in k:
            return v                      # urls, colours and schema.org type names are not words
        if k in strings:
            return strings[k]
        # one FAQ answer is split around a link on the page (…open it in [CLIP STUDIO PAINT] or Photoshop…): join its translated halves
        if ' CLIP STUDIO PAINT ' in k:
            a, b = k.split(' CLIP STUDIO PAINT ', 1)
            if a in strings and b in strings:
                return strings[a] + ' CLIP STUDIO PAINT ' + strings[b]
        missing.add('(structured data) ' + k[:70])
        return v
    return deep(obj, f)


def tr_json_attr(s, attr, strings, missing, brands=False, code='en'):
    def sub(m):
        raw = html.unescape(m.group(1))
        try:
            data = json.loads(raw)
        except ValueError:
            return m.group(0)
        if brands:   # [[local term, 1], [Japanese term, 1]]: the first shows in the page language, the second stays Japanese
            en, ja = data[0][0], data[1][0]
            first = strings.get(en, en)
            data = [[ja, 1], [en, 1]] if code == 'ja' else [[first, 1], [ja, 1]]
        else:
            data = tr_json_strings(data, strings, missing)
        return f' {attr}="' + esc_attr(json.dumps(data, ensure_ascii=False)) + '"'
    return re.sub(r'\s' + attr + r'="([^"]*)"', sub, s)


def alternates(for_access=False):
    out = []
    for c in ORDER:
        f = access_name(c) if for_access else index_name(c)
        out.append(f'<link rel="alternate" hreflang="{LOCALES[c]["html_lang"]}" href="{SITE_URL}{f}">')
    out.append(f'<link rel="alternate" hreflang="x-default" href="{SITE_URL}{access_name("en") if for_access else index_name("en")}">')
    return ''.join(out)


SWITCH_JS = ("<script>document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-lang]');"
             "if(a){try{document.cookie='irosu_lang='+a.getAttribute('data-lang')+';path=/;max-age=31536000;SameSite=Lax'}catch(_){}}})</script>")


def switcher(code, access):
    links = []
    for c in ORDER:
        if LOCALES[c].get('automatic'):
            continue                      # US English is the same "English" entry, chosen automatically for US readers
        target = 'en-us' if (c == 'en' and code == 'en-us') else c
        f = access_name(target) if access else index_name(target)
        cur = ' aria-current="true"' if (c == code or (c == 'en' and code == 'en-us')) else ''
        links.append(f'<a href="{f}" hreflang="{LOCALES[c]["html_lang"]}" lang="{LOCALES[c]["html_lang"]}" data-lang="{c}"{cur}>{LOCALES[c]["name"]}</a>')
    return links


def font_css(code):
    f = LOCALES[code].get('font')
    if not f:
        return ''
    # keep the template's own fallback faces first (the page's loader waits for them to be used), then the language's fonts
    return (f'<style>:root{{--font-title:"Saans VF-1156b2189454d62c","Saans VF-1156b2189454d62c fallback: Arial",{f},sans-serif;'
            f'--font-hand:"Caveat VF-0210161fb4759c28","Caveat VF-0210161fb4759c28 fallback: Arial",{f},sans-serif}}'
            f'html[lang]{{font-family:{f},sans-serif}}{LOCALES[code].get("css", "")}</style>')


def make_index(src_html, code, strings, js, missing):
    s = translate_html(src_html, strings, missing, code)
    s = tr_json_attr(s, 'data-pricing-plans', strings, missing)
    s = tr_json_attr(s, 'data-brands', strings, missing, brands=True, code=code)
    # structured data for search engines
    def ld(m):
        data = json.loads(m.group(2))
        data = tr_json_strings(data, strings, missing)
        return m.group(1) + json.dumps(data, ensure_ascii=False) + m.group(3)
    s = re.sub(r'(<script type="application/ld\+json">)(.*?)(</script>)', ld, s, flags=re.S)
    me = LOCALES[code]
    s = s.replace('<html lang="en"', f'<html lang="{me["html_lang"]}"', 1)
    s = s.replace('content="en_US"', f'content="{me["og_locale"]}"', 1)
    s = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{SITE_URL}{index_name(code)}">', s, count=1)
    s = s.replace('href="access.html"', f'href="{access_name(code)}"')
    s = s.replace('href="index.html"', f'href="{index_name(code)}"')
    # language switcher inside the footer panel, under the © line
    links = switcher(code, False)
    bar = ('<div class="lang-switch" data-lang-switch aria-label="Language" style="display:flex;flex-wrap:wrap;gap:4px 16px;margin-top:2px">'
           + ''.join(links) + '</div>')
    assert s.count('<p>© Irosu 2026</p>') == 1, 'footer anchor not found'
    s = s.replace('<p>© Irosu 2026</p>', '<p>© Irosu 2026</p>' + bar)
    head = (alternates() + font_css(code)
            + '<style>.lang-switch a{opacity:.55;text-decoration:none}.lang-switch a:hover,.lang-switch a[aria-current]{opacity:1}</style>'
            + '<script>window.__I18N=' + json.dumps(js, ensure_ascii=False).replace('</', '<\\/') + ';</script>' + SWITCH_JS)
    s = s.replace('</head>', head + '</head>', 1)
    return s


def make_access(src_html, code, strings, missing, msg_en):
    s = translate_html(src_html, strings, missing, code)
    me = LOCALES[code]
    s = s.replace('<html lang="en"', f'<html lang="{me["html_lang"]}"', 1)
    s = s.replace('href="index.html"', f'href="{index_name(code)}"')
    msg = {k: strings.get(v, v) for k, v in msg_en.items()}
    s = re.sub(r'const MSG = \{.*?\n\};', lambda m: 'const MSG = ' + json.dumps(msg, ensure_ascii=False, indent=2) + ';', s, count=1, flags=re.S)
    endpoint = ''
    ep = os.path.join(HERE, 'form-endpoint.txt')   # the Formspree (or similar) form URL; empty = preview mode, nothing is sent
    if os.path.exists(ep):
        endpoint = open(ep, encoding='utf-8').read().strip()
    assert "const FORM_ENDPOINT = '';" in s
    s = s.replace("const FORM_ENDPOINT = '';", "const FORM_ENDPOINT = " + json.dumps(endpoint) + ";", 1)
    links = ''.join(switcher(code, True))
    s = s.replace('{{LANGS}}', '<span class="langs">' + links.replace('</a><a', '</a> · <a') + '</span>')
    extra = alternates(True) + font_css(code) + '<style>.langs a{text-decoration:none;opacity:.6}.langs a:hover,.langs a[aria-current]{opacity:1}'
    if code not in ('en', 'en-us'):
        extra += '.ja{display:none}'      # the small Japanese helper labels are only for English visitors
    if code in ('ja', 'ko', 'zh-cn', 'zh-tw'):
        extra += 'h1{font-size:clamp(30px,3.4vw,50px);line-height:1.25;letter-spacing:0}.done h2{letter-spacing:0;line-height:1.25}'   # Asian scripts need smaller, looser headlines
    extra += '</style>' + SWITCH_JS
    s = s.replace('</head>', extra + '</head>', 1)
    return s


def write_worker():
    tpl = open(os.path.join(HERE, 'worker.template.js'), encoding='utf-8').read()
    cfg = {'default': ROUTING['default'], 'countries': ROUTING['countries'], 'files': {c: index_name(c) for c in ORDER}, 'languages': {c: LOCALES[c]['html_lang'] for c in ORDER}}
    open(os.path.join(SITE, '_worker.js'), 'w', encoding='utf-8').write(tpl.replace('/*ROUTING*/{}', json.dumps(cfg, ensure_ascii=False, indent=1)))


def write_sitemap():
    rows = ''.join(f'<url><loc>{SITE_URL}{index_name(c)}</loc>' + ''.join(
        f'<xhtml:link rel="alternate" hreflang="{LOCALES[o]["html_lang"]}" href="{SITE_URL}{index_name(o)}"/>' for o in ORDER) + '</url>' for c in ORDER)
    open(os.path.join(SITE, 'sitemap-index.xml'), 'w', encoding='utf-8').write(
        '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' + rows + '</urlset>')


def check_only(code):
    """python localise.py --check ja : validate one translation file, write nothing."""
    src = extract.build_source()
    strings, js, problems = load_locale(code, src)
    if strings is not None:
        missing = set()
        make_index(open(extract.SOURCES['index'], encoding='utf-8').read(), code, strings, js, missing)
        make_access(open(extract.SOURCES['access'], encoding='utf-8').read(), code, strings, missing, src['access_messages'])
        problems += ['left in English: ' + m for m in sorted(missing) if not any(m[:80] in p for p in problems)]
        data = json.load(open(os.path.join(HERE, 'locales', code + '.json'), encoding='utf-8')) if code not in ('en', 'en-us') else {}
        for s in src['strings']:      # numbers and codes should survive translation (warning only)
            tr = data.get('strings', {}).get(s['en'])
            if tr and sorted(re.findall(r'\d+', s['en'])) != sorted(re.findall(r'\d+', tr)):
                problems.append(f'check digits: {s["en"][:60]!r} -> {tr[:60]!r}')
    print(f'{code}: {len(problems)} problem(s)')
    for p in problems:
        print('   ', p)
    sys.exit(1 if problems else 0)


def main():
    if '--check' in sys.argv:
        check_only(sys.argv[sys.argv.index('--check') + 1])
    strict = '--strict' in sys.argv
    src = extract.build_source()
    index_src = open(extract.SOURCES['index'], encoding='utf-8').read()
    access_src = open(extract.SOURCES['access'], encoding='utf-8').read()
    report, built = {}, []
    for code in ORDER:
        strings, js, problems = load_locale(code, src)
        if strings is None:
            report[code] = problems
            continue
        missing = set()
        idx = make_index(index_src, code, strings, js, missing)
        acc = make_access(access_src, code, strings, missing, src['access_messages'])
        open(os.path.join(SITE, index_name(code)), 'w', encoding='utf-8').write(idx)
        open(os.path.join(SITE, access_name(code)), 'w', encoding='utf-8').write(acc)
        built.append(code)
        report[code] = problems + ['left in English: ' + m for m in sorted(missing) if not any(m[:80] in p for p in problems)]
    write_worker()
    write_sitemap()
    bad = 0
    for code, probs in report.items():
        print(f'{code}: {"built" if code in built else "NOT built"}, {len(probs)} problem(s)')
        for p in probs[:25]:
            print('    ', p)
        bad += len(probs)
    if strict and bad:
        sys.exit(1)


if __name__ == '__main__':
    main()
