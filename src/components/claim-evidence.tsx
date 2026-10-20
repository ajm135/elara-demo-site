import {
  evidenceStageLabel,
  formatIsoDate,
  lastReviewedLabel,
  referenceHref,
  referenceLocatorLabel,
  resolveClaimReferences,
  type ConsequentialClaim,
} from "../lib/site-content";

/**
 * The evidence block for one consequential claim.
 *
 * This is a server component (no "use client") rendered by `story-page.tsx`
 * immediately after the paragraph that makes the claim, so the evidence sits
 * beside the claim instead of only in a footer. It shows, in reader
 * language:
 *
 * 1. the claim's evidence stage (clinical use, experimental research, or
 *    speculation) and its last-reviewed date — or an explicit "not yet
 *    re-checked" label, which is a documented verification gap, not a
 *    completed check;
 * 2. one list item per linked publication, naming its title, publishing
 *    body or journal, publication date, and a stable URL or DOI.
 *
 * It uses only plain semantic elements already styled by
 * src/app/globals.css (paragraph-like text, a list, and links): no
 * navigation, no client hooks, no fetched data. Citation links are plain
 * anchors with visible text, so they have an accessible name and work
 * without JavaScript; they point only to the publications' own stable
 * https pages or DOI resolvers, and nothing here embeds remote images,
 * scripts, fonts, or tracking.
 */
export default function ClaimEvidence({ claim }: { claim: ConsequentialClaim }) {
  const references = resolveClaimReferences(claim);
  return (
    <figure className="claim-evidence">
      <figcaption>
        <strong>Evidence for this claim</strong> — {evidenceStageLabel(claim.stage)}.
        Last reviewed: {lastReviewedLabel(claim.lastReviewed)}.
      </figcaption>
      <ul>
        {references.map((reference) => (
          <li key={reference.id}>
            <cite>{reference.title}</cite>, {reference.publisher},{" "}
            {formatIsoDate(reference.publishedOn)}.{" "}
            <a href={referenceHref(reference)}>
              {referenceLocatorLabel(reference)}
            </a>
          </li>
        ))}
      </ul>
    </figure>
  );
}
