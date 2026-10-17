import type { Metadata } from "next";
import { getSitePage } from "../lib/site-content";
import StoryPage from "../components/story-page";

const homePage = getSitePage("home");

export const metadata: Metadata = {
  // Absolute so the browser title is exactly "AI and longer lives" and the
  // layout template cannot drop or rewrap that substring.
  title: { absolute: "AI and longer lives" },
  description: homePage.description,
};

export default function HomePage() {
  return <StoryPage page={homePage} />;
}
