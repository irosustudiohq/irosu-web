# Irosu website

Marketing site and waitlist for Irosu, an anime finishing (colour-fill) tool.

- `irosu-site/` is the deployable site (static files plus `_worker.js`). Deploy it as a Cloudflare Pages project with this folder as the output directory and no build command.
- `tools/` rebuilds it: `python tools/build_irosu_site.py` (English build, then every language). The language pipeline and its runbook are in `tools/i18n/README.md`.
- The waitlist form link lives in `tools/i18n/form-endpoint.txt`.
- Languages and the country each one is shown in: `tools/i18n/routing.json`.

`irosu-site/CHANGES.md` lists everything that differs from the original template, and what is still a placeholder.
