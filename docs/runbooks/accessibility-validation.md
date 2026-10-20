# Accessibility validation

Evidence record for milestone 4, "Validate complete reading experiences and record accessibility evidence." This file separates three kinds of entries and never mixes them:

1. **Executed** — the Node-only HTTP safeguard `npm run verify:reading`, run on this computer on 2026-10-18.
2. **Pending Elara execution** — the browser page checks that only Elara runs (keyboard sequence, click sequence, in-browser accessibility audits). A builder must not mark these passed, failed, or substituted.
3. **Unverified** — checks that cannot be executed on this computer or from a builder run, each with reproduction steps. The status word is `unverified`, never `passed`.

A **failure** is a check that was run and did not meet its expectation; an **unavailable check** is one that could not be run and stays `unverified`. This record currently contains **zero failures**; the pending and unverified sections are not failures, and nothing below claims complete WCAG 2.2 AA conformance or complete cross-browser verification.

## Environment

- Computer: Windows.
- Tooling for the executed check: Node.js 22.16.0 and npm 10.9.2 (the Node runtime that runs `scripts/verify-reading.mjs`). No browser, no browser automation, and no accessibility-testing tool were launched for the executed check.
- Server: the production server started with `npm start`, which builds and then serves with `next start --hostname 127.0.0.1 --port 3000` (loopback-only; documented in [local-start.md](local-start.md) and not re-proved here).
- Routes: `/`, `/how-ai-helps`, `/cancer`, `/diseases`, `/longevity`.
- Date of the executed check: 2026-10-18.

## Status summary

| Check | Tool | Status |
| --- | --- | --- |
| Server-rendered reading contract over loopback HTTP, all five routes | `npm run verify:reading` (Node.js 22.16.0), 2026-10-18 | executed — pass (exit code 0) |
| Keyboard reading order and final-story activation at 375, 768, 1280 px | Elara page check (browser to be named by Elara) | pending Elara execution — not yet a result |
| Complete reading sequence with progress updates at 375, 768, 1280 px | Elara page check (browser to be named by Elara) | pending Elara execution — not yet a result |
| In-browser accessibility audit (axe / Lighthouse / accessibility pane) | whatever Elara can actually run; otherwise a person with axe or Lighthouse | pending Elara execution — not yet a result (falls to unverified if Elara does not run it) |
| Native Safari on macOS and iOS | Safari (version to be noted on the machine used) | unverified |
| Screen-reader navigation (NVDA on Windows, or VoiceOver on macOS/iOS) | NVDA or VoiceOver (version to be noted) | unverified |
| 200% text enlargement (WCAG 2.2 AA 1.4.4) | Chrome, Edge, or Firefox (version to be noted) | unverified |
| 400% zoom / reflow (WCAG 2.2 AA 1.4.10) | Chrome, Edge, or Firefox (version to be noted) | unverified |
| JavaScript-disabled reading in a real browser | Chrome, Edge, or Firefox (version to be noted) | unverified |

## Executed: Node-only server-rendered reading safeguard

- **What:** `npm run verify:reading` (`scripts/verify-reading.mjs`), run on this computer on **2026-10-18**.
- **Method:** the script refused to start anything while TCP port 3000 was occupied, then **started its own loopback production server** (`npm start` — production build, then `next start` bound to `127.0.0.1:3000`), polled only `http://127.0.0.1:3000/` until it answered, and verified against the OS-reported listeners that the sole listener on port 3000 was loopback (`127.0.0.1:3000`, pid 80948) and owned by the process tree the script started. It then fetched the five routes with plain HTTP (Node's built-in fetch — no JavaScript was ever executed and no browser was launched) and checked each server-rendered `text/html` response for the essential reading contract: exactly one `main#main-content` with exactly one `h1` (the route's heading) and body paragraphs; the route's title in the document `<title>`; at least one local `/images/` illustration with non-empty alt that also answered HTTP 200 with an image content type; at least one `https://` citation anchor inside main; the visible disclaimer "not medical advice"; the header `nav[aria-label='Main']` containing exactly the five story links in reading order; exactly one `aria-current="page"`, on this route's link; the visible "Story N of 5" label; the skip link before the header; and a `time` with a `datetime`. Story 5 additionally carried "End of the stories" and the three lifespan terms; stories 1–4 carried exactly one next-story cue. Finally it stopped only the process tree it had started and waited until port 3000 was free again.
- **Routes fetched:**
  - `/` — HTTP 200, 18,202 bytes of server-rendered HTML
  - `/how-ai-helps` — HTTP 200, 26,312 bytes
  - `/cancer` — HTTP 200, 21,908 bytes
  - `/diseases` — HTTP 200, 17,117 bytes
  - `/longevity` — HTTP 200, 20,131 bytes
- **Outcome:** exit code **0**. The script's final line, quoted:
  > `[verify-reading] PASS: all five routes (/, /how-ai-helps, /cancer, /diseases, /longevity) served the complete server-rendered reading contract over loopback HTTP — story content, local illustration, citations, disclaimer, the five story links, and the correct current-page state on every route; the listener was loopback-only and the started process tree was cleaned up. These are Node-only HTTP safeguards against the production server's rendered HTML, not proof of complete no-JavaScript browser behaviour or WCAG 2.2 AA conformance.`
- **What this is, and is not:** these are **server-rendered HTTP safeguards** against the production server's rendered HTML. They are **not** proof of complete no-JavaScript browser behaviour (a Node HTTP fetch is not a browser, and the script not executing JavaScript does not show that a real browser reads the page without JavaScript), **not** proof of keyboard focus or focus visibility, and **not** WCAG conformance. The responses were checked as strings over HTTP and are not described here, or anywhere else, as browser results.

## Reusable check definitions (data, not results)

`tests/e2e/reading-experience.json` (version 2) holds the reusable browser-level check definitions that **Elara's page checks consume**. They are definitions, not results observed by a builder:

- Viewports: 320, 375, 768, 1280, 1920 px.
- Skip-link keyboard flow per route: press Tab, wait for `.skip-link:focus`, press Enter, wait for `#main-content:focus`; skip-link text "Skip to main content".
- Per-route expected progress strings "Story N of 5" (N = 1…5) and "not medical advice"; expected elements `main#main-content h1`, the route's `header nav[aria-label='Main'] a[href='…'][aria-current='page']`, `main time[datetime]`, `main a[href^='https://']`, `main img[alt]`; a next-story cue on stories 1–4 and the ending state "End of the stories" on story 5, where story 5 also expects the visible strings "Life expectancy", "Maximum lifespan", and "Healthy lifespan".
- Global expectations: no console errors, no horizontal scrolling, no failed requests to its own server, exactly one main landmark, exactly one labeled Main nav, exactly one active nav link.
- A `serverContract` object that the Node safeguard above enforces over plain HTTP, and an `unverifiedGaps` list (native Safari, screen-reader navigation, 200% zoom, reflow beyond the listed viewports) that mirrors the unverified section below.

The definition file's completeness is not a browser result: no step in it has been observed in a browser by a builder.

## Checks Elara executes

The following checks run **only as Elara page checks**, outside this builder run. Status for all of them: **pending Elara execution — not yet a result.** Do not mark them passed, failed, or substituted in this file. After Elara runs each one, **only Elara may fill in the browser name, full version, date, width, and outcome**; a builder must not invent those fields.

All checks start the server with `npm start` (loopback production server) and use the base URL `http://127.0.0.1:3000/` at widths **375, 768, and 1280 px**.

### Keyboard reading order and final-story activation

At each of 375, 768, and 1280 px, Elara opens `http://127.0.0.1:3000/`, then:

1. Press Tab — wait for `.skip-link:focus`.
2. Press Tab — wait for `header nav a[href='/']:focus`.
3. Press Tab — wait for `header nav a[href='/how-ai-helps']:focus`.
4. Press Tab — wait for `header nav a[href='/cancer']:focus`.
5. Press Tab — wait for `header nav a[href='/diseases']:focus`.
6. Press Tab — wait for `header nav a[href='/longevity']:focus`.
7. Press Enter — wait for `header nav a[href='/longevity'][aria-current='page']`.
8. Wait for the text "Story 5 of 5".
9. Expects an element `main#main-content h1`, an element `header nav[aria-label='Main']`, no console errors, no sideways scrolling, and no failed requests to its own server.

Status: pending Elara execution — not yet a result.

### Complete reading sequence with progress updates after each navigation

At each of 375, 768, and 1280 px, Elara opens `http://127.0.0.1:3000/`, then:

1. Click `header nav a[href='/how-ai-helps']` — wait for `header nav a[href='/how-ai-helps'][aria-current='page']`, then the text "Story 2 of 5".
2. Click `header nav a[href='/cancer']` — wait for `header nav a[href='/cancer'][aria-current='page']`, then the text "Story 3 of 5".
3. Click `header nav a[href='/diseases']` — wait for `header nav a[href='/diseases'][aria-current='page']`, then the text "Story 4 of 5".
4. Click `header nav a[href='/longevity']` — wait for `header nav a[href='/longevity'][aria-current='page']`, then the text "Story 5 of 5".
5. Expects an element `main#main-content h1`, an element `header nav[aria-label='Main']`, no console errors, no sideways scrolling, and no failed requests to its own server.

Status: pending Elara execution — not yet a result.

### In-browser accessibility audit

Any in-browser accessibility audit Elara can actually run (axe-core / axe DevTools, Lighthouse, or the browser's own accessibility pane) against the five routes. Status: pending Elara execution — not yet a result. If Elara does not run one, this check stays in the unverified section below.

## Unverified checks

These checks cannot be executed on this computer or from a builder run, and no substitute is recorded: Node-rendered or string-parsed HTML, and a headless browser's accessibility tree, are **not** treated here as browser or assistive-technology results. Each status is the word **unverified**, never "passed".

### Native Safari on macOS and iOS — unverified

This computer is Windows (Node 22.16.0); there is no native Safari here, and this check was **not** done. WebKit is not native Safari: a WebKit-engine result must not be recorded as native Safari coverage.

Reproduction (on a Mac or iPhone):

1. Open the current Safari and note the exact version from its About dialog.
2. From the project root, start the site with `npm start` (loopback `127.0.0.1:3000`).
3. Open `http://127.0.0.1:3000/`.
4. Repeat the keyboard sequence (Tab through the skip link and the five header story links, Enter on the last) and the click sequence (`/how-ai-helps`, `/cancer`, `/diseases`, `/longevity`) at 375, 768, and 1280 px, and at a phone width on iOS.
5. Record the Safari version, date, width, and pass/fail for each run.

Note for the iPhone case: `127.0.0.1` on an iPhone is the iPhone itself, so the loopback-only site must be running on that device for the URL to work; on a Mac the loopback URL works directly.

Status: unverified.

### Screen-reader navigation — unverified

Covers landmark and heading structure, the skip link, and the "Story N of 5" progress cue announced correctly. The tools a person would use are **NVDA on Windows** or **VoiceOver on macOS/iOS**. This check was not done.

Reproduction:

1. Start the loopback production server: `npm start`.
2. Launch NVDA (Windows) or VoiceOver (macOS/iOS) and open `http://127.0.0.1:3000/` in a supported browser.
3. Navigate by landmark and heading structure: confirm the skip link is the first focus stop, that the `header` landmark with `nav[aria-label='Main']` and the `main#main-content` landmark are announced, and that the heading order follows the story structure.
4. Activate the skip link (Enter) and confirm focus lands on the main content.
5. Move through the five header story links in order (`/`, `/how-ai-helps`, `/cancer`, `/diseases`, `/longevity`) and confirm that the current page (the `aria-current` state) and the "Story N of 5" position are announced correctly on each page.
6. Record the screen reader name and version, the browser name and version, date, routes, and pass/fail per step.

Status: unverified. Do not substitute the accessibility tree from a headless browser or from parsed HTML.

### 200% text enlargement — unverified

WCAG 2.2 AA 1.4.4. The milestone requires this wherever the capability is available and forbids marking it passed without a real browser: a builder cannot launch a browser from an npm script, and Elara's listed page checks use widths 375, 768, and 1280 px, which are not 200% text enlargement.

Reproduction: in the current Chrome, Edge, or Firefox, set the text size (or page zoom) to 200%, reload each of the five routes, and confirm the story text remains readable and the skip link still reaches the main content. Record the browser name, full version, date, route, zoom level, and viewport.

Status: unverified in this file.

### 400% zoom / reflow — unverified

WCAG 2.2 AA 1.4.10. The same caveat as 200% applies: Elara's listed widths (375, 768, 1280 px) are not 400% zoom, and a builder cannot launch a browser from an npm script.

Reproduction: in the current Chrome, Edge, or Firefox, set the page zoom to 400% — equivalently, a 320 CSS-px-wide window at 1280 CSS px of content is the 400% reflow equivalent — reload each of the five routes, and confirm:

- the text remains readable;
- the skip link still reaches the main content;
- there is no two-dimensional scrolling (no sideways scrolling) — content reflows to a single dimension at 400%.

Record the browser name, full version, date, route, zoom, and viewport.

Status: unverified in this file.

### JavaScript-disabled reading in a real browser — unverified

The Node safeguard does not execute JavaScript, but that is not browser proof: it shows what the server sends, not what a real browser renders and lets a reader use with JavaScript turned off.

Reproduction:

1. Start the loopback production server: `npm start`.
2. In the current Chrome, Edge, or Firefox, disable JavaScript for `http://127.0.0.1:3000` (browser site setting, developer tools, or an extension).
3. Reload all five routes and confirm, on each: the story heading, at least one local illustration, the citations, the "not medical advice" disclaimer, the five navigation links, and the current-page text ("Story N of 5" with the active state) are present and usable.
4. Record the browser name, full version, date, route, and pass/fail.

Status: unverified.

### In-browser accessibility auditing (axe / Lighthouse / accessibility pane) — unverified

If Elara does not run an in-browser audit (see "Checks Elara executes"), this check stays unverified. Reproduction, run by a person — **an npm script must not launch axe, Lighthouse, or any browser automation**:

- **axe:** run the axe DevTools extension (or the axe-core rule runner from developer tools) on each of the five routes at 375, 768, and 1280 px; record the axe version, browser, version, date, route, width, and pass/fail.
- **Lighthouse:** in Chrome or Edge developer tools, open the Lighthouse panel and run the accessibility audit on each of the five routes; record the Lighthouse version, browser, version, date, route, and outcome.
- **Browser accessibility pane:** open the "Accessibility" panel in Chrome developer tools (or the "Accessibility" inspector in Firefox), inspect the tree on each route, and record the browser, version, date, route, and what was observed.

Status: unverified.

## Support requirements that remain in force, not verified by this file

The following requirements remain in force for the project and are **not** verified by any check in this file:

- Current Chrome, Edge, Firefox, and Safari support on phone, tablet, and desktop.
- WCAG 2.2 AA conformance.

This file deliberately makes no claim of complete WCAG 2.2 AA conformance and no claim of complete cross-browser verification.

## Limitations

- No check in this file is a completed WCAG audit: the one executed check is a Node-only HTTP safeguard, the Elara page checks have not been executed yet, and every remaining listed check is unverified.
- The completeness of the definition file (`tests/e2e/reading-experience.json`) is not a browser result.
- Loopback-only hosting is documented in [local-start.md](local-start.md) and is not re-proved here. (The safeguard run above did confirm its own started server listened only on `127.0.0.1:3000`; that is part of the safeguard record, not a re-proof of the runbook's standing claim.)
- Browser fields are filled in only when actually observed: a browser name, full version, date, route, width, and outcome must come from the run that observed them — Elara's page checks, or a person with the named tool — never from a builder run on this computer.
