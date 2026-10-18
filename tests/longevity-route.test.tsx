import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import LongevityPage, { metadata } from "../src/app/longevity/page";
import {
  getSitePage,
  nextStory,
  storyPositionLabel,
} from "../src/lib/site-content";

const page = getSitePage("longevity");
const next = nextStory(page.id);

describe("longevity route", () => {
  it("exports a function component that renders the story in a focusable main with an h1", () => {
    expect(typeof LongevityPage).toBe("function");
    const html = renderToStaticMarkup(<LongevityPage />);
    expect(html).toContain('<main id="main-content" tabindex="-1">');
    expect(html).toContain(`<h1>${page.heading}</h1>`);
    // The nav label opens the composed hero as the kicker paragraph.
    expect(html).toContain(`<p class="hero-kicker">${page.navLabel}</p>`);
  });

  it("marks only its own navigation link current and shows its position in the sequence", () => {
    const html = renderToStaticMarkup(<LongevityPage />);
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toContain(
      `<a aria-current="page" href="${page.path}">${page.navLabel}</a>`,
    );
    expect(html).toContain(storyPositionLabel(page.id));
    if (next === null) {
      expect(html).toContain("End of the stories");
      expect(html).not.toContain("next-story-cue");
    } else {
      expect(html).toContain(
        `Next story: <a href="${next.path}">${next.navLabel}</a>`,
      );
    }
  });

  it("explains the three lifespan distinctions and makes no future average forecast", () => {
    const html = renderToStaticMarkup(<LongevityPage />);
    // Strip tags and attributes so the numeric checks see only text, not
    // image dimensions such as width="1200".
    const text = html.replace(/<[^>]*>/g, " ");
    expect(text).toMatch(/life expectancy/i);
    expect(text).toMatch(/maximum lifespan/i);
    expect(text).toMatch(/healthy lifespan/i);
    expect(text).not.toMatch(/110/);
    expect(text).not.toMatch(/120/);
    expect(text).not.toMatch(/cure cancer/i);
    expect(text).not.toMatch(/some researchers/i);
  });

  it("shows the three lifespan distinctions as exact visible term labels inside main, in order", () => {
    // The browser check is case-sensitive: the sentence-case occurrences in
    // the summary and paragraphs do not count, so the exact title-cased
    // strings must be visible text on their own — the definition list the
    // longevity page renders beside "Three numbers, three different things".
    const html = renderToStaticMarkup(<LongevityPage />);
    const mainOpen = '<main id="main-content" tabindex="-1">';
    const mainStart = html.indexOf(mainOpen);
    expect(mainStart, "main#main-content must be present").toBeGreaterThan(-1);
    const mainText = html
      .slice(mainStart, html.indexOf("</main>"))
      .replace(/<[^>]*>/g, " ");

    const first = mainText.indexOf("Life expectancy");
    const second = mainText.indexOf("Maximum lifespan");
    const third = mainText.indexOf("Healthy lifespan");
    expect(first, 'main must visibly contain "Life expectancy"').toBeGreaterThan(-1);
    expect(
      second,
      'main must visibly contain "Maximum lifespan"',
    ).toBeGreaterThan(first);
    expect(third, 'main must visibly contain "Healthy lifespan"').toBeGreaterThan(
      second,
    );
  });

  it("shows every local image with its descriptive alternative text", () => {
    const html = renderToStaticMarkup(<LongevityPage />);
    for (const image of page.images) {
      expect(html).toContain(`<img src="${image.src}"`);
      expect(html).toContain(`alt="${image.alt}"`);
    }
  });

  it("exports string metadata so the layout template can append the site name", () => {
    expect(metadata.title).toBe(page.title);
    expect(metadata.description).toBe(page.description);
  });
});
