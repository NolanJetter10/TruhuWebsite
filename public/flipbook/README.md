# public/flipbook

Copied, not forked. These files let /BryanKleppe show Kindlerye's guide in the
same flipbook viewer the benefits-guides API serves for a published guide. Don't
edit the copied files here: change them in benefits-guides and copy them again,
so a diff against the source stays empty.

## Copied verbatim

From `benefits-guides/apps/api/public/`, last changed there in commit
`3353d7322` (2026-10-23), copied 2026-10-28:

- `pdf-flipbook.js` (the viewer, an ES module)
- `pdf-flipbook-lib.js` (its helpers)
- `pdf-flipbook.css`
- `pdf-flipbook-page-turn.mp3` (CC0, "Page Turn" by yatoimtop on freesound.org)

From `pdfjs-dist@6.3.289` (Apache-2.0, Mozilla), the version the API pins, into
`pdfjs/`. Like the API, these are the legacy builds, for older browsers:

- `pdfjs/pdf.min.mjs` (`legacy/build/pdf.min.mjs`)
- `pdfjs/pdf.worker.min.mjs` (`legacy/build/pdf.worker.min.mjs`)
- `pdfjs/LICENSE`

## Written for this site

- `kindlerye.html` recreates the shell the API returns for `GET /p/:slug` on a
  guide template (`apps/api/src/routes/guides.ts`, search `__BG_FLIPBOOK__`),
  pointed at these static files. It leaves out the AI assistant, Share button
  and language switcher the API injects. Default view mode: flipbook.
- `kindlerye-outline.json` is the outline `GET /p/:slug/outline` would return.
  It's the `BgOutline` entry embedded in the PDF's Info dictionary (see
  `apps/api/src/lib/pdf-embedded-outline.ts`), copied as is.

The guide itself is `public/kindlerye/kindlerye-2027-benefits-guide.pdf`, from
`Documents/Truhu/Video Production/Marketing Assets/02 Kindlerye Demo Company/
Kindlerye 2027 Benefits Guide - TruHu (After).pdf`. Kindlerye is a made-up demo
company.
