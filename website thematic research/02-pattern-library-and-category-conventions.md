# Pattern Library and Category Conventions

**What every site in benefits/insurtech does, why, and which conventions are worth keeping.**
Compiled August 10, 2026 from the thirteen teardowns in `01-competitor-website-teardowns.md`.

A convention is not automatically correct. Some of these exist because they work; some exist because everyone copied the same Webflow template. Each is marked **KEEP**, **ADAPT** or **BREAK** for TruHu.

---

## 1. The canonical section inventory

Sites in this category are assembled from the same fourteen blocks in roughly the same order. Frequency is out of the sites where the homepage was read in full (Brite, Pasito, Planyear, ThreeFlow, Zywave Apex, Nayya, TruHu — 7).

| # | Block | Freq | Job it does | Verdict |
|---|---|---|---|---|
| 1 | Announcement bar | 2/7 | Push a report, launch or event | **ADAPT** — only when there is real news |
| 2 | Hero: thesis line + subhead + dual CTA | 7/7 | Say what this is in one line | **KEEP** |
| 3 | Hero media: looping product video | 5/7 | Prove the product exists | **KEEP** |
| 4 | Logo wall | 7/7 | Borrowed credibility | **ADAPT** — segment it |
| 5 | Scale stat band | 6/7 | "We are real and big" | **ADAPT** — outcomes over vanity |
| 6 | Audience split (for X / for Y) | 5/7 | Route two buyers | **KEEP** |
| 7 | Feature/benefit blocks, 3–4 of them | 7/7 | What it does | **KEEP** |
| 8 | Named-AI / named-agent section | 5/7 | Make the AI a thing you can point at | **ADAPT** |
| 9 | Testimonial(s), named + titled | 7/7 | Peer proof | **KEEP** |
| 10 | Integrations / "fits your stack" | 4/7 | Kill the rip-and-replace objection | **KEEP** |
| 11 | Security / compliance / governance | 6/7 | Get through IT and legal | **KEEP** — biggest current gap |
| 12 | Resources / news strip | 5/7 | Signal a living company | **KEEP** |
| 13 | Objection-handling FAQ | 3/7 | Answer the discovery call in public | **KEEP** |
| 14 | Closing CTA | 7/7 | Convert | **ADAPT** — make it argue |

**The read:** blocks 1–9 are universal and near-identical across the category. Differentiation lives in 10–13, which is precisely where the current truhu.ai is thinnest.

---

## 2. The four appeal families

Every piece of persuasive copy in this category belongs to one of four families. Knowing which one a section is running prevents the most common failure — a page that makes four different arguments and lands none.

### A. The economic appeal — *this costs you time and money*
The dominant family. Manual builds, hours per deliverable, account-manager capacity, outsourcing spend, "weeks of work into minutes."
Who runs it: everyone. Pasito's back-office pillar, ThreeFlow's hours-per-RFP, Brite's launch-in-days, our own current Advisor page.
**Strength:** immediately legible to an operator. **Weakness:** it is the most crowded argument in the category and it invites a price comparison.

### B. The growth appeal — *this wins and keeps business*
Retention, finalist meetings, deepening the client relationship, differentiating against the incumbent broker.
Who runs it: Pasito (win more business), Zywave (Producer Agent, Advisor Agent), Planyear (attract and retain a modern book), our current Advisor hero (brokers growing their book faster).
**Strength:** speaks to the principal and the producer, not just the account manager. Commission-linked, so it survives a budget conversation better than a cost argument. **This is the strongest family for TruHu Advisor and it is currently underweighted on our site.**

### C. The risk appeal — *this is exposure*
Compliance, E&O, audit trails, ERISA, proof of delivery.
Who runs it: Zywave hardest (one wrong sentence is an E&O event), Yourco through compliance content, our own Workforce page (unread isn't uninformed, it's exposure — the best single line on the current site).
**Strength:** creates urgency without a competitor. **Weakness, and it is severe:** it is one legal review away from being wrong. Our own corpus is explicit that OSHA generally does not require employee signature or acknowledgement and that handbook acknowledgement is best practice rather than statutory in most states. **Never state a legal requirement on the site without a named citation.** See file 05.

### D. The human appeal — *employees deserve to understand this*
Confidence, clarity, dignity, nobody left behind, the employee with no email.
Who runs it: Brite and Nayya lead with it; Planyear's line about nobody getting left behind; TeamSense's frontline framing.
**Strength:** it is the only family that makes an emotional claim, and it is the one TruHu has the most authentic standing in — the company is literally named Truly Human Technologies.
**Weakness:** it does not close a broker deal on its own.

**Recommended weighting for TruHu:** B leads the Advisor story, A supports it, D provides the brand register and the closing note, C is used precisely and only where citable. Workforce inverts: C leads, D supports, A supports.

---

## 3. Imagery conventions

**The hierarchy the category actually uses, best to worst:**

1. **Product UI in motion** — looping video of the real interface. Used by Brite, Pasito, ThreeFlow, Zywave.
2. **Product UI still, in a device or browser frame** — Pasito, Planyear, Zywave's governance tabs.
3. **Custom illustration or custom SVG** — Pasito's pillars, Nayya's three cards. Used where there is nothing photographable.
4. **Icon systems** — Phosphor (Brite), Font Awesome duotone (Planyear), bespoke sets (ThreeFlow). Always in service of a bullet, never alone.
5. **Stock photography of people** — the bottom of the hierarchy, and **notably absent from the homepages of Brite, Pasito and ThreeFlow entirely.**

**This is the sharpest finding in the file for TruHu.** The current truhu.ai Workforce page uses at least six Unsplash photographs as card imagery, plus an Unsplash portrait attached to a named HR manager's testimonial. A stock image next to a named person's quote is a credibility problem, not a design problem — a reader who recognises the photo discounts the quote.

**The art-direction rule to adopt:** photography appears on our site only when it is (a) a real customer, (b) a real employee in a real workplace we have permission to show, or (c) a deliberate conceptual image doing a job no screenshot can. The shark-sign image on the current Workforce page is a legitimate (c) — it is doing a joke that carries the argument. The six Unsplash office cards are not.

---

## 4. Video conventions

**What the category does:**
- **Silent, looping, controls-hidden product clips**, 6–15 seconds, embedded in feature blocks. Brite runs six of them via Vimeo; ThreeFlow runs six self-hosted MP4s, one per workflow stage; Pasito runs a self-hosted hero MP4 with a poster frame.
- **Self-hosted MP4 beats an embed** on performance and on control (no third-party branding, no cookie banner interaction, no player chrome).
- **Nobody uses a talking-head brand film above the fold.** Nayya has a brand video, and it sits below the hero.
- Every clip is captioned by its surrounding copy, not by narration.

**What nobody does, and we should:** show elapsed time. See §9.

---

## 5. Social proof — the ladder

From weakest to strongest, with who does what:

| Rung | Form | Who | Note |
|---|---|---|---|
| 1 | Unsegmented logo wall | Brite | Weakest — mixes buyer types |
| 2 | Segmented logo walls | ThreeFlow | Each cohort sees itself |
| 3 | Vendor scale stat | Brite, Pasito | Undated, undefined units, low value |
| 4 | Customer-outcome stat | Nayya, ThreeFlow | Better — names the population |
| 5 | Named quote + title + company + headshot | All | The category standard |
| 6 | Named quote that concedes something | Brite | Far more credible; see below |
| 7 | Case study with a named organisation and a real number | ThreeFlow, TruHu | Strongest |
| 8 | Third-party attributed research | ThreeFlow (LIMRA, BenefitsPro) | Strongest of all — not self-reported |

**On rung 6.** The most persuasive testimonial in the whole set is Brite's BlenderBottle quote, because it starts by conceding something unflattering about the customer's own situation (pulling employees off the floor for enrollment meetings makes no sense) before it praises the product. A quote that only praises reads as solicited. TruHu already has quotes with this quality — the Emily F. quote on the current homepage is genuinely good because it is *shaped like real speech*, including the disfluency. Keep that texture. Do not let a copywriter clean it up.

**On logo walls.** TruHu's current wall is, on paper, the strongest asset on any site in this file — Marsh McLennan, Gallagher, HUB, Brown & Brown, Acrisure, Alera, OneDigital, IMA, EPIC, Holmes Murphy, McGriff, Leavitt, Hilb, INSURICA. That is a better broker roster than Brite's or Pasito's. **Two conditions before leaning harder on it.** First, every logo must be defensible as a customer relationship at the level the wall implies (a single office of Marsh McLennan is not Marsh McLennan). Second, it needs a qualifying line — the category convention is a heading like "Trusted by," and a more precise one ("Used by teams at…") is both more honest and more specific.

---

## 6. Trust architecture

The category has converged on a four-part trust stack. TruHu currently has part 1 only.

1. **Badge row** — SOC 2, HIPAA, and increasingly WCAG. *(TruHu: has SOC 2 Type II in footer.)*
2. **A dedicated Security page in the primary nav or footer.** Pasito, Planyear (top-level nav), ThreeFlow, Nayya. *(TruHu: none.)*
3. **A governance section on the product page** — access control, audit trail, PII handling, admin controls over AI behaviour. Zywave does this best; Pasito's admin controls over tone and source documents is the lighter version. *(TruHu: none.)*
4. **Deployment and implementation answers on the page** — how long it takes, who does the work, what is required from the customer. Zywave states deployment times; Planyear gives Implementation its own top-level nav item. *(TruHu: none.)*

**Why this matters more for TruHu than for most of this set.** Advisor ingests an employer's plan documents and Workforce holds employee phone numbers. Both trigger a security review. Every deal that stalls in a broker's compliance team is a deal lost to a competitor whose website answered the question before it was asked.

---

## 7. Category creation and naming

Two distinct moves, often confused.

**Naming the category** (ThreeFlow's Benefits Placement System; Zywave's "systems of action"). Powerful, expensive, and only works when you can defend being the definer. ThreeFlow earns it because it sits between brokers and carriers, a genuinely un-owned position, and because it put an explainer block on its own homepage rather than assuming the term.

**Naming the AI** (bswift's Emma, Planyear's SAGE, Zywave's Producer/Advisor Agent, Businessolver's Sofia, Healthee's Zoe). Near-universal in this category now.

**Recommendation for TruHu:**
- **Do not name a chatbot persona.** The naming convention is saturated; a sixth female-coded assistant name adds nothing and invites direct comparison to better-funded ones.
- **Do name the workflows.** This is the un-taken position. Every competitor names *the assistant*; nobody names *the deliverables*. TruHu's roadmap is a list of the artefacts a brokerage already produces — OE guides, renewal proposal decks, stewardship reports, compliance notices. Naming and shipping those, one per page, with honest status badges, is a stronger platform story than a mascot.
- **Consider naming the category later, not now.** A category name asserted before there is a customer base to ratify it reads as marketing. Revisit once two or three workflows are live.

---

## 8. Roadmap presentation — the Zywave badge pattern

The most directly applicable idea in this file. Zywave publishes future capability with status labels: **Live** / **Early Access** / **Coming Soon**.

Applied to Advisor's workflow set, this converts an awkward fact (most of the roadmap is 2027) into an asset: it shows a company that knows exactly what it is building and in what order, which is itself a competence signal. It also creates a legitimate Early Access offer — the highest-intent lead-capture mechanism available to a company at this stage, and better than a generic demo form.

**The discipline that makes it work:** the labels must be true, and a shipped date that slips must be updated. A public roadmap that goes stale is worse than no roadmap.

---

## 9. The four demo mechanisms

| Mechanism | Who | Friction | Intent captured |
|---|---|---|---|
| Gated demo form | All | High | Medium |
| Self-serve product tour | ThreeFlow ("Take the tour") | Low | Medium-high |
| Free tier / published pricing | Yourco, Brite (pricing page) | Lowest | Low individually, high in volume |
| Assessment / scoring quiz | **TruHu** (Fit Test) | Low | High |

**TruHu already has the best one and hides it.** The Fit Test — four categories, two minutes, no login, personalised breakdown — is a genuinely differentiated lead mechanism, and it currently sits near the bottom of one product page and links off to a separate domain. It should be promoted, and it should have a broker-side sibling.

**The missing mechanism: a sample deliverable.** Nobody in this category lets you see the finished artefact without a sales call. A public, real (or realistically anonymised) TruHu benefit guide — the actual thing an employee receives, on a real phone, in two languages — would be the single most persuasive page on the site and costs nothing but permission.

---

## 10. The anti-patterns

Things this category does that we should deliberately not do.

1. **Unverifiable scale numbers.** Employees-reached figures with no unit, no date and no method. Our own research corpus rejects them from competitors; the site must not commit the same offence.
2. **Borrowed pain statistics.** Deskless-workforce percentages that trace to a VC's definition, engagement figures with no methodology, email open rates that Apple Mail has structurally corrupted. Every one of these is checkable and every one is a liability.
3. **Percentage claims with a leading zero placeholder.** The current homepage ships stat counters that render as "0% Higher Engagement" before animation. Any reader with JavaScript blocked, a screen reader, or a slow connection sees zeroes. It is a small bug with a disproportionate credibility cost.
4. **Stock photography attached to named testimonials.** Discussed in §3.
5. **Mission copy above the fold.** Save it for About.
6. **Trademark symbols on method names.** Adds a symbol, not a proof.
7. **Claiming the category floor as a differentiator.** "Our AI reads plan documents" is now marketed by at least six competitors including the ben-admin incumbent. Leading with it tells an informed buyer we have not surveyed the market.
8. **Mega-menus.** Zywave's nav embeds the same two case studies in five separate columns. Depth is not authority.

---

## 11. What nobody in the category is doing

The four unclaimed positions, ranked by how cheaply TruHu could take them.

1. **Show the finished deliverable at full size.** Every competitor shows the builder. Nobody shows the thing the broker hands the client. Cost: permission plus a design pass.
2. **Show elapsed time honestly.** Everyone claims minutes; nobody proves it. One unedited, timestamped screen recording of documents in, guide out. Cost: one afternoon.
3. **Show the employee's view on a real phone.** The whole category argues about employee understanding using pictures of dashboards. Cost: one device mock plus real content.
4. **Publish original research about the broker's own workflow.** Nayya publishes research about AI advice quality; nobody publishes about the account manager's week. TruHu's `broker-research` corpus is a nine-workflow anatomy of exactly this, already written and already sourced. Cost: an editing pass on work that already exists. **This is the highest-leverage marketing asset the company already owns and does not use.**
