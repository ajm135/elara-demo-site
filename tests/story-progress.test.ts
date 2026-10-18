/**
 * Tests for the reading-progress model in src/lib/site-content.ts:
 * the 1-based storyIndex, the exact "Story N of 5" position label,
 * the nextStory helper with its null ending on the last story, and the
 * page-level reviewedOn inspection date.
 *
 * All three helpers are pure, so the tests exercise them directly with no
 * rendering and no browser.
 */
import { describe, expect, it } from "vitest";
import {
  getSitePage,
  isValidIsoDate,
  nextStory,
  sitePageForPath,
  sitePages,
  storyIndex,
  storyPositionLabel,
  type SitePageId,
} from "../src/lib/site-content";

const readingOrder: readonly SitePageId[] = [
  "home",
  "how-ai-helps",
  "cancer",
  "diseases",
  "longevity",
];

describe("storyIndex", () => {
  it("returns the 1-based position of every page in sitePages order", () => {
    expect(storyIndex("home")).toBe(1);
    expect(storyIndex("how-ai-helps")).toBe(2);
    expect(storyIndex("cancer")).toBe(3);
    expect(storyIndex("diseases")).toBe(4);
    expect(storyIndex("longevity")).toBe(5);
  });

  it("agrees with the sitePages order for every page", () => {
    sitePages.forEach((page, position) => {
      expect(storyIndex(page.id)).toBe(position + 1);
    });
  });

  it("throws for ids that are not part of the content model", () => {
    expect(() => storyIndex("nope" as SitePageId)).toThrow();
  });
});

describe("storyPositionLabel", () => {
  it("returns exactly 'Story N of 5' for every page", () => {
    expect(storyPositionLabel("home")).toBe("Story 1 of 5");
    expect(storyPositionLabel("how-ai-helps")).toBe("Story 2 of 5");
    expect(storyPositionLabel("cancer")).toBe("Story 3 of 5");
    expect(storyPositionLabel("diseases")).toBe("Story 4 of 5");
    expect(storyPositionLabel("longevity")).toBe("Story 5 of 5");
  });

  it("counts over the whole sequence, never a hard-coded total", () => {
    for (const pageId of readingOrder) {
      const label = storyPositionLabel(pageId);
      expect(label).toBe(`Story ${storyIndex(pageId)} of ${sitePages.length}`);
      expect(label).toMatch(/^Story \d+ of \d+$/);
    }
  });

  it("throws for ids that are not part of the content model", () => {
    expect(() => storyPositionLabel("nope" as SitePageId)).toThrow();
  });
});

describe("nextStory", () => {
  it("returns the following page for every story except the last", () => {
    expect(nextStory("home")).toBe(sitePages[1]);
    expect(nextStory("how-ai-helps")).toBe(sitePages[2]);
    expect(nextStory("cancer")).toBe(sitePages[3]);
    expect(nextStory("diseases")).toBe(sitePages[4]);
  });

  it("returns null on the final story, where the sequence ends", () => {
    expect(nextStory("longevity")).toBeNull();
  });

  it("never returns the page itself or an out-of-order page", () => {
    for (const pageId of readingOrder) {
      const next = nextStory(pageId);
      if (next === null) {
        continue;
      }
      expect(next.id).not.toBe(pageId);
      expect(storyIndex(next.id)).toBe(storyIndex(pageId) + 1);
      expect(getSitePage(next.id)).toBe(next);
    }
  });

  it("throws for ids that are not part of the content model", () => {
    expect(() => nextStory("nope" as SitePageId)).toThrow();
  });
});

describe("sitePageForPath", () => {
  it("maps every sitePages path to that exact page", () => {
    for (const page of sitePages) {
      expect(sitePageForPath(page.path)).toBe(page);
    }
  });

  it("returns null for paths that are not one of the five story routes", () => {
    expect(sitePageForPath("")).toBeNull();
    expect(sitePageForPath("/unknown")).toBeNull();
    expect(sitePageForPath("/cancer/")).toBeNull();
    expect(sitePageForPath("/how-ai-helps?next=1")).toBeNull();
  });
});

describe("page review dates", () => {
  it("carries the real claim-register inspection date 2026-10-18 on every page", () => {
    for (const page of sitePages) {
      expect(page.reviewedOn, `${page.id} must carry a review date`).toBe(
        "2026-10-18",
      );
    }
  });

  it("keeps every review date a real ISO date", () => {
    for (const page of sitePages) {
      if (page.reviewedOn !== undefined) {
        expect(isValidIsoDate(page.reviewedOn)).toBe(true);
      }
    }
  });
});
