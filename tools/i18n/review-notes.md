# Translation review notes

Each translation was written by a model and passed the automatic checks (every text present, demo texts in the right shape).
None has been read by a native speaker. These are the choices the translators flagged as uncertain, for the reviewer to confirm or change
(edit `locales/<code>.json`, then `python tools/i18n/localise.py`).

## 日本語 (ja)
- Hero lead-in: ひとつのアプリで + あなたの + rotating nouns; "retakes" is リテイク.
- Moved words between fragments so they read in order: the "close the gap / before you fill" pair, "export the layers / frame by frame", and the "you keep them consistent" line.
- Split headlines: だから、Irosuが / あります; outro ひとつの / 原画で、 / すべての / コマが / 塗られる.
- "by hand" is 手作業で everywhere; "Chapters" became コマ (check this); "Ready by" is 完了予定; waitlist is ウェイトリスト; "Testimonials" is ご利用イメージ because the frames are staged.
- Numbers spelled in words in English are written 一枚, 二色, 九 (to satisfy the checker).

## 한국어 (ko)
- Hero lead-in: 하나의 앱으로 끝내는 + 당신의 (당신의 may sound stiff).
- Terms: 틈 닫기 (gap closing), 미채색 체크, 칠 누락 (speck), 색트레스, 파트, 반려 (send back), 후기 (Testimonials), 콘셉트 컷 · 연출 (staged).
- "about a minute" is 약 일 분이면 됩니다.
- The thank-you line drops ありがとうございます.

## 简体中文 (zh-cn)
- "Finishing" is 上色 (上色工作室, 上色师, 上色组长); 仕上げ stays where the English shows it.
- Hero lead-in: 一个软件，处理 + 手头的 + noun; flags are 待确认标记, retakes 返修.
- Gap closing 间隙封闭, leak 溢色, Testimonials 效果示例, "Concept cut · staged" 概念镜头 · 演示用, Series 作品, Chapters 目录.
- Thank-you ends 谢谢。 in place of ありがとうございます。

## 繁體中文 (zh-tw)
- Frame is 幀 throughout (影格 is the alternative).
- "Finishing" is 完稿 and painter 上色師 (both guesses at Taiwan studio usage).
- Gap 缺口, leak 漏色, retake 修正, flag 標記, Testimonials 使用者見證, "Colour N" is N 號色, 日本語 became 日文.
- Hero lead-in: 一套軟體，處理 / 你的. The thank-you drops ありがとうございます。

## Tiếng Việt (vi)
- Hero lead-in: Một ứng dụng cho + mọi + noun phrases (lần tô màu, lượt dò khe hở, vùng đổ bóng, lần retake …); "your" dropped.
- Loanwords kept: key frame, cut, retake, "PNG indexed", compositing. Gap is khe hở; the tab is "Soát khe hở".
- Seats is "Suất cho nhóm"; Chapters is "Chương"; Fri is "Thứ Sáu".
- The thank-you keeps ありがとうございます。 as on the English page.

## Bahasa Indonesia (id)
- "Color chart" is kept as a loanword everywhere (alternatives: "panduan warna", "bagan warna"); "Colour 4" is "Warna 4".
- Loanwords kept: key frame, cut, retake, flag ("diberi flag"), highlight, layer, "PSD berlapis". Fill and paint are both "mewarnai"; gap closing is "menutup celah"; shadow is "bayangan" beside the unchanged 影.
- Hero lead-in: "Satu aplikasi untuk" + "semua" + nouns ("semua" stands in for "your").
- "Finishing" studios, "Artis finishing", "Finisher freelance"; painter is "pewarna" (unsure it is the usual studio word).
- Specks "bintik", leak "bocor", "Perbaiki ke depan" for fix forward: all guesses.
- "Seat tim" / "per seat": a native may prefer "lisensi" or "akun".
- "Chapters" is "Frame" (follows the Japanese コマ, also uncertain); "Testimonials" is "Contoh penggunaan"; "Concept cut · staged" is "Cut konsep · peragaan".
- "Tenggat besok", "Jum" (Fri), "Bando headphone" are plain guesses.
- 仕上げ carries invisible word-joiners so it never breaks across lines.

## For every language
- The three colour-chart demo lines ("Chart · C112 · …") are translated like the rest.
- English (US) is made from the English text by changing "colour" to "color" only.
