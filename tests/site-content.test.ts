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

/**
 * The obsolete forecasts and unverified attributions removed by the
 * October 18 review. None of them may appear in shipped copy: the
 * balanced replacement text is asserted separately, and these patterns
 * must stay absent.
 */
const obsoletePatterns: ReadonlyArray<{ name: string; pattern: RegExp }> = [
  { name: "cure-for-cancer forecast", pattern: /cure cancer/i },
  { name: "eventual-cure forecast", pattern: /eventually cure/i },
  { name: "110-120 population-average forecast (110)", pattern: /110/ },
  { name: "110-120 population-average forecast (120)", pattern: /120/ },
  { name: "couple-of-generations forecast", pattern: /couple of generations/i },
  {
    name: "unverified 'some researchers' attribution",
    pattern: /some researchers/i,
  },
  {
    name: "unverified 'many researchers' attribution",
    pattern: /many researchers/i,
  },
];

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

  it("tells the cancer story with AI help, without promising a cure", () => {
    const copy = pageCopy(getSitePage("cancer"));
    expect(copy).toMatch(/cancer/i);
    expect(copy).toMatch(/ai is expected to help/i);
    expect(copy).toMatch(/clinical use/i);
    expect(copy).toMatch(/experimental research/i);
    for (const { name, pattern } of obsoletePatterns) {
      expect(copy, `cancer page must not contain the ${name}`).not.toMatch(
        pattern,
      );
    }
  });

  it("explains life expectancy, maximum lifespan, and healthy lifespan without a future average", () => {
    const copy = pageCopy(getSitePage("longevity"));
    expect(copy).toMatch(/life expectancy/i);
    expect(copy).toMatch(/maximum lifespan/i);
    expect(copy).toMatch(/healthy lifespan/i);
    expect(copy).toMatch(/not a forecast/i);
    for (const { name, pattern } of obsoletePatterns) {
      expect(copy, `longevity page must not contain the ${name}`).not.toMatch(
        pattern,
      );
    }
  });

  it("keeps every page free of the obsolete forecasts and unverified attributions", () => {
    for (const page of sitePages) {
      const copy = pageCopy(page);
      for (const { name, pattern } of obsoletePatterns) {
        expect(copy, `${page.id} must not contain the ${name}`).not.toMatch(
          pattern,
        );
      }
    }
  });

  it("distinguishes clinical use, experimental research, and speculation in the medical stories", () => {
    for (const pageId of ["how-ai-helps", "cancer", "diseases"] as const) {
      const copy = pageCopy(getSitePage(pageId));
      expect(copy, `${pageId}: clinical use`).toMatch(/clinical use/i);
      expect(copy, `${pageId}: experimental research`).toMatch(
        /experimental research/i,
      );
      expect(copy, `${pageId}: speculation`).toMatch(/speculation/i);
    }
  });

  it("explains the trade-offs behind earlier detection and faster treatment", () => {
    for (const pageId of ["how-ai-helps", "cancer", "diseases"] as const) {
      const copy = pageCopy(getSitePage(pageId));
      expect(copy, `${pageId}: false positives`).toMatch(/false positives/i);
      expect(copy, `${pageId}: missed diagnoses`).toMatch(/missed/i);
      expect(copy, `${pageId}: uneven performance`).toMatch(
        /(less well|not all perform the same)/i,
      );
      expect(copy, `${pageId}: clinician oversight`).toMatch(/clinician/i);
      if (pageId === "how-ai-helps" || pageId === "cancer") {
        expect(copy, `${pageId}: overdiagnosis`).toMatch(/overdiagnosis/i);
      }
    }
  });

  it("says an approved device is not universal availability or approval for every use", () => {
    expect(pageCopy(getSitePage("how-ai-helps"))).toMatch(
      /approval for one specific use is not approval for every use/i,
    );
    expect(pageCopy(getSitePage("cancer"))).toMatch(
      /not the same as approval for everything the device could do/i,
    );
  });

  it("keeps every page clearly an educational demo, not medical advice, not a diagnosis, and not a guarantee", () => {
    for (const page of sitePages) {
      expect(page.disclaimer.length).toBeGreaterThan(0);
      expect(page.disclaimer).toMatch(/not medical advice/i);
      expect(page.disclaimer).toMatch(/not a diagnosis/i);
      expect(page.disclaimer).toMatch(/not a guarantee/i);
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
