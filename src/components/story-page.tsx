import { Fragment } from "react";
import type { SitePage } from "../lib/site-content";
import {
  claimsForParagraph,
  formatIsoDate,
  referenceHref,
  referenceLocatorLabel,
  resolvePageSourceReferences,
} from "../lib/site-content";
import ClaimEvidence from "./claim-evidence";

/**
 * One illustrated story page, rendered from static site content.
 *
 * This is a server component (no "use client"): it takes a `SitePage` from
 * `src/lib/site-content.ts` and renders the single focusable
 * `<main id="main-content" tabindex="-1">` — the target of the skip link
 * in `site-header.tsx` — as the wider page: it spans the `--page-shell`
 * width while its long-form blocks stay in the centered `--measure`
 * reading column. The negative tabindex makes the landmark focusable by
 * the skip link without putting it in the tab sequence.
 *
 * Composition (the editorial hierarchy, not a flat stack):
 *
 * 1. the wide top section (`.hero`), main's first element and outside
 *    the reading column: the story's nav label as a kicker, the single
 *    `<h1>`, the summary, the review date as a visible "Stories reviewed
 *    …" line with a `<time datetime>` element (the page's real
 *    claim-register inspection date), and the page's framed illustration
 *    (`.hero-media`, a native `<img>` with the existing src, alt, width,
 *    and height — no empty alt, no next/image, no external images). It
 *    spans the wider page (the `--page-shell` width); only its text block
 *    (`.hero-text`) stays capped at the `--measure` reading column. At
 *    768px and up the text sits beside the framed image;
 * 2. any further illustrations of the page, each in its own framed figure
 *    (`.story-illustration`), in reference order;
 * 3. one `<section>` per section, with an `<h2>`, an optional ordered
 *    definition list of exact term labels (`<dl class="lifespan-terms">`,
 *    only the longevity story's "three numbers" section carries one, so a
 *    reader can find the three lifespan distinctions without reading the
 *    paragraphs), a plain `<p>` per paragraph, and — immediately after
 *    any paragraph that makes a consequential claim — one `ClaimEvidence`
 *    block per claim, still inside that section, styled by globals.css as
 *    a readable evidence panel. Each section sits in a plain,
 *    non-focusable `.band` wrapper that carries the page's alternating
 *    full-width section bands (docs/adr/0008-reference-look.md): the
 *    band holds no text of its own, so the reading order, the headings,
 *    and the keyboard order are unchanged;
 * 4. the page's optional sources block (`section.sources`): rendered only
 *    when the page data carries one (currently the home page, which makes
 *    no consequential claim of its own), with the block's heading, its
 *    intro paragraph, and one `<li>` per resolved catalogue reference
 *    (title, publishing body or journal, publication date, and the same
 *    stable https URL or DOI anchor the evidence panels use). It sits
 *    before the disclaimer and is a list, not a navigation;
 * 5. the page disclaimer, a plain paragraph, which stays the last element
 *    of main.
 *
 * No client hooks, no fetched data, no second navigation: the header nav
 * (rendered by the route's page) is the way between pages, and everything
 * here reads with JavaScript disabled.
 */
/**
 * The alternating section band a block of the page sits on: the
 * reference's stack of full-width horizontal bands, the plain page
 * surface and the pale band in turn, separated by whitespace rather than
 * by rules (docs/adr/0008-reference-look.md). The band is a plain,
 * non-focusable wrapper: it carries no text of its own, so the reading
 * order, the headings, and the keyboard order are unchanged.
 */
function bandClass(index: number): string {
  return index % 2 === 1 ? "band band-alt" : "band";
}

export default function StoryPage({ page }: { page: SitePage }) {
  const [heroImage, ...additionalImages] = page.images;
  return (
    <main id="main-content" tabIndex={-1}>
      <div className="hero">
        <div className="hero-text">
          <p className="hero-kicker">{page.navLabel}</p>
          <h1>{page.heading}</h1>
          <p className="hero-summary">{page.summary}</p>
          {page.reviewedOn !== undefined && (
            <p className="hero-review">
              Stories reviewed{" "}
              <time dateTime={page.reviewedOn}>
                {formatIsoDate(page.reviewedOn)}
              </time>
              .
            </p>
          )}
        </div>
        <figure className="hero-media">
          <img
            src={heroImage.src}
            alt={heroImage.alt}
            width={heroImage.width}
            height={heroImage.height}
          />
        </figure>
      </div>
      {additionalImages.map((image) => (
        <figure key={image.id} className="story-illustration">
          <img
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
          />
        </figure>
      ))}
      {page.sections.map((section, index) => (
        <div key={section.id} className={bandClass(index)}>
          <section>
            <h2>{section.heading}</h2>
            {section.terms !== undefined && (
              <dl className="lifespan-terms">
                {section.terms.map((entry) => (
                  <Fragment key={entry.term}>
                    <dt>{entry.term}</dt>
                    <dd>{entry.definition}</dd>
                  </Fragment>
                ))}
              </dl>
            )}
            {section.paragraphs.map((paragraph, paragraphIndex) => (
              <Fragment key={paragraphIndex}>
                <p>{paragraph}</p>
                {claimsForParagraph(page.id, section.id, paragraph).map(
                  (claim) => (
                    <ClaimEvidence key={claim.id} claim={claim} />
                  ),
                )}
              </Fragment>
            ))}
          </section>
        </div>
      ))}
      {page.sources !== undefined && (
        <div className={bandClass(page.sections.length)}>
          <section className="sources">
            <h2>{page.sources.heading}</h2>
            <p>{page.sources.intro}</p>
            <ul>
              {resolvePageSourceReferences(page.sources.referenceIds).map(
                (reference) => (
                  <li key={reference.id}>
                    <cite>{reference.title}</cite>, {reference.publisher},{" "}
                    {formatIsoDate(reference.publishedOn)}.{" "}
                    <a href={referenceHref(reference)}>
                      {referenceLocatorLabel(reference)}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </section>
        </div>
      )}
      <p>{page.disclaimer}</p>
    </main>
  );
}
