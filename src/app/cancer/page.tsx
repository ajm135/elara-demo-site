import type { Metadata } from "next";
import { getSitePage } from "../../lib/site-content";
import SiteHeader from "../../components/site-header";
import StoryPage from "../../components/story-page";

const page = getSitePage("cancer");

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
};

export default function CancerPage() {
  // The route renders the shared header with its own path so the server
  // always knows the current page for the one aria-current="page" link and
  // the "Story N of 5" progress cue.
  //
  // The story frame is a plain, non-focusable wrapper that only names the
  // page's two original full-bleed background images for globals.css
  // (docs/adr/0009-background-images.md). The skip link inside SiteHeader
  // stays the first anchor on the page.
  return (
    <div className={`story-frame story-frame-${page.id}`}>
      <SiteHeader currentPath={page.path} />
      <StoryPage page={page} />
    </div>
  );
}
