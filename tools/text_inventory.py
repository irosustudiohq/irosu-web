"""List every visible text node (and alt/aria-label/title/content attributes) of an HTML page, grouped by
top-level <section>, with a running index, so copy can be planned and replaced precisely.

    python text_inventory.py page.html > inventory.txt
"""
import sys
from html.parser import HTMLParser

SKIP = {'script', 'style', 'noscript'}
ATTRS = ('alt', 'aria-label', 'title', 'placeholder', 'content', 'data-text')


class Inv(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.section, self.n, self.skip = [], 'head', 0, 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in SKIP:
            self.skip += 1
        if tag == 'section':
            label = a.get('id') or (a.get('class') or '').split(' ')[0]
            self.section = label
            print(f'\n===== SECTION {label}')
        if tag == 'footer':
            print('\n===== FOOTER')
        for k in ATTRS:
            v = a.get(k)
            if v and v.strip() and not v.startswith(('width=', 'text/')) and len(v) < 400:
                print(f'  [{tag}@{k}] {v.strip()}')

    def handle_endtag(self, tag):
        if tag in SKIP:
            self.skip -= 1

    def handle_data(self, data):
        t = ' '.join(data.split())
        if t and not self.skip:
            self.n += 1
            print(f'{self.n:4d} {t}')


Inv().feed(open(sys.argv[1], encoding='utf-8').read())
