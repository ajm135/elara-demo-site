import Link from "next/link";
import { sitePages } from "../lib/site-content";

/**
 * Shared site chrome for every page.
 *
 * This is a server component (no "use client"): it renders a skip link that
 * jumps to the page's <main id="main-content">, then a header with one
 * navigation link per entry in `sitePages`, in reading order. There is no
 * current-page highlight and no client-side routing state.
 */
export default function SiteHeader() {
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
                <Link href={page.path}>{page.navLabel}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
    </>
  );
}
