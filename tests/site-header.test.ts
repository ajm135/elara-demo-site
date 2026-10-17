import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SiteHeader from "../src/components/site-header";

const expectedNavPaths = [
  "/",
  "/how-ai-helps",
  "/cancer",
  "/diseases",
  "/longevity",
] as const;

describe("site header", () => {
  const html = renderToStaticMarkup(createElement(SiteHeader));

  it("offers a skip link that jumps to the main content", () => {
    expect(html).toContain('href="#main-content"');
    expect(html).toContain("Skip to main content");
  });

  it("links every story page from the main navigation", () => {
    for (const path of expectedNavPaths) {
      expect(html).toContain(`<a href="${path}"`);
    }
  });

  it("labels the cancer and other-diseases links visibly", () => {
    expect(html).toContain('<a href="/cancer">Cancer</a>');
    expect(html).toContain('<a href="/diseases">Other diseases</a>');
  });
});
