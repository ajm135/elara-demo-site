#!/usr/bin/env node
/**
 * verify-local-only.mjs
 *
 * Verifies that the Demo Site development and production servers bind only
 * to the loopback interface on this Windows machine, so the site stays
 * this-computer-only.
 *
 * For each server (development, then production) the script:
 *   1. Refuses to start anything if TCP port 3000 is already accepting
 *      connections or has an OS-reported listener. A failed connection to
 *      a non-loopback address is never treated as proof of loopback
 *      binding.
 *   2. Starts the server (`npm run dev` or `npm run start`) and polls only
 *      http://127.0.0.1:3000/ until it answers HTTP 2xx or 3xx, with a
 *      bounded ready timeout (120 s dev, 180 s production because the
 *      production script builds before serving).
 *   3. Reads the OS-reported TCP listeners (`netstat -ano`) and accepts
 *      only 127.0.0.1 / ::1 on port 3000. It rejects 0.0.0.0, ::, any
 *      other non-loopback address, and a missing listener, and requires at
 *      least one listener to be owned by the process tree this script
 *      started.
 *   4. Stops only the process tree this script started
 *      (`taskkill /PID <pid> /T /F` on the spawn's child.pid) and waits
 *      until port 3000 is free again.
 *
 * Process trees started by this script are always cleaned up, including on
 * failure and on Ctrl+C. The script exits 0 only if both servers were
 * ready on 127.0.0.1 and both trees were cleaned up; any timeout,
 * occupied port, wildcard/non-loopback listener, HTTP failure, or cleanup
 * failure exits non-zero.
 *
 * Plain Node ESM (run with: node scripts/verify-local-only.mjs). No
 * dependencies beyond Node.js built-ins.
 */

import { execFileSync, spawn, spawnSync } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = '127.0.0.1';
const PORT = 3000;
const TARGET_URL = `http://${HOST}:${PORT}/`;
const DEV_READY_TIMEOUT_MS = 120_000;
const PROD_READY_TIMEOUT_MS = 180_000;
const PORT_FREE_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 1_000;
const HTTP_ATTEMPT_TIMEOUT_MS = 4_000;
// Loopback-only: 127.0.0.1 (IPv4) and ::1 (IPv6). 0.0.0.0, :: and any
// other address are rejected.
const LOOPBACK_ADDRESSES = new Set(['127.0.0.1', '::1']);

/** Process trees started by this script; the exit/terminal handlers kill
 *  any of these that were not cleaned up yet. */
const liveTrees = [];

const log = (message) => console.log(`[verify-local-only] ${message}`);
const fail = (message) => console.error(`[verify-local-only] FAIL: ${message}`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  const stdout = execFileSync('netstat', ['-ano', '-p', 'tcp'], {
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
    const stdout = execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], {
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
  const result = spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
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
/* Run one server: start, verify HTTP + OS listeners, clean up         */
/* ------------------------------------------------------------------ */

async function runServer(name, npmScript, readyTimeoutMs) {
  log(`${name}: starting "npm run ${npmScript}" (ready timeout ${Math.round(readyTimeoutMs / 1000)} s)`);
  const child = spawn('npm', ['run', npmScript], {
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

  let stopPolling = false;
  const ready = waitForHttp(readyTimeoutMs, () => stopPolling);
  const winner = await Promise.race([
    ready.then((result) => ({ kind: 'ready', ready: result })),
    exited.then((exit) => ({ kind: 'exited', exit })),
  ]);
  stopPolling = true;

  const problems = [];
  let httpStatus = null;
  let listeners = [];

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
    problems.push(`server was not ready on ${TARGET_URL} within ${Math.round(readyTimeoutMs / 1000)} s (${detail})`);
  } else {
    httpStatus = winner.ready.status;
    try {
      listeners = getListeners(PORT);
    } catch (err) {
      problems.push(`could not inspect OS-reported TCP listeners: ${err.message}`);
    }
    if (problems.length === 0) {
      if (listeners.length === 0) {
        problems.push('no OS-reported TCP listener found on port 3000');
      } else {
        for (const listener of listeners) {
          if (!LOOPBACK_ADDRESSES.has(listener.address)) {
            problems.push(`listener on non-loopback address ${listener.address}:${listener.port} (pid ${listener.pid})`);
          }
        }
        const treePids = getProcessTree(child.pid);
        if (!listeners.some((listener) => treePids.includes(listener.pid))) {
          problems.push(
            `no port 3000 listener is owned by the started process tree (listener pids: ${listeners
              .map((listener) => listener.pid)
              .join(', ')}; tree pids: ${treePids.join(', ')})`,
          );
        }
      }
    }
  }

  const listenerSummary =
    listeners.map((listener) => `${listener.address}:${listener.port} (pid ${listener.pid})`).join(', ') || 'none';
  log(`${name}: HTTP ${httpStatus ?? 'n/a'} at ${TARGET_URL}; port 3000 listeners: ${listenerSummary}`);

  const killed = killTree(child.pid);
  if (killed) tree.killed = true;
  else problems.push(`could not stop the started process tree (pid ${child.pid})`);

  let portFree = { free: false, lastError: null };
  if (killed) portFree = await waitForPortFree(PORT_FREE_TIMEOUT_MS);
  if (!portFree.free) {
    problems.push(`port ${PORT} is still occupied after cleanup${portFree.lastError ? ` (${portFree.lastError.message})` : ''}`);
  }

  const ok = problems.length === 0;
  console.log(
    `[verify-local-only] ${name} server: ${ok ? 'PASS' : `FAIL — ${problems.join('; ')}`}`,
  );
  if (!ok && captured) {
    console.error(`[verify-local-only] ${name} server output (tail):\n${captured.slice(-2_000)}`);
  }
  return { name, ok, httpStatus, listeners, problems, cleaned: killed && portFree.free };
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
      spawnSync('taskkill', ['/PID', String(tree.pid), '/T', '/F'], { windowsHide: true, timeout: 10_000 });
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

  const dev = await runServer('dev', 'dev', DEV_READY_TIMEOUT_MS);
  if (!dev.ok) return 1;

  const production = await runServer('production', 'start', PROD_READY_TIMEOUT_MS);
  if (!production.ok) return 1;

  log('PASS: dev and production servers were both ready on 127.0.0.1:3000, bound loopback-only, and both process trees were cleaned up');
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    fail(`unexpected error: ${err?.stack ?? err}`);
    process.exit(1);
  });
