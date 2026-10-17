import { existsSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import LongevityPage from "../src/app/longevity/page";

describe("longevity page", () => {
  it("renders the story in a main with a single heading and an image", () => {
    const html = renderToStaticMarkup(createElement(LongevityPage));
    expect(html).toContain("<main id=\"main-content\">");
    expect(html).toContain("<h1>");
    expect(html).toContain("<img");
  });

  it("states the expected 110-120 year average lifespan", () => {
    const html = renderToStaticMarkup(createElement(LongevityPage));
    expect(html).toContain("110");
    expect(html).toContain("120");
  });

  it("shows the longer-lives illustration that ships under public/", () => {
    const html = renderToStaticMarkup(createElement(LongevityPage));
    expect(html).toContain('src="/images/longer-lives.svg"');
    expect(existsSync("public/images/longer-lives.svg")).toBe(true);
  });
});
