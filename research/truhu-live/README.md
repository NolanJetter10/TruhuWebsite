# Live truhu.ai — scraped reference (captured 2026-08-20)

Complete copy + assets from the currently live site at https://truhu.ai, saved before
migrating its copy onto the new site in this repo.

## Contents

| File | What it is |
| --- | --- |
| `copy-home.md` | Home page copy, in render order (incl. broker logo list + hero carousel slides) |
| `copy-advisor.md` | Advisor page copy, incl. full FAQ (5 categories, extracted from JS bundle) |
| `copy-workforce.md` | Workforce page copy, incl. full FAQ (7 categories) and testimonial carousel |
| `copy-contact.md` | Contact page copy |
| `copy-footer.md` | The site-wide footer "bumper" (company info block) |
| `images/` | All 50 site images downloaded from truhu.ai (`/images/...` paths preserved) |
| `screenshots/` | Full-page screenshots of home, advisor, workforce, contact, resources |
| `urls.json` | Site map from firecrawl |
| `advisor-source.html`, `home-source.html`, `advisor-raw.html`, `workforce-raw.html` | Raw page sources |

Raw firecrawl markdown scrapes also live in `.firecrawl/truhu.ai/` at the repo root.

## Capture notes

- FAQ accordions and the testimonial/hero carousels render client-side, so their copy is
  NOT in the scraped markdown. It was extracted from the site's JS chunks and is complete
  in the `copy-*.md` files.
- Image paths in the copy docs are the live site's `/images/...` paths; the same files are
  saved under `images/` here (e.g. `/images/brokers/acrisure.png` → `images/brokers/acrisure.png`).
- Live site stat animation: home ROI counters animate 0→target (15%, 75%, 36%).
- The live footer reads "© 2026 Truly Human Technologies, Inc." and the tagline is
  "Responsible AI built for the employee benefits industry."
