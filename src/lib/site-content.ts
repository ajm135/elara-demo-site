/**
 * Static story content for the Demo Site.
 *
 * This module holds all page copy and image references for the five demo
 * stories: home, how AI helps medicine, cancer, other diseases, and longer
 * lives. It is plain data: no database, no network access, and no UI. The
 * pages in `src/app/` (added in a later milestone) will render `sitePages`,
 * and the synthetic images referenced here will be added under `public/`
 * in a later milestone as well.
 *
 * The tone is deliberately hopeful and plain. This site is an educational
 * demo: it is not medical advice, and it does not promise that cures or a
 * 110-120 year average lifespan are certain.
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

/** One section of page copy. */
export interface SiteSection {
  /** Kebab-case identifier for the section. */
  readonly id: string;
  /** The visible heading for the section. */
  readonly heading: string;
  /** The section's paragraphs, in reading order. */
  readonly paragraphs: readonly string[];
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
}

const homePage: SitePage = {
  id: "home",
  path: "/",
  navLabel: "Home",
  title: "A hopeful look at AI and human health",
  description:
    "A hopeful educational demo about how AI is expected to help cure cancer and many other diseases, and why some researchers expect average human lifespan to reach about 110 to 120 years.",
  heading: "A hopeful look at AI and human health",
  summary:
    "This demo site tells five short, hopeful stories: how artificial intelligence is expected to help humanity diagnose, treat, and eventually cure cancer and many other diseases, and why some researchers expect average human lifespan to reach about 110-120 years. Read them in order, or jump straight to the story you care about most.",
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
        "Then visit the story on cancer, the one this site was built around, follow it with the story on other diseases, from heart disease to infections, and finish with the story on longer lives, where some researchers expect the average human lifespan to reach about 110-120 years.",
      ],
    },
  ],
  images: [
    {
      id: "hopeful-future",
      src: "/images/hopeful-future.svg",
      alt: "A bright sunrise over a landscape of laboratories and hospital buildings, symbolising a hopeful future for medicine",
      width: 1200,
      height: 630,
    },
  ],
  disclaimer:
    "This site is a hopeful educational demo. It is not medical advice, and it is not a promise that cures for cancer and many other diseases, or an average lifespan of 110-120 years, are certain.",
};

const howAiHelpsPage: SitePage = {
  id: "how-ai-helps",
  path: "/how-ai-helps",
  navLabel: "How AI helps",
  title: "How AI is expected to help medicine",
  description:
    "Three ways AI is expected to change medicine: earlier diagnosis, smarter treatment, and faster research into new cures.",
  heading: "How AI is expected to help medicine",
  summary:
    "AI is expected to help in three connected ways. It is expected to help doctors find disease earlier, to help care teams choose better treatments, and to help researchers move from discovery to cure much faster. Together, those three hopes are why researchers expect AI to help humanity cure cancer and many other diseases.",
  sections: [
    {
      id: "earlier-diagnosis",
      heading: "Diagnosis: seeing disease earlier",
      paragraphs: [
        "The first hope is earlier diagnosis. AI tools are expected to help doctors read scans and test results with fewer mistakes and much less delay, so problems such as tumours, vision loss, and heart strain are spotted while there is still time to act.",
        "Earlier is better in almost every disease. A diagnosis made months sooner usually opens up far more treatment options, and that is a quiet superpower of AI.",
      ],
    },
    {
      id: "smarter-treatment",
      heading: "Treatment: choosing what works best",
      paragraphs: [
        "The second hope is smarter treatment. Once a diagnosis is made, AI is expected to help care teams compare thousands of studies and outcomes to choose the plan most likely to help each individual, and to flag when a treatment is working and when it should change.",
        "The goal is not to replace doctors. It is to give every patient the same careful, up-to-date guidance that today is often only available at a handful of specialist centres.",
      ],
    },
    {
      id: "faster-research",
      heading: "Research: from discovery to cure, faster",
      paragraphs: [
        "The third hope is faster research. AI is expected to help scientists design new drugs, predict how they will behave, and read the molecular patterns behind disease, shrinking work that once took decades into work that may take years.",
        "This is where the biggest promises live: a research engine that finds a new treatment for one disease can be turned on the next, which is why researchers expect the benefits to keep compounding.",
      ],
    },
  ],
  images: [
    {
      id: "ai-in-medicine",
      src: "/images/ai-in-medicine.svg",
      alt: "A glowing network of connected data points linking a stethoscope, a laboratory flask, and a medical scan",
      width: 1200,
      height: 630,
    },
  ],
  disclaimer:
    "This site is a hopeful educational demo. It is not medical advice, and it is not a promise that any particular cure or treatment is certain.",
};

const cancerPage: SitePage = {
  id: "cancer",
  path: "/cancer",
  navLabel: "Cancer",
  title: "The hopeful fight against cancer",
  description:
    "Why researchers expect AI to help humanity diagnose, treat, and eventually cure cancer.",
  heading: "The hopeful fight against cancer",
  summary:
    "Cancer is the story this site was built around. It is one of the oldest and toughest diseases humanity has ever fought, and one of the places where AI is expected to have the biggest effect. Researchers expect AI to help find cancer earlier, guide treatment better, and one day help cure it.",
  sections: [
    {
      id: "finding-cancer-earlier",
      heading: "Finding cancer earlier",
      paragraphs: [
        "The clearest near-term hope is earlier detection. AI is expected to help doctors look for early signs of cancer in scans and tests more accurately and more consistently, catching cancers while they are small and most treatable.",
      ],
    },
    {
      id: "better-treatment",
      heading: "Choosing better treatment",
      paragraphs: [
        "Once cancer is found, AI is expected to help care teams pick the treatment most likely to work for a specific patient, weigh the side effects of each option, and keep a close eye on how the body responds week by week.",
      ],
    },
    {
      id: "the-road-to-a-cure",
      heading: "The road to a cure",
      paragraphs: [
        "The boldest hope is the cure itself. AI is expected to help scientists map the molecules that drive cancer, design drugs aimed at them, and test ideas that would once have taken a generation to check.",
        "Cancer is not one disease but many, and that is exactly why a flexible research tool like AI is so promising: the same methods that help with one type of cancer can be adapted to the next. Many researchers see this as the beginning of the end for cancer as a fatal disease, and they say it plainly: AI is expected to help humanity eventually cure cancer.",
      ],
    },
  ],
  images: [
    {
      id: "cancer-research",
      src: "/images/cancer-research.svg",
      alt: "A close-up of a cell being studied under a microscope, surrounded by a ring of data",
      width: 1200,
      height: 630,
    },
    {
      id: "cancer-hope",
      src: "/images/cancer-hope.svg",
      alt: "A small light held in two hands over a dark room, symbolising hope in the fight against cancer",
      width: 800,
      height: 600,
    },
  ],
  disclaimer:
    "This site is a hopeful educational demo. It is not medical advice, and it is not a promise that a cure for cancer is certain or that any particular treatment will work for a specific person.",
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
    "Cancer gets the headlines, but the same hopeful logic applies to nearly every other disease. AI is expected to help humanity diagnose, treat, and eventually cure many diseases too: from heart disease and diabetes to infections and rare conditions that affect only a few thousand people.",
  sections: [
    {
      id: "common-diseases",
      heading: "The diseases that affect the most people",
      paragraphs: [
        "Heart disease, diabetes, stroke, and common infections cause more deaths than almost anything else on Earth. AI is expected to help doctors spot the early warning signs in everyday measurements such as blood pressure, blood sugar, and heart rhythm, and to help choose the treatment that fits each patient best.",
      ],
    },
    {
      id: "fighting-infections",
      heading: "Fighting infections before they spread",
      paragraphs: [
        "For infections, the hope is speed. AI is expected to help identify which bacteria or virus is causing an illness quickly, choose the right medicine, and spot new outbreaks early, so that dangerous infections are treated before they can spread.",
      ],
    },
    {
      id: "rare-diseases",
      heading: "Rare diseases at last get a research engine",
      paragraphs: [
        "Rare diseases are where AI's promise may be most dramatic. With so few patients and so little data per disease, progress has often stalled. AI is expected to help researchers share patterns across diseases, find the causes behind them, and design treatments for conditions that were once written off as hopeless.",
      ],
    },
  ],
  images: [
    {
      id: "other-diseases",
      src: "/images/other-diseases.svg",
      alt: "A circle of icons representing a heart, a sugar molecule, a virus, and a dna helix, connected by lines of data",
      width: 1200,
      height: 630,
    },
  ],
  disclaimer:
    "This site is a hopeful educational demo. It is not medical advice, and it is not a promise that a cure for any particular disease is certain.",
};

const longevityPage: SitePage = {
  id: "longevity",
  path: "/longevity",
  navLabel: "Longer lives",
  title: "Longer lives: a look toward 110-120 years",
  description:
    "Why some researchers expect average human lifespan to reach about 110 to 120 years, and why that is an expectation, not a guarantee.",
  heading: "Longer lives",
  summary:
    "For most of history, human life was short, and that was considered fixed. Now, as AI is expected to help us cure cancer and many other diseases, some researchers expect the limits to move. Some of them expect average human lifespan to reach about 110-120 years within the next couple of generations. That is an expectation, not a guaranteed forecast, but it is the most hopeful number in modern medicine.",
  sections: [
    {
      id: "why-lifespans-move",
      heading: "Why lifespans move at all",
      paragraphs: [
        "Average human lifespan is not a fixed number. Over the last two centuries it has roughly doubled, mostly because people stopped dying of infections, and because of clean water and better care. Each of those gains came from understanding disease better, which is exactly what AI is expected to accelerate.",
      ],
    },
    {
      id: "the-110-120-horizon",
      heading: "The 110-120 year horizon",
      paragraphs: [
        "Here is the number that excites researchers: some of them expect average human lifespan to reach about 110-120 years. Their reasoning is that the diseases which claim the most lives, such as cancer, heart disease, stroke, and diabetes, are exactly the diseases AI is expected to help diagnose earlier, treat better, and eventually cure.",
        "If that chain of hopes holds, a life in your eighties could feel more like a life in your fifties feels today, and living to a hundred could become as ordinary as living to seventy is today.",
      ],
    },
    {
      id: "hope-not-promise",
      heading: "Hope, not promise",
      paragraphs: [
        "It is important to keep this in perspective. Reaching an average of 110-120 years is not a guaranteed forecast. It depends on research that may or may not succeed, on choices societies make, and on facts we do not yet know.",
        "The honest way to say it is this: some researchers expect it, many scientists are working toward it, and nobody can promise it. That is still reason to be hopeful, which is all this demo is asking of you.",
      ],
    },
  ],
  images: [
    {
      id: "longer-lives",
      src: "/images/longer-lives.svg",
      alt: "A long winding road stretching toward the horizon under a wide sky, with taller and taller trees on each side",
      width: 1200,
      height: 630,
    },
  ],
  disclaimer:
    "This site is a hopeful educational demo. It is not medical advice, and it is not a promise that an average human lifespan of 110-120 years is certain: that figure is an expectation held by some researchers, not a guaranteed forecast.",
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
