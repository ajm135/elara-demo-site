# Demo Site

A local-only educational demo about how AI may help diagnose and treat disease, and about the possibility of longer lives. It has no sign-in, no database, and no deployment: the five pages are static content with local illustrations, read in a browser on the computer where the site runs.

This site is an educational demo. It is not medical advice, not a diagnosis, and not a promise that any particular outcome is certain.

## Getting started

Start the site locally by following the [local-start runbook](docs/runbooks/local-start.md).

Install dependencies from the committed lockfile with:

```
npm ci
```

`npm ci` is the lockfile-based install command for this project; it installs the exact locked dependency tree without modifying `package-lock.json`.

## Runtime

The compatible runtime is Node.js >=22.12.0 and <23, declared in `engines` in `package.json` (the root `.nvmrc` pins 22.16.0). The project was tested with Node.js 22.16.0 and npm 10.9.2.

The layout is in STRUCTURE.md, and the rules for agents are in AGENTS.md.

## How to run

Set it up: `npm install`

Start it: `npm run dev`

Test it: `npm test`
