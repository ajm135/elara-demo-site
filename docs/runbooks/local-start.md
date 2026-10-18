# Runbook: start the Demo Site locally

This runbook explains how to run the Demo Site on this computer. The site is a public, local-only educational demo: it has no sign-in, no database, and no deployment, and its server binds only to this computer's loopback address.

## Prerequisites

- Node.js 22.16.0 and npm 10.9.2 are already installed on this computer; the site was tested with exactly those versions. The project supports Node.js `>=22.12.0 <23`, as declared in `package.json` (`engines`) and pinned in `.nvmrc` (`22.16.0`).
- No sign-in is needed: anyone can open the site.
- No database is needed: all page copy and image references are static files in the project.
- No deployment is needed: the site only runs on this computer.
- No environment variables or secrets are needed. There is nothing to set up before running the commands below.

## 1. Install dependencies

Open a terminal (for example PowerShell or Command Prompt) in the project root folder — the folder that contains `package.json` — and run:

```
npm ci
```

`npm ci` installs the project's dependencies into `node_modules/` from the committed `package-lock.json` lockfile, so every setup installs exactly the locked versions. Prefer it over `npm install`, which can re-resolve and change the lockfile.

## 2. Start the site

From the project root, run either:

```
npm run dev
```

to start the development server, or

```
npm start
```

to start the production server, which first builds the project (`next build`) and then serves it (`next start`). Wait until the build finishes; the server then stays running and serves the site.

Both commands bind explicitly to the loopback address `127.0.0.1` on port 3000, so the servers accept connections only from this computer. Port 3000 must be free before starting a server.

The `start` script (like `build` and `test`) carries a Windows PATH workaround: it prepends `set "PATH=%ProgramFiles%\nodejs;node_modules\.bin"` so the command works even in a terminal where Node.js or the project's local binaries are not yet on the PATH. Keep that prefix in the scripts.

## 3. Open the site

In the current version of Chrome, Edge, Firefox, or Safari, open:

```
http://localhost:3000/
```

The home page links to the story pages: how AI helps, cancer, other diseases, and longer lives.

## 4. Verify the loopback-only binding

Opening `http://localhost:3000/` in a browser is not itself the local-only boundary: it only proves this computer can reach the server, not that no other network interface can. The binding has to be checked against the listeners the operating system actually reports.

Run, from the project root, while port 3000 is free:

```
node scripts/verify-local-only.mjs
```

The script:

- refuses to start anything if port 3000 is already occupied (it fails safely rather than starting another server);
- starts `npm run dev` and then `npm run start` separately, each with a bounded ready timeout (120 s for development; 180 s for production, which builds before serving);
- checks HTTP readiness by polling only `http://127.0.0.1:3000/` until it answers HTTP 2xx or 3xx;
- reads the OS-reported TCP listeners (`netstat -ano`) for port 3000 and accepts only loopback addresses (`127.0.0.1`, `::1`), rejecting wildcard listeners (`0.0.0.0`, `::`) and any other non-loopback address;
- cleans up only the process trees it started and waits until port 3000 is free again.

It exits 0 only if both servers were reachable on loopback, loopback-only, and cleanly stopped. A failed connection from another machine is not proof of loopback binding; only the OS-reported listener check is.

## 5. Stop the site

While the server is running, press `Ctrl+C` in the terminal to stop it. (`node scripts/verify-local-only.mjs` stops the servers it started on its own, so there is nothing to clean up by hand afterwards.)

## Other documented commands

From the project root:

- `npm test` runs the automated tests.
- `npm run build` builds the project without starting the server.
- `npm run verify:reading` runs the loopback HTTP reading safeguard (`scripts/verify-reading.mjs`): it starts and stops its own loopback production server and checks the five server-rendered HTTP responses for essential story content, local illustrations, citations, disclaimers, the navigation links, and the correct current-page state without executing JavaScript. Its results are safeguards, not proof of complete no-JavaScript browser behaviour or WCAG 2.2 AA conformance.
- `docs/runbooks/accessibility-validation.md` records the project's accessibility and browser evidence: it separates the checks that were actually executed from the ones that remain explicitly unverified.

## A note about the content

The site is a public educational demo that presents hopeful, research-inspired ideas about AI, medicine, and human longevity. It is not medical advice, not a diagnosis, and not a guarantee: it does not promise that any cure is coming, and it makes no forecast of what the average human lifespan will be in the future.
