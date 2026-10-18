/**
 * Design-token safeguards for the editorial design system in
 * src/app/globals.css.
 *
 * The milestone replaced the old fixed colour strings with a token-driven
 * palette, so this test parses globals.css and verifies the design from
 * the tokens themselves:
 *
 * 1. the token set exists: warm neutral surfaces (page, raised,
 *    evidence-panel), dark ink (heading, body, muted), the restrained
 *    teal accent with a depth step, muted warm rules, and the long-form
 *    measure;
 * 2. the palette is a warm editorial set, not pure white: the page
 *    surface is not #ffffff, the three surfaces are pairwise distinct,
 *    and the page and raised surfaces read warm (red over blue);
 * 3. every text/background pair used for body text, headings, muted
 *    meta, links (including visited), and the evidence panel meets WCAG
 *    2.2 AA: 4.5:1 for normal text;
 * 4. UI boundaries meet the 3:1 non-text minimum: the strong warm rule
 *    on every surface, and the accent on the page surface;
 * 5. the base interaction rules hold: underlined links, a :focus-visible
 *    outline of at least 2 px in the accent with an offset, body
 *    line-height of at least 1.5 and font-size of at least 1rem, and a
 *    long-form measure between 38rem and 42rem driving the content
 *    column width;
 * 6. the old navy-only treatment is gone: the legacy link colour
 *    #0b3d91 appears nowhere in the stylesheet;
 * 7. structural hygiene: no 100vw, no min-width above 320 px, no
 *    animation property, and no text-transform anywhere (navigation
 *    labels stay exactly their copy).
 *
 * Node-only: it reads one file and does arithmetic. It never launches a
 * browser.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  cssRuleBody,
  parseCustomProperties,
  parseDeclarations,
  parseHexColor,
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

/** The design tokens declared in the :root rule, keyed without "--". */
const tokens = parseCustomProperties(cssRuleBody(globalCss, ":root"));

/** Resolve one token (with or without the -- prefix) to an RGB triple. */
function tokenColor(name: string): Rgb {
  const colour = resolveHexColor(`var(--${name})`, tokens);
  if (colour === null) {
    throw new Error(`Design token --${name} is missing or is not a hex colour`);
  }
  return colour;
}

/** The names of every colour token this test reasons about. */
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

describe("design tokens in globals.css", () => {
  it("declares the full editorial token set", () => {
    for (const name of requiredColorTokens) {
      expect(tokens[name], `--${name} must be declared in :root`).toBeDefined();
      expect(tokenColor(name)).toBeDefined();
    }
    expect(tokens["measure"], "--measure must be declared in :root").toBeDefined();
  });

  it("uses a warm neutral set of surfaces, not pure white", () => {
    const page = tokenColor("surface-page");
    const raised = tokenColor("surface-raised");
    const evidence = tokenColor("surface-evidence");

    // The page surface is not pure white...
    expect(page).not.toEqual([255, 255, 255]);
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

  it("meets WCAG 2.2 AA (4.5:1) for every normal-text pair", () => {
    const pairs: ReadonlyArray<readonly [string, string, string]> = [
      // [foreground, background, where it is used]
      ["ink-body", "surface-page", "body text on the page"],
      ["ink-body", "surface-raised", "body text on the raised chrome"],
      ["ink-body", "surface-evidence", "body text in the evidence panel"],
      ["ink-heading", "surface-page", "headings on the page"],
      ["ink-heading", "surface-evidence", "evidence captions in the panel"],
      ["ink-muted", "surface-page", "muted meta text on the page"],
      ["ink-muted", "surface-raised", "muted meta text on the raised chrome"],
      ["ink-muted", "surface-evidence", "muted meta text in the evidence panel"],
      ["accent-teal", "surface-page", "links on the page"],
      ["accent-teal", "surface-raised", "links in the header"],
      ["accent-teal", "surface-evidence", "citations in the evidence panel"],
      ["accent-teal-deep", "surface-page", "visited links on the page"],
      ["accent-teal-deep", "surface-raised", "visited links in the header"],
      ["accent-teal-deep", "surface-evidence", "visited citations in the panel"],
    ];
    for (const [foreground, background, usage] of pairs) {
      const ratio = contrastRatio(tokenColor(foreground), tokenColor(background));
      expect(ratio, `${usage}: --${foreground} on --${background}`).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });

  it("meets the 3:1 non-text minimum for meaningful UI boundaries", () => {
    for (const background of [
      "surface-page",
      "surface-raised",
      "surface-evidence",
    ] as const) {
      const ratio = contrastRatio(
        tokenColor("rule-strong"),
        tokenColor(background),
      );
      expect(
        ratio,
        `--rule-strong on --${background} (evidence panel and hero frame borders)`,
      ).toBeGreaterThanOrEqual(3);
    }
    const accent = contrastRatio(
      tokenColor("accent-teal"),
      tokenColor("surface-page"),
    );
    expect(
      accent,
      "--accent-teal on --surface-page (skip link border, active indicator)",
    ).toBeGreaterThanOrEqual(3);
  });

  it("underlines links and keeps a solid accent focus outline of at least 2 px", () => {
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
    const outlineColour = resolveHexColor(outline[2].trim(), tokens);
    expect(outlineColour, "focus outline colour must be a hex colour").not.toBeNull();
    if (outlineColour !== null) {
      expect(
        outlineColour,
        "focus outline must be the accent colour",
      ).toEqual(tokenColor("accent-teal"));
    }
    expect(focus["outline-offset"], "focus outline needs an offset").toBeDefined();
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

    const measure = /^(\d+(?:\.\d+)?)rem$/.exec(tokens["measure"] ?? "");
    expect(measure, "--measure must be a rem value").not.toBeNull();
    if (measure !== null) {
      const rem = Number(measure[1]);
      expect(rem, "--measure (characters per line at 1rem)").toBeGreaterThanOrEqual(38);
      expect(rem, "--measure (characters per line at 1rem)").toBeLessThanOrEqual(42);
    }

    // The content column width is driven by the measure token.
    const main = parseDeclarations(cssRuleBody(globalCss, "main"));
    expect(main["max-width"] ?? "").toContain("var(--measure)");
  });

  it("replaces the old navy-only treatment and keeps the stylesheet structurally clean", () => {
    // The legacy link colour must be gone from the whole stylesheet,
    // including comments.
    expect(globalCss.toLowerCase()).not.toContain("#0b3d91");

    // No viewport-width units, no animation, no text-transform:
    // navigation labels stay exactly their copy and nothing required
    // moves. Checked on the declarations (comments stripped) so the
    // file's own documentation of these rules cannot trip the checks.
    expect(cssNoComments).not.toMatch(/100vw/);
    expect(cssNoComments).not.toMatch(/\banimation\s*:/i);
    expect(cssNoComments).not.toMatch(/\btext-transform\s*:/i);

    // No min-width above 320 px, so 320 px viewports never scroll sideways.
    // The value character set excludes parentheses and braces so media
    // query conditions like "(min-width: 640px)" are not mistaken for
    // declarations.
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

    // The palette tokens are real hex colours, not typos.
    for (const name of requiredColorTokens) {
      expect(parseHexColor(tokens[name] ?? ""), `--${name} must be a hex colour`).not.toBeNull();
    }
  });
});
