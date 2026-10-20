# 0001: Next.js App Router with TypeScript and Vitest

- Status: accepted
- Date: 2026-10-15

## Context

The Demo Site needs a public, local-only site that runs on this computer with Node.js, TypeScript, and the Next.js App Router. There is no sign-in, no database, and no deployment.

## Decision

- Use the current stable Next.js release with the App Router (server components by default), with matching React and React DOM from the npm registry.
- Use strict TypeScript (`strict: true`); page and layout code lives in `src/app/`, reusable UI in `src/components/`, and testable non-UI logic in `src/lib/`.
- Use Vitest (`npm test` runs `vitest run`) for unit tests in `tests/`; `npm run build` runs the Next.js production build with type checking enabled.
- The site is local-only: no deployment, no environment secrets, and no `.env.example` entries unless a setting name is actually introduced.
- Page content is static content in the project; images will be synthetic illustrations stored in `public/` in later milestones.

## Notes

- The `npm run build` and `npm test` scripts prefix their commands with `set "PATH=%ProgramFiles%\nodejs;node_modules\.bin" &&` because this machine's user PATH is so long that Windows `cmd.exe` cannot resolve commands from it (values over ~8191 characters break command lookup, so the plain `next`/`vitest` shims fail). The prefix sets a short, local-only PATH inside the script, so the documented commands keep working on this computer.
- Vitest runs in a plain Node environment (no browser, no renderer). `vitest.config.mts` sets `oxc.jsx = { runtime: "automatic" }` because Vite 8 transforms with oxc, which would otherwise honour `jsx: "preserve"` from tsconfig.json and hand raw JSX to the test runner.
