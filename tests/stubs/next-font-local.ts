/**
 * Test double for `next/font/local`, aliased in vitest.config.mts.
 *
 * In this Next 16 build, `next/font/local` is a build-time loader target:
 * the published `index.js` is an empty placeholder, and the real
 * `localFont` implementation runs only inside Next's compiler (it reads
 * the font file, emits it to the build output, and generates the
 * `@font-face` CSS). Under plain Node — which is what vitest uses — the
 * import resolves to an empty module, so any test that reaches
 * `src/lib/fonts.ts` through the root layout (for example
 * tests/accessibility-essentials.test.ts) would crash on a missing
 * function.
 *
 * This double reproduces the small surface the layout actually consumes:
 * the `variable` option is echoed back as the class name that carries
 * the font's CSS custom property, and `style.fontFamily` reports the
 * family. No font file is read and nothing is emitted: the source-level
 * tests assert on markup and on the tokens in globals.css, never on
 * generated `@font-face` rules.
 */

export interface LocalFontOptions {
  readonly src:
    | string
    | ReadonlyArray<{ readonly path: string; readonly weight?: string; readonly style?: string }>;
  readonly weight?: string;
  readonly style?: string;
  readonly display?: string;
  readonly variable?: string;
  readonly preload?: boolean;
  readonly fallback?: readonly string[];
}

export interface LocalFontResult {
  /** The class name that applies the font (Next sets the variable on it). */
  readonly className: string;
  /** The CSS custom property the font is exposed through, if requested. */
  readonly variable: string | null;
  /** Inline style form of the same font family. */
  readonly style: { readonly fontFamily: string };
}

/** Stand-in for Next's localFont: echoes the variable, skips all file I/O. */
export default function localFont(options: LocalFontOptions): LocalFontResult {
  const variable = options.variable ?? null;
  return {
    className: variable ?? "next-font-local-stub",
    variable,
    style: { fontFamily: "Inter" },
  };
}
