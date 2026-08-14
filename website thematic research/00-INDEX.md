# Website Thematic Research — INDEX

**Created:** August 10, 2026
**Disk location:** `Truhu\competitive landscape\website thematic research\`
**Purpose:** Two jobs in one folder. (1) Record what the competitive set actually does on its own websites — structure, appeals, imagery, video, proof, colour, trust. (2) Turn that into a build-ready description of what truhu.ai should become, aligned to the Advisor workflow direction.

**Scope boundary:** this folder describes the website. It does not build it. No code ships from here beyond token values and component names.

---

## Contents

| File | What it is |
|---|---|
| `01-competitor-website-teardowns.md` | Thirteen site teardowns. Per company: information architecture, hero treatment, appeal type, imagery, video, social proof, demo mechanism, trust signals, palette read, and a steal/avoid line. |
| `02-pattern-library-and-category-conventions.md` | The cross-cutting synthesis. The canonical section inventory for this category, the four appeal families, imagery and video conventions, the four demo mechanisms, the social-proof ladder, trust architecture, naming conventions, and the anti-patterns. **Read this if you read only one file.** |
| `03-truhu-website-blueprint.md` | **The deliverable.** Strategic frame, sitemap, and a page-by-page, section-by-section specification for the new truhu.ai — what each block says, what it proves, what asset it needs, and what CTA it carries. Includes what to remove from the current site and why. |
| `04-design-system-and-build-notes.md` | Brand tokens extended for web, typography scale, the signature element, motion and imagery art direction, component inventory, and Next.js implementation notes. |
| `05-claims-and-proof-register.md` | Every claim the site wants to make, graded. What is safe, what needs a label, what must be cut, and the proof assets that have to exist before certain sections can ship. |
| `06-source-log.md` | Every URL retrieved, with access date and what was taken from it. |

## Reading order

**Marketing/design lead:** 02 → 03 → 04.
**Founder / CEO candidate:** 03 §1–2 → 05.
**Engineer picking up the Next.js build:** 03 → 04 → 06.

---

## Method and evidence discipline

Thirteen competitor sites were retrieved directly on **August 10, 2026** (plus supporting search results). Everything in file 01 that describes structure, section order, copy themes, asset types, logo walls and stated numbers was read off the live page or its indexed content.

Three honest limits, stated up front so nobody over-reads this work:

1. **Colour values are read, not sampled.** Page content was retrieved as text and structure, not as rendered pixels. Palette notes in file 01 are inferred from brand asset filenames, alt text (Brite's own alt text names a purple arrow), logo file naming (`zywave-logo-insuring-growth-blue`), and general brand knowledge. They are directionally right and good enough for strategy. **They are not sampled hex values.** Before any visual benchmarking deck is built, do a one-hour pass with a browser and an eyedropper and overwrite the palette lines in file 01.
2. **No competitor product was used.** Same limitation the main competitive corpus carries. What a site *says* its product does is marketing copy, and is labelled as such.
3. **Stated scale numbers are vendor claims.** Brite's employee count, Pasito's premium figure, ThreeFlow's premium-under-management, Zywave's data-source counts — all self-reported and unaudited. They are recorded here because *the fact that a competitor puts a number in a stat band* is the design finding. The number itself carries no weight.

## Governing constraints inherited from the corpus

These bind the website work the same way they bind the competitive work.

- **Advisor and Workforce are two separate products** sold to the same broker buyer (`00-product-truth-advisor-and-workforce.md`, Aug 7 2026). The site must not be architected as one build-and-send pipeline. This is the single most consequential constraint on the sitemap, and file 03 §2 addresses it directly.
- **Document-to-content generation is table stakes.** bswift, Pasito, Brite, Planyear, Nayya Build and Selerix all market it. A homepage hero that leads on "our AI reads your plan documents" is claiming the category's floor as a differentiator.
- **Acknowledgement and read-tracking are table stakes** in the frontline-comms lane. Firstup, Blink, Connecteam, WorkJam and Crew market it in their own copy.
- **One checkable error costs more than any positioning gain.** The rule from the positioning thesis applies with more force on a public website than on a slide, because a website is permanently available to every competitor, every prospect and every diligence process.
