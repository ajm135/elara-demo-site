import { describe, expect, it } from "vitest";
import {
  ClaimReferenceError,
  EVIDENCE_STAGES,
  claimsForParagraph,
  consequentialClaims,
  evidenceStageLabel,
  formatIsoDate,
  getSitePage,
  isEvidenceStage,
  isValidIsoDate,
  lastReviewedLabel,
  referenceCatalogue,
  referenceHref,
  referenceLocatorLabel,
  resolveClaimReferences,
  type ConsequentialClaim,
  type EvidenceStage,
  type PublicationReference,
} from "../src/lib/site-content";

const kebabCase = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** A well-formed claim used as the base for the rejection tests. */
const validClaim: ConsequentialClaim = {
  id: "test-claim",
  pageId: "cancer",
  sectionId: "finding-cancer-earlier",
  sentence: "AI is expected to help doctors look for early signs of cancer.",
  stage: "experimental-research",
  lastReviewed: null,
  referenceIds: ["who-cancer-fact-sheet"],
};

/** A well-formed catalogue entry used as the base for the metadata tests. */
const validReference: PublicationReference = referenceCatalogue[0];

describe("claim-linked references", () => {
  describe("isValidIsoDate", () => {
    it("accepts real calendar dates in ISO YYYY-MM-DD form", () => {
      for (const value of ["2026-10-18", "2024-02-29", "1900-01-01", "2026-07-03"]) {
        expect(isValidIsoDate(value)).toBe(true);
      }
    });

    it("rejects impossible dates and wrong shapes", () => {
      for (const value of [
        "",
        "2026-02-30",
        "2023-02-29",
        "2026-13-01",
        "2026-00-10",
        "31-10-2026",
        "2026-7-3",
        "2026-07-03 ",
        "not-a-date",
      ]) {
        expect(isValidIsoDate(value)).toBe(false);
      }
    });
  });

  describe("referenceCatalogue", () => {
    it("keeps a non-empty set of references with unique kebab-case ids", () => {
      expect(referenceCatalogue.length).toBeGreaterThan(0);
      const ids = referenceCatalogue.map((reference) => reference.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) {
        expect(kebabCase.test(id)).toBe(true);
      }
    });

    it("identifies every publication by title, publishing body, ISO date, and exactly one stable locator", () => {
      for (const reference of referenceCatalogue) {
        expect(reference.title.trim().length).toBeGreaterThan(0);
        expect(reference.publisher.trim().length).toBeGreaterThan(0);
        expect(isValidIsoDate(reference.publishedOn)).toBe(true);
        if (reference.locator.kind === "url") {
          const url = new URL(reference.locator.value);
          expect(url.protocol).toBe("https:");
        } else {
          expect(reference.locator.kind).toBe("doi");
          expect(reference.locator.value).toMatch(/^10\.\d{4,9}\//);
        }
      }
    });
  });

  describe("consequentialClaims", () => {
    it("only uses the three allowed evidence stages", () => {
      for (const claim of consequentialClaims) {
        expect(EVIDENCE_STAGES).toContain(claim.stage);
        expect(isEvidenceStage(claim.stage)).toBe(true);
      }
    });

    it("keeps claim ids unique and kebab-case", () => {
      const ids = consequentialClaims.map((claim) => claim.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) {
        expect(kebabCase.test(id)).toBe(true);
      }
    });

    it("links every consequential claim to at least one reference that resolves in the catalogue", () => {
      const ids = new Set(referenceCatalogue.map((reference) => reference.id));
      for (const claim of consequentialClaims) {
        expect(claim.referenceIds.length).toBeGreaterThan(0);
        for (const referenceId of claim.referenceIds) {
          expect(ids.has(referenceId)).toBe(true);
        }
      }
    });

    it("gives every shipped claim a real last-reviewed ISO date, never a gap", () => {
      // Every catalogue source was inspected for the claim evidence register
      // (docs/runbooks/content-evidence.md), so a shipped claim may no longer
      // carry a null review date: null is a documented gap, not a finished
      // check, and the register task closed it for all current claims.
      for (const claim of consequentialClaims) {
        const lastReviewed: string | null = claim.lastReviewed;
        expect(
          lastReviewed,
          `claim ${claim.id} must record when its sources were last inspected`,
        ).not.toBeNull();
        if (lastReviewed !== null) {
          expect(isValidIsoDate(lastReviewed), `claim ${claim.id}`).toBe(true);
        }
      }
    });

    it("attaches every claim to a real sentence in the named page section", () => {
      for (const claim of consequentialClaims) {
        const page = getSitePage(claim.pageId);
        const section = page.sections.find((candidate) => candidate.id === claim.sectionId);
        expect(section).toBeDefined();
        expect(section?.paragraphs.some((paragraph) => paragraph.includes(claim.sentence))).toBe(
          true,
        );
      }
    });

    it("resolves cleanly for every shipped claim, in link order", () => {
      for (const claim of consequentialClaims) {
        const resolved = resolveClaimReferences(claim);
        expect(resolved.map((reference) => reference.id)).toEqual([
          ...claim.referenceIds,
        ]);
      }
    });
  });

  describe("resolveClaimReferences", () => {
    it("rejects a consequential claim that links no references", () => {
      const claim: ConsequentialClaim = { ...validClaim, referenceIds: [] };
      expect(() => resolveClaimReferences(claim)).toThrow(ClaimReferenceError);
      expect(() => resolveClaimReferences(claim)).toThrow(/at least one reference/);
    });

    it("rejects a claim whose reference id does not resolve", () => {
      const claim: ConsequentialClaim = {
        ...validClaim,
        referenceIds: ["not-a-real-reference"],
      };
      expect(() => resolveClaimReferences(claim)).toThrow(/unknown reference id/);
    });

    it("rejects a stage outside the three allowed values", () => {
      const claim: ConsequentialClaim = {
        ...validClaim,
        stage: "proven-cure" as unknown as EvidenceStage,
      };
      expect(() => resolveClaimReferences(claim)).toThrow(/evidence stage/);
      expect(isEvidenceStage("proven-cure")).toBe(false);
    });

    it("rejects a last-reviewed date that is not a real ISO date once present", () => {
      for (const bad of ["2026-02-30", "2026-13-01", "18-10-2026", "yesterday"]) {
        const claim: ConsequentialClaim = { ...validClaim, lastReviewed: bad };
        expect(() => resolveClaimReferences(claim)).toThrow(/last-reviewed date/);
      }
    });

    it("accepts a valid last-reviewed date and returns the matching references in order", () => {
      const claim: ConsequentialClaim = {
        ...validClaim,
        lastReviewed: "2026-10-18",
        referenceIds: ["who-cancer-fact-sheet", "fda-ai-enabled-devices"],
      };
      const resolved = resolveClaimReferences(claim);
      expect(resolved.map((reference) => reference.id)).toEqual([
        "who-cancer-fact-sheet",
        "fda-ai-enabled-devices",
      ]);
    });

    it("rejects a reference with incomplete or malformed publication metadata", () => {
      const cases: Array<[string, PublicationReference]> = [
        ["missing title", { ...validReference, title: "   " }],
        ["missing publisher", { ...validReference, publisher: "" }],
        [
          "impossible publication date",
          { ...validReference, publishedOn: "2026-02-30" },
        ],
        [
          "wrong publication date shape",
          { ...validReference, publishedOn: "03/07/2026" },
        ],
        [
          "non-https URL",
          {
            ...validReference,
            locator: { kind: "url", value: "http://example.org/cancer" },
          },
        ],
        [
          "unparseable URL",
          { ...validReference, locator: { kind: "url", value: "not a url" } },
        ],
        [
          "malformed DOI",
          { ...validReference, locator: { kind: "doi", value: "doi-10.1117" } },
        ],
        [
          "missing locator",
          { ...validReference, locator: undefined } as unknown as PublicationReference,
        ],
        [
          "unrecognized locator kind",
          {
            ...validReference,
            locator: { kind: "urn", value: "urn:isbn:123" },
          } as unknown as PublicationReference,
        ],
      ];
      for (const [label, reference] of cases) {
        expect(
          () => resolveClaimReferences(validClaim, [reference]),
          label,
        ).toThrow(ClaimReferenceError);
      }
    });

    it("accepts a well-formed DOI locator", () => {
      const claim: ConsequentialClaim = {
        ...validClaim,
        referenceIds: ["jmi-2026-imaging-ai-bias-review"],
      };
      const resolved = resolveClaimReferences(claim);
      expect(resolved[0].locator).toEqual({
        kind: "doi",
        value: "10.1117/1.jmi.13.4.040901",
      });
    });
  });

  describe("evidence rendering helpers", () => {
    it("maps every evidence stage to its reader-language label", () => {
      expect(evidenceStageLabel("clinical-use")).toBe("Clinical use");
      expect(evidenceStageLabel("experimental-research")).toBe(
        "Experimental research",
      );
      expect(evidenceStageLabel("speculation")).toBe("Speculation");
    });

    it("formats real ISO dates in reader language and rejects invalid ones", () => {
      expect(formatIsoDate("2026-10-18")).toBe("18 October 2026");
      expect(formatIsoDate("2025-10-01")).toBe("1 October 2025");
      expect(formatIsoDate("2026-07-03")).toBe("3 July 2026");
      expect(() => formatIsoDate("2026-02-30")).toThrow(ClaimReferenceError);
      expect(() => formatIsoDate("yesterday")).toThrow(ClaimReferenceError);
    });

    it("labels a missing review date as an explicit gap, not a completed check", () => {
      expect(lastReviewedLabel(null)).toBe("not yet re-checked");
      expect(lastReviewedLabel("2026-10-18")).toBe("18 October 2026");
    });

    it("gives every reference a stable https link and a visible locator name", () => {
      for (const reference of referenceCatalogue) {
        const href = referenceHref(reference);
        expect(new URL(href).protocol).toBe("https:");
        if (reference.locator.kind === "doi") {
          expect(href).toBe(`https://doi.org/${reference.locator.value}`);
          expect(referenceLocatorLabel(reference)).toBe(
            `DOI: ${reference.locator.value}`,
          );
        } else {
          expect(href).toBe(reference.locator.value);
          expect(referenceLocatorLabel(reference)).toBe(reference.locator.value);
        }
      }
    });

    it("finds exactly the claims a paragraph makes, in catalogue order", () => {
      const page = getSitePage("how-ai-helps");
      const section = page.sections.find(
        (candidate) => candidate.id === "three-stages",
      );
      expect(section).toBeDefined();
      if (section === undefined) {
        throw new Error("three-stages section is missing");
      }
      const making = claimsForParagraph(
        "how-ai-helps",
        "three-stages",
        section.paragraphs[0],
      );
      expect(making.map((claim) => claim.id)).toEqual([
        "ai-devices-clinical-use",
        "ai-approval-not-universal",
      ]);
      const notMaking = claimsForParagraph(
        "how-ai-helps",
        "three-stages",
        section.paragraphs[1],
      );
      expect(notMaking).toHaveLength(0);
      const otherPage = claimsForParagraph("cancer", "three-stages", section.paragraphs[0]);
      expect(otherPage).toHaveLength(0);
    });
  });
});
