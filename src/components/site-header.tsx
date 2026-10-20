import Link from "next/link";
import {
  nextStory,
  sitePageForPath,
  sitePages,
  storyPositionLabel,
} from "../lib/site-content";

/**
 * Shared site chrome for every page.
 *
 * This is a server component (no "use client"). It renders, in keyboard
 * order:
 *
 * 1. the skip link (the first focusable control) targeting
 *    `main#main-content`, which the story pages make focusable with
 *    `tabindex="-1"`;
 * 2. one `<header>` containing exactly one `<nav aria-label="Main">` with
 *    one link per entry in `sitePages`, in reading order, and nothing else
 *    — no other links before, between, or inside the five;
 * 3. inside the same header, after the nav, the reading-progress cluster:
 *    the exact "Story N of 5" position label, and either a next-story cue
 *    (a link to the next story's path with its nav label, stories 1 to 4)
 *    or the ending state "End of the stories" on story 5. The cluster is
 *    a plain paragraph, not a second navigation, and it never puts a link
 *    ahead of the five story links in keyboard order.
 *
 * Current-page highlight: the header is rendered by each route's page
 * (server component) with the route's own path, so the server always knows
 * the current page. The path is resolved with the pure `sitePageForPath`
 * helper, and exactly one link — the current story's — carries
 * `aria-current="page"`. The other four links never carry it. The active
 * treatment is not colour alone: globals.css adds weight and an inset rule
 * to `nav a[aria-current="page"]`. When `currentPath` is omitted (for
 * example in source-level tests that render the header on its own) no link
 * is marked current and the progress cluster is not rendered, but the
 * skip link and the five story links are always present.
 *
 * Note on request APIs: in this Next 16 project `headers()` inside a
 * server component exposes only the incoming browser headers
 * (user-agent, host, forwarding headers) — verified against a live server
 * — and Next strips its internal `next-url` header for non-interception
 * routes, so the request path cannot be read from a server-only request
 * API on the initial render. Passing the route's own path from the page
 * is the equivalent, deterministic, server-side mechanism; every route is
 * statically rendered per path, so the active link is correct both in the
 * initial server-rendered HTML and after client-side navigation.
 */
export default function SiteHeader({
  currentPath,
}: {
  /** The route path this header instance is being rendered for. */
  readonly currentPath?: string;
}) {
  const current = currentPath === undefined ? null : sitePageForPath(currentPath);
  const next = current === null ? null : nextStory(current.id);
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header>
        <nav aria-label="Main">
          <ul>
            {sitePages.map((page) => (
              <li key={page.id}>
                <Link
                  href={page.path}
                  aria-current={
                    current !== null && page.id === current.id
                      ? "page"
                      : undefined
                  }
                >
                  {page.navLabel}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {current !== null && (
          <p className="progress-cluster">
            <span className="story-position">
              {storyPositionLabel(current.id)}
            </span>
            {next === null ? (
              <span className="progress-ending">End of the stories</span>
            ) : (
              <span className="next-story-cue">
                Next story: <Link href={next.path}>{next.navLabel}</Link>
              </span>
            )}
          </p>
        )}
      </header>
    </>
  );
}
