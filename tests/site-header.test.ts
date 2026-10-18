/**
 * The shared header, rendered server-side with renderToStaticMarkup.
 *
 * Two states are covered, both without a browser or any request mocking:
 *
 * 1. the header on its own (no current path, the source-level shape): the
 *    skip link is the first anchor and targets main#main-content, the
 *    five story links sit in reading order inside the one
 *    nav[aria-label="Main"], and nothing is marked current — no
 *    aria-current, no progress cluster;
 * 2. the header rendered with an explicit current path — the same
 *    `currentPath` prop every route passes in production, so the render
 *    is the route's real server-rendered state: exactly one
 *    a[aria-current="page"], on the link the `sitePageForPath` helper
 *    resolves for that path, the exact "Story N of 5" position, and the
 *    next-story cue on stories 1 to 4 (never ahead of the five story
 *    links in keyboard order) or the ending state on story 5.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SiteHeader from "../src/components/site-header";
import {
  nextStory,
  sitePageForPath,
  sitePages,
  storyPositionLabel,
} from "../src/lib/site-content";

const expectedNavPaths = [
  "/",
  "/how-ai-helps",
  "/cancer",
  "/diseases",
  "/longevity",
] as const;

const skipLink =
  '<a class="skip-link" href="#main-content">Skip to main content</a>';

/** The anchors inside the labeled main navigation, in document order. */
function navAnchors(html: string): string[] {
  const start = html.indexOf('<nav aria-label="Main">');
  const end = html.indexOf("</nav>", start) + "</nav>".length;
  if (start === -1 || end === 0) {
    return [];
  }
  return html
    .slice(start, end)
    .match(/<a\b[^>]*>[^<]*<\/a>/g) ?? [];
}

describe("site header", () => {
  const html = renderToStaticMarkup(createElement(SiteHeader));

  it("offers a skip link that jumps to the main content", () => {
    expect(html).toContain('href="#main-content"');
    expect(html).toContain("Skip to main content");
  });

  it("puts the skip link first in keyboard order", () => {
    expect(html).toContain(skipLink);
    expect(html.indexOf("<a")).toBe(html.indexOf(skipLink));
  });

  it("links every story page from the main navigation", () => {
    for (const path of expectedNavPaths) {
      expect(html).toContain(`<a href="${path}"`);
    }
  });

  it("lists the five story links in reading order inside the Main navigation", () => {
    expect(html).toContain('<nav aria-label="Main">');
    const anchors = navAnchors(html);
    expect(anchors).toHaveLength(5);
    anchors.forEach((tag, index) => {
      expect(tag).toContain(`href="${sitePages[index].path}"`);
      expect(tag).toContain(sitePages[index].navLabel);
    });
  });

  it("labels the cancer and other-diseases links visibly", () => {
    expect(html).toContain('<a href="/cancer">Cancer</a>');
    expect(html).toContain('<a href="/diseases">Other diseases</a>');
  });

  it("marks nothing current and shows no progress cluster without a path", () => {
    expect(html).not.toContain("aria-current");
    expect(html).not.toContain("progress-cluster");
    expect(html).not.toContain("End of the stories");
  });
});

describe("site header current-page state", () => {
  for (const page of sitePages) {
    // Rendered with the same currentPath prop the route passes in
    // production: the server-rendered state of this route's header.
    const html = renderToStaticMarkup(
      createElement(SiteHeader, { currentPath: page.path }),
    );
    const next = nextStory(page.id);

    it(`marks exactly the ${page.navLabel} link current for ${page.path}`, () => {
      expect(html.match(/aria-current="page"/g)).toHaveLength(1);
      expect(html).toContain(
        `<a aria-current="page" href="${page.path}">${page.navLabel}</a>`,
      );
      // The path helper — the exported server half of the detection —
      // agrees with the rendered highlight.
      expect(sitePageForPath(page.path)).toBe(page);
    });

    it(`shows "${storyPositionLabel(page.id)}" and the ${
      next === null ? "ending state" : "next-story cue"
    } on ${page.path}`, () => {
      expect(html).toContain(storyPositionLabel(page.id));

      if (next !== null) {
        expect(html).toContain(
          `Next story: <a href="${next.path}">${next.navLabel}</a>`,
        );
        expect(html).not.toContain("End of the stories");
        // The cue link never sits ahead of the five story links.
        expect(html.indexOf("</nav>")).toBeLessThan(
          html.indexOf("next-story-cue"),
        );
      } else {
        expect(html).not.toContain("next-story-cue");
        expect(html).toContain(
          '<span class="progress-ending">End of the stories</span>',
        );
      }
    });
  }
});
