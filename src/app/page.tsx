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
  return (
    <>
      <SiteHeader currentPath={homePage.path} />
      <StoryPage page={homePage} />
    </>
  );
}
