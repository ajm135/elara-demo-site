import { existsSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import LongevityPage from "../src/app/longevity/page";
import {
  getSitePage,
  nextStory,
  storyPositionLabel,
} from "../src/lib/site-content";

const page = getSitePage("longevity");
const next = nextStory(page.id);

describe("longevity page", () => {
  it("renders the story in a focusable main with a single heading and an image", () => {
    const html = renderToStaticMarkup(createElement(LongevityPage));
    expect(html).toContain('<main id="main-content" tabindex="-1">');
    expect(html).toContain("<h1>");
    expect(html).toContain("<img");
  });

  it("explains the three lifespan distinctions and makes no future average forecast", () => {
    const html = renderToStaticMarkup(createElement(LongevityPage));
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

  it("shows its own active navigation link and the story-five ending", () => {
    const html = renderToStaticMarkup(createElement(LongevityPage));
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

  it("shows the longer-lives illustration that ships under public/", () => {
    const html = renderToStaticMarkup(createElement(LongevityPage));
    expect(html).toContain('src="/images/longer-lives.svg"');
    expect(existsSync("public/images/longer-lives.svg")).toBe(true);
  });
});
