import { existsSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sitePages } from "../src/lib/site-content";

/**
 * Map a public src such as "/images/x.svg" to the file it must exist as
 * under public/, i.e. "public/images/x.svg".
 */
function publicFileFor(src: string): string {
  const withoutLeadingSlash = src.startsWith("/") ? src.slice(1) : src;
  return `public/${withoutLeadingSlash}`;
}

describe("site images", () => {
  it("ships a non-empty favicon", () => {
    expect(existsSync("public/favicon.ico")).toBe(true);
    expect(statSync("public/favicon.ico").size).toBeGreaterThan(0);
  });

  it("points every image src in sitePages at an existing file under public/", () => {
    for (const page of sitePages) {
      for (const image of page.images) {
        expect(existsSync(publicFileFor(image.src)), `${page.id}: ${image.src}`).toBe(true);
      }
    }
  });
});
