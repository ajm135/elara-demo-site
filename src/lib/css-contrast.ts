/**
 * Pure helpers for checking the design tokens in src/app/globals.css.
 *
 * The token test suite (tests/design-tokens.test.ts) and the WCAG 2.2 AA
 * essentials test (tests/accessibility-essentials.test.ts) both need to
 * read CSS custom properties out of globals.css, resolve `var(...)`
 * references against them, and compute WCAG relative-luminance contrast
 * ratios for the token colour pairs. Everything here is plain text and
 * arithmetic: no I/O, no DOM, no browser, no UI.
 */

/** An RGB triple in 0–255 integer channels. */
export type Rgb = readonly [number, number, number];

/**
 * Parse a #rgb or #rrggbb hex colour (case-insensitive) into an RGB triple.
 * Returns null for anything else, so callers can fail loudly instead of
 * silently comparing an unparseable value.
 */
export function parseHexColor(value: string): Rgb | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (match === null) {
    return null;
  }
  let hex = match[1];
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const channels = [0, 2, 4].map((offset) =>
    Number.parseInt(hex.slice(offset, offset + 2), 16),
  );
  return [channels[0], channels[1], channels[2]] as const;
}

/**
 * WCAG 2.2 relative luminance of an sRGB colour (0–1 scale).
 * See https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
 */
export function relativeLuminance([red, green, blue]: Rgb): number {
  const linearize = (channel: number): number => {
    const srgb = channel / 255;
    return srgb <= 0.04045
      ? srgb / 12.92
      : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * linearize(red) +
    0.7152 * linearize(green) +
    0.0722 * linearize(blue)
  );
}

/**
 * WCAG 2.2 contrast ratio of two colours, from 1 (identical) to 21
 * (black on white). Commutative: the lighter colour goes on top.
 */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const luminanceA = relativeLuminance(a);
  const luminanceB = relativeLuminance(b);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * The `--token: value;` pairs declared in a CSS custom-property block
 * (e.g. the `:root` rule), keyed by the token name without the dashes
 * prefix: `{"surface-page": "#f6f1e7"}`. Repeated names: last one wins,
 * matching CSS behaviour.
 */
export function parseCustomProperties(block: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const match of block.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    tokens[match[1]] = match[2].trim();
  }
  return tokens;
}

/**
 * Extract the declaration body of the first flat CSS rule whose selector
 * matches exactly (after normalising whitespace and stripping comments).
 * Returns "" when no such rule exists.
 */
export function cssRuleBody(css: string, selector: string): string {
  const normalized = css
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\s+/g, " ");
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

/**
 * Extract the inner text of the first `@media` block whose condition
 * follows `@media ` (after normalising whitespace and stripping
 * comments): everything between the block's opening brace and its
 * matching closing brace, nested rules included. Returns "" when no such
 * block exists. The result is flat-readable: the inner rules can be
 * looked up with {@link cssRuleBody} and scanned with
 * {@link parseCustomProperties}.
 */
export function mediaBlockBody(css: string, condition: string): string {
  const normalized = css
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\s+/g, " ");
  const prefix = `@media ${condition} {`;
  const start = normalized.indexOf(prefix);
  if (start === -1) {
    return "";
  }
  const open = start + prefix.length - 1;
  let depth = 0;
  for (let index = open; index < normalized.length; index += 1) {
    const char = normalized[index];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return normalized.slice(open + 1, index);
      }
    }
  }
  return "";
}

/**
 * Split a rule body into `prop: value` pairs, keyed by lower-cased
 * property name. Repeated properties: last one wins, matching CSS.
 */
export function parseDeclarations(body: string): Record<string, string> {
  const declarations: Record<string, string> = {};
  for (const part of body.split(";")) {
    const colon = part.indexOf(":");
    if (colon === -1) {
      continue;
    }
    const property = part.slice(0, colon).trim().toLowerCase();
    const value = part.slice(colon + 1).trim();
    if (property.length > 0 && value.length > 0) {
      declarations[property] = value;
    }
  }
  return declarations;
}

/**
 * Resolve `var(--token)` and `var(--token, fallback)` references in a CSS
 * value against a custom-property map. Tokens that resolve to other
 * `var()` references are resolved recursively (bounded, to survive cycles);
 * a missing token falls back to the `var()` fallback, or to the empty
 * string when there is none.
 */
export function resolveCssValue(
  value: string,
  tokens: Record<string, string>,
  depth = 0,
): string {
  if (depth > 8) {
    return value;
  }
  return value.replace(
    /var\(\s*(--[\w-]+)\s*(?:,\s*([^)]*))?\)/g,
    (_all, name: string, fallback?: string) => {
      const tokenValue = tokens[name.replace(/^--/, "")];
      if (tokenValue !== undefined) {
        return resolveCssValue(tokenValue, tokens, depth + 1);
      }
      return fallback !== undefined ? fallback.trim() : "";
    },
  );
}

/**
 * Resolve one or more CSS colour values against a custom-property map and
 * parse each into an RGB triple. Returns null when any value does not
 * resolve to a #hex colour, so tests fail instead of comparing unknowns.
 */
export function resolveHexColor(
  value: string,
  tokens: Record<string, string>,
): Rgb | null {
  return parseHexColor(resolveCssValue(value, tokens));
}
