import { existsSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CancerPage from "../src/app/cancer/page";

describe("cancer page", () => {
  it("renders the story in a main with a single heading and an image", () => {
    const html = renderToStaticMarkup(createElement(CancerPage));
    expect(html).toContain("<main id=\"main-content\">");
    expect(html).toContain("<h1>");
    expect(html).toContain("<img");
  });

  it("names cancer and frames AI as the hoped-for help", () => {
    const html = renderToStaticMarkup(createElement(CancerPage));
    expect(html).toContain("Cancer");
    expect(html).toContain("AI");
  });

  it("shows both cancer illustrations that ship under public/", () => {
    const html = renderToStaticMarkup(createElement(CancerPage));
    expect(html).toContain('src="/images/cancer-research.svg"');
    expect(html).toContain('src="/images/cancer-hope.svg"');
    expect(existsSync("public/images/cancer-research.svg")).toBe(true);
    expect(existsSync("public/images/cancer-hope.svg")).toBe(true);
  });
});
