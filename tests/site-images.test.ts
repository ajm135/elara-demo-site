import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { describe, expect, it } from "vitest";
import { sitePages, type SiteImageRef } from "../src/lib/site-content";

/**
 * Guards for the site's images.
 *
 * The first block checks the favicon and that every image src in
 * site-content.ts points at a file under public/.
 *
 * The second block guards the six story drawings in public/images/
 * (milestone 3, docs/adr/0008-reference-look.md). Each drawing must keep
 * its file name and size, stay a hand-made drawing of vector shapes only,
 * carry one non-empty <title> that the matching alt text in
 * site-content.ts repeats, and adapt to the dark theme with one in-file
 * @media (prefers-color-scheme: dark) rule instead of a second image file.
 * The checks read the six files as text and assert the absence of photos,
 * embedded rasters, visible text, scripts, fonts and external references.
 * They deliberately do not pin the palette's hex values.
 */

/**
 * Map a public src such as "/images/x.svg" to the file it must exist as
 * under public/, i.e. "public/images/x.svg".
 */
function publicFileFor(src: string): string {
  const withoutLeadingSlash = src.startsWith("/") ? src.slice(1) : src;
  return `public/${withoutLeadingSlash}`;
}

/** One of the six drawings: its file name and the size it must keep. */
interface DrawingSpec {
  readonly fileName: string;
  readonly width: number;
  readonly height: number;
}

/** The six story drawings, in reading order. */
const ILLUSTRATIONS: readonly DrawingSpec[] = [
  { fileName: "hopeful-future.svg", width: 1200, height: 630 },
  { fileName: "ai-in-medicine.svg", width: 1200, height: 630 },
  { fileName: "cancer-research.svg", width: 1200, height: 630 },
  { fileName: "cancer-hope.svg", width: 800, height: 600 },
  { fileName: "other-diseases.svg", width: 1200, height: 630 },
  { fileName: "longer-lives.svg", width: 1200, height: 630 },
];

/** Read one drawing as text. */
function readDrawing(fileName: string): string {
  return readFileSync(`public/images/${fileName}`, "utf-8");
}

/** The image reference in site-content.ts that points at one drawing. */
function imageRefFor(fileName: string): SiteImageRef {
  const ref = sitePages
    .flatMap((page) => page.images)
    .find((image) => image.src.endsWith(`/${fileName}`));
  expect(
    ref,
    `site-content.ts must reference an image ending in ${fileName}`,
  ).not.toBeUndefined();
  return ref as SiteImageRef;
}

/** The root <svg ...> opening tag of an SVG document. */
function rootSvgTag(svg: string): string {
  return /<svg\b[^>]*>/i.exec(svg)?.[0] ?? "";
}

/** The value of one quoted attribute on a tag, or null when absent. */
function attributeValue(tag: string, name: string): string | null {
  const match = new RegExp(
    `\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`,
    "i",
  ).exec(tag);
  if (match === null) {
    return null;
  }
  return match[1] !== undefined ? match[1] : match[2];
}

/** Runs of whitespace collapsed to single spaces, trimmed at both ends. */
function normalizeSpaces(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Escape a string so it can be used inside a RegExp. */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * The inner text of the "{" block that starts at openBraceIndex, outer
 * braces removed. Throws when the braces do not balance.
 */
function blockBody(source: string, openBraceIndex: number): string {
  let depth = 0;
  for (let index = openBraceIndex; index < source.length; index += 1) {
    const char = source[index] ?? "";
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openBraceIndex + 1, index);
      }
    }
  }
  throw new Error("The style block's braces do not balance");
}

/**
 * What a drawing must not contain: a photo or embedded raster, visible
 * text, foreign content, a script, or a font.
 */
const FORBIDDEN_MARKERS: readonly {
  readonly label: string;
  readonly pattern: RegExp;
}[] = [
  { label: "a <text> element (visible text)", pattern: /<text[\s/>]/i },
  {
    label: "an <image> element (photo or embedded raster)",
    pattern: /<image[\s/>]/i,
  },
  { label: "a <script> element", pattern: /<script[\s/>]/i },
  { label: "a <foreignObject> element", pattern: /<foreignobject[\s/>]/i },
  { label: "a font-family declaration", pattern: /font-family/i },
  { label: "an xlink:href reference", pattern: /xlink:href/i },
];

/** An embedded data: URI carrying a raster, font, script or text payload. */
const DATA_URI_PATTERN =
  /data:(?:image|font|text|application|audio|video|model)[a-z0-9+.-]*/i;

/** Every href attribute value in one drawing, in document order. */
function hrefValues(svg: string): string[] {
  return [...svg.matchAll(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)].map(
    (match) => (match[1] !== undefined ? match[1] : match[2]),
  );
}

describe("site images", () => {
  it("ships a non-empty favicon", () => {
    expect(existsSync("public/favicon.ico")).toBe(true);
    expect(statSync("public/favicon.ico").size).toBeGreaterThan(0);
  });

  it("points every image src in sitePages at an existing file under public/", () => {
    for (const page of sitePages) {
      for (const image of page.images) {
        expect(existsSync(publicFileFor(image.src)), `${page.id}: ${image.src}`).toBe(true);
      }
    }
  });
});

describe("the six story illustrations", () => {
  it("keeps exactly the six file names in public/images/, one file per drawing", () => {
    expect(readdirSync("public/images").sort()).toEqual(
      ILLUSTRATIONS.map((drawing) => drawing.fileName).sort(),
    );
  });

  it("keeps each drawing's size: width, height and viewBox", () => {
    for (const drawing of ILLUSTRATIONS) {
      const root = rootSvgTag(readDrawing(drawing.fileName));
      expect(root, `${drawing.fileName}: an <svg> root element`).not.toBe("");
      expect(
        attributeValue(root, "width"),
        `${drawing.fileName}: the width attribute`,
      ).toBe(String(drawing.width));
      expect(
        attributeValue(root, "height"),
        `${drawing.fileName}: the height attribute`,
      ).toBe(String(drawing.height));
      expect(
        attributeValue(root, "viewBox"),
        `${drawing.fileName}: the viewBox attribute`,
      ).toBe(`0 0 ${drawing.width} ${drawing.height}`);
    }
  });

  it("matches the size each page declares for it in site-content.ts", () => {
    for (const drawing of ILLUSTRATIONS) {
      const ref = imageRefFor(drawing.fileName);
      expect(
        ref.width,
        `${drawing.fileName}: the declared width`,
      ).toBe(drawing.width);
      expect(
        ref.height,
        `${drawing.fileName}: the declared height`,
      ).toBe(drawing.height);
    }
  });

  it("stays a hand-made vector drawing: no photos, rasters, visible text, scripts or fonts", () => {
    for (const drawing of ILLUSTRATIONS) {
      const svg = readDrawing(drawing.fileName);
      for (const marker of FORBIDDEN_MARKERS) {
        expect(
          svg,
          `${drawing.fileName}: must not contain ${marker.label}`,
        ).not.toMatch(marker.pattern);
      }
      expect(
        svg,
        `${drawing.fileName}: must not embed a data: URI`,
      ).not.toMatch(DATA_URI_PATTERN);
    }
  });

  it("references nothing outside the file: no remote or protocol-relative href", () => {
    for (const drawing of ILLUSTRATIONS) {
      const svg = readDrawing(drawing.fileName);
      for (const value of hrefValues(svg)) {
        expect(
          value,
          `${drawing.fileName}: an href must not point outside the file`,
        ).not.toMatch(/(https?|ftp):\/\//i);
        expect(
          value,
          `${drawing.fileName}: an href must not be protocol-relative`,
        ).not.toMatch(/^\//);
      }
    }
  });

  it("adapts to the dark theme with one in-file media rule, not a second image file", () => {
    for (const drawing of ILLUSTRATIONS) {
      const svg = readDrawing(drawing.fileName);
      const styleMatches = [
        ...svg.matchAll(/<style[^>]*>([\s\S]*?)<\/style\s*>/gi),
      ];
      expect(
        styleMatches.length,
        `${drawing.fileName}: exactly one <style> block`,
      ).toBe(1);
      const styleText = styleMatches[0]?.[1] ?? "";
      expect(
        (styleText.match(/@media/gi) ?? []).length,
        `${drawing.fileName}: exactly one @media rule`,
      ).toBe(1);
      const mediaQuery = /@media[^{]*\{/.exec(styleText);
      const darkRule = mediaQuery === null ? "" : mediaQuery[0];
      expect(
        darkRule,
        `${drawing.fileName}: the @media rule must target the dark theme`,
      ).toMatch(/prefers-color-scheme\s*:\s*dark/i);
      const darkBody = blockBody(
        styleText,
        mediaQuery === null ? -1 : mediaQuery.index + mediaQuery[0].length - 1,
      );
      expect(
        darkBody,
        `${drawing.fileName}: the dark rule must carry class-based fill or stroke overrides`,
      ).toMatch(/\.[a-z][a-z0-9-]*\s*\{[^}]*\b(fill|stroke)\s*:/i);
    }
  });

  it("has one non-empty <title> that the alt text in site-content.ts repeats", () => {
    for (const drawing of ILLUSTRATIONS) {
      const svg = readDrawing(drawing.fileName);
      const titles = (svg.match(/<title[^>]*>/gi) ?? []).length;
      expect(
        titles,
        `${drawing.fileName}: exactly one <title> element`,
      ).toBe(1);
      const picture = normalizeSpaces(
        /<title[^>]*>([\s\S]*?)<\/title\s*>/i.exec(svg)?.[1] ?? "",
      );
      expect(
        picture,
        `${drawing.fileName}: the <title> must not be empty`,
      ).not.toBe("");
      const alt = normalizeSpaces(imageRefFor(drawing.fileName).alt);
      expect(
        alt,
        `${drawing.fileName}: the alt text must start with the title's picture`,
      ).toMatch(new RegExp(`^${escapeRegExp(picture)}`));
    }
  });
});
