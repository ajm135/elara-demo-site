# Runbook: start the Demo Site locally

This runbook explains how to run the Demo Site on this computer. The site is a public, local-only educational demo: it has no sign-in, no database, and no deployment.

## Prerequisites

- Node.js and npm are already installed on this computer (the site was verified with Node.js 22 and npm 10).
- No sign-in is needed: anyone can open the site.
- No database is needed: all page copy and image references are static files in the project.
- No deployment is needed: the site only runs on this computer.
- No environment variables or secrets are needed. There is nothing to set up before running the commands below.

## 1. Install dependencies

Open a terminal (for example PowerShell or Command Prompt) in the project root folder — the folder that contains `package.json` — and run:

```
npm install
```

This reads the committed `package-lock.json` and installs the project's dependencies into `node_modules/`.

## 2. Start the site

From the project root, run:

```
npm start
```

The `start` script first builds the project (`next build`) and then serves it (`next start`) on port 3000. Wait until the build finishes; the server then stays running and serves the site.

## 3. Open the site

In the current version of Chrome, Edge, Firefox, or Safari, open:

```
http://localhost:3000/
```

The home page links to the story pages: how AI helps, cancer, other diseases, and longer lives.

## 4. Stop the site

While the server is running, press `Ctrl+C` in the terminal to stop it.

## Other documented commands

From the project root:

- `npm test` runs the automated tests.
- `npm run build` builds the project without starting the server.

## A note about the content

The site is a public educational demo that presents hopeful, research-inspired ideas about AI, medicine, and human longevity. It is not medical advice, not a diagnosis, and not a promise that any cure or a 110–120 year average lifespan is certain.
