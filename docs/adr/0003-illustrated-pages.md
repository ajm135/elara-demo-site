# 0003: Illustrated story pages in the App Router

- Status: accepted
- Date: 2026-10-17

## Context

Milestone 3 of the Demo Site needs the five stories from `src/lib/site-content.ts` to be readable in a browser: a home page that introduces the story, and pages on how AI helps medicine, cancer, other diseases, and longer lives. The site is local only, has no database and no sign-in, and must work without JavaScript for its content, on phone, tablet, and desktop widths, meeting WCAG 2.2 Level AA. The synthetic illustrations referenced in the content module already exist as SVG files under `public/images/`.

## Decision

- The five routes `src/app/page.tsx` (`/`) and `src/app/{how-ai-helps,cancer,diseases,longevity}/page.tsx` are sync server components that call `getSitePage(id)` and return one shared `StoryPage` component from `src/components/story-page.tsx`. No content is duplicated outside `src/lib/site-content.ts`.
- `StoryPage` renders exactly one `<main id="main-content">` (the skip-link target), with the navigation label, one `<h1>`, the summary, the images, the sections, and the disclaimer, in that order. The header nav from the layout is the only navigation; no nav is added inside `main`.
- Images are the synthetic SVGs in `public/images/`, rendered with the native `<img>` element (not `next/image`) using the `src`, `alt`, `width`, and `height` from the image references. Every alt text is descriptive and non-empty; the images are not photos of real people.
- Metadata: the home page exports an absolute title, "AI and longer lives"; the four story pages export their string `title` and `description` so the layout template appends " | AI and longer lives".
- The site stays local only: no deployment, no external images, no fetched data, no client hooks.
- The pages remain a hopeful educational demo, not medical advice. Every rendered page carries the content module's disclaimer, and the longevity page states that the 110-120 year average lifespan is an expectation held by some researchers, not a guaranteed forecast.

## Notes

- Tests in `tests/` cover the shared `StoryPage` markup (one `main`, one `h1`, images with alt text, sections, disclaimer) and each route's component and metadata, so every new route has a test.
- Copy and image references are synthetic and non-personal: no real patient names, photos, or claims about named products.
