import { existsSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HowAiHelpsPage from "../src/app/how-ai-helps/page";
import {
  getSitePage,
  nextStory,
  storyPositionLabel,
} from "../src/lib/site-content";

const page = getSitePage("how-ai-helps");
const next = nextStory(page.id);

describe("how-ai-helps page", () => {
  it("renders the story in a focusable main with a single heading and an image", () => {
    const html = renderToStaticMarkup(createElement(HowAiHelpsPage));
    expect(html).toContain('<main id="main-content" tabindex="-1">');
    expect(html).toContain("<h1>");
    expect(html).toContain("<img");
  });

  it("tells the story in terms of AI", () => {
    const html = renderToStaticMarkup(createElement(HowAiHelpsPage));
    expect(html).toContain("AI");
  });

  it("shows its own active navigation link and reading position", () => {
    const html = renderToStaticMarkup(createElement(HowAiHelpsPage));
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

  it("shows the medicine illustration that ships under public/", () => {
    const html = renderToStaticMarkup(createElement(HowAiHelpsPage));
    expect(html).toContain('src="/images/ai-in-medicine.svg"');
    expect(existsSync("public/images/ai-in-medicine.svg")).toBe(true);
  });
});
