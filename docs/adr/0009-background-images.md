# 0009: Original full-bleed background images behind each story's opening and one later band

- Status: accepted
- Date: 2026-11-04
- Reference page (read for overlay and background roles only): https://demo.templatemonster.com/demo/55809.html
- Replaces: only the flat colour opening from `docs/adr/0008-reference-look.md` ("Top of page"). Everything else in that record stays in force.

## Context

ADR 0008 translated the reference's photographic hero into a flat colour band (`--surface-band`) behind each page's headline, because milestone 2 had no pictures to put there. The operator asked for the background images "and all": the five pages should open the way the reference's pages open, on a picture that reaches the edges, with the header sitting on that picture, and each page should carry one further full-bleed image band lower down.

The reference was fetched once more on 2026-11-04, only to confirm the **roles** of its backgrounds. Three roles were observed and nothing else was taken — no picture, no CSS rule, no icon, no logo, no font, no text:

1. **A photographic hero** that fills the top of the page edge to edge, with light text and a pill button sitting on it. In the reference it is a slider; this site has no slider and no client JavaScript, so it is one static background per page.
2. **A transparent header sitting on that image**: the reference positions its header over the hero picture rather than above it on its own bar.
3. **One later full-bleed dark image band** lower on the page, with a left-aligned headline and a short paragraph in light ink. This site's later band is purely decorative and carries no text.

The reference lets its text sit directly on photograph pixels, so its legibility depends on which photograph is loaded. This site does not: its text sits on a solid scrim, so contrast is a property of the stylesheet and can be computed in the tests.

## Decision

The five pages use **original full-bleed background images**: ten original SVG files drawn for this project, committed under `public/images/`, served as static files and referenced only as CSS `background-image` URLs. None is a content image: they are decorative, they carry no alt text, and they are not listed in `src/lib/site-content.ts`. The six content illustrations are unchanged.

### The ten files and where they paint

One hero image and one later band image per page, by route:

| Route | `--hero-image` | `--band-image` |
| --- | --- | --- |
| `/` | `/images/bg-home-hero.svg` | `/images/bg-home-band.svg` |
| `/how-ai-helps` | `/images/bg-how-ai-helps-hero.svg` | `/images/bg-how-ai-helps-band.svg` |
| `/cancer` | `/images/bg-cancer-hero.svg` | `/images/bg-cancer-band.svg` |
| `/diseases` | `/images/bg-diseases-hero.svg` | `/images/bg-diseases-band.svg` |
| `/longevity` | `/images/bg-longevity-hero.svg` | `/images/bg-longevity-band.svg` |

A parallel task draws and commits the ten files; this record and the stylesheet only name them. They are original synthetic art, show no real people, and copy nothing from the reference.

### Markup

- Each route wraps its existing `SiteHeader` and `StoryPage` in one plain, non-focusable `div.story-frame.story-frame-{id}` (`home`, `how-ai-helps`, `cancer`, `diseases`, `longevity`). The wrapper only carries the two custom properties; the skip link stays the first anchor on the page, and the reading and keyboard order are unchanged.
- `StoryPage` keeps the hero as exactly `<div class="hero">`, the first element inside `main#main-content`. Immediately after the hero, and not inside it, it renders one empty decorative `<div class="image-band" aria-hidden="true">` before the later illustrations and the sections. The band holds no heading, text, link, or image.
- No `"use client"`, no slider, no carousel, no second navigation, no theme toggle.

### Stylesheet

- `.story-frame-{id}` sets `--hero-image` and `--band-image` to the page's two `url("/images/…")` values.
- `header` keeps `background-color: transparent` and paints `--hero-image` with `background-size: cover`, `background-repeat: no-repeat`, `background-position: center top`. The header is already `width: 100%`, so its image reaches the viewport edges without any viewport-width unit.
- `.hero` paints the same `--hero-image` the same way, over an opaque `--scrim` fallback colour, so the picture is the visible ground outside the text scrim. It keeps its span of the page shell: `max-width: var(--page-shell)`, `margin-inline: -1rem`, never wider. Its width is `calc(100% + 2rem)` — exactly the 2 rem of `main` padding the negative margins cancel — because an explicit `width: 100%` with both margins negative is over-constrained and would leave the picture 2 rem short of the shell's right edge.
- `.image-band` spans the page shell the same way, is about 14rem tall, and paints `--band-image` with `background-size: cover`.
- No `100vw` anywhere; nothing scrolls sideways from 320 to 1920 px.

### Text sits on a solid scrim, in both themes

Three new opaque hex tokens, declared in both themes:

| Token | Light theme | Dark theme (`@media (prefers-color-scheme: dark)` only) |
| --- | --- | --- |
| `--scrim` | `#1d6890` (the proven band colour from ADR 0008) | `#12303d` (a deep blue already in the palette; darker than the light scrim) |
| `--ink-on-scrim` | `#ffffff` | `#ffffff` |
| `--ink-muted-on-scrim` | `#e3f0f9` | `#c7e3f4` |

The scrim is painted as a **solid, opaque** `background-color` — no `rgba()`, no translucent overlay, no `opacity` below 1 — on:

- `.hero-text`, with padding so the kicker, the `h1`, the summary and the review line all sit inside it;
- each story link `nav a` (which keeps its underline, its 44 px minimum target and the 23 px pill radius) — the `nav ul` list itself paints nothing, so the header image stays visible between the pills;
- the chips in the progress cluster (`.story-position`, `.next-story-cue`, `.progress-ending`), so "Story N of 5" and the next-story cue sit on the scrim rather than on image pixels.

Nothing covers the whole header or the whole hero with an opaque colour: the picture is the ground, and only the text carries a scrim.

The dark theme is chosen only by `prefers-color-scheme: dark`. It uses the same ten images and a darker solid scrim with light text; there are no paired dark image files and no toggle.

The active story link stays identifiable without colour alone: it is the one link with `aria-current="page"`, it is weight 700, and it is the one filled pill in the row (scrim-coloured text on an `--ink-on-scrim` fill). `#55bbeb` is never used as text on white.

Keyboard focus inside `header` and `.hero` keeps the global 3 px solid outline with its 2 px offset and uses `--ink-on-scrim` as its colour. The global focus outline elsewhere, and the skip link's own opaque card, are unchanged.

### Computed contrast ratios (WCAG 2.2 relative luminance)

Floors: 4.5:1 for text and links, 3:1 for the focus outline and meaningful borders. Every pair below is computed by `tests/design-tokens.test.ts` and `tests/accessibility-essentials.test.ts` in both themes.

| Pair | Where it is used | Light theme | Dark theme | Floor |
| --- | --- | --- | --- | --- |
| `--ink-on-scrim` on `--scrim` | the headline, kicker, summary, story links, progress chips, next-story cue | 6.11:1 | 13.85:1 | 4.5:1 |
| `--ink-muted-on-scrim` on `--scrim` | the review line and the visited story links | 5.27:1 | 10.37:1 | 4.5:1 |
| `--scrim` on `--ink-on-scrim` | the active story link's text on its own filled pill | 6.11:1 | 13.85:1 | 4.5:1 |
| `--ink-on-scrim` on `--scrim` | the focus outline inside the header and the hero | 6.11:1 | 13.85:1 | 3:1 |
| `--ink-muted-on-scrim` on `--scrim` | the story-link pill border | 5.27:1 | 10.37:1 | 3:1 |
| `--scrim` on `--ink-on-scrim` | the active pill's inset bar | 6.11:1 | 13.85:1 | 3:1 |

Because the scrim is opaque, none of these ratios depends on the pixels of the image underneath.

## What this replaces, and what stays

- **Replaced:** only ADR 0008's "Top of page" decision that the photographic hero "becomes a full-width colour band … in the site's own flat colours (no photograph)". The opening is now an original full-bleed background image with the header on it, and each page gains one later full-bleed image band.
- **Stays:** everything else in ADR 0008 and in ADRs 0001–0007 — the light and dark palettes, Asap headings with Inter body text, the 5 px cards and 23 px pills, the alternating section bands, the header-only navigation with the skip link first, the "Story N of 5" progress, the evidence panels, citations and disclaimers word for word, the six content illustrations with their alt text, loopback-only hosting on port 3000, no sign-in, no database, no client JavaScript, no `100vw`, no `text-transform`, and motion only where the reader has not asked for reduced motion. The `--surface-band` tokens remain declared (and still equal the accent) for the token contract; the scrim tokens are what the opening now paints.

## Consequences

- The reading contract is at least as strong as before: the same hooks (`.skip-link`, `header nav[aria-label="Main"]`, `main#main-content .hero`, `.progress-cluster`, `.next-story-cue`, `.progress-ending`) are in the same order, and every text colour on the opening is computed against a solid scrim in both themes.
- The tests lock the background-image contract: each `.story-frame-*` must declare both local `/images/` URLs, the header and hero must paint `--hero-image`, the band must paint `--band-image`, the scrim tokens must be opaque hex colours, and no background URL may be remote or come from the reference.
- This record does not claim complete WCAG 2.2 AA conformance or cross-browser verification. The ratios above are computed token pairs; the browser checks and the manual checks still to do remain listed in `docs/runbooks/accessibility-validation.md`.
