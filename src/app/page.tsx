import type { Metadata } from "next";
import { getSitePage } from "../lib/site-content";
import SiteHeader from "../components/site-header";
import StoryPage from "../components/story-page";

const homePage = getSitePage("home");

export const metadata: Metadata = {
  // Absolute so the browser title is exactly "AI and longer lives" and the
  // layout template cannot drop or rewrap that substring.
  title: { absolute: "AI and longer lives" },
  description: homePage.description,
};

export default function HomePage() {
  // The route renders the shared header with its own path so the server
  // always knows the current page for the one aria-current="page" link and
  // the "Story N of 5" progress cue.
  //
  // The story frame is a plain, non-focusable wrapper that only names the
  // page's two original full-bleed background images for globals.css
  // (docs/adr/0009-background-images.md). The skip link inside SiteHeader
  // stays the first anchor on the page.
  return (
    <div className={`story-frame story-frame-${homePage.id}`}>
      <SiteHeader currentPath={homePage.path} />
      <StoryPage page={homePage} />
    </div>
  );
}
