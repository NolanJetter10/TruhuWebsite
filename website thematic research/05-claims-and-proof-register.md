# Claims and Proof Register

**Created:** August 10, 2026
**Purpose:** decide, in advance, what the new truhu.ai may say. A website is harder to correct than a slide and permanently available to every competitor, prospect and diligence process. The governing rule from the positioning thesis applies with more force here than anywhere else:

> One checkable error costs more than any positioning gain.

**Grades used throughout:**
**SAFE** — can be stated plainly.
**LABEL** — can be stated with a defined population, a date and a source note.
**FIX** — currently stated in a form that will not survive scrutiny; specific remedy given.
**CUT** — do not put on the site.

---

# 1. Claims currently on truhu.ai

| Claim (current site) | Grade | Note / remedy |
|---|---|---|
| "The AI Benefits Communication Platform Brokers Trust Most" | **FIX** | A superlative with no measurable basis. No award, ranking or survey supports "most." Replace with a claim about what the broker gets. |
| "Trusted by Leading Organizations" + broker logo wall | **LABEL** | Keep the wall; qualify the heading precisely (see §2). |
| "0% Higher Engagement · open enrollment" | **FIX** | Two problems. (a) It renders as a literal zero pre-animation. (b) "Higher engagement" has no defined baseline, population or period. Restate as: *X% higher [named metric] across [N] employer groups, [period]* with a source note, or cut. |
| "0% Lower Communications Costs using one tool" | **FIX** | Same. "Lower than what" is undefined. Either name the comparison basis (consolidating N tools) or cut. |
| "0% Higher View Rates vs email alone" | **FIX** | Same, plus a deeper problem: our own broker research establishes that **email open rates are structurally corrupted** — Apple Mail pre-loads tracking pixels regardless of opens. A claim built on comparison to email open rates is not measurable. **Recommend cut.** Replace with a click-based or delivery-based comparison, which is defensible. |
| "75% Lower Communication Costs using one tool" (Advisor page) | **LABEL** | If this comes from real customer data, name the population and period. If it is a modelled figure, say so and show the model. |
| "15% Higher Engagement in open enrollment" (Advisor page) | **LABEL** | Same. Note it does not reconcile with the homepage figure for what appears to be the same idea — **two different numbers for the same claim on two pages is exactly the kind of error a diligence reader finds.** Pick one, or define them differently and clearly. |
| "100+ Languages auto-translated" | **SAFE** | Product capability, checkable in a demo. |
| "124 clients deployed / Avg. 85% enrollment rate" (dashboard mock) | **FIX** | If this is illustrative UI, it must be visibly labelled as sample data. An unlabeled number inside a product screenshot is read as a real number. |
| "Enterprise-grade data security built in" + SOC 2 Type II badge | **SAFE, expand** | SOC 2 Type II is a real, verifiable attestation and currently the strongest trust asset on the site. Build `/security` around it. |
| "Responsible AI built for the employee benefits industry" (footer) | **LABEL** | Fine as a positioning line, but it currently sits with nothing behind it. Once `/security` exists with an AI-handling section, it becomes earned. |
| Named customer quotes (Emily F., E. Caraballo, Jenel H.) | **SAFE** | Genuinely good, and the Jenel H. handbook-acknowledgement quote is the best proof asset the company has. See §5 on the photographs. |
| Lake Medical Imaging case study — 78% average click rates, many messages over 90% | **SAFE** | Named organisation, defined metric (click), stated population. This is the standard every other number on the site should meet. |
| Securatech case study | **SAFE** | Named, specific, textured. |

---

# 2. The logo wall

The broker roster on truhu.ai is stronger than any comparable wall in the competitive set — Marsh McLennan, Gallagher, HUB, Brown & Brown, Acrisure, Alera, OneDigital, IMA, EPIC, Holmes Murphy, McGriff, Leavitt, Hilb, INSURICA, Patriot, Mahoney, Seubert, PGP, GIS. Brite's and Pasito's walls are shorter and less recognisable.

**Two conditions before leaning on it harder.**

1. **Defensibility at the level implied.** A single office or one producer's book inside Marsh McLennan is not "Marsh McLennan uses TruHu." Every logo needs an owner internally who can name the relationship. The category convention is loose about this; a competitor calling it out in a deal is more damaging than the wall is helpful.
2. **A precise heading.** "Trusted by Leading Organizations" is vague enough to be read as an enterprise-wide endorsement. A more precise construction — teams at these firms use TruHu — is both more honest and more specific, and specificity reads as confidence.

**Same discipline for `/integrations`.** Every partner logo must be verifiable by a prospect who clicks through to that partner's own directory. The corpus flags an **unresolved discrepancy**: Employee Navigator's integration listing does not appear to include TruHu, which conflicts with a claim made in internal materials. **Resolve before the integrations page ships.** A partner logo the partner does not corroborate is the single most checkable error available on a website.

---

# 3. Requirements for any number on the site

Non-negotiable. Every statistic carries all four:

1. **A defined metric.** Not "engagement." Click rate, acknowledgement rate, guides produced, hours saved.
2. **A defined population.** How many employer groups, how many employees, which segment.
3. **A period.** "OE 2025" or "Jan–Jun 2026."
4. **A source note.** TruHu platform data / customer-reported / third-party, named.

Implemented as the `SourceNote` component (file 04 §7) so the discipline is structural rather than editorial.

**Prefer:** absolute counts with units, customer outcomes, third-party attributed research.
**Avoid:** percentages with no denominator, "up to" figures, industry averages with no citation.

**The competitor to imitate is ThreeFlow**, which attributes its pain statistics to named external research and dates them, and prefixes every ROI figure with the population it applies to. It is the only site in the set that meets this standard, and it reads as the most credible for exactly that reason.

---

# 4. The compliance and legal claims — highest risk area

The Workforce story runs on the risk appeal, and the risk appeal is the family most likely to produce a wrong statement. Three specific traps, all documented in the corpus:

1. **OSHA does not, as a general rule, require employee signature or acknowledgement.** It requires documented, retained training. Do not write or imply that acknowledgement is an OSHA requirement.
2. **Handbook acknowledgement is employment-law best practice, not a statutory mandate in most states.** Do not use any "X states require…" construction without a dedicated legal review naming the states and statutes.
3. **The widely-cited 30-day SPD-on-request rule could not be located in the regulation section usually cited.** Practitioners state it uniformly. That is not the same as it being citable. Do not put it on the site unless legal confirms the cite.

**Rule for the site:** every legal or regulatory statement carries a named citation to the regulation, agency guidance or case — or it does not ship. This is more restrictive than the category norm and it is worth it, because a compliance product that gets compliance wrong on its own marketing site has a problem no design can fix.

**What is safe and strong:** describing what the product records and when — delivered, failed, opened, clicked, replied, acknowledged, timestamped, per named employee, exportable. Precision about the artefact is more persuasive than an assertion about the law, and it cannot be wrong.

**The honest hierarchy for reach claims**, from the broker research, which the site should follow rather than fight: completed the action > clicked > delivered/failed > replied > opened. **Delivered is not read on SMS.** The failure list — the named people who could not be reached at all — is the highest-value output and nobody in the category markets it.

---

# 5. Photography and attribution

- **No stock portrait may be attached to a named person.** The current Workforce testimonial pairs an excellent quote from a named HR manager with a purchased Unsplash portrait. A reader who recognises the photo discounts the quote and, by extension, every quote on the site.
- **Acceptable alternatives, in order:** real photograph with permission → the firm's mark with the person's initials → no image at all. Absence is more credible than substitution.
- Same rule for case studies and the About page.

---

# 6. Claims that are now table stakes — do not lead with them

Leading with any of these tells an informed buyer that TruHu has not surveyed its own market.

| Claim | Who else markets it |
|---|---|
| AI reads plan documents and generates a branded guide | bswift (Simplify/Emma), Pasito, Brite, Planyear, Nayya Build, Selerix |
| Employee-facing AI assistant grounded in plan documents | bswift, Pasito, Brite, Planyear, Nayya, Healthee, TeamSense |
| No-login access via a shareable link | Brite (explicitly, "no login required — ever") |
| 100+ language translation | Brite, Pasito, Yourco, TeamSense, goHappy |
| Read tracking and acknowledgement with audit trail | Firstup, Blink, Connecteam, WorkJam, Crew, Yourco |
| Automated follow-up to non-openers | Firstup, SnapComms, Yourco, Brite |
| Book-level analytics for brokers | Brite ("book-level analytics across your entire block") |

**What this means for the site.** These belong in feature blocks and comparison tables, stated plainly, as evidence of completeness. They do not belong in the hero. The hero has to say something the list above does not already say.

---

# 7. What TruHu can claim that this research could not break

Stated carefully, because the strength is in the conjunction and each element is individually checkable:

**The join.** No competitor examined was confirmed to combine (a) content generated from *this employer's* plan documents, (b) delivery to an employee with no app, no login and no work email, (c) named-employee read tracking with automated follow-up, and (d) operation across a broker's whole book. Every company with a content engine assumes a digital employee identity; every company reaching the deviceless employee has no content engine.

**Two conditions on using it.**
1. It describes **two products used together**, not one. Any wording on the site must either say so explicitly or be rewritten. This is the product-truth constraint and it is not negotiable.
2. It is a *negative* claim about the market ("nobody was found who does all four"). Negative claims age. Date it, review it quarterly, and phrase it as a combination TruHu offers rather than as a fact about every competitor in the world.

**The safer expression for a website:** state the four capabilities as TruHu's, plainly and specifically, and let the reader draw the comparison. A site that says what it does beats a site that says what others do not.

---

# 8. Proof assets that gate specific sections

| Section | Cannot ship without |
|---|---|
| Home stat band | Three numbers meeting all four requirements in §3 |
| Home "See the work" | A publishable sample guide (customer permission) |
| `/advisor` book economics | An agreed, defensible model |
| `/advisor` speed claims | The timed, unedited screen recording |
| `/security` | Legal and security review; subprocessor list; AI data-handling answer |
| `/implementation` | CS committing to stated timelines |
| `/integrations` | Verified partner list; Employee Navigator question resolved |
| `/workforce/compliance` | Legal review of every regulatory statement |
| Roadmap status pills | An owner who maintains them and a single config source |
| Any testimonial | Real photo or no photo |

---

# 9. Review cadence

- **Quarterly:** every statistic re-dated or re-sourced; every status pill checked against reality; the negative competitive claim in §7 re-tested.
- **On any product release:** status pills and the workflow map.
- **On any customer churn:** the logo wall.
- **Owner:** whoever owns the competitive corpus owns this register. The site and the corpus must not drift apart, because a competitor reading both is the exact scenario the discipline exists for.
