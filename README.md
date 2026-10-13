# truhu.ai

The marketing site, rebuilt as a deliberately small base: **one landing page and
a contact page**, carrying the copy that is live on truhu.ai today. Everything
else was removed so that new sections get added on purpose rather than
inherited.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
```

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4.

---

## Where things live

| Concern | File |
|---|---|
| Every string on the site | `lib/content.ts` |
| Nav, footer, org metadata | `lib/site.ts` |
| Palette, type scale, motion | `app/globals.css` |
| Page assembly | `app/page.tsx` |
| Running product demos | `components/demos/` |
| Booking page (`/get-started`) and its confirmation | `app/get-started/`, `components/get-started/` |
| Booking engine (Cal.com client, dev scheduler) | `lib/booking/`, `app/api/booking/` |
| Funnel tracking (browser tracker, beacon endpoint) | `lib/analytics/`, `app/api/track/` |
| Analytics dashboard: a separate app, setup guide inside | `analytics dashboard/` |

`lib/content.ts` is the only place copy is written. Page components are purely
layout and motion, so a copy change never means touching a component.

## Brand

Tokens are defined once, in `app/globals.css`. No component contains a hex
value, with one exception: the demos use a deliberately non-TruHu colour
(`#0E5A63` and friends) because the guide being generated carries the
**client's** brand, not ours. That contrast is the point of the demo.

- **Palette.** Brand blue `#0582DC` and brand green `#38B000` sit on a cool,
  near-black navy foundation (`#050E1A` → `#16395C`) with cool paper
  (`#F4F7FB`) between. Teal `#21CFC0` exists only as the middle stop of the one
  brand gradient; it is never used as a solid.
- **The gradient.** `--grad-brand` (and its brighter variant for dark surfaces)
  appears in exactly four places: the aurora, one accent phrase per section, the
  reading-progress bar, and meters. Never on body text.
- **Card shape.** Three rounded corners and one sharp, bottom-right, as the
  `card-shape` utility. Cards only — putting it on buttons destroys it.
- **Green pop.** Headlines are white or ink with exactly one gradient phrase.

**One documented deviation.** White on `#38B000` measures 2.9:1 and fails WCAG
AA, so the primary CTA label is `#050E1A` (about 5:1). Both colours stay
canonical.

## Motion

Scroll-linked rather than time-linked, and almost entirely free: the reveal
system is CSS scroll-driven animation, so it runs on the compositor and ships no
JavaScript.

| Effect | Mechanism |
|---|---|
| Hero headline | Per-word mask, each word riding up behind its own clip box on a `--i` delay |
| Section reveals | `animation-timeline: view()` over an `entry`/`cover` range |
| Staggered grids | Per-child `--i` shifting each child's `animation-range`, so the cascade tracks scroll in both directions |
| Product mocks | `reveal-tilt`, a 3D settle from tipped-back to flat |
| Lit surfaces | Three blurred colour fields on long, offset drift loops, behind a masked grid with a travelling scan line |
| Reading progress | `animation-timeline: scroll(root block)` |
| Header compress | `@container scroll-state(stuck: top)`, no scroll listener |
| Page transitions | React `<ViewTransition>`, header anchored via `view-transition-name` |
| Buttons | A light sweep (`.sheen`) crossing once on hover |
| Cards | Pointer-tracked spotlight; the handler writes two custom properties and nothing re-renders |

Every block is gated on `@supports` and on `prefers-reduced-motion`. Where
scroll-driven animation is unsupported the content is simply already visible;
scroll-state queries degrade to the resting header.

### The demos

The four running demos in `components/demos/` are the argument, not decoration.
Each is a small state machine rather than one long keyframe, so a single beat
can drive several unrelated things at once.

- **`GuideBuilder`** — a plan document is read, values are lifted into a guide,
  the client's brand replaces the placeholder grey, and the guide is translated
  and delivered. This is the hero.
- **`FeatureShowcase`** — the four Advisor capabilities, each with its own
  panel: a language stack, a year-long campaign timeline, a microsite whose
  branding swaps between clients, and plan comparison resolving to a
  recommendation. The rail advances itself; a click resets the dwell timer.
- **`PhoneBroadcast`** — the Workforce hero. One phone sends a message to
  three others, each getting something different (English, Spanish, left
  unopened); opens fly back to the sender's live record, a resend reaches only
  the person who missed it, and the sender's phone ends on the report. The
  scene is a fixed canvas that CSS scales to its column (`.bcast` in
  `globals.css`).
- **`LogoMarquee`** — two identical runs in one track, translated -50% for a
  seamless loop, paused on hover.

Demos only run while on screen, and under reduced motion they settle on their
final step rather than looping.

## Claims discipline

- Every number on the page is one truhu.ai publishes today. `lib/content.ts`
  cites nothing that is not on the live site.
- Statistics render their **final** value on the server, so a stat is never
  briefly wrong for a visitor with JavaScript disabled or one who lands
  mid-page.

## Before this goes to production

1. **Logo wall.** Wordmarks stand in for logo files. Swap for real SVGs once
   cleared, and confirm each relationship has an internal owner.
2. **Testimonial.** The Emily F. quote is taken from the live site; confirm it
   is still approved for use.
3. **Forms** validate, rate-limit and honeypot correctly, then call `deliver()`
   in `app/actions.ts`, which logs server-side. Point it at the CRM.
4. **Login** links to `app.truhu.ai`; confirm that is the real destination.
5. **Analytics.** No third-party script loads. `/get-started` runs first-party
   funnel tracking (no cookies, no IPs stored, Global Privacy Control
   honoured); every other page only remembers campaign tags in the visitor's
   own browser. Any ad pixel added for retargeting must load post-consent.
6. **Booking.** `/get-started` needs the Cal.com and Supabase variables listed
   in `analytics dashboard/README.md`. Without Cal.com it falls back to a
   link to `/demo`.
7. **Get-started proof.** The testimonial and both statistics on
   `/get-started` are placeholders, and Bryan's title and background come from
   public sources (see `GET_STARTED_PAGE` in `lib/content.ts`). Confirm his
   details with him, replace the proof with sourced figures, and get the
   client's written OK on the quote, the name and any logo before launch.
