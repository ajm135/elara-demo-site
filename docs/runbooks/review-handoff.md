# Review handoff: Demo Site redesign and innovation-review findings

This is the final finding-by-finding handoff for the Demo Site redesign (milestone 5), written on 2026-10-18. It records only what the current project files show; no command results, browser versions, citations, or pass/fail outcomes are invented here. Where a result was recorded by an earlier task, the file that records it is named. The reviewer can verify every statement below against the cited files.

## 1. Redesign

The five existing routes — `/`, `/how-ai-helps`, `/cancer`, `/diseases`, `/longevity` (the five `sitePages` entries in `src/lib/site-content.ts`, in reading order) — were redesigned as a light, calm 2026 science-editorial reading experience for general readers. The design is recorded in:

- `docs/adr/0006-editorial-design-system.md` — the token-driven design system: warm neutral surfaces, dark warm ink, a restrained teal accent, a ~60–75 character measure, underline-plus-focus-visible interaction rules, local committed type (`src/app/fonts/`, Inter, SIL OFL 1.1) wired through `next/font/local` in `src/lib/fonts.ts`, and contrast that is verified in Node by computed WCAG 2.2 ratios in `tests/design-tokens.test.ts` (4.5:1 normal-text pairs, 3:1 meaningful boundaries) instead of exact colour strings.
- `docs/adr/0006-science-editorial-reading-progress.md` — the page composition: each route is a static server component that renders `SiteHeader` with its own path plus `StoryPage`; composed hero, framed local illustrations, evidence panels immediately after the claiming paragraph, the lifespan term list on `/longevity`, and the header-only reading-progress cluster.

Preserved boundaries (unchanged by the redesign):

- Node.js, strict TypeScript, Next.js App Router, fully static server-rendered pages.
- Static content in `src/lib/site-content.ts`; local SVG illustrations under `/images/` (six committed illustrations, none remote); local fonts only — rendering requires no remote assets, no live data, and no JavaScript.
- No sign-in/account, no database, no deployment; hosting is this-computer-only (loopback-only, ADR 0004).
- Header-only navigation: one skip link, one `<header>`, one `nav[aria-label="Main"]` with exactly the five story links, and no second navigation.
- The home browser title remains exactly "AI and longer lives" (`src/app/page.tsx` sets an absolute title; `src/app/layout.tsx` templates the other routes).

Still required, as requirements — not completed verification: WCAG 2.2 AA, and current Chrome, Edge, Firefox, and Safari support on phone, tablet, and desktop. See section 2 (finding 3) and section 5.

Deferred on purpose (not part of this milestone): synthetic walkthroughs, new explanatory diagrams, glossary expansions, and learning questions.

## 2. Disposition of the six innovation-review findings (18 October 2026)

The review produced six findings: four medium and two low. **No high finding existed, and none is open.**

### Finding 1 — Medium: health forecasts lacked an evidence trail — **Closed**

Closed in content. In `src/lib/site-content.ts`, every consequential health claim (nine claims ship today, each with `lastReviewed: "2026-10-18"`) carries one or more publication references from `referenceCatalogue` (title, publishing body or journal, publication date, exactly one stable https URL or DOI), exactly one evidence stage (clinical use, experimental research, or speculation), and a last-reviewed date. The evidence renders beside each claim via `figure.claim-evidence` (`src/components/claim-evidence.tsx`); the home page carries the complete catalogue as its sources block.

- Register (findings per claim, per source, including what each finding does **not** support): `docs/runbooks/content-evidence.md`.
- Policy of record: `docs/adr/0005-evidence-led-health-claims.md`.
- The unsupported cure prediction ("AI will eventually cure cancer and many other diseases") and the 110–120-year population-average lifespan forecast were **removed** from the shipped copy rather than cited; the register's "Claims no longer in the shipped copy" section records this.
- All five catalogue sources were opened directly on 2026-10-18 (the date every claim's `lastReviewed` carries).

Disclosed limitation (kept open as a disclosed gap, not a failure): the Journal of Medical Imaging source (`jmi-2026-imaging-ai-bias-review`, DOI 10.1117/1.jmi.13.4.040901) was inspected at publisher-registered abstract level — citation metadata plus the abstract returned by the DOI resolver/Crossref — because the SPIE full-text page blocked automated retrieval. The recorded findings for that source come from the abstract, not the full text. See section 4.

### Finding 2 — Medium: benefits explained without trade-offs — **Closed**

Closed in content. Per `docs/adr/0005-evidence-led-health-claims.md` and the per-claim limitations in `docs/runbooks/content-evidence.md`:

- The medical stories distinguish **clinical use** (authorized, in use for specific tasks), **experimental research**, and **speculation** in the copy; claims are staged accordingly and a claim a source does not support at its stated stage is narrowed or removed, never re-labelled.
- The copy explains the trade-offs beside the benefits: false positives, missed diagnoses, overdiagnosis, uneven performance across populations, and clinician oversight (the final reading ends with a clinician).
- Clinical use is explicitly **not** universal availability or approval: the FDA source documents US-only, per-intended-use authorization, and the register says so per claim.
- The longevity page explains the three lifespan distinctions — life expectancy (population average), maximum lifespan (longest individual lives on record, not a population forecast), and healthy lifespan (proportion of life in good health) — and makes **no** forecast of the future population-average lifespan.

### Finding 3 — Medium: accessibility promises lacked browser-level evidence — **Partially closed; must stay partial**

What was executed (recorded in `docs/runbooks/accessibility-validation.md`, not re-run here):

- `npm run verify:reading` (`scripts/verify-reading.mjs`) on this computer on **2026-10-18**, with Node.js 22.16.0 and npm 10.9.2. The script started and stopped its own loopback production server, fetched all five routes, and each returned **HTTP 200**; the script exited **0**. The record quotes the script's final PASS line.

What that run is, and is not: it is a **server-rendered HTTP safeguard** over the production server's rendered HTML (story content, local illustrations, citations, disclaimer, the five navigation links, current-page state). It is **not** browser evidence, **not** no-JavaScript proof, and **not** WCAG proof: a Node fetch is not a browser, and no browser was launched.

Pending Elara execution (not results — a builder must not mark them passed, failed, or substituted):

- Elara keyboard page check (skip link through the five header links, Enter on the final story) at 375, 768, and 1280 px.
- Elara click-through reading sequence with progress updates at 375, 768, and 1280 px.
- In-browser accessibility audit (axe / Lighthouse / accessibility pane), if Elara runs one; otherwise it stays unverified.

Explicitly unverified (status word is `unverified`, never "passed", each with reproduction steps in `docs/runbooks/accessibility-validation.md`):

- Screen-reader navigation (NVDA or VoiceOver).
- 200% text enlargement (WCAG 2.2 AA 1.4.4).
- 400% zoom / reflow (WCAG 2.2 AA 1.4.10).
- JavaScript-disabled reading in a real browser.
- Native Safari on macOS and iOS. **WebKit is not native Safari**: a WebKit-engine result must not be recorded as native Safari coverage.
- In-browser axe / Lighthouse audits (if Elara does not run them).

Unchanged requirements, not completed verification: WCAG 2.2 AA, and current Chrome, Edge, Firefox, and Safari support on phone, tablet, and desktop, remain in force (ADR 0004). No browser name or version is recorded in the project except where a run actually observed it.

### Finding 4 — Medium: local-only operation was not enforced — **Closed**

Closed in implementation:

- `package.json` scripts: `dev` is `next dev --hostname 127.0.0.1 --port 3000` and `start` ends in `next start --hostname 127.0.0.1 --port 3000` — both servers bind explicitly to loopback.
- `scripts/verify-local-only.mjs` checks the boundary against the listeners the operating system actually reports: it refuses to start if port 3000 is occupied, starts the development and production servers separately, polls only `http://127.0.0.1:3000/`, reads `netstat -ano`, accepts only loopback addresses (`127.0.0.1`, `::1`), rejects wildcard (`0.0.0.0`, `::`) and any other non-loopback listener, and cleans up only its own process trees.
- Opening a localhost URL is **not** the boundary: it only proves this computer can reach the server. The loopback binding is the boundary, and the OS-reported listener check verifies it.
- The runbook documents this as step 5 of `docs/runbooks/local-start.md`.

Elara reconfirms this with `node scripts/verify-local-only.mjs`. This writing task did **not** run that script, so no fresh listener-run exit code is recorded here; the result is for Elara's acceptance run. (The 2026-10-18 `verify:reading` record does note that its own started server listened only on `127.0.0.1:3000`; that is part of that safeguard's record, not a re-proof of the standing boundary.)

### Finding 5 — Low: reading journey lacked orientation — **Closed**

Closed in the header (`src/components/site-header.tsx`, `src/lib/site-content.ts` helpers, `docs/adr/0006-science-editorial-reading-progress.md`):

- The current story's link is visibly active: added weight and an inset accent rule on `nav a[aria-current="page"]`, in addition to the always-present underline — not colour alone.
- Exactly one link carries `aria-current="page"`, always the current story's; the other four never do.
- The header shows the position label "Story N of 5" (N = 1…5) for every page.
- Stories 1–4 show a next-story cue; story 5 (`/longevity`) shows the visible ending "End of the stories" and has no next-story link.
- Header-only navigation is preserved: the progress cluster is a plain paragraph inside the same header, not a second navigation, and nothing places a link ahead of the five story links in keyboard order.

### Finding 6 — Low: local setup handoff was underspecified — **Closed**

Closed by the README and the runbook, as they now exist:

- `README.md` has a subject-specific introduction (the site's actual educational subject: how AI may help diagnose and treat disease, and the possibility of longer lives) and links directly to `docs/runbooks/local-start.md`.
- `docs/runbooks/local-start.md` records:
  - the compatible runtime range, Node.js `>=22.12.0 <23`, as declared in `engines` in `package.json` and pinned in `.nvmrc` (`22.16.0`);
  - the tested versions: Node.js 22.16.0 and npm 10.9.2;
  - lockfile-based installation with `npm ci` (step 1), preferred over `npm install`;
  - start (`npm run dev` / `npm start`), stop (`Ctrl+C`), and the loopback URL `http://127.0.0.1:3000/` (step 3, with `localhost` noted as an equivalent browser address, not as the boundary);
  - the five-route smoke check (step 4): after `npm test` and `npm run build`, check `/`, `/how-ai-helps`, `/cancer`, `/diseases`, `/longevity` on the loopback production server for HTTP 200, the route's main heading, a local `/images/` illustration, the "not medical advice" disclaimer, and the five navigation links with one `aria-current="page"` and "Story N of 5" — manual or one-off Node HTTP, deliberately no npm script, and never via a browser-automation tool;
  - listener verification (step 5): `node scripts/verify-local-only.mjs`.

## 3. Commands

Commands Elara will run, and what each is for:

| Command | Purpose |
| --- | --- |
| `npm ci` | Clean, reproducible install of the exact locked dependency tree from `package-lock.json`. |
| `npm test` | The final automated regression suite (Vitest: design tokens, story progress, routes, claim references, evidence rendering, accessibility essentials, images, and more under `tests/`). |
| `npm run build` | The final production build. |
| `node scripts/verify-local-only.mjs` | Reconfirmation of the loopback-only listener boundary for both the development and production servers. |

Also named, already executed and recorded: `npm run verify:reading` — the Node-only loopback **HTTP safeguard** described in section 2, finding 3 (2026-10-18, exit 0, all five routes HTTP 200). It is a server-rendered safeguard, **not a browser check**, and no browser was launched for it.

None of these commands launches a browser, and no npm script in this project may launch Playwright, Cypress, Puppeteer, Selenium, Lighthouse, or any other browser-automation tool; all browser-level checks run only as Elara page checks (see `docs/runbooks/local-start.md`, "How Elara runs the browser checks").

Command results recorded here: only the already-recorded 2026-10-18 `verify:reading` pass, as recorded in `docs/runbooks/accessibility-validation.md`. This writing task did not run `npm ci`, `npm test`, `npm run build`, or `node scripts/verify-local-only.mjs`; their results are for Elara's acceptance run and are **not** recorded here. No secrets or environment values are used by, or included with, any of these commands (the project needs no environment variables at all).

## 4. Source-review maintenance

- The review dates are **2026-10-18** because all five catalogue sources were opened directly at their stable URLs or DOI on that day (`docs/runbooks/content-evidence.md`, "How the sources were inspected"). Every shipped claim's `lastReviewed` carries that date, and the pages' visible "Stories reviewed …" line carries the same date.
- A later editor must **re-open a source** before changing its `lastReviewed` in `src/lib/site-content.ts` or any finding in `docs/runbooks/content-evidence.md`. A date is set only in the same pass that records the claim's findings.
- If a claim cannot be verified, **narrow or remove it** — do not invent citations, researcher attributions, or dates. No unverified researcher attributions ship (ADR 0005).
- The JMI abstract-only inspection (finding 1) stays disclosed in the register until someone inspects the full text; the register says the recorded findings for that source come from the publisher-registered abstract, not the full text.

## 5. Residual findings

- **No high findings remain.** No high finding existed in the review, and nothing introduced by the redesign is recorded as high.
- Medium/low residuals, all explicitly disclosed gaps:
  - The unverified browser and assistive-technology checks from finding 3: Elara keyboard and click page checks at 375/768/1280 px (pending Elara execution), screen-reader navigation, 200% text enlargement, 400% zoom/reflow, JavaScript-disabled browser reading, native Safari on macOS and iOS, and in-browser axe/Lighthouse audits (unverified).
  - The JMI abstract-only inspection limitation (finding 1).
- These are **disclosed gaps, not failures of checks that were run**: `docs/runbooks/accessibility-validation.md` records zero failures (the one executed check passed), and an unavailable check is never recorded as "passed". They are also **not dropped requirements**: WCAG 2.2 AA and current Chrome, Edge, Firefox, and Safari support on phone, tablet, and desktop remain in force as requirements.
- No verification gap was closed by substitution: Node-rendered or string-parsed HTML, and any headless accessibility tree, are not treated as browser or assistive-technology results anywhere in the project.

## 6. Layout and hygiene

- This handoff lives at `docs/runbooks/review-handoff.md`, the folder for operations guides. Creating it added **no new folder**.
- This writing task created or changed no other file: application source, tests, `package.json`, scripts, `AGENTS.md`, and `STRUCTURE.md` are untouched here.
- This file contains no secrets, no real settings or environment values, no personal data, and no generated build output.
