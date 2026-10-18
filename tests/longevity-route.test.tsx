import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import LongevityPage, { metadata } from "../src/app/longevity/page";
import { getSitePage } from "../src/lib/site-content";

const page = getSitePage("longevity");

describe("longevity route", () => {
  it("exports a function component that renders the story in a main with an h1", () => {
    expect(typeof LongevityPage).toBe("function");
    const html = renderToStaticMarkup(<LongevityPage />);
    expect(html).toContain('<main id="main-content">');
    expect(html).toContain(`<h1>${page.heading}</h1>`);
    expect(html).toContain(`<p>${page.navLabel}</p>`);
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
    expect(text).not.toMatch(/some researchers/i);
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
