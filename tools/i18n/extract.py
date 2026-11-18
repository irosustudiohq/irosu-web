"""Pull every translatable string out of the built English pages and the scripts.

    python tools/i18n/extract.py     -> tools/i18n/source-en.json

Run it after build_irosu_site.py (it reads irosu-site/index.html, irosu-site/access.html and the script lists).
The output is what translators work from; localise.py reads the same extractor to apply their translations.
"""
import html, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.normpath(os.path.join(ROOT, '..', '..', 'irosu-site'))
TAG = re.compile(r'<(?:[^>"\']|"[^"]*"|\'[^\']*\')*>')
ATTRS = ('alt', 'aria-label', 'title', 'placeholder', 'content', 'data-text')
LETTER = re.compile(r'[A-Za-z]')   # text with no Latin letters at all (お名前, 影) is already in its own language and is never swapped
COMMENT = re.compile(r'<!--.*?-->', re.S)
# parts of the page that stay as they are in every language (not words to translate)
KEEP = {'Astro v7.0.6', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1', 'website', 'Irosu', 'en_US',
        'summary_large_image', 'nointentdetection', 'X', 'OK', 'N', '© Irosu 2026'}
SOURCES = {'index': os.path.join(ROOT, '_src', 'index.html'), 'access': os.path.join(ROOT, 'access-source.html')}   # English pages the languages are made from
HOME_JS = os.path.join(SITE, '_astro', 'home.wchYPtRT.js')
JS_LISTS = ['Ut', 'Yt', 'nn', 'xn', 'Sn']


def norm(t):
    return ' '.join(html.unescape(t).split())


def translatable(t):
    return bool(LETTER.search(t)) and t not in KEEP and not re.fullmatch(r'\{\{\w+\}\}', t)   # {{LANGS}} is a build placeholder


def tokens(s):
    """Yield ('tag'|'text'|'raw', start, end) over the HTML; script/style bodies are 'raw'."""
    pos, n, skip = 0, len(s), None
    for m in TAG.finditer(s):
        if m.start() > pos:
            yield ('raw' if skip else 'text', pos, m.start())
        tag = m.group(0)
        name = re.match(r'</?\s*([a-zA-Z0-9]+)', tag)
        name = name.group(1).lower() if name else ''
        if skip:
            if tag.lower().startswith('</' + skip):
                skip = None
        elif name in ('script', 'style') and not tag.startswith('</'):
            skip = name
        yield ('tag', m.start(), m.end())
        pos = m.end()
    if pos < n:
        yield ('text', pos, n)


def collect(s):
    """List of (kind, start, end, key, where) for every translatable text node and attribute value."""
    items, where = [], 'head'
    masked = COMMENT.sub(lambda m: ' ' * len(m.group(0)), s)   # same length, so offsets still point into s
    for kind, a, b in tokens(masked):
        if kind == 'text':
            k = norm(masked[a:b])      # comments are blank here, so they are never taken for text
            if k and translatable(k):
                items.append(('text', a, b, k, where))
        elif kind == 'tag':
            tag = s[a:b]
            if tag.startswith('<section'):  # (tags are read from the original text; comments were blanked above)
                m = re.search(r'\sid="([^"]+)"', tag) or re.search(r'class="([^" ]+)', tag)
                where = m.group(1) if m else where
            elif tag.startswith('<nav') or 'nav_legal' in tag[:200]:
                where = 'nav'
            elif tag.startswith('<main'):
                where = 'hero'
            for attr in ATTRS:
                for m in re.finditer(r'\s' + attr + r'="([^"]*)"', tag):
                    v = norm(m.group(1))
                    if v and translatable(v) and not v.startswith(('width=', 'text/', 'http', '#')) and not re.search(r'\.(jpg|png|svg|webp)$', v) and len(v) < 600:
                        items.append(('attr', a + m.start(1), a + m.end(1), v, where))
    return items


def js_lists():
    """The rotating lists inside home.js, evaluated to plain JSON by node (the script stays the single source of truth)."""
    t = open(HOME_JS, encoding='utf-8').read()
    out = {}
    for name in JS_LISTS:
        marker = name + '=(globalThis.__I18N&&globalThis.__I18N.' + name + ')||'
        i = t.index(marker) + len(marker)
        depth = 0
        for j in range(i, len(t)):
            depth += (t[j] == '[') - (t[j] == ']')
            if depth == 0:
                break
        lit = t[i:j + 1]
        out[name] = json.loads(subprocess.run(['node', '-e', 'console.log(JSON.stringify(eval(process.argv[1])))', lit],
                                              capture_output=True, text=True, encoding='utf-8', check=True).stdout)
    out['byHand'] = 'by hand'
    out['toolOne'] = 'tool to switch'
    out['toolMany'] = 'tools to switch'
    return out


def access_messages():
    s = open(SOURCES['access'], encoding='utf-8').read()
    body = re.search(r'const MSG = \{(.*?)\n\};', s, re.S).group(1)
    return {k: v.replace("\\'", "'") for k, v in re.findall(r"^\s*(\w+):\s*'((?:[^'\\]|\\.)*)'", body, re.M)}


def build_source():
    strings, order = {}, []
    for page in ('index', 'access'):
        s = open(SOURCES[page], encoding='utf-8').read()
        items = collect(s)
        keys = [it[3] for it in items]
        for n, (kind, a, b, k, where) in enumerate(items):
            if k not in strings:
                strings[k] = {'en': k, 'where': page + ':' + where, 'before': keys[n - 1] if n else '', 'after': keys[n + 1] if n + 1 < len(keys) else ''}
                order.append(k)
    msg = access_messages()
    for key, v in msg.items():
        if v not in strings:
            strings[v] = {'en': v, 'where': 'access:script message (' + key + ')', 'before': '', 'after': ''}
            order.append(v)
    return {'strings': [strings[k] for k in order], 'js': js_lists(), 'access_messages': msg}


if __name__ == '__main__':
    src = build_source()
    json.dump(src, open(os.path.join(ROOT, 'source-en.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(src['strings']), 'strings;', 'js lists:', ', '.join(src['js']))
