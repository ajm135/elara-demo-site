import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import HowAiHelpsPage, { metadata } from "../src/app/how-ai-helps/page";
import { getSitePage } from "../src/lib/site-content";

const page = getSitePage("how-ai-helps");

describe("how-ai-helps route", () => {
  it("exports a function component that renders the story in a main with an h1", () => {
    expect(typeof HowAiHelpsPage).toBe("function");
    const html = renderToStaticMarkup(<HowAiHelpsPage />);
    expect(html).toContain('<main id="main-content">');
    expect(html).toContain(`<h1>${page.heading}</h1>`);
    expect(html).toContain(`<p>${page.navLabel}</p>`);
  });

  it("shows every local image with its descriptive alternative text", () => {
    const html = renderToStaticMarkup(<HowAiHelpsPage />);
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
