import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import HowAiHelpsPage, { metadata } from "../src/app/how-ai-helps/page";
import {
  getSitePage,
  nextStory,
  storyPositionLabel,
} from "../src/lib/site-content";

const page = getSitePage("how-ai-helps");
const next = nextStory(page.id);

describe("how-ai-helps route", () => {
  it("exports a function component that renders the story in a focusable main with an h1", () => {
    expect(typeof HowAiHelpsPage).toBe("function");
    const html = renderToStaticMarkup(<HowAiHelpsPage />);
    expect(html).toContain('<main id="main-content" tabindex="-1">');
    expect(html).toContain(`<h1>${page.heading}</h1>`);
    // The nav label opens the composed hero as the kicker paragraph.
    expect(html).toContain(`<p class="hero-kicker">${page.navLabel}</p>`);
  });

  it("marks only its own navigation link current and shows its position in the sequence", () => {
    const html = renderToStaticMarkup(<HowAiHelpsPage />);
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

  it("shows every local image with its descriptive alternative text", () => {
    const html = renderToStaticMarkup(<HowAiHelpsPage />);
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
