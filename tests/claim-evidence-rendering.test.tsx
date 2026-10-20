/**
 * Rendered-HTML checks for the claim evidence blocks.
 *
 * For every consequential claim the rendered story markup must show,
 * immediately after the paragraph that makes the claim and still inside that
 * section: the evidence stage in reader language (clinical use,
 * experimental research, or speculation — never the internal identifier),
 * the claim's last-reviewed line, and each linked publication's title,
 * publishing body or journal, publication date, and stable URL or DOI as a
 * plain, named anchor. The route metadata must still match the revised page
 * copy, the home title must stay the absolute "AI and longer lives", and the
 * obsolete forecasts must be absent from the rendered markup.
 *
 * The test renders existing source with renderToStaticMarkup; it changes no
 * page behaviour and launches no browser.
 */
import type { Metadata } from "next";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import * as cancerRoute from "../src/app/cancer/page";
import * as diseasesRoute from "../src/app/diseases/page";
import * as homeRoute from "../src/app/page";
import * as howAiHelpsRoute from "../src/app/how-ai-helps/page";
import * as longevityRoute from "../src/app/longevity/page";
import ClaimEvidence from "../src/components/claim-evidence";
import {
  claimsForParagraph,
  consequentialClaims,
  evidenceStageLabel,
  formatIsoDate,
  getSitePage,
  lastReviewedLabel,
  referenceCatalogue,
  referenceHref,
  referenceLocatorLabel,
  sitePages,
  type ConsequentialClaim,
  type SitePageId,
} from "../src/lib/site-content";

/** A story route module: its default page component and its metadata. */
interface StoryRouteModule {
  readonly default: () => ReactNode;
  readonly metadata: Metadata;
}

/** Every public route, keyed by page id, with its page module. */
const routeModules: Readonly<Record<SitePageId, StoryRouteModule>> = {
  home: homeRoute,
  "how-ai-helps": howAiHelpsRoute,
  cancer: cancerRoute,
  diseases: diseasesRoute,
  longevity: longevityRoute,
};

/** The opening tag of one rendered claim evidence block. */
const figureOpen = '<figure class="claim-evidence">';

/** Escape text the same way React escapes it in server-rendered HTML. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/** Render one story route's default component to static markup. */
function renderRoute(pageId: SitePageId): string {
  return renderToStaticMarkup(createElement(routeModules[pageId].default));
}

/**
 * The start index of the (ordinal + 1)-th evidence block that begins after
 * `from`, or -1 when that many blocks do not exist.
 */
function figureStartAfter(html: string, from: number, ordinal: number): number {
  let index = from;
  for (let i = 0; i <= ordinal; i += 1) {
    index = html.indexOf(figureOpen, index + 1);
    if (index === -1) {
      return -1;
    }
  }
  return index;
}

describe("claim evidence rendered beside consequential claims", () => {
  it("shows the stage, review line, and every linked publication right after the claiming paragraph, inside the claiming section", () => {
    const byId = new Map(
      referenceCatalogue.map((reference) => [reference.id, reference]),
    );
    for (const claim of consequentialClaims) {
      const page = getSitePage(claim.pageId);
      const section = page.sections.find(
        (candidate) => candidate.id === claim.sectionId,
      );
      expect(section, `claim ${claim.id}: named section exists`).toBeDefined();
      if (section === undefined) {
        throw new Error(`claim ${claim.id}: named section is missing`);
      }
      const paragraph = section.paragraphs.find((p) => p.includes(claim.sentence));
      expect(paragraph, `claim ${claim.id}: claiming paragraph exists`).toBeDefined();
      if (paragraph === undefined) {
        throw new Error(`claim ${claim.id}: claiming paragraph is missing`);
      }

      const html = renderRoute(claim.pageId);
      const paragraphHtml = `<p>${escapeHtml(paragraph)}</p>`;
      const paragraphIndex = html.indexOf(paragraphHtml);
      expect(
        paragraphIndex,
        `claim ${claim.id}: claiming paragraph is rendered`,
      ).toBeGreaterThan(-1);

      // Claims on one paragraph render in catalogue order, so this claim's
      // block is the (position + 1)-th block after the paragraph.
      const paragraphClaims = claimsForParagraph(
        claim.pageId,
        claim.sectionId,
        paragraph,
      );
      const position = paragraphClaims.findIndex(
        (candidate) => candidate.id === claim.id,
      );
      expect(position, `claim ${claim.id}: found among paragraph claims`).toBeGreaterThan(-1);
      const figureIndex = figureStartAfter(html, paragraphIndex, position);
      expect(
        figureIndex,
        `claim ${claim.id}: evidence block follows the claiming paragraph`,
      ).toBeGreaterThan(paragraphIndex);

      // The block must stay inside the claiming section.
      const sectionHeadingIndex = html.indexOf(
        `<h2>${escapeHtml(section.heading)}</h2>`,
      );
      const nextHeadingIndex = html.indexOf("<h2>", sectionHeadingIndex + 1);
      const disclaimerIndex = html.indexOf(
        `<p>${escapeHtml(page.disclaimer)}</p>`,
      );
      const sectionEnd =
        nextHeadingIndex !== -1 &&
        (disclaimerIndex === -1 || nextHeadingIndex < disclaimerIndex)
          ? nextHeadingIndex
          : disclaimerIndex;
      expect(
        figureIndex,
        `claim ${claim.id}: evidence block ends before the next section or the disclaimer`,
      ).toBeLessThan(sectionEnd);

      const nextFigureIndex = figureStartAfter(html, figureIndex, 0);
      const blockEnd = Math.min(
        nextFigureIndex === -1 ? sectionEnd : nextFigureIndex,
        sectionEnd,
      );
      const block = html.slice(figureIndex, blockEnd);

      // Reader-language stage and review line.
      expect(block, `claim ${claim.id}: names the evidence stage`).toContain(
        evidenceStageLabel(claim.stage),
      );
      expect(
        block,
        `claim ${claim.id}: never shows the internal stage identifier`,
      ).not.toContain(claim.stage);
      expect(
        block,
        `claim ${claim.id}: shows the last-reviewed line`,
      ).toContain(`Last reviewed: ${lastReviewedLabel(claim.lastReviewed)}.`);

      // Every linked publication, in link order, with a named anchor.
      // Positions are relative to `block`.
      let previousReferenceEnd = 0;
      for (const referenceId of claim.referenceIds) {
        const reference = byId.get(referenceId);
        expect(reference, `claim ${claim.id}: reference ${referenceId}`).toBeDefined();
        if (reference === undefined) {
          throw new Error(`claim ${claim.id}: unknown reference ${referenceId}`);
        }
        const referenceStart = block.indexOf(escapeHtml(reference.title));
        expect(
          referenceStart,
          `claim ${claim.id}: lists the publication title of ${reference.id}`,
        ).toBeGreaterThan(-1);
        const referenceEnd =
          referenceStart + escapeHtml(reference.title).length;
        expect(
          referenceEnd,
          `claim ${claim.id}: publication ${reference.id} appears after the previous one`,
        ).toBeGreaterThanOrEqual(previousReferenceEnd);
        previousReferenceEnd = referenceEnd;

        const item = block.slice(
          block.lastIndexOf("<li>", referenceStart),
          block.indexOf("</li>", referenceStart) + "</li>".length,
        );
        expect(item, `claim ${claim.id}: names ${reference.id}'s publisher`).toContain(
          escapeHtml(reference.publisher),
        );
        expect(
          item,
          `claim ${claim.id}: shows ${reference.id}'s publication date`,
        ).toContain(formatIsoDate(reference.publishedOn));
        expect(
          item,
          `claim ${claim.id}: links ${reference.id} with a named anchor`,
        ).toContain(
          `<a href="${referenceHref(reference)}">${escapeHtml(
            referenceLocatorLabel(reference),
          )}</a>`,
        );
      }
    }
  });

  it("shows the formatted last-reviewed date when a claim has one, and the explicit gap label when it does not", () => {
    // The shipped claims all carry a real inspection date from the claim
    // evidence register, so an explicit undated variant exercises the
    // documented-gap path instead of relying on a shipped null.
    const base = consequentialClaims[0];
    const undated: ConsequentialClaim = { ...base, lastReviewed: null };
    const undatedHtml = renderToStaticMarkup(
      createElement(ClaimEvidence, { claim: undated }),
    );
    expect(undatedHtml).toContain("Last reviewed: not yet re-checked.");

    const dated: ConsequentialClaim = { ...base, lastReviewed: "2026-10-18" };
    const rendered = renderToStaticMarkup(
      createElement(ClaimEvidence, { claim: dated }),
    );
    expect(rendered).toContain("Last reviewed: 18 October 2026.");
    expect(rendered).not.toContain("not yet re-checked");
  });

  it("keeps every route's metadata in sync with the revised page copy", () => {
    expect(homeRoute.metadata.title).toEqual({ absolute: "AI and longer lives" });
    for (const page of sitePages) {
      const route = routeModules[page.id];
      expect(route.metadata.description, `${page.id}: description`).toBe(
        page.description,
      );
      if (page.id !== "home") {
        expect(route.metadata.title, `${page.id}: title`).toBe(page.title);
      }
    }
  });

  it("renders no obsolete forecast strings on the home, cancer, diseases, or longevity markup", () => {
    const obsoletePatterns: ReadonlyArray<{ name: string; pattern: RegExp }> = [
      { name: "cure-cancer forecast", pattern: /cure cancer/i },
      { name: "eventual-cure forecast", pattern: /eventually cure/i },
      {
        name: "110-120 population-average forecast (110)",
        pattern: /110/,
      },
      {
        name: "110-120 population-average forecast (120)",
        pattern: /120/,
      },
      {
        name: "couple-of-generations forecast",
        pattern: /couple of generations/i,
      },
      {
        name: "unverified 'some researchers' attribution",
        pattern: /some researchers/i,
      },
      {
        name: "unverified 'many researchers' attribution",
        pattern: /many researchers/i,
      },
    ];
    for (const pageId of ["home", "cancer", "diseases", "longevity"] as const) {
      const html = renderRoute(pageId);
      // Strip tags and attributes so the numeric checks see only text, not
      // image dimensions such as width="1200".
      const text = html.replace(/<[^>]*>/g, " ");
      for (const { name, pattern } of obsoletePatterns) {
        expect(
          text,
          `${pageId} rendered markup must not contain the ${name}`,
        ).not.toMatch(pattern);
      }
    }
  });
});
