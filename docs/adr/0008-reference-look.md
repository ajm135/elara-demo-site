# 0008: Reference look from the Medina TemplateMonster demo: white and blue surfaces, Asap headings

- Status: accepted
- Date: 2026-11-04
- Reference page: https://demo.templatemonster.com/demo/55809.html

## Context

The operator asked for a modern 2026 redesign "like this": https://demo.templatemonster.com/demo/55809.html. That address is TemplateMonster's live demo wrapper for **Medina — Diagnostic Center Multipage HTML Website Template #55809**. The wrapper page itself frames exactly one template, in an iframe, at `https://ld-wt73.template-help.com/wt_prod-20176/`, whose own stylesheets are `css/style.css`, `css/bootstrap.css` and `css/fonts.css`, with a Google Fonts link for **Asap** and **Lato**.

The team read the wrapper page, the framed template and those stylesheets **once**, to note the template's visual system. **Nothing was copied**: no code, no CSS, no images, no icons, no icon font, no logos, no photographs, no fonts and no text from the reference were taken. This record holds observations only — colour values, font family names, and plain-language descriptions of shapes and layout — and the new look is re-implemented from scratch in the project's own `src/app/globals.css` with its own values, its own measurements and its own illustrations.

The reference page **was** readable, so the operator's fallback look (full-width colour band, pill-shaped story links, decorative five-step progress indicator, evidence cards with stage labels, more space between sections, a bolder more colourful palette chosen by the team) is **not** used as the definition of the look. Some of those devices are adopted anyway where the reference shows the same thing; they are marked below as adaptations rather than as the fallback.

The reference's background is **light** (`body { background-color: #fff }`), so by the operator's rule the **light theme copies the reference's background and its main colours**, and the **dark theme uses the same accent colours**, lightened only as far as contrast requires.

## What was taken from the reference (observations only)

### Main colours, as hex values, read from `css/style.css`

| Role in the reference | Hex value | Where it was read |
| --- | --- | --- |
| Page background (light) | `#ffffff` | `body { background-color: #fff }`, `.bg-default` |
| Pale section band | `#f1f3f9` | `.bg-default-liac` |
| Second pale band | `#edeff4` | `.bg-gray-100` |
| Dark surface | `#191919` | `.bg-black` |
| Dark surface, second step | `#272727` | `.bg-gray-darkest` |
| Dark surface, third step | `#2c343b` | `.bg-gray-700` |
| Primary accent (links, primary buttons, active nav) | `#2a93c9` | `.text-primary`, `.btn-primary` |
| Primary accent hover | `#21749f` | `a.text-primary:hover` |
| Headings / dark ink | `#434445` | `.text-gray-darker` |
| Darkest ink | `#272727` | `.btn-white` text, `.bg-gray-darkest` |
| Body text in the reference | `#868686` | `body { color: #868686 }` |
| Muted grey | `#bdbdbd` | `.text-gray` |
| Light grey | `#e5e5e5` | `.bg-gray-light` |
| Secondary accent (purple) | `#8668ad` | `.btn-deluge` |
| Deep purple | `#695999` | `.btn-deluge:hover` |
| Tertiary accent (green) | `#84c450` | accent palette |
| Warm accent (amber) | `#f5bf2f` | accent palette |
| Warm accent (orange) | `#f54b0f` | accent palette |
| Light blue accent | `#55bbeb` | accent palette |
| Lighter blue accent | `#79ccf2` | accent palette |
| Teal accent | `#23d5ae` | `.text-java`, `.btn-java` |

### Headline font and the OFL family chosen

The reference's **headline font is Asap** (`h1, .h1, h2, h3 … { font-family: "Asap", sans-serif }`) and its body font is Lato. Asap is distributed under the **SIL Open Font License 1.1**, so it is the reference's own headline face and needs no substitution.

- **Headline family to commit: `Asap`** (SIL Open Font License 1.1). The parallel font task commits one Asap file (regular and/or bold as obtained) into `src/app/fonts/` with the full OFL 1.1 licence text and a note of source, version and date, and wires it through `next/font/local` in `src/lib/fonts.ts` for headings only.
- If the task cannot obtain an Asap file on this computer, the pre-agreed fallback order applies: **Fraunces**, then **Source Serif 4**. If neither can be obtained, Inter stays for headings and this record's reason is amended.
- The parallel task must confirm the OFL 1.1 licence from the font file's own metadata and the licence file it downloads, before committing; if the file turns out not to be OFL, it falls back immediately and says so here.
- **Body text stays Inter** (`src/app/fonts/`), unchanged.

### Top-of-page treatment

The reference opens with a **full-bleed hero**: a full-width photographic band at the top of the page, a **transparent header bar sitting on top of it** (`.rd-navbar { background: transparent }`), and inside the band a **left-aligned large headline** broken across two lines, a **short muted sub-headline** beneath it, and a **pill-shaped call-to-action button**. The hero is a slider in the reference; the site has no slider and no JavaScript, so the treatment is adapted rather than copied (see below).

### Headline style

- Face **Asap**, weight 500, sentence case for `h2`/`h3` (`text-transform: none`); `h1` is uppercase in the reference.
- Large display sizes: `h1` ≈ 36 px and up, `h2` ≈ 52–63 px, `h3` ≈ 44–48 px, with tight line-height ≈ 1.08–1.5.
- Slight positive letter-spacing: 0.02–0.04 em.
- Colour: the dark ink `#434445`/`#272727` on white, or white on the accent when a headline sits on a coloured band.

### Button shapes

- `.btn` — **rounded rectangle**, `border-radius: 5px`, 2 px border, `Lato` 600, `0.9375rem`, uppercase with `letter-spacing: 0.04em`.
- `.btn-rect` — **square corners**, `border-radius: 0`.
- `.btn-ellipse` — **pill**, `border-radius: 23px` (the prominent call-to-action shape).
- `.btn-white` — white fill, `#272727` text, `#272727` hover. `.btn-primary` — `#2a93c9` fill, white text, `#272727` hover.

### Box shapes

- Cards: **5 px rounded corners** (`.sheldue-item-body { border-radius: 5px }`), flush square inner edges.
- Circular badges and icons: `border-radius: 50%` (`.icon-circle`); a 5 px rounded icon variant also exists.
- Blocks, quotes and post cards: square-cornered panels with a hairline rule (`hr`) under the heading.

### Section layout

Alternating **full-width horizontal bands** — white, then pale `#f1f3f9` — each holding a centred container: a **centred section heading** (`h3.text-center`), then a short centred intro, then a **three-column grid** of icon + heading + paragraph; a **row of four overlapping cards** that break out of the container upwards over the previous band; a **full-bleed dark image band** with a left-aligned headline, a muted paragraph and a pill button; and a **three-column card row** at the end. The footer sits on an accent band. Every band is separated by whitespace rather than by rules, and the page is one long alternating stack of bands.

## The new look for this site (adapted, nothing copied)

The site keeps its server-rendered, no-JavaScript, header-only navigation and its own content and illustrations. The reference's system is translated as follows:

- **Top of page:** the reference's full-bleed photographic hero becomes a **full-width colour band behind each page's headline**, in the site's own flat colours (no photograph, no slider, no script). The band carries the kicker, the `h1`, the summary and the review date; the header sits above it in the same band colour. The existing hooks `div.hero`, `main#main-content`, the `.skip-link`, `header nav[aria-label="Main"]`, `.progress-cluster` and `.next-story-cue` are unchanged.
- **Headline style:** Asap at the reference's proportions (large, weight 500, tight line-height, slight positive letter-spacing), but **not** uppercase — the project's "no `text-transform`" safeguard stays in force, so the reference's uppercase `h1` is not adopted.
- **Buttons and links:** the reference's **5 px rounded rectangle** for buttons and cards, and its **pill (23 px radius)** for the story links and the primary call-to-action. Buttons keep the reference's 2 px border and generous padding; the uppercase treatment is not adopted (no `text-transform`).
- **Section layout:** the alternating white / pale-blue band stack, centred section headings and generous whitespace between sections are adopted, with the site's own content, citations and evidence panels inside them. Sections are separated by space and a hairline rule, as in the reference.
- **Progress and the active link:** the reference marks the active navigation item with the accent colour alone (`.rd-nav-item.active .rd-nav-link { color: #2a93c9 }`) and shows no step indicator. The site keeps its existing header progress cluster ("Story N of 5", the next-story cue, "End of the stories") and its existing active state — heavier weight plus an inset rule, so the active story is identifiable without colour — and adds the reference's accent colour to it as one further cue.
- **Illustrations:** the six existing illustrations keep their file names, sizes and subjects and are redrawn as flat drawings in the new palette, using the reference's flat, non-photographic character, with matching alt texts.

## Colour changes made for contrast, and by how much

Only the values below differ from the reference's own values. Every other colour is copied as read above. All ratios are WCAG 2.2 relative-luminance contrast ratios computed against the surface the colour actually sits on. Floors: **4.5:1** for every text and link colour on each surface, **3:1** for meaningful borders and the focus outline.

### Light theme (copies the reference's light background `#ffffff`)

| Token | Reference value | New value | Why | Ratios |
| --- | --- | --- | --- | --- |
| `--surface-page` | `#ffffff` | `#ffffff` | copied, no change | — |
| `--surface-raised` | `#f1f3f9` | `#f1f3f9` | copied, no change | — |
| `--surface-evidence` | `#edeff4` | `#edeff4` | copied, no change | — |
| `--ink-heading` | `#272727` | `#272727` | copied, no change | 14.94 / 13.46 / 12.98 |
| `--ink-body` | `#434445` | `#434445` | copied, no change | 9.76 / 8.80 / 8.48 |
| `--ink-muted` | `#868686` | `#666666` | **darkened 25 %** per channel; the reference value reaches only 3.64:1 on white, 3.28:1 on the band and 3.16:1 on the evidence surface — all below 4.5:1 | 5.74 / 5.18 / 4.99 |
| `--accent-primary` (links, primary button fill) | `#2a93c9` | `#1f6f99` | **darkened about 25 %** per channel; the reference value reaches only 3.43:1 on white, 3.10:1 on the band, 2.98:1 on the evidence surface and 3.43:1 with white button text | 5.54 / 4.99 / 4.81; white on it 5.54 |
| `--accent-primary-strong` (hover, focus outline) | `#21749f` | `#1c6288` | **darkened about 15 %**; the reference hover tone reaches 4.49:1 on the evidence surface `#edeff4` — just under the 4.5:1 floor for a link colour — and is deepened so the hover tone and the focus outline hold on every band | 6.66 / 6.01 / 5.79 |
| `--rule` (meaningful borders) | `#bdbdbd` | `#858585` | **darkened about 30 %**; the reference grey is only 1.88:1 / 1.69:1 / 1.63:1 and cannot carry a meaningful boundary | 3.69 / 3.33 / 3.21 |
| `--rule-soft` (decorative separators only) | `#e5e5e5` | `#e5e5e5` | copied; decorative only, never the sole cue for a boundary | n/a |
| `--surface-band` (band behind the headline) | `#2a93c9` | `#1f6f99` | the reference accent used as a large fill needs the darkened value to carry white text | white on it 5.54 |
| `--ink-on-band` | `#ffffff` | `#ffffff` | copied | 5.54 |
| `--ink-muted-on-band` | — | `#dbeaf4` | new value needed for the band; the reference's `#868686` on `#2a93c9` is only 1.06:1 | 4.51 |
| `--accent-secondary` (purple) | `#8668ad` | `#8668ad` | copied; white text on it is 4.57:1 | 4.57 |
| `--accent-tertiary` (green) | `#84c450` | `#84c450` | copied; **used with dark ink `#272727` (7.11:1), not white** — white on it would be only 2.10:1 | 7.11 |
| `--accent-warm` (amber) | `#f5bf2f` | `#f5bf2f` | copied; **used with dark ink `#272727` (8.80:1), not white** — white on it would be only 1.70:1 | 8.80 |
| `--accent-emphasis` (orange) | `#f54b0f` | `#f54b0f` | copied; **used with dark ink `#272727` (4.19:1), not white** — white on it would be only 3.56:1 | 4.19 |

### Dark theme (the same accent colours, lightened only as far as contrast needs)

| Token | Value | Why | Ratios |
| --- | --- | --- | --- |
| `--surface-page` | `#191919` | copied from the reference's dark surface | — |
| `--surface-raised` | `#272727` | copied | — |
| `--surface-evidence` | `#2c343b` | copied | — |
| `--ink-heading` | `#ffffff` | copied; 17.58 / 14.94 / 12.64 | 17.58 / 14.94 / 12.64 |
| `--ink-body` | `#e5e5e5` | copied; 13.96 / 11.86 / 10.03 | 13.96 / 11.86 / 10.03 |
| `--ink-muted` | `#bdbdbd` | copied; 9.36 / 7.95 / 6.73 | 9.36 / 7.95 / 6.73 |
| `--accent-primary` (links, primary button fill) | `#55bbeb` | the reference's own light blue from the same accent family: the reference accent `#2a93c9` carries white button text at only 3.43:1 on the dark surfaces, while `#55bbeb` carries the dark ink at 8.12:1 — the same accents, lightened only as far as contrast needs | 8.12 / 6.90 / 5.83; dark ink on it 8.12 |
| `--accent-primary-strong` (hover, focus outline) | `#79ccf2` | the reference's own lighter blue, kept distinct from the link colour and strong enough for the focus outline on every dark surface | 9.82 / 8.35 / 7.06 |
| `--rule` (meaningful borders) | `#808080` | new value for the dark theme: the reference has no dark-theme rule token, and the light theme's meaningful rule `#858585` reads 4.76 / 4.05 / 3.43 against the dark surfaces — too strong against them — so the rule is set to a mid grey that holds at least 3:1 on all three | 4.45 / 3.78 / 3.20 |
| `--rule-soft` | `#434445` | copied from the reference's grey-darker, decorative only | n/a |
| `--surface-band` | `#55bbeb` | the same accent, as in the light theme | dark ink on it 8.12 |
| `--ink-on-band` | `#191919` | dark ink on the light-blue band | 8.12 |
| `--ink-muted-on-band` | `#12303d` | new value for the band; 6.39:1 | 6.39 |
| `--accent-secondary` (purple) | `#8668ad` | copied; **white text on it (4.57:1)**, because `#e5e5e5` on it is only 3.63:1 | 4.57 |
| `--accent-tertiary` (green) | `#84c450` | copied; dark ink on it 8.37:1 | 8.37 |
| `--accent-warm` (amber) | `#f5bf2f` | copied; dark ink on it 10.36:1 | 10.36 |
| `--accent-emphasis` (orange) | `#f54b0f` | copied; dark ink on it 4.94:1 | 4.94 |

Every text and link colour listed above reaches **at least 4.5:1** on each surface it sits on in its own theme, and every meaningful border and the focus outline reaches **at least 3:1**. No colour is used alone to carry meaning: links are underlined, the focus ring is a solid outline of at least 2 px with an offset, and the active story link is marked by weight and an accent bar as well as colour.

## Both themes, chosen only by the reader's system setting

- The site ships **one light theme and one dark theme**, chosen **only** by `prefers-color-scheme` in CSS. There is **no theme switch**, **no toggle**, and **nothing that needs JavaScript**, so keyboard order and no-JavaScript reading are untouched.
- Because the reference's background is **light**, the **light theme copies the reference's background and main colours**, and the **dark theme uses the same accent colours**, adjusted (lightened or darkened) only as far as contrast requires, as listed above.
- `color-scheme: light dark` stays declared so native UI matches the active theme.

## The headline font family for the parallel font task

**Asap** (SIL Open Font License 1.1) — the reference's own headline face, and therefore the closest possible OFL match — is the family the parallel font task commits into `src/app/fonts/` with its full OFL text and a source/version/date note, wired through `next/font/local` in `src/lib/fonts.ts` and used for headings only, with **Inter** unchanged for body text. Documented fallback order if no Asap file can be obtained: **Fraunces**, then **Source Serif 4**. If none of the three can be obtained, Inter stays for headings and the reason is recorded here.

## Supersedes (visual decisions only)

This record replaces the following **visual** decisions, and only those:

**From `docs/adr/0007-immersive-2026-design.md`:**

1. The warm cream light surfaces (`#f6f1e7` page, `#fdfbf6` raised, `#e9efe9` evidence) and the restrained teal accent (`#0e6b63`) are replaced by the reference-derived white and blue surfaces and accent recorded above.
2. The "deep immersive warm" dark theme is replaced by the reference's own dark surfaces (`#191919`, `#272727`, `#2c343b`) with the same accents, lightened only for contrast.
3. The one-radius "rounded card" language is replaced by the reference's two-shape language: a 5 px rounded rectangle for cards and boxes, a 23 px pill for story links and call-to-action buttons.
4. The type scale and heading face tied to the warm editorial look are replaced by the reference's headline proportions and the Asap face; body text stays Inter.
5. The 72–80rem header shell colour treatment is replaced by the reference's banded, alternating-band page structure; the 38–42rem reading column is unchanged.

**From `docs/adr/0006-editorial-design-system.md`:**

1. The warm neutral surfaces, the distinct evidence surface `#e9efe9` and the teal accent with its depth step are replaced by the new surfaces and the `#1f6f99` / `#55bbeb` accent pair.
2. "The page surface is not pure white" is replaced: the light theme's page surface is now the reference's `#ffffff`.
3. The navy-to-teal link decision is replaced by the reference's `#2a93c9` accent, darkened to `#1f6f99` in the light theme and lightened to `#55bbeb` in the dark theme for contrast.
4. Inter for headings (weight 700) is replaced by Asap for headings; Inter stays the body face.
5. The focus outline and the underline-everywhere rule stay; only the accent colour the outline uses changes to the new accent pair.

**From `docs/adr/0006-science-editorial-reading-progress.md`:**

1. The composed hero on a plain page surface is replaced by the reference's full-bleed **colour band behind the headline**, while the same content, the same hooks (`div.hero`, `main#main-content`, `.skip-link`, `header nav[aria-label="Main"]`, `.progress-cluster`, `.next-story-cue`, `figure.claim-evidence`, `section.sources`, `main time[datetime]`) and the same reading order stay.
2. The evidence panel's flat warm panel with an accent left edge is replaced by the reference's 5 px rounded card treatment on the `#edeff4` evidence surface.
3. The reference's alternating-band section rhythm and the extra whitespace between sections are adopted.

## Stays in force

- **Everything else in ADRs 0001–0007 stays in force**, including: WCAG 2.2 Level AA as the requirement (with contrast computed in tests for both themes, without this or any document claiming complete WCAG or cross-browser verification); the header-only navigation with the skip link, exactly one labelled nav, exactly one `aria-current="page"` link whose active state is not colour alone; the header reading progress ("Story N of 5", the next-story cue, "End of the stories"); the composed hero and section structure and the home page sources block; the 38–42rem reading column; underlined links; a solid focus outline of at least 2 px with an offset; body text of at least 1rem at a line-height of 1.5 or more; no `100vw`; no min-width above 320 px; no `text-transform`; motion only where the reader has not asked for reduced motion; static content in `src/lib/site-content.ts` with the citations and evidence panels unchanged; loopback-only hosting at 127.0.0.1:3000; no sign-in; no database; no `use client` anywhere, so every page stays server-rendered and readable without JavaScript; no hamburger, second menu, slider, form or pop-up; nothing loaded from the internet; and the committed local fonts.
- The page text, headings, titles, citations, evidence content, stage labels, dates, review dates, the lifespan terms, the disclaimers, the routes and the reading order stay word for word. Only the illustrations' alt texts and SVG titles change.

## Notes

- The reference was read once, on 2026-11-04, with `webfetch` on the wrapper page, the framed template and its three stylesheets. No part of it is in this repository: no CSS rule, image, icon, icon font, logo, photograph, font file or sentence of the reference's text was copied, and the new look is implemented from scratch in the project's own stylesheet with its own values.
- The reference is a commercial TemplateMonster template (a paid product); this record observes it and implements an independent look from those observations only, and no reference asset or code is redistributed here.
- This record does not claim completed WCAG 2.2 AA conformance or cross-browser verification. The contrast figures above are computed values for the token pairs named; the browser checks and the manual checks still to do remain listed in `docs/runbooks/accessibility-validation.md`.
- The follow-on tasks in this milestone: commit one Asap file with its OFL licence in `src/app/fonts/` and wire it for headings; replace the tokens in `src/app/globals.css` with the pairs above for both themes; rewrite the visual test pins as equal or stronger safeguards in both themes; rebuild the five pages in the new look; and redraw the six illustrations in the new palette with matching alt texts.
