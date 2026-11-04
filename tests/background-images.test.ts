/**
 * The background-image contract (docs/adr/0009-background-images.md):
 * each of the five story routes opens on an original full-bleed local
 * background image — the transparent header sits on the hero picture and
 * main's first element .hero carries it — plus one later decorative
 * image band per page, all painted by CSS background-image in
 * src/app/globals.css from ten distinct hand-authored local SVGs under
 * public/images/, with the story's text, links, and progress chips on a
 * solid opaque scrim that meets the contrast floors in both system
 * themes.
 *
 * This file is node-only: it parses globals.css, reads the ten SVG
 * files, checks .gitignore, and renders the five route components to
 * static markup with react-dom/server. It never launches a browser.
 */
import { readFileSync, existsSync, statSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  cssRuleBody,
  mediaBlockBody,
  parseCustomProperties,
  parseDeclarations,
  parseHexColor,
  relativeLuminance,
  type Rgb,
} from "../src/lib/css-contrast";
import HomePage from "../src/app/page";
import HowAiHelpsPage from "../src/app/how-ai-helps/page";
import CancerPage from "../src/app/cancer/page";
import DiseasesPage from "../src/app/diseases/page";
import LongevityPage from "../src/app/longevity/page";
import {
  getSitePage,
  type SitePageId,
} from "../src/lib/site-content";

const globalsCss = readFileSync("src/app/globals.css", "utf8");
const cssNoComments = globalsCss.replace(/\/\*[\s\S]*?\*\//g, " ");

/* ------------------------------------------------------------------ */
/* Tokens for the scrim contrast checks, per theme.                   */
/* ------------------------------------------------------------------ */

const lightRootBody = cssRuleBody(globalsCss, ":root");
const lightTokens = parseCustomProperties(lightRootBody);
const darkMediaBody = mediaBlockBody(globalsCss, "(prefers-color-scheme: dark)");
const darkRootBody = cssRuleBody(darkMediaBody, ":root");
const darkTokens = parseCustomProperties(darkRootBody);

const themes: ReadonlyArray<{
  name: string;
  tokens: Record<string, string>;
  effective: Record<string, string>;
}> = [
  { name: "light", tokens: lightTokens, effective: lightTokens },
  {
    name: "dark",
    tokens: darkTokens,
    effective: { ...lightTokens, ...darkTokens },
  },
];

/**
 * Resolve a declaration value to a hex colour against a theme's
 * effective tokens: `var(--name)` (and chains of them) are substituted
 * before the hex is parsed, the way the browser computes custom
 * properties. Non-hex results (transparent, rgba, missing tokens) return
 * null so the caller can fail loudly instead of silently skipping.
 */
function resolveDeclarationHex(
  value: string,
  effective: Record<string, string>,
): Rgb | null {
  let current = value.trim();
  for (let depth = 0; depth < 5; depth += 1) {
    const match = /^var\(\s*(--[\w-]+)\s*\)$/.exec(current);
    if (match === null) {
      break;
    }
    const next = effective[match[1].slice(2)];
    if (next === undefined) {
      return null;
    }
    current = next.trim();
  }
  return parseHexColor(current);
}

/** Resolve --name of a theme to RGB, failing loudly when missing. */
function tokenRgb(name: string, effective: Record<string, string>): Rgb {
  const color = resolveDeclarationHex(
    `var(--${name})`,
    effective,
  );
  if (color === null) {
    throw new Error(
      `Token --${name} is missing or is not a hex colour in ${name}`,
    );
  }
  return color;
}

/* ------------------------------------------------------------------ */
/* The ten original background assets and the five story frames.      */
/* ------------------------------------------------------------------ */

const storyFrames = [
  ["home", "bg-home-hero.svg", "bg-home-band.svg"],
  ["how-ai-helps", "bg-how-ai-helps-hero.svg", "bg-how-ai-helps-band.svg"],
  ["cancer", "bg-cancer-hero.svg", "bg-cancer-band.svg"],
  ["diseases", "bg-diseases-hero.svg", "bg-diseases-band.svg"],
  ["longevity", "bg-longevity-hero.svg", "bg-longevity-band.svg"],
] as const;

const assetFilenames = storyFrames.flatMap(
  (frame) => [frame[1], frame[2]] as const,
);

describe("original full-bleed background-image contract", () => {
  it("paints the new bands with a CSS background-image in globals.css", () => {
    // The stylesheet declares background-image, and nothing outside the
    // reduced-motion gate is needed for it.
    expect(globalsCss).toContain("background-image");
    // No remote, protocol-relative, or data: image URL anywhere in the
    // declarations.
    expect(cssNoComments).not.toMatch(/url\(\s*["']?(https?:)?\/\//i);
    expect(cssNoComments).not.toMatch(/url\(\s*["']?data:/i);
  });

  it("only urls local files that exist under public/, and uses no vw unit", () => {
    // Every background-image url(...) is url("/images/...") or
    // url('/images/...') and its file exists in public/images/.
    const urls = [
      ...cssNoComments.matchAll(
        /url\(\s*(["'])([^"')]+)\1\s*\)/g,
      ),
    ].map((match) => match[2]);
    expect(urls.length, "the stylesheet urls its local images").toBeGreaterThan(
      0,
    );
    for (const url of urls) {
      expect(
        url,
        `every background-image url must be a quoted local /images/ SVG, got ${url}`,
      ).toMatch(/^\/images\/bg-[a-z][a-z-]+-?(hero|band)?\.svg$/);
      expect(
        url,
        `no remote or embedded image URL is allowed, got ${url}`,
      ).not.toMatch(/https?:|\/\/|^data:/i);
      expect(
        existsSync(`public${url}`),
        `the background asset public${url} must exist`,
      ).toBe(true);
    }
    // No vw unit in any declaration: full-bleed is 100% width, never
    // 100vw, so the page must never scroll sideways because of it.
    expect(cssNoComments, "declarations must not use vw units").not.toMatch(
      /\dvw\b/,
    );
    expect(cssNoComments, "100vw is banned").not.toContain("100vw");
  });

  it("gives each story frame a distinct hero and band url from the ten assets", () => {
    const heroUrls = new Set<string>();
    const bandUrls = new Set<string>();
    for (const [id, heroFile, bandFile] of storyFrames) {
      const frame = parseDeclarations(
        cssRuleBody(globalsCss, `.story-frame-${id}`),
      );
      expect(
        frame["--hero-image"],
        `.story-frame-${id} --hero-image`,
      ).toBe(`url("/images/${heroFile}")`);
      expect(
        frame["--band-image"],
        `.story-frame-${id} --band-image`,
      ).toBe(`url("/images/${bandFile}")`);
      heroUrls.add(frame["--hero-image"]);
      bandUrls.add(frame["--band-image"]);
    }
    expect(heroUrls.size).toBe(5);
    expect(bandUrls.size).toBe(5);
    // Ten distinct filenames in total.
    expect(assetFilenames.length).toBe(10);
    expect(new Set(assetFilenames).size).toBe(10);
  });

  it("paints the hero image on the transparent header and the hero, the band image on .image-band, all cover", () => {
    const header = parseDeclarations(cssRuleBody(globalsCss, "header"));
    const hero = parseDeclarations(cssRuleBody(globalsCss, ".hero"));
    const band = parseDeclarations(cssRuleBody(globalsCss, ".image-band"));

    expect(header["background-color"] ?? "").toBe("transparent");
    for (const [label, declarations, token] of [
      ["header", header, "--hero-image"],
      [".hero", hero, "--hero-image"],
      [".image-band", band, "--band-image"],
    ] as const) {
      expect(
        declarations["background-image"] ?? "",
        `${label} must paint ${token} as a CSS background-image`,
      ).toBe(`var(${token})`);
      expect(
        declarations["background-size"] ?? "",
        `${label} must cover`,
      ).toBe("cover");
      expect(
        declarations["background-repeat"] ?? "",
        `${label} must not tile`,
      ).toBe("no-repeat");
    }
  });

  it("keeps nav ul and .progress-cluster from painting an opaque bar over the header image", () => {
    for (const selector of ["nav ul", ".progress-cluster"]) {
      const declarations = parseDeclarations(cssRuleBody(globalsCss, selector));
      expect(
        declarations["background-color"] ?? "",
        `${selector} must not paint a background over the header image`,
      ).toBe("");
      expect(
        declarations["background-image"] ?? "",
        `${selector} must paint no image`
      ).toBe("");
    }
  });

  it("sits text, links, and progress text on --scrim, an opaque hex in both themes, at 4.5:1 with a 3:1 focus outline", () => {
    const heroText = parseDeclarations(cssRuleBody(globalsCss, ".hero-text"));
    const navLink = parseDeclarations(cssRuleBody(globalsCss, "nav a"));
    const progressCluster = parseDeclarations(
      cssRuleBody(globalsCss, ".progress-cluster"),
    );
    const chips = [
      ["story position", parseDeclarations(cssRuleBody(globalsCss, ".progress-cluster .story-position"))],
      ["next-story cue", parseDeclarations(cssRuleBody(globalsCss, ".progress-cluster .next-story-cue"))],
      ["progress ending", parseDeclarations(cssRuleBody(globalsCss, ".progress-cluster .progress-ending"))],
    ] as const;

    for (const theme of themes) {
      const scrim = resolveDeclarationHex(theme.tokens["scrim"] ?? "", theme.effective);
      expect(
        scrim,
        `--scrim must resolve to an opaque hex in the ${theme.name} theme`,
      ).not.toBeNull();
      expect(
        theme.tokens["scrim"] ?? "",
        `--scrim must not be rgba, hsla, or transparent in the ${theme.name} theme`,
      ).not.toMatch(/rgba|hsla|transparent/i);
      const scrimColor = scrim as Rgb;

      for (const [label, declarations] of [
        [".hero-text", heroText],
        ["nav a (header links)", navLink],
        ...chips,
      ] as const) {
        const ground = resolveDeclarationHex(
          declarations["background-color"] ?? "",
          theme.effective,
        );
        expect(
          ground,
          `the ${label} ground must resolve to a hex colour in the ${theme.name} theme`,
        ).not.toBeNull();
        expect(
          ground,
          `the ${label} must be grounded on --scrim in the ${theme.name} theme`,
        ).toEqual(scrimColor);
      }

      // Ink on the scrim clears 4.5:1: the hero text block's ink, the
      // header links' ink, and the progress cluster's ink.
      const ink = tokenRgb("ink-on-scrim", theme.effective);
      for (const [label, declarations] of [
        [".hero-text", heroText],
        ["nav a", navLink],
        [".progress-cluster", progressCluster],
      ] as const) {
        const color = resolveDeclarationHex(
          declarations["color"] ?? "",
          theme.effective,
        );
        expect(
          color,
          `the ${label} ink must resolve to a hex colour in the ${theme.name} theme`,
        ).not.toBeNull();
        expect(
          contrastRatio(color as Rgb, scrimColor),
          `${label} ink on the scrim (${theme.name}) must reach 4.5:1`,
        ).toBeGreaterThanOrEqual(4.5);
      }

      // The focus ring beside the scrim is the scrim's own ink at 3:1.
      const focus = parseDeclarations(
        cssRuleBody(globalsCss, "header :focus-visible, .hero :focus-visible"),
      );
      const outline = resolveDeclarationHex(
        focus["outline-color"] ?? "",
        theme.effective,
      );
      expect(
        outline,
        `the scrim focus outline must resolve to a hex colour in the ${theme.name} theme`,
      ).not.toBeNull();
      expect(
        contrastRatio(outline as Rgb, scrimColor),
        `focus outline on the scrim (${theme.name}) must reach 3:1`,
      ).toBeGreaterThanOrEqual(3);
    }

    // The dark scrim is darker than the light one.
    const lightScrim = tokenRgb("scrim", lightTokens);
    const darkScrim = tokenRgb("scrim", darkTokens);
    expect(
      relativeLuminance(darkScrim),
      "the dark scrim must be darker than the light scrim",
    ).toBeLessThan(relativeLuminance(lightScrim));
  });
});

describe("background assets are original, local, and not ignored", () => {
  it("has ten non-empty SVG files under public/images with no remote or copied content", () => {
    for (const filename of assetFilenames) {
      const path = `public/images/${filename}`;
      expect(existsSync(path), `${path} must exist`).toBe(true);
      const contents = readFileSync(path, "utf8");
      // The XML namespace declaration `xmlns="http://www.w3.org/2000/svg"`
      // is a namespace identifier every valid SVG file carries, not a
      // fetched URL, so it is exempted before the remote-reference check.
      const namespaceStripped = contents.replace(
        /xmlns(?:\:\w+)?\s*=\s*"https?:\/\/[^"]*"/gi,
        "xmlns-stripped",
      );
      expect(
        statSync(path).size,
        `${filename} must be non-empty`,
      ).toBeGreaterThan(0);
      for (const forbidden of [
        "https://",
        "http://",
        "templatemonster",
        "template-help",
        "ld-wt73",
        "<script",
        "<image",
        "foreignObject",
        "data:image",
      ] as const) {
        expect(
          namespaceStripped.toLowerCase(),
          `${filename} must not contain ${forbidden}`,
        ).not.toContain(forbidden.toLowerCase());
      }
    }
  });

  it("keeps the background SVGs out of .gitignore so they are committed", () => {
    const gitignore = readFileSync(".gitignore", "utf8");
    for (const forbidden of [
      "public/images",
      "*.svg",
      ...assetFilenames,
    ] as const) {
      expect(
        gitignore,
        `.gitignore must not ignore ${forbidden}`,
      ).not.toContain(forbidden);
    }
  });

  it("records the decision in docs/adr/0009-background-images.md", () => {
    const adr = readFileSync("docs/adr/0009-background-images.md", "utf8");
    expect(adr).toContain("original full-bleed background images");
  });
});

describe("rendered routes keep the reading contract over the backgrounds", () => {
  const routes: ReadonlyArray<{
    id: string;
    label: string;
    render: () => string;
    source: string;
    position: number;
    pageId: SitePageId;
  }> = [
    {
      id: "home",
      label: "home (/)",
      render: () => renderToStaticMarkup(createElement(HomePage)),
      source: "src/app/page.tsx",
      position: 1,
      pageId: "home",
    },
    {
      id: "how-ai-helps",
      label: "how-ai-helps (/how-ai-helps)",
      render: () => renderToStaticMarkup(createElement(HowAiHelpsPage)),
      source: "src/app/how-ai-helps/page.tsx",
      position: 2,
      pageId: "how-ai-helps",
    },
    {
      id: "cancer",
      label: "cancer (/cancer)",
      render: () => renderToStaticMarkup(createElement(CancerPage)),
      source: "src/app/cancer/page.tsx",
      position: 3,
      pageId: "cancer",
    },
    {
      id: "diseases",
      label: "diseases (/diseases)",
      render: () => renderToStaticMarkup(createElement(DiseasesPage)),
      source: "src/app/diseases/page.tsx",
      position: 4,
      pageId: "diseases",
    },
    {
      id: "longevity",
      label: "longevity (/longevity)",
      render: () => renderToStaticMarkup(createElement(LongevityPage)),
      source: "src/app/longevity/page.tsx",
      position: 5,
      pageId: "longevity",
    },
  ];

  for (const route of routes) {
    it(`renders ${route.label} with the header-only contract intact`, () => {
      const html = route.render();
      const text = html.replace(/<[^>]*>/g, " ");

      // Server component: no "use client" directive in the source.
      expect(
        readFileSync(route.source, "utf8"),
        `${route.source} must not declare "use client"`,
      ).not.toMatch(/["']use client["']/);

      // The skip link is the first anchor on the page.
      const firstAnchor = /<a\b/.exec(html);
      expect(firstAnchor, "the page must render an anchor").not.toBeNull();
      if (firstAnchor !== null) {
        const firstATag = /^<a[^>]*>/.exec(html.slice(firstAnchor.index));
        expect(firstATag, "the first anchor must exist").not.toBeNull();
        expect(
          firstATag?.[0].includes("skip-link"),
          "the skip link must be the first anchor",
        ).toBe(true);
      }

      // main's first element is exactly <div class="hero">.
      const mainIndex = html.indexOf("<main");
      expect(mainIndex, "the page must render a main").toBeGreaterThanOrEqual(0);
      expect(
        html.slice(mainIndex, mainIndex + 120),
        "main's first element must be the hero",
      ).toMatch(/<main[^>]*><div class="hero">/);

      // The route wraps the page in its story frame naming the images.
      expect(html).toContain(`story-frame-${route.id}`);

      // Exactly one image-band, decorative and empty.
      expect(html.match(/class="image-band"/g)).toHaveLength(1);

      // One navigation only (header-only): two <nav ...> opens would mean
      // a second menu; the site header renders its one nav plus nothing
      // else in this markup.
      expect(html.match(/<nav\b/g)).not.toBeNull();
      expect(html.match(/<nav\b/g) ?? []).toHaveLength(1);

      // Exactly one aria-current="page".
      expect(html.match(/aria-current="page"/g)).toHaveLength(1);

      // The h1, position label, and next cue or ending remain.
      expect(html).toContain("<h1>");
      expect(text).toMatch(new RegExp(`Story ${route.position} of 5`));
      if (route.position < 5) {
        expect(html).toContain("next-story-cue");
        expect(text).toContain("Next story:");
      } else {
        expect(text).toContain("End of the stories");
      }

      // The disclaimer stays the last element of main.
      const mainEnd = html.indexOf("</main>");
      expect(mainEnd, "main must close").toBeGreaterThan(0);
      const mainContent = html.slice(0, mainEnd + 7);
      expect(
        mainContent.slice(Math.max(0, mainEnd - 400)),
        "the disclaimer must be main's last element",
      ).toMatch(/<p>[^<]*<\/p><\/main>$/);
    });
  }

  it("keeps the story pages' per-page content unchanged across the five routes", () => {
    // Each story data page still renders through the shared StoryPage:
    // its heading, evidence panels, and disclaimer come from
    // src/lib/site-content.ts, which the reading-contract tests already
    // lock. Here we pin that each route's page data names its own story.
    for (const route of routes) {
      const page = getSitePage(route.pageId);
      expect(page.id).toBe(route.id);
      expect(page.heading.length).toBeGreaterThan(0);
      expect(page.disclaimer).toMatch(/not medical advice/i);
    }
  });
});
