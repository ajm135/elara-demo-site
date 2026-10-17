import { existsSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DiseasesPage from "../src/app/diseases/page";

describe("diseases page", () => {
  it("renders the story in a main with a single heading and an image", () => {
    const html = renderToStaticMarkup(createElement(DiseasesPage));
    expect(html).toContain("<main id=\"main-content\">");
    expect(html).toContain("<h1>");
    expect(html).toContain("<img");
  });

  it("covers diseases beyond cancer and frames AI as the hoped-for help", () => {
    const html = renderToStaticMarkup(createElement(DiseasesPage));
    expect(html).toContain("diseases");
    expect(html).toContain("AI");
  });

  it("shows the other-diseases illustration that ships under public/", () => {
    const html = renderToStaticMarkup(createElement(DiseasesPage));
    expect(html).toContain('src="/images/other-diseases.svg"');
    expect(existsSync("public/images/other-diseases.svg")).toBe(true);
  });
});
