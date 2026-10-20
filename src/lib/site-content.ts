/**
 * Static story content for the Demo Site.
 *
 * This module holds all page copy and image references for the five demo
 * stories: home, how AI helps medicine, cancer, other diseases, and longer
 * lives. It is plain data: no database, no network access, and no UI. The
 * pages in `src/app/` render `sitePages`, and the synthetic images
 * referenced here live under `public/`.
 *
 * The module also holds the evidence model: a small catalogue of real,
 * inspectable publications (`referenceCatalogue`) and the consequential
 * health claims the stories make (`consequentialClaims`), linked by
 * reference id. `resolveClaimReferences` validates and resolves that link.
 * Nothing here fetches anything: every reference is stable text a reader
 * can open.
 *
 * The tone is deliberately hopeful and plain. This site is an educational
 * demo: it is not medical advice, not a diagnosis, and not a guarantee. It
 * does not promise that any cure is coming, and it makes no forecast of
 * what the average human lifespan will be in the future.
 */

/** The five stories the demo site tells. */
export type SitePageId =
  | "home"
  | "how-ai-helps"
  | "cancer"
  | "diseases"
  | "longevity";

/** The route path each story will be served from. */
export type SitePagePath =
  | "/"
  | "/how-ai-helps"
  | "/cancer"
  | "/diseases"
  | "/longevity";

/**
 * A reference to one synthetic illustration. The image file itself is added
 * under `public/` in a later milestone; only the reference lives here.
 */
export interface SiteImageRef {
  /** Kebab-case identifier for the illustration, e.g. "cancer-research". */
  readonly id: string;
  /** Public path of the image, e.g. "/images/cancer-research.svg". */
  readonly src: string;
  /** Non-empty, descriptive alternative text (not a filename). */
  readonly alt: string;
  /** Intrinsic width of the illustration in pixels. */
  readonly width: number;
  /** Intrinsic height of the illustration in pixels. */
  readonly height: number;
}

/** One entry of a section's optional definition list. */
export interface SectionTerm {
  /** The exact visible term label, e.g. "Life expectancy". */
  readonly term: string;
  /** One short plain-language definition in the section's own words. */
  readonly definition: string;
}

/** One section of page copy. */
export interface SiteSection {
  /** Kebab-case identifier for the section. */
  readonly id: string;
  /** The visible heading for the section. */
  readonly heading: string;
  /** The section's paragraphs, in reading order. */
  readonly paragraphs: readonly string[];
  /**
   * Optional ordered list of term/definition pairs, rendered by
   * `story-page.tsx` as a definition list right after the section's
   * heading. Only the longevity page carries one: its three lifespan
   * distinctions are also visible as exact term labels ("Life
   * expectancy", "Maximum lifespan", "Healthy lifespan") so a reader can
   * find them without reading the paragraphs. The cited sentences in the
   * section's paragraphs stay unchanged, so the claim evidence register
   * still attaches to the exact same copy.
   */
  readonly terms?: readonly SectionTerm[];
}

/** A full story page: its copy, its images, and its disclaimer. */
export interface SitePage {
  readonly id: SitePageId;
  readonly path: SitePagePath;
  /** Short label for navigation. */
  readonly navLabel: string;
  /** Title used in the browser tab and search results. */
  readonly title: string;
  /** One-sentence description of the page. */
  readonly description: string;
  /** The main heading shown at the top of the page. */
  readonly heading: string;
  /** The short summary shown under the heading. */
  readonly summary: string;
  /** The page's sections, in reading order. */
  readonly sections: readonly SiteSection[];
  /** The page's illustrations (references only, files added later). */
  readonly images: readonly SiteImageRef[];
  /** Reminds readers the site is an educational demo, not medical advice. */
  readonly disclaimer: string;
  /**
   * The ISO YYYY-MM-DD date the page's cited sources were last inspected
   * for the claim evidence register (docs/runbooks/content-evidence.md).
   * Optional so the model keeps working for a page with no claims, but
   * every shipped page carries the real inspection date 2026-10-18 — the
   * date every source in `referenceCatalogue` was actually opened — and
   * no other date.
   */
  readonly reviewedOn?: string;
  /**
   * Optional sources block rendered after the page's sections and before
   * the disclaimer. Only the home page carries one: it is the site's front
   * door and its reading map, and the one page that makes no consequential
   * claim of its own, so instead of per-claim evidence panels it lists the
   * site-wide evidence base — the complete `referenceCatalogue`, in
   * catalogue order — with a heading and a short reader-language intro.
   * The four story pages leave this undefined and rely on their per-claim
   * evidence panels.
   */
  readonly sources?: {
    /** The visible heading for the sources block. */
    readonly heading: string;
    /** One or two sentences introducing the block in reader language. */
    readonly intro: string;
    /** Ids from `referenceCatalogue`, in the order to display them. */
    readonly referenceIds: readonly string[];
  };
}

/* ------------------------------------------------------------------ *
 * Claim-linked references
 * ------------------------------------------------------------------ */

/**
 * The three evidence stages a consequential claim can be in, limited to
 * exactly these values: already used in clinical practice, under active
 * research, or speculation.
 */
export const EVIDENCE_STAGES = [
  "clinical-use",
  "experimental-research",
  "speculation",
] as const;

/** One of the three allowed evidence stages. */
export type EvidenceStage = (typeof EVIDENCE_STAGES)[number];

/**
 * The single stable pointer that takes a reader to a publication. A
 * reference carries exactly one of these: an https URL or a DOI.
 */
export type ReferenceLocator =
  | { readonly kind: "url"; readonly value: string }
  | { readonly kind: "doi"; readonly value: string };

/** A real, inspectable publication that can back a consequential claim. */
export interface PublicationReference {
  /** Kebab-case identifier, e.g. "who-cancer-fact-sheet". */
  readonly id: string;
  /** The publication's title. */
  readonly title: string;
  /** The publishing body or journal, e.g. "World Health Organization". */
  readonly publisher: string;
  /** The publication date as an ISO YYYY-MM-DD string. */
  readonly publishedOn: string;
  /** Exactly one stable URL or DOI. */
  readonly locator: ReferenceLocator;
}

/**
 * A consequential health claim: a sentence on one of the five pages that
 * asserts a benefit, limitation, availability, approval status, or
 * lifespan distinction. Claims link to one or more catalogue references
 * by id and carry their own evidence stage and last-reviewed date.
 */
export interface ConsequentialClaim {
  /** Kebab-case identifier, e.g. "ai-cancer-early-detection". */
  readonly id: string;
  /** The page the claim's sentence lives on. */
  readonly pageId: SitePageId;
  /** The id of the section on that page the sentence belongs to. */
  readonly sectionId: string;
  /** The exact sentence from the page copy that makes the claim. */
  readonly sentence: string;
  /** How strong the evidence behind the claim is. */
  readonly stage: EvidenceStage;
  /**
   * The ISO YYYY-MM-DD date the linked sources were last inspected.
   * Null means "not yet inspected": the content-evidence register
   * (docs/runbooks/content-evidence.md) may record this date only after a
   * source has actually been read, never in advance. Every shipped claim
   * currently carries a date, because every source in the catalogue was
   * inspected for the register on 2026-10-18.
   */
  readonly lastReviewed: string | null;
  /** One or more ids from `referenceCatalogue`. */
  readonly referenceIds: readonly string[];
}

/**
 * The small set of real, inspectable sources the stories may cite. Each
 * entry carries the stable https URL or DOI a reader can open, and the
 * publication date exactly as the source displays it. Every source was
 * opened and inspected on 2026-10-18: the specific finding, its location
 * in the source, what it does not support, and its limitation are recorded
 * per claim in docs/runbooks/content-evidence.md (the claim evidence
 * register), and each claim's `lastReviewed` carries that inspection date.
 */
export const referenceCatalogue: readonly PublicationReference[] = [
  {
    id: "who-cancer-fact-sheet",
    title: "Cancer",
    publisher: "World Health Organization",
    publishedOn: "2026-07-03",
    locator: {
      kind: "url",
      value: "https://www.who.int/news-room/fact-sheets/detail/cancer",
    },
  },
  {
    id: "fda-ai-enabled-devices",
    title: "Artificial Intelligence-Enabled Medical Devices",
    publisher: "U.S. Food and Drug Administration",
    publishedOn: "2026-09-22",
    locator: {
      kind: "url",
      value:
        "https://www.fda.gov/medical-devices/digital-health-center-excellence/artificial-intelligence-enabled-medical-devices",
    },
  },
  {
    id: "who-ageing-and-health",
    title: "Ageing and health",
    publisher: "World Health Organization",
    publishedOn: "2025-10-01",
    locator: {
      kind: "url",
      value: "https://www.who.int/news-room/fact-sheets/detail/ageing-and-health",
    },
  },
  {
    id: "who-ncd-fact-sheet",
    title: "Noncommunicable diseases",
    publisher: "World Health Organization",
    publishedOn: "2025-09-25",
    locator: {
      kind: "url",
      value: "https://www.who.int/news-room/fact-sheets/detail/noncommunicable-diseases",
    },
  },
  {
    id: "jmi-2026-imaging-ai-bias-review",
    title:
      "Beyond accuracy: a systematic scoping review of algorithmic bias measurement and mitigation in peer-reviewed publications in medical imaging AI development and evaluation for classification",
    publisher: "Journal of Medical Imaging",
    publishedOn: "2026-08-12",
    locator: { kind: "doi", value: "10.1117/1.jmi.13.4.040901" },
  },
];

/**
 * The consequential health claims the current copy makes, attached to the
 * exact sentence and section each one lives in. Every `lastReviewed`
 * carries the real inspection date from the content-evidence register
 * (docs/runbooks/content-evidence.md), where the finding, location, and
 * limitation behind each claim are recorded; a claim is only kept while a
 * cited source actually supports it at its stated stage.
 *
 * Only claims the copy actually makes are listed here. The unsupported
 * cure predictions and the unsupported population-average lifespan
 * forecasts the October 18 review flagged were removed from the shipped
 * copy rather than kept as speculation claims, and no claim is attached
 * to a sentence it cannot be tied to a real, inspectable source.
 */
export const consequentialClaims: readonly ConsequentialClaim[] = [
  {
    id: "ai-scan-reading-earlier",
    pageId: "how-ai-helps",
    sectionId: "earlier-diagnosis",
    sentence:
      "AI tools are expected to help doctors read scans and test results with fewer mistakes and much less delay, so problems such as tumours, vision loss, and heart strain are spotted while there is still time to act.",
    stage: "experimental-research",
    lastReviewed: "2026-10-18",
    referenceIds: ["fda-ai-enabled-devices", "jmi-2026-imaging-ai-bias-review"],
  },
  {
    id: "ai-uneven-performance",
    pageId: "how-ai-helps",
    sectionId: "earlier-diagnosis",
    sentence:
      "Performance is not always even across populations, either: a tool can work less well for some groups of patients than for others, and whether that happens across gender, age, or race is a concern researchers are actively measuring, with a published record that is still small.",
    stage: "experimental-research",
    lastReviewed: "2026-10-18",
    referenceIds: ["jmi-2026-imaging-ai-bias-review"],
  },
  {
    id: "ai-devices-clinical-use",
    pageId: "how-ai-helps",
    sectionId: "three-stages",
    sentence:
      "Some AI-enabled devices are already in clinical use: approved for specific tasks, such as reading certain kinds of scans, and working in real clinics today.",
    stage: "clinical-use",
    lastReviewed: "2026-10-18",
    referenceIds: ["fda-ai-enabled-devices"],
  },
  {
    id: "ai-approval-not-universal",
    pageId: "how-ai-helps",
    sectionId: "three-stages",
    sentence:
      "But approval for one specific use is not approval for every use, and it is not the same as the device being available everywhere.",
    stage: "clinical-use",
    lastReviewed: "2026-10-18",
    referenceIds: ["fda-ai-enabled-devices"],
  },
  {
    id: "ai-cancer-early-detection",
    pageId: "cancer",
    sectionId: "finding-cancer-earlier",
    sentence:
      "AI is expected to help doctors look for early signs of cancer in scans and tests more accurately and more consistently, catching cancers while they are small and most treatable.",
    stage: "experimental-research",
    lastReviewed: "2026-10-18",
    referenceIds: [
      "who-cancer-fact-sheet",
      "fda-ai-enabled-devices",
      "jmi-2026-imaging-ai-bias-review",
    ],
  },
  {
    id: "ai-cancer-clinical-use",
    pageId: "cancer",
    sectionId: "better-treatment",
    sentence:
      "Some AI-enabled devices are already in clinical use for particular kinds of scans and readings, and approval for one of those uses is not the same as approval for everything the device could do.",
    stage: "clinical-use",
    lastReviewed: "2026-10-18",
    referenceIds: ["fda-ai-enabled-devices"],
  },
  {
    id: "ncd-death-burden",
    pageId: "diseases",
    sectionId: "common-diseases",
    sentence:
      "Heart disease, diabetes, stroke, and other chronic conditions cause more deaths than almost anything else on Earth.",
    stage: "clinical-use",
    lastReviewed: "2026-10-18",
    referenceIds: ["who-ncd-fact-sheet"],
  },
  {
    id: "lifespan-rise-history",
    pageId: "longevity",
    sectionId: "why-lifespans-move",
    sentence:
      "People worldwide are living longer, and today most people can expect to live into their sixties and beyond, and the pace of that change is much faster than in the past.",
    stage: "clinical-use",
    lastReviewed: "2026-10-18",
    referenceIds: ["who-ageing-and-health"],
  },
  {
    id: "healthy-lifespan-definition",
    pageId: "longevity",
    sectionId: "three-lifespan-numbers",
    sentence:
      "The third number is healthy lifespan: the proportion of life a person spends in good health.",
    stage: "clinical-use",
    lastReviewed: "2026-10-18",
    referenceIds: ["who-ageing-and-health"],
  },
];

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DOI_PATTERN = /^10\.\d{4,9}\/\S+$/;

/**
 * True when `value` is a real calendar date in ISO YYYY-MM-DD form.
 * Rejects wrong shapes ("31-10-2026") and impossible dates ("2026-02-30").
 */
export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** True when `value` is one of the three allowed evidence stages. */
export function isEvidenceStage(value: unknown): value is EvidenceStage {
  return (
    typeof value === "string" &&
    (EVIDENCE_STAGES as readonly string[]).includes(value)
  );
}

/** Thrown when a claim or one of its references is missing or malformed. */
export class ClaimReferenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClaimReferenceError";
  }
}

/**
 * Check one catalogue entry's required publication metadata. Throws
 * `ClaimReferenceError` when the title, publisher, date, or locator is
 * missing or malformed.
 */
function validatePublicationReference(reference: PublicationReference): void {
  const id = reference.id;
  const label = typeof id === "string" && id.trim().length > 0 ? id : "<missing id>";
  if (typeof id !== "string" || id.trim().length === 0) {
    throw new ClaimReferenceError("A catalogue reference is missing its id.");
  }
  if (typeof reference.title !== "string" || reference.title.trim().length === 0) {
    throw new ClaimReferenceError(`Reference "${label}" is missing its title.`);
  }
  if (
    typeof reference.publisher !== "string" ||
    reference.publisher.trim().length === 0
  ) {
    throw new ClaimReferenceError(
      `Reference "${label}" is missing its publishing body or journal.`,
    );
  }
  if (
    typeof reference.publishedOn !== "string" ||
    !isValidIsoDate(reference.publishedOn)
  ) {
    throw new ClaimReferenceError(
      `Reference "${label}" has an invalid publication date: "${String(reference.publishedOn)}".`,
    );
  }
  const locator: unknown = reference.locator;
  if (typeof locator !== "object" || locator === null) {
    throw new ClaimReferenceError(
      `Reference "${label}" is missing its locator (exactly one https URL or DOI).`,
    );
  }
  const { kind, value } = locator as { kind?: unknown; value?: unknown };
  if (kind !== "url" && kind !== "doi") {
    throw new ClaimReferenceError(
      `Reference "${label}" has an unrecognized locator kind: "${String(kind)}".`,
    );
  }
  if (typeof value !== "string") {
    throw new ClaimReferenceError(`Reference "${label}" is missing its locator value.`);
  }
  if (kind === "url") {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      throw new ClaimReferenceError(`Reference "${label}" has an invalid URL: "${value}".`);
    }
    if (parsed.protocol !== "https:") {
      throw new ClaimReferenceError(
        `Reference "${label}" must use an https URL: "${value}".`,
      );
    }
  } else if (!DOI_PATTERN.test(value)) {
    throw new ClaimReferenceError(`Reference "${label}" has an invalid DOI: "${value}".`);
  }
}

/**
 * Resolve a claim's reference ids to their catalogue entries.
 *
 * Pure: no side effects and no I/O. Throws `ClaimReferenceError` when the
 * claim links no references, when a reference id does not resolve, when the
 * stage is outside the three allowed values, when a last-reviewed date is
 * present but is not a real ISO date, or when any resolved reference's
 * publication metadata is missing or malformed.
 */
export function resolveClaimReferences(
  claim: ConsequentialClaim,
  catalogue: readonly PublicationReference[] = referenceCatalogue,
): readonly PublicationReference[] {
  const referenceIds = claim.referenceIds;
  if (!Array.isArray(referenceIds) || referenceIds.length === 0) {
    throw new ClaimReferenceError(
      `Claim "${claim.id}" must link at least one reference.`,
    );
  }
  if (!isEvidenceStage(claim.stage)) {
    throw new ClaimReferenceError(
      `Claim "${claim.id}" has an evidence stage outside the allowed values: "${String(claim.stage)}".`,
    );
  }
  if (claim.lastReviewed !== null && !isValidIsoDate(claim.lastReviewed)) {
    throw new ClaimReferenceError(
      `Claim "${claim.id}" has an invalid last-reviewed date: "${String(claim.lastReviewed)}".`,
    );
  }

  const byId = new Map<string, PublicationReference>();
  for (const reference of catalogue) {
    if (byId.has(reference.id)) {
      throw new ClaimReferenceError(
        `Duplicate reference id in catalogue: "${reference.id}".`,
      );
    }
    byId.set(reference.id, reference);
  }

  const resolved: PublicationReference[] = [];
  for (const referenceId of referenceIds) {
    const reference = byId.get(referenceId);
    if (reference === undefined) {
      throw new ClaimReferenceError(
        `Claim "${claim.id}" links an unknown reference id: "${referenceId}".`,
      );
    }
    validatePublicationReference(reference);
    resolved.push(reference);
  }
  return resolved;
}

/**
 * Resolve the reference ids of a page's optional sources block to their
 * catalogue entries, in display order.
 *
 * Pure: no side effects and no I/O. Throws `ClaimReferenceError` when the
 * block lists no references or when an id does not resolve in the
 * catalogue, the same way `resolveClaimReferences` does for claims, and
 * validates each resolved reference's publication metadata.
 */
export function resolvePageSourceReferences(
  referenceIds: readonly string[],
  catalogue: readonly PublicationReference[] = referenceCatalogue,
): readonly PublicationReference[] {
  if (referenceIds.length === 0) {
    throw new ClaimReferenceError(
      "A page sources block must list at least one reference.",
    );
  }
  const byId = new Map<string, PublicationReference>();
  for (const reference of catalogue) {
    byId.set(reference.id, reference);
  }
  const resolved: PublicationReference[] = [];
  for (const referenceId of referenceIds) {
    const reference = byId.get(referenceId);
    if (reference === undefined) {
      throw new ClaimReferenceError(
        `A page sources block links an unknown reference id: "${referenceId}".`,
      );
    }
    validatePublicationReference(reference);
    resolved.push(reference);
  }
  return resolved;
}

/* ------------------------------------------------------------------ *
 * Rendering helpers for the claim evidence blocks
 * ------------------------------------------------------------------ */

/**
 * The reader-language label for each evidence stage: plain words a general
 * reader can act on, in place of the internal kebab-case identifiers.
 */
export function evidenceStageLabel(stage: EvidenceStage): string {
  switch (stage) {
    case "clinical-use":
      return "Clinical use";
    case "experimental-research":
      return "Experimental research";
    case "speculation":
      return "Speculation";
  }
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/**
 * Format a real ISO YYYY-MM-DD date in reader language, e.g.
 * "2026-10-18" becomes "18 October 2026". Throws `ClaimReferenceError`
 * for dates that are not real calendar dates.
 */
export function formatIsoDate(value: string): string {
  if (!isValidIsoDate(value)) {
    throw new ClaimReferenceError(
      `Cannot format an invalid ISO date: "${String(value)}".`,
    );
  }
  const [year, month, day] = value.split("-").map(Number);
  return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

/**
 * The reader-language label for a claim's last-reviewed date. A null date
 * is an explicit, documented verification gap, not a completed check, so it
 * is labelled as such instead of being silently omitted.
 */
export function lastReviewedLabel(lastReviewed: string | null): string {
  return lastReviewed === null ? "not yet re-checked" : formatIsoDate(lastReviewed);
}

/**
 * The stable https URL a reader follows to open a reference. DOIs resolve
 * through https://doi.org; URL locators are already https and pass through.
 */
export function referenceHref(reference: PublicationReference): string {
  return reference.locator.kind === "doi"
    ? `https://doi.org/${reference.locator.value}`
    : reference.locator.value;
}

/**
 * The visible, accessible name of the citation link: the stable URL itself,
 * or "DOI: <doi>" so readers can tell the two kinds of locator apart.
 */
export function referenceLocatorLabel(reference: PublicationReference): string {
  return reference.locator.kind === "doi"
    ? `DOI: ${reference.locator.value}`
    : reference.locator.value;
}

/**
 * The consequential claims made by one paragraph, in catalogue order.
 * A paragraph makes a claim when it contains that claim's sentence inside
 * the named page section; paragraphs that make no claim get an empty list.
 */
export function claimsForParagraph(
  pageId: SitePageId,
  sectionId: string,
  paragraph: string,
): readonly ConsequentialClaim[] {
  return consequentialClaims.filter(
    (claim) =>
      claim.pageId === pageId &&
      claim.sectionId === sectionId &&
      paragraph.includes(claim.sentence),
  );
}

const homePage: SitePage = {
  id: "home",
  path: "/",
  navLabel: "Home",
  title: "A hopeful look at AI and human health",
  description:
    "A hopeful educational demo about how AI is expected to help doctors find disease earlier, choose treatments more carefully, and move research along faster — and what the evidence for those hopes actually says.",
  heading: "A hopeful look at AI and human health",
  summary:
    "This demo site tells five short, hopeful stories: how artificial intelligence is expected to help doctors diagnose and treat disease more carefully, and what the evidence for those hopes does and does not support. Read them in order, or jump straight to the story you care about most.",
  sections: [
    {
      id: "why-this-site",
      heading: "Why this site exists",
      paragraphs: [
        "Scientists around the world are using artificial intelligence to understand disease better than ever before. The promise is simple to state: AI helps doctors see problems earlier, choose treatments more carefully, and turn years of research into answers much faster.",
        "This site is a hopeful, plain-language look at that promise. Every story is written for a general audience, and every illustration is synthetic, made for this demo, with no real patients and no real products in sight.",
      ],
    },
    {
      id: "how-to-read",
      heading: "A path through the stories",
      paragraphs: [
        "Start with the story on how AI helps medicine, which explains the three ways AI is expected to change care: earlier diagnosis, smarter treatment, and faster research.",
        "Then visit the story on cancer, the one this site was built around, follow it with the story on other diseases, from heart disease to infections, and finish with the story on longer lives, which sorts out the difference between life expectancy, maximum lifespan, and healthy lifespan.",
      ],
    },
  ],
  images: [
    {
      id: "hopeful-future",
      src: "/images/hopeful-future.svg",
      alt: "A rising amber sun with short rays over a low landscape of rounded teal laboratory and hospital blocks, with a pale path leading toward them, symbolising a hopeful future for medicine",
      width: 1200,
      height: 630,
    },
  ],
  disclaimer:
    "This site is a hopeful educational demo. It is not medical advice, not a diagnosis, and not a guarantee: it does not promise that any cure is coming, and it makes no forecast of how long people will live.",
  reviewedOn: "2026-10-18",
  sources: {
    heading: "Where the evidence comes from",
    intro:
      "The stories on this site keep their evidence visible: every consequential claim is tied to a real, inspectable publication, and the sources listed here are the complete set the site cites. Each story's evidence panels say how strong the evidence is — clinical use, experimental research, or speculation.",
    referenceIds: [
      "who-cancer-fact-sheet",
      "fda-ai-enabled-devices",
      "who-ageing-and-health",
      "who-ncd-fact-sheet",
      "jmi-2026-imaging-ai-bias-review",
    ],
  },
};

const howAiHelpsPage: SitePage = {
  id: "how-ai-helps",
  path: "/how-ai-helps",
  navLabel: "How AI helps",
  title: "How AI is expected to help medicine",
  description:
    "Three ways AI is expected to change medicine: earlier diagnosis, smarter treatment, and faster research — and the honest limits that come with each hope.",
  heading: "How AI is expected to help medicine",
  summary:
    "AI is expected to help in three connected ways: to help doctors find disease earlier, to help care teams choose better treatments, and to help researchers reach answers faster. Each hope is real, and each has limits, and this story keeps the two side by side.",
  sections: [
    {
      id: "earlier-diagnosis",
      heading: "Diagnosis: seeing disease earlier",
      paragraphs: [
        "The first hope is earlier diagnosis. AI tools are expected to help doctors read scans and test results with fewer mistakes and much less delay, so problems such as tumours, vision loss, and heart strain are spotted while there is still time to act.",
        "Earlier is better in almost every disease. A diagnosis made months sooner usually opens up far more treatment options, and that is a quiet superpower of AI.",
        "The limits come with the promise. A tool that flags too often raises false positives — alarms that turn out to be nothing — and the scans and biopsies that follow them. A tool that flags too few produces missed diagnoses. In some conditions, spotting tiny problems early also means overdiagnosis: treating findings that would never have caused harm. Performance is not always even across populations, either: a tool can work less well for some groups of patients than for others, and whether that happens across gender, age, or race is a concern researchers are actively measuring, with a published record that is still small. None of that means the hope is wrong; it means every reading still ends with a clinician deciding what it means.",
      ],
    },
    {
      id: "smarter-treatment",
      heading: "Treatment: choosing what works best",
      paragraphs: [
        "The second hope is smarter treatment. Once a diagnosis is made, AI is expected to help care teams compare thousands of studies and outcomes to choose the plan most likely to help each individual, and to flag when a treatment is working and when it should change.",
        "The goal is not to replace doctors. It is to give every patient the same careful, up-to-date guidance that today is often only available at a handful of specialist centres.",
        "The limits are the same kind. A treatment suggestion is only as good as the evidence behind it, and for many choices that evidence is still thin or mixed: a plan can help one person and harm another, and the right answer depends on details a study never measured. The decision stays with the clinician and the patient, and the algorithm stays in an advisory role.",
      ],
    },
    {
      id: "faster-research",
      heading: "Research: from discovery to answers, faster",
      paragraphs: [
        "The third hope is faster research. AI is expected to help scientists design new drugs, predict how they will behave, and read the molecular patterns behind disease, shrinking work that once took decades into work that may take years.",
        "A research engine that helps understand one disease can be turned on the next, and faster cycles from discovery to first trials are already part of how some teams work. But faster is not the same as certain: most candidate treatments still fail in later testing, and no shortcut skips the long, careful work of proving a treatment safe and effective for real patients.",
      ],
    },
    {
      id: "three-stages",
      heading: "Three stages: real today, in research, or just a hope",
      paragraphs: [
        "It helps to sort the hopes into three stages. Some AI-enabled devices are already in clinical use: approved for specific tasks, such as reading certain kinds of scans, and working in real clinics today. That is demonstrated medicine, and it is worth celebrating. But approval for one specific use is not approval for every use, and it is not the same as the device being available everywhere.",
        "A much larger set of ideas is experimental research: tools and methods that are in trials and studies, being measured and corrected as we learn. And beyond both of those sits the boldest vision people have for AI in medicine. That vision is worth keeping, but it is speculation — a hope for the future, not a forecast, and not something anyone can promise.",
      ],
    },
  ],
  images: [
    {
      id: "ai-in-medicine",
      src: "/images/ai-in-medicine.svg",
      alt: "A small network of connected dots linking three large rounded panels showing a stethoscope, a laboratory flask, and a medical scan with a simple waveform",
      width: 1200,
      height: 630,
    },
  ],
  disclaimer:
    "This site is a hopeful educational demo. It is not medical advice, not a diagnosis, and not a guarantee that any particular tool, treatment, or cure is certain.",
  reviewedOn: "2026-10-18",
};

const cancerPage: SitePage = {
  id: "cancer",
  path: "/cancer",
  navLabel: "Cancer",
  title: "The hopeful fight against cancer",
  description:
    "How AI is expected to help find cancer earlier, guide treatment, and speed research — and what the evidence does and does not say about those hopes.",
  heading: "The hopeful fight against cancer",
  summary:
    "Cancer is the story this site was built around. It is one of the oldest and toughest diseases humanity has ever fought, and one of the places where AI is expected to help most: finding cancers earlier, guiding treatment, and speeding the search for better answers. Every hope here has an evidence stage, and this story names which is which.",
  sections: [
    {
      id: "finding-cancer-earlier",
      heading: "Finding cancer earlier",
      paragraphs: [
        "The clearest near-term hope is earlier detection. AI is expected to help doctors look for early signs of cancer in scans and tests more accurately and more consistently, catching cancers while they are small and most treatable.",
        "Earlier detection has a well-known price, though. The more you look, the more you find: some findings are false positives, and some are overdiagnosis — cancers found that would never have caused harm, but that now get treated anyway. Some cancers are missed even with screening, and tools do not all perform the same across different populations. That is why any AI suggestion still goes through a radiologist or clinician before it becomes a diagnosis.",
      ],
    },
    {
      id: "better-treatment",
      heading: "Choosing better treatment",
      paragraphs: [
        "Once cancer is found, AI is expected to help care teams pick the treatment most likely to work for a specific patient, weigh the side effects of each option, and keep a close eye on how the body responds week by week.",
        "Which parts of that hope are real depends on the task. Some AI-enabled devices are already in clinical use for particular kinds of scans and readings, and approval for one of those uses is not the same as approval for everything the device could do. The wider vision — personalized treatment chosen with algorithmic help for every patient — is still mostly experimental research, and the final decision stays with the oncology team and the patient.",
      ],
    },
    {
      id: "speeding-the-search",
      heading: "Speeding the search for answers",
      paragraphs: [
        "The boldest hope people have for AI in medicine is a future in which cancers that are deadly today are no longer so. To be clear: that is speculation — a hope, not a forecast. This site takes no position on whether or when it will happen, and nobody can promise it. What AI can do today is real but narrower: map the molecules that drive cancer, design candidate drugs aimed at them, and test ideas that would once have taken a generation to check.",
        "Cancer is not one disease but many, and that is exactly why a flexible research tool like AI is so promising: the same methods that help with one type of cancer can be adapted to the next. Progress is real and it is visible: new treatments arrive, and cancers are found earlier than before. But visible progress is not a forecast, and the road from a research finding to a treatment a patient can actually receive is long.",
      ],
    },
  ],
  images: [
    {
      id: "cancer-research",
      src: "/images/cancer-research.svg",
      alt: "A stylized cell with a darker nucleus being studied inside a circular microscope field, with a ring of short data marks around the field",
      width: 1200,
      height: 630,
    },
    {
      id: "cancer-hope",
      src: "/images/cancer-hope.svg",
      alt: "Two simple geometric hands cupping a small amber light with a soft glow in a deep teal field, symbolising hope in the fight against cancer",
      width: 800,
      height: 600,
    },
  ],
  disclaimer:
    "This site is a hopeful educational demo. It is not medical advice, not a diagnosis, and not a guarantee that any particular treatment will work for a specific person.",
  reviewedOn: "2026-10-18",
};

const diseasesPage: SitePage = {
  id: "diseases",
  path: "/diseases",
  navLabel: "Other diseases",
  title: "Beyond cancer: AI and the other diseases",
  description:
    "How AI is expected to help with heart disease, diabetes, infections, and rare diseases.",
  heading: "Beyond cancer: AI and the other diseases",
  summary:
    "Cancer gets the headlines, but the same hopeful logic applies to nearly every other disease. AI is expected to help diagnose, treat, and research many of them too: from heart disease and diabetes to infections and rare conditions that affect only a few thousand people. The hopes are similar, and the limits are similar, so this story keeps the two side by side.",
  sections: [
    {
      id: "common-diseases",
      heading: "The diseases that affect the most people",
      paragraphs: [
        "Heart disease, diabetes, stroke, and other chronic conditions cause more deaths than almost anything else on Earth. AI is expected to help doctors spot the early warning signs in everyday measurements such as blood pressure, blood sugar, and heart rhythm, and to help choose the treatment that fits each patient best.",
        "The same cautions apply here as in the other stories. Early warning signs can be false positives, real problems can be missed even by good tools, and a tool that performs well in one group of patients may perform less well in another. None of that takes the hope away; it means the clinician stays in charge of every decision.",
      ],
    },
    {
      id: "fighting-infections",
      heading: "Fighting infections before they spread",
      paragraphs: [
        "For infections, the hope is speed. AI is expected to help identify which bacteria or virus is causing an illness quickly, choose the right medicine, and spot new outbreaks early, so that dangerous infections are treated before they can spread.",
        "Speed has to outrun accuracy, not replace it: a misidentified pathogen points at the wrong medicine, so the identification still has to be confirmed before treatment changes.",
      ],
    },
    {
      id: "rare-diseases",
      heading: "Rare diseases at last get a research engine",
      paragraphs: [
        "Rare diseases are where AI's promise may be most dramatic. With so few patients and so little data per disease, progress has often stalled. AI is expected to help researchers share patterns across diseases, find the causes behind them, and design treatments for conditions that were once written off as hopeless.",
        "Rare diseases are also where the data is thinnest, and thin data is exactly where AI tools make their biggest mistakes. Most rare-disease tools are experimental research, not part of clinical use yet, and a hopeful label on a research goal is at best speculation about what that research might deliver.",
      ],
    },
  ],
  images: [
    {
      id: "other-diseases",
      src: "/images/other-diseases.svg",
      alt: "Four flat icons in a circle - a heart, a cluster of sugar circles, a spiky virus, and a dna helix - joined by lines with small data dots",
      width: 1200,
      height: 630,
    },
  ],
  disclaimer:
    "This site is a hopeful educational demo. It is not medical advice, not a diagnosis, and not a guarantee that a treatment for any particular disease is certain.",
  reviewedOn: "2026-10-18",
};

const longevityPage: SitePage = {
  id: "longevity",
  path: "/longevity",
  navLabel: "Longer lives",
  title: "Longer lives: what the lifespan numbers mean",
  description:
    "The difference between life expectancy, maximum lifespan, and healthy lifespan — and why no one can honestly forecast what the average human lifespan will be next.",
  heading: "Longer lives",
  summary:
    "For most of history, human life was short, and that was considered fixed. It is not: lifespans have risen as medicine, clean water, and food improved. This story explains the three different numbers people mix up — life expectancy, maximum lifespan, and healthy lifespan — and why honest answers about the future are quieter than the boldest headlines.",
  sections: [
    {
      id: "why-lifespans-move",
      heading: "Why lifespans move at all",
      paragraphs: [
        "Average human lifespan is not a fixed number. People worldwide are living longer, and today most people can expect to live into their sixties and beyond, and the pace of that change is much faster than in the past. A good part of those gains came as deaths from infection fell and clean water and better care spread, and a better understanding of disease is exactly what AI is expected to accelerate.",
      ],
    },
    {
      id: "three-lifespan-numbers",
      heading: "Three numbers, three different things",
      terms: [
        {
          term: "Life expectancy",
          definition:
            "A population average: the number of years a person is expected to live at birth.",
        },
        {
          term: "Maximum lifespan",
          definition:
            "The longest individual human life ever observed — a fact about the longest lives on record, not a population forecast.",
        },
        {
          term: "Healthy lifespan",
          definition:
            "The proportion of life a person spends in good health.",
        },
      ],
      paragraphs: [
        "The first number is life expectancy: the average number of years a person in a population is expected to live at birth. It is a population average, shaped by infant mortality, clean water, and medicine, and it moves up slowly as those things improve.",
        "The second number is maximum lifespan: the longest a human has ever been observed to live. That is a fact about the longest individual lives on record, not a prediction about what a population will average in the future, and no research program can promise it will move.",
        "The third number is healthy lifespan: the proportion of life a person spends in good health. Evidence suggests that the proportion of life in good health has remained broadly constant, which means the extra years people are living today are often in poorer health — and that is why this number matters as much as the other two: a decade added to life expectancy is only as good as the health of the years it adds.",
      ],
    },
    {
      id: "what-the-future-could-hold",
      heading: "What the future could hold",
      paragraphs: [
        "It is worth saying plainly: this story offers no forecast of what the average human lifespan will be in the future. Lifespans have risen before, and research tools like AI are expected to help medicine keep improving, so further progress is plausible. But plausibility is not a forecast, and anyone who quotes you a specific future number for the population average is guessing.",
        "The honest version of the hope is this: people may live longer, and better — with more years in good health — if the diseases that claim the most lives are diagnosed earlier and treated better. That is a hope with evidence behind parts of it, and a research goal for the rest. It is still reason to be hopeful, which is all this demo is asking of you.",
      ],
    },
  ],
  images: [
    {
      id: "longer-lives",
      src: "/images/longer-lives.svg",
      alt: "A long road narrowing toward the horizon under a wide pale sky, with trees of stacked round canopies on both sides that grow taller toward the foreground",
      width: 1200,
      height: 630,
    },
  ],
  disclaimer:
    "This site is a hopeful educational demo. It is not medical advice, not a diagnosis, and not a guarantee: it offers no forecast of what the average human lifespan will be in the future.",
  reviewedOn: "2026-10-18",
};

/**
 * The five story pages, in reading order: home first, then the four stories.
 * Treated as read-only by everything that consumes it.
 */
export const sitePages: readonly SitePage[] = [
  homePage,
  howAiHelpsPage,
  cancerPage,
  diseasesPage,
  longevityPage,
];

/**
 * Return the page for the given id. Every id in `SitePageId` has a page, so
 * this only throws for ids that are not part of the content model.
 */
export function getSitePage(id: SitePageId): SitePage {
  const page = sitePages.find((candidate) => candidate.id === id);
  if (page === undefined) {
    throw new Error(`Unknown site page: ${id}`);
  }
  return page;
}

/**
 * Map a route path to the page it is served from, or `null` when the path is
 * not one of the five story routes (for example "", "/unknown", or a path
 * with a trailing slash).
 *
 * Pure: no side effects, no I/O. This is the testable half of the
 * header's current-page detection: a server component hands the header the
 * path it is being rendered for, and the header resolves it with this
 * helper, so Node tests need no browser and no request simulation.
 */
export function sitePageForPath(path: string): SitePage | null {
  const page = sitePages.find((candidate) => candidate.path === path);
  return page === undefined ? null : page;
}

/* ------------------------------------------------------------------ *
 * Reading-progress helpers
 * ------------------------------------------------------------------ */

/**
 * The 1-based position of a page in the `sitePages` reading order: home is
 * 1 and the last story is `sitePages.length`.
 *
 * Pure: no side effects, no I/O. Throws for ids that are not part of the
 * content model, the same way `getSitePage` does.
 */
export function storyIndex(pageId: SitePageId): number {
  const index = sitePages.findIndex((candidate) => candidate.id === pageId);
  if (index === -1) {
    throw new Error(`Unknown site page: ${pageId}`);
  }
  return index + 1;
}

/**
 * The reader-facing position label for a page, exactly
 * "Story N of 5": the page's 1-based index over the five-story sequence.
 *
 * Pure: no side effects, no I/O. Throws for ids that are not part of the
 * content model.
 */
export function storyPositionLabel(pageId: SitePageId): string {
  return `Story ${storyIndex(pageId)} of ${sitePages.length}`;
}

/**
 * The page that follows a given page in the `sitePages` reading order, or
 * `null` on the final story (`longevity`), where the sequence ends.
 *
 * Pure: no side effects, no I/O. Throws for ids that are not part of the
 * content model.
 */
export function nextStory(pageId: SitePageId): SitePage | null {
  const index = storyIndex(pageId) - 1;
  const next = sitePages[index + 1];
  return next === undefined ? null : next;
}
