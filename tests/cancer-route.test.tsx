import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CancerPage, { metadata } from "../src/app/cancer/page";
import { getSitePage } from "../src/lib/site-content";

const page = getSitePage("cancer");

describe("cancer route", () => {
  it("exports a function component that renders the story in a main with an h1", () => {
    expect(typeof CancerPage).toBe("function");
    const html = renderToStaticMarkup(<CancerPage />);
    expect(html).toContain('<main id="main-content">');
    expect(html).toContain(`<h1>${page.heading}</h1>`);
    expect(html).toContain(`<p>${page.navLabel}</p>`);
  });

  it("tells the cancer story with AI in the body text", () => {
    const html = renderToStaticMarkup(<CancerPage />);
    expect(html).toContain(page.navLabel);
    expect(html).toMatch(/AI/);
  });

  it("shows every local image with its descriptive alternative text", () => {
    const html = renderToStaticMarkup(<CancerPage />);
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
