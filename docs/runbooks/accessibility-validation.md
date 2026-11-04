# Accessibility validation

Evidence record for the Demo Site's browser and accessibility checks. This file separates three kinds of entries and never mixes them:

1. **Recorded browser results** — Elara's milestone 2 page checks of this Goal, run against the new design: the reference look recorded in `docs/adr/0008-reference-look.md`. A milestone passes only when every check of it passes, and Elara commits only after a milestone passes. Milestone 2 passed, so every browser check in that section is recorded as **passed**. The milestone record names no browser and no version, so no browser name or version is recorded here.
2. **An executed safeguard** — the Node-only loopback HTTP run of `npm run verify:reading` on 2026-10-18. It is a server-rendered safeguard against the production server's HTML, **not a browser result**, and it predates the new design.
3. **Manual checks still to do** — eight checks that need a person (and, for two of them, macOS or iOS hardware), each with reproduction steps. Their status is "still to do", never "passed".

Milestone 3's record is one additional entry that is **not a browser result**: it is a **review of the six redrawn illustrations**. It is kept in its own section, records only what that review states, and has no browser name, version, or viewport width attached to it; it is never treated in this file as a browser result.

The browser results in this file are for the **new design** (the reference look) and supersede the earlier recorded browser results, which were for the previous look of 20 October (`docs/adr/0007-immersive-2026-design.md`). No results of that earlier design are carried forward in this file: those runs are not results of this Goal. The 2026-10-18 `npm run verify:reading` run is kept in this file as a server-rendered safeguard record, not as a browser result.

A **failure** is a check that was run and did not meet its expectation. This record contains **zero failures**: every check that was actually run passed — the two recorded browser checks (2026-11-04), the recorded milestone 3 review (2026-11-04), and the recorded Node-only safeguard run (2026-10-18, exit code 0) — and the manual checks still to do are not failures. Nothing in this file, or anywhere else in the project, claims complete WCAG 2.2 AA conformance or complete cross-browser verification.

## Environment

- Computer: Windows, the machine the site runs on; the site is loopback-only and has no deployment.
- Server: the loopback-only production server started with `npm start` — `next build`, then `next start --hostname 127.0.0.1 --port 3000`. Base URL `http://127.0.0.1:3000/`. Loopback binding is documented in [local-start.md](local-start.md) and is not re-proved here.
- Design under test: the reference look recorded in `docs/adr/0008-reference-look.md` (dated 2026-11-04), which replaces the visual design of 20 October (`docs/adr/0007-immersive-2026-design.md`). Described only as that record describes it:
  - light and dark themes chosen **only** by the reader's system setting (`prefers-color-scheme`) — no switch, no toggle, no JavaScript; the theme closest to the reference's background (the light theme) copies it, and the dark theme uses the same accent colours;
  - a full-width **colour band behind each page's headline**, with the header sitting above it in the same band;
  - **pill-shaped story links** in the header navigation;
  - **5 px rounded cards** for the evidence panels, the sources block, and the illustration frames;
  - **alternating section bands** (the page surface and the pale band), separated by whitespace;
  - **Asap** headings (the project's committed SIL Open Font License font) with **Inter** body text;
  - the **six illustrations redrawn as flat drawings** in the new colours, adapting to both themes inside each file.
- Routes (reading order): `/` (Home), `/how-ai-helps` (How AI helps), `/cancer` (Cancer), `/diseases` (Other diseases), `/longevity` (Longer lives).
- Reusable check definitions: `tests/e2e/reading-experience.json` holds the browser-level check definitions that Elara's page checks consume. It is data, not results: the completeness of the definitions is not a browser result.

## Status summary

| Check | Widths (px) | Date | Outcome |
| --- | --- | --- | --- |
| Finished home page, including the skip link reaching main (milestone 2, browser) | 375, 768, 1280 | 2026-11-04 | passed |
| Reading journey from Home through every story to "End of the stories" (milestone 2, browser) | 375, 768, 1280 | 2026-11-04 | passed |
| Review of the six redrawn illustrations (milestone 3 — a review, not a browser run) | not applicable (not a browser run) | 2026-11-04 | passed (review) |
| Server-rendered reading contract over loopback HTTP, all five routes (`npm run verify:reading`, Node-only, no browser) | not applicable (HTTP responses) | 2026-10-18 | executed — pass (exit code 0); predates the new design |
| Screen-reader navigation (NVDA or VoiceOver) | — | — | still to do (manual) |
| 200% text enlargement (WCAG 2.2 AA 1.4.4) | — | — | still to do (manual) |
| 400% zoom and reflow (WCAG 2.2 AA 1.4.10) | — | — | still to do (manual) |
| JavaScript-off reading in a real browser | — | — | still to do (manual) |
| Native Safari on macOS and iOS | — | — | still to do (manual) |
| In-browser accessibility audit (axe or Lighthouse) | — | — | still to do (manual) |
| Dark theme in a real browser | — | — | still to do (manual) |
| Reduced-motion behaviour | — | — | still to do (manual) |

## Recorded browser results: this Goal's milestone 2 (the new look)

Source of every outcome below is Elara's milestone record, not a builder run: a milestone passes only when every check of it passes, and Elara commits only after a milestone passes. Milestone 2 — "Rebuild the five pages in the new look" — passed. Every check in this section is therefore recorded as **passed**.

- **Browser:** the milestone record names no browser and no version, so none is recorded here. A browser name or version is written only where a run actually observed one.
- **Date:** **2026-11-04**, the date of the milestone record.
- **Widths:** **375, 768, and 1280 px** (phone, tablet, desktop).
- **Design:** the reference look in `docs/adr/0008-reference-look.md`, as described in [Environment](#environment).

All checks ran against the loopback production server (`npm start`, `http://127.0.0.1:3000/`) with the new design: the colour band behind the headline carries the kicker, the `h1`, the summary and the review date, the header sits above it in the same band, the story links are pills, the evidence panels, sources block and illustration frames are 5 px rounded cards, and the sections sit in alternating bands.

### The finished home page at phone, tablet and desktop widths

**Widths: 375, 768, and 1280 px.**

Steps: press Tab, wait for `.skip-link:focus`, press Enter, wait for `#main-content:focus`.

What the check covered:

- The skip link reaching main content: press Tab, wait for `.skip-link:focus`, press Enter, wait for `#main-content:focus`.
- A document title containing "AI and longer lives".
- The text "A hopeful look at AI and human health".
- The text "Story 1 of 5".
- The text "Next story:".
- The text "Where the evidence comes from".
- The text "not medical advice".
- `header nav[aria-label='Main'] a[href='/'][aria-current='page']` — the home page's active story link in the header navigation.
- `main#main-content h1` — the page's single heading, inside the colour band behind the headline (`div.hero`, main's first element).
- `main img[src='/images/hopeful-future.svg'][alt]` — the opening illustration inside main, with a non-empty alt.
- `main section.sources a[href^='https://']` — the citation links in the home page's "Where the evidence comes from" sources block.
- No console errors, no sideways scrolling, and no failed requests to its own server.

**Outcome: passed** at 375, 768, and 1280 px. **Date: 2026-11-04** (milestone 2).

### The reading journey from Home through every story to "End of the stories"

**Widths: 375, 768, and 1280 px.**

Steps: click `.next-story-cue a`, wait for the text "Story 2 of 5", wait for `header nav[aria-label='Main'] a[href='/how-ai-helps'][aria-current='page']`; click `.next-story-cue a`, wait for the text "Story 3 of 5", wait for `header nav[aria-label='Main'] a[href='/cancer'][aria-current='page']`; click `.next-story-cue a`, wait for the text "Story 4 of 5", wait for `header nav[aria-label='Main'] a[href='/diseases'][aria-current='page']`; click `.next-story-cue a`, wait for the text "Story 5 of 5", wait for `header nav[aria-label='Main'] a[href='/longevity'][aria-current='page']`.

What the check covered:

- Opening `http://127.0.0.1:3000/` and moving through the stories with the page's own next-story cue (`.next-story-cue a`), waiting after each click:
  - "Story 2 of 5" and `header nav[aria-label='Main'] a[href='/how-ai-helps'][aria-current='page']`;
  - then "Story 3 of 5" and `header nav[aria-label='Main'] a[href='/cancer'][aria-current='page']`;
  - then "Story 4 of 5" and `header nav[aria-label='Main'] a[href='/diseases'][aria-current='page']`;
  - then "Story 5 of 5" and `header nav[aria-label='Main'] a[href='/longevity'][aria-current='page']`.
- On the final story, expecting the texts "Longer lives" (the story's heading), "End of the stories", "Life expectancy", "Maximum lifespan", "Healthy lifespan" and "not medical advice".
- `main#main-content h1`.
- The longevity aria-current link (the last step above).
- `main img[src='/images/longer-lives.svg'][alt]` — the final story's illustration inside main, with a non-empty alt.
- `main figure.claim-evidence a[href^='https://']` — the citation link inside the evidence panel.
- No console errors, no sideways scrolling, and no failed requests to its own server.

**Outcome: passed** at 375, 768, and 1280 px. **Date: 2026-11-04** (milestone 2).

## Recorded review: this Goal's milestone 3 (the drawings — not a browser run)

Milestone 3 — "Redraw the six illustrations for the new look" — passed as a **review of the drawings, not as a browser run**. Nothing in this section is a browser result: no browser was launched, and no browser name, version, or viewport width is attached to this entry.

What the review states: the six drawings in `public/images/` share one ADR 0008 flat vector style, keep their names, sizes and subjects, adapt inside each file for both page surfaces, stay vector-only, and have matching titles and alt texts. The shared style itself is recorded in the "Illustration style" section of `docs/adr/0008-reference-look.md`.

- **Date:** **2026-11-04**, the date of the milestone record.
- **Outcome: passed** (review of the drawings).

## Executed safeguard: Node-only server-rendered reading contract (2026-10-18)

This is a server-rendered HTTP safeguard, **not a browser result**, and it **predates the new design**: it ran against the previous look — the design in force on 2026-10-18 — before the reference look in `docs/adr/0008-reference-look.md` was built.

- **What:** `npm run verify:reading` (`scripts/verify-reading.mjs`), run on this computer on **2026-10-18** with Node.js 22.16.0 and npm 10.9.2 — against the previous look, the design in force at that time.
- **Method:** the script refused to start anything while TCP port 3000 was occupied, then started its own loopback production server (`npm start` — production build, then `next start` bound to `127.0.0.1:3000`), polled only `http://127.0.0.1:3000/` until it answered, and verified against the OS-reported listeners that the sole listener on port 3000 was loopback (`127.0.0.1:3000`) and owned by the process tree the script started. It then fetched the five routes with plain HTTP (Node's built-in fetch — no JavaScript was ever executed and no browser was launched) and checked each server-rendered `text/html` response for the essential reading contract: the top section (`div.hero`, main's first element) with exactly one `h1` (the route's heading) and a review-date `time` with a non-empty `datetime`, exactly one `main#main-content` with body paragraphs; the route's title in the document `<title>`; at least one local `/images/` illustration with non-empty alt that also answered HTTP 200 with an image content type; at least one `https://` citation anchor inside main; the visible disclaimer "not medical advice"; the header `nav[aria-label='Main']` containing exactly the five story links in reading order; exactly one `aria-current="page"`, on this route's link; the visible "Story N of 5" label; and the skip link before the header. Story 5 additionally carried "End of the stories" and the three lifespan terms; stories 1–4 carried exactly one next-story cue. Finally it stopped only the process tree it had started and waited until port 3000 was free again.
- **Routes fetched:** `/` — HTTP 200, 18,202 bytes; `/how-ai-helps` — HTTP 200, 26,312 bytes; `/cancer` — HTTP 200, 21,908 bytes; `/diseases` — HTTP 200, 17,117 bytes; `/longevity` — HTTP 200, 20,131 bytes.
- **Outcome:** exit code **0**. The script's final line, quoted:
  > `[verify-reading] PASS: all five routes (/, /how-ai-helps, /cancer, /diseases, /longevity) served the complete server-rendered reading contract over loopback HTTP — story content, local illustration, citations, disclaimer, the five story links, and the correct current-page state on every route; the listener was loopback-only and the started process tree was cleaned up. These are Node-only HTTP safeguards against the production server's rendered HTML, not proof of complete no-JavaScript browser behaviour or WCAG 2.2 AA conformance.`
- **What this is, and is not:** these are **server-rendered HTTP safeguards** against the production server's rendered HTML. They are **not** browser results: a Node HTTP fetch is not a browser, and the script not executing JavaScript does not show that a real browser reads the page without JavaScript. They are **not** proof of keyboard focus or focus visibility, and **not** WCAG conformance.
- **Where the command stands now:** the same command is part of this Goal's **milestone 4 final regression**, which Elara runs. This file records no result for that run, because the author of this record did not make it; no new exit code is recorded here for it.

## Manual checks still to do

Elara's browser checks can resize the viewport but cannot switch the theme, cannot change the reader's reduced-motion preference, cannot turn JavaScript off, and do not run an accessibility audit; screen-reader navigation needs a person, and native Safari needs macOS or iOS hardware, which this computer does not have. The eight checks below are **still to do**, each with reproduction steps, and none of them is recorded as passed. No substitute is recorded for any of them: a Node fetch, parsed HTML, or a headless browser's accessibility tree is not treated in this file as a browser or assistive-technology result.

### 1. Screen-reader navigation (NVDA or VoiceOver) — still to do

Covers landmark and heading structure, the skip link, and the "Story N of 5" progress cue announced correctly. The tools a person would use are **NVDA on Windows** or **VoiceOver on macOS/iOS**.

Reproduction:

1. Start the loopback production server: `npm start`.
2. Launch NVDA (Windows) or VoiceOver (macOS/iOS) and open `http://127.0.0.1:3000/` in a supported browser.
3. Navigate by landmark and heading structure: confirm the skip link is the first focus stop, that the `header` landmark with `nav[aria-label='Main']` and the `main#main-content` landmark are announced, and that the heading order follows the story structure (the single `h1` inside the colour band behind the headline — `div.hero`, main's first element — then the section `h2`s).
4. Activate the skip link (Enter) and confirm focus lands on the main content.
5. Move through the five pill-shaped header story links in order (`/`, `/how-ai-helps`, `/cancer`, `/diseases`, `/longevity`) and confirm that the current page (the `aria-current` state, whose active state is not colour alone) and the "Story N of 5" position are announced correctly on each page.
6. Record the screen reader name and version, the browser name and version, the date, the routes, and pass/fail per step.

### 2. 200% text enlargement (WCAG 2.2 AA 1.4.4) — still to do

Reproduction: start the loopback production server (`npm start`), open `http://127.0.0.1:3000/`, then in the current Chrome, Edge, or Firefox set the text size (or page zoom) to 200%, reload each of the five routes, and confirm the story text remains readable, the long-form column still fits without sideways scrolling, the colour band behind the headline and the pill-shaped story links stay usable, and the skip link still reaches the main content. Record the browser name, full version, the date, the route, the zoom level, and the viewport.

### 3. 400% zoom and reflow (WCAG 2.2 AA 1.4.10) — still to do

Reproduction: start the loopback production server (`npm start`), open `http://127.0.0.1:3000/`, then in the current Chrome, Edge, or Firefox set the page zoom to 400% — equivalently, a 320 CSS-px-wide window over 1280 CSS px of content is the 400% reflow equivalent — reload each of the five routes, and confirm:

- the text remains readable;
- the skip link still reaches the main content;
- the colour band behind the headline and the 5 px rounded cards (evidence panels, sources block, illustration frames) reflow without overlap or clipping;
- there is no two-dimensional scrolling (no sideways scrolling) — content reflows to a single dimension at 400%.

Record the browser name, full version, the date, the route, the zoom, and the viewport.

### 4. JavaScript-off reading in a real browser — still to do

The Node safeguard does not execute JavaScript, but that is not browser proof: it shows what the server sends, not what a real browser renders and lets a reader use with JavaScript turned off.

Reproduction:

1. Start the loopback production server: `npm start`.
2. In the current Chrome, Edge, or Firefox, disable JavaScript for `http://127.0.0.1:3000` (browser site setting, developer tools, or an extension).
3. Open `http://127.0.0.1:3000/` and reload all five routes, confirming on each: the colour band behind the headline with the story heading, the opening illustration, the citations, the "not medical advice" disclaimer, the five pill-shaped navigation links, and the current-page state ("Story N of 5" with an active state that is not colour alone) are present and usable.
4. Record the browser name, full version, the date, the route, and pass/fail.

### 5. Native Safari on macOS and iOS — still to do

This computer is Windows; there is no native Safari here. **WebKit is not native Safari**: a WebKit-engine result must not be recorded as native Safari coverage.

Reproduction (on a Mac or iPhone):

1. Open the current Safari and note the exact version from its About dialog.
2. From the project root, start the site with `npm start` (loopback `127.0.0.1:3000`).
3. Open `http://127.0.0.1:3000/`.
4. Repeat the keyboard sequence (Tab through the skip link and the five pill-shaped header story links, Enter on the last) and the pointer sequence (`/how-ai-helps`, `/cancer`, `/diseases`, `/longevity`) at 375, 768, and 1280 px, and at a phone width on iOS.
5. Record the Safari version, the date, the width, and pass/fail for each run.

Note for the iPhone case: `127.0.0.1` on an iPhone is the iPhone itself, so the loopback-only site must be running on that device for the URL to work; on a Mac the loopback URL works directly.

### 6. In-browser accessibility audit (axe or Lighthouse) — still to do

Reproduction, run by a person — an npm script must not launch axe, Lighthouse, or any browser automation. Start the loopback production server (`npm start`) and open `http://127.0.0.1:3000/`, then:

- **axe:** run the axe DevTools extension (or the axe-core rule runner from developer tools) on each of the five routes at 375, 768, and 1280 px; record the axe version, the browser, its version, the date, the route, the width, and pass/fail.
- **Lighthouse:** in Chrome or Edge developer tools, open the Lighthouse panel and run the accessibility audit on each of the five routes; record the Lighthouse version, the browser, its version, the date, the route, and the outcome.
- **Browser accessibility pane:** open the "Accessibility" panel in Chrome developer tools (or the "Accessibility" inspector in Firefox), inspect the tree on each route, and record the browser, its version, the date, the route, and what was observed.

### 7. Dark theme in a real browser — still to do

Elara's browser checks cannot switch the theme: the dark theme is applied by the site's CSS when the reader's system setting requests it (`prefers-color-scheme: dark`), and there is no theme switch and no JavaScript. A real browser with a dark system setting is the only way to observe it.

Reproduction:

1. Set the operating system's appearance to dark (macOS: System Settings → Appearance → Dark; Windows: Settings → Personalization → Colors → apps set to "Dark"), or emulate `prefers-color-scheme: dark` in the developer tools rendering toolbar.
2. Start the loopback production server: `npm start`, and open each of the five routes at 375, 768, and 1280 px.
3. Confirm on each route: the dark theme surfaces apply throughout (no leftover light-theme surface, no unstyled region), the band behind the headline shows the dark theme's band colours (the light-blue band with dark ink), the six illustrations adapt to the dark theme inside each file (no leftover light-theme fills), the text and links remain readable, the focus outline stays visible, the skip link still reaches main, and there is no sideways scrolling.
4. Record the operating system and its setting, the browser name and version, the date, the route, and pass/fail.

### 8. Reduced-motion behaviour — still to do

Elara's browser checks cannot change the reader's reduced-motion preference. The site's decorative motion is CSS-only, under 5 seconds, never loops, is applied only inside `@media (prefers-reduced-motion: no-preference)`, and every page is fully readable with motion off.

Reproduction:

1. Enable the operating system's reduced-motion setting (macOS: System Settings → Accessibility → Display → "Reduce motion"; Windows: Settings → Accessibility → Visual effects → "Animation effects" off), or emulate `prefers-reduced-motion: reduce` in the developer tools rendering toolbar.
2. Start the loopback production server: `npm start`, and open each of the five routes at 375, 768, and 1280 px.
3. Confirm: no motion is visible, all content is fully visible and readable with motion off, and nothing required is deferred or hidden.
4. With the setting back at its default (no reduced-motion preference), confirm the decorative motion plays once, lasts under 5 seconds, never loops, and never carries required information.
5. Record the operating system and its setting, the browser name and version, the date, the route, and pass/fail.

## Support requirements that remain in force — not fully verified

The following requirements remain in force for the project, and **neither is fully verified** by any check in this file:

- **WCAG 2.2 Level AA** conformance for every page, in both the light and the dark theme.
- **Current Chrome, Edge, Firefox, and Safari** support on phone, tablet, and desktop. The recorded browser results are Elara's milestone 2 runs of this Goal, and the milestone record names no browser; native Safari on macOS and iOS is still to do.

This file deliberately makes no claim of complete WCAG 2.2 AA conformance and no claim of complete cross-browser verification, and no document in the project makes either claim.

## Limitations

- The recorded browser results come from Elara's milestone record, not from a builder run: no builder launched a browser, ran axe or Lighthouse, or substituted a Node fetch, parsed HTML, or a headless accessibility tree for any of them.
- The milestone 3 entry is a review of the drawings, not a browser run; no browser name, version, or viewport width is attached to it.
- Browser names and versions appear only where a run actually observed one. The milestone 2 record names none, so none appear in this file; the only runtime versions recorded here are Node.js 22.16.0 and npm 10.9.2 from the 2026-10-18 safeguard run.
- The 2026-10-18 safeguard ran against the previous look and predates the new design. It is kept in its own section, apart from the browser results: it is a server-rendered safeguard record, not a browser result. The same command is part of this Goal's milestone 4 final regression, which Elara runs; no result for that run is recorded in this file.
- The completeness of the definition file (`tests/e2e/reading-experience.json`) is not a browser result.
- Loopback-only hosting is documented in [local-start.md](local-start.md) and is not re-proved here. (The safeguard run above did confirm its own started server listened only on `127.0.0.1:3000`; that is part of the safeguard record, not a re-proof of the runbook's standing claim.)
- A manual check's result, when it is eventually done, records the browser name, full version, date, route, width, and outcome from the run that observed them.
