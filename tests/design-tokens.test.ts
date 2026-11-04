/**
 * Design-token safeguards for the dual-theme design system in
 * src/app/globals.css.
 *
 * The milestone replaced the 20 October palette with two full palettes
 * taken from the reference look (docs/adr/0008-reference-look.md) and
 * chosen only by the reader's system setting â€” the light theme is the
 * :root default and the dark theme redeclares the same colour token
 * names inside @media (prefers-color-scheme: dark) â€” so this test parses
 * globals.css and verifies the design from the tokens of both themes:
 *
 * 1. the same colour token set exists in both themes â€” the surfaces
 *    (page, raised, evidence-panel), the ink (heading, body, muted), the
 *    blue accent with its strong step, the rules (meaningful and
 *    decorative), the headline band's surface and inks, and the
 *    reference's remaining accent palette â€” each a hex colour, with the
 *    shared layout tokens (measure, page shell, card radius) in the base
 *    set;
 * 2. the light palette copies the reference's light background (pure
 *    white) over two distinct pale bands, so the raised chrome and the
 *    evidence panels read apart from the page; the dark palette is a
 *    deep surface set: the surfaces are pairwise distinct and darker
 *    than every ink;
 * 3. every text/background pair used for body text, headings (including
 *    headings on the raised sources card), muted meta, links (including
 *    visited), citations, the skip-link text, the header progress text,
 *    the headline band's inks, and the painted accent pairs â€” the hero
 *    kicker, the header links and the next-story cue on the headline
 *    band, the active story link on its own filled pill, and the
 *    citation-link rules on the pale band the citation cards sit on
 *    (not only on the cards' own fills) â€” meets WCAG 2.2 AA in both
 *    themes: 4.5:1 for normal text;
 * 4. UI boundaries meet the 3:1 non-text minimum in both themes: the
 *    meaningful rule on every surface and the accent colours where they
 *    carry a meaningful border, the active-story indicator, or the focus
 *    outline, plus the sources card's own border checked against its
 *    raised background and the band's own focus ring and story-link
 *    border checked against the band;
 * 5. the base interaction rules hold: underlined links, a :focus-visible
 *    outline of at least 2 px in the accent with an offset that clears
 *    3:1 on the page surface in both themes, body line-height of at
 *    least 1.5 and font-size of at least 1rem, a long-form measure
 *    between 38rem and 42rem capping the reading column, and a page
 *    shell that is wider than the measure and spans it â€” main and the
 *    wide top section (the hero, the first element inside main) â€” while
 *    every long-form block in main (paragraphs, headings, sections, the
 *    later illustrations, the evidence panels, the sources block, and the
 *    term list) and the hero's text block stay capped at the measure and
 *    centered;
 * 6. rounded cards: the evidence panels, the framed hero and story
 *    illustrations, and the home page sources block all set a positive
 *    border-radius from the shared radius token, which is the
 *    reference's 5 px rounded rectangle, while the story links are its
 *    23 px pill;
 * 7. the themes are declared for native UI: color-scheme: light on the
 *    light root, color-scheme: dark on the dark root, and the dark
 *    palette exists only inside the prefers-color-scheme: dark media
 *    block;
 * 8. motion is reader-gated: animation and transition declarations appear
 *    only inside @media (prefers-reduced-motion: no-preference), the
 *    gated block declares the decorative motion, and that motion is
 *    short (at most 5 s) and never loops;
 * 9. the old navy-only treatment is gone: the legacy link colour
 *    #0b3d91 appears nowhere in the stylesheet;
 * 11. the background-image contract (docs/adr/0009-background-images.md):
 *     each .story-frame-* names its two local /images/ SVG backgrounds,
 *     the transparent header and the hero paint --hero-image and the
 *     decorative .image-band paints --band-image as CSS background-image
 *     (cover, no-repeat, no remote URL, no 100vw), and every text on the
 *     opening sits on the solid opaque --scrim with its inks at 4.5:1 and
 *     the focus ring and borders at 3:1 in both themes, the dark scrim
 *     being darker than the light one;
 * 10. structural hygiene: no 100vw, no min-width above 320 px, and no
 *     text-transform anywhere (navigation labels stay exactly their
 *     copy).
 *
 * Node-only: it reads one file and does arithmetic. It never launches a
 * browser.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  cssRuleBody,
  mediaBlockBody,
  parseCustomProperties,
  parseDeclarations,
  parseHexColor,
  relativeLuminance,
  resolveCssValue,
  resolveHexColor,
  type Rgb,
} from "../src/lib/css-contrast";

const globalCss = readFileSync("src/app/globals.css", "utf8");

/**
 * The stylesheet with its comments removed. The structural checks below
 * reason about the declarations only: the file's own prose names the
 * forbidden constructs (it documents "no 100vw" and so on), and that
 * documentation is not a violation.
 */
const cssNoComments = globalCss.replace(/\/\*[\s\S]*?\*\//g, " ");

/**
 * One theme: the reader's resolved tokens and the theme's :root rule.
 * `tokens` is what the theme's own :root rule declares (the dark theme
 * redeclares only the colour tokens); `effectiveTokens` is what the
 * reader actually gets, the same way the browser computes it â€” the base
 * :root set with the dark theme's redeclarations layered on top. Colour
 * values a reader inherits from the base set, including the
 * focus-outline accent, are resolved against `effectiveTokens`, so the
 * checks guard the outline the theme actually paints.
 */
interface Theme {
  readonly name: string;
  readonly tokens: Record<string, string>;
  readonly effectiveTokens: Record<string, string>;
  readonly rootDeclarations: Record<string, string>;
}

/** The light theme: the :root default set (color-scheme: light). */
const lightRootBody = cssRuleBody(globalCss, ":root");
const lightTheme: Theme = {
  name: "light (the :root default)",
  tokens: parseCustomProperties(lightRootBody),
  effectiveTokens: parseCustomProperties(lightRootBody),
  rootDeclarations: parseDeclarations(lightRootBody),
};

/**
 * The dark theme: the same colour token names redeclared under the
 * reader's system setting. The media block's inner text is extracted
 * first (cssRuleBody stops at the first closing brace and cannot look
 * inside it), then its :root rule is read the same way as the light one.
 */
const darkMediaBody = mediaBlockBody(globalCss, "(prefers-color-scheme: dark)");
const darkRootBody = cssRuleBody(darkMediaBody, ":root");
const darkTheme: Theme = {
  name: "dark (@media (prefers-color-scheme: dark))",
  tokens: parseCustomProperties(darkRootBody),
  effectiveTokens: {
    ...parseCustomProperties(lightRootBody),
    ...parseCustomProperties(darkRootBody),
  },
  rootDeclarations: parseDeclarations(darkRootBody),
};

/** Both themes, in the order the stylesheet declares them. */
const themes: readonly Theme[] = [lightTheme, darkTheme];

/** Resolve one token (with or without the -- prefix) of a theme to RGB. */
function tokenColor(theme: Theme, name: string): Rgb {
  const colour = resolveHexColor(`var(--${name})`, theme.effectiveTokens);
  if (colour === null) {
    throw new Error(
      `Design token --${name} is missing or is not a hex colour in the ${theme.name} theme`,
    );
  }
  return colour;
}

/** The colour token names both themes must declare. */
const requiredColorTokens = [
  "surface-page",
  "surface-raised",
  "surface-evidence",
  "ink-heading",
  "ink-body",
  "ink-muted",
  "accent-primary",
  "accent-primary-strong",
  "rule",
  "rule-soft",
  "surface-band",
  "ink-on-band",
  "ink-muted-on-band",
  "scrim",
  "ink-on-scrim",
  "ink-muted-on-scrim",
  "accent-secondary",
  "accent-tertiary",
  "accent-warm",
  "accent-emphasis",
] as const;

/**
 * The five routes and the two original full-bleed background images each
 * one names on its .story-frame-* wrapper (docs/adr/0009-background-
 * images.md): local SVG URLs under /images/, nothing remote, nothing
 * from the reference.
 */
const storyFrames = [
  ["home", "/images/bg-home-hero.svg", "/images/bg-home-band.svg"],
  [
    "how-ai-helps",
    "/images/bg-how-ai-helps-hero.svg",
    "/images/bg-how-ai-helps-band.svg",
  ],
  ["cancer", "/images/bg-cancer-hero.svg", "/images/bg-cancer-band.svg"],
  ["diseases", "/images/bg-diseases-hero.svg", "/images/bg-diseases-band.svg"],
  [
    "longevity",
    "/images/bg-longevity-hero.svg",
    "/images/bg-longevity-band.svg",
  ],
] as const;

/** The three surfaces the text, link, and boundary colours sit on. */
const surfaceTokens = [
  "surface-page",
  "surface-raised",
  "surface-evidence",
] as const;

/**
 * The normal-text pairs to verify at 4.5:1 in each theme:
 * [foreground, background, where it is used].
 */
const textPairs = [
  ["ink-body", "surface-page", "body text on the page"],
  [
    "ink-body",
    "surface-raised",
    "body text and the skip-link text on the raised chrome",
  ],
  [
    "ink-body",
    "surface-evidence",
    "list text and definitions in the evidence panel",
  ],
  ["ink-heading", "surface-page", "headings on the page"],
  [
    "ink-heading",
    "surface-raised",
    "headings on the raised sources card",
  ],
  [
    "ink-heading",
    "surface-evidence",
    "evidence captions and lifespan terms in the panel",
  ],
  ["ink-muted", "surface-page", "muted meta (review date, disclaimer) on the page"],
  [
    "ink-muted",
    "surface-raised",
    "muted meta on the raised chrome (the raised cards and illustration frames)",
  ],
  ["ink-muted", "surface-evidence", "muted meta in the evidence panel"],
  ["accent-primary", "surface-page", "links on the page surface"],
  [
    "accent-primary",
    "surface-raised",
    "the accent on the raised chrome (the raised cards and illustration frames), and the citation links on the cards that sit on the pale band",
  ],
  ["accent-primary", "surface-evidence", "citations in the evidence panel"],
  ["accent-primary-strong", "surface-page", "visited links on the page"],
  [
    "accent-primary-strong",
    "surface-raised",
    "the strong accent on the raised chrome (the skip-link border), and the visited citation links on the cards that sit on the pale band",
  ],
  ["accent-primary-strong", "surface-evidence", "visited citations in the panel"],
  [
    "ink-on-band",
    "surface-band",
    "the header links, the headline, and the summary on the headline band",
  ],
  [
    "ink-muted-on-band",
    "surface-band",
    "the review line and the visited header links on the headline band",
  ],
  [
    "surface-band",
    "ink-on-band",
    "the active story link's own text on its filled pill",
  ],
  [
    "ink-on-scrim",
    "scrim",
    "the headline, kicker, summary, story links, and progress chips on the text scrim",
  ],
  [
    "ink-muted-on-scrim",
    "scrim",
    "the review line and the visited story links on the text scrim",
  ],
  [
    "scrim",
    "ink-on-scrim",
    "the active story link's scrim-coloured text on its own filled pill",
  ],
] as const;

/**
 * The meaningful UI boundaries to verify at 3:1 in each theme:
 * [foreground, background, where it is used].
 */
const boundaryPairs = [
  ["rule", "surface-page", "the meaningful rule on the page"],
  [
    "rule",
    "surface-raised",
    "the evidence-panel, hero-frame, and sources-block borders on the raised chrome",
  ],
  ["rule", "surface-evidence", "the evidence-panel border on the evidence surface"],
  [
    "accent-primary-strong",
    "surface-page",
    "the focus outline and the skip-link border on the page surface",
  ],
  [
    "accent-primary-strong",
    "surface-raised",
    "the focus outline and the skip-link border on the raised chrome",
  ],
  [
    "accent-primary-strong",
    "surface-evidence",
    "the focus outline on the evidence surface",
  ],
  [
    "accent-primary",
    "surface-raised",
    "the accent on the raised chrome (the raised cards and illustration frames)",
  ],
  [
    "accent-primary",
    "surface-evidence",
    "the evidence panel's accent left edge",
  ],
  [
    "accent-primary",
    "surface-page",
    "the accent edge on the page surface",
  ],
  [
    "ink-on-band",
    "surface-band",
    "the focus outline and the story-link border on the headline band",
  ],
  [
    "ink-muted-on-band",
    "surface-band",
    "the story-link border on the headline band",
  ],
  [
    "surface-band",
    "ink-on-band",
    "the active-story pill's inset bar on its own filled pill",
  ],
  [
    "ink-on-scrim",
    "scrim",
    "the focus outline inside the header and the hero, beside the scrim",
  ],
  [
    "ink-muted-on-scrim",
    "scrim",
    "the story-link pill border on the scrim",
  ],
  [
    "scrim",
    "ink-on-scrim",
    "the active-story pill's inset bar on its own filled pill",
  ],
] as const;

/** The rounded card blocks: each must carry the shared card radius. */
const cardSelectors = [
  ".claim-evidence",
  ".lifespan-terms",
  ".hero-media",
  ".story-illustration",
  ".sources",
] as const;

describe("design tokens in globals.css", () => {
  it("declares the same full colour token set, as hex colours, in both themes", () => {
    for (const theme of themes) {
      for (const name of requiredColorTokens) {
        expect(
          theme.tokens[name],
          `--${name} must be declared in the ${theme.name} theme`,
        ).toBeDefined();
        expect(
          parseHexColor(theme.tokens[name]),
          `--${name} must be a hex colour in the ${theme.name} theme`,
        ).not.toBeNull();
      }
    }
  });

  it("keeps the shared layout tokens in the base set", () => {
    expect(
      lightTheme.tokens["measure"],
      "--measure must be declared in :root",
    ).toBeDefined();
    expect(
      lightTheme.tokens["page-shell"],
      "--page-shell must be declared in :root",
    ).toBeDefined();
    expect(
      lightTheme.tokens["radius-card"],
      "--radius-card must be declared in :root",
    ).toBeDefined();
  });

  it("keeps the light theme the reference's light set: a white page over two distinct pale bands", () => {
    const page = tokenColor(lightTheme, "surface-page");
    const raised = tokenColor(lightTheme, "surface-raised");
    const evidence = tokenColor(lightTheme, "surface-evidence");

    // The light theme copies the reference's light background, so the
    // page surface is the reference's pure white...
    expect(
      page,
      "the light page surface must copy the reference's #ffffff background",
    ).toEqual([255, 255, 255]);
    // ...while the raised chrome and the evidence panels sit on the
    // reference's pale bands, which are not pure white: they read apart
    // from the page.
    for (const [name, surface] of [
      ["surface-raised", raised],
      ["surface-evidence", evidence],
    ] as const) {
      expect(
        surface,
        `--${name} must be a pale band, not the page's pure white`,
      ).not.toEqual([255, 255, 255]);
    }
    // The three surfaces are pairwise distinct, so the evidence panel
    // and the raised chrome read apart from the page.
    expect(raised).not.toEqual(page);
    expect(evidence).not.toEqual(page);
    expect(evidence).not.toEqual(raised);
    // The pale bands are lighter than the body ink that sits on them.
    for (const [name, surface] of [
      ["surface-raised", raised],
      ["surface-evidence", evidence],
    ] as const) {
      expect(
        relativeLuminance(surface),
        `--${name} must be lighter than --ink-body`,
      ).toBeGreaterThan(relativeLuminance(tokenColor(lightTheme, "ink-body")));
    }
  });

  it("keeps the dark theme a deep surface set: distinct surfaces, each darker than its inks", () => {
    const page = tokenColor(darkTheme, "surface-page");
    const raised = tokenColor(darkTheme, "surface-raised");
    const evidence = tokenColor(darkTheme, "surface-evidence");

    // The three dark surfaces are pairwise distinct, so the evidence
    // panel and the raised chrome read apart from the page.
    expect(raised, "dark raised surface must differ from the dark page").not.toEqual(page);
    expect(evidence, "dark evidence surface must differ from the dark page").not.toEqual(
      page,
    );
    expect(evidence, "dark evidence surface must differ from the dark raised chrome").not.toEqual(
      raised,
    );

    // Every dark surface is darker than every dark ink, so light ink
    // always sits on a dark ground.
    for (const inkName of ["ink-heading", "ink-body", "ink-muted"] as const) {
      const ink = tokenColor(darkTheme, inkName);
      for (const surface of [page, raised, evidence]) {
        expect(
          relativeLuminance(surface),
          `each dark surface must be darker than --${inkName}`,
        ).toBeLessThan(relativeLuminance(ink));
      }
    }
  });

  it("meets WCAG 2.2 AA (4.5:1) for every normal-text pair in both themes", () => {
    for (const theme of themes) {
      for (const [foreground, background, usage] of textPairs) {
        const ratio = contrastRatio(
          tokenColor(theme, foreground),
          tokenColor(theme, background),
        );
        expect(
          ratio,
          `${theme.name}: ${usage} (--${foreground} on --${background})`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("meets the 3:1 non-text minimum for meaningful UI boundaries in both themes", () => {
    for (const theme of themes) {
      for (const [foreground, background, usage] of boundaryPairs) {
        const ratio = contrastRatio(
          tokenColor(theme, foreground),
          tokenColor(theme, background),
        );
        expect(
          ratio,
          `${theme.name}: ${usage} (--${foreground} on --${background})`,
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("paints the sources card's own border at at least 3:1 on its raised background in both themes", () => {
    // The token-level boundary pairs above only prove the *tokens* clear
    // 3:1; this check pins the border the .sources rule actually paints:
    // the colour after "solid" in the border shorthand against the card's
    // own background, resolved per theme against the reader's effective
    // tokens. A decorative hairline border (or any colour that does not
    // resolve to a hex) fails the check in either theme.
    const sources = parseDeclarations(cssRuleBody(globalCss, ".sources"));
    const border = /(\d+(?:\.\d+)?)px\s+solid\s+(.+)$/.exec(
      sources["border"] ?? "",
    );
    expect(border, ".sources must set a solid border shorthand").not.toBeNull();
    if (border === null) {
      return;
    }

    for (const theme of themes) {
      const borderColour = resolveHexColor(
        border[2].trim(),
        theme.effectiveTokens,
      );
      const background = resolveHexColor(
        sources["background-color"] ?? "",
        theme.effectiveTokens,
      );
      expect(
        borderColour,
        `the .sources border colour must resolve to a hex colour in the ${theme.name} theme`,
      ).not.toBeNull();
      expect(
        background,
        `the .sources background must resolve to a hex colour in the ${theme.name} theme`,
      ).not.toBeNull();
      if (borderColour !== null && background !== null) {
        expect(
          contrastRatio(borderColour, background),
          `${theme.name}: the .sources card border on its raised background`,
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("paints the citation links â€” and their visited colour â€” at least 4.5:1 on the pale band the cards sit on, as well as on the cards' own fills, in both themes", () => {
    // The token-level text pairs above only prove the *tokens* clear
    // 4.5:1; this check pins the colours the link rules actually paint.
    // The cards that carry the citation links sit on the pale section
    // band: the .sources block paints the raised surface itself, and
    // the .claim-evidence cards live inside the .band-alt sections,
    // whose ground is the same raised surface â€” so the link colour and
    // the visited colour must clear 4.5:1 against that band's surface,
    // not only against the card's own fill. A foreground or ground that
    // does not resolve to a hex colour fails the check in either theme
    // rather than being skipped.
    const link = parseDeclarations(cssRuleBody(globalCss, "a"));
    const linkVisited = parseDeclarations(cssRuleBody(globalCss, "a:visited"));
    const bandAlt = parseDeclarations(cssRuleBody(globalCss, ".band-alt"));
    const sources = parseDeclarations(cssRuleBody(globalCss, ".sources"));
    const evidenceCard = parseDeclarations(cssRuleBody(globalCss, ".claim-evidence"));

    for (const theme of themes) {
      const linkColour = resolveHexColor(
        link["color"] ?? "",
        theme.effectiveTokens,
      );
      const visitedColour = resolveHexColor(
        linkVisited["color"] ?? "",
        theme.effectiveTokens,
      );
      const bandAltSurface = resolveHexColor(
        bandAlt["background-color"] ?? "",
        theme.effectiveTokens,
      );
      const sourcesSurface = resolveHexColor(
        sources["background-color"] ?? "",
        theme.effectiveTokens,
      );
      const evidenceSurface = resolveHexColor(
        evidenceCard["background-color"] ?? "",
        theme.effectiveTokens,
      );
      const pageSurface = tokenColor(theme, "surface-page");
      expect(
        linkColour,
        `the citation link colour must resolve to a hex colour in the ${theme.name} theme`,
      ).not.toBeNull();
      expect(
        visitedColour,
        `the visited citation link colour must resolve to a hex colour in the ${theme.name} theme`,
      ).not.toBeNull();
      expect(
        bandAltSurface,
        `the .band-alt ground must resolve to a hex colour in the ${theme.name} theme`,
      ).not.toBeNull();
      expect(
        sourcesSurface,
        `the .sources ground must resolve to a hex colour in the ${theme.name} theme`,
      ).not.toBeNull();
      expect(
        evidenceSurface,
        `the .claim-evidence ground must resolve to a hex colour in the ${theme.name} theme`,
      ).not.toBeNull();
      if (
        linkColour === null ||
        visitedColour === null ||
        bandAltSurface === null ||
        sourcesSurface === null ||
        evidenceSurface === null
      ) {
        throw new Error(
          `${theme.name}: the citation link colours and their surfaces must resolve to hex colours`,
        );
      }

      // The link rules paint the accent pair...
      expect(
        linkColour,
        `the citation links must paint --accent-primary in the ${theme.name} theme`,
      ).toEqual(tokenColor(theme, "accent-primary"));
      expect(
        visitedColour,
        `the visited citation links must paint --accent-primary-strong in the ${theme.name} theme`,
      ).toEqual(tokenColor(theme, "accent-primary-strong"));
      // ...and the card grounds are the raised band (the sources block
      // and the .band-alt ground the cards sit on) and the evidence
      // surface (the claim panels), so the band's surface is the raised
      // one.
      expect(
        bandAltSurface,
        `the .band-alt ground must paint the raised surface in the ${theme.name} theme`,
      ).toEqual(tokenColor(theme, "surface-raised"));
      expect(
        sourcesSurface,
        `the .sources card must paint the raised surface in the ${theme.name} theme`,
      ).toEqual(tokenColor(theme, "surface-raised"));
      expect(
        evidenceSurface,
        `the .claim-evidence card must paint the evidence surface in the ${theme.name} theme`,
      ).toEqual(tokenColor(theme, "surface-evidence"));

      // Both accent steps clear 4.5:1 on the band the cards sit on, on
      // each card's own fill, and on the page surface.
      for (const [label, colour] of [
        ["the citation links", linkColour],
        ["the visited citation links", visitedColour],
      ] as const) {
        expect(
          contrastRatio(colour, bandAltSurface),
          `${theme.name}: ${label} on the pale band the cards sit on`,
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrastRatio(colour, sourcesSurface),
          `${theme.name}: ${label} on the .sources card's own fill`,
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrastRatio(colour, evidenceSurface),
          `${theme.name}: ${label} on the .claim-evidence card's own fill`,
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrastRatio(colour, pageSurface),
          `${theme.name}: ${label} on the page surface`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("opens each page on an original local full-bleed background image: the transparent header and the hero paint --hero-image, and the later band paints --band-image", () => {
    // docs/adr/0009-background-images.md: each route's .story-frame-*
    // wrapper names the page's two original SVG backgrounds as local
    // /images/ URLs; the header (transparent, width 100%) and the hero
    // paint the hero image as a CSS background-image, and the empty
    // decorative .image-band paints the band image. Nothing is remote,
    // nothing comes from the reference, and no viewport-width unit is
    // used.
    const forbiddenUrl = /https?:|\/\/|templatemonster|template-help|data:/i;
    for (const [id, heroUrl, bandUrl] of storyFrames) {
      const frame = parseDeclarations(
        cssRuleBody(globalCss, `.story-frame-${id}`),
      );
      expect(
        frame["--hero-image"],
        `.story-frame-${id} must name its hero background image`,
      ).toBe(`url("${heroUrl}")`);
      expect(
        frame["--band-image"],
        `.story-frame-${id} must name its later band background image`,
      ).toBe(`url("${bandUrl}")`);
      for (const url of [heroUrl, bandUrl]) {
        expect(url, `${id}: a background must be a local /images/ SVG`).toMatch(
          /^\/images\/bg-[a-z-]+-(hero|band)\.svg$/,
        );
        expect(
          url,
          `${id}: a background must not be remote or copied`,
        ).not.toMatch(forbiddenUrl);
      }
    }
    // Every url() in the stylesheet is a local /images/ file.
    for (const match of cssNoComments.matchAll(
      /url\(\s*["']?([^"')]+)["']?\s*\)/g,
    )) {
      expect(match[1], "every background url must be local").toMatch(
        /^\/images\//,
      );
    }

    const header = parseDeclarations(cssRuleBody(globalCss, "header"));
    const hero = parseDeclarations(cssRuleBody(globalCss, ".hero"));
    const band = parseDeclarations(cssRuleBody(globalCss, ".image-band"));

    // The header sits on the hero image: no colour of its own, the image
    // painted edge to edge.
    expect(
      (header["background-color"] ?? "").trim(),
      "the header must stay transparent so it sits on the hero image",
    ).toBe("transparent");
    for (const [label, declarations, image] of [
      ["header", header, "--hero-image"],
      [".hero", hero, "--hero-image"],
      [".image-band", band, "--band-image"],
    ] as const) {
      expect(
        declarations["background-image"] ?? "",
        `${label} must paint ${image} as a CSS background-image`,
      ).toBe(`var(${image})`);
      expect(
        declarations["background-size"] ?? "",
        `${label} must cover its box with the image`,
      ).toBe("cover");
      expect(
        declarations["background-repeat"] ?? "",
        `${label} must not tile the image`,
      ).toBe("no-repeat");
    }
    expect(header["background-position"] ?? "").toBe("center top");
    expect(hero["background-position"] ?? "").toBe("center top");
    expect(
      header["width"] ?? "",
      "the header reaches the edges by width 100%, not 100vw",
    ).toBe("100%");

    // The hero and the band keep the page-shell span, never wider.
    for (const [label, declarations] of [
      [".hero", hero],
      [".image-band", band],
    ] as const) {
      // The width adds back exactly the 2rem of main padding the
      // negative margins cancel, and is still capped at the page shell.
      expect(declarations["width"] ?? "", `${label} width`).toBe(
        "calc(100% + 2rem)",
      );
      expect(declarations["max-width"] ?? "", `${label} max-width`).toBe(
        "var(--page-shell)",
      );
      expect(
        declarations["margin-inline"] ?? "",
        `${label} margin-inline`,
      ).toBe("-1rem");
    }
    const bandHeight = /^(\d+(?:\.\d+)?)rem$/.exec(band["min-height"] ?? "");
    expect(bandHeight, ".image-band must set a rem min-height").not.toBeNull();
    if (bandHeight !== null) {
      expect(
        Number(bandHeight[1]),
        ".image-band min-height (about 14rem)",
      ).toBeGreaterThanOrEqual(12);
      expect(
        Number(bandHeight[1]),
        ".image-band min-height (about 14rem)",
      ).toBeLessThanOrEqual(16);
    }
  });

  it("paints every text on the opening image on a solid opaque scrim, at least 4.5:1 in both themes", () => {
    // The token-level text pairs above only prove the *tokens* clear
    // 4.5:1; this check pins the colours the rules actually paint. Text
    // never sits on image pixels: the hero's text block, each story-link
    // pill, and each progress chip paint the opaque --scrim, and every
    // text on them uses the scrim's inks, each resolved per theme against
    // the reader's effective tokens. The navigation list and the
    // progress cluster paint no bar of their own, so the header image
    // stays visible around the pills and chips. A foreground or ground
    // that does not resolve to a hex colour fails the check in either
    // theme rather than being skipped.
    const rule = (selector: string): Record<string, string> =>
      parseDeclarations(cssRuleBody(globalCss, selector));
    const navList = rule("nav ul");
    const navLink = rule("nav a");
    const navLinkVisited = rule("nav a:visited");
    const activeLink = rule('nav a[aria-current="page"]');
    const hero = rule(".hero");
    const heroText = rule(".hero-text");
    const heroHeading = rule(".hero h1");
    const heroKicker = rule(".hero-kicker");
    const heroReview = rule(".hero-review");
    const heroMedia = rule(".hero-media");
    const progressCluster = rule(".progress-cluster");
    const chips = [
      [".progress-cluster .story-position", rule(".progress-cluster .story-position")],
      [".progress-cluster .next-story-cue", rule(".progress-cluster .next-story-cue")],
      [".progress-cluster .progress-ending", rule(".progress-cluster .progress-ending")],
    ] as const;

    // No opaque full-width bars hide the header image.
    for (const [label, declarations] of [
      ["nav ul", navList],
      [".progress-cluster", progressCluster],
    ] as const) {
      expect(
        declarations["background-color"] ?? "",
        `${label} must not paint an opaque bar over the header image`,
      ).toBe("");
      expect(
        declarations["background-image"] ?? "",
        `${label} paints no image`,
      ).toBe("");
    }
    // The text scrim has padding so the hero text sits inside it, and
    // nothing on the opening is translucent.
    expect(
      heroText["padding"] ?? "",
      ".hero-text needs padding around its text",
    ).not.toBe("");
    for (const [label, declarations] of [
      [".hero", hero],
      [".hero-text", heroText],
      ["nav a", navLink],
      ...chips,
    ] as const) {
      expect(
        declarations["opacity"] ?? "",
        `${label} must not be translucent`,
      ).toBe("");
      expect(
        declarations["background-color"] ?? "",
        `${label} must not use a translucent colour`,
      ).not.toMatch(/rgba|hsla|transparent/i);
    }
    // The story links keep their underline, 44 px target, and pill.
    expect(navLink["text-decoration"] ?? "").toContain("underline");
    expect(navLink["min-height"] ?? "").toBe("44px");
    expect(navLink["min-width"] ?? "").toBe("44px");
    expect(navLink["border-radius"] ?? "").toBe("var(--radius-pill)");
    // The active link is identifiable without colour alone.
    expect(activeLink["font-weight"] ?? "").toBe("700");

    for (const theme of themes) {
      const scrim = tokenColor(theme, "scrim");
      const ink = tokenColor(theme, "ink-on-scrim");
      const mutedInk = tokenColor(theme, "ink-muted-on-scrim");

      // The scrim is painted by the hero fallback, the hero text block,
      // the story-link pills, and the progress chips.
      for (const [label, declarations] of [
        [".hero", hero],
        [".hero-text", heroText],
        ["nav a", navLink],
        ...chips,
      ] as const) {
        const ground = resolveHexColor(
          declarations["background-color"] ?? "",
          theme.effectiveTokens,
        );
        expect(
          ground,
          `the ${label} ground must resolve to a hex colour in the ${theme.name} theme`,
        ).not.toBeNull();
        expect(
          ground,
          `the ${label} must paint the solid scrim in the ${theme.name} theme`,
        ).toEqual(scrim);
      }

      // Every text on the scrim uses the scrim's ink and clears 4.5:1.
      for (const [label, declarations] of [
        [".hero-text", heroText],
        [".hero h1", heroHeading],
        [".hero-kicker", heroKicker],
        ["nav a", navLink],
        ...chips,
      ] as const) {
        const colour = resolveHexColor(
          declarations["color"] ?? "",
          theme.effectiveTokens,
        );
        expect(
          colour,
          `the ${label} colour must resolve to a hex colour in the ${theme.name} theme`,
        ).not.toBeNull();
        expect(
          colour,
          `${label} must paint the scrim ink in the ${theme.name} theme`,
        ).toEqual(ink);
        if (colour !== null) {
          expect(
            contrastRatio(colour, scrim),
            `${theme.name}: ${label} on the scrim`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }

      // The muted ink: the review line and the visited story links.
      for (const [label, declarations] of [
        [".hero-review", heroReview],
        ["nav a:visited", navLinkVisited],
      ] as const) {
        const colour = resolveHexColor(
          declarations["color"] ?? "",
          theme.effectiveTokens,
        );
        expect(
          colour,
          `the ${label} colour must resolve to a hex colour in the ${theme.name} theme`,
        ).not.toBeNull();
        expect(
          colour,
          `${label} must paint the muted scrim ink in the ${theme.name} theme`,
        ).toEqual(mutedInk);
        if (colour !== null) {
          expect(
            contrastRatio(colour, scrim),
            `${theme.name}: ${label} on the scrim`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }

      // The story-link border clears 3:1 on the pill it edges.
      const border = /solid\s+(.+)$/.exec(navLink["border"] ?? "");
      expect(border, "nav a must set a solid border").not.toBeNull();
      if (border !== null) {
        const borderColour = resolveHexColor(
          border[1].trim(),
          theme.effectiveTokens,
        );
        expect(
          borderColour,
          `the nav a border must be a hex colour in the ${theme.name} theme`,
        ).not.toBeNull();
        if (borderColour !== null) {
          expect(
            contrastRatio(borderColour, scrim),
            `${theme.name}: the story-link border on the scrim`,
          ).toBeGreaterThanOrEqual(3);
        }
      }

      // The active story link: scrim-coloured text on the one filled
      // pill, never the light-blue accent on white.
      const activeColour = resolveHexColor(
        activeLink["color"] ?? "",
        theme.effectiveTokens,
      );
      const activeGround = resolveHexColor(
        activeLink["background-color"] ?? "",
        theme.effectiveTokens,
      );
      expect(
        activeColour,
        `the active link colour must be a hex colour in the ${theme.name} theme`,
      ).not.toBeNull();
      expect(
        activeGround,
        `the active link ground must be a hex colour in the ${theme.name} theme`,
      ).not.toBeNull();
      if (activeColour !== null && activeGround !== null) {
        expect(
          activeColour,
          `the active link text is the scrim colour in the ${theme.name} theme`,
        ).toEqual(scrim);
        expect(
          activeGround,
          `the active link fill is the scrim ink in the ${theme.name} theme`,
        ).toEqual(ink);
        expect(
          contrastRatio(activeColour, activeGround),
          `${theme.name}: the active story link on its own filled pill`,
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          activeColour,
          "#55bbeb must never be text on white",
        ).not.toEqual([85, 187, 235]);
      }

      // The illustration frame keeps its own raised card, so the picture
      // reads as a composed element on the image.
      const heroFrame = resolveHexColor(
        heroMedia["background-color"] ?? "",
        theme.effectiveTokens,
      );
      expect(
        heroFrame,
        `the .hero-media frame must paint the raised surface in the ${theme.name} theme`,
      ).toEqual(tokenColor(theme, "surface-raised"));
    }
  });

  it("keeps the dark scrim darker than the light scrim, with light ink on both", () => {
    const lightScrim = tokenColor(lightTheme, "scrim");
    const darkScrim = tokenColor(darkTheme, "scrim");
    expect(
      relativeLuminance(darkScrim),
      "the dark theme's scrim must be darker than the light theme's",
    ).toBeLessThan(relativeLuminance(lightScrim));
    for (const theme of themes) {
      for (const name of ["ink-on-scrim", "ink-muted-on-scrim"] as const) {
        expect(
          relativeLuminance(tokenColor(theme, name)),
          `--${name} must be lighter than the scrim in the ${theme.name} theme`,
        ).toBeGreaterThan(relativeLuminance(tokenColor(theme, "scrim")));
      }
    }
  });

  it("paints the focus ring inside the header and the hero with the scrim's ink, at 3:1 or better", () => {
    // Every focusable control in the header sits on a scrim pill, so the
    // ring there uses the scrim's own ink, which clears 3:1 on the scrim
    // in both themes, with the global width and offset unchanged.
    const bandFocus = parseDeclarations(
      cssRuleBody(globalCss, "header :focus-visible, .hero :focus-visible"),
    );
    for (const theme of themes) {
      const outlineColour = resolveHexColor(
        bandFocus["outline-color"] ?? "",
        theme.effectiveTokens,
      );
      expect(
        outlineColour,
        `the header focus ring colour must resolve to a hex colour in the ${theme.name} theme`,
      ).not.toBeNull();
      expect(
        outlineColour,
        `the header focus ring must paint the scrim's own ink in the ${theme.name} theme`,
      ).toEqual(tokenColor(theme, "ink-on-scrim"));
      if (outlineColour !== null) {
        expect(
          contrastRatio(outlineColour, tokenColor(theme, "scrim")),
          `the focus ring beside the scrim (${theme.name})`,
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("paints the alternating section bands: the page surface and the pale band, never the same tone twice", () => {
    const band = parseDeclarations(cssRuleBody(globalCss, ".band"));
    const bandAlt = parseDeclarations(cssRuleBody(globalCss, ".band-alt"));

    for (const theme of themes) {
      const plain = resolveHexColor(
        band["background-color"] ?? "",
        theme.effectiveTokens,
      );
      const alternate = resolveHexColor(
        bandAlt["background-color"] ?? "",
        theme.effectiveTokens,
      );
      expect(
        plain,
        `the .band ground must resolve to a hex colour in the ${theme.name} theme`,
      ).not.toBeNull();
      expect(
        alternate,
        `the .band-alt ground must resolve to a hex colour in the ${theme.name} theme`,
      ).not.toBeNull();
      expect(
        plain,
        `the plain band must paint the page surface in the ${theme.name} theme`,
      ).toEqual(tokenColor(theme, "surface-page"));
      expect(
        alternate,
        `the alternating band must paint the pale band in the ${theme.name} theme`,
      ).toEqual(tokenColor(theme, "surface-raised"));
      // The two bands read apart, so the page is an alternating stack.
      expect(alternate).not.toEqual(plain);
    }
  });

  it("uses the reference's two box shapes: 5 px rounded cards and 23 px pill story links", () => {
    // The card radius token is the reference's 5 px rounded rectangle,
    // and the story links are its 23 px pill.
    const cardRadius = /^(\d+(?:\.\d+)?)rem$/.exec(
      lightTheme.tokens["radius-card"] ?? "",
    );
    expect(cardRadius, "--radius-card must be a rem value").not.toBeNull();
    if (cardRadius !== null) {
      expect(
        Number(cardRadius[1]) * 16,
        "--radius-card must be the reference's 5 px rounded rectangle",
      ).toBeCloseTo(5, 5);
    }

    const navLink = parseDeclarations(cssRuleBody(globalCss, "nav a"));
    const pill = resolveCssValue(
      navLink["border-radius"] ?? "",
      lightTheme.effectiveTokens,
    ).trim();
    const pillRem = /^(\d+(?:\.\d+)?)rem$/.exec(pill);
    expect(pillRem, "the story links must use a rem pill radius").not.toBeNull();
    if (pillRem !== null) {
      expect(
        Number(pillRem[1]) * 16,
        "the story links must use the reference's 23 px pill",
      ).toBeCloseTo(23, 5);
    }
  });

  it("keeps the headline band on the accent, and the decorative accents out of the text colours", () => {
    for (const theme of themes) {
      // The headline band is the accent itself, in both themes, so the
      // ink that sits on it always has the accent's contrast.
      expect(
        tokenColor(theme, "surface-band"),
        `the headline band must be the accent colour in the ${theme.name} theme`,
      ).toEqual(tokenColor(theme, "accent-primary"));
    }

    // The reference's remaining accents are decorative fills: they carry
    // no text, because as text colours they would fall below the 4.5:1
    // floor.
    for (const name of [
      "accent-secondary",
      "accent-tertiary",
      "accent-warm",
      "accent-emphasis",
    ] as const) {
      expect(
        cssNoComments,
        `--${name} must not be used as a text colour`,
      ).not.toMatch(new RegExp(`color\\s*:\\s*var\\(--${name}\\)`));
    }
  });

  it("underlines links and keeps a solid accent focus outline of at least 2 px with an offset", () => {
    const link = parseDeclarations(cssRuleBody(globalCss, "a"));
    expect(link["text-decoration"] ?? "").toContain("underline");

    const focus = parseDeclarations(cssRuleBody(globalCss, ":focus-visible"));
    const outline = /(\d+(?:\.\d+)?)px\s+solid\s+(.+)$/.exec(
      focus["outline"] ?? "",
    );
    expect(outline, ":focus-visible must set a solid outline").not.toBeNull();
    if (outline === null) {
      return;
    }
    const widthPx = Number(outline[1]);
    expect(widthPx, "focus outline width").toBeGreaterThanOrEqual(2);
    expect(
      focus["outline-offset"],
      "focus outline needs an offset",
    ).toBeDefined();

    for (const theme of themes) {
      const outlineColour = resolveHexColor(outline[2].trim(), theme.effectiveTokens);
      expect(
        outlineColour,
        `focus outline colour must be a hex colour in the ${theme.name} theme`,
      ).not.toBeNull();
      if (outlineColour !== null) {
        expect(
          outlineColour,
          `focus outline must be the strong accent colour in the ${theme.name} theme`,
        ).toEqual(tokenColor(theme, "accent-primary-strong"));
        // A focus indicator is a non-text UI boundary: 3:1 at minimum.
        expect(
          contrastRatio(outlineColour, tokenColor(theme, "surface-page")),
          `focus outline on the page surface (${theme.name})`,
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("keeps comfortable reading rhythm and a 60 to 75 character measure", () => {
    const body = parseDeclarations(cssRuleBody(globalCss, "body"));

    const lineHeight = Number(body["line-height"]);
    expect(Number.isFinite(lineHeight), "body line-height must be a number").toBe(true);
    expect(lineHeight, "body line-height").toBeGreaterThanOrEqual(1.5);

    const fontSize = /^(\d+(?:\.\d+)?)rem$/.exec(body["font-size"] ?? "");
    expect(fontSize, "body font-size must be a rem value").not.toBeNull();
    if (fontSize !== null) {
      expect(Number(fontSize[1]), "body font-size").toBeGreaterThanOrEqual(1);
    }

    const measure = /^(\d+(?:\.\d+)?)rem$/.exec(
      lightTheme.tokens["measure"] ?? "",
    );
    expect(measure, "--measure must be a rem value").not.toBeNull();
    if (measure !== null) {
      const rem = Number(measure[1]);
      expect(rem, "--measure (about 60 to 75 characters per line)").toBeGreaterThanOrEqual(38);
      expect(rem, "--measure (about 60 to 75 characters per line)").toBeLessThanOrEqual(42);
    }

    // The page is wider than the reading column: main spans the page
    // shell, which is a rem value between 60rem and 90rem (the reference's
    // own centred container, which ADR 0008 replaces the old 72 to 80rem
    // shell with) and wider than the measure...
    const pageShell = /^(\d+(?:\.\d+)?)rem$/.exec(
      lightTheme.tokens["page-shell"] ?? "",
    );
    expect(pageShell, "--page-shell must be a rem value").not.toBeNull();
    if (pageShell !== null) {
      expect(
        Number(pageShell[1]),
        "--page-shell (the wide page, 60 to 90rem)",
      ).toBeGreaterThanOrEqual(60);
      expect(
        Number(pageShell[1]),
        "--page-shell (the wide page, 60 to 90rem)",
      ).toBeLessThanOrEqual(90);
      if (measure !== null) {
        expect(
          Number(pageShell[1]),
          "--page-shell must be wider than --measure",
        ).toBeGreaterThan(Number(measure[1]));
      }
    }

    const main = parseDeclarations(cssRuleBody(globalCss, "main"));
    expect(
      main["max-width"] ?? "",
      "main must span the page shell (the wider page)",
    ).toContain("var(--page-shell)");

    // The wide top section spans that wider page too: the hero is capped
    // at the page shell, not the measure, so the large headline and the
    // framed illustration can use the width the reading column gives up
    // (its text block stays capped at the measure, below).
    const hero = parseDeclarations(cssRuleBody(globalCss, ".hero"));
    expect(
      hero["max-width"] ?? "",
      ".hero must span the page shell (the wider page), not the measure",
    ).toContain("var(--page-shell)");

    // ...while the reading column is driven by the measure token: every
    // long-form block in main â€” paragraphs, headings, sections, the later
    // illustrations, the evidence panels, the sources block, and the
    // lifespan term list â€” and the hero's text block (the wide top
    // section lives inside main, as its first element) are each capped at
    // the measure and centered in the wider page.
    const readingColumnSelectors = [
      "main p",
      "main h2",
      "main section",
      ".hero-text",
      ".story-illustration",
      ".claim-evidence",
      ".lifespan-terms",
      ".sources",
    ];
    for (const selector of readingColumnSelectors) {
      const declarations = parseDeclarations(cssRuleBody(globalCss, selector));
      expect(
        declarations["max-width"] ?? "",
        `${selector} must be capped at the measure`,
      ).toContain("var(--measure)");
      expect(
        declarations["margin-inline"] ?? "",
        `${selector} must center the reading column in the wider page`,
      ).toContain("auto");
    }
  });

  it("uses rounded cards for the evidence panels and the framed blocks", () => {
    for (const selector of cardSelectors) {
      const declarations = parseDeclarations(cssRuleBody(globalCss, selector));
      const radius = (declarations["border-radius"] ?? "").trim();
      expect(
        radius.length > 0,
        `${selector} must set a border-radius (rounded cards)`,
      ).toBe(true);
      for (const theme of themes) {
        const resolved = resolveCssValue(radius, theme.effectiveTokens).trim();
        const rem = /^(\d+(?:\.\d+)?)rem$/.exec(resolved);
        expect(
          rem,
          `${selector} border-radius must resolve to a rem value in the ${theme.name} theme`,
        ).not.toBeNull();
        if (rem !== null) {
          expect(
            Number(rem[1]),
            `${selector} border-radius must be greater than 0`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  it("declares color-scheme for native UI, with the dark palette only under the reader's system setting", () => {
    expect(
      lightTheme.rootDeclarations["color-scheme"],
      "the light :root must declare color-scheme: light",
    ).toBe("light");
    expect(
      darkTheme.rootDeclarations["color-scheme"],
      "the dark :root must declare color-scheme: dark",
    ).toBe("dark");
    // The dark palette exists, and only inside the system-setting media
    // block.
    expect(
      mediaBlockBody(globalCss, "(prefers-color-scheme: dark)"),
      "the dark theme must be gated on prefers-color-scheme: dark",
    ).not.toBe("");
  });

  it("declares animation and transition only for readers without a reduced-motion preference", () => {
    const condition = "(prefers-reduced-motion: no-preference)";
    const media = `@media ${condition}`;
    const normalized = cssNoComments.replace(/\s+/g, " ");
    const inner = mediaBlockBody(normalized, condition);
    expect(inner, `${media} must exist`).not.toBe("");

    // Everything outside the reduced-motion gate is motion-free.
    const outer = normalized.replace(`${media} {${inner}}`, " ");
    expect(outer, "no animation outside the reduced-motion gate").not.toMatch(
      /\banimation\s*:/i,
    );
    expect(outer, "no transition outside the reduced-motion gate").not.toMatch(
      /\btransition\s*:/i,
    );
    expect(outer, "no keyframes outside the reduced-motion gate").not.toMatch(
      /@keyframes/,
    );

    // The gated motion is present, short (at most 5 s), and never loops.
    const animations = [...inner.matchAll(/\banimation\s*:\s*([^;]+);/g)].map(
      (match) => match[1].trim(),
    );
    expect(
      animations.length,
      "the gated block must declare the decorative motion",
    ).toBeGreaterThan(0);
    for (const value of animations) {
      expect(value, "gated animation must not loop forever").not.toMatch(/infinite/);
      // The iteration count is a bare integer: it must not exceed one.
      for (const token of value.split(/\s+/)) {
        if (/^\d+$/.test(token)) {
          expect(Number(token), "gated animation must not repeat").toBeLessThanOrEqual(
            1,
          );
        }
      }
      // The first time value is the duration: at most 5 seconds.
      const time = /(\d+(?:\.\d+)?)\s*(ms|s)\b/.exec(value);
      const seconds =
        time === null
          ? 0
          : time[2] === "ms"
            ? Number(time[1]) / 1000
            : Number(time[1]);
      expect(seconds, "gated animation duration").toBeLessThanOrEqual(5);
    }
  });

  it("replaces the old navy-only treatment and keeps the stylesheet structurally clean", () => {
    // The legacy link colour must be gone from the whole stylesheet,
    // including comments.
    expect(globalCss.toLowerCase()).not.toContain("#0b3d91");

    // No viewport-width units and no text-transform: navigation labels
    // stay exactly their copy. Checked on the declarations (comments
    // stripped) so the file's own documentation of these rules cannot
    // trip the checks.
    expect(cssNoComments).not.toMatch(/100vw/);
    expect(cssNoComments).not.toMatch(/\btext-transform\s*:/i);

    // No min-width above 320 px, so 320 px viewports never scroll
    // sideways. The value character set excludes parentheses and braces
    // so media query conditions like "(min-width: 640px)" are not
    // mistaken for declarations.
    for (const match of cssNoComments.matchAll(
      /min-width\s*:\s*([^;{()]+);/gi,
    )) {
      const value = match[1].trim();
      let pixels = 0;
      const rem = /^(\d+(?:\.\d+)?)rem$/.exec(value);
      const px = /^(\d+(?:\.\d+)?)px$/.exec(value);
      if (rem !== null) {
        pixels = Number(rem[1]) * 16;
      } else if (px !== null) {
        pixels = Number(px[1]);
      } else if (value === "0") {
        pixels = 0;
      } else {
        throw new Error(`Unparseable min-width value: "${value}"`);
      }
      expect(pixels, `min-width: ${value}`).toBeLessThanOrEqual(320);
    }
  });
});
