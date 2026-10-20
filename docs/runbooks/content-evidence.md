# Claim evidence register

This register is the evidence trail for every consequential health claim the Demo Site ships in `src/lib/site-content.ts`. For each claim it records the claim id and page, the evidence stage, each cited publication (title, publishing body or journal, publication date, stable URL or DOI), the relevant finding, where that finding appears in the source, what the finding does **not** support, and the claim's limitations.

## How the sources were inspected

- Every source in the catalogue was opened directly at its stable URL or DOI on **2026-10-18**. The findings below quote or closely paraphrase what the source actually displays; no finding, page location, author, or review date was invented.
- Publication dates are recorded exactly as the source displays them: the WHO fact sheets show a date under their title; the FDA page shows "Content current as of: 09/22/2026"; the JMI paper's date is the issued date registered with Crossref at its DOI.
- One inspection limitation applies to the JMI paper: SPIE Digital Library (the full-text site) blocked automated retrieval, so that source was inspected through its DOI record — the citation metadata and the publisher-registered full abstract returned by the DOI resolver and Crossref. The findings below for that source are quoted from the abstract, not from the full text.
- A claim's `lastReviewed` in `src/lib/site-content.ts` is set to a date only in the same pass that records the claim's findings here. All five sources were inspected on 2026-10-18, so every current claim carries that date.

## Policy stated here, per ADR 0005

- **Clinical use is not universal availability or approval.** A device being in clinical use means it is approved and used for a specific task, in a specific place (for the FDA source: the United States). It is not evidence that the device is available everywhere, approved for every use, or representative of all AI tools.
- Claims are staged as clinical-use, experimental-research, or speculation. A claim that a source does not support at its stated stage is narrowed or removed from `src/lib/site-content.ts`, never kept and re-labeled.
- The site's copy never promises a cure and makes no forecast of the future population-average human lifespan.

## Where the sources appear on the pages

- The four story pages cite their sources in the per-claim evidence panels (`figure.claim-evidence`) that `src/components/story-page.tsx` renders immediately after the claiming paragraph, still inside that section.
- The home page makes no consequential claim of its own, so it carries the site-wide evidence base instead: a sources block (`section.sources`) rendered after the reading map and before the disclaimer, listing the complete `referenceCatalogue` in catalogue order. The block introduces the evidence base; it asserts nothing the catalogue entries do not already state, so it adds no claim to this register and no new source to the catalogue.

## Sources in the catalogue

### who-cancer-fact-sheet

- Title: Cancer
- Publishing body: World Health Organization
- Publication date (as displayed on the page): 3 July 2026
- Stable URL: https://www.who.int/news-room/fact-sheets/detail/cancer
- Inspected: opened on 2026-10-18; the page displays "3 July 2026" under the title, matching the catalogue entry.

### fda-ai-enabled-devices

- Title: Artificial Intelligence-Enabled Medical Devices
- Publishing body: U.S. Food and Drug Administration
- Publication date (as displayed on the page): "Content current as of: 09/22/2026"
- Stable URL: https://www.fda.gov/medical-devices/digital-health-center-excellence/artificial-intelligence-enabled-medical-devices
- Inspected: opened on 2026-10-18; the page displays "Content current as of: 09/22/2026" in its footer block, matching the catalogue entry.

### who-ageing-and-health

- Title: Ageing and health
- Publishing body: World Health Organization
- Publication date (as displayed on the page): 1 October 2025
- Stable URL: https://www.who.int/news-room/fact-sheets/detail/ageing-and-health
- Inspected: opened on 2026-10-18; the page displays "1 October 2025" under the title, matching the catalogue entry.

### who-ncd-fact-sheet

- Title: Noncommunicable diseases
- Publishing body: World Health Organization
- Publication date (as displayed on the page): 25 September 2025
- Stable URL: https://www.who.int/news-room/fact-sheets/detail/noncommunicable-diseases
- Inspected: opened on 2026-10-18; the page displays "25 September 2025" under the title, matching the catalogue entry.

### jmi-2026-imaging-ai-bias-review

- Title: Beyond accuracy: a systematic scoping review of algorithmic bias measurement and mitigation in peer-reviewed publications in medical imaging AI development and evaluation for classification
- Journal: Journal of Medical Imaging (SPIE), vol. 13, issue 04, pp. 1–11; authors Sara C. Chaker, Sahil Sethi, Heather M. Whitney (as registered with the DOI)
- Publication date (as registered with Crossref at the DOI): issued 12 August 2026
- Stable DOI: 10.1117/1.jmi.13.4.040901 (https://doi.org/10.1117/1.jmi.13.4.040901)
- Inspected: the DOI record was opened on 2026-10-18. Limitation: the SPIE full-text page blocked automated retrieval, so the recorded findings come from the publisher-registered abstract in the DOI/Crossref record, not from the full text.

## Claims

### ai-scan-reading-earlier — page: how-ai-helps (`/how-ai-helps`, section "Diagnosis: seeing disease earlier")

Claim sentence: "AI tools are expected to help doctors read scans and test results with fewer mistakes and much less delay, so problems such as tumours, vision loss, and heart strain are spotted while there is still time to act."

Evidence stage: experimental research. Last reviewed: 2026-10-18.

Reference 1 — Artificial Intelligence-Enabled Medical Devices, U.S. Food and Drug Administration, 22 September 2026 (content current as of), https://www.fda.gov/medical-devices/digital-health-center-excellence/artificial-intelligence-enabled-medical-devices

- Relevant finding: AI-enabled medical devices "provide information that supports diagnoses, cures, and treatments for a range of diseases and conditions"; innovators apply AI to "tools that support earlier disease detection and diagnosis"; the page's named examples include "An imaging system that uses algorithms to give diagnostic information for skin cancer in patients", "Software that uses deep learning to sharpen images", "AI systems that can detect diabetic retinopathy from retinal images", and a "Smart sensor device that estimates the probability of a heart attack" — the tumour, vision-loss, and heart tasks in the claim sentence.
- Where in the source: opening paragraphs and the "List of AI-Enabled Medical Devices" section (bulleted example list).
- What the finding does not support: any measured size for "fewer mistakes" or "much less delay" (the page quotes no accuracy or turnaround figures), and any use outside what is authorized for marketing in the United States.

Reference 2 — Beyond accuracy: a systematic scoping review of algorithmic bias measurement and mitigation…, Journal of Medical Imaging, 12 August 2026 (issued), DOI 10.1117/1.jmi.13.4.040901

- Relevant finding: a scoping review of peer-reviewed studies (PubMed and Embase, January 2015–May 2025) that evaluate algorithmic bias in classification medical imaging AI found only eight eligible studies; "Nearly all studies (7/8) used a chest X-ray radiography classifier for evaluation and examined algorithmic bias with respect to gender, age, and race", with "considerable heterogeneity in the bias metrics used".
- Where in the source: abstract (Approach and Results).
- What the finding does not support: that current scan-reading tools reliably perform evenly across populations — that is exactly the open concern the review documents.

Limitations: false positives, missed diagnoses, and overdiagnosis are explained in the same paragraph of the page copy; performance is not assumed even across populations (uneven population performance, per the JMI review); the final reading ends with a clinician (clinician oversight, in the same paragraph); availability is limited to devices authorized in the United States (limited availability); the "expected to" framing is an expectation, not a demonstrated, quantified improvement, which is why the claim is staged as experimental research rather than clinical use.

### ai-uneven-performance — page: how-ai-helps (`/how-ai-helps`, section "Diagnosis: seeing disease earlier")

Claim sentence: "Performance is not always even across populations, either: a tool can work less well for some groups of patients than for others, and whether that happens across gender, age, or race is a concern researchers are actively measuring, with a published record that is still small."

Evidence stage: experimental research. Last reviewed: 2026-10-18.

Reference 1 — Beyond accuracy: a systematic scoping review of algorithmic bias measurement and mitigation…, Journal of Medical Imaging, 12 August 2026 (issued), DOI 10.1117/1.jmi.13.4.040901

- Relevant finding: the review's stated purpose is the "concerns over ensuring that the outputs of these models, when deployed in clinical environments, provide unbiased classifications across different patient populations or operational factors"; its results report eight eligible studies (half on bias detection, half on mitigation) that examined bias "with respect to gender, age, and race"; its conclusion: "The relative paucity of existing literature and variability in fairness evaluation methods underscore the need for more standardized frameworks to evaluate and ensure fairness in imaging AI systems."
- Where in the source: abstract (Purpose, Results, Conclusions).
- What the finding does not support: a specific training mechanism (the earlier wording "a tool trained mostly on one group often works less well for another" stated a mechanism and a frequency the abstract does not make, so the shipped sentence was narrowed to the concern-under-measurement framing) and any finding about a specific named tool.

Limitations: uneven population performance is the subject of the claim, and the underlying literature is small (eight eligible studies) and heterogeneous in metrics, with nearly all studies using chest X-ray classifiers — this is an early research landscape, not an established rule about every tool; the JMI source was inspected at abstract level (publisher-registered abstract via the DOI record) because the full text was not retrievable; clinical deployment of any tool remains under clinician oversight, as the same page paragraph states.

### ai-devices-clinical-use — page: how-ai-helps (`/how-ai-helps`, section "Three stages: real today, in research, or just a hope")

Claim sentence: "Some AI-enabled devices are already in clinical use: approved for specific tasks, such as reading certain kinds of scans, and working in real clinics today."

Evidence stage: clinical use. Last reviewed: 2026-10-18.

Reference 1 — Artificial Intelligence-Enabled Medical Devices, U.S. Food and Drug Administration, 22 September 2026 (content current as of), https://www.fda.gov/medical-devices/digital-health-center-excellence/artificial-intelligence-enabled-medical-devices

- Relevant finding: "The FDA has authorized over 1,600 AI-enabled medical devices for marketing in the United States as of September 2026", including devices for specific tasks such as giving diagnostic information for skin cancer, sharpening images, detecting diabetic retinopathy from retinal images, estimating heart-attack probability, and automating insulin dosing from continuous glucose monitor readings.
- Where in the source: "List of AI-Enabled Medical Devices" section (opening sentence and bulleted example list).
- What the finding does not support: that every AI tool is approved, that an approval covers every use a device could have, or that these devices are available outside the United States or in every clinic — the authorization statement is US-only and task-specific.

Limitations: clinical use is not universal availability or approval: the source documents authorization for marketing in the United States for specific intended uses only; a reader should not infer worldwide or all-purpose availability from this claim.

### ai-approval-not-universal — page: how-ai-helps (`/how-ai-helps`, section "Three stages: real today, in research, or just a hope")

Claim sentence: "But approval for one specific use is not approval for every use, and it is not the same as the device being available everywhere."

Evidence stage: clinical use. Last reviewed: 2026-10-18.

Reference 1 — Artificial Intelligence-Enabled Medical Devices, U.S. Food and Drug Administration, 22 September 2026 (content current as of), https://www.fda.gov/medical-devices/digital-health-center-excellence/artificial-intelligence-enabled-medical-devices

- Relevant finding: "The FDA does not regulate AI as such; it regulates medical devices, including AI-enabled medical devices"; devices are reviewed "through an appropriate premarket pathway, such as premarket clearance (510(k)), De Novo classification, or premarket approval", and the FDA also reviews "modifications to medical devices, including AI-enabled medical device software functions, that could significantly affect the safety or effectiveness of a device"; authorizations are stated "for marketing in the United States".
- Where in the source: "FDA Regulation of AI in Medical Devices" section (regulation of devices and software functions per intended use) and "List of AI-Enabled Medical Devices" section (US-only authorization statement).
- What the finding does not support: the opposite claim — that a single approval covers every use or every place. The page documents per-device, per-intended-use regulation; it is not a statement that some approval ever did cover all uses.

Limitations: clinical use is not universal availability or approval; the scope of the source is US premarket authorization, so "available everywhere" is explicitly outside what any cited approval establishes.

### ai-cancer-early-detection — page: cancer (`/cancer`, section "Finding cancer earlier")

Claim sentence: "AI is expected to help doctors look for early signs of cancer in scans and tests more accurately and more consistently, catching cancers while they are small and most treatable."

Evidence stage: experimental research. Last reviewed: 2026-10-18.

Reference 1 — Cancer, World Health Organization, 3 July 2026, https://www.who.int/news-room/fact-sheets/detail/cancer

- Relevant finding: "Cancer mortality is reduced when cases are detected and treated early"; "When identified early, cancer is more likely to respond to treatment and can result in a greater probability of survival with less morbidity, as well as less expensive treatment"; "Some of the most common cancer types, such as breast cancer, cervical cancer, oral cancer, and colorectal cancer, have high cure probabilities when detected early and treated according to best practices"; "Screening programmes are effective for some but not all cancer types"; patient selection for screening is "based on age and risk factors to avoid excessive false positive studies"; "There is, however, a significant variation in treatment availability between countries of different income levels".
- Where in the source: "Key facts" ("Many cancers can be cured if detected early and treated effectively"), "Early detection", "Early diagnosis", "Screening", and "Treatment" sections.
- What the finding does not support: anything about AI — the fact sheet does not mention AI. It supports the value of early detection (why the hope matters), not the AI part of the claim, which rests on the FDA and JMI references.

Reference 2 — Artificial Intelligence-Enabled Medical Devices, U.S. Food and Drug Administration, 22 September 2026 (content current as of), https://www.fda.gov/medical-devices/digital-health-center-excellence/artificial-intelligence-enabled-medical-devices

- Relevant finding: AI-enabled devices are applied to "tools that support earlier disease detection and diagnosis", with authorized examples including an imaging system that gives diagnostic information for skin cancer and deep-learning software that sharpens images.
- Where in the source: opening paragraphs and "List of AI-Enabled Medical Devices" section.
- What the finding does not support: that AI detection is more accurate or more consistent than current practice by any measured margin; it documents that authorized tools for these tasks exist in the United States.

Reference 3 — Beyond accuracy: a systematic scoping review of algorithmic bias measurement and mitigation…, Journal of Medical Imaging, 12 August 2026 (issued), DOI 10.1117/1.jmi.13.4.040901

- Relevant finding: quantitative fairness measurement in medical imaging AI is an active but underdeveloped research area (eight eligible studies; heterogeneous metrics; mostly gender, age, and race in chest X-ray classifiers).
- Where in the source: abstract (Results, Conclusions).
- What the finding does not support: that the performance of current cancer-imaging AI is established across populations — the unevenness question is open.

Limitations: false positives (WHO: screening selection aims to avoid excessive false positive studies; the same page paragraph names false positives and the scans and biopsies they trigger), missed diagnoses (the same page paragraph states some cancers are missed even with screening), overdiagnosis (the same page paragraph names overdiagnosis of findings that would never have caused harm), uneven population performance (JMI review), clinician oversight (the same page paragraph: any AI suggestion goes through a radiologist or clinician before it becomes a diagnosis), and limited/uneven availability (WHO: significant variation in treatment availability between countries of different income levels). The claim stays at "expected to" — experimental research — because no cited source demonstrates a measured accuracy gain for AI cancer detection.

### ai-cancer-clinical-use — page: cancer (`/cancer`, section "Choosing better treatment")

Claim sentence: "Some AI-enabled devices are already in clinical use for particular kinds of scans and readings, and approval for one of those uses is not the same as approval for everything the device could do."

Evidence stage: clinical use. Last reviewed: 2026-10-18.

Reference 1 — Artificial Intelligence-Enabled Medical Devices, U.S. Food and Drug Administration, 22 September 2026 (content current as of), https://www.fda.gov/medical-devices/digital-health-center-excellence/artificial-intelligence-enabled-medical-devices

- Relevant finding: the FDA "has authorized over 1,600 AI-enabled medical devices for marketing in the United States as of September 2026" for specific tasks (skin cancer imaging, image sharpening, diabetic retinopathy detection, heart-attack probability, insulin dosing); FDA "regulates medical devices, including AI-enabled medical devices" through premarket pathways, and reviews AI-enabled software-function modifications that could significantly affect safety or effectiveness.
- Where in the source: "List of AI-Enabled Medical Devices" section (authorization count and examples) and "FDA Regulation of AI in Medical Devices" section (per-intended-use review).
- What the finding does not support: that an approval extends beyond the authorized use, or beyond the United States.

Limitations: clinical use is not universal availability or approval — US-only, per-intended-use authorization; the wider personalized-treatment vision described in the same page paragraph is staged there as experimental research, and the final decision stays with the oncology team and the patient (clinician oversight).

### ncd-death-burden — page: diseases (`/diseases`, section "The diseases that affect the most people")

Claim sentence: "Heart disease, diabetes, stroke, and other chronic conditions cause more deaths than almost anything else on Earth."

Evidence stage: clinical use (established, current public-health data, not a research goal). Last reviewed: 2026-10-18.

Reference 1 — Noncommunicable diseases, World Health Organization, 25 September 2025, https://www.who.int/news-room/fact-sheets/detail/noncommunicable-diseases

- Relevant finding: "Noncommunicable diseases (NCDs) killed at least 43 million people in 2021, equivalent to 75% of non-pandemic-related deaths globally"; "Cardiovascular diseases account for most NCD deaths, or at least 19 million deaths in 2021, followed by cancers (10 million), chronic respiratory diseases (4 million), and diabetes (over 2 million including kidney disease deaths caused by diabetes)"; the main NCD types are "cardiovascular diseases (such as heart attacks and stroke), cancers, chronic respiratory diseases (such as chronic obstructive pulmonary disease and asthma) and diabetes", which "tend to be of long duration".
- Where in the source: "Key facts" list (first and fourth bullets) and "Overview" section (main types of NCDs).
- What the finding does not support: the earlier wording's inclusion of "common infections" in the leading death burden — infections are not NCDs, and the fact sheet's 75% figure counts non-pandemic deaths in 2021. Because the source does not support that part, "common infections" was removed from the shipped sentence and replaced with "other chronic conditions" during this inspection.

Limitations: the figures are global and from 2021; the fact sheet does not discuss AI, so the AI expectation sentence that follows in the same paragraph is unclaimed expectation copy, not part of this claim; the claim says nothing about treatment availability, which varies by country and income level (the same fact sheet notes countries with inadequate health-care coverage are unlikely to provide universal access to essential NCD interventions).

### lifespan-rise-history — page: longevity (`/longevity`, section "Why lifespans move at all")

Claim sentence: "People worldwide are living longer, and today most people can expect to live into their sixties and beyond, and the pace of that change is much faster than in the past."

Evidence stage: clinical use (established demographic fact, not a research goal). Last reviewed: 2026-10-18.

Reference 1 — Ageing and health, World Health Organization, 1 October 2025, https://www.who.int/news-room/fact-sheets/detail/ageing-and-health

- Relevant finding: "People worldwide are living longer. Today most people can expect to live into their sixties and beyond."; "The pace of population ageing is much faster than in the past."
- Where in the source: "Overview" section (opening sentences) and "Key facts" list (third bullet).
- What the finding does not support: a specific starting point (the earlier wording said "since the middle of the last century") or a causal attribution (the earlier wording said "mostly because people stopped dying of infections, and because of clean water and better care") — the fact sheet states neither, so the shipped sentence was narrowed to the Overview and Key-facts wording during this inspection. The general historical context in the following sentence of the paragraph is unclaimed copy, not part of this claim.

Limitations: this is a demographic observation, not a forecast; the page makes no forecast of what the average human lifespan will be in the future, and this claim supports none.

### healthy-lifespan-definition — page: longevity (`/longevity`, section "Three numbers, three different things")

Claim sentence: "The third number is healthy lifespan: the proportion of life a person spends in good health."

Evidence stage: clinical use (an established measure of population health, not a research goal). Last reviewed: 2026-10-18.

Reference 1 — Ageing and health, World Health Organization, 1 October 2025, https://www.who.int/news-room/fact-sheets/detail/ageing-and-health

- Relevant finding: "Evidence suggests that the proportion of life in good health has remained broadly constant, implying that the additional years are in poor health. If people can experience these extra years of life in good health and if they live in a supportive environment, their ability to do the things they value will be little different from that of a younger person."
- Where in the source: "Factors influencing healthy ageing" section (first and second paragraphs).
- What the finding does not support: the specific metric name "healthy life expectancy" — that phrase does not appear in the fact sheet, so the earlier wording "often measured as healthy life expectancy" was removed from the shipped sentence and the fact sheet's own "proportion of life in good health" wording was used instead during this inspection. The second sentence of the shipped paragraph ("Evidence suggests that the proportion of life in good health has remained broadly constant…") is quoted context from the same section; it is unclaimed copy that sits in the paragraph whose evidence block cites this source.

Limitations: the "broadly constant" finding is a long-term global observation; it does not rule out that the earlier-diagnosis and better-treatment progress the page describes as a hope could add healthy years, and the fact sheet's own conditional ("If people can experience these extra years of life in good health…") keeps the page's hopeful framing honest.

## What this inspection changed

During the 2026-10-18 inspection, four claims were narrowed in `src/lib/site-content.ts` because their earlier wording went beyond what the cited source says. The matching tests were updated, and `npm test` passes:

- `ai-uneven-performance`: "a tool trained mostly on one group often works less well for another" (an unsupported mechanism and frequency) → the concern-under-measurement wording quoted above.
- `ncd-death-burden`: "common infections" removed from the leading-death-burden sentence (not supported by the NCD fact sheet) → "other chronic conditions".
- `lifespan-rise-history`: "since the middle of the last century" and the "infections / clean water / better care" attribution removed (not stated in the ageing fact sheet) → the Overview/Key-facts wording quoted above.
- `healthy-lifespan-definition`: "often measured as healthy life expectancy" removed (the metric name is not in the fact sheet) → the fact sheet's "proportion of life in good health" wording, with the fact sheet's "broadly constant" finding added as quoted context.

Also updated: `tests/claim-references.test.ts` now requires every shipped claim to carry a real last-reviewed ISO date (no nulls remain), and `tests/claim-evidence-rendering.test.tsx` exercises the "not yet re-checked" gap label with an explicit undated claim instead of relying on a shipped null.

## Claims no longer in the shipped copy

Two forecast claims that earlier drafts attached to the copy were removed from the shipped copy in an earlier task of this milestone, before this inspection, and are therefore not claims here:

- The cure prediction (AI will eventually cure cancer and many other diseases): no cited source supports it, so it was removed from the copy rather than kept as a speculation claim.
- The 110–120-year population-average lifespan forecast ("within a couple of generations"): no cited source supports it, so it was removed; the longevity page now explains life expectancy, maximum lifespan, and healthy lifespan and states it offers no forecast of the future population average.
