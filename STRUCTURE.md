# Project structure

Blueprint: Web application (Node with TypeScript (Next.js)), version 1.
Elara writes this file from the project's layout and keeps it up to date; change the layout on the project page, not here.

## Folders

- `docs/`: Documentation. docs/adr/ holds decision records and docs/runbooks/ holds operations guides.
- `scripts/`: Developer and operations scripts. No secrets in them.
- `.github/`: GitHub settings and workflows.
- `src/`: The application source: app/ for pages and layouts, components/ for UI parts, lib/ for logic with no UI.
- `src/app/`: Pages and layouts (Next.js app router).
- `src/components/`: Reusable UI components.
- `src/lib/`: Logic with no UI, testable on its own.
- `public/`: Static files served as they are.
- `tests/`: Automated tests. End-to-end tests go in tests/e2e.

## Files at the root

`README.md`, `AGENTS.md`, `STRUCTURE.md`, `.gitignore`, `.env.example`, `LICENSE`, `CHANGELOG.md`, `.editorconfig`, `.gitattributes`, `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `compose.yaml`, `package.json`, `package-lock.json`, `tsconfig*.json`, `eslint.config.*`, `.prettierrc*`, `.nvmrc`, `.npmrc`, `vitest.config.*`, `jest.config.*`, `next.config.*`, `next-env.d.ts`

## Not checked (generated or local)

`.venv/`, `venv/`, `env/`, `.tox/`, `htmlcov/`, `.mypy_cache/`, `node_modules/`, `bin/`, `obj/`, `dist/`, `build/`, `out/`, `coverage/`, `__pycache__/`, `.pytest_cache/`, `logs/`, `.vs/`, `instance/`, `.vscode/`, `.idea/`, `.next/`
