# 0002: Static story content in src/lib/site-content.ts

- Status: accepted
- Date: 2026-10-15

## Context

Milestone 2 of the Demo Site needs the story — how AI is expected to help humanity diagnose, treat, and eventually cure cancer and many other diseases, and why some researchers expect average human lifespan to reach about 110–120 years — in a form that later pages can render and unit tests can check. The site has no database and no sign-in; content must live in the project as static data.

## Decision

- All page copy and image references live in `src/lib/site-content.ts` as a typed, read-only data module: `sitePages` (five `SitePage` values for home, how-ai-helps, cancer, diseases, and longevity, in that order) plus `getSitePage(id)` for lookup by id.
- No database: the module is plain static content compiled into the site.
- The content is a hopeful educational demo, not medical advice. Every page carries a disclaimer saying so, and the longevity copy says the 110–120 year figure is an expectation held by some researchers, not a guaranteed forecast.
- Image references (`id`, `src`, `alt`, `width`, `height`) point at paths under `/images/`. The actual synthetic image files, and the pages and routes that render them, come in later milestones; no files are added under `public/` yet.
- `src/lib/site.ts` (site title, home heading, home summary) is left unchanged, and its existing tests keep passing.

## Notes

- Tests in `tests/site-content.test.ts` cover the content shape — the five page ids and paths, the cancer and longevity copy, the disclaimers, and the image references — so pages can render the module without a database.
- Copy is synthetic and non-personal: no real patient names, photos, or claims about named products.

## Superseded (medical assertions only)

The statements in this ADR that the story is "how AI is expected to help humanity diagnose, treat, and eventually cure cancer and many other diseases" and that "some researchers expect average human lifespan to reach about 110–120 years" (Context, and the matching 110–120 expectation in the Decision) are superseded by ADR 0005 (evidence-led health claims, 2026-10-18), the policy of record for the shipped health content. All other decisions in this ADR — the static content model in `src/lib/site-content.ts` and its tests — remain in force.
