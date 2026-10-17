# 0004: No sign-in, no database, local-only hosting

- Status: accepted
- Date: 2026-10-17

## Context

The Demo Site is a public demo for a general audience that presents, in hopeful language, how AI is expected to help humanity diagnose, treat, and eventually cure cancer and many other diseases, and why some researchers expect average human lifespan to reach about 110-120 years. The operator confirmed that the site only needs to run on this computer with Next.js: there is no audience account to manage, no content to store or update after build time, and no hosting environment to deploy to. Every public page must meet WCAG 2.2 Level AA and work in current Chrome, Edge, Firefox, and Safari on phone, tablet, and desktop.

## Decision

- No sign-in: the site is a public demo anyone can open. There is no authentication, no session, and no permission logic in the project, so no security check exists that would need to be enabled, disabled, or worked around.
- No database: all page copy and image references stay in `src/lib/site-content.ts` as static content compiled into the site, per ADR 0002. There is no data layer, no migrations, and no runtime content storage.
- Local-only hosting: the site runs on this computer with Next.js (`npm start` builds and serves it on port 3000). It is not deployed to any external host, and no deployment configuration is added to the project.
- Every public page must meet WCAG 2.2 Level AA: unique page titles, one `main` landmark, labeled navigation, meaningful image alternative text, logical heading order, sufficient color contrast, and visible keyboard focus, in the supported browsers and at phone, tablet, and desktop widths.
- The site is a hopeful educational demo, not medical advice, a diagnosis, or a promise: the copy presents cures and a 110-120 year average lifespan as expectations held by some researchers, not as certainties, and every page carries the content module's disclaimer.

## Notes

- The decisions above record the operator's confirmed choices (no sign-in, no database, local-only) as accepted ADRs so later milestones have a single place to point when the question of accounts, storage, or deployment arises.
- ADR 0001 already notes the local-only build and test setup; ADR 0004 extends that to the hosting decision itself: no deployment target is part of this project.
- Keeping content static and hosting local means there is nothing to protect with credentials: no environment secrets are required, and none are listed in `.env.example`.
