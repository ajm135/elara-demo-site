import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import StoryPage from "../src/components/story-page";
import { sitePages, type SitePage } from "../src/lib/site-content";

const mainOpen = '<main id="main-content">';

/** Escape text the same way React escapes it in server-rendered HTML. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/** The inner HTML of the single rendered <main>. */
function mainHtml(page: SitePage): string {
  const html = renderToStaticMarkup(<StoryPage page={page} />);
  return html.slice(
    html.indexOf(mainOpen) + mainOpen.length,
    html.indexOf("</main>"),
  );
}

describe("story page", () => {
  it("renders exactly one main with id main-content and exactly one h1", () => {
    for (const page of sitePages) {
      const html = renderToStaticMarkup(<StoryPage page={page} />);
      expect(html.match(/<main/g)).toHaveLength(1);
      expect(html).toContain(mainOpen);
      expect(html.match(/<h1>/g)).toHaveLength(1);
      expect(html).toContain(`<h1>${escapeHtml(page.heading)}</h1>`);
    }
  });

  it("starts main with the navigation label paragraph, then the summary paragraph", () => {
    for (const page of sitePages) {
      const body = mainHtml(page);
      expect(body.startsWith(`<p>${escapeHtml(page.navLabel)}</p>`)).toBe(true);
      expect(body).toContain(`<p>${escapeHtml(page.summary)}</p>`);
    }
  });

  it("renders one native img per image reference, in order, with non-empty alt and dimensions", () => {
    for (const page of sitePages) {
      const html = renderToStaticMarkup(<StoryPage page={page} />);
      const positions = page.images.map((image) => {
        const start = html.indexOf(`<img src="${image.src}"`);
        expect(start).toBeGreaterThan(-1);
        expect(html).toContain(`alt="${escapeHtml(image.alt)}"`);
        expect(html).toContain(`width="${image.width}"`);
        expect(html).toContain(`height="${image.height}"`);
        return start;
      });
      const inOrder = positions.every(
        (position, index) => index === 0 || position > positions[index - 1],
      );
      expect(inOrder).toBe(true);
      expect(html).not.toContain('alt=""');
    }
  });

  it("renders one section per section with its h2 heading and a p per paragraph", () => {
    for (const page of sitePages) {
      const html = renderToStaticMarkup(<StoryPage page={page} />);
      for (const section of page.sections) {
        expect(html).toContain(`<h2>${escapeHtml(section.heading)}</h2>`);
        for (const paragraph of section.paragraphs) {
          expect(html).toContain(`<p>${escapeHtml(paragraph)}</p>`);
        }
      }
    }
  });

  it("ends main with the disclaimer paragraph and adds no navigation inside main", () => {
    for (const page of sitePages) {
      const body = mainHtml(page);
      expect(body.endsWith(`<p>${escapeHtml(page.disclaimer)}</p>`)).toBe(true);
      expect(body).not.toContain("<nav");
    }
  });
});
