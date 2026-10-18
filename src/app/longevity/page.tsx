import type { Metadata } from "next";
import { getSitePage } from "../../lib/site-content";
import SiteHeader from "../../components/site-header";
import StoryPage from "../../components/story-page";

const page = getSitePage("longevity");

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
};

export default function LongevityPage() {
  // The route renders the shared header with its own path so the server
  // always knows the current page for the one aria-current="page" link and
  // the "Story N of 5" progress cue.
  return (
    <>
      <SiteHeader currentPath={page.path} />
      <StoryPage page={page} />
    </>
  );
}
