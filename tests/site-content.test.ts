import { describe, expect, it } from "vitest";
import {
  getSitePage,
  sitePages,
  type SitePage,
  type SitePageId,
} from "../src/lib/site-content";

const expectedPageIds: readonly SitePageId[] = [
  "home",
  "how-ai-helps",
  "cancer",
  "diseases",
  "longevity",
];

const expectedPagePaths: readonly string[] = [
  "/",
  "/how-ai-helps",
  "/cancer",
  "/diseases",
  "/longevity",
];

const kebabCase = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Flatten every piece of readable copy on a page into one string. */
function pageCopy(page: SitePage): string {
  return [
    page.title,
    page.description,
    page.heading,
    page.summary,
    ...page.sections.flatMap((section) => [section.heading, ...section.paragraphs]),
    page.disclaimer,
  ].join(" ");
}

describe("site-content", () => {
  it("exports the five pages in order with their ids and paths", () => {
    expect(sitePages.map((page) => page.id)).toEqual([...expectedPageIds]);
    expect(sitePages.map((page) => page.path)).toEqual([...expectedPagePaths]);
  });

  it("gives every page a full shape: copy, at least one section, and at least one image", () => {
    for (const page of sitePages) {
      expect(page.navLabel.length).toBeGreaterThan(0);
      expect(page.title.length).toBeGreaterThan(0);
      expect(page.description.length).toBeGreaterThan(0);
      expect(page.heading.length).toBeGreaterThan(0);
      expect(page.summary.length).toBeGreaterThan(0);
      expect(page.sections.length).toBeGreaterThan(0);
      expect(page.images.length).toBeGreaterThan(0);
      for (const section of page.sections) {
        expect(kebabCase.test(section.id)).toBe(true);
        expect(section.heading.length).toBeGreaterThan(0);
        expect(section.paragraphs.length).toBeGreaterThan(0);
        for (const paragraph of section.paragraphs) {
          expect(paragraph.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("tells the cancer story and says AI is expected to help cure it", () => {
    const copy = pageCopy(getSitePage("cancer"));
    expect(copy).toMatch(/cancer/i);
    expect(copy).toMatch(/ai is expected to help/i);
    expect(copy).toMatch(/cure cancer/i);
  });

  it("states the expected lifespan range as an expectation, not a guarantee", () => {
    const copy = pageCopy(getSitePage("longevity"));
    expect(copy).toMatch(/110/);
    expect(copy).toMatch(/120/);
    expect(copy).toMatch(/some researchers expect/i);
    expect(copy).toMatch(/not a guaranteed forecast/i);
  });

  it("keeps every page clearly an educational demo, not medical advice", () => {
    for (const page of sitePages) {
      expect(page.disclaimer.length).toBeGreaterThan(0);
      expect(page.disclaimer).toMatch(/not medical advice/i);
    }
  });

  it("gives every image a descriptive alt, a public src, and positive dimensions", () => {
    for (const page of sitePages) {
      for (const image of page.images) {
        expect(kebabCase.test(image.id)).toBe(true);
        expect(image.src).toMatch(/^\//);
        expect(image.alt.length).toBeGreaterThan(0);
        expect(Number.isInteger(image.width)).toBe(true);
        expect(image.width).toBeGreaterThan(0);
        expect(Number.isInteger(image.height)).toBe(true);
        expect(image.height).toBeGreaterThan(0);
      }
    }
  });

  it("finds the matching page for every id without throwing", () => {
    for (const id of expectedPageIds) {
      expect(() => getSitePage(id)).not.toThrow();
      expect(getSitePage(id).id).toBe(id);
      expect(getSitePage(id)).toBe(sitePages.find((page) => page.id === id));
    }
  });
});
