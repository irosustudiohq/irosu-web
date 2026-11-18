"""Builds the Irosu website from the downloaded Loopsii page WITHOUT touching its layout or animation code.

Only text, links, colours and asset paths change. Every change is an exact (old -> new) replacement checked
against the expected number of matches, so a typo or a template update fails loudly instead of silently
leaving the old copy. The full list of changes is also written to CHANGES-generated.md (before -> after).

    python build_irosu_site.py
Reads   C:/Users/edete/Desktop/clone/irosu pick3/loopsii.com   (the untouched reference)
Writes  C:/Users/edete/Desktop/clone/irosu-site                 (index.html + the few scripts with colours)
Media (Lotties, videos, images) are made by make_irosu_lotties.py / make_irosu_media.py.
"""
import json, os, re, shutil, sys
from html import escape

REF = r'C:\Users\edete\Desktop\clone\irosu pick3\loopsii.com'
OUT = r'C:\Users\edete\Desktop\clone\irosu-site'

# ---- things only the founder can give: placeholders, listed in CHANGES.md ----
CTA_URL = 'access.html'                               # the waitlist page (FORM_ENDPOINT inside it = where sign-ups go)
SITE_URL = 'https://heronaiapp.com/irosu/'            # TODO confirm the live address
SOCIAL = {'linkedin': '#', 'x': '#', 'instagram': '#'}  # TODO real profiles
CTA = 'Join the waitlist'

# ---- brand colour: Loopsii lime -> Irosu lavender (same lightness, so black text stays readable) ----
COLOURS = [('#c4f041', '#b8aeff'), ('#C4F041', '#B8AEFF'), ('#e0f661', '#d3ccff'), ('#E0F661', '#D3CCFF'),
           ('#e2f298', '#ddd8ff'), ('#E2F298', '#DDD8FF'), ('196,240,65', '184,174,255'), ('196, 240, 65', '184, 174, 255')]

log = []
COLLECT = bool(os.environ.get('COLLECT'))   # COLLECT=1: list every mismatch instead of stopping at the first
failures = []
_exit = SystemExit


def SystemExit(msg):  # noqa: N802  (shadowed on purpose so every check below can be collected)
    if COLLECT:
        failures.append(msg)
        raise _Skip()
    return _exit(msg)


class _Skip(Exception):
    pass


def rep(s, old, new, n=None, section=''):
    try:
        return _rep(s, old, new, n, section)
    except _Skip:
        return s


def _rep(s, old, new, n=None, section=''):
    """Replace all occurrences of old; n = expected count (None = at least one)."""
    c = s.count(old)
    if c == 0:  # the page stores some quotes as entities: try those spellings
        for v in (old.replace("'", '&#39;'), old.replace('"', '&quot;'), old.replace("'", '&#39;').replace('"', '&quot;')):
            if v != old and s.count(v):
                old, c = v, s.count(v)
                break
    if (n is None and c == 0) or (n is not None and c != n):
        raise SystemExit(f'[{section}] expected {n if n is not None else ">=1"} of {old!r}, found {c}')
    log.append((section, old, new, c))
    return s.replace(old, new)


def scoped(s, start, end, pairs, section, optional=False):
    """Apply (old, new) replacements only between the first `start` marker and the following `end` marker."""
    a = s.find(start)
    b = s.find(end, a + len(start))
    if a < 0 or b < 0:
        raise SystemExit(f'[{section}] scope markers not found: {start!r} .. {end!r}')
    part = s[a:b]
    for old, new in pairs:
        if optional and old not in part and old.replace("'", '&#39;') not in part:
            continue
        part = rep(part, old, new, None, section)
    return s[:a] + part + s[b:]


def rep_after(s, anchor, old, new, section=''):
    try:
        return _rep_after(s, anchor, old, new, section)
    except _Skip:
        return s


def _rep_after(s, anchor, old, new, section=''):
    """Replace the first occurrence of old that comes after anchor (for repeated words like 'Up next')."""
    a = s.find(anchor)
    if a < 0:
        raise SystemExit(f'[{section}] anchor not found: {anchor!r}')
    i = s.find(old, a)
    if i < 0:
        raise SystemExit(f'[{section}] {old!r} not found after {anchor!r}')
    log.append((section, f'{old}  (after "{anchor[:40]}")', new, 1))
    return s[:i] + new + s[i + len(old):]


def T(t):
    """Text as it appears in the HTML (apostrophes and ampersands are escaped there)."""
    return t.replace('&', '&amp;')


def build():
    s = open(os.path.join(REF, 'index.html'), encoding='utf-8').read()

    # ------------------------------------------------------------------ head / meta
    S = 'head'
    s = rep(s, '<title>Loopsii: the all-in-one app for freelancers</title>',
            '<title>Irosu: colour-fill assist for anime finishing</title>', 1, S)
    desc_old = 'Loopsii is the all-in-one app for freelancers: CRM, project management, time tracking, AI notes from client calls and dictation. 14-day free trial, no card needed.'
    desc_new = ("Irosu paints a whole anime cut from one painted key frame and flags every area it isn't sure about. "
                "Gap closing, unpainted check, check mode and layered PSD export, for finishing (仕上げ) studios.")
    s = rep(s, desc_old, escape(desc_new, quote=True), 3, S)
    s = rep(s, 'content="Loopsii: the all-in-one app for freelancers"', 'content="Irosu: colour-fill assist for anime finishing"', 2, S)
    s = rep(s, '<meta property="og:site_name" content="Loopsii">', '<meta property="og:site_name" content="Irosu">', 1, S)
    s = rep(s, 'https://loopsii.com/og.jpg?v=3', SITE_URL + 'og.jpg', 2, S)
    s = rep(s, 'content="https://loopsii.com/"', f'content="{SITE_URL}"', None, S)
    s = rep(s, 'content="@loopsiiapp"', 'content=""', None, S)
    s = re.sub(r'<link rel="canonical" href="https://loopsii\.com/"\s*/?>', f'<link rel="canonical" href="{SITE_URL}">', s)

    # The mirror saved the main script under a second name; the page loaded that copy while the other
    # scripts import the original, so it ran twice (two logos in the loader). Same bytes, one name.
    s = rep(s, 'Layout.astro_astro_type_script_index_0_lang.CYij4Z1e668d.js', 'Layout.astro_astro_type_script_index_0_lang.CYij4Z1e.js', 1, 'scripts')

    # ------------------------------------------------------------------ links / CTAs (everywhere)
    S = 'links'
    s = rep(s, 'https://app.loopsii.com/sign-up', CTA_URL, None, S)
    s = rep(s, '>Sign up for free<', f'>{CTA}<', None, S)
    s = rep(s, '>Try it free for 14 days<', f'>{CTA}<', None, S)
    s = rep(s, 'why-loopsii', 'why-irosu', 4, S)
    s = rep(s, 'href="privacy.html"', 'href="#"', None, S)          # TODO Irosu privacy page
    s = rep(s, 'href="terms.html"', 'href="#"', None, S)            # TODO Irosu terms page
    s = rep(s, 'href="https://www.linkedin.com/company/loopsii/"', f'href="{SOCIAL["linkedin"]}"', 1, S)
    s = rep(s, 'href="https://x.com/loopsiiapp"', f'href="{SOCIAL["x"]}"', 1, S)
    s = rep(s, 'href="https://www.instagram.com/loopsii.app/"', f'href="{SOCIAL["instagram"]}"', 1, S)
    # structured data (search engines): Loopsii's organisation block -> Irosu's
    ld_old = re.search(r'<script type="application/ld\+json">.*?</script>', s, re.S).group(0)
    ld = [{'@context': 'https://schema.org', '@type': 'SoftwareApplication', 'name': 'Irosu', 'url': SITE_URL,
           'applicationCategory': 'DesignApplication', 'operatingSystem': 'Windows',
           'description': desc_new}]
    s = rep(s, ld_old, '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + '</script>', 1, S)

    # ------------------------------------------------------------------ nav + footer card
    S = 'nav'
    s = rep(s, 'aria-label="Loopsii"', 'aria-label="Irosu"', None, S)
    s = rep(s, '>Why Loopsii<', '>Why Irosu<', None, S)
    s = rep(s, '>Start your loop here<', '>Start your first cut here<', 1, S)
    s = rep(s, '>One account, all your clients, one simple workflow<', '>One key frame, the whole cut, one calm check<', 1, S)
    s = rep(s, '© Loopsii 2026', '© Irosu 2026', 1, S)

    # ------------------------------------------------------------------ hero
    S = 'hero'
    s = rep(s, 'Loopsii, the all-in-one app for freelancers', 'Irosu, the colour-fill app for anime finishing', None, S)
    words = [('invoices', 'colour fill'), ('time tracking', 'gap checks'), ('client calls', 'colour charts'),
             ('proposals', 'key frames'), ('QA rounds', 'check rounds'), ('recordings', 'shadows'), ('contracts', 'highlights'),
             ('follow-ups', 'retakes'), ('clients', 'flags'), ('deliverables', 'PSD exports'), ('projects', 'cuts')]
    s = scoped(s, 'hero_titles', '<section class="intro', [(f'>{o}<', f'>{n}<') for o, n in words], S)
    s = rep(s, 'The all-in-one app for freelancers. Like a personal manager, it keeps your clients, calls, tasks and hours connected.',
            T("The colour-fill app for anime finishing (仕上げ). Paint one key frame and Irosu fills the rest of the cut, flagging every area it isn't sure about."), None, S)
    for old, new in [('Edits', 'Fill'), ('Time management', 'Gap&nbsp;check'), ('Communication', 'Colour&nbsp;chart'), ('Invoices', 'Export')]:
        s = rep_after(s, 'hero_label', f'>{old}<', f'>{new}<', S)

    # ------------------------------------------------------------------ intro
    S = 'intro'
    s = rep(s, '>What is Loopsii<', '>What is Irosu<', None, S)
    s = rep(s, 'Loopsii helps freelance designers and developers manage their entire workflow in one app. There’s less to organize and more time to do the work.',
            'Irosu helps finishing studios colour every frame of a cut from one painted key frame. There’s less filling by hand and more time for the frames that need a painter.', None, S)
    s = rep(s, 'Every project follows a familiar loop. Loopsii keeps it moving, so you don’t have to think about what comes next.',
            'Every cut follows the same loop: key, fill, check, deliver. Irosu keeps it moving, so you always know what comes next.', None, S)

    # ------------------------------------------------------------------ distraction
    S = 'distraction'
    s = rep(s, '>Too many things pulling you away<', '>Too many small fixes pulling you away<', None, S)
    s = rep(s, '>from the work that actually matters<', '>from the frames that actually matter<', None, S)
    pills = [('Forgot to start the timer', 'Missed a gap in the hair'), ("Where's that file?", 'Which one is the 影?'),
             ('How long was that call?', 'Speck left on frame 37'), ('Did I send that invoice?', 'Did the chart change again?'),
             ('What changed last round?', 'Retake from the director'), ('Following up. Again.', 'Line not closed. Again.'),
             ('Is this profitable?', 'Hat or hair?'), ('"Just one more change"', '"Same fill, 48 frames"'),
             ("Where's that client task?", 'Check every frame by eye'), ('Chasing feedback', 'Export the PSD layers'),
             ('Did I log those hours?', 'Deadline is tomorrow')]
    for old, new in pills:
        o = old.replace('"', '&quot;') if f'>{old}<' not in s else old
        s = rep(s, f'>{o}<', f'>{new}<', None, S)
    s = rep(s, '/_image?href=%2F_astro%2Fcover.DgwvykuR.png&amp;w=640&amp;h=367&amp;q=70&amp;f=webp&amp;dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz',
            '_astro/irosu-cover.webp', None, S)

    # ------------------------------------------------------------------ app demo (desktop) + phone dashboard
    S = 'app-demo'
    s = rep(s, "<span>That's why Loopsii</span>", "<span>That's why Irosu</span>", None, S)
    s = rep(s, "That's why Loopsii exists", "That's why Irosu exists", None, S)
    # Loopsii's own app (a Svelte demo) is replaced by footage of the real Irosu app; the frame, plates,
    # zoom and pin animation stay exactly as they were.
    s = rep(s, '<div class="adm-canvas"></div>',
            '<div class="adm-canvas"><video class="irosu-demo" src="video/irosu-app.mp4" poster="_astro/irosu-app-poster.jpg" '
            'muted loop playsinline autoplay preload="metadata" aria-label="The Irosu desktop app painting a cut from one key frame"></video></div>', 1, S)
    s = rep(s, '<div data-module="AppDemoMount" data-now="1794755697885" data-armed><div class="adm" aria-hidden="true"><div class="adm-zoom">',
            '<div data-irosu-demo><div class="adm"><div class="adm-zoom">', 1, S)
    s = rep(s, '</style></head>',
            '<style>[data-irosu-demo] .adm-zoom{display:block}[data-irosu-demo] .adm-frame{padding:12px;border-radius:30px;'
            'background:linear-gradient(var(--color-main),var(--color-main)) 0 0/100% 100%;box-shadow:0 0 0 1px #0000000d}'
            '[data-irosu-demo] .adm-canvas{width:min(1240px,calc(100vw - 120px));height:auto;aspect-ratio:16/9;background:#f4f4f2}'
            '.irosu-demo{display:block;width:100%;height:100%;object-fit:cover}'
            '@media (max-width:1024px){[data-irosu-demo]{display:none}}</style></head>', 1, S)
    dash = [('>Dashboard<', '>Cuts<'), ('>Start Timer<', '>Paint cut<'), ('>New<', '>Import<'),
            ('>Scope<', '>Flag<'), ('>What<', '>Area<'), ('>Add a dark theme across all screens<', '>Jacket trim, frame F04<'),
            ('>Why<', '>Why<'), ('>Client requested after design review<', '>Two close colours: Colour 4 or 11<'),
            ('>When<', '>Frame<'), ('>Jul 2, 2026<', '>F04 · area 118<'), ('>Cost<', '>Pick<'), ('>+$180<', '>1 or 2<'),
            ('>Timeline<', '>Scope<'), ('>+3 days<', '>this frame on<'),
            ('>Feedback<', '>Check<'), ('>Client left 2 comments on Homepage v2<', '>Director left 2 notes on C112<'),
            ('>awaiting your reply<', '>waiting for you<'), ('>New file uploaded to Kickoff checklist<', '>New line frames added to C113<'),
            ('>Kestrel approved the timeline<', '>C111 approved, 24 frames<'),
            ('>Money<', '>Frames<'), ('>Paid<', '>Done<'), ('>$3,200<', '>32<'), ('>8 invoices<', '>approved<'),
            ('>Awaiting<', '>Flagged<'), ('>$1,850<', '>18<'), ('>3 pending<', '>to check<'),
            ('>Overdue<', '>Sent back<'), ('>$980<', '>9<'), ('>2 overdue<', '>retakes<'),
            ('>Kestrel Studio<', '>C111<'), ('>#INV-0428<', '>24 frames<'), ('>Nova Labs<', '>C112<'), ('>#INV-0431<', '>10 frames<'),
            ('>Orbit Agency<', '>C113<'), ('>#INV-0433<', '>18 frames<'), ('>Closing<', '>Check<'), ('>Hours<', '>Fill<'),
            ('>$92/hr<', '>92%<'), ('>effective rate<', '>areas filled<'), ('>Deal<', '>Key<'), ('>Invoice<', '>Export<'),
            ('>#7684<', '>C112<'), ('>Homepage redesign<', '>Layered PSD<'), ('>unpaid<', '>ready<'),
            ('>$1,200<', '>9 files<'), ('>Pricing page<', '>Lines layer<'), ('>$180<', '>on<'), ('>Dark theme add-on<', '>Flags layer<'),
            ('>Subtotal<', '>Total<'), ('>$1,560<', '>27 layers<'), ('>Create + send<', '>Export<'), ('>Mark as paid<', '>Open folder<'),
            ('>2 days ago<', '>today<'), ('>Discovery<', '>C112<'), ('>1 hour 6 min<', '>10 frames<'), ('>Recap<', '>Flags<'),
            ('>Activity<', '>Layers<'), ('>Transcript<', '>Reference<'), ('>Goals, scope &amp; timeline walkthrough<', '>Key frame painted, chart set<'),
            ('>Kickoff<', '>Key<'), ('>Brand guidelines<', '>Line frames<'), ('>uploaded<', '>ready<'),
            ('>Logo files (SVG + PNG)<', '>Painted key (PSD)<'), ('>waiting<', '>to do<'), ('>Website copy<', '>Colour chart<'),
            ('>CMS / hosting access<', '>Export settings<'), ('>Balance<', '>Progress<')]
    s = scoped(s, '<section class="dashboard', '<section id="why-irosu"', dash, 'phone dashboard', optional=True)
    s = rep(s, '_image0a74?href=%2F_astro%2Fphoto-1.V5nItHYV.png&amp;w=535&amp;h=538&amp;q=80&amp;f=webp&amp;dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz', '_astro/irosu-photo-1.webp', None, S)
    s = rep(s, '_image6690?href=%2F_astro%2Fphoto-2.DhQXSHas.png&amp;w=535&amp;h=535&amp;q=80&amp;f=webp&amp;dpl=dpl_74aUw43o7S3n9NFJ1ZxBM24TaWuz', '_astro/irosu-photo-2.webp', None, S)

    # ------------------------------------------------------------------ why (the "tax" grid)
    S = 'why'
    s = rep(s, '>the copy-paste tax<', '>the frame-by-frame tax<', None, S)
    s = rep(s, '>Your workflow shouldn’t cost this much<', '>Your finish shouldn’t take this long<', None, S)
    # Each card is one manual pass per frame (value 1). Names alternate English / Japanese studio words;
    # the template sums the values into the big counter, then counts down to the Irosu card.
    apps = [('notion', 'Notion', 'Fill', '塗りつぶし', 'Docs &amp; task lists', 'every area, by hand', '$120/yr'),
            ('loom', 'Loom', 'Gaps', '隙間閉じ', 'Screen recordings', 'close open lines', '$180/yr'),
            ('bonsai', 'Bonsai', 'Chart', '色指定', 'Invoices &amp; contracts', 'look up each colour', '$228/yr'),
            ('toggl', 'Toggl Track', 'Specks', '塗り残し', 'Time tracking', 'find what was missed', '$108/yr'),
            ('granola', 'Granola', 'Retakes', 'リテイク', 'AI meeting notes', 'redo after changes', '$168/yr'),
            ('wispr', 'Wispr Flow', 'Export', '書き出し', 'Voice dictation', 'layers, frame by frame', '$144/yr')]
    for key, name, nname, jname, sub, nsub, price in apps:
        m = re.search(rf'data-app="{key}" data-price="\d+" data-brands="[^"]*"', s)
        if not m:
            raise SystemExit(f'[{S}] card data-app="{key}" not found')
        brands = escape(json.dumps([[nname, 1], [jname, 1]], ensure_ascii=False), quote=True)
        s = rep(s, m.group(0), f'data-app="{key}" data-price="1" data-brands="{brands}"', 1, S)
        s = scoped(s, 'id="why-irosu"', '<section class="highlights', [(f'>{name}<', f'>{nname}<'), (f'>{sub}<', f'>{nsub}<'),
                                                                           (f'>{price}<', '>by hand<')], S)
    for old, new in [('pick the client', 'pick the colour'), ('&amp; project again', 'from the chart again'),
                     ('copy the scope', 'close the gap'), ('into the contract', 'before you fill'),
                     ('log the call', 'find the speck'), ('time by hand', 'by eye'),
                     ('re-type the hours', 'export the layers'), ('on the invoice', 'frame by frame'),
                     ('you keep', 'you keep'), ('in sync', 'consistent')]:
        if old != new:
            s = rep(s, f'>{old}<', f'>{new}<', None, S)
    s = rep_after(s, 'id="why-irosu"', '<span class="stack_figure">$</span><span data-total>948</span>',
                  '<span class="stack_figure"></span><span data-total>6</span>', S)
    s = rep_after(s, 'id="why-irosu"', '>a year<', '>passes a frame<', S)
    s = rep_after(s, 'id="why-irosu"', '>logins<', '>tools to switch<', S)
    s = rep_after(s, 'id="why-irosu"', '>Your whole stack,<', '>Your whole finish,<', S)
    s = rep_after(s, 'id="why-irosu"', '>Everything on it,<', '>Every frame,<', S)
    for old, new in [('Client project', 'Key frame'), ('Call', 'Fill'), ('Notes', 'Gaps'), ('Tasks', 'Chart'),
                     ('Hours', 'Flags'), ('Recording', 'Check')]:
        s = rep_after(s, 'id="why-irosu"', f'>{old}<', f'>{new}<', S)
    s = rep_after(s, 'id="why-irosu"', '>Invoice<', '>Export<', S)
    s = rep_after(s, 'id="why-irosu"', '>Loopsii<', '>Irosu<', S)
    s = rep_after(s, 'id="why-irosu"', '>All of the above<', '>All of the above<', S)
    s = rep_after(s, '>All of the above<', '<span class="stack_figure">$</span><span data-loopsii-price>120</span><span class="stack_figure">/yr</span>',
                  '<span class="stack_figure"></span><span data-loopsii-price>1</span><span class="stack_figure">&nbsp;key</span>', S)
    s = rep(s, '>Move in without leaving anything behind<', '>Bring the cut in as it is<', None, S)
    s = rep(s, 'Bring your recordings, meeting notes, docs and hours with you — dates, projects and links intact. Import twice, get no duplicates.',
            'Drop in line frames (PNG, TGA, TIFF, PSD), the painted key and the colour chart. Frame numbers, sizes and layers are read for you.', None, S)

    # ------------------------------------------------------------------ highlights (6 feature cards)
    S = 'highlights'
    s = rep(s, '>Everything around your work, handled<', '>Everything around the fill, handled<', None, S)
    cards = [
        ('Know where your money stands', 'Paint the whole cut from one key',
         'See what’s paid, invoiced, and still unbilled, and how close you are to your income goal.',
         'Paint one key frame. Irosu matches every area in the other frames by shape and neighbours, and fills it.',
         ['Paid &amp; outstanding income', 'Income goals', 'Project profitability', 'Unbilled work'],
         ['Fill from the painted key', 'Matched by shape and neighbours', 'Shadows (影) and highlights (ハイ)', 'Progress for every frame']),
        ('Keep clients in the loop', 'Every unsure area, flagged',
         'Give clients one place to follow progress, review deliverables, and share feedback.',
         'Areas Irosu isn’t sure about get a flag with the two likely colours. Accept with A, or pick with 1 or 2.',
         ['Project progress', 'Deliverables &amp; files', 'Feedback &amp; approvals', 'Shared project updates'],
         ['Unsure colour', 'Gap closed', 'Matched by shape', 'Unpainted']),
        ('Know when you can take on more', 'Check the cut against the key',
         'See your projects and availability together, so you can spot overlaps and plan ahead.',
         'Side by side with the key, overlaid or flipped. Approve the clean frames in one go and send the rest back with a note.',
         ['Project schedules', 'Workload &amp; availability', 'Timeline overlaps', 'Future capacity'],
         ['Side by side with the key', 'Overlay and flip', 'Approve clean frames', 'Send back with a note']),
        ('Make sure extra work gets counted', 'Close gaps before they leak',
         'Capture change requests as they happen and know what’s included in scope, and what should be billed.',
         'Open lines are closed before the fill, so one gap never floods a whole area. Every closed gap is shown so you can confirm it.',
         ['Change requests', 'Included vs billable work', 'Scope history', 'Extra work tracking'],
         ['Gap closing (隙間閉じ)', 'Leak detection', 'Max gap per cut', 'Confirm or skip each one']),
        ('Put your AI to work', 'Your colour chart, always open',
         'Connect Claude, Codex, or any AI agent to your workspace. Your meetings, tasks, and hours — readable by the tools you already think with.',
         'Every part with its normal, shadow and highlight colours, in English and Japanese. Pick from the key, or import .aco, CSV or JSON.',
         ['Meetings &amp; transcripts', 'Tasks, time &amp; clients', 'MCP server', 'CLI for scripts &amp; agents'],
         ['Normal / 影 / ハイ per part', 'Pick colours from the key', 'Import and export .aco', 'Live preview on the key']),
        ('Talk instead of typing', 'Export straight into your pipeline',
         'Hold fn and dictate emails, briefs, and prompts in any app on your Mac, minus the ums and uhs.',
         'Layered PSD for CLIP STUDIO and Photoshop, 32-bit TGA for compositing, or indexed PNG, named the way your studio names files.',
         ['Works wherever you can type', 'Your clients’ names, spelled right', 'Emails laid out like emails', 'Double-press fn to go hands-free'],
         ['Layered PSD: paint, lines, flags', '32-bit TGA with alpha', 'Indexed PNG from the chart', 'Your file-name pattern']),
    ]
    for title, ntitle, desc, ndesc, bullets, nbullets in cards:
        s = rep(s, f'>{title}<', f'>{ntitle}<', None, S)
        s = rep(s, f'>{desc}<', f'>{ndesc}<', None, S)
        s = scoped(s, '<section class="highlights', '<section class="folders',
                   [(f'>{b}<', f'>{nb}<') for b, nb in zip(bullets, nbullets)], S)
    # card 1 mini UI: income gauge -> cut progress (numbers are animated by the template from these values)
    a1 = '>Paint the whole cut from one key<'
    for old, new in [('>Month income<', '>Areas filled<'), ('ui-32 font-bold">$<', 'ui-32 font-bold"><'),
                     ('>$10,000<', '>10,000<'), ('</span> goal<', '</span> areas<'),
                     ('>Paid <', '>Filled <'), ('>$3.80k<', '>3.80k<'), ('>Invoiced <', '>Matched <'), ('>$2.00k<', '>2.00k<'),
                     ('>Unbilled <', '>Flagged <'), ('>$1.30k<', '>1.30k<'), ('>In conv. <', '>Gaps <'), ('>$1.15k<', '>1.15k<'),
                     ('>Gap <', '>Left <'), ('>$1.75k<', '>1.75k<')]:
        s = rep_after(s, a1, old, new, S)
    # card 2 mini UI: board -> flags by state
    a2 = '>Every unsure area, flagged<'
    for old, new in [('>Chapters<', '>Flags<'), ('>Not Started<', '>Open<'), ('>Hight<', '>High<'), ('>In Progress<', '>Reviewing<'),
                     ('>Client Approval<', '>Director<'), ('>Client<', '>Director<')]:
        s = rep_after(s, a2, old, new, S)
    # card 3 mini UI: timeline -> cuts in check
    a3 = '>Check the cut against the key<'
    for old, new in [('>Projects<', '>Cuts<'), ('>timeline<', '>in check<'), ('>Free<', '>Clean<'), ('>60<', '>6<'),
                     ('</span> hrs / mo<', '</span> of 10 frames<'), ('>Can start <', '>Ready by <'), ('>Sep 8<', '>Fri<'),
                     ('>Rebrand · Project 001<', '>C112 · Fill<'), ('>Landing · Project 002<', '>C112 · Check<'), ('>App icons<', '>C113 · Retake<'),
                     ('>Jul<', '>F02<'), ('>Aug<', '>F04<'), ('>Sep<', '>F06<'), ('>Oct<', '>F08<'), ('>Nov<', '>F10<')]:
        s = rep_after(s, a3, old, new, S)
    # card 4 mini UI: change requests -> closed gaps
    a4 = '>Close gaps before they leak<'
    for old, new in [('>Change<', '>Closed<'), ('>requests<', '>gaps<'),
                     ('>One more pass on the homepage?<', '>Hair line, 11 px<'), ('>via chat · Jul 1<', '>frame F04 · automatic<'), ('>included<', '>closed<'),
                     ('>Can we add a pricing page?<', '>Sleeve edge, 13 px<'), ('>comment on Figma · Jul 2<', '>frame F06 · automatic<'), ('>billable · $180<', '>closed · check<'),
                     ('>Also add a dark theme<', '>Possible leak, 1,488 px<'), ('>caught on call · Jul 2 · <', '>frame F09 · <'), ('>play 12:04<', '>zoom in<'),
                     ('>billable · auto-logged<', '>flagged · not filled<')]:
        s = rep_after(s, a4, old, new, S)
    # card 5 mini UI: AI chat -> chart lookup
    a5 = '>Your colour chart, always open<'
    for old, new in [('>Claude ·<', '>Colour chart ·<'), ('>Connected to Loopsii<', '>C112 · 16 parts<'),
                     ('>What did we agree with Anna about the pricing page?<', '>Which colour is the hair shadow?<'),
                     ('>loopsii<', '>irosu<'), ('>search<', '>chart<'), ('>loopsii<', '>irosu<'), ('>get_meeting<', '>pick<'),
                     ('>Anna signed off on a three-tier pricing page.<', '>Hair 影 is Colour 4.<'),
                     ('>“Let’s add a pricing page — three tiers, no calculator. Keep it to one screen.”<', '>“Hair: N Colour 1, 影 Colour 4, ハイ Colour 11.”<'),
                     ('>Anna · Kickoff call · Jul 2 · play 12:04<', '>Chart · C112 · part 3 · from the key<'), ('>from transcript<', '>from the chart<')]:
        s = rep_after(s, a5, old, new, S)
    # card 6 mini UI: dictation -> export
    a6 = '>Export straight into your pipeline<'
    for old, new in [('>Dictation<', '>Export<'), ('>Hi<', '>Export<'), ('>Anna,<', '>nine<'), ('>the<', '>frames<'), ('>pricing<', '>as<'),
                     ('>page<', '>layered<'), ('>is<', '>PSD<'), ('>ready<', '>for<'), ('>for<', '>CLIP<'), ('>you<', '>STUDIO,<'),
                     ('>to<', '>flags<'), ('>review.<', '>hidden.<'), ('>Mail<', '>Export<'), ('>Re: Pricing page<', '>C112 · Layered PSD<'),
                     ('>Hi Anna,<', '>9 frames written<'),
                     ('>The pricing page is ready for you to review. Let me know if anything needs changing.<', '>export/C112/ with paint, lines and flag layers. The flag layer is hidden.<'),
                     ('>Thanks,<', '>Open folder<'), ('>Stas<', '>✓<')]:
        s = rep_after(s, a6, old, new, S)

    # ------------------------------------------------------------------ folders
    S = 'folders'
    s = rep(s, '> Go back to doing the work <', '> Go back to the frames that matter <', 1, S)
    s = rep(s, 'Loopsii handles the rest. Set it up once, stop rebuilding your process for every new client.',
            'Irosu fills the routine areas. Set the chart once per series and stop filling the same colours cut after cut.', None, S)
    s = rep(s, '>Project<', '>Cut<', None, S)

    # ------------------------------------------------------------------ features (4 stages)
    S = 'features'
    s = rep(s, '>Everything you need, at every project stage.<', '>Everything you need, at every stage of the cut.<', None, S)
    stages = [('Negotiation', 'Import', 'Turn a conversation', 'Bring the cut', 'into a project', 'in as it is'),
              ('Working', 'Paint', 'Keep every', 'Keep every', 'project moving', 'frame moving'),
              ('Closure', 'Check', 'Wrap up, deliver,', 'Review, approve', 'and get paid', 'and deliver'),
              ('Planning', 'Studio', 'Know what&#39;s', 'Built for', 'coming next', 'the whole studio')]
    for st, nst, l1, n1, l2, n2 in stages:
        s = rep(s, f'>{st}<', f'>{nst}<', None, S)
        s = rep(s, f'aria-label="{st}"', f'aria-label="{nst}"', None, S)
        if l1 in s or f'>{l1}<' in s:
            s = rep(s, l1, n1, None, S) if l1 != n1 else s
        s = rep(s, l2, n2, None, S)
    feats = [('Clients &amp; projects', 'Cuts &amp; episodes', 'Every client and project, organized by stage.', 'Every cut with its frames, flags and status at a glance.'),
             ('Proposal builder', 'Import checks', 'Proposals with line-item estimates, built from templates.', 'Frame numbers, sizes and file types read on drop, with fixes inline.'),
             ('Agreements', 'Colour chart setup', 'Contracts clients sign in the browser, with an audit trail.', 'Parts with N / 影 / ハイ, picked from the key or imported.'),
             ('Client portal', 'Series charts', 'One place where clients follow progress and approve work.', 'One colour chart reused across every cut of a series.'),
             ('Screen recordings', 'Fill from the key', 'Loom-style recordings with a link, transcript and summary.', 'Every area matched by shape and neighbours, then filled.'),
             ('Ask Loopsii', 'Lasso fill', 'Answers from every call, doc and project.', 'Drag around a group of areas and fill them in one go.'),
             ('AI Meeting Assistant', 'Gap closing', 'Records any call, no bot. Then notes and suggested tasks.', 'Open lines closed before the fill, each one shown for review.'),
             ('Time tracking', 'Flags', 'Timer and timesheets, tied to projects and tasks.', 'Unsure areas flagged with their two likely colours.'),
             ('Gantt timeline &amp; milestones', 'Unpainted check', 'Visual schedule sized for solo work, not 50-person teams.', 'Missed specks shown in magenta before anyone else sees them.'),
             ('Dictation', 'Fix forward', 'Hold fn, talk, and clean text appears in any app on your Mac.', 'Fix an area once and carry it through the rest of the cut.'),
             ('Change requests', 'Colour trace lines', 'Every extra request logged, scoped and billable.', 'Coloured trace lines (色トレス) filled with the right colour.'),
             ('Time reports', 'Check mode', 'Summary and detailed reports, exported to PDF or CSV.', 'Side by side, overlay or flip against the key.'),
             ('Invoices', 'Export', 'Invoices from tracked time, exported as PDF.', 'Layered PSD, 32-bit TGA or indexed PNG with your naming.'),
             ('Deliverables page', 'Director review', 'Final files with versions, shared in the client portal.', 'Send a cut for approval with a note on every frame.'),
             ('Pre-meeting briefs', 'English and 日本語', 'A recap of past calls and open tasks before each meeting.', 'The whole app in English or Japanese, in studio words.'),
             ('Pipeline', 'Team seats', 'Deals by stage, with the odds of closing.', 'Several painters on one cut, each on their own frames.'),
             ('Income goals', 'Irosu for Mac', 'Paid, awaiting and pipeline income against a monthly goal.', 'The same app and shortcuts on macOS.'),
             ('Capacity check', 'Keyboard first', 'Hours booked against hours available, week by week.', 'Every tool on a key: G fill, L lasso, N next flag.')]
    feat_start = s.find('id="features"')
    for t, nt, d, nd in feats:
        s = rep_after(s, 'id="features"', f'>{t}<', f'>{nt}<', S)
        s = rep_after(s, 'id="features"', f'>{d}<', f'>{nd}<', S)
    # "Up next" marks: Keyboard first is already in the app, so its mark becomes "Live"
    s = rep_after(s, '>Keyboard first<', '>Up next<', '>Live<', S)

    # ------------------------------------------------------------------ testimonials -> frames of the concept cut
    S = 'testimonials'
    s = rep(s, '>Heard from the early ones.<', '>Painted from one key frame.<', None, S)
    people = [('Isabel Moranta', 'Design director', 'isabel', 'Frame F02', 'frame-1', 'Organized and on track.', 'Hair, headphones, jacket.',
               'As a creative working on multiple projects at once, Loopsii has been super helpful for keeping everything organized and on track. It’s intuitive, easy to use, and makes managing the day-to-day so much easier. Love having everything in one place. Definitely recommend giving it a try.',
               'One painted key frame sets the colours. Every other frame of the cut is filled to match it, area by area, even where the pose has changed.'),
              ('Marina Matijaca', 'Creative director', 'marina', 'Frame F04', 'frame-2', 'For the money I’m paying… it’s a steal.', 'Shadows stay shadows.',
               'I send clients a Loopsii recording instead of another call, and they leave comments right on it. I tell Claude to tell Loopsii what to do, my favorite kind of admin. All for less than one coffee in SF. I checked, mine was $12.75.',
               'Normal, shadow (影) and highlight (ハイ) colours come from the chart, so a shadow is never filled with the base colour by mistake.'),
              ('Andres Vlaeminck', 'AI developer', 'andres', 'Frame F06', 'frame-3', 'This one stays.', 'New poses, same colours.',
               'I didn’t expect to get attached to a project tool. My hours turn into invoices, my tasks sit next to the code I write in Cursor, and admin now takes about 10 minutes a week. More time for actual work.',
               'Areas are matched by their shape and by their neighbours, so a turned head or a raised arm still gets the right colour.'),
              ('Nika Korobchuk', 'Product designer', 'nika', 'Frame F08', 'frame-4', 'No more 2-hour calls.', 'Unsure? It asks.',
               'Kudos to Loopsii for how easy it is to make an invoice. I send mine at the end of the month and it takes a couple of minutes. And screen recordings help so much with communication, so nobody has to sit through 2-hour calls.',
               'When two colours are close, the area is flagged with both candidates instead of a guess. You decide with one key.'),
              ('Anna Sakharnatska', 'Product manager', 'anna', 'Frame F10', 'frame-5', 'One tab instead of twenty.', 'Ready to check.',
               'I work with several teams at once, each with its own workspace, task board and tools, so I used to juggle a million tabs. With Loopsii it’s all in one place. My favorite part is the meeting assistant. The notes are super accurate, and I can literally listen back to the moment a task came up in the call.',
               'Each frame lands in check mode next to the key, so the painter reviews the cut instead of filling it from scratch.')]
    for name, role, img, nname, nimg, title, ntitle, quote, nquote in people:
        s = rep(s, f'>{name}<', f'>{nname}<', None, S)
        s = rep(s, f'alt="{name}"', f'alt="{nname} of the concept cut"', None, S)
        s = rep(s, f'>{role}<', '>Concept cut · staged<', None, S)
        s = rep(s, f'testimonials/{img}.webp', f'testimonials/{nimg}.webp', None, S)
        s = rep(s, f'>{title}<', f'>{ntitle}<', None, S)
        s = rep(s, f'>{quote}<', f'>{nquote}<', None, S)
    s = rep(s, 'aria-label="Previous testimonial"', 'aria-label="Previous frame"', None, S)
    s = rep(s, 'aria-label="Next testimonial"', 'aria-label="Next frame"', None, S)

    # ------------------------------------------------------------------ pricing (placeholder until the founder sets prices)
    S = 'pricing'
    plans_old = re.search(r'data-pricing-plans="[^"]*"', s).group(0)
    plans_new = {'monthly': {'title': 'Beta access', 'amount': 'Free', 'period': 'in beta', 'note': '', 'color': '#b8aeff'},
                 'yearly': {'title': 'Studio plan', 'amount': 'Soon', 'period': '', 'note': 'priced per seat at launch', 'color': '#bce6fa'}}
    s = rep(s, plans_old, 'data-pricing-plans="' + escape(json.dumps(plans_new, ensure_ascii=False), quote=True) + '"', 1, S)
    s = rep(s, '>One Plan. Everything included.<', '>One plan. Everything included.<', None, S) if '>One Plan. Everything included.<' in s else s
    for old, new in [('>Monthly<', '>Beta<'), ('>Yearly<', '>Studio<'), ('>Save 17%<', '>from launch<'), ('aria-label="Bill yearly"', 'aria-label="Show the studio plan"'),
                     ('>Monthly plan<', '>Beta access<'), ('>$12<', '>Free<'), ('>Yearly plan<', '>Studio plan<'), ('>$10<', '>Soon<'),
                     ('>billed $120 yearly<', '>priced per seat at launch<'),
                     ('>Unlimited projects, clients &amp; time tracking<', '>Fill a whole cut from one painted key<'),
                     ('>Meeting and screen recording with AI summaries<', '>Flags, gap closing and unpainted check<'),
                     ('>Dictation in any app on your Mac<', '>Check mode with approve and send back<'),
                     ('>Tasks, invoices &amp; client management<', '>Colour chart (色指定) setup and import<'),
                     ('>AI assistant to manage your workflow<', '>Export to layered PSD, TGA and PNG<')]:
        s = rep(s, old, new, None, S)
    s = rep_after(s, '>Beta access<', '>/ month<', '>in beta<', S)
    s = rep_after(s, '>Studio plan<', '>/ month<', '><', S)

    # ------------------------------------------------------------------ roadmap
    S = 'roadmap'
    s = rep(s, '>No fake launch dates. Just the actual plan.<', '>No launch dates we can’t keep. Just the plan.<', None, S)
    s = rep(s, '>LOOP<', '>CUT<', None, S)
    for old, new in [('Clients, projects and task boards.', 'Fill a cut from one painted key frame.'),
                     ('Time tracking, timesheets and reports.', 'Flags, gap closing and unpainted check.'),
                     ('Call and screen recording on Mac. No bot.', 'Check mode: side by side, overlay, flip.'),
                     ('AI notes, tasks and search across calls.', 'Export layered PSD, TGA and PNG.'),
                     ('Income goals and deal pipeline.', 'Windows installer with everything inside.'),
                     ('Client portal for approvals and files.', 'Automatic updates.'),
                     ('Capacity view across all projects.', 'Series colour charts shared across cuts.'),
                     ('Change requests and scope tracking.', 'Director review with a note per frame.'),
                     ('Desktop app for Windows.', 'Irosu for macOS.'),
                     ('Full web platform in both desktop apps.', 'Team seats for a whole finishing studio.'),
                     ('Mobile app for iOS.', 'Coloured trace lines (色トレス).')]:
        s = rep(s, f'>{old}<', f'>{new}<', None, S)

    # ------------------------------------------------------------------ waitlist / final CTA
    S = 'waitlist'
    s = rep(s, '<section class="waitlist ', '<section id="access" class="waitlist ', 1, S)
    s = rep(s, '>Ready for an easier way to work?<', '>Ready to paint less by hand?<', None, S)
    s = rep_after(s, 'id="access"', '>122<', '>10<', S)
    s = rep(s, '>freelancers<', '>frames<', None, S)
    s = rep(s, '>already using Loopsii<', '>in the concept cut, from one key<', None, S)

    # ------------------------------------------------------------------ FAQ
    S = 'faq'
    faq = [('Does Loopsii add a bot to my client calls?', 'Does Irosu replace painters?',
            'No. Loopsii for Mac records on your Mac, so your client sees just you. No mystery guest called “Notetaker” in the corner.',
            'No. Irosu fills the routine areas and flags the rest. A painter still sets the key, checks every frame and decides every flag.'),
           ('Do I need a Mac to use Loopsii?', 'What files can I bring in?',
            'Only for call and screen recordings, and for dictation in other apps. Loopsii for Mac works on Apple silicon with macOS 14.4 or later, and screencasts need macOS 15. Everything else runs in any browser. There’s no Windows or iOS app today. Both are Up next on the roadmap, with no dates.',
            'Line frames as PNG, TGA, TIFF or PSD, the painted key frame as PSD, and the colour chart as JSON, CSV or .aco. Frame numbers, sizes and layers are read on import, and anything that doesn’t match is shown with a fix.'),
           ('How much does Loopsii cost?', 'How much does Irosu cost?',
            '$12 a month, or $120 a year to save 17%. One plan with everything in it, so there are no tiers to decode. Try Loopsii free for 14 days, no card needed.',
            'Irosu is free during the beta. Studio pricing per seat will be announced before launch, with one plan and no tiers to decode.'),
           ('What happens to my call recordings and transcripts?', 'Where do my frames go?',
            'Transcription runs on your Mac. The transcript syncs to your account, so Loopsii can write your notes. By default, the audio and a video of the call upload too. You can turn either off in the settings of Loopsii for Mac. Chat messages from Google Meet and Zoom calls are saved to the meeting in your account, even with both uploads off. Turn off “Save the in-call chat” to stop that. Your meeting content never trains third-party AI models.',
            'Nowhere. Irosu runs on your own computer. Frames, charts and exports stay in your workspace folder. Nothing is uploaded, and your art never trains any model.'),
           ('Can I use Loopsii with Claude or ChatGPT?', 'Does it work with CLIP STUDIO PAINT?', None, None),
           ('Can I dictate instead of typing?', 'Can I use Irosu in Japanese?',
            'Yes. In Loopsii for Mac, hold fn, speak and let go. Clean, punctuated text lands wherever your cursor is, in any app, with filler words like “um” left out. Press fn twice to keep talking hands-free. In the browser, the mic in Ask Loopsii does the same.',
            'Yes. Switch the whole app between English and 日本語 in Settings. The words follow studio usage: 色指定, 隙間閉じ, 塗り残し.'),
           ('Can my studio use Loopsii?', 'Can my studio use Irosu?',
            'Not as a team yet. Loopsii is built for freelancers, one person today. Teams may come later. Until then, your studio of one is very welcome.',
            'Yes, that is who it is for. The waitlist is open to finishing studios and freelance finishers. Team seats are on the roadmap.')]
    for q, nq, a, na in faq:
        s = rep(s, q, nq, None, S)
        if a:
            s = rep(s, a, na, None, S)
    s = rep(s, 'Yes, and with Codex, Cursor or any other MCP client, through ', 'Yes, through files. Export a layered PSD with paint, lines and flag layers, then open it in ', None, S)
    s = rep(s, '>the Loopsii connector<', '>CLIP STUDIO PAINT<', None, S)
    s = rep(s, 'open it in the Loopsii connector', 'open it in CLIP STUDIO PAINT', 1, S)  # FAQ copy for search engines
    s = rep(s, '. Ask them what you agreed on last Tuesday’s call instead of scrolling through the transcript. They can read, add and edit your clients, projects, tasks and hours, but never delete anything.',
            ' or Photoshop. A direct CLIP STUDIO workflow is on the roadmap.', None, S)
    s = rep(s, 'href="connect.html"', 'href="https://www.clipstudio.net/en/" target="_blank" rel="noopener"', None, S)

    # ------------------------------------------------------------------ outro + cookie notice
    S = 'outro'
    s = rep(s, 'Shipped weekly, shaped by you', 'One key, every frame filled', None, S)
    for old, new in [('>Shipped<', '>One<'), ('>weekly,<', '>key,<'), ('>shaped<', '>every<'), ('>by<', '>frame<'), ('>you<', '>filled<')]:
        s = rep_after(s, '<section class="outro', old, new, S)
    # The cookie / privacy popup is removed (the owner asked for it): the site sets no tracking cookies, only the language choice cookie.
    m = re.search(r'<div class="cookies pointer-events-none.*?data-track="cookies-ok".*?</button></div></div>', s, re.S)
    assert m, 'cookie notice markup not found'
    s = s[:m.start()] + s[m.end():]
    log.append((S, 'Cookie / privacy popup', 'removed', 1))

    # ------------------------------------------------------------------ logo + favicon
    S = 'logo'
    wm = ('<svg width="100%" height="100%" style="aspect-ratio: 345/96" viewBox="0 0 345 96" fill="none" xmlns="http://www.w3.org/2000/svg">'
          '<g transform="translate(0 5)"><path fill="currentColor" d="M44 7C24 6 8 22 8 43C8 64 24 80 44 80C62 80 76 68 80 52C75 64 62 72 46 72C29 72 17 59 17 43C17 27 29 15 45 15C52 15 58 17 63 21A4.5 4.5 0 0 0 66 13C59 9 52 7 44 7Z"/>'
          '<circle cx="78" cy="25" r="6.5" fill="#6E5BFF"/></g><g transform="translate(120 28)" fill="none" stroke="currentColor" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round">'
          '<path d="M0 0V40"/><path transform="translate(22 0)" d="M0 40V0H14a10 10 0 0 1 0 20H0M12 20L24 40"/><circle cx="88" cy="20" r="20"/>'
          '<path transform="translate(130 0)" d="M25 8C22 1 6 0 5 10C4 20 25 18 25 30C25 41 6 41 3 32"/><path transform="translate(180 0)" d="M0 0V25a14 14 0 0 0 28 0V0"/></g></svg>')
    i = s.index('aria-label="Irosu"><svg')
    j = s.index('</svg>', i) + len('</svg>')
    k = s.index('<svg', i)
    log.append((S, 'Loopsii wordmark SVG in the nav', 'Irosu wordmark SVG (brush ring + violet dot + IROSU)', 1))
    s = s[:k] + wm + s[j:]
    badge = re.search(r'(<div class="stack_badge[^>]*>)<svg class="w-68" viewBox="0 0 302 223".*?</svg>', s, re.S)
    s = rep(s, badge.group(0), badge.group(1) + '<svg class="w-68" viewBox="0 0 96 96" aria-hidden="true"><g transform="translate(2 4)">'
            '<path fill="currentColor" d="M44 7C24 6 8 22 8 43C8 64 24 80 44 80C62 80 76 68 80 52C75 64 62 72 46 72C29 72 17 59 17 43C17 27 29 15 45 15C52 15 58 17 63 21A4.5 4.5 0 0 0 66 13C59 9 52 7 44 7Z"/>'
            '<circle cx="78" cy="25" r="6.5" fill="#6E5BFF"/></g></svg>', 1, S)
    s = re.sub(r'href="favicon7b30\.svg[^"]*"', 'href="favicon-irosu.svg"', s)
    s = re.sub(r'href="favicon5e1f\.ico[^"]*"', 'href="favicon-irosu.svg"', s)
    s = re.sub(r'href="apple-touch-icon5e1f\.png[^"]*"', 'href="apple-touch-icon-irosu.png"', s)

    # ------------------------------------------------------------------ brand colour
    S = 'colour'
    for old, new in COLOURS:
        if old in s:
            s = rep(s, old, new, None, S)
    return s


# Rotating text lists inside the feature-card scripts, replaced whole (same object shape, Irosu content).
JS_ARRAYS = {'home.wchYPtRT.js': {
    'Ut': '[{source:`chat`,quote:`Collar line, 8 px`,meta:`frame F02 · automatic`,tag:`closed`},'
          '{source:`call`,quote:`Possible leak, 912 px`,meta:`frame F03 · `,link:`zoom in`,tag:`flagged · not filled`},'
          '{source:`figma`,quote:`Glove seam, 6 px`,meta:`frame F05 · automatic`,tag:`closed · check`},'
          '{source:`chat`,quote:`Headphone band, 4 px`,meta:`frame F05 · automatic`,tag:`closed`},'
          '{source:`chat`,quote:`Hair line, 11 px`,meta:`frame F04 · automatic`,tag:`closed`},'
          '{source:`figma`,quote:`Sleeve edge, 13 px`,meta:`frame F06 · automatic`,tag:`closed · check`},'
          '{source:`call`,quote:`Possible leak, 1,488 px`,meta:`frame F09 · `,link:`zoom in`,tag:`flagged · not filled`}]',
    'Yt': '[{question:`Which colour is the hair shadow?`,tools:[`chart`,`pick`],line:`Hair 影 is Colour 4.`,'
          'quote:`“Hair: N Colour 1, 影 Colour 4, ハイ Colour 11.”`,source:`Chart · C112 · part 3 · from the key`,tag:`from the chart`},'
          '{question:`Which parts use Colour 11?`,tools:[`chart`,`find`],line:`The hair highlight and the jacket trim.`,quote:null,'
          'source:`Chart · C112 · 2 parts`,tag:`from the chart`},'
          '{question:`What is the skin shadow?`,tools:[`chart`,`pick`],line:`肌 影 is Colour 7.`,quote:`“肌: N Colour 6, 影 Colour 7.”`,'
          'source:`Chart · C112 · part 1 · from the key`,tag:`from the chart`}]',
    'nn': '[{app:`Export`,label:`C112 · Layered PSD`,color:`bg-steel`,said:`f02|C112_F02.psd / f03|C112_F03.psd / f04|C112_F04.psd // layers|Layers: paint|paint, lines|lines, flags|flags +(hidden).`},'
          '{app:`Export`,label:`C112 · 32-bit TGA`,color:`bg-coral`,said:`f02|C112_F02.tga / f03|C112_F03.tga / f04|C112_F04.tga // alpha|Alpha kept for compositing.`},'
          '{app:`Export`,label:`C113 · Indexed PNG`,color:`bg-apricot`,said:`f01|C113_F01.png / f02|C113_F02.png // palette|Palette taken from the colour chart.`}]',
    'xn': '[`Export nine frames as layered PSD.`,`Write the cut as 32-bit TGA with alpha.`,`Name the files C112_F02 and on.`]',
    'Sn': '[`export|Export nine frames as layered|layered PSD.`,`write|Write the cut as TGA with alpha|alpha.`]',
}}


def replace_array(t, name, new, section):
    """Replace the JS array literal `name=[...]` (bracket-matched) with `new`."""
    i = t.find(name + '=[')
    if i < 0:
        raise SystemExit(f'[{section}] array {name} not found')
    depth, j = 0, i + len(name) + 1
    for j in range(i + len(name) + 1, len(t)):
        if t[j] == '[':
            depth += 1
        elif t[j] == ']':
            depth -= 1
            if depth == 0:
                break
    old = t[i:j + 1]
    log.append((section, f'{name}=[…] ({len(old)} chars: {old[len(name) + 2:len(name) + 70]}…)', f'{name}={new[:70]}…', 1))
    # the language build can swap the list by defining globalThis.__I18N before the scripts run (English stays the fallback)
    return t[:i] + name + '=(globalThis.__I18N&&globalThis.__I18N.' + name + ')||' + new + t[j + 1:]


# Visible words that a script writes (text only; the code around them is untouched)
JS_TEXT = {
    # Loopsii's agency analytics (PostHog key + their host). Switched off: nothing about Irosu visitors is sent.
    'Layout.astro_astro_type_script_index_0_lang.CYij4Z1e.js': [('function fc(e,t={}){if(', 'function fc(e,t={}){return;if(', 1),
                                                                ('`phc_qUUbDRGSfjDaj6cEm3aTRPWBAHQUNBsfUXKcfhqcM3e8`', '``', 1),
                                                                ('`https://t.stabondar.com`', '``', 1),
                                                                ('`loopsii.com`||e.endsWith(`.loopsii.com`)', '`heronaiapp.com`||e.endsWith(`.heronaiapp.com`)', 1)],
    'Layout.astro_astro_type_script_index_0_lang.CYij4Z1e668d.js': [('function fc(e,t={}){if(', 'function fc(e,t={}){return;if(', 1),
                                                                ('`phc_qUUbDRGSfjDaj6cEm3aTRPWBAHQUNBsfUXKcfhqcM3e8`', '``', 1),
                                                                ('`https://t.stabondar.com`', '``', 1)],
    'Cookies.F4ni2Kh7.js': [('`loopsii-cookies`', '`irosu-cookies`', 1)],'home.wchYPtRT.js': [("`$${a.toLocaleString(`en-US`)}/yr`", '(globalThis.__I18N?.byHand??`by hand`)', 1),
                                ("vt=e=>`$${(e/1e3).toFixed(2)}k`", "vt=e=>`${(e/1e3).toFixed(2)}k`", 1),
                                ('r===1?`login`:`logins`', 'r===1?(globalThis.__I18N?.toolOne??`tool to switch`):(globalThis.__I18N?.toolMany??`tools to switch`)', 1)]}


def recolour_scripts():
    """The same colour swap inside the few scripts that draw with the brand colour, plus JS_TEXT words."""
    done = []
    for f in os.listdir(os.path.join(REF, '_astro')):
        if not f.endswith('.js'):
            continue
        t = open(os.path.join(REF, '_astro', f), encoding='utf-8').read()
        n = t
        for old, new in COLOURS:
            n = n.replace(old, new)
        for old, new, cnt in JS_TEXT.get(f, []):
            n = rep(n, old, new, cnt, 'script text: ' + f)
        for name, new in JS_ARRAYS.get(f, {}).items():
            n = replace_array(n, name, new, 'script lists: ' + f)
        if n != t:
            open(os.path.join(OUT, '_astro', f), 'w', encoding='utf-8').write(n)
            done.append(f)
    log.append(('colour', 'brand lime inside scripts: ' + ', '.join(sorted(done)), 'lavender', len(done)))


def statics():
    # brand colour inside the template's SVG illustrations (folders, highlight icons, phone dashboard)
    for d in ('folders', 'highlights', 'dashboard'):
        for f in os.listdir(os.path.join(REF, d)):
            if not f.endswith('.svg') or (d == 'dashboard' and f == 'logo-mark.svg'):
                continue
            t = open(os.path.join(REF, d, f), encoding='utf-8').read()
            n = t
            for old, new in COLOURS:
                n = n.replace(old, new)
            if n != t:
                open(os.path.join(OUT, d, f), 'w', encoding='utf-8').write(n)
                log.append(('colour', f'{d}/{f}: brand lime', 'lavender', 1))
    os.makedirs(os.path.join(OUT, 'api'), exist_ok=True)
    open(os.path.join(OUT, 'api', 'users-count'), 'w').write('{"count":10}')
    open(os.path.join(OUT, 'api', 'geo'), 'w').write('{}')
    # drop Loopsii's own pages so nothing of theirs is published by accident
    # small mark in the phone dashboard sidebar (same canvas as the file it replaces)
    open(os.path.join(OUT, 'dashboard', 'logo-mark.svg'), 'w', encoding='utf-8').write(
        '<svg width="1249" height="393" viewBox="0 0 1249 393" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(219 25) scale(4)">'
        '<path fill="black" d="M44 7C24 6 8 22 8 43C8 64 24 80 44 80C62 80 76 68 80 52C75 64 62 72 46 72C29 72 17 59 17 43C17 27 29 15 45 15C52 15 58 17 63 21A4.5 4.5 0 0 0 66 13C59 9 52 7 44 7Z"/>'
        '<circle cx="78" cy="25" r="6.5" fill="#6E5BFF"/></g></svg>')
    log.append(('logo', 'dashboard/logo-mark.svg (Loopsii glyph)', 'Irosu mark, same canvas', 1))
    open(os.path.join(OUT, 'sitemap-index.xml'), 'w', encoding='utf-8').write(
        '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        f'<url><loc>{SITE_URL}</loc></url></urlset>')
    brand = r'C:\Users\edete\Desktop\irosu\brand\logo\violet\irosu-icon-on-light.svg'
    shutil.copyfile(brand, os.path.join(OUT, 'favicon-irosu.svg'))
    from PIL import Image
    Image.open(r'C:\Users\edete\Desktop\irosu\product\desktop\build\icon-256.png').convert('RGBA').resize((180, 180), Image.LANCZOS) \
        .save(os.path.join(OUT, 'apple-touch-icon-irosu.png'))
    for p in ['favicon5e1f.ico', 'favicon7b30.svg', 'apple-touch-icon5e1f.png', '_image0a74', '_image6690', '_lottie-test.html',
              '_astro/cover.DgwvykuR.png', '_astro/photo-1.V5nItHYV.png', '_astro/photo-2.DhQXSHas.png']:
        q = os.path.join(OUT, p)
        if os.path.isfile(q):
            os.remove(q)
    for p in ['privacy.html', 'terms.html', 'connect.html', 'connect', 'og.jpg?v=3']:
        q = os.path.join(OUT, p)
        if os.path.isdir(q):
            shutil.rmtree(q)
        elif os.path.exists(q):
            os.remove(q)
    for p in ['isabel', 'marina', 'andres', 'nika', 'anna']:
        q = os.path.join(OUT, 'testimonials', p + '.webp')
        if os.path.exists(q):
            os.remove(q)


def write_changes():
    lines = ['# Irosu site: every change from the Loopsii template (generated)\n',
             'Layout, CSS and animation code are untouched. This lists every text, link, colour and asset swap.\n']
    sec = None
    for section, old, new, c in log:
        if section != sec:
            lines.append(f'\n## {section}\n\n| before | after | times |\n|---|---|---|')
            sec = section
        clean = lambda x: str(x).replace('|', '\\|').replace('\n', ' ')[:160]
        lines.append(f'| {clean(old)} | {clean(new)} | {c} |')
    open(os.path.join(OUT, 'CHANGES-generated.md'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')


if __name__ == '__main__':
    html = build()
    if COLLECT:
        print(f'{len(failures)} mismatches:')
        for f in failures:
            print('  ', f)
        sys.exit(1 if failures else 0)
    # the English page is the source every language is made from (tools/i18n/localise.py writes the real index.html and ja.html, ko.html ...)
    os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'i18n', '_src'), exist_ok=True)
    open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'i18n', '_src', 'index.html'), 'w', encoding='utf-8').write(html)
    recolour_scripts()
    statics()
    write_changes()
    import subprocess
    subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'i18n', 'localise.py')], check=True)
    left = sorted(set(re.findall(r'[^<>"]{0,40}Loopsii[^<>"]{0,40}', html)))
    print(f'{len(log)} changes applied. "Loopsii" left in index.html: {len(left)}')
    for x in left[:40]:
        print('  ', x.strip())
