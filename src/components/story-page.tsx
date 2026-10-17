import type { SitePage } from "../lib/site-content";

/**
 * One illustrated story page, rendered from static site content.
 *
 * This is a server component (no "use client"): it takes a `SitePage` from
 * `src/lib/site-content.ts` and renders exactly one `<main id="main-content">`
 * — the target of the skip link in `site-header.tsx` — with, in order:
 *
 * 1. the page's navigation label as a paragraph,
 * 2. the page heading (the only `<h1>`),
 * 3. the page summary,
 * 4. one native `<img>` per image reference (src, alt, width, height; no
 *    empty alt, no next/image, no external images),
 * 5. one `<section>` per section, with an `<h2>` and a `<p>` per paragraph,
 * 6. the page disclaimer.
 *
 * No client hooks, no fetched data, no second navigation: the header nav from
 * the layout is the way between pages.
 */
export default function StoryPage({ page }: { page: SitePage }) {
  return (
    <main id="main-content">
      <p>{page.navLabel}</p>
      <h1>{page.heading}</h1>
      <p>{page.summary}</p>
      {page.images.map((image) => (
        <img
          key={image.id}
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
        />
      ))}
      {page.sections.map((section) => (
        <section key={section.id}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </section>
      ))}
      <p>{page.disclaimer}</p>
    </main>
  );
}
