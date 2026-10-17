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

  it("states the expected 110-120 year average lifespan", () => {
    const html = renderToStaticMarkup(<LongevityPage />);
    expect(html).toMatch(/110/);
    expect(html).toMatch(/120/);
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
