# Asap — the headline font

The site's headings are set in **Asap**, a free typeface under the
**SIL Open Font License 1.1**. The full licence text is saved beside this
note as `OFL.txt` (it contains the licence's "PERMISSION & CONDITIONS"
section, as the licence requires it to be distributed with the font).

## Why this family

The new look is modelled on the visual reference
`https://demo.templatemonster.com/demo/55809.html` (the "Medina"
diagnostic-center template). That template's own stylesheets set its
headings (`h1`, `h2`, `h3`, `.h1`, `.h2`, `.h3`) in **Asap** and its body
copy in Lato. Asap is itself under the SIL Open Font License, so the
reference's own headline family is used rather than an approximation.
Body text stays in **Inter**, which is already committed in this folder
(see `LICENSE.md`).

No code, image, icon or text from the reference was copied: only the
family name was noted, and the font file itself comes from the font's
own upstream distribution.

## The file

- `asap-variable.ttf` — the variable build of Asap (TrueType), used for
  the headings through `next/font/local` in `src/lib/fonts.ts`
  (exported as `headingFont`, exposed as the CSS custom property
  `--font-heading`).
  - Family: `Asap`; style: `Regular` (the variable file covers every
    weight from 100 to 900, and the width axis from 75 to 125).
  - Version: **3.002** (read from the font file's own `name` table).
  - Copyright, as recorded in the font file's `name` table:
    "Copyright 2018 The Asap Project Authors
    (https://github.com/Omnibus-Type/Asap)".

## Source, version and date

- **Source:** the Google Fonts distribution of the family, directory
  `ofl/asap` of the `google/fonts` repository on GitHub, file
  `Asap[wdth,wght].ttf` (the same build the reference template's font
  request resolves to). The upstream project is **Omnibus-Type / Asap**
  (`github.com/Omnibus-Type/Asap`); the Google Fonts build was taken
  from upstream commit `2de32f20d7a0d48d4084adcf4bd6ac8115cf2f1a`.
- **Licence text:** `OFL.txt` from the same `ofl/asap` directory — the
  SIL Open Font License 1.1 as published with the font.
- **Version:** font version 3.002.
- **Date:** downloaded and committed on **4 November 2026**.

The file was downloaded once while building this milestone and is served
from this computer only: the site loads it through `next/font/local`,
which bundles it into the build output. Nothing is fetched from the
internet at runtime.
