import type { Metadata } from "next";
import "./globals.css";
import { bodyFont, headingFont } from "../lib/fonts";

export const metadata: Metadata = {
  title: {
    default: "AI and longer lives",
    template: "%s | AI and longer lives",
  },
  description:
    "An educational demo exploring how AI is expected to help doctors find disease earlier, choose treatments more carefully, and move research along faster. It is not medical advice, not a diagnosis, and not a guarantee.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The font classes set the --font-body and --font-heading CSS custom
    // properties on <html>; globals.css consumes them from there.
    //
    // The shared header (skip link + main nav + reading progress) is not
    // rendered here: it must know the current page to mark exactly one
    // link with aria-current="page", and a shared layout cannot know which
    // child page is being rendered. Each route is a static server
    // component that knows its own path, so it renders <SiteHeader
    // currentPath={...} /> immediately before its <StoryPage>, keeping the
    // skip link first in keyboard order. See docs/adr/0006-science-
    // editorial-reading-progress.md.
    <html lang="en" className={`${bodyFont.variable} ${headingFont.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
