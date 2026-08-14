# Design System and Build Notes

**Created:** August 10, 2026
**Scope:** the visual and technical direction for the truhu.ai rebuild. Tokens, type, the signature element, art direction, motion, component inventory, and Next.js implementation notes.

**Source of truth for brand:** the canonical TruHu brand as recorded in the `truhu-deck` skill and `assets/truhu-brand.json`. The web system **extends** that brand; it does not reinvent it. A deck and a website made in the same quarter must look like they came from the same company.

---

# 1. Colour

## 1.1 Canonical brand tokens (do not change)

| Token | Hex | Role |
|---|---|---|
| `navy-900` | `#0F2A44` | Deep navy. Hero and closing backgrounds, primary dark surface |
| `navy-700` | `#17406D` | Card navy |
| `green-500` | `#38B000` | The pop. Accents and stat numerals **only** |
| `leaf-400` | `#5FC15E` | Leaf motif, low opacity only |
| `blue-500` | `#0582DC` | Brand blue. Eyebrows, labels, links |
| `ink-900` | `#0F172A` | Body text |
| `grey-500` | `#7D8597` | Secondary text, captions |
| `tint-100` | `#EAF1F9` | Navy-tint card and section background |

**Retired — never use.** Navy `#254A79`; greens `#8CC63E` and `#70AD47`; Helvetica Neue; Calibri. These appear throughout legacy decks. Remapping them is the rebrand.

## 1.2 Web extensions (new, needed for a site)

The deck palette has no neutrals scale, no states, and no borders. Add these and nothing else — a token set that grows past this becomes a second brand.

| Token | Value | Role |
|---|---|---|
| `white` | `#FFFFFF` | Primary surface |
| `surface-50` | `#F7FAFC` | Alternating section band |
| `border-200` | `#DFE7EF` | Hairlines, card borders, dividers |
| `grey-700` | `#4A5568` | Body text on tinted surfaces |
| `green-600` | `#2E8F00` | Green on light backgrounds where `#38B000` fails contrast |
| `green-100` | `#E8F6E1` | Status-pill background (Live) |
| `amber-500` | `#B26B00` | Status pill (Early access) — the only added hue |
| `red-600` | `#B42318` | Form errors only |

**Contrast rule.** `green-500` on white is roughly 3:1 and **fails WCAG AA for body text**. It is a display and accent colour: large numerals, iconography, non-text UI. Where green must carry text, use `green-600` on white or `leaf-400`/white on `navy-900`. This matters more here than on most sites, because accessibility is part of the trust story (§6 of file 02) and because a company selling employee comprehension cannot ship inaccessible text.

## 1.3 Where colour goes

- **Dark navy** owns the hero, the closing CTA, and one mid-page band. Three dark zones maximum; more and the page becomes a deck.
- **White and `surface-50`** alternate through the body.
- **`tint-100`** is the card background inside light sections.
- **Green** appears no more than three or four times per page. Once a page has green everywhere it has green nowhere.
- **No gradients as decoration.** The category is full of purple-to-blue mesh gradients. A flat navy field with one green mark is more distinctive in this set than another gradient.

## 1.4 Against the competitive set

Reading the palettes in file 01: Brite runs black and purple; Nayya runs violet/indigo; Zywave runs corporate blue; Pasito and Planyear run modern-SaaS neutrals; ThreeFlow runs white and deep navy with a green accent.

**Two implications.** First, TruHu's navy-plus-green is closest to ThreeFlow — the best-executed site in the set — so differentiation has to come from typography, the card shape and photography rather than from hue. Second, green is genuinely uncommon as a *primary* accent in this category. Use it confidently and sparingly rather than diluting it toward the field.

---

# 2. Typography

**DM Sans** for display. **Inter** for body. Both are already the brand faces and both are self-hostable via `next/font/local`, which removes the font-loading flash and the third-party request.

## 2.1 Scale

Fluid, `clamp()`-based, on a ~1.25 ratio at desktop.

| Role | Face | Size (desktop) | Weight | Tracking |
|---|---|---|---|---|
| Display / hero | DM Sans | 56–72px | 700 | −0.02em |
| H2 section | DM Sans | 36–44px | 700 | −0.015em |
| H3 block | DM Sans | 24–28px | 600 | −0.01em |
| Stat numeral | DM Sans | 64–96px | 700 | −0.03em |
| Eyebrow / label | Inter | 12–13px | 600 | +0.08em, uppercase |
| Body | Inter | 17–18px | 400 | 0 |
| Body large (hero sub) | Inter | 20–22px | 400 | 0 |
| Caption / footnote | Inter | 13–14px | 400 | 0 |

**Measure:** 60–72 characters for body. Hero headlines break on meaning, not on width — set explicit breakpoints per line rather than letting the browser choose.

**Numerals:** tabular figures in any table, stat band or calculator. Proportional elsewhere.

## 2.2 Two typographic decisions that carry personality

1. **The eyebrow is a real signal, not decoration.** Use it only where it encodes something true — a status, a workflow stage, an audience. Planyear's lowercase eyebrows are a distinctive tic; TruHu's are uppercase Inter in `blue-500`, which is already in the brand. Do not put an eyebrow on every section out of habit.
2. **The stat numeral is the loudest thing on the page.** Big DM Sans in `green-500` with a small grey label beneath. Because green appears nowhere else at scale, the eye goes to the number. This is the brand's existing deck behaviour ported to web, and it means the site's most confident visual moment is always attached to a fact — which is a discipline as much as a style, because it forces every big number to be defensible.

---

# 3. The signature element

**The 3-rounded-1-sharp card.** `border-radius: 16px 16px 0 16px` — sharp corner bottom-right. It is proprietary to TruHu, it is already established in the deck system, and it is the one shape that makes a TruHu page recognisable at a glance across the flat-and-rounded sameness of this category.

**Rules.**
- It is the *only* card shape on the site. Every card, tile, quote block, image mask and status panel uses it.
- The sharp corner always points bottom-right. It never mirrors, never rotates.
- Buttons, inputs and pills use a plain small radius (8px, or fully rounded for pills). The signature belongs to cards; applying it to everything destroys it.
- Images inside cards are masked to the same shape.

**The leaf motif** stays subtle: `leaf-400` at low opacity, large scale, bleeding off an edge, one per page section at most, never behind body text, never at full opacity. It is atmosphere, not an illustration.

---

# 4. Layout

- **Grid:** 12 columns, 1200px content max, 1440px for full-bleed media, 24px gutters, 20px page margin at mobile.
- **Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128. Section padding 96–128px desktop, 56–72px mobile.
- **Section rhythm:** alternate white / `surface-50`, with navy at hero, one mid-page band, and the close. Never two dark sections adjacent.
- **Cards:** 1px `border-200`, no shadow at rest, a very soft shadow on hover only. This category over-uses elevation; hairlines read as more considered.
- **Breakpoints:** 640 / 768 / 1024 / 1280.

---

# 5. Motion

Restraint. Extra animation is the fastest way to make a site read as generated.

**Do:**
- Product video loops, silent, autoplay, no controls (the category standard).
- One page-load sequence on the hero only: headline, subhead, CTA, media, staggered ~60ms.
- Scroll-triggered fade-and-rise on section entry, 300–400ms, 12px travel, once per element.
- Stat counters that count up **once**, on entry — with the final value in the DOM (see §9, and file 02 §10 anti-pattern 3).
- Hover: 150ms, subtle.
- Tab transitions in the workflow hero: crossfade, no slide.

**Don't:** parallax, cursor followers, scroll-jacking, animated gradient meshes, typewriter effects, marquees other than the logo wall, anything that moves without being scrolled to.

**`prefers-reduced-motion: reduce` must disable every autoplay video (poster frame instead), every counter (final value shown), and every entrance animation.** Not optional.

---

# 6. Art direction — photography and illustration

The current site's biggest visual liability. The rule, restated from file 02 §3:

**Photography appears only when it is:**
- **(a) real** — an actual customer, an actual TruHu person, an actual workplace with permission; or
- **(b) conceptual and argumentative** — an image doing a job no screenshot can, like the shark-sign image on the Workforce page, which is a joke that carries the thesis; or
- **(c) the employee's world, shot honestly** — a plant floor, a truck cab, a job site, a hospital corridor. Real texture, real light, no laughing-in-a-glass-conference-room stock.

**Where photography currently sits and should not:** the six Unsplash cards on `/workforce`, the Unsplash portrait on the Jenel H. testimonial, and the generic hero images on Home and Advisor. Replace with product UI, custom illustration, or type-led cards.

**Illustration system.** Pasito uses custom SVG pillars; Nayya uses illustrated cards. TruHu's equivalent should be **diagrammatic rather than decorative** — the book of business with a handful of accounts lit, the broker calendar, the document-to-guide transformation, the delivery ledger. Drawn in brand colours, flat, hairline-weighted, no shading. These are diagrams that happen to be beautiful, which suits a company arguing about clarity.

**Icons.** One family, outline, 1.5–2px stroke, 24px base. Phosphor (as Brite uses) or Lucide are both fine; Lucide is the natural fit alongside React. Never mix families.

**Device frames.** The employee experience is shown in a real phone frame. This is not skeuomorphism — it is the argument. The whole differentiator is that the artefact reaches a phone.

---

# 7. Component inventory

Build these and the site assembles from them.

**Layout:** `SiteHeader` (mega-menu with status pills), `SiteFooter`, `Section` (bg variant, padding scale), `Container`, `Grid`.

**Content:** `Eyebrow`, `SectionHeading`, `Prose`, `Card` (the signature shape), `IconBullet`, `FeatureBlock` (heading + explainer + 4 bullets + media), `StatBand`, `Stat` (value, label, footnote — footnote required), `Callout`, `Divider`.

**Proof:** `LogoWall` (segmented, marquee optional), `Testimonial` (quote, name, title, org, optional real photo), `CaseStudyCard`, `TrustStrip`, `BadgeRow`, `SourceNote` (the small attributed footnote used under any statistic).

**Product:** `WorkflowTabs` (labelled stages, video swap), `VideoLoop` (autoplay/muted/loop/playsInline, poster, reduced-motion fallback), `DeviceFrame`, `StatusPill` (`live` / `early-access` / `roadmap`), `WorkflowTable`, `RoadmapStrip`, `IntegrationGrid`, `BookCalculator`.

**Conversion:** `CTAButton` (primary/secondary), `DemoForm`, `EarlyAccessForm`, `FAQ` (accordion, schema-marked), `ResourceCard`, `NewsletterSignup`.

---

# 8. Next.js implementation notes

**App Router, React Server Components, TypeScript.** Marketing pages are almost entirely static; keep the client bundle tiny.

**Rendering.** Static generation for every marketing page. ISR for `/resources` and `/customers` if a CMS drives them. `"use client"` only on `WorkflowTabs`, `FAQ`, `BookCalculator`, forms, and the mobile nav — nothing else.

**Styling.** Tailwind with the tokens in §1 defined as CSS custom properties in `globals.css` and mapped into `tailwind.config`. Define tokens **once**, as variables; never hardcode a hex in a component.

**Fonts.** `next/font/local` with self-hosted DM Sans and Inter subsets. `display: swap`, preload the two weights used above the fold. The deck skill notes that DirectWrite mis-renders DM Sans when the STAT table is present — irrelevant on web, but use the same instanced static weights so print and web match.

**Images.** `next/image` everywhere, AVIF then WebP, explicit `sizes`, `priority` on the hero only. ThreeFlow serves AVIF; match or beat it.

**Video — the important one.** Self-host MP4 (H.264) plus WebM, `muted playsInline loop autoPlay preload="metadata"`, always with a `poster`. Do not embed Vimeo or YouTube for product loops: an embed costs a third-party connection, a cookie-consent interaction and player chrome. Brite's six Vimeo iframes are the one clear performance weakness in an otherwise strong site. Serve from the same CDN as the rest of the assets. Keep each loop under ~1.5MB; lazy-load anything below the fold.

**Content.** MDX or a headless CMS for `/resources` and `/customers`. Workflow status pills should be driven from **one config file**, not hardcoded per page — the roadmap will change and it must change in one place.

**Forms.** Server actions; a real backend or CRM endpoint; honeypot plus rate limiting rather than a CAPTCHA. Never block a demo request on a third-party challenge.

**Analytics and consent.** The current site loads GTM. Keep tags minimal, load post-consent, and use a consent banner that defaults to the privacy-preserving option — the trust story on `/security` is undermined by a site that fires marketing tags before consent.

**Performance budget.** LCP < 2.0s on 4G, CLS < 0.05, INP < 200ms, JS < 120KB gzipped on the homepage. This is achievable because nothing here needs a heavy client runtime, and it is a genuine competitive edge: every leading competitor is on Webflow or WordPress.

**Accessibility target: WCAG 2.1 AA, tested not assumed.** Visible keyboard focus on every interactive element, semantic landmarks, real headings, alt text on every logo (ThreeFlow does this and it is noticeable), captions or transcripts where video carries meaning, reduced-motion honoured. Nayya lists WCAG AA 2.1 inside its compliance claims — if TruHu is going to make an accessibility claim on `/security`, the site itself has to pass.

**SEO.** Per-page metadata, OG images generated with `next/og`, `Organization` / `Product` / `FAQPage` / `BreadcrumbList` schema, a real sitemap. The compliance pages (`/workforce/compliance`, the workflow pages) are the search opportunity — that is the ground Yourco has taken with content.

---

# 9. The quality floor

Ship-blockers, in the sense that none of these should reach production.

- No stat renders as `0` before animation. Server-render the final value; animate from it only when JS and motion are both available.
- No stock portrait attached to a named person.
- No statistic without a `SourceNote`.
- No green text below 18px on white.
- No autoplay video under `prefers-reduced-motion`.
- No status pill that contradicts reality.
- No logo on the wall or the integrations page that a prospect cannot verify by clicking through.
- No page where the primary CTA is below the fold on mobile.
- Every page passes keyboard-only navigation end to end.
