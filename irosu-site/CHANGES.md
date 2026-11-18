# Irosu website: what was there before, what is there now

**Before** is the Loopsii page, kept untouched (and now complete) in `../irosu pick3/loopsii.com`.
**After** is this folder, `irosu-site`. The two sit side by side, so you can open both and compare.

Every line-by-line swap (468 of them) is listed in `CHANGES-generated.md`.

## What did not change
The layout, the CSS and every animation are the same code, byte for byte:
- the loader
- the hero shape grid
- the pinned app demo with its zoom and tilt
- the price-grid counters
- the six feature cards
- the folders
- the features grid
- the carousel
- the pricing toggle
- the roadmap wheel
- the counter dial
- the FAQ
- the pixel footer

Only text, links, colours and assets change.

## Rebuilding
Run these from `C:\Users\edete\Desktop\clone`:
```
python tools/make_irosu_lotties.py irosu-site/lotties   # Irosu logo animations
python tools/make_irosu_media.py irosu-site             # app video, pixel-footer videos, images
python tools/build_irosu_site.py                        # text, links, colours (fails loudly on any mismatch)
```

## Section by section

| Section | Before (Loopsii) | After (Irosu) |
|---|---|---|
| Brand colour | Lime `#c4f041` | Lavender `#b8aeff`, in the same pastel family. Black text still reads on it. It is one token, so it is easy to change. |
| Logo | LOOPSII wordmark, double-loop mark | Irosu wordmark: brush ring, violet dot, IROSU |
| Loader and hero marks | Loopsii loop Lotties | Irosu Lotties at the same size and timing: the ring paints on, then the dot drops in |
| Hero | "One app for your invoices / clients / …" | "One app for your colour fill / gap checks / colour charts / key frames / …". The corner labels read Fill / Gap check / Colour chart / Export. |
| What is | Freelancer workflow loop | "Every cut follows the same loop: key, fill, check, deliver" |
| Too many things | Timer, invoice and call pills | Finishing pains: "Missed a gap in the hair", "Which one is the 影?", "Speck left on frame 37", … |
| That's why … exists | Loopsii's fake app, with a guided cursor tour | Real footage of the Irosu desktop app painting the headphone-character concept cut, in the same frame and plates |
| Price grid (the "tax") | Six SaaS tools and their prices, adding up to $948/yr, then "Loopsii $120/yr" | Six manual passes, with names that alternate between English and Japanese (Fill / 塗りつぶし, Gaps / 隙間閉じ, …). It reads "6 passes a frame", then "Irosu · All of the above · 1 key". No made-up prices or times. |
| Six feature cards | Money, clients, capacity, change requests, AI, dictation | Paint from one key, flags, check against the key, gap closing, colour chart (色指定), export. Every mini-screen and rotating list is rewritten. |
| Folders | "Go back to doing the work", folders labelled "Project" | "Go back to the frames that matter", folders labelled "Cut" |
| Features grid | Negotiation / Working / Closure / Planning | Import / Paint / Check / Studio, with real Irosu features. "Up next" only marks things not built yet. |
| Testimonials | Five real Loopsii customers, with photos | Removed. There are no Irosu customers yet, and fake quotes are not allowed. The same carousel shows five frames of the concept cut, each labelled "Concept cut · staged". |
| Pricing | $12 a month or $10 a month | **Placeholder:** "Beta access: Free, in beta" and "Studio plan: Soon, priced per seat at launch" |
| Roadmap | Loopsii loops 01–04 | Irosu cuts 01–04. 01 is live: fill, flags, gaps, check mode, export. 02–04 are up next: installer, updates, series charts, director review, Mac, team seats, 色トレス. |
| Counter | "122 freelancers already using Loopsii" (live number) | "10 frames in the concept cut, from one key" (a fixed, true number) |
| FAQ | Seven Loopsii questions | Seven Irosu questions: replaces painters?, files, cost, where frames go, CLIP STUDIO, Japanese, studios |
| Pixel footer | Two people on office chairs | The headphone character, animated "on threes" and facing in from both sides |
| Footer | "Start your loop here", Loopsii socials | "Start your first cut here". The social links are placeholders. |
| Share image | Loopsii's og.jpg | An Irosu card: the wordmark, "Paint one key frame. Irosu fills the cut.", and line art turning into colour |
| Hidden page data | Loopsii organisation, socials and FAQ for search engines | Irosu's |

## Safety fixes (not visible, but important)
- **Analytics switched off.** The template sent every visitor's page views to Loopsii's agency analytics (PostHog key, `t.stabondar.com`). That sender is now a no-op, so nothing about Irosu visitors goes anywhere.
- **Loopsii's own pages and photos removed from this folder.** That covers privacy and terms, the connector pages, the testimonial photos, their favicon, and the dashboard photos.
- **Double script fixed.** The mirror had saved the main script under two names, so it ran twice and drew two logos. The page now loads the one copy.

## Languages and country routing (new)
The site now exists in seven versions. Visitors are sent to one by the country their connection comes from.

| Visitor's country | Page | Language |
|---|---|---|
| Japan | `/ja` | 日本語 |
| South Korea | `/ko` | 한국어 |
| China | `/zh-cn` | 简体中文 |
| Taiwan, Hong Kong, Macau | `/zh-tw` | 繁體中文 |
| Vietnam | `/vi` | Tiếng Việt |
| Indonesia | `/id` | Bahasa Indonesia |
| US, Philippines | `/en-us` | English with American spelling |
| Everyone else | `/` | English |

- The countries come from the outreach plan: Japan (core), Korea, Vietnam, Indonesia and the Philippines (the overseas finishing vendors), China and Taiwan (large animation labour markets), the US (largest English market).
- Only the two-letter country code is read, by `_worker.js` on the server. Nothing is logged. A cookie in the visitor's own browser remembers a language they pick in the footer switcher, and that choice always wins.
- A visitor whose country is English-speaking but whose browser is set to Japanese, Korean, Chinese, Vietnamese or Indonesian gets that language.
- Search engines always get the English page; each page lists the others with `hreflang`, and the sitemap does too.
- The layout, CSS and animations are the same code in every language. Only text, links and a font fallback list for Asian scripts differ.
- **Translations are machine-written and need a native speaker's review before launch.** The translators flagged their uncertain choices; see `tools/i18n/review-notes.md`.
- How it works and how to add a country or fix a translation: `tools/i18n/README.md`.
- The waitlist form's link now goes in `tools/i18n/form-endpoint.txt` (the pages in `irosu-site` are generated).

## Placeholders you need to give me
| What | Where it is now |
|---|---|
| Where waitlist sign-ups go | Every "Join the waitlist" button opens the waitlist page (`access.html`, one per language), in the site's own style. Connected to the Formspree form `xvkarlkk` (the link is in `tools/i18n/form-endpoint.txt`; change it there and run `python tools/i18n/localise.py`). Still to do: one real test sign-up, and add the live domain to the form's allowed domains in Formspree. Tested: the error messages, the thank-you screen, and a real send to a local test receiver, which received every answer. |
| Live web address | `https://heronaiapp.com/irosu/` (`SITE_URL`). Used for share links, the sitemap and search data. |
| Pricing | "Free in beta" / "Soon". Set `plans_new` and the pricing lines. |
| LinkedIn / X / Instagram | `#` (`SOCIAL`) |
| Privacy policy and terms pages | `#`. Irosu needs its own. |

## Still Loopsii's work
The page structure, CSS and animation scripts are Loopsii's code. You asked to keep them exactly, so they are kept. Before this goes public, get Loopsii's permission or have these parts rebuilt. The text, images, videos, logo animations and colours in this folder are all Irosu's own.
