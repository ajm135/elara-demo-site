#!/usr/bin/env node
/**
 * start-production.mjs
 *
 * Starts the Demo Site's loopback-only production server.
 *
 * It serves the existing production build (`.next/`) immediately when the
 * build is current, and runs `next build` first only when the build is
 * missing or older than the project source inputs the production build
 * depends on. A build is current when `.next/BUILD_ID` exists and is
 * strictly newer than every one of: `src/`, `public/`, `next.config.ts`,
 * `tsconfig.json`, `package.json`, `package-lock.json`. (`node_modules/`,
 * `.next/`, `.git/` and other generated folders are ignored.)
 *
 * After the check — and a build, only when one is needed — it always
 * starts `next start --hostname 127.0.0.1 --port 3000`, so the server
 * binds only to this computer's loopback address, and forwards the
 * child's exit code as its own. It never starts a second server and
 * never binds any address other than 127.0.0.1.
 *
 * Run through the `start` script in package.json: `npm start`.
 *
 * Plain Node ESM (run with: node scripts/start-production.mjs). No
 * dependencies beyond Node.js built-ins.
 */

import { spawn } from 'node:child_process';
import { readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD_ID = path.join(ROOT, '.next', 'BUILD_ID');
// The Next.js CLI entry (the same file node_modules/.bin/next runs with node).
const NEXT_BIN = path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');

// Project source inputs the production build depends on. `node_modules/`,
// `.next/`, `.git/` and other generated folders are deliberately excluded.
const INPUT_DIRS = ['src', 'public'];
const INPUT_FILES = ['next.config.ts', 'tsconfig.json', 'package.json', 'package-lock.json'];

const log = (message) => console.log(`[start-production] ${message}`);

/**
 * Newest mtime (ms) of `dir` itself and of everything under it, files and
 * subdirectories alike. Directory mtimes move when an entry is added,
 * removed, or renamed, so file deletions and renames are covered too.
 */
async function newestMtimeUnder(dir) {
  let newest = 0;
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    const info = await stat(current);
    if (info.mtimeMs > newest) newest = info.mtimeMs;
    if (info.isDirectory()) {
      const entries = await readdir(current, { withFileTypes: true });
      for (const entry of entries) stack.push(path.join(current, entry.name));
    }
  }
  return newest;
}

/**
 * True when a current production build exists: `.next/BUILD_ID` is present
 * and strictly newer than every project source input above.
 */
async function hasCurrentBuild() {
  if (!existsSync(BUILD_ID)) return false;
  const buildTime = (await stat(BUILD_ID)).mtimeMs;
  for (const dir of INPUT_DIRS) {
    const full = path.join(ROOT, dir);
    if (!existsSync(full)) continue;
    if ((await newestMtimeUnder(full)) >= buildTime) return false;
  }
  for (const file of INPUT_FILES) {
    const full = path.join(ROOT, file);
    if (!existsSync(full)) continue;
    if ((await stat(full)).mtimeMs >= buildTime) return false;
  }
  return true;
}

/**
 * Run `node <next bin> <args...>` from the project root with inherited
 * stdio, and resolve with the child's exit code (1 when it was killed by
 * a signal or could not be started).
 */
function runNext(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [NEXT_BIN, ...args], {
      cwd: ROOT,
      stdio: 'inherit',
      env: process.env,
    });
    child.once('error', () => resolve(1));
    child.once('exit', (code, signal) => resolve(signal ? 1 : code ?? 0));
  });
}

async function main() {
  const current = await hasCurrentBuild();
  if (current) {
    log(
      '.next/BUILD_ID is newer than src/, public/, next.config.ts, tsconfig.json, package.json and package-lock.json: serving the existing production build without rebuilding',
    );
  } else {
    log('no current production build (missing or older than a source input): running next build first');
    const buildCode = await runNext(['build']);
    if (buildCode !== 0) {
      // A failed build must not be served: stop here with the build's exit code.
      return buildCode;
    }
  }
  return runNext(['start', '--hostname', '127.0.0.1', '--port', '3000']);
}

main()
  .then((code) => {
    // process.exitCode (not process.exit) so the child's output fully flushes.
    process.exitCode = code ?? 0;
  })
  .catch((err) => {
    console.error(`[start-production] unexpected error: ${err?.stack ?? err}`);
    process.exitCode = 1;
  });
