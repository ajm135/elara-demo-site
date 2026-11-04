import localFont from "next/font/local";

/**
 * The site's local typefaces, loaded from the committed files in
 * src/app/fonts/:
 *
 * - **Inter** (SIL Open Font License 1.1 — see
 *   src/app/fonts/LICENSE.md) carries the body text.
 * - **Asap** (SIL Open Font License 1.1 — see
 *   src/app/fonts/OFL.txt and src/app/fonts/asap-note.md) carries the
 *   headings. Asap is the headline family of the visual reference for
 *   the new look (https://demo.templatemonster.com/demo/55809.html),
 *   and that family is itself under the SIL Open Font License, so it is
 *   used as it is.
 *
 * This is a server-only module consumed by the root layout
 * (src/app/layout.tsx), which is a server component: it uses
 * next/font/local so the font files are bundled and served by this
 * computer's own server, with no remote stylesheet, no @import, and no
 * JavaScript required for reading. Each `localFont` call exposes the
 * typeface through a CSS custom property (--font-body, --font-heading)
 * that src/app/globals.css consumes, so the tokenized styles pick the
 * fonts up without any per-component class juggling.
 *
 * The committed files are static single-weight builds for the body text
 * (Inter 400 and 700): no variable-font master was available on this
 * computer and the milestone forbids fetching fonts, so the body role
 * is carried by two fixed weights of the same family instead of one
 * variable axis. The heading face is the Asap variable build, whose
 * weight axis (100–900) is declared to next/font/local as the range
 * "100 900", so the headings can take any weight the stylesheet asks
 * for from that one file.
 *
 * Note for the Node test environment: in Next 16 `next/font/local` is a
 * build-time loader target — the function is real only inside Next's
 * compiler, and the published module does not run under plain Node. The
 * vitest config (vitest.config.mts) aliases `next/font/local` to a
 * small double in tests/stubs/ that returns the same
 * className/variable/style surface, so this module stays importable
 * from the root layout in source-level tests.
 */

export const bodyFont = localFont({
  src: "../app/fonts/inter-regular.ttf",
  weight: "400",
  style: "normal",
  variable: "--font-body",
});

export const headingFont = localFont({
  src: "../app/fonts/asap-variable.ttf",
  weight: "100 900",
  style: "normal",
  variable: "--font-heading",
});
