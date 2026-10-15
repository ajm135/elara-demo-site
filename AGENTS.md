# Demo Site: instructions for agents

This project follows Elara's Web application blueprint (Node with TypeScript (Next.js)). The layout is in STRUCTURE.md.

## Conventions

Files and folders use kebab-case; React components, types and classes use PascalCase; functions and variables use camelCase. TypeScript runs in strict mode. Keep logic out of components: put it in src/lib and test it. Run the tests with npm test and the production build with npm run build. Dependencies and scripts are in package.json, and package-lock.json is committed.

## Rules

- Put every file in the folder its purpose names. The root holds only the files listed in STRUCTURE.md.
- Agents never change AGENTS.md or STRUCTURE.md unless their task asks for it.
- Record decisions in docs/adr/ and operations steps in docs/runbooks/.
- Tests live in tests/ unless the stack keeps them beside the code.
- Generated and local folders (.venv, node_modules, bin, obj, dist, build, out, coverage, logs) are ignored and never committed.
- A data/ folder, where the layout has one, holds small synthetic samples only.
- Names follow the stack: snake_case for Python, PascalCase for .NET projects, kebab-case for Node packages.
- No stray files: leave no copies, old, new or temporary files in the project.
- Settings are listed by name in .env.example, never with their values. Real values are never written into the project.
- Keep business logic out of request handlers, templates and views. Put it in the services or core code.
- Every new page or route gets a test.
- Settings come from the environment. List their names in .env.example, never their values.
- Pages meet the accessibility level the operator chose.

## Commands

- Run the automated tests: `npm test`
- Build the project: `npm run build`

## Never do

- Never commit real settings, keys or a .env file.
- Never build database queries by joining text. Use parameters.
- Never turn off sign-in, permission or CSRF checks to make a test pass.
- Never put secrets or personal data in templates, scripts or logs.
