import type { Metadata } from "next";
import { getSitePage } from "../../lib/site-content";
import StoryPage from "../../components/story-page";

const page = getSitePage("diseases");

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
};

export default function DiseasesPage() {
  return <StoryPage page={page} />;
}
