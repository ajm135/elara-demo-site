import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import StoryPage from "../src/components/story-page";
import { sitePages, type SitePage } from "../src/lib/site-content";

const mainOpen = '<main id="main-content" tabindex="-1">';

/** Escape text the same way React escapes it in server-rendered HTML. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/** The inner HTML of the single rendered <main>. */
function mainHtml(page: SitePage): string {
  const html = renderToStaticMarkup(<StoryPage page={page} />);
  return html.slice(
    html.indexOf(mainOpen) + mainOpen.length,
    html.indexOf("</main>"),
  );
}

/**
 * The index just past the </div> that balances the <div open tag at
 * `openIndex`.
 */
function balancedDivEnd(html: string, openIndex: number): number {
  const rest = html.slice(openIndex);
  let depth = 0;
  for (const match of rest.matchAll(/<div\b[^>]*>|<\/div>/g)) {
    depth += match[0].startsWith("</") ? -1 : 1;
    if (depth === 0) {
      return openIndex + (match.index ?? 0) + match[0].length;
    }
  }
  throw new Error("the div open tag never balances its closing tag");
}

/**
 * The wide top section as rendered: the single balanced hero element the
 * component emits inside <main id="main-content" tabindex="-1"> — main's
 * first element.
 *
 * React 19's server renderer hoists an auto-injected
 * <link rel="preload" as="image"> for every native <img> to the very start
 * of the component render (in the full page it lands in <head>); aside
 * from those renderer-injected links, nothing else may sit ahead of main.
 * After the main open tag, only whitespace may sit ahead of the hero. The
 * hero must be a single balanced div that ends before the page's first
 * .story-illustration figure, section, or disclaimer — never at the main
 * open tag.
 */
function heroHtml(page: SitePage): string {
  const html = renderToStaticMarkup(<StoryPage page={page} />);
  const mainStart = html.indexOf(mainOpen);
  expect(mainStart, `${page.id}: main#main-content must be present`).toBeGreaterThan(-1);

  // Ahead of main: only the auto-injected image preloads (and whitespace).
  const prefix = html.slice(0, mainStart);
  for (const tag of prefix.match(/<[^>]+>/g) ?? []) {
    expect(
      /^<link [^>]*\brel="preload"[^>]*\bas="image"[^>]*\/>$/.test(tag),
      `${page.id}: only auto-injected image preloads may precede main, found: ${tag}`,
    ).toBe(true);
  }
  expect(
    prefix.replace(
      /<link [^>]*\brel="preload"[^>]*\bas="image"[^>]*\/>/g,
      "",
    ).trim(),
    `${page.id}: nothing but auto-injected image preloads may precede main`,
  ).toBe("");

  const mainEnd = html.indexOf("</main>");
  expect(
    mainEnd,
    `${page.id}: </main> must close the landmark`,
  ).toBeGreaterThan(mainStart);
  const body = html.slice(mainStart + mainOpen.length, mainEnd);

  // The hero is main's first element: only whitespace may sit between the
  // main open tag and the hero div.
  const heroStart = body.indexOf('<div class="hero">');
  expect(
    heroStart,
    `${page.id}: the hero must be present inside main`,
  ).toBeGreaterThan(-1);
  expect(
    body.slice(0, heroStart).trim(),
    `${page.id}: the hero must be the first element inside main`,
  ).toBe("");

  // The hero is a single balanced div...
  const hero = body.slice(heroStart, balancedDivEnd(body, heroStart));
  expect(
    hero.match(/<div\b/g)?.length ?? 0,
    `${page.id}: the hero must balance its own divs`,
  ).toBe(hero.match(/<\/div>/g)?.length ?? 0);

  // ...and it ends before the page's first .story-illustration figure,
  // section, or disclaimer — none of those may sit inside it.
  expect(
    hero.indexOf('<figure class="story-illustration">'),
    `${page.id}: the hero must end before the first .story-illustration`,
  ).toBe(-1);
  expect(
    hero.indexOf("<section"),
    `${page.id}: the hero must end before the first section`,
  ).toBe(-1);
  expect(
    hero.indexOf(`<p>${escapeHtml(page.disclaimer)}</p>`),
    `${page.id}: the hero must end before the disclaimer`,
  ).toBe(-1);

  return hero;
}

describe("story page", () => {
  it("renders exactly one focusable main with id main-content and exactly one h1", () => {
    for (const page of sitePages) {
      const html = renderToStaticMarkup(<StoryPage page={page} />);
      expect(html.match(/<main/g)).toHaveLength(1);
      expect(html).toContain(mainOpen);
      expect(html.match(/<h1>/g)).toHaveLength(1);
      expect(html).toContain(`<h1>${escapeHtml(page.heading)}</h1>`);
    }
  });

  it("opens main with the composed hero as its first element: kicker, single h1, summary, review date, in that order", () => {
    for (const page of sitePages) {
      const hero = heroHtml(page);

      // The wide top section is main's first element: a single balanced
      // hero div right after the main open tag, ending before the page
      // body (illustrations, sections, disclaimer) begins.
      expect(hero.startsWith('<div class="hero">')).toBe(true);
      expect(hero.endsWith("</div>")).toBe(true);
      expect(hero.match(/<div\b/g)?.length ?? 0).toBe(
        hero.match(/<\/div>/g)?.length ?? 0,
      );

      const heroTextStart = hero.indexOf('<div class="hero-text">');
      const kicker = `<p class="hero-kicker">${escapeHtml(page.navLabel)}</p>`;
      const heading = `<h1>${escapeHtml(page.heading)}</h1>`;
      const summary = `<p class="hero-summary">${escapeHtml(page.summary)}</p>`;
      const kickerStart = hero.indexOf(kicker);
      const headingStart = hero.indexOf(heading);
      const summaryStart = hero.indexOf(summary);

      // The hero text block leads with the story's navigation label as a
      // kicker, then the single h1, then the summary — the editorial
      // hierarchy of the wide top section.
      expect(heroTextStart).toBeGreaterThan(-1);
      expect(kickerStart).toBeGreaterThan(heroTextStart);
      expect(headingStart).toBeGreaterThan(kickerStart);
      expect(summaryStart).toBeGreaterThan(headingStart);

      // The review date is a <time datetime> element inside that hero,
      // after the summary.
      if (page.reviewedOn !== undefined) {
        const reviewStart = hero.search(
          new RegExp(`<time datetime="${page.reviewedOn}"`, "i"),
        );
        expect(reviewStart).toBeGreaterThan(summaryStart);
      }
    }
  });

  it("keeps the heading hierarchy intact: every h2 after the h1, no skipped level", () => {
    for (const page of sitePages) {
      const html = renderToStaticMarkup(<StoryPage page={page} />);
      const h1Index = html.indexOf("<h1");
      expect(h1Index).toBeGreaterThan(-1);

      const h2Indexes = [...html.matchAll(/<h2[\s>]/g)].map(
        (match) => match.index ?? -1,
      );
      expect(h2Indexes.length).toBeGreaterThan(0);
      for (const index of h2Indexes) {
        expect(index).toBeGreaterThan(h1Index);
      }

      // No h3 or deeper appears before the first h2: the hero introduces
      // no skipped heading level.
      const firstH2 = h2Indexes[0];
      for (const tag of ["<h3", "<h4", "<h5", "<h6"]) {
        const deeper = html.indexOf(tag);
        if (deeper !== -1) {
          expect(deeper).toBeGreaterThan(firstH2);
        }
      }
    }
  });

  it("renders one native img per image reference, in order, with non-empty alt and dimensions", () => {
    for (const page of sitePages) {
      const html = renderToStaticMarkup(<StoryPage page={page} />);
      const positions = page.images.map((image) => {
        const start = html.indexOf(`<img src="${image.src}"`);
        expect(start).toBeGreaterThan(-1);
        expect(html).toContain(`alt="${escapeHtml(image.alt)}"`);
        expect(html).toContain(`width="${image.width}"`);
        expect(html).toContain(`height="${image.height}"`);
        return start;
      });
      const inOrder = positions.every(
        (position, index) => index === 0 || position > positions[index - 1],
      );
      expect(inOrder).toBe(true);
      expect(html).not.toContain('alt=""');
    }
  });

  it("renders one section per section with its h2 heading and a p per paragraph", () => {
    for (const page of sitePages) {
      const html = renderToStaticMarkup(<StoryPage page={page} />);
      for (const section of page.sections) {
        expect(html).toContain(`<h2>${escapeHtml(section.heading)}</h2>`);
        for (const paragraph of section.paragraphs) {
          expect(html).toContain(`<p>${escapeHtml(paragraph)}</p>`);
        }
      }
    }
  });

  it("renders at least one external citation link inside main on every page", () => {
    // Node-level guard for the browser check `main a[href^='https://']` in
    // tests/e2e/reading-experience.json: every route's main must carry a
    // stable https link a reader can open, on the story pages via the
    // claim evidence panels and on home via its sources block.
    for (const page of sitePages) {
      const html = renderToStaticMarkup(<StoryPage page={page} />);
      const mainStart = html.indexOf("<main");
      expect(mainStart, `${page.id}: main exists`).toBeGreaterThan(-1);
      const mainBody = html.slice(mainStart);
      expect(
        mainBody,
        `${page.id}: main contains an https citation link`,
      ).toMatch(/<a href="https:\/\/[^"]+">/);
    }
  });

  it("ends main with the 'not medical advice' disclaimer paragraph and adds no navigation inside main", () => {
    for (const page of sitePages) {
      const body = mainHtml(page);
      expect(page.disclaimer).toMatch(/not medical advice/);
      expect(body.endsWith(`<p>${escapeHtml(page.disclaimer)}</p>`)).toBe(true);
      expect(body).not.toContain("<nav");
    }
  });
});
