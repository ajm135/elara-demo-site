#!/usr/bin/env node
/**
 * verify-reading.mjs
 *
 * Node-only HTTP safeguard for the Demo Site's complete server-rendered
 * reading contract. It is NOT a JSON-definition check and it is NOT browser
 * proof: it starts and stops its own loopback production server and checks
 * what the server actually returns over plain HTTP.
 *
 * Server lifecycle (the same process-tree pattern as
 * scripts/verify-local-only.mjs, but this script never calls that script
 * and never starts `npm run dev`):
 *   1. Refuses to start anything if TCP port 3000 is already accepting
 *      connections or has an OS-reported listener (`netstat -ano -p tcp`).
 *      A failed connection to a non-loopback address is never treated as
 *      proof of loopback binding.
 *   2. Starts `npm start` from the project root (that script builds, then
 *      runs `next start --hostname 127.0.0.1 --port 3000`) and polls only
 *      http://127.0.0.1:3000/ until it answers HTTP 2xx or 3xx, with a
 *      bounded ready timeout of 180 s because the production build runs
 *      before serving.
 *   3. After readiness, reads the OS-reported TCP listeners for port 3000
 *      and accepts only loopback addresses (127.0.0.1 and ::1). It rejects
 *      0.0.0.0, ::, any other non-loopback address, and a missing
 *      listener, and requires at least one listener to be owned by the
 *      process tree this script started.
 *   4. Always stops only the process tree this script started
 *      (`taskkill /PID <pid> /T /F`) and waits until port 3000 is free
 *      again, including on failure and on Ctrl+C. It never kills unrelated
 *      processes. It exits 0 only when every route check passed, the
 *      listener was loopback-only, and cleanup succeeded.
 *
 * HTTP contract (fetched with Node's built-in fetch — no JavaScript is
 * ever executed and no browser is launched), for all five routes in
 * reading order: /, /how-ai-helps, /cancer, /diseases, /longevity.
 * Each GET must return HTTP 200 with a text/html body containing:
 *   - exactly one wide top section (<div class="hero">) that is the first
 *     element inside the single <main id="main-content"> (only whitespace
 *     between the main open tag and the hero open tag); the hero contains
 *     exactly one h1 reading the route's heading (src/lib/site-content.ts
 *     `heading` field) and a review-date <time> with a non-empty datetime
 *     attribute (matched case-insensitively: React serialises dateTime in
 *     static markup, the browser DOM normalises to datetime), and the
 *     page's opening illustration; main contains that one h1 (inside the
 *     hero) and no second h1, and at least one body paragraph inside main;
 *   - the route's title string(s) in the document <title> (for the four
 *     stories the page `title` plus the site name; for home the site name
 *     "AI and longer lives", which is the home browser title by design);
 *   - at least one local illustration in the document — an img whose src
 *     starts with /images/ and whose alt is non-empty, of which at least
 *     one sits in the hero top section — and a follow-up GET of the first
 *     such src on the same loopback origin returning HTTP 200 with an
 *     image content type (image/svg+xml is expected);
 *   - at least one citation anchor inside main with an https:// href;
 *   - the visible disclaimer text "not medical advice" inside main;
 *   - the shared header nav[aria-label="Main"] with exactly the five story
 *     links in reading order (hrefs /, /how-ai-helps, /cancer, /diseases,
 *     /longevity; labels Home, How AI helps, Cancer, Other diseases,
 *     Longer lives) and no other anchors inside that nav;
 *   - exactly one aria-current="page" in the document, on the nav anchor
 *     whose href is that route, and the visible position label
 *     "Story N of 5";
 *   - the skip link (class skip-link, href #main-content, text "Skip to
 *     main content") before the header;
 *   - story 5 only: the visible strings "Life expectancy", "Maximum
 *     lifespan", "Healthy lifespan" inside main, the visible ending "End
 *     of the stories", and no next-story link anywhere outside the nav;
 *   - stories 1 to 4 only: a next-story cue (class next-story-cue)
 *     containing exactly one link to the following route with its nav
 *     label.
 *
 * The per-route contract is data, not logic: the built-in values below are
 * the enforced contract, and the script also reads the `serverContract`
 * object in tests/e2e/reading-experience.json (the reusable definition
 * data Elara's page checks consume). Where that object is present it
 * overrides the built-in values field by field, so an incomplete object
 * still leaves the full contract enforced; a structurally inconsistent
 * object fails the run without starting the server.
 *
 * These checks are safeguards against the production server's rendered
 * HTML. They are not proof of complete no-JavaScript browser behaviour,
 * of WCAG 2.2 AA conformance, of screen-reader, zoom or reflow behaviour,
 * and no such result is reported as passed here.
 *
 * Plain Node ESM (run with: node scripts/verify-reading.mjs, or through
 * npm run verify:reading). No dependencies beyond Node.js built-ins.
 */

import { execFileSync, spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFINITION = path.join(ROOT, 'tests', 'e2e', 'reading-experience.json');
const HOST = '127.0.0.1';
const PORT = 3000;
const TARGET_URL = `http://${HOST}:${PORT}/`;
const PROD_READY_TIMEOUT_MS = 180_000;
const PORT_FREE_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 1_000;
const HTTP_ATTEMPT_TIMEOUT_MS = 4_000;
const ROUTE_FETCH_TIMEOUT_MS = 15_000;
// Loopback-only: 127.0.0.1 (IPv4) and ::1 (IPv6). 0.0.0.0, :: and any
// other address are rejected.
const LOOPBACK_ADDRESSES = new Set(['127.0.0.1', '::1']);
const SITE_TITLE = 'AI and longer lives';
// The npm script line runs this script with PATH reduced to the Node and
// node_modules locations, so the Windows system tools this script drives
// (the same ones scripts/verify-local-only.mjs uses) are addressed by
// absolute path instead of by bare name.
const SYSTEM_ROOT = process.env.SystemRoot ?? 'C:\\Windows';
const NETSTAT_EXE = `${SYSTEM_ROOT}\\System32\\netstat.exe`;
const TASKKILL_EXE = `${SYSTEM_ROOT}\\System32\\taskkill.exe`;
const POWERSHELL_EXE = `${SYSTEM_ROOT}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`;

/** Process trees started by this script; the exit/terminal handlers kill
 *  any of these that were not cleaned up yet. */
const liveTrees = [];

const log = (message) => console.log(`[verify-reading] ${message}`);
const fail = (message) => console.error(`[verify-reading] FAIL: ${message}`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ------------------------------------------------------------------ */
/* The enforced server-rendered reading contract (built-in values)     */
/* ------------------------------------------------------------------ */

/**
 * Built-in copy of the contract. `heading` is the h1 text (the
 * `heading` field in src/lib/site-content.ts); `titleContains` are the
 * substrings the document <title> must carry (the page `title` field plus
 * the site name, except home, whose browser title is exactly the site
 * name); `navLabel` and `position` fix the shared nav and the "Story N of
 * 5" label. Story 5 additionally carries `endingState` and `visibleStrings`
 * (the three lifespan distinctions) and no next-story fields.
 */
const BUILTIN_CONTRACT = {
  imageSrcPrefix: '/images/',
  citationHrefPrefix: 'https://',
  disclaimerText: 'not medical advice',
  navAriaLabel: 'Main',
  skipLink: { className: 'skip-link', href: '#main-content', text: 'Skip to main content' },
  routes: [
    {
      path: '/',
      heading: 'A hopeful look at AI and human health',
      titleContains: [SITE_TITLE],
      navLabel: 'Home',
      position: 1,
      nextPath: '/how-ai-helps',
      nextLabel: 'How AI helps',
    },
    {
      path: '/how-ai-helps',
      heading: 'How AI is expected to help medicine',
      titleContains: ['How AI is expected to help medicine', SITE_TITLE],
      navLabel: 'How AI helps',
      position: 2,
      nextPath: '/cancer',
      nextLabel: 'Cancer',
    },
    {
      path: '/cancer',
      heading: 'The hopeful fight against cancer',
      titleContains: ['The hopeful fight against cancer', SITE_TITLE],
      navLabel: 'Cancer',
      position: 3,
      nextPath: '/diseases',
      nextLabel: 'Other diseases',
    },
    {
      path: '/diseases',
      heading: 'Beyond cancer: AI and the other diseases',
      titleContains: ['Beyond cancer: AI and the other diseases', SITE_TITLE],
      navLabel: 'Other diseases',
      position: 4,
      nextPath: '/longevity',
      nextLabel: 'Longer lives',
    },
    {
      path: '/longevity',
      heading: 'Longer lives',
      titleContains: ['Longer lives: what the lifespan numbers mean', SITE_TITLE],
      navLabel: 'Longer lives',
      position: 5,
      nextPath: null,
      nextLabel: null,
      endingState: 'End of the stories',
      visibleStrings: ['Life expectancy', 'Maximum lifespan', 'Healthy lifespan'],
    },
  ],
};

/**
 * Load the effective contract: the built-in values, overridden field by
 * field by the `serverContract` object in
 * tests/e2e/reading-experience.json when that object is present. An
 * incomplete object therefore never weakens the contract; a structurally
 * inconsistent one (wrong types, out-of-order paths, story-5-only fields
 * on other routes) is reported in `problems` and the run stops before any
 * server is started. A missing file, invalid JSON, or missing object
 * simply falls back to the built-in contract with a warning line.
 */
function loadContract() {
  const problems = [];
  const contract = structuredClone(BUILTIN_CONTRACT);

  let raw = null;
  try {
    raw = fs.readFileSync(DEFINITION, 'utf8');
  } catch {
    raw = null;
  }
  if (raw === null) {
    log('tests/e2e/reading-experience.json not found; enforcing the built-in server contract');
    return { contract, problems };
  }

  let definition;
  try {
    // Tolerate a UTF-8 BOM (common when Windows editors save the file).
    definition = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
  } catch (err) {
    log(`tests/e2e/reading-experience.json is not valid JSON (${err.message}); enforcing the built-in server contract`);
    return { contract, problems };
  }

  const data = definition.serverContract;
  if (data === undefined || data === null) {
    log('tests/e2e/reading-experience.json has no serverContract object; enforcing the built-in server contract');
    return { contract, problems };
  }
  if (typeof data !== 'object' || Array.isArray(data)) {
    problems.push('serverContract in tests/e2e/reading-experience.json must be an object');
    return { contract, problems };
  }

  const stringField = (key) => {
    const value = data[key];
    if (value === undefined) return;
    if (typeof value !== 'string' || value.length === 0) {
      problems.push(`serverContract.${key} must be a non-empty string`);
      return;
    }
    contract[key] = value;
  };
  stringField('imageSrcPrefix');
  stringField('citationHrefPrefix');
  stringField('disclaimerText');
  stringField('navAriaLabel');

  if (data.skipLink !== undefined) {
    if (typeof data.skipLink !== 'object' || data.skipLink === null || Array.isArray(data.skipLink)) {
      problems.push('serverContract.skipLink must be an object');
    } else {
      for (const key of ['className', 'href', 'text']) {
        const value = data.skipLink[key];
        if (value === undefined) continue;
        if (typeof value !== 'string' || value.length === 0) {
          problems.push(`serverContract.skipLink.${key} must be a non-empty string`);
        } else {
          contract.skipLink[key] = value;
        }
      }
    }
  }

  if (data.routes !== undefined) {
    if (!Array.isArray(data.routes)) {
      problems.push('serverContract.routes must be an array');
    } else {
      if (data.routes.length > 5) {
        problems.push(`serverContract.routes must list at most five routes (found ${data.routes.length})`);
      }
      data.routes.forEach((entry, index) => {
        const builtIn = contract.routes[index];
        const scope = `serverContract.routes[${index}]`;
        if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
          problems.push(`${scope} must be an object`);
          return;
        }
        if (entry.path !== undefined && entry.path !== builtIn.path) {
          problems.push(
            `${scope}.path is ${JSON.stringify(entry.path)}, expected ${JSON.stringify(builtIn.path)} (route positions are fixed in reading order)`,
          );
        }
        for (const key of ['heading', 'navLabel']) {
          const value = entry[key];
          if (value === undefined) continue;
          if (typeof value !== 'string' || value.length === 0) {
            problems.push(`${scope}.${key} must be a non-empty string`);
          } else {
            builtIn[key] = value;
          }
        }
        {
          const value = entry.position;
          if (value !== undefined) {
            if (!Number.isInteger(value) || value < 1 || value > 5) {
              problems.push(`${scope}.position must be an integer from 1 to 5`);
            } else {
              builtIn.position = value;
            }
          }
        }
        for (const key of ['nextPath', 'nextLabel']) {
          const value = entry[key];
          if (value === undefined) continue;
          if (value === null) {
            if (builtIn.position !== 5) problems.push(`${scope}.${key} may only be null on story 5`);
            builtIn[key] = null;
          } else if (typeof value === 'string' && value.length > 0) {
            if (builtIn.position === 5) problems.push(`${scope}.${key} must be null on story 5`);
            builtIn[key] = value;
          } else {
            problems.push(`${scope}.${key} must be a non-empty string or null`);
          }
        }
        const storyFiveOnly = (key) => {
          const value = entry[key];
          if (value === undefined) return;
          if (index !== 4) {
            problems.push(`${scope}.${key} is only defined for story 5 (the final route)`);
            return;
          }
          if (key === 'endingState') {
            if (typeof value !== 'string' || value.length === 0) {
              problems.push(`${scope}.endingState must be a non-empty string`);
            } else {
              builtIn.endingState = value;
            }
            return;
          }
          if (!Array.isArray(value) || value.length === 0 || value.some((v) => typeof v !== 'string' || v.length === 0)) {
            problems.push(`${scope}.visibleStrings must be a non-empty array of non-empty strings`);
          } else {
            builtIn.visibleStrings = value;
          }
        };
        storyFiveOnly('endingState');
        storyFiveOnly('visibleStrings');
        {
          const value = entry.titleContains;
          if (value !== undefined) {
            if (!Array.isArray(value) || value.length === 0 || value.some((v) => typeof v !== 'string' || v.length === 0)) {
              problems.push(`${scope}.titleContains must be a non-empty array of non-empty strings`);
            } else {
              builtIn.titleContains = value;
            }
          }
        }
      });
    }
  }

  return { contract, problems };
}

/* ------------------------------------------------------------------ */
/* TCP probing                                                         */
/* ------------------------------------------------------------------ */

/** Connect to host:port. Resolves 'open', 'refused', or 'unknown' (timeout). */
function probePort(host, port, timeoutMs) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const settle = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };
    const timer = setTimeout(() => settle('unknown'), timeoutMs);
    socket.once('connect', () => {
      clearTimeout(timer);
      settle('open');
    });
    socket.once('error', () => {
      clearTimeout(timer);
      settle('refused');
    });
    socket.connect(port, host);
  });
}

/* ------------------------------------------------------------------ */
/* OS-reported TCP listeners (Windows netstat -ano)                    */
/* ------------------------------------------------------------------ */

const LISTENING_LINE =
  /^\s*TCP6?\s+(?:\[([0-9A-Fa-f:]+)\]|(\d{1,3}(?:\.\d{1,3}){3})):(\d+)\s+(?:\[[0-9A-Fa-f:]*\]|\d{1,3}(?:\.\d{1,3}){3}):(\d+)\s+LISTENING\s+(\d+)\s*$/;

function parseNetstatListening(stdout) {
  const listeners = [];
  for (const line of stdout.split(/\r?\n/)) {
    const match = line.match(LISTENING_LINE);
    if (!match) continue;
    listeners.push({
      address: (match[1] ?? match[2]).toLowerCase(),
      port: Number(match[3]),
      pid: Number(match[5]),
    });
  }
  return listeners;
}

/** All OS-reported TCP LISTENING entries for `port`, with owning PIDs. */
function getListeners(port) {
  const stdout = execFileSync(NETSTAT_EXE, ['-ano', '-p', 'tcp'], {
    encoding: 'utf8',
    timeout: 15_000,
    windowsHide: true,
  });
  return parseNetstatListening(stdout).filter((listener) => listener.port === port);
}

/* ------------------------------------------------------------------ */
/* Process tree (Windows)                                              */
/* ------------------------------------------------------------------ */

/** PIDs of `rootPid` and all of its descendants, via Win32_Process. */
function getProcessTree(rootPid) {
  const script = [
    `$root = ${Number(rootPid)}`,
    'try {',
    '  $queue = New-Object System.Collections.Generic.Queue[int32]',
    '  $all = @()',
    '  $queue.Enqueue($root)',
    // Note: use Count, not IsEmpty — Queue<T>.IsEmpty does not exist on
    // Windows PowerShell 5.1 (.NET Framework), where it evaluates to $null.
    '  while ($queue.Count -gt 0) {',
    '    $procId = $queue.Dequeue()',
    '    $all += $procId',
    '    $kids = Get-CimInstance Win32_Process -Filter "ParentProcessId = $procId" -ErrorAction Stop | Select-Object -ExpandProperty ProcessId',
    '    foreach ($k in $kids) { $queue.Enqueue([int32]$k) }',
    '  }',
    '  $all -join ","',
    '} catch { exit 1 }',
  ].join('\n');
  try {
    const stdout = execFileSync(POWERSHELL_EXE, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], {
      encoding: 'utf8',
      timeout: 30_000,
      windowsHide: true,
    });
    const pids = stdout
      .trim()
      .split(/[\r\n,]+/)
      .map((token) => token.trim())
      .filter((token) => /^\d+$/.test(token))
      .map(Number);
    if (pids.length > 0 && pids.includes(Number(rootPid))) return pids;
    throw new Error(`unexpected output: ${stdout.trim().slice(0, 200)}`);
  } catch (err) {
    log(`warning: process tree lookup for pid ${rootPid} failed (${err.message}); using the direct child pid only`);
    return [Number(rootPid)];
  }
}

/**
 * Kill only the given process tree (child.pid from spawn, never a guess).
 * Returns true when the tree is dead (taskkill exit 0, or it was already
 * gone, which taskkill reports as 128 / "not found").
 */
function killTree(pid) {
  if (!pid || Number.isNaN(Number(pid))) return false;
  const result = spawnSync(TASKKILL_EXE, ['/PID', String(pid), '/T', '/F'], {
    encoding: 'utf8',
    timeout: 30_000,
    windowsHide: true,
  });
  if (result.status === 0) return true;
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (result.status === 128 || /not found/i.test(output)) return true;
  return false;
}

/** Wait until no OS listener remains on the port and a loopback connect is refused. */
async function waitForPortFree(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    let listeners = null;
    try {
      listeners = getListeners(PORT);
      lastError = null;
    } catch (err) {
      lastError = err;
    }
    if (listeners && listeners.length === 0) {
      const probe = await probePort(HOST, PORT, 2_000);
      if (probe !== 'open') return { free: true, lastError: null };
    }
    await sleep(500);
  }
  return { free: false, lastError };
}

/* ------------------------------------------------------------------ */
/* HTTP readiness (poll only http://127.0.0.1:3000/)                   */
/* ------------------------------------------------------------------ */

async function waitForHttp(readyTimeoutMs, isCancelled) {
  const startedAt = Date.now();
  let lastStatus = null;
  let lastError = null;
  while (!isCancelled() && Date.now() - startedAt < readyTimeoutMs) {
    try {
      const response = await fetch(TARGET_URL, {
        redirect: 'manual',
        signal: AbortSignal.timeout(HTTP_ATTEMPT_TIMEOUT_MS),
      });
      lastStatus = response.status;
      lastError = null;
      if (response.body) await response.body.cancel().catch(() => {});
      if (response.status >= 200 && response.status < 400) {
        return { ok: true, status: response.status };
      }
    } catch (err) {
      lastError = err;
    }
    await sleep(POLL_INTERVAL_MS);
  }
  return { ok: false, status: lastStatus, error: lastError };
}

/* ------------------------------------------------------------------ */
/* Small HTML scanning (a string scan, never a browser DOM)            */
/* ------------------------------------------------------------------ */

const VOID_TAGS = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'wbr']);

function safeChar(codePoint) {
  try {
    return String.fromCodePoint(codePoint);
  } catch {
    return ' ';
  }
}

/** Decode the entities that appear in server-rendered HTML. */
function decodeEntities(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => safeChar(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => safeChar(Number(dec)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

/**
 * Replace comments and the contents of <script>, <style> and <noscript>
 * (the Next.js flight payload repeats the page's strings there) with
 * spaces so neither tag scanning nor visible-text checks see them.
 */
function stripInvisible(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ');
}

/** Visible text of an HTML fragment: tags become spaces, entities decode. */
function visibleText(fragment) {
  return decodeEntities(fragment.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** Parse an opening tag's attributes into a map (lower-cased names). */
function parseAttrs(openTag) {
  const attrs = {};
  const end = openTag.endsWith('/>') ? openTag.length - 2 : openTag.length - 1;
  const body = openTag.slice(openTag.indexOf(' ') + 1, end).trim();
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>]+)))?/g;
  for (const match of body.matchAll(re)) {
    const name = match[1].toLowerCase();
    const value = match[3] ?? match[4] ?? match[5] ?? '';
    if (!Object.hasOwn(attrs, name)) attrs[name] = value;
  }
  return attrs;
}

/**
 * Find every element of `tagName` in an HTML string (a scan over the
 * string, not a DOM). `attrFilter` receives the lower-cased attribute map
 * and the raw opening tag. Returns {start, end, open, inner, attrs} for
 * each element in document order; unbalanced elements are skipped.
 */
function findAllTags(html, tagName, attrFilter = null) {
  const found = [];
  const openRe = new RegExp(`<${tagName}\\b[^>]*>`, 'gi');
  for (const match of html.matchAll(openRe)) {
    const open = match[0];
    const attrs = parseAttrs(open);
    if (attrFilter !== null && !attrFilter(attrs, open)) continue;
    const start = match.index;
    if (VOID_TAGS.has(tagName.toLowerCase())) {
      found.push({ start, end: start + open.length, open, inner: '', attrs });
      continue;
    }
    // Search the remainder after this opening tag: exec() on a non-global
    // regex ignores lastIndex, so slicing first is what makes the close
    // tag the element's own, not an earlier same-named tag's.
    const rest = html.slice(start + open.length);
    const close = new RegExp(`</${tagName}\\s*>`, 'i').exec(rest);
    if (close === null) continue; // unbalanced markup; skip this element
    found.push({
      start,
      end: start + open.length + close.index + close[0].length,
      open,
      inner: rest.slice(0, close.index),
      attrs,
    });
  }
  return found;
}

/* ------------------------------------------------------------------ */
/* HTTP fetching (built-in fetch; no JavaScript execution)             */
/* ------------------------------------------------------------------ */

async function fetchPage(pagePath) {
  const response = await fetch(`http://${HOST}:${PORT}${pagePath}`, {
    redirect: 'manual',
    signal: AbortSignal.timeout(ROUTE_FETCH_TIMEOUT_MS),
  });
  let body = '';
  try {
    body = await response.text();
  } catch {
    body = '';
  }
  return { status: response.status, contentType: response.headers.get('content-type') ?? '', body };
}

/**
 * Follow up on one local illustration src. Returns null when the src
 * answers HTTP 200 with an image content type, otherwise the FAIL text.
 */
async function checkIllustration(src) {
  try {
    const response = await fetch(`http://${HOST}:${PORT}${src}`, {
      signal: AbortSignal.timeout(ROUTE_FETCH_TIMEOUT_MS),
    });
    const contentType = response.headers.get('content-type') ?? '';
    const detail = `HTTP ${response.status}, content-type "${contentType || '(none)'}"`;
    if (response.body) await response.body.cancel().catch(() => {});
    if (response.status === 200 && /^image\//i.test(contentType)) return null;
    return `local illustration ${src} did not return HTTP 200 with an image content type (${detail})`;
  } catch (err) {
    return `local illustration ${src} could not be fetched on the loopback origin (${err.message})`;
  }
}

/* ------------------------------------------------------------------ */
/* The per-route contract checks                                       */
/* ------------------------------------------------------------------ */

/**
 * Check one server-rendered page against the contract. Pushes one short
 * problem string per missing item (empty array when the route passes).
 */
async function checkRoute(route, contract, html) {
  const problems = [];
  const label = route.path;
  const markup = stripInvisible(html);
  const documentText = visibleText(markup);

  /* --- the main landmark and its story content --------------------- */
  const mains = findAllTags(markup, 'main');
  let mainEl = null;
  if (mains.length !== 1) {
    problems.push(`${label}: expected exactly one <main> element, found ${mains.length}`);
  } else if (mains[0].attrs.id !== 'main-content') {
    problems.push(`${label}: the single <main> has id "${mains[0].attrs.id}", expected id="main-content"`);
  } else {
    mainEl = mains[0];
  }
  const mainInner = mainEl ? mainEl.inner : '';
  const mainText = mainEl ? visibleText(mainInner) : '';

  /* --- the wide top section: the hero, the first element inside main --- */
  let heroEl = null;
  const heroMatches = findAllTags(markup, 'div', (attrs) => (attrs.class ?? '').split(/\s+/).includes('hero'));
  if (heroMatches.length !== 1) {
    problems.push(`${label}: expected exactly one wide top section (<div class="hero">), found ${heroMatches.length}`);
  } else {
    const heroMatch = heroMatches[0];
    // The hero div nests its own .hero-text div, so its own closing tag is
    // the one that balances the div depth back to zero — the first
    // </div> in the remainder is the nested block's, not the hero's.
    const afterOpen = markup.slice(heroMatch.start + heroMatch.open.length);
    let depth = 1;
    let heroInner = '';
    let heroEnd = -1;
    for (const divTag of afterOpen.matchAll(/<div\b[^>]*>|<\/div\s*>/gi)) {
      depth += divTag[0].startsWith('</') ? -1 : 1;
      if (depth === 0) {
        heroInner = afterOpen.slice(0, divTag.index);
        heroEnd = heroMatch.start + heroMatch.open.length + divTag.index + divTag[0].length;
        break;
      }
    }
    if (heroEnd === -1) {
      problems.push(`${label}: the hero <div> is never closed (no matching </div> after its open tag)`);
    } else {
      heroEl = { start: heroMatch.start, end: heroEnd, open: heroMatch.open, inner: heroInner, attrs: heroMatch.attrs };
      if (mainEl !== null) {
        if (heroEl.start < mainEl.start || heroEl.end > mainEl.end) {
          problems.push(`${label}: the hero must sit inside the single <main id="main-content">`);
        } else if (markup.slice(mainEl.start + mainEl.open.length, heroEl.start).trim() !== '') {
          problems.push(
            `${label}: the hero must be the first element inside <main id="main-content"> (only whitespace may sit between the main open tag and the hero open tag)`,
          );
        }
      }
    }
  }
  const heroInner = heroEl ? heroEl.inner : '';

  if (mainEl !== null) {
    // The page's single h1 reads the route's heading and sits in the wide
    // top section (the hero), the first element inside main — so main
    // carries that one h1 and no second one.
    const h1s = findAllTags(heroInner, 'h1');
    if (h1s.length !== 1) {
      problems.push(`${label}: the wide top section (the hero) must contain exactly one <h1>, found ${h1s.length}`);
    } else {
      const h1Text = visibleText(h1s[0].inner);
      if (h1Text !== route.heading) {
        problems.push(`${label}: the single <h1> reads "${h1Text}", expected "${route.heading}"`);
      }
    }
    const mainH1s = findAllTags(markup, 'h1').filter((h1) => h1.start >= mainEl.start && h1.end <= mainEl.end);
    if (mainH1s.length !== 1) {
      problems.push(`${label}: main must contain exactly one <h1> (the one inside the hero), found ${mainH1s.length}`);
    } else if (heroEl === null || mainH1s[0].start < heroEl.start || mainH1s[0].end > heroEl.end) {
      problems.push(`${label}: main's single <h1> must be the one inside the hero (no second h1 outside it)`);
    }

    const paragraphs = findAllTags(mainInner, 'p').filter((p) => visibleText(p.inner).length > 0);
    if (paragraphs.length === 0) {
      problems.push(`${label}: main must contain at least one body paragraph with visible text`);
    }

    const illustrations = findAllTags(markup, 'img').filter((image) => {
      const src = image.attrs.src ?? '';
      return src.startsWith(contract.imageSrcPrefix) && decodeEntities(image.attrs.alt ?? '').trim().length > 0;
    });
    if (illustrations.length === 0) {
      problems.push(`${label}: the page must contain at least one <img> with a local ${contract.imageSrcPrefix}… src and a non-empty alt`);
    } else {
      const heroCarriesIllustration =
        heroEl !== null &&
        illustrations.some((image) => image.start >= heroEl.start && image.end <= heroEl.end);
      if (!heroCarriesIllustration) {
        problems.push(`${label}: the wide top section (the hero) must carry the page's opening illustration`);
      }
      const imageProblem = await checkIllustration(illustrations[0].attrs.src);
      if (imageProblem !== null) problems.push(`${label}: ${imageProblem}`);
    }

    const citations = findAllTags(mainInner, 'a').filter((anchor) =>
      (anchor.attrs.href ?? '').startsWith(contract.citationHrefPrefix),
    );
    if (citations.length === 0) {
      problems.push(`${label}: main must contain at least one citation anchor with an https:// href`);
    }

    if (!mainText.includes(contract.disclaimerText)) {
      problems.push(`${label}: main must visibly contain the disclaimer "${contract.disclaimerText}"`);
    }

    // The review date's <time> lives in the wide top section (the hero).
    // Matched case-insensitively: React serialises dateTime in static
    // markup, the browser DOM normalises it to datetime.
    const times = findAllTags(heroInner, 'time').filter(
      (time) => time.attrs.datetime !== undefined && time.attrs.datetime.length > 0,
    );
    if (times.length === 0) {
      problems.push(`${label}: the wide top section (the hero) must contain a <time> element with a non-empty datetime attribute`);
    }
  }

  /* --- document <title> -------------------------------------------- */
  const titles = findAllTags(markup, 'title');
  if (titles.length !== 1) {
    problems.push(`${label}: expected exactly one <title>, found ${titles.length}`);
  } else {
    const titleText = visibleText(titles[0].inner);
    for (const expected of route.titleContains) {
      if (!titleText.includes(expected)) {
        problems.push(`${label}: the <title> must contain "${expected}" (reads "${titleText}")`);
      }
    }
  }

  /* --- header, shared nav, skip link -------------------------------- */
  const headers = findAllTags(markup, 'header');
  const navs = findAllTags(markup, 'nav', (attrs) => attrs['aria-label'] === contract.navAriaLabel);
  let navEl = null;
  if (navs.length !== 1) {
    problems.push(`${label}: expected exactly one <nav aria-label="${contract.navAriaLabel}">, found ${navs.length}`);
  } else if (headers.length !== 1) {
    problems.push(`${label}: expected exactly one <header>, found ${headers.length}`);
  } else if (navs[0].start < headers[0].start || navs[0].end > headers[0].end) {
    problems.push(`${label}: the ${contract.navAriaLabel} nav is not inside the <header>`);
  } else {
    navEl = navs[0];
  }

  if (navEl !== null) {
    const navLinks = findAllTags(navEl.inner, 'a');
    if (navLinks.length !== 5) {
      problems.push(`${label}: the ${contract.navAriaLabel} nav must contain exactly the five story links and nothing else, found ${navLinks.length} anchor(s)`);
    } else {
      contract.routes.forEach((expected, index) => {
        const link = navLinks[index];
        if (link.attrs.href !== expected.path) {
          problems.push(`${label}: nav link ${index + 1} has href "${link.attrs.href}", expected "${expected.path}"`);
        }
        const text = visibleText(link.inner);
        if (text !== expected.navLabel) {
          problems.push(`${label}: nav link ${index + 1} reads "${text}", expected "${expected.navLabel}"`);
        }
      });
    }
  }

  const skipLinks = findAllTags(markup, 'a', (attrs) =>
    (attrs.class ?? '').split(/\s+/).includes(contract.skipLink.className) && attrs.href === contract.skipLink.href,
  );
  if (skipLinks.length !== 1) {
    problems.push(
      `${label}: expected exactly one skip link (<a class="${contract.skipLink.className}" href="${contract.skipLink.href}">), found ${skipLinks.length}`,
    );
  } else {
    const text = visibleText(skipLinks[0].inner);
    if (text !== contract.skipLink.text) {
      problems.push(`${label}: the skip link reads "${text}", expected "${contract.skipLink.text}"`);
    }
    if (headers.length === 1 && skipLinks[0].start >= headers[0].start) {
      problems.push(`${label}: the skip link must appear before the <header>`);
    }
  }

  /* --- current-page state ------------------------------------------- */
  const currentMatches = [...markup.matchAll(/aria-current\s*=\s*["']page["']/gi)];
  if (currentMatches.length !== 1) {
    problems.push(`${label}: expected exactly one aria-current="page" in the document, found ${currentMatches.length}`);
  }
  const currentLinks = findAllTags(markup, 'a', (attrs) => attrs['aria-current'] === 'page');
  if (currentLinks.length === 1) {
    if (currentLinks[0].attrs.href !== route.path) {
      problems.push(`${label}: aria-current="page" is on the link to "${currentLinks[0].attrs.href}", expected "${route.path}"`);
    } else if (navEl !== null && (currentLinks[0].start < navEl.start || currentLinks[0].end > navEl.end)) {
      problems.push(`${label}: the aria-current="page" link is not inside the ${contract.navAriaLabel} nav`);
    }
  }

  const progressLabel = `Story ${route.position} of 5`;
  if (!documentText.includes(progressLabel)) {
    problems.push(`${label}: the page must visibly contain "${progressLabel}"`);
  }

  /* --- next-story cue (stories 1 to 4) / ending (story 5) ----------- */
  const storyPaths = new Set(contract.routes.map((r) => r.path));
  const allLinks = findAllTags(markup, 'a');
  const outsideNavLinks = navEl !== null ? allLinks.filter((a) => a.start < navEl.start || a.end > navEl.end) : allLinks;
  const storyLinksOutsideNav = outsideNavLinks.filter((a) => storyPaths.has(a.attrs.href));
  const cues = findAllTags(markup, 'span', (attrs) => (attrs.class ?? '').split(/\s+/).includes('next-story-cue'));

  if (route.position === 5) {
    if (cues.length !== 0) {
      problems.push(`${label}: story 5 must not carry a next-story cue (class "next-story-cue"), found ${cues.length}`);
    }
    if (storyLinksOutsideNav.length !== 0) {
      problems.push(
        `${label}: story 5 must not link to any story route outside the ${contract.navAriaLabel} nav (found: ${storyLinksOutsideNav
          .map((a) => a.attrs.href)
          .join(', ')})`,
      );
    }
    if (!documentText.includes(route.endingState)) {
      problems.push(`${label}: story 5 must visibly contain the ending "${route.endingState}"`);
    }
    for (const expected of route.visibleStrings) {
      if (!mainText.includes(expected)) {
        problems.push(`${label}: main must visibly contain "${expected}"`);
      }
    }
  } else {
    if (cues.length !== 1) {
      problems.push(`${label}: expected exactly one next-story cue (class "next-story-cue"), found ${cues.length}`);
    } else {
      const cueLinks = findAllTags(cues[0].inner, 'a');
      if (cueLinks.length !== 1) {
        problems.push(`${label}: the next-story cue must contain exactly one link, found ${cueLinks.length}`);
      } else {
        if (cueLinks[0].attrs.href !== route.nextPath) {
          problems.push(`${label}: the next-story cue links to "${cueLinks[0].attrs.href}", expected "${route.nextPath}"`);
        }
        const text = visibleText(cueLinks[0].inner);
        if (text !== route.nextLabel) {
          problems.push(`${label}: the next-story cue link reads "${text}", expected "${route.nextLabel}"`);
        }
      }
    }
    if (storyLinksOutsideNav.length !== 1) {
      problems.push(
        `${label}: expected exactly one story-route link outside the ${contract.navAriaLabel} nav (the next-story cue), found ${storyLinksOutsideNav.length}`,
      );
    }
  }

  return problems;
}

/* ------------------------------------------------------------------ */
/* Safety nets: always kill only the trees this script started         */
/* ------------------------------------------------------------------ */

for (const [signal, exitCode] of [['SIGINT', 130], ['SIGTERM', 143]]) {
  process.on(signal, () => {
    for (const tree of liveTrees) {
      if (!tree.killed) killTree(tree.pid);
    }
    process.exit(exitCode);
  });
}
process.on('exit', () => {
  for (const tree of liveTrees) {
    if (tree.killed) continue;
    try {
      spawnSync(TASKKILL_EXE, ['/PID', String(tree.pid), '/T', '/F'], { windowsHide: true, timeout: 10_000 });
    } catch {
      /* last-resort cleanup; nothing further to do */
    }
  }
});

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

async function main() {
  if (process.platform !== 'win32') {
    fail(`this script verifies Windows loopback listeners with netstat/taskkill; current platform is ${process.platform}`);
    return 1;
  }

  const { contract, problems: dataProblems } = loadContract();
  if (dataProblems.length > 0) {
    for (const message of dataProblems) fail(message);
    return 1;
  }

  log(`preflight: checking that TCP port ${PORT} is free on this machine`);
  let initialListeners;
  try {
    initialListeners = getListeners(PORT);
  } catch (err) {
    fail(`could not inspect OS-reported TCP listeners: ${err.message}`);
    return 1;
  }
  const probe = await probePort(HOST, PORT, 2_000);
  if (initialListeners.length > 0) {
    fail(
      `port ${PORT} already has an OS-reported listener (${initialListeners
        .map((listener) => `${listener.address}:${listener.port} pid ${listener.pid}`)
        .join(', ')}); starting nothing`,
    );
    return 1;
  }
  if (probe === 'open') {
    fail(`port ${PORT} on ${HOST} is already accepting connections; starting nothing`);
    return 1;
  }
  if (probe === 'unknown') {
    fail(`could not determine whether ${HOST}:${PORT} is accepting connections; failing safely`);
    return 1;
  }

  log(`starting "npm start" (production build, then ${HOST}:${PORT}; ready timeout ${PROD_READY_TIMEOUT_MS / 1000} s)`);
  const child = spawn('npm', ['run', 'start'], {
    cwd: ROOT,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
    windowsHide: true,
  });
  const tree = { pid: child.pid, killed: false };
  liveTrees.push(tree);

  let captured = '';
  const capture = (chunk) => {
    captured = (captured + chunk.toString('utf8')).slice(-8_000);
  };
  child.stdout.on('data', capture);
  child.stderr.on('data', capture);

  const exited = new Promise((resolve) => {
    child.once('exit', (code, signal) => resolve({ code, signal, error: null }));
    child.once('error', (error) => resolve({ code: null, signal: null, error }));
  });

  const problems = [];
  let stopPolling = false;
  const ready = waitForHttp(PROD_READY_TIMEOUT_MS, () => stopPolling);
  const winner = await Promise.race([
    ready.then((result) => ({ kind: 'ready', ready: result })),
    exited.then((exit) => ({ kind: 'exited', exit })),
  ]);
  stopPolling = true;

  let serverUp = false;
  if (winner.kind === 'exited') {
    const { code, signal, error } = winner.exit;
    problems.push(
      `server process exited before becoming ready (code=${code}, signal=${signal}${error ? `, ${error.message}` : ''})`,
    );
  } else if (!winner.ready.ok) {
    const detail =
      winner.ready.status != null
        ? `last HTTP status ${winner.ready.status}`
        : winner.ready.error
          ? `last error: ${winner.ready.error.message}`
          : 'no response';
    problems.push(`server was not ready on ${TARGET_URL} within ${PROD_READY_TIMEOUT_MS / 1000} s (${detail})`);
  } else {
    serverUp = true;
    log(`server ready: HTTP ${winner.ready.status} at ${TARGET_URL}`);
  }

  /* --- OS-reported listeners: loopback-only, owned by our tree ------ */
  if (serverUp) {
    try {
      const listeners = getListeners(PORT);
      const summary =
        listeners.map((listener) => `${listener.address}:${listener.port} (pid ${listener.pid})`).join(', ') || 'none';
      log(`port ${PORT} listeners: ${summary}`);
      if (listeners.length === 0) {
        problems.push(`no OS-reported TCP listener found on port ${PORT}`);
      } else {
        for (const listener of listeners) {
          if (!LOOPBACK_ADDRESSES.has(listener.address)) {
            problems.push(`listener on non-loopback address ${listener.address}:${listener.port} (pid ${listener.pid})`);
          }
        }
        const treePids = getProcessTree(child.pid);
        if (!listeners.some((listener) => treePids.includes(listener.pid))) {
          problems.push(
            `no port ${PORT} listener is owned by the started process tree (listener pids: ${listeners
              .map((listener) => listener.pid)
              .join(', ')}; tree pids: ${treePids.join(', ')})`,
          );
        }
      }
    } catch (err) {
      problems.push(`could not inspect OS-reported TCP listeners: ${err.message}`);
    }
  }

  /* --- the five server-rendered reading contracts ------------------- */
  if (serverUp) {
    for (const route of contract.routes) {
      let page;
      try {
        page = await fetchPage(route.path);
      } catch (err) {
        problems.push(`${route.path}: could not fetch the page (${err.message})`);
        continue;
      }
      if (page.status !== 200) {
        problems.push(`${route.path}: expected HTTP 200, got ${page.status}`);
        continue;
      }
      if (!/^text\/html/i.test(page.contentType)) {
        problems.push(`${route.path}: expected a text/html body, got content-type "${page.contentType || '(none)'}"`);
        continue;
      }
      log(`${route.path}: HTTP 200, ${page.body.length} bytes of server-rendered HTML`);
      for (const message of await checkRoute(route, contract, page.body)) {
        problems.push(message);
      }
    }
  }

  /* --- cleanup: stop only the tree this script started -------------- */
  const killed = killTree(child.pid);
  if (killed) tree.killed = true;
  else problems.push(`could not stop the started process tree (pid ${child.pid})`);

  let portFree = { free: false, lastError: null };
  if (killed) portFree = await waitForPortFree(PORT_FREE_TIMEOUT_MS);
  if (!portFree.free) {
    problems.push(
      `port ${PORT} is still occupied after cleanup${portFree.lastError ? ` (${portFree.lastError.message})` : ''}`,
    );
  } else {
    log(`port ${PORT} is free again`);
  }

  if (problems.length > 0) {
    for (const message of problems) fail(message);
    if (captured) {
      console.error(`[verify-reading] server output (tail):\n${captured.slice(-2_000)}`);
    }
    return 1;
  }

  console.log(
    `[verify-reading] PASS: all five routes (${contract.routes
      .map((route) => route.path)
      .join(', ')}) served the complete server-rendered reading contract over loopback HTTP — story content, local illustration, citations, disclaimer, the five story links, and the correct current-page state on every route; the listener was loopback-only and the started process tree was cleaned up. These are Node-only HTTP safeguards against the production server's rendered HTML, not proof of complete no-JavaScript browser behaviour or WCAG 2.2 AA conformance.`,
  );
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    fail(`unexpected error: ${err?.stack ?? err}`);
    process.exit(1);
  });
