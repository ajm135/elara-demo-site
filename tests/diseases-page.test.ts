import { existsSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DiseasesPage from "../src/app/diseases/page";
import {
  getSitePage,
  nextStory,
  storyPositionLabel,
} from "../src/lib/site-content";

const page = getSitePage("diseases");
const next = nextStory(page.id);

describe("diseases page", () => {
  it("renders the story in a focusable main with a single heading and an image", () => {
    const html = renderToStaticMarkup(createElement(DiseasesPage));
    expect(html).toContain('<main id="main-content" tabindex="-1">');
    expect(html).toContain("<h1>");
    expect(html).toContain("<img");
  });

  it("covers diseases beyond cancer and frames AI as the hoped-for help", () => {
    const html = renderToStaticMarkup(createElement(DiseasesPage));
    expect(html).toContain("diseases");
    expect(html).toContain("AI");
  });

  it("shows its own active navigation link and reading position", () => {
    const html = renderToStaticMarkup(createElement(DiseasesPage));
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

  it("shows the other-diseases illustration that ships under public/", () => {
    const html = renderToStaticMarkup(createElement(DiseasesPage));
    expect(html).toContain('src="/images/other-diseases.svg"');
    expect(existsSync("public/images/other-diseases.svg")).toBe(true);
  });
});
