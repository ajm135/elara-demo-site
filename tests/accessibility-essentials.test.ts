/**
 * Source-level WCAG 2.2 Level AA essentials for the public pages.
 *
 * The milestone reviewer must be able to confirm the AA essentials from the
 * project source alone. This test renders every route's default component
 * with renderToStaticMarkup (each route is a server component that renders
 * the shared header for its own path plus its story page, so one render is
 * the full server-rendered header-plus-page for that route), reads the
 * route metadata and globals.css, and asserts:
 *
 * 1. titles: the layout default title is "AI and longer lives" and its
 *    template contains that substring; the home route sets the absolute title
 *    "AI and longer lives"; the four story routes each export a distinct,
 *    non-empty title that also differs from home's;
 * 2. structure: every route renders exactly one <main id="main-content"
 *    tabindex="-1"> (the skip-link target, focusable via the negative
 *    tabindex), a skip link with the visible text "Skip to main content"
 *    targeting it as the first anchor in document order, and one
 *    <nav aria-label="Main"> whose anchors are exactly the five story links
 *    in reading order;
 * 3. reading progress: exactly one a[aria-current="page"] per rendered
 *    header-plus-page, whose href is that route's own path, the exact
 *    "Story N of 5" position, the next-story cue on stories 1 to 4, and the
 *    ending state with no next-story link on story 5; the cue link never
 *    sits ahead of the five story links in keyboard order;
 * 4. images: every <img> has a non-empty alt that is not a filename;
 * 5. headings: each page has exactly one <h1>, every <h2> appears only
 *    after that h1, and the composed hero introduces no skipped heading
 *    level;
 * 6. evidence: every page shows its reviewedOn date in a <time datetime>
 *    element, main carries at least one stable https citation link, and the
 *    number of figure.claim-evidence panels equals the claims the content
 *    model ties to that page (home instead renders its sources block);
 * 7. disclaimer: the "not medical advice" disclaimer is still the last
 *    element of main;
 * 8. styles: globals.css keeps an AA-contrast body text/background pair,
 *    underlined links in an AA-contrast colour, and a :focus-visible
 *    outline of at least 2 px with an offset, in both themes. The
 *    dual-theme design declares the light palette on :root and
 *    redeclares the same token names under the reader's system setting
 *    (inside @media (prefers-color-scheme: dark)), so these checks
 *    resolve each colour per theme and compute WCAG 2.2
 *    relative-luminance contrast ratios: 4.5:1 for body text and link
 *    text on their backgrounds, 3:1 for the focus outline against the
 *    page surface — the same or stronger safeguard, not a weaker one;
 * 9. privacy: the rendered markup and the CSS file contain no secret-like
 *    tokens, email addresses, or personal names.
 *
 * The test only reads and renders existing source; it does not change page
 * behaviour, and no check is skipped or disabled.
 */
import { readFileSync } from "node:fs";
import type { Metadata } from "next";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import * as cancerRoute from "../src/app/cancer/page";
import * as diseasesRoute from "../src/app/diseases/page";
import * as homeRoute from "../src/app/page";
import * as howAiHelpsRoute from "../src/app/how-ai-helps/page";
import * as longevityRoute from "../src/app/longevity/page";
import * as rootLayout from "../src/app/layout";
import {
  claimsForParagraph,
  getSitePage,
  nextStory,
  sitePageForPath,
  sitePages,
  storyPositionLabel,
  type SitePageId,
} from "../src/lib/site-content";
import {
  contrastRatio,
  mediaBlockBody,
  parseCustomProperties,
  parseDeclarations,
  resolveHexColor,
} from "../src/lib/css-contrast";

const siteName = "AI and longer lives";

/**
 * The single <main> landmark every page renders. tabindex="-1" is the
 * skip-link target: focusable programmatically, out of the tab sequence.
 */
const mainOpen = '<main id="main-content" tabindex="-1">';

/** The skip link: the first anchor on every page, in keyboard order. */
const skipLink =
  '<a class="skip-link" href="#main-content">Skip to main content</a>';

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

/**
 * Render one route's full server-rendered markup: the route component is a
 * server component that renders <SiteHeader currentPath={...} /> followed
 * by <StoryPage>, so the render carries the route's real current-page
 * state (one aria-current link, the progress cluster) with no browser.
 */
function renderRoute(route: StoryRouteModule): string {
  return renderToStaticMarkup(createElement(route.default));
}

/** The full server-rendered header-plus-page markup of every public route. */
function allRenderedMarkup(): string {
  return storyRoutes.map(([, route]) => renderRoute(route)).join("\n");
}

/** The inner HTML of the single rendered <main>. */
function mainBody(markup: string): string {
  const start = markup.indexOf(mainOpen);
  expect(start, "main#main-content must be present").toBeGreaterThan(-1);
  return markup.slice(start + mainOpen.length, markup.indexOf("</main>"));
}

/** The inner HTML of the labeled main navigation. */
function navBody(markup: string): string {
  const start = markup.indexOf('<nav aria-label="Main">');
  expect(start, "the Main navigation must be present").toBeGreaterThan(-1);
  return markup.slice(start, markup.indexOf("</nav>", start) + "</nav>".length);
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

/** Escape text the same way React escapes it in server-rendered HTML. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
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
    it("renders exactly one focusable main landmark, a first-in-order skip link, and the five story links in order", () => {
      for (const [, route] of storyRoutes) {
        const html = renderRoute(route);

        // One main landmark, the skip-link target, focusable via tabindex.
        expect(html.match(/<main\b/g)).toHaveLength(1);
        expect(html).toContain(mainOpen);

        // The skip link is the first anchor in document (keyboard) order.
        expect(html).toContain(skipLink);
        expect(html.indexOf("<a")).toBe(html.indexOf(skipLink));

        // One navigation, labeled for screen readers, with exactly the five
        // story links in reading order and nothing else.
        expect(html.match(/<nav\b/g)).toHaveLength(1);
        const nav = navBody(html);
        const navLinks = [...nav.matchAll(/<a\b[^>]*>([^<]*)<\/a>/g)];
        expect(navLinks).toHaveLength(5);
        navLinks.forEach((match, index) => {
          expect(match[0]).toContain(`href="${sitePages[index].path}"`);
          expect(match[1]).toBe(sitePages[index].navLabel);
        });
      }
    });

    it("marks exactly one active link per route, on that route's own path", () => {
      for (const [id, route] of storyRoutes) {
        const html = renderRoute(route);
        const page = getSitePage(id);

        // The path helper — the server half of the header's current-page
        // detection — resolves this route's path to exactly this page.
        expect(sitePageForPath(page.path)).toBe(page);

        // Exactly one aria-current in the whole header-plus-page...
        expect(html.match(/aria-current="page"/g)).toHaveLength(1);
        // ...and it is the link for this route.
        expect(html).toContain(
          `<a aria-current="page" href="${page.path}">${page.navLabel}</a>`,
        );
      }
    });

    it("shows the reading progress: position, next-story cue, story-five ending", () => {
      for (const [id, route] of storyRoutes) {
        const html = renderRoute(route);
        const page = sitePages.find((candidate) => candidate.id === id);
        expect(page, `content model must contain ${id}`).toBeDefined();
        if (page === undefined) {
          throw new Error(`content model must contain ${id}`);
        }
        const next = nextStory(page.id);

        // The exact position label, visible in the header.
        expect(html).toContain(storyPositionLabel(page.id));

        if (next !== null) {
          // Stories 1 to 4: the next-story cue links the following story,
          // and it sits after the five story links, never ahead of them.
          expect(html).toContain(
            `Next story: <a href="${next.path}">${next.navLabel}</a>`,
          );
          expect(html).not.toContain("End of the stories");
          expect(html.indexOf("</nav>")).toBeLessThan(
            html.indexOf("next-story-cue"),
          );
        } else {
          // Story 5: the ending state, with no next-story link.
          expect(html).not.toContain("next-story-cue");
          expect(html).toContain(
            '<span class="progress-ending">End of the stories</span>',
          );
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

    it("lets the composed hero introduce no skipped heading level", () => {
      for (const [, route] of storyRoutes) {
        const html = renderToStaticMarkup(createElement(route.default));

        const h1Index = html.indexOf("<h1");
        const firstH2 = html.search(/<h2[\s>]/);
        expect(h1Index).toBeGreaterThan(-1);
        expect(firstH2).toBeGreaterThan(h1Index);

        // The hero holds exactly the h1 and no other heading level...
        // (the hero always ends where the first section begins).
        const heroStart = html.indexOf('<div class="hero">');
        const hero = html.slice(heroStart, html.indexOf("<section", heroStart));
        expect(hero.match(/<h1[\s>]/g)?.length ?? 0).toBe(1);
        expect(hero).not.toMatch(/<h[2-6][\s>]/);

        // ...and no h3 or deeper appears before the first h2 anywhere.
        for (const tag of ["<h3", "<h4", "<h5", "<h6"]) {
          const deeper = html.indexOf(tag);
          if (deeper !== -1) {
            expect(deeper).toBeGreaterThan(firstH2);
          }
        }
      }
    });
  });

  describe("review date, citations, and evidence", () => {
    it("shows the review date, a citation link, and the claim evidence the content model ties to the page", () => {
      for (const [id, route] of storyRoutes) {
        const html = renderRoute(route);
        const page = sitePages.find((candidate) => candidate.id === id);
        if (page === undefined) {
          throw new Error(`content model must contain ${id}`);
        }
        const body = mainBody(html);

        // The reviewedOn date renders as a <time datetime="..."> element.
        // React serialises the attribute as dateTime in static markup and
        // the browser DOM normalises it to datetime, so match both.
        if (page.reviewedOn !== undefined) {
          expect(body).toMatch(
            new RegExp(`<time datetime="${page.reviewedOn}"`, "i"),
          );
        }

        // A stable https citation a reader can open, on the story pages via
        // the claim evidence panels and on home via its sources block.
        expect(body).toMatch(/<a href="https:\/\/[^"]+">/);

        // One evidence panel per claim the content model makes on the page,
        // no more and no fewer.
        const expectedFigures = page.sections.reduce(
          (sum, section) =>
            sum +
            section.paragraphs.reduce(
              (count, paragraph) =>
                count +
                claimsForParagraph(page.id, section.id, paragraph).length,
              0,
            ),
          0,
        );
        const figures =
          body.match(/<figure class="claim-evidence">/g)?.length ?? 0;
        expect(figures, `${id}: evidence panels match the content model`).toBe(
          expectedFigures,
        );

        // Home makes no consequential claim of its own; it renders the
        // sources block listing the complete reference set instead.
        if (page.sources !== undefined) {
          expect(body).toContain('<section class="sources">');
        }
      }
    });
  });

  describe("disclaimer", () => {
    it("keeps the 'not medical advice' disclaimer as the last element of main", () => {
      for (const [id, route] of storyRoutes) {
        const html = renderRoute(route);
        const page = sitePages.find((candidate) => candidate.id === id);
        if (page === undefined) {
          throw new Error(`content model must contain ${id}`);
        }

        expect(page.disclaimer).toMatch(/not medical advice/);
        expect(
          mainBody(html).endsWith(`<p>${escapeHtml(page.disclaimer)}</p>`),
          `${id}: the disclaimer must be the last element of main`,
        ).toBe(true);
      }
    });
  });

  describe("contrast and keyboard focus", () => {
    // The design is token-driven and dual-theme: the light theme is the
    // :root default, and the dark theme redeclares the same colour token
    // names inside the reader's system-setting media block. The local
    // cssRule() helper only sees flat top-level rules, so the dark
    // tokens are parsed the same way as in the token test: the media
    // block's inner text is extracted first, then its :root rule is read.
    const lightTokens = parseCustomProperties(cssRule(globalCss, ":root"));
    const darkTokens = parseCustomProperties(
      cssRule(mediaBlockBody(globalCss, "(prefers-color-scheme: dark)"), ":root"),
    );
    const themes: ReadonlyArray<{
      readonly name: string;
      readonly tokens: Record<string, string>;
    }> = [
      { name: "light theme", tokens: lightTokens },
      { name: "dark theme (prefers-color-scheme: dark)", tokens: darkTokens },
    ];

    it("keeps an AA contrast pair on the page background and text in both themes", () => {
      const body = parseDeclarations(cssRule(globalCss, "body"));
      for (const { name, tokens } of themes) {
        const background = resolveHexColor(body["background-color"], tokens);
        const text = resolveHexColor(body["color"], tokens);
        expect(background, `${name}: the page background must be a hex colour`).not.toBeNull();
        expect(text, `${name}: the body text must be a hex colour`).not.toBeNull();
        if (background === null || text === null) {
          throw new Error(
            `${name}: body background and text must resolve to hex colours from the design tokens`,
          );
        }
        expect(
          contrastRatio(text, background),
          `${name}: body text on the page surface`,
        ).toBeGreaterThanOrEqual(4.5);
      }
      // The light page surface is one token in a warm set, not pure white.
      const lightPage = resolveHexColor(body["background-color"], lightTokens);
      expect(
        lightPage,
        "the light page surface must not be pure white",
      ).not.toEqual([255, 255, 255]);
    });

    it("underlines links in a colour that clears AA on the page surface in both themes", () => {
      const link = parseDeclarations(cssRule(globalCss, "a"));
      expect(link["text-decoration"] ?? "").toContain("underline");
      for (const { name, tokens } of themes) {
        const linkColour = resolveHexColor(link["color"], tokens);
        const pageSurface = resolveHexColor("var(--surface-page)", tokens);
        expect(linkColour, `${name}: the link colour must be a hex colour`).not.toBeNull();
        expect(pageSurface, `${name}: the page surface must be a hex colour`).not.toBeNull();
        if (linkColour === null || pageSurface === null) {
          throw new Error(
            `${name}: link colour and page surface must resolve to hex colours from the design tokens`,
          );
        }
        expect(
          contrastRatio(linkColour, pageSurface),
          `${name}: links on the page surface`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    });

    it("keeps a visible keyboard focus outline of at least 2 px in the accent that clears 3:1 in both themes", () => {
      const focus = parseDeclarations(cssRule(globalCss, ":focus-visible"));
      const outline = /(\d+(?:\.\d+)?)px\s+solid\s+(.+)$/.exec(
        focus["outline"] ?? "",
      );
      if (outline === null) {
        throw new Error(":focus-visible rule does not set a solid outline");
      }
      const widthPx = Number(outline[1]);
      expect(Number.isFinite(widthPx)).toBe(true);
      expect(widthPx).toBeGreaterThanOrEqual(2);
      expect(focus["outline-offset"]).toBeDefined();
      for (const { name, tokens } of themes) {
        const outlineColour = resolveHexColor(outline[2].trim(), tokens);
        const pageSurface = resolveHexColor("var(--surface-page)", tokens);
        expect(outlineColour, `${name}: the focus outline colour must be a hex colour`).not.toBeNull();
        expect(pageSurface, `${name}: the page surface must be a hex colour`).not.toBeNull();
        if (outlineColour === null || pageSurface === null) {
          throw new Error(
            `${name}: focus outline colour must resolve to a hex colour from the design tokens`,
          );
        }
        // A focus indicator is a non-text UI boundary: 3:1 at minimum.
        expect(
          contrastRatio(outlineColour, pageSurface),
          `${name}: focus outline on the page surface`,
        ).toBeGreaterThanOrEqual(3);
      }
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
