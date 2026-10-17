/**
 * Source-level WCAG 2.2 Level AA essentials for the public pages.
 *
 * The milestone reviewer must be able to confirm the AA essentials from the
 * project source alone. This test renders the existing components (SiteHeader
 * plus each story route's default component) with renderToStaticMarkup, reads
 * the route metadata and globals.css, and asserts:
 *
 * 1. titles: the layout default title is "AI and longer lives" and its
 *    template contains that substring; the home route sets the absolute title
 *    "AI and longer lives"; the four story routes each export a distinct,
 *    non-empty title that also differs from home's;
 * 2. structure: header plus page renders exactly one <main
 *    id="main-content">, a skip link with the visible text "Skip to main
 *    content" targeting it, and one <nav aria-label="Main"> whose links
 *    include <a href="/cancer">Cancer</a> and every other sitePages path;
 * 3. images: every <img> has a non-empty alt that is not a filename;
 * 4. headings: each page has exactly one <h1>, and every <h2> appears only
 *    after that h1;
 * 5. styles: globals.css keeps #1a1a1a text on a #fffdfb background,
 *    underlined #0b3d91 links, and a :focus-visible outline of at least 2 px;
 * 6. privacy: the rendered markup and the CSS file contain no secret-like
 *    tokens, email addresses, or personal names.
 *
 * The test only reads and renders existing source; it does not change page
 * behaviour, and no check is skipped or disabled.
 */
import { readFileSync } from "node:fs";
import type { Metadata } from "next";
import { createElement, Fragment, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import * as cancerRoute from "../src/app/cancer/page";
import * as diseasesRoute from "../src/app/diseases/page";
import * as homeRoute from "../src/app/page";
import * as howAiHelpsRoute from "../src/app/how-ai-helps/page";
import * as longevityRoute from "../src/app/longevity/page";
import * as rootLayout from "../src/app/layout";
import SiteHeader from "../src/components/site-header";
import { sitePages, type SitePageId } from "../src/lib/site-content";

const siteName = "AI and longer lives";

/** The single <main> landmark every page renders (skip-link target). */
const mainOpen = '<main id="main-content">';

/** A story route module: its default page component and its metadata. */
interface StoryRouteModule {
  readonly default: () => ReactNode;
  readonly metadata: Metadata;
}

/** Every public route, in reading order, with its page module. */
const storyRoutes: ReadonlyArray<readonly [SitePageId, StoryRouteModule]> = [
  ["home", homeRoute],
  ["how-ai-helps", howAiHelpsRoute],
  ["cancer", cancerRoute],
  ["diseases", diseasesRoute],
  ["longevity", longevityRoute],
];

/** The title a route module's metadata resolves to, or "" when it has none. */
function resolvedTitle(metadata: Metadata): string {
  const { title } = metadata;
  if (typeof title === "string") {
    return title;
  }
  if (title === null || title === undefined) {
    return "";
  }
  if ("absolute" in title && title.absolute) {
    return title.absolute;
  }
  if ("default" in title && title.default) {
    return title.default;
  }
  return "";
}

/** Render the shared header plus one story page's default component. */
function renderPageWithHeader(PageComponent: () => ReactNode): string {
  return renderToStaticMarkup(
    createElement(
      Fragment,
      null,
      createElement(SiteHeader),
      createElement(PageComponent),
    ),
  );
}

/** The rendered header-plus-page markup of every public route. */
function allRenderedMarkup(): string {
  return storyRoutes
    .map(([, route]) => renderPageWithHeader(route.default))
    .join("\n");
}

/** The <img> tags in a rendered page, with their src and alt attributes. */
function imageTags(markup: string): Array<{ src: string; alt: string }> {
  const tags = markup.match(/<img\b[^>]*>/g) ?? [];
  return tags.map((tag) => ({
    src: tag.match(/src="([^"]*)"/)?.[1] ?? "",
    alt: tag.match(/\balt="([^"]*)"/)?.[1] ?? "",
  }));
}

/** True when alt text is a file path or filename rather than a description. */
function looksLikeFilename(text: string): boolean {
  if (text.includes("/")) {
    return true;
  }
  if (/\.[A-Za-z0-9]{2,5}$/.test(text)) {
    return true;
  }
  if (/\b\d{2,6}x\d{2,6}\b/i.test(text)) {
    return true;
  }
  return false;
}

const globalCss = readFileSync("src/app/globals.css", "utf8");

/** The declaration body of the first flat CSS rule with the given selector. */
function cssRule(css: string, selector: string): string {
  const normalized = css.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\s+/g, " ");
  const start = normalized.indexOf(`${selector} {`);
  if (start === -1) {
    return "";
  }
  const open = normalized.indexOf("{", start);
  const close = normalized.indexOf("}", open);
  if (open === -1 || close === -1) {
    return "";
  }
  return normalized.slice(open + 1, close);
}

/** Patterns the public pages must not contain: secrets, emails, personal names. */
const forbiddenPatterns: ReadonlyArray<{ name: string; pattern: RegExp }> = [
  {
    name: "email address",
    pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
  },
  {
    name: "secret-like credential keyword or token",
    pattern:
      /\b(api[-_ ]?keys?|secret[-_ ]?keys?|access[-_ ]?tokens?|auth[-_ ]?tokens?|passwords?|credentials|bearer\s+[A-Za-z0-9+/=.-]{8,})\b/i,
  },
  {
    name: "provider key prefix",
    pattern: /\b(sk|pk|ghp|gho|github_pat|xox[baprs]|AKIA|AIza)[_-][A-Za-z0-9_-]{8,}\b/,
  },
  {
    name: "PEM private key block",
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  },
  {
    name: "personal name with title",
    pattern: /\b(?:Dr|Prof|Mr|Mrs|Ms)\.?\s+[A-Z][a-z]+\b/,
  },
];

describe("WCAG 2.2 AA essentials from source", () => {
  describe("page titles", () => {
    it("gives the layout the default title and a template that keeps it", () => {
      const layoutTitle = rootLayout.metadata.title;
      expect(layoutTitle).toBeTypeOf("object");
      if (layoutTitle === null || typeof layoutTitle !== "object") {
        throw new Error("layout metadata.title must be an object");
      }
      expect("default" in layoutTitle).toBe(true);
      expect("template" in layoutTitle).toBe(true);
      if (!("default" in layoutTitle) || !("template" in layoutTitle)) {
        throw new Error("layout metadata.title must define default and template");
      }
      expect(layoutTitle.default).toBe(siteName);
      expect(layoutTitle.template).toContain(siteName);
    });

    it("sets the home route title to the absolute site name", () => {
      expect(homeRoute.metadata.title).toEqual({ absolute: siteName });
    });

    it("gives the four story routes distinct non-empty titles that differ from home", () => {
      const storyTitles = storyRoutes
        .filter(([id]) => id !== "home")
        .map(([, route]) => resolvedTitle(route.metadata));

      expect(storyTitles).toHaveLength(4);
      for (const title of storyTitles) {
        expect(title.length).toBeGreaterThan(0);
        expect(title).not.toBe(siteName);
      }
      expect(new Set(storyTitles).size).toBe(storyTitles.length);
    });
  });

  describe("landmarks and navigation", () => {
    it("renders exactly one main landmark, a skip link, and labeled nav per page", () => {
      for (const [, route] of storyRoutes) {
        const html = renderPageWithHeader(route.default);

        // One main landmark, and it is the skip-link target.
        expect(html.match(/<main\b/g)).toHaveLength(1);
        expect(html).toContain(mainOpen);

        // Skip link with visible text pointing at the main landmark.
        expect(html).toContain(
          '<a class="skip-link" href="#main-content">Skip to main content</a>',
        );

        // One navigation, labeled for screen readers, linking every route.
        expect(html.match(/<nav\b/g)).toHaveLength(1);
        expect(html).toContain('<nav aria-label="Main">');
        expect(html).toContain('<a href="/cancer">Cancer</a>');
        for (const page of sitePages) {
          expect(html).toContain(`<a href="${page.path}">${page.navLabel}</a>`);
        }
      }
    });
  });

  describe("image alternative text", () => {
    it("gives every image a non-empty alt that is not a filename", () => {
      for (const [, route] of storyRoutes) {
        const html = renderToStaticMarkup(createElement(route.default));
        const images = imageTags(html);

        expect(images.length).toBeGreaterThan(0);
        for (const image of images) {
          expect(image.src).toMatch(/^\/images\/[a-z0-9-]+\.svg$/);
          expect(image.alt.length).toBeGreaterThan(0);
          expect(image.alt.trim().length).toBeGreaterThan(0);
          expect(looksLikeFilename(image.alt)).toBe(false);
        }
      }
    });
  });

  describe("heading structure", () => {
    it("uses exactly one h1 per page and only h2 sections after it", () => {
      for (const [, route] of storyRoutes) {
        const html = renderToStaticMarkup(createElement(route.default));

        const h1Count = html.match(/<h1[\s>]/g)?.length ?? 0;
        expect(h1Count).toBe(1);
        const h1Index = html.indexOf("<h1");
        expect(h1Index).toBeGreaterThan(-1);

        const h2Indexes: number[] = [];
        for (const match of html.matchAll(/<h2[\s>]/g)) {
          h2Indexes.push(match.index ?? -1);
        }
        expect(h2Indexes.length).toBeGreaterThan(0);
        for (const index of h2Indexes) {
          expect(index).toBeGreaterThan(h1Index);
        }
      }
    });
  });

  describe("contrast and keyboard focus", () => {
    it("keeps the AA contrast pair on the page background and text", () => {
      const body = cssRule(globalCss, "body");
      expect(body).toContain("background-color: #fffdfb");
      expect(body).toContain("color: #1a1a1a");
    });

    it("underlines links in #0b3d91 so colour is never the only cue", () => {
      const link = cssRule(globalCss, "a");
      expect(link).toContain("color: #0b3d91");
      expect(link).toContain("text-decoration: underline");
    });

    it("keeps a visible keyboard focus outline of at least 2 px", () => {
      const focus = cssRule(globalCss, ":focus-visible");
      const outline = focus.match(
        /outline:\s*(\d+(?:\.\d+)?)px\s+solid\s+#0b3d91/i,
      );
      if (outline === null) {
        throw new Error(":focus-visible rule does not set a solid #0b3d91 outline");
      }
      const widthPx = Number(outline[1]);
      expect(Number.isFinite(widthPx)).toBe(true);
      expect(widthPx).toBeGreaterThanOrEqual(2);
    });
  });

  describe("no secrets or personal data", () => {
    it("keeps the rendered markup free of secret tokens, emails, and names", () => {
      const html = allRenderedMarkup();
      for (const { name, pattern } of forbiddenPatterns) {
        expect(html, `rendered markup must contain no ${name}`).not.toMatch(
          pattern,
        );
      }
    });

    it("keeps globals.css free of secret tokens, emails, and names", () => {
      for (const { name, pattern } of forbiddenPatterns) {
        expect(globalCss, `globals.css must contain no ${name}`).not.toMatch(
          pattern,
        );
      }
    });
  });
});
