import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HomePage from "../src/app/page";
import {
  getHomeHeading,
  getHomeSummary,
  getSiteTitle,
} from "../src/lib/site";

describe("home route", () => {
  it("exports a function component from the home page module", () => {
    expect(typeof HomePage).toBe("function");
    const rendered = HomePage();
    expect(rendered).toBeTruthy();
  });

  it("renders the home heading as the page heading", () => {
    expect(getHomeHeading()).toBe("A hopeful look at AI and human health");
  });

  it("keeps the demo clearly educational, not medical advice", () => {
    expect(getHomeSummary()).toMatch(/not medical advice/i);
  });

  it("provides the site title used by metadata", () => {
    expect(getSiteTitle()).toBe("Demo Site");
  });

  it("renders the home story into a main with a heading, an image, and the balanced copy", () => {
    const html = renderToStaticMarkup(createElement(HomePage));
    // Strip tags and attributes so the numeric checks see only text, not
    // image dimensions such as width="1200".
    const text = html.replace(/<[^>]*>/g, " ");
    expect(html).toContain("<main id=\"main-content\">");
    expect(html).toContain("<h1>");
    expect(html).toContain('src="/images/hopeful-future.svg"');
    expect(text).toContain("cancer");
    expect(text).toMatch(/life expectancy/i);
    expect(text).toMatch(/not a guarantee/i);
    expect(text).not.toMatch(/110/);
    expect(text).not.toMatch(/120/);
    expect(text).not.toMatch(/cure cancer/i);
  });
});
