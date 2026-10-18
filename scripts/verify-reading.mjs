#!/usr/bin/env node
/**
 * verify-reading.mjs
 *
 * Node-only completeness check for the reusable Elara browser-check
 * definitions in tests/e2e/reading-experience.json.
 *
 * The script reads that one file and verifies the definitions are
 * complete:
 *   - exactly five routes, in reading order: /, /how-ai-helps, /cancer,
 *     /diseases, /longevity;
 *   - the required per-route selectors (main#main-content h1, the current
 *     story's aria-current="page" link in header nav[aria-label='Main'],
 *     main time[datetime], main a[href^='https://'], main img[alt]);
 *   - the expected title substring "AI and longer lives" and the progress
 *     string "Story N of 5" plus the "not medical advice" disclaimer on
 *     every route;
 *   - the ending state on story 5 ("Story 5 of 5", the visible ending,
 *     the lifespan-distinction strings, and no next-story cue) and a
 *     next-story cue on stories 1 to 4;
 *   - the skip-link keyboard steps (Tab to .skip-link:focus, Enter, then
 *     #main-content:focus);
 *   - the viewport widths 320, 375, 768, 1280, 1920 px;
 *   - the explicit unverified-gap list (native Safari, screen reader,
 *     200% zoom, reflow beyond the listed viewports), none of which may
 *     be marked as passed, plus the statement that WebKit is not native
 *     Safari.
 *
 * It starts nothing: no server, no socket, no browser, and no dependency
 * beyond Node.js built-ins. Browser behaviour itself remains Elara's page
 * checks; this script only checks that the definition file those checks
 * consume is complete. It exits 0 when the file is complete and exits
 * non-zero, printing a short message for every required field that is
 * missing or wrong.
 *
 * Plain Node ESM (run with: node scripts/verify-reading.mjs, or through
 * npm run verify:reading).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFINITION = path.join(ROOT, 'tests', 'e2e', 'reading-experience.json');

const EXPECTED_PATHS = ['/', '/how-ai-helps', '/cancer', '/diseases', '/longevity'];
const EXPECTED_TITLE = 'AI and longer lives';
const DISCLAIMER = 'not medical advice';
const VIEWPORTS = [320, 375, 768, 1280, 1920];
const LONGEVITY_STRINGS = ['Life expectancy', 'Maximum lifespan', 'Healthy lifespan'];
const SKIP_LINK_STEPS = [
  { action: 'press', key: 'Tab' },
  { waitForFocus: '.skip-link:focus' },
  { action: 'press', key: 'Enter' },
  { waitForFocus: '#main-content:focus' },
];
const REQUIRED_GAP_KEYWORDS = ['safari', 'screen reader', 'zoom', 'reflow'];
const WEBKIT_NOTE = 'webkit is not native safari';

const problems = [];
const problem = (message) => problems.push(message);

const nonEmptyString = (value) => typeof value === 'string' && value.length > 0;

/** True when `container` (string or array of strings) contains `needle`. */
const containsText = (container, needle) =>
  container === needle ||
  (Array.isArray(container) && container.includes(needle));

/** True when `value` (array of strings) contains every entry of `needles`. */
const containsAll = (value, needles) =>
  Array.isArray(value) && needles.every((needle) => value.includes(needle));

/** Key-order-insensitive equality for the small flat step objects. */
const stepMatches = (step, expected) => {
  if (step === null || typeof step !== 'object' || Array.isArray(step)) return false;
  const keys = Object.keys(expected);
  if (Object.keys(step).length !== keys.length) return false;
  return keys.every((key) => Object.hasOwn(step, key) && step[key] === expected[key]);
};

/** True when `steps` contains the `sequence` steps in order (with extras allowed). */
const containsSequence = (steps, sequence) => {
  if (!Array.isArray(steps)) return false;
  let matched = 0;
  for (const step of steps) {
    if (matched < sequence.length && stepMatches(step, sequence[matched])) matched += 1;
  }
  return matched === sequence.length;
};

/* ------------------------------------------------------------------ */
/* Load the definition file                                            */
/* ------------------------------------------------------------------ */

let raw;
try {
  raw = fs.readFileSync(DEFINITION, 'utf8');
} catch (err) {
  console.error(`[verify-reading] FAIL: cannot read tests/e2e/reading-experience.json: ${err.message}`);
  process.exit(1);
}

let definition;
try {
  // Tolerate a UTF-8 BOM (common when Windows editors save the file).
  definition = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
} catch (err) {
  console.error(`[verify-reading] FAIL: tests/e2e/reading-experience.json is not valid JSON: ${err.message}`);
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* The five routes                                                     */
/* ------------------------------------------------------------------ */

const routes = Array.isArray(definition.routes) ? definition.routes : null;
if (routes === null) {
  problem('missing "routes" array');
} else if (routes.length !== 5) {
  problem(`"routes" must list exactly five routes (found ${routes.length})`);
}

if (routes !== null) {
  EXPECTED_PATHS.forEach((expectedPath, index) => {
    const route = routes[index];
    const label = `route ${index + 1} (${expectedPath})`;
    if (route === null || typeof route !== 'object' || Array.isArray(route)) {
      problem(`${label}: missing or not an object`);
      return;
    }
    if (route.path !== expectedPath) {
      problem(`${label}: "path" is ${JSON.stringify(route.path ?? null)}, expected ${JSON.stringify(expectedPath)}`);
    }
    if (!containsText(route.expectedTitleContains, EXPECTED_TITLE)) {
      problem(`${label}: expected title substring ${JSON.stringify(EXPECTED_TITLE)} is missing from "expectedTitleContains"`);
    }
    const progressLabel = `Story ${index + 1} of 5`;
    if (!containsAll(route.expectedText, [progressLabel, DISCLAIMER])) {
      const missing = [progressLabel, DISCLAIMER].filter((text) => !Array.isArray(route.expectedText) || !route.expectedText.includes(text));
      problem(`${label}: "expectedText" is missing ${missing.map((text) => JSON.stringify(text)).join(' and ')}`);
    }
    const requiredSelectors = [
      'main#main-content h1',
      `header nav[aria-label='Main'] a[href='${expectedPath}'][aria-current='page']`,
      'main time[datetime]',
      "main a[href^='https://']",
      'main img[alt]',
    ];
    const missingSelectors = requiredSelectors.filter(
      (selector) => !Array.isArray(route.expectedElements) || !route.expectedElements.includes(selector),
    );
    if (missingSelectors.length > 0) {
      problem(`${label}: "expectedElements" is missing ${missingSelectors.join(', ')}`);
    }
    if (index < 4) {
      const cue = route.nextStoryCue;
      if (cue === null || typeof cue !== 'object' || !nonEmptyString(cue?.href) || !nonEmptyString(cue?.text)) {
        problem(`${label}: stories 1 to 4 need a "nextStoryCue" with non-empty "href" and "text"`);
      }
    }
    if (index === 4) {
      const missingStrings = LONGEVITY_STRINGS.filter(
        (text) => !Array.isArray(route.expectedText) || !route.expectedText.includes(text),
      );
      if (missingStrings.length > 0) {
        problem(`${label}: "expectedText" is missing the lifespan distinctions ${missingStrings.map((text) => JSON.stringify(text)).join(', ')}`);
      }
      if (!nonEmptyString(route.endingState)) {
        problem(`${label}: story 5 needs a non-empty "endingState"`);
      }
      if (route.nextStoryCue !== null) {
        problem(`${label}: story 5 must have "nextStoryCue": null (the sequence ends there)`);
      }
    }
  });
}

/* ------------------------------------------------------------------ */
/* Skip-link steps and viewport widths                                 */
/* ------------------------------------------------------------------ */

const skipLinkFlow = definition.perRoute?.skipLinkFlow;
if (!containsSequence(skipLinkFlow?.steps, SKIP_LINK_STEPS)) {
  problem(
    'missing "perRoute.skipLinkFlow.steps" with the sequence Tab -> .skip-link:focus -> Enter -> #main-content:focus',
  );
}
if (!containsAll(definition.viewportsPx, VIEWPORTS)) {
  problem(`"viewportsPx" must include ${VIEWPORTS.join(', ')} (found ${JSON.stringify(definition.viewportsPx ?? null)})`);
}

/* ------------------------------------------------------------------ */
/* Explicit unverified gaps                                            */
/* ------------------------------------------------------------------ */

const gaps = Array.isArray(definition.unverifiedGaps) ? definition.unverifiedGaps : null;
if (gaps === null) {
  problem('missing "unverifiedGaps" array');
} else if (gaps.length < REQUIRED_GAP_KEYWORDS.length) {
  problem(`"unverifiedGaps" must list at least ${REQUIRED_GAP_KEYWORDS.length} gaps (found ${gaps.length})`);
}

if (gaps !== null) {
  // Hyphens are normalised to spaces so "screen-reader" matches "screen reader".
  const gapText = gaps
    .map((gap) => [gap?.id, gap?.check, gap?.description, gap?.note].filter(nonEmptyString).join(' '))
    .join(' ')
    .toLowerCase()
    .replace(/-/g, ' ');
  for (const keyword of REQUIRED_GAP_KEYWORDS) {
    if (!gapText.includes(keyword)) {
      problem(`"unverifiedGaps" does not cover the unverified "${keyword}" gap`);
    }
  }
  gaps.forEach((gap, index) => {
    const label = `unverified gap ${index + 1}${nonEmptyString(gap?.id) ? ` (${gap.id})` : ''}`;
    if (gap === null || typeof gap !== 'object' || !nonEmptyString(gap.check) && !nonEmptyString(gap.description)) {
      problem(`${label}: each gap needs an "id" and a "check" (or "description") string`);
      return;
    }
    if (gap.status !== 'unverified') {
      problem(`${label}: every gap must have "status": "unverified" (found ${JSON.stringify(gap.status ?? null)}); no gap may be marked as passed`);
    }
  });
}

if (!raw.toLowerCase().includes(WEBKIT_NOTE)) {
  problem('the definitions must state that WebKit is not native Safari');
}

/* ------------------------------------------------------------------ */
/* Result                                                              */
/* ------------------------------------------------------------------ */

if (problems.length > 0) {
  for (const message of problems) {
    console.error(`[verify-reading] FAIL: ${message}`);
  }
  process.exit(1);
}

console.log(
  '[verify-reading] PASS: tests/e2e/reading-experience.json is complete — five routes in reading order with the required selectors, the "AI and longer lives" title and "Story N of 5" progress strings, the story-five ending state, the skip-link steps, the five viewport widths, and the explicit unverified-gap list (none marked passed).',
);
process.exit(0);
