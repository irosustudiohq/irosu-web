# Irosu site languages: runbook

The site is built in English, then `localise.py` makes one page per language from translation files.
Visitors are sent to their language by country (`_worker.js`, made from `worker.template.js` + `routing.json`).

| Code | Language | Gets it |
|---|---|---|
| `en` | English (British spelling, the source) | everyone else |
| `en-us` | English, American spelling (made automatically, no translator) | US, Philippines |
| `ja` | 日本語 | Japan |
| `ko` | 한국어 | South Korea |
| `zh-cn` | 简体中文 | mainland China |
| `zh-tw` | 繁體中文 (Taiwan usage) | Taiwan, Hong Kong, Macau |
| `vi` | Tiếng Việt | Vietnam |
| `id` | Bahasa Indonesia | Indonesia |

## Order of work
```
python tools/build_irosu_site.py        # English build, then runs localise.py for all languages
python tools/i18n/extract.py            # (re)writes source-en.json, the list translators work from
python tools/i18n/localise.py --check ja   # validate one translation file, writes nothing
python tools/i18n/localise.py           # write every language page, _worker.js, sitemap
```
If the English text changes, run `extract.py`, then `--check <code>` for each language: it lists exactly the new or changed strings.

## How to translate one language (the job for a translator)
Write `tools/i18n/locales/<code>.json`:
```json
{ "strings": { "<exact English text from source-en.json>": "<translation>", "...": "..." },
  "js":      { "Ut": [...], "Yt": [...], "nn": [...], "xn": [...], "Sn": [...], "byHand": "...", "toolOne": "...", "toolMany": "..." } }
```
- `source-en.json` → `strings[]` has, for each text: `en` (the key, copy it exactly), `where` (page and section),
  `before` / `after` (the neighbouring texts on the page, for context).
- `source-en.json` → `js` is the English version of the rotating demo texts. Return the same structure, same keys, same list lengths.
- Every `en` string needs a non-empty translation. If a text should stay as it is (a code, a brand), repeat it.

### Rules
1. **Same meaning, no new claims.** Never add numbers, customers, prices or promises that the English doesn't have. The product is in beta; the testimonials are staged concept frames.
2. **Do not translate:** Irosu, CLIP STUDIO PAINT, Photoshop, PSD, TGA, PNG, TIFF, JSON, CSV, `.aco`, file names (`C112_F02.psd`), codes (C112, F04, W1), numbers, key letters (A, G, L, N, 1, 2), and the Japanese industry words 影, ハイ, 色指定, 仕上げ, 色トレス, 隙間閉じ, 塗り残し, 肌 wherever the English page already shows them. They are the shared language of anime studios.
3. **Short labels stay short.** Buttons, pills, tabs, tags and table labels must be about as short as the English (CJK usually shorter; Vietnamese may be up to 30% longer). Headlines should break into about the same number of lines.
4. **Fragments.** Many texts are pieces of one sentence or one headline that the page splits into separate animated elements (see `before` / `after`: "Your whole finish," / "in one app"; "That's why Irosu" / "exists"; "One" "key," "every" "frame" "filled"; the rotating hero words after "One app for" + "your"; "Too many small fixes pulling you away" / "from the frames that actually matter"). Translate so the pieces read in order as one natural sentence. You may move words between neighbouring fragments. A fragment may be very short, but not empty. The rotating hero words must each be a noun phrase that works after "your".
5. **Tone.** Calm, concrete, professional; the reader is a finishing artist or studio lead. Verb-first for buttons ("Join the waitlist"). No hype, no exclamation marks, no emoji. Use the register that studio staff use for software in that country.
6. **"Key frame"** means the painted reference frame (原画 in the app's Japanese). Cut = カット/컷/镜头 etc. as the industry says. Frame = コマ in Japanese.
7. The small Japanese helper labels beside English form labels (お名前 …) are only shown on the English page and are not in the list.

### Glossary (Japanese is taken from the Irosu app itself, `product/web/js/i18n.js`)
| English | 日本語 (app) | Hint for the other languages |
|---|---|---|
| Fill | 塗りつぶし | use the verb studios use for colouring a cel/area (ko 채색, zh 上色, vi tô màu) |
| Close gap | 隙間閉じ | gap = open line in the outline |
| Colour chart | 色指定 | the per-series colour specification (ko 색지정, zh 色指定/配色表 as studios say, vi bảng chỉ định màu) |
| Unpainted check | 塗り残しチェック | areas left unpainted |
| Flag | 要確認 | a marker asking the painter to look |
| Key frame | 原画 (reference) | the painted reference frame |
| Cut | カット | a shot/scene of the animation |
| Frame | コマ | one drawing |
| Finishing | 仕上げ | the colouring and check stage |
| Check mode | 検査 | |
| Export | 書き出し | |
| Shadow / highlight | 影 / ハイ | keep 影 and ハイ as they are on the page |

### The `js` section (rotating demo texts inside the animated cards)
Keep every key. Do NOT change: `source`, `tools`, `color`, and the number/length of list items.
- `Ut` (closed gaps list): `quote` e.g. "Collar line, 8 px", `meta` "frame F02 · automatic", `link`, `tag`.
- `Yt` (colour-chart questions): `question`, `line` (the answer), `quote`, `source`, `tag`. Keep `影`, `ハイ`, `肌` and "N".
- `nn` (typed export demo): `app`, `label`, and `said`. `said` is a space-separated list of tokens: `spoken|written` shows `spoken` first and then replaces it with `written`; `/` and `//` are line-break markers (keep them as they are, between spaces); a token starting with `+` is written only; a plain token is both. Tokens must contain no spaces. For languages written without spaces (ja, zh), put an ASCII space between short phrase chunks so the text types in pieces.
- `xn` (typed lines) and `Sn` (typed lines with `spoken|written` tokens, same rule): translate sentence meaning, add spaces between chunks for ja/zh.
- `byHand` appears after a counter ("… by hand"); `toolOne` / `toolMany` follow a number ("6 tools to switch", "1 tool to switch"). For languages without plural forms make both the same.

### Check
`python tools/i18n/localise.py --check <code>` must print `0 problem(s)`.
It reports missing strings, changed `js` structure, and numbers that don't match the English (a warning: fix it unless the number is written out in words).

## Adding a country or language
1. `routing.json`: add the language under `locales` (name, html_lang, og_locale, file_slug, font stack) and the country codes under `countries`.
2. Write `locales/<code>.json` as above, run `--check`, then `localise.py`.
3. Add the pages to the deploy; the worker and sitemap are rewritten automatically.

## Local preview
`node tools/serve_irosu.js` serves the site on http://127.0.0.1:8797 through the real `_worker.js`.
Pretend to be in another country with `?geo=JP` (the choice is remembered for the session), e.g. `http://127.0.0.1:8797/?geo=KR`.
Without `?geo=`, the browser's language decides (no country is available locally).
