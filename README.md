# truhu.ai

A Next.js marketing site built to two sources of truth: the research in
`website thematic research/` for structure and claims, and the **`truhu-deck`
skill** (`assets/truhu-brand.json`) for the brand.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 32 static routes
npx eslint .
```

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 ·
Phosphor icons.

---

## Brand

Everything below comes from `truhu-brand.json` and is wired as tokens in
`app/globals.css`. No component contains a hex value.

- **Palette.** Blue `#0582DC`, green `#38B000`, deep navy `#0F2A44`, card navy
  `#17406D`, leaf `#5FC15E`, ink `#0F172A`, grey `#7D8597`, section grey
  `#F2F3F4`, and the three tints. Retired values (`#254A79`, `#1798C1`,
  `#8CC63E`, Helvetica, Calibri) appear nowhere.
- **Logo.** The real artwork, `public/brand/truhu-logo.png`, lowercase `truhu`
  with the blue/green split. It is never redrawn or recoloured; the
  reverse-white variant is a knockout, the same way the deck kit makes it.
- **Leaf.** The actual angular path from `truhu-leaf.svg`, low opacity, bleeding
  off a corner, one per section. Not a generic blob.
- **Card.** Three rounded corners and one sharp, bottom-right, as the
  `card-shape` utility. The only card shape on the site.
- **Buttons.** Green pill primary, navy outline secondary, radius 9999.
- **Green pop.** Headlines are white or ink with exactly one phrase in green.
- **Voice.** No em or en dashes anywhere (there is a sweep for this), none of
  the banned marketing vocabulary, no price figures, no roadmap ship dates, no
  only-platform superlatives.
- **Proof.** Numbers come from the brand proof bank: 61% click rate, 3.7M
  messages, 2,500+ groups, 246K employees, 36 languages, 5-day SLA, 8 hours to
  30 minutes. Logo wall is the approved partner list only, headed "six of the
  ten largest US brokerages".

**One documented deviation.** The brand file specifies a white label on the
green CTA. White on `#38B000` measures 2.9:1 and fails WCAG AA, so the label is
navy `#0F2A44` (5.1:1). Both colours stay canonical. Change it back only if the
accessibility claims on `/security` and `/about` come off the site too.

## Motion

Scroll-linked rather than time-linked, and almost entirely free: the reveal
system is CSS scroll-driven animation, so it runs on the compositor and ships no
JavaScript.

| Effect | Mechanism |
|---|---|
| Section reveals | `animation-timeline: view()` with an `entry`/`cover` range |
| Staggered grids | Per-child `--i` shifting each child's `animation-range`, so the cascade tracks scroll in both directions |
| Product mocks | A longer `media-settle` on its own view timeline |
| Rules that draw in | `scaleX` on a view timeline |
| Leaf parallax | `leaf-drift` across the full `cover` range, decoration only |
| Reading progress | `animation-timeline: scroll(root block)` |
| Header compress | `@container scroll-state(stuck: top)`, no scroll listener |
| Page transitions | React `<ViewTransition>` with the header anchored via `view-transition-name` |
| FAQ open/close | Native `::details-content` height transition with `interpolate-size` |
| Menu entrance | `@starting-style` |

Every block is gated on `@supports` and on `prefers-reduced-motion`, and reduced
motion disables all of it including the view transitions. Where scroll-driven
animation is unsupported the content is simply already visible; scroll-state
queries are Chromium-only today and degrade to the resting header.

## Claims discipline in code

- `<Stat>` cannot render without a `source`. The type requires it.
- Workflow status comes from **one file**, `lib/workflows.ts`, so a pill cannot
  say Live in the nav and Roadmap on a page. No ship dates, per brand voice.
- `Testimonial` has no photo slot. It renders initials, on purpose.
- Illustrative UI carries a `SampleDataTag`.
- Integrations carry a `verified` flag and unverified entries are not rendered.
  Employee Navigator sits in the data with `verified: false`.
- Roadmap workflow pages show a "planned capability" banner and no product
  imagery at all.

---

## Before this goes to production

1. **Testimonials are drafted.** `QUOTE_BROKER`, `QUOTE_HR`, `QUOTE_OPS` carry
   `approval: "draft"`. The names come from the register; the wording has not
   been signed off by the people quoted. Get sign-off or replace them.
2. **Logo wall.** Only approved partners appear, but "six of the ten largest"
   and each individual relationship still need an internal owner who can
   describe them. Swap the wordmarks for real SVGs once cleared.
3. **Employee Navigator** is blocked pending partner corroboration.
4. **Implementation timelines** are labelled as targets confirmed in scoping.
   CS needs to own them.
5. **Product video.** The blueprint asks for self-hosted loops; this build ships
   CSS and SVG product panels instead. When the clips exist,
   `components/art/panels.tsx` is where they go, behind a `VideoLoop` with a
   poster and a reduced-motion fallback.
6. **Forms** validate, rate-limit and honeypot correctly, then call `deliver()`
   in `app/actions.ts`, which logs server-side. Point it at the CRM.
7. **Analytics.** Nothing loads. Anything added must load post-consent.
