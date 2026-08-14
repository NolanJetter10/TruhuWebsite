# truhu.ai — Website Blueprint

**Created:** August 10, 2026
**What this is:** a build-ready description of what the new truhu.ai should contain — its argument, its structure, every page, every section, what each section must prove, and what asset it needs. It does not contain code. Final copy is to be written against this spec, not lifted from it.

**Inputs:** `01-competitor-website-teardowns.md`, `02-pattern-library-and-category-conventions.md`, the current truhu.ai (retrieved Aug 10, 2026), `00-product-truth-advisor-and-workforce.md`, `research/12-positioning-thesis-and-moat.md`, `ensemble-platform/advisor/15-alternative-workflows-analysis-aug10.md`, `broker-research/10-nine-workflows-deliverable-anatomy-aug10.md`.

---

# 1. The strategic frame

## 1.1 Who the site is for

**Primary: the broker.** Both products are sold to the broker. Within that, three readers with different questions:

| Reader | Their question | What convinces them |
|---|---|---|
| **Principal / practice leader** | Does this win and keep business? | Growth appeal, peer logos, book-level economics |
| **Account manager / account executive** | Does this take work off my desk in busy season? | Time appeal, the deliverable itself, speed |
| **Ops / IT / compliance** | Will this get through review? | Security page, governance, integrations, implementation |

**Secondary: the employer / HR leader.** Reads the Workforce story, sometimes arrives from a broker's referral, sometimes searching for handbook acknowledgement or texting compliance. Must be served without confusing the broker.

**Tertiary: the recruit and the investor.** Both read the same pages the buyer does, plus About and Resources. Do not build for them; do not embarrass the company in front of them.

## 1.2 The argument the site has to carry

The positioning work has already produced the claim that survives scrutiny, and its exact wording matters because it deliberately concedes two things:

> Document-to-content generation is table stakes. Read-tracking is table stakes. What nobody has shipped is those two wired to an employee who has nothing but a phone number, across a broker's whole book.

**But the site cannot state the combined claim as a single product**, because Advisor and Workforce are two products sold separately (product-truth memo, Aug 7 2026). The website's job is therefore *not* to tell the loop story. It is to make two separate arguments strong enough that a broker buys either one, while making the shared foundation visible enough that the company reads as a platform rather than two tools.

**The resolution — and this is the central architectural decision in this document:**

- **The homepage argues the company**: one buyer, two reasons to buy, one engine underneath.
- **The Advisor pages argue the brokerage's own economics**: the deliverables you already produce, made faster and cheaper, across your whole book.
- **The Workforce pages argue the client relationship**: your clients keep you because their employees actually get the message.
- **Neither product page claims the other's capability.** No arrow between them on any diagram. A shared "one platform" section may state that they share a foundation and are sold separately — nothing more.

## 1.3 What changes versus the current site

The current truhu.ai is competent and on-brand. It is not broken. Six things are missing or wrong, in priority order:

1. **No workflow story.** The whole strategic direction — Advisor as the production system for the brokerage's client-facing deliverables, expanding workflow by workflow — is invisible. The site sells open-enrollment guides. The company is building a deliverable factory.
2. **No trust surface.** No security page, no governance section, no implementation answer, no integration story. Three of the four trust layers the category has converged on are absent.
3. **The proof is thin where it should be thickest.** Percentage stats with no defined population, no dated case-study numbers on the product pages, and no visible artefact.
4. **Stock imagery is doing work it cannot do**, including attached to a named testimonial.
5. **The best conversion asset is buried.** The Fit Test is a differentiated mechanism sitting below the fold on one product page.
6. **The growth appeal is stated once and abandoned.** The Advisor hero opens on it ("brokers growing their book faster") and then the page argues time and cost for the rest of its length.

---

# 2. Sitemap

```
/                          Home — the company argument
/advisor                   Advisor overview — the brokerage's economics
  /advisor/workflows       THE WORKFLOW MAP (new) — the roadmap, with status
  /advisor/guides          Workflow page: OE guides & microsites (Live)
  /advisor/communications  Workflow page: enrollment campaigns (Live)
  /advisor/renewals        Workflow page: renewal proposal decks (Roadmap)
  /advisor/stewardship     Workflow page: stewardship reporting (Roadmap)
  /advisor/compliance      Workflow page: compliance notices (Roadmap)
/workforce                 Workforce overview — the client relationship
  /workforce/compliance    Acknowledgement, proof of delivery, audit trail
  /workforce/frontline     Deskless / no-email reach
/platform                  The shared foundation: AI, data, controls
/security                  Security, privacy, compliance, subprocessors  (NEW)
/implementation            How rollout works, timeline, what we need  (NEW)
/integrations              Ben-admin, HRIS, payroll, AMS               (NEW)
/customers                 Case studies index
  /customers/[slug]        Individual case studies
/resources                 Blog, guides, webinars, research
  /resources/[slug]
/fit-test                  Bring the assessment on-domain (NEW placement)
/pricing                   Decide — see §9                             (OPTIONAL)
/about                     Company, origin, team, careers
/contact                   Demo request
/login                     External
```

**Navigation bar**

```
Products ▾        Advisor  ·  Workforce  ·  Platform
Workflows ▾       [the workflow map + 5 workflow pages, with status pills]
Company ▾         Customers · Security · Implementation · Integrations · About
Resources
                                            [Login]  [Book a demo]
```

**Rationale.** Workflows is elevated to a top-level item because it is the strategy. Security and Implementation are visible because Planyear and ThreeFlow have shown that surfacing de-risking pages in the nav is itself a signal to a conservative buyer. Products stays first because a first-time visitor still needs to know what is sold.

---

# 3. Home — the company argument

**Job:** in fifteen seconds, tell a broker what TruHu is, that other brokers like them use it, and that there are two distinct reasons to buy. Route them.

### H1 — Hero
- **Eyebrow:** none. Nothing above the headline.
- **Headline:** one line, company-level, growth-and-work framed rather than category-descriptive. The current line ("The AI Benefits Communication Platform Brokers Trust Most") describes a category and claims a superlative that cannot be evidenced. Replace with a line about what the broker gets. Direction, not final copy: *the work your clients see, produced by your team, at the speed of your whole book*.
- **Subhead:** two clauses maximum. Names both products without explaining them.
- **CTAs:** primary `Book a demo`; secondary `See a guide we built` → §H8 or a live sample.
- **Media:** replace the crowd photograph. Use a **looping, silent product clip** of a guide being generated and opened on a phone. If only one video asset gets made for this site, it is this one.
- **Asset needed:** hero loop (8–12s, self-hosted MP4, poster frame, `prefers-reduced-motion` fallback still).

### H2 — Logo wall
Keep the existing roster. **Two changes:** (a) qualify the heading precisely rather than with "Trusted by Leading Organizations"; (b) audit every logo for defensibility at the level the wall implies — see `05-claims-and-proof-register.md` §2. Single wall here (all brokers, one cohort) — segmentation belongs on the product pages.

### H3 — The two reasons to buy
The most important block on the homepage, because it does the product-truth work.

Two cards, side by side, visually equal weight, no arrow or connector between them.

| | **TruHu Advisor** | **TruHu Workforce** |
|---|---|---|
| Kicker | Your production line | Your retention line |
| Line | The client-facing work your brokerage already produces, built by AI across your whole book | The communication platform your clients keep you for, reaching every employee including the ones with no email |
| Proof chip | One dated customer number | One dated customer number |
| CTA | Explore Advisor | Explore Workforce |

Below the pair, one quiet line: *Two products. One broker platform. Bought separately.* — this is the honest statement of the architecture and it prevents the loop claim being read in.

### H4 — Outcome stats
Three numbers, replacing the current three. Requirements for each, non-negotiable: a defined population, a date or period, and a footnote naming the source. If a number cannot meet all three, it does not ship. See file 05 §3.

Prefer *customer outcomes* over *company scale* (Nayya's pattern). Prefer absolute counts with units over percentages with no denominator.

### H5 — The workflow strip
New. Six labelled tiles in calendar order, each with a status pill: **Live** / **Early access** / **2027**. This is the Zywave badge pattern applied to the Advisor roadmap, and it is what makes the homepage read as a platform.

Tiles: *OE guides & microsites* · *Enrollment campaigns* · *Employee Q&A* · *Compliance notices* · *Renewal proposal decks* · *Stewardship reports*.

One line under the strip framing the thesis: every client-facing document a brokerage produces, one workflow at a time. Links to `/advisor/workflows`.

**Guardrail:** status pills must match reality and must be maintained. A public roadmap that goes stale costs more than it earned.

### H6 — Named testimonial
One quote, not a carousel. Real name, title, brokerage or employer, real photograph or no photograph. **Never a stock portrait.** If the customer will not be photographed, use their firm's mark and their initials — the absence of a face is more credible than a purchased one.

### H7 — Trust strip
Compact horizontal band: SOC 2 Type II badge, HIPAA posture, accessibility posture, and three text links — Security · Implementation · Integrations. Small, quiet, always present. This is the block that gets the deal through the broker's ops review.

### H8 — See the work
New, and the most differentiated block available to this company. A real deliverable at full size: a guide as an employee receives it, in a phone frame, with a language toggle and a "view the full guide" link to a live sample. Not a dashboard. Not a mockup.

### H9 — Resources
Keep the current three-card pattern; it works. Prefer one original-research item over three blog posts (see §8).

### H10 — Closing CTA
Replace the current generic close with a line that carries the argument (ThreeFlow's pattern). One line, one button.

---

# 4. `/advisor` — the brokerage's economics

**Job:** convince a principal that this grows the book and convince an account manager that it clears their desk. Sequence matters: growth first, then work, then proof, then risk removal.

### A1 — Hero
Growth-appeal headline. The current page's opening idea is right and should be kept: the brokers growing faster are not working more hours. Sub-brand lockup, product-tour secondary CTA (`Take the tour`) beside `Book a demo`.
**Media:** the tabbed workflow hero (ThreeFlow's pattern) — labelled stages across the top, each swapping a looping product clip below. Stages: *Ingest plan documents · Generate the guide · Brand it for the client · Distribute · Track and follow up*.

### A2 — The problem, stated in the broker's own words
Keep the current framing almost verbatim; it is the best copy on the site today — the top ten or twenty accounts get everything and the rest get a PDF, and that inconsistency costs enrollment, satisfaction and retention at renewal. Replace the illustrative stock photo with a plain typographic treatment or a simple diagram of a book of business where a handful of accounts are lit and the rest are grey. **That image is the argument.**

### A3 — The white-label promise
Keep "We power the experience, you get the credit." It is a strong line and it is the same argument Brite's best testimonial makes on their behalf. Support it with the employer-branded microsite example, real logos and colours (with permission).

### A4 — Capability blocks
Four blocks, Brite's rhythm: outcome headline → one-line explainer → four icon bullets → product clip → link to the relevant workflow page.

1. **Guides and microsites** — branded, generated from the client's own documents, live in minutes, 100+ languages.
2. **Distribution** — text and email campaigns timed to enrollment, no login, non-opener follow-up.
3. **Visibility** — per-group engagement, book-level rollup, exportable.
4. **Control** — approvals, source-document grounding, brand locks, versioning. **This block does not exist today and it is the one an informed buyer looks for.** It is Pasito's admin-controls play and it is how the AI-trust objection gets answered before it is asked.

### A5 — Book economics
The section that turns per-client value into book value. A simple, honest model: number of groups × current cost or hours per guide, versus TruHu. Make the inputs editable. **No preloaded hero number** — let the broker type their own book size. An interactive calculator that uses the visitor's own inputs is more persuasive than any claimed percentage and carries none of the evidential risk.

### A6 — The workflow roadmap
Same six tiles as H5, expanded, with the status pills and short descriptions. Each links to its workflow page. Include an **Early access** capture for the next workflow to ship. This section is the platform argument.

### A7 — Integrations
Ben-admin, HRIS/payroll, AMS. Logos plus a one-line anti-rip-and-replace statement (ThreeFlow's pattern): TruHu produces the client-facing work; it does not replace the systems the brokerage runs on.
**Constraint:** the corpus flags an unresolved discrepancy about whether TruHu appears in Employee Navigator's integration listing. Every logo on this page must be verifiable by a prospect who clicks through to that partner's own directory. See file 05 §2.

### A8 — Security and implementation strip
Two cards: what the security posture is (link to `/security`), and what rollout looks like with a stated timeline (link to `/implementation`). Naming a number here removes the largest silent objection in the sale.

### A9 — Proof
One case study with a named brokerage and a dated number, plus one named quote. If a named brokerage cannot be published, an anonymised profile with real texture ("a 40-person regional brokerage in the Midwest, 310 groups") beats an unnamed superlative.

### A10 — FAQ
Objection-handling, Zywave's model, ten to twelve questions in the buyer's voice. Must include: *Does this replace my ben-admin?* (no) · *Where does the AI get its facts?* · *Who reviews the output before a client sees it?* · *What happens if the plan documents are wrong?* · *How long does implementation take?* · *What do you do with our clients' data?* · *Can we use our own templates and brand?* · *What does it cost per group?* · *What if my client already has a benefits guide vendor?* · *What is on the roadmap and when?*

### A11 — Close
Growth-framed close plus the demo CTA. Add the broker-side Fit Test as the low-friction alternative.

---

# 5. `/advisor/workflows` — the workflow map

**New page. The single most strategically important addition to the site**, because it is the only place the company's actual direction becomes legible to an outsider.

### W1 — Hero
The thesis in one line: a brokerage produces the same set of client-facing documents every year on the same calendar, and every one of them is still hand-built. TruHu is building them one at a time.

### W2 — The calendar
A visual of the broker year — marketing, quoting, renewal decision, ben-admin build, OE, compliance deadlines, stewardship — with TruHu's coverage overlaid. Ground it in the nine-workflow anatomy already documented in `broker-research/10`. This is a genuine intellectual asset; no competitor has published anything equivalent.

### W3 — The workflow table
One row per workflow: what the deliverable is, how it is built today, what TruHu does, status pill, link.

| Workflow | Status | Page |
|---|---|---|
| OE guides & microsites | Live | `/advisor/guides` |
| Enrollment communications | Live | `/advisor/communications` |
| Employee Q&A | Early access / Roadmap | — |
| Compliance notices & documents | Roadmap | `/advisor/compliance` |
| Renewal proposal decks | 2027 | `/advisor/renewals` |
| Stewardship reporting | 2027 | `/advisor/stewardship` |

**Also state what TruHu does not do** — quoting and spreadsheeting, ben-admin builds and EDI feeds, billing and commission reconciliation. Naming the boundary is a credibility asset, exactly as it is in the ecosystem map. A vendor who says "everything" is not believed; a vendor who says "these six, not those three" is.

### W4 — Early access
Capture for the next workflow. Named, dated, honest.

### W5 — Per-workflow page template
Each workflow page uses one template:
1. What the deliverable is, with a real example at full size
2. How it is built today — the manual process, described accurately from the broker corpus
3. What TruHu does, with product video
4. What stays under human control (review, approval, sign-off)
5. Status, and if roadmap, what "roadmap" means and how to influence it
6. FAQ specific to that deliverable
7. CTA

For roadmap workflows, be explicit that the page describes planned capability. **A roadmap page that reads like a shipped page is the fastest way to lose a diligence process.**

---

# 6. `/workforce` — the client relationship

**Job:** for the broker, this is why clients stay. For the HR buyer arriving directly, this is proof they can show their lawyer.

Keep the current page's structure — it is stronger than the Advisor page — and make four changes.

### Keep
- **The hero line.** Reaching the employees other tools miss, no login, no passwords. It is precise and it is the actual differentiator.
- **The exposure framing.** *Unread isn't uninformed. It's exposure.* The single best line on the current site.
- **The shark-sign image.** A conceptual image that carries the joke and the argument. Legitimate use of photography.
- **The six-category card grid.** Good structure.
- **The live-tracking panel.** The strongest product visual on the current site.
- **The Fit Test** — but move it up and bring it on-domain.

### Change
1. **Replace the six Unsplash card images.** Product UI, custom illustration, or type-only cards. See file 02 §3.
2. **Replace the stock portrait on the Jenel H. testimonial.** The quote is excellent — the handbook acknowledgement story is the best proof asset the company has. A purchased face undermines it.
3. **Split out `/workforce/compliance`.** Acknowledgement, proof of delivery, audit trail and record retention deserve their own page, because that is what an HR manager searches for at 11pm when they are worried. Yourco has taken this ground with content; it is winnable back. **Every legal statement on that page carries a citation.** See file 05 §4.
4. **Add the broker frame.** The current page speaks only to HR. Add a band near the top: *For brokers — deploy across your book from one console* → links to how the broker operates Workforce across clients.

### Add
- A **failure list** section. Our own broker research establishes that the most valuable output of an engagement report is the list of people who could not be reached at all. Nobody in the category markets this. It is a better proof than an open rate — and it is honest, because delivered is not read on SMS.
- **Reach-honesty note.** Do not build claims on email open rates. State what is measured: delivered, failed, clicked, replied, acknowledged. Precision here is a differentiator against competitors making looser claims.

---

# 7. The three new trust pages

## 7.1 `/security`
Data handled and why · where it lives · retention and deletion · SOC 2 Type II with report request · HIPAA posture (stated precisely — what applies and what does not) · encryption · access control and least privilege · subprocessor list · vulnerability disclosure · AI-specific section: what is sent to which model, whether customer data trains models, human review points, and how output is grounded in source documents.

**The AI section is the differentiator.** Nayya and Pasito gesture at it; nobody in the Advisor lane has written it plainly. A broker's compliance officer is going to ask what happens to a client's plan documents. Answering in public wins that conversation.

## 7.2 `/implementation`
What the first 30 days look like, week by week · what TruHu needs from the brokerage · what the brokerage's team has to do · who does the first build · time to first live client · time to book-wide · support model and hours · training. **Name the numbers.** Zywave does; the absence of a number is read as a bad number.

## 7.3 `/integrations`
Ben-admin, HRIS/payroll, AMS, SSO. Per integration: what it does, what direction data flows, whether it is live or planned. Verifiability is the whole point of this page.

---

# 8. `/resources` — and the one asset worth making

Keep the current structure. Add one thing and it changes the site's standing:

**Publish the broker workflow research.** The corpus already contains a documented anatomy of the nine deliverables a brokerage produces — running orders, exhibit inventories, the compliance calendar, the real structure of a stewardship report. Nobody in this category has published anything like it. It is source-attributed, it is genuinely useful to the reader whether or not they buy, and it is the only content on offer that a competitor cannot produce by rewriting a blog post.

**Rules for publishing it:** every figure carries its source and date; every vendor-sourced number is labelled as vendor-sourced; the acknowledged evidence gaps stay acknowledged. The credibility comes from the labelling as much as from the content.

Gate it. It is the best lead magnet the company will ever have.

---

# 9. Open decisions

Three things this document deliberately does not settle.

1. **Publish pricing?** Brite publishes; Yourco publishes with a free tier; ThreeFlow, Pasito and Planyear do not. TruHu sells per-client through a broker across a book, and our own corpus flags the per-client price point as unresolved by primary research. **Recommendation: no public price page yet, but a public pricing *model* explanation** — how it is structured, what drives it — which removes the "they're hiding it" reaction without pinning a number before the pricing question is settled.
2. **Name the category?** Deferred. See file 02 §7.
3. **One site or two?** Nayya runs a second domain for its technical audience. For TruHu, the employer-direct Workforce audience is arguably a different site. **Recommendation: one site, one nav, with a clear `For brokers` / `For employers` toggle on the Workforce pages only.** Splitting the domain before the employer-direct motion is a real motion would be premature.

---

# 10. Asset inventory

What has to exist before this site can ship. Ordered by leverage per unit of effort.

| # | Asset | Used on | Effort | Blocker |
|---|---|---|---|---|
| 1 | Hero product loop (guide generated → opened on phone) | Home, Advisor | Low | None |
| 2 | Five workflow-stage loops for the Advisor tabbed hero | `/advisor` | Medium | None |
| 3 | **One public sample guide**, real or realistically anonymised, live and linkable | Home H8, workflow pages | Low | Customer permission |
| 4 | **Timed, unedited screen recording** of documents in → guide out | Advisor, guides page | Very low | None. Highest ratio on the list |
| 5 | Real customer photography (2–3 shoots) | Testimonials, case studies | Medium | Permission and scheduling |
| 6 | Three case studies with dated numbers, at least one broker-side | Customers, product pages | Medium | Customer sign-off |
| 7 | Security page content | `/security` | Medium | Needs legal and security review |
| 8 | Implementation timeline | `/implementation` | Low | Needs CS to commit to numbers |
| 9 | Verified integration list | `/integrations` | Low | Must resolve the Employee Navigator listing question |
| 10 | Broker workflow research, edited for publication | `/resources` | Medium | Editing pass only; research exists |
| 11 | Book-economics calculator | `/advisor` | Medium | Needs an agreed model |
| 12 | Broker-side Fit Test | `/fit-test` | Medium | Needs question design |
| 13 | Icon set and illustration system | Everywhere | Medium | See file 04 |
| 14 | Replacement imagery for the six Workforce cards | `/workforce` | Low | See file 04 |

**If only four things get made: 1, 3, 4 and 7.** Those four turn the site from a well-designed brochure into a credible platform.

---

# 11. Phasing

**Phase 1 — credibility (ship first).** Security, Implementation, Integrations. Fix the stat counters and the stock-portrait testimonial. Add the trust strip to Home and Advisor. *These are the cheapest changes with the largest effect on deal progression, and none of them needs a design system.*

**Phase 2 — the argument.** Rebuild Home around the two-reasons block and the workflow strip. Rebuild Advisor with the tabbed hero, the control block, book economics and the FAQ. Ship `/advisor/workflows` and the two live workflow pages.

**Phase 3 — proof.** Sample guide, timed recording, case studies, real photography, published research, Fit Test on-domain.

**Phase 4 — roadmap pages.** The three 2027 workflow pages, clearly labelled as planned capability, plus Early Access capture.
