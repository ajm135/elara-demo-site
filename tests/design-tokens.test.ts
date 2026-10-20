/**
 * Design-token safeguards for the dual-theme design system in
 * src/app/globals.css.
 *
 * The milestone replaced the single editorial palette with two full
 * palettes chosen only by the reader's system setting — the light theme
 * is the :root default and the dark theme redeclares the same colour
 * token names inside @media (prefers-color-scheme: dark) — so this test
 * parses globals.css and verifies the design from the tokens of both
 * themes:
 *
 * 1. the same colour token set exists in both themes — neutral surfaces
 *    (page, raised, evidence-panel), the ink (heading, body, muted), the
 *    teal accent with a depth step, and the rules — each a hex colour,
 *    with the shared layout tokens (measure, page shell, card radius) in
 *    the base set;
 * 2. the light palette keeps its warm editorial character: none of the
 *    surfaces is pure white, the three surfaces are pairwise distinct,
 *    and the page and raised surfaces read warm (red over blue); the
 *    dark palette is a deep surface set: the surfaces are pairwise
 *    distinct and darker than every ink;
 * 3. every text/background pair used for body text, headings, muted
 *    meta, links (including visited), citations, the skip-link text, and
 *    the header progress text meets WCAG 2.2 AA in both themes: 4.5:1
 *    for normal text;
 * 4. UI boundaries meet the 3:1 non-text minimum in both themes: the
 *    strong rule on every surface and the accent where it carries a
 *    meaningful border or the focus outline, plus the sources card's
 *    own border checked against its raised background;
 * 5. the base interaction rules hold: underlined links, a :focus-visible
 *    outline of at least 2 px in the accent with an offset that clears
 *    3:1 on the page surface in both themes, body line-height of at
 *    least 1.5 and font-size of at least 1rem, a long-form measure
 *    between 38rem and 42rem capping the reading column, and a page
 *    shell between 72rem and 80rem — wider than the measure — that main
 *    and the wide top section (the hero, the first element inside main)
 *    span, while every long-form block in main (paragraphs,
 *    headings, sections, the later illustrations, the evidence panels,
 *    the sources block, and the term list) and the hero's text block
 *    stay capped at the measure and centered;
 * 6. rounded cards: the evidence panels, the framed hero and story
 *    illustrations, and the home page sources block all set a positive
 *    border-radius from the shared radius token;
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
 * reader actually gets, the same way the browser computes it — the base
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
  "accent-teal",
  "accent-teal-deep",
  "rule-warm",
  "rule-strong",
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
    "surface-evidence",
    "evidence captions and lifespan terms in the panel",
  ],
  ["ink-muted", "surface-page", "muted meta (review date, disclaimer) on the page"],
  [
    "ink-muted",
    "surface-raised",
    "muted progress text (story position, ending state) on the raised chrome",
  ],
  ["ink-muted", "surface-evidence", "muted meta in the evidence panel"],
  ["accent-teal", "surface-page", "links and the hero kicker on the page"],
  ["accent-teal", "surface-raised", "links and the next-story cue in the header"],
  ["accent-teal", "surface-evidence", "citations in the evidence panel"],
  ["accent-teal-deep", "surface-page", "visited links on the page"],
  [
    "accent-teal-deep",
    "surface-raised",
    "visited links and the active-story link in the header",
  ],
  ["accent-teal-deep", "surface-evidence", "visited citations in the panel"],
] as const;

/**
 * The meaningful UI boundaries to verify at 3:1 in each theme:
 * [foreground, background, where it is used].
 */
const boundaryPairs = [
  ["rule-strong", "surface-page", "the strong rule on the page"],
  [
    "rule-strong",
    "surface-raised",
    "the evidence-panel, hero-frame, and sources-block borders on the raised chrome",
  ],
  ["rule-strong", "surface-evidence", "the evidence-panel border on the evidence surface"],
  ["accent-teal", "surface-page", "the focus outline on the page surface"],
  [
    "accent-teal",
    "surface-raised",
    "the skip-link border and the active-story indicator on the raised chrome",
  ],
  ["accent-teal", "surface-evidence", "the evidence panel's accent left edge"],
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

  it("keeps the light theme a warm, off-white set of distinct surfaces", () => {
    const page = tokenColor(lightTheme, "surface-page");
    const raised = tokenColor(lightTheme, "surface-raised");
    const evidence = tokenColor(lightTheme, "surface-evidence");

    // None of the surfaces is pure white...
    for (const [name, surface] of [
      ["surface-page", page],
      ["surface-raised", raised],
      ["surface-evidence", evidence],
    ] as const) {
      expect(surface, `--${name} must not be pure white`).not.toEqual([
        255, 255, 255,
      ]);
    }
    // ...the three surfaces are pairwise distinct, so the evidence panel
    // and the raised chrome read apart from the page.
    expect(raised).not.toEqual(page);
    expect(evidence).not.toEqual(page);
    expect(evidence).not.toEqual(raised);
    // The page and raised surfaces read warm: red channel over blue.
    for (const [name, surface] of [
      ["surface-page", page],
      ["surface-raised", raised],
    ] as const) {
      expect(surface[0], `--${name} must be warm (red >= blue)`).toBeGreaterThanOrEqual(
        surface[2],
      );
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
          `focus outline must be the accent colour in the ${theme.name} theme`,
        ).toEqual(tokenColor(theme, "accent-teal"));
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
    // shell, which is a rem value between 72rem and 80rem and wider than
    // the measure...
    const pageShell = /^(\d+(?:\.\d+)?)rem$/.exec(
      lightTheme.tokens["page-shell"] ?? "",
    );
    expect(pageShell, "--page-shell must be a rem value").not.toBeNull();
    if (pageShell !== null) {
      expect(
        Number(pageShell[1]),
        "--page-shell (the wide page, 72 to 80rem)",
      ).toBeGreaterThanOrEqual(72);
      expect(
        Number(pageShell[1]),
        "--page-shell (the wide page, 72 to 80rem)",
      ).toBeLessThanOrEqual(80);
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
    // long-form block in main — paragraphs, headings, sections, the later
    // illustrations, the evidence panels, the sources block, and the
    // lifespan term list — and the hero's text block (the wide top
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
