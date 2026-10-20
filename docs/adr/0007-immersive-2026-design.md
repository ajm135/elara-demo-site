# 0007: Immersive 2026 design: dual themes, larger type, wider shell, rounded cards

- Status: accepted
- Date: 2026-10-20

## Context

The five pages ship the 18 October science-editorial redesign (branch elara/eb27e8bc-redesign-demo-site-s-five-existing-pages, commit 3f382d9), whose visual system is recorded in `docs/adr/0006-editorial-design-system.md` (tokens, local type, the no-animation rule) and `docs/adr/0006-science-editorial-reading-progress.md` (page composition and header reading progress). The operator has asked for a bolder, more immersive modern 2026 look for general readers: wide top sections with large headlines, a wider page around a text column that stays easy to read, rounded cards for the evidence panels, a dark theme alongside the light one, one consistent modern style for the six existing illustrations, and subtle motion that turns off when the reader prefers reduced motion. Everything else — the page text, the citations and evidence-panel content, the reading progress, the routes, the header-only navigation, and the loopback-only servers — stays as it is, and the six closed review findings are not reopened.

The theme follows the reader's system setting only: there is no theme switch and nothing that needs JavaScript, so keyboard order and no-JavaScript reading are untouched by the theme decision.

## Decision

- Two themes, one reader choice: the site ships a light theme and a dark theme, chosen only by the reader's system setting via `prefers-color-scheme`. There is no theme switch and no JavaScript. The light theme keeps its warm, cream-like character, and the dark theme is a deep immersive surface rather than an inverted light palette. `src/app/globals.css` declares `color-scheme: light dark` so native UI (scrollbars, form controls) matches the active theme, and every surface, ink, accent, rule, and focus colour exists as a token for both themes.
- A larger type scale: the editorial scale of the 18 October design steps up. Body text grows above the old 1rem base, the heading steps grow above the old hero clamp (1.875rem to 3rem), and the largest display sizes are reserved for the wide top sections. The test floor stays at body text of at least 1rem at a line-height of at least 1.5.
- A wider page around a capped column: the page shell widens around the long-form text, which stays capped at the `--measure` token (38–42rem, about 60–75 characters per line) and is never the full viewport. In this milestone only the header chrome widens (about 72–80rem); the full-bleed top sections with large headlines are the page-layout milestone that builds on these tokens.
- Rounded cards: the evidence panels become rounded cards, and one radius token is the shared rounding language for the framed hero and story illustrations and for the home page sources block, so the site has one card language instead of square frames.
- One illustration style: the six existing illustrations are defined to share one consistent modern illustration style. Their file names do not change in this milestone; the redraws and the matching alt-text updates are a later milestone, and this ADR records only the style decision they follow.
- Subtle motion, reader-gated: decorative motion is CSS only, under 5 seconds, and never loops. It is applied only inside `@media (prefers-reduced-motion: no-preference)`, every page is fully readable with motion off, and motion never carries required information or defers any content.
- Verified in both themes: the tests that pinned the old cream-and-teal look are rewritten into equal or stronger safeguards that cover both themes — computed WCAG 2.2 contrast (at least 4.5:1 for every text and link colour on each surface it is used on, at least 3:1 for meaningful borders and the focus outline), underlined links, a solid focus outline of at least 2px with an offset, body size and line-height, the 38–42rem text-column measure, no 100vw, no min-width above 320px, no text-transform, and motion only where the reader has not asked for reduced motion.

## Supersedes (visual decisions only)

This ADR replaces four visual decisions of the two 0006 records — `docs/adr/0006-editorial-design-system.md` and `docs/adr/0006-science-editorial-reading-progress.md` — and only those:

- The light-only warm cream-and-teal palette is replaced by the dual-theme token system above.
- The 46rem header measure is replaced by the wider page shell around the capped 38–42rem text column.
- The square (unrounded) evidence-panel and illustration frames are replaced by the rounded-card radius language.
- The "no animation" rule is replaced by the CSS-only, reader-gated decorative motion above.

## Stays in force

- WCAG 2.2 Level AA remains the requirement, with contrast verified as computed ratios in tests for both themes — without this or any other document claiming complete WCAG or cross-browser verification.
- From the 0006 records: header-only navigation with exactly one labelled nav, the skip link, exactly one `aria-current="page"` link, the header reading progress ("Story N of 5", the next-story cue, "End of the stories"), the composed hero and section structure, and the home page sources block.
- From 0001–0005: static content in `src/lib/site-content.ts` with the citations and evidence panels unchanged, local-only loopback hosting at 127.0.0.1:3000, no sign-in, no database, no `use client` anywhere (every page stays server-rendered and readable without JavaScript), and the committed local fonts.

## Notes

- This ADR does not claim complete WCAG 2.2 AA conformance or cross-browser verification. Contrast is computed in tests for both themes; the dark theme, reduced-motion behaviour, an axe or Lighthouse audit, screen-reader navigation, 200% and 400% zoom, JavaScript-off reading, and native Safari remain manual checks still to do, to be recorded in `docs/runbooks/accessibility-validation.md`.
- This milestone sets up the design system only: the dual-theme tokens in `src/app/globals.css`, the rewritten safeguards in `tests/`, this ADR, and a root `.editorconfig` matching the existing files (LF, UTF-8, 2-space indentation, final newline). Wide top sections with large headlines, the illustration redraws and alt-text updates, and the write-up of Elara's browser results wait for later milestones.
