# Competitor Website Teardowns

**All sites retrieved August 10, 2026** unless noted. Structure, section order, copy themes, asset types and stated numbers are read off the live page. Palette lines are inferred (see `00-INDEX.md`, Method) and should be replaced with sampled values before any visual benchmark deck.

Companies are grouped by the lane they compete in, and within lane by how closely their site should inform ours.

---

# LANE 1 — Advisor-direct (the sites our Advisor page is judged against)

## 1.1 Brite — britebenefits.com

**The closest functional match to Advisor, and therefore the most important site in this file.**

| | |
|---|---|
| Stack | Webflow (`cdn.prod.website-files.com` asset paths) |
| Positioning line | Guiding employees to better benefit decisions |
| Category self-description | The benefits guide builder |
| Primary CTA | BOOK A DEMO (uppercase, persistent in nav) |
| Secondary CTA | Login |

**Information architecture.** Nav is split three ways and it is worth copying the logic: **Solutions** (For Employers / For Brokers / Marketplace), **Features** (Guide Builder / Launch & Distribution / Decision Support / Insights & Optimization), **Build Your Own** (How it Works / Pricing / Features), then Why Brite and Contact. Two things stand out. First, they run a **parallel two-audience go-to-market in the nav itself** rather than picking one. Second, "Build Your Own" is a separate self-serve track with a **public pricing page** — a low-friction entry that sits alongside the enterprise demo motion.

**Hero.** Headline, one-line subhead, and two Vimeo videos playing simultaneously — autoplay, looped, muted, no controls, no Vimeo branding. Not a talking head. Product motion.

**Feature architecture — the pattern to steal.** Four benefit-led blocks, each with a two-line headline, a one-line explainer, exactly four icon bullets, a Learn More link, and its own looping product video. The four:

1. *Deliver Smarter Decisions* — custom-branded guides, jargon-free decision support, personalised AI assistant, plan comparisons with visual context.
2. *Reach Everyone, Anywhere* — email/text/Slack/Teams/QR access, no login required ever, mobile-first, 100+ languages.
3. *Engage How People Actually Consume* — PDF export, text reminders, launch in days not months, one platform year-round.
4. *Track What's Working (and What's Not)* — real-time clicks/completions/drop-offs, book-level analytics across the block, custom dashboards, ben-admin integration.

Note the headline construction: outcome first, mechanism second. And note the deliberate parenthetical in #4 — the only place the page allows itself a voice.

**Imagery.** No stock photography of people anywhere on the homepage. Icons are Phosphor Icons (asset names: `Palette`, `Copy`, `PlusCircle`, `ChalkboardSimple`, `Broadcast`, `Password`, `DeviceMobileCamera`, `GlobeSimple`, `FilePdf`, `ChatCircleText`, `HourglassSimpleLow`, `Calendar`, `ChartLineUp`, `PresentationChart`, `ArrowsOutLineHorizontal`). The entire visual load is carried by product video and icons.

**Social proof.** A single mixed logo wall containing *both* brokerages and employers — USI, Risk Strategies, EPIC, Alliant, Gallagher, IMA, Aon alongside Podium, BlenderBottle, Tyson Foods, Chatbooks, Awardco, Motive, Jazz. Below it, a scale line: more than three million employees learn about their benefits with Brite `[vendor-stated, undated, unattributed]`.

**Testimonials.** Four quotes in a wall, each with name, title and company. They are chosen for *range*, not uniformity: one about the team being easy to work with, one about efficiency, one about the broker getting the credit, one about meetings avoided. The BlenderBottle quote is the strategically sharpest — it says Brite does the heavy lifting and the customer gets the credit, which is the same white-label argument TruHu Advisor makes.

**Trust.** A combined SOC 2 / HIPAA badge image in the footer. No dedicated security page in the primary nav.

**Palette read** *(inferred)*. Black wordmark on white; **purple** as the single accent — Brite's own alt text on its audience cards names a purple arrow. Dark footer with a reversed white logo. High-contrast, low-chroma, one accent.

**Steal:** the four-block × four-bullet × one-video feature rhythm; the outcome-first headline construction; the credit-to-the-broker testimonial; the public pricing page as a second front door.
**Avoid:** the mixed employer/broker logo wall — it blurs who the product is for. Their nav solves the two-audience problem better than their logo wall does.

---

## 1.2 Pasito — pasito.ai

**The best-funded direct competitor and the cleanest expression of "AI-native" as a brand position.**

| | |
|---|---|
| Stack | Webflow |
| Positioning line | An AI-native workspace for benefits |
| Primary CTA | Request a demo |
| Secondary CTA | Browse features |

**Information architecture — the single most instructive thing on this site.** The nav is organised **by who you are, then by what you get**, two levels deep:

- *Benefits consultants* → Benefits guides · Benefits microsites · AI benefits assistant · Proposal comparison
- *Insurance carriers* → Decision support · Marketing documents · AI benefits assistant · RFP intake management
- *Employers* → Decision support · Benefits microsite & hub · AI benefits assistant · Year-round communications

The same capability appears under three audiences with three different framings. That is a deliberate, expensive IA choice and it is the correct answer for a company selling one engine into several buyer types. It is also directly applicable to TruHu, which sells two products to one buyer with two different reasons to buy.

**Hero.** Self-hosted MP4 (not an embed) plus a poster image. Two CTAs, primary and secondary.

**Stat band.** Three numbers immediately under the logo marquee: premium managed, employees supported, employers using the platform. All `[vendor-stated]`; the premium figure is the largest scale number in the entire competitive set and carries no defined unit.

**Three-pillar section.** Custom SVG illustrations, not icons — `automate-back-office-operations`, `client-benefit-xp`, `winmore`. The three pillars are economic, not functional: *automate back-office operations* / *elevate client benefit experiences* / *win more business while reducing manual work*. Each pillar links to a specific feature page. This is the right level of abstraction for a homepage.

**Social proof.** A rotating logo marquee (OneDigital, Lockton, Daybright, Birch, IMA, Reliance Matrix), and **one** testimonial — a named Strategic Account Manager at a top-ten brokerage, with headshot, quoting a first-year open-enrollment engagement figure. One quote, chosen well, from a logo everyone recognises.

**Product sections.** Two deep-dives with real UI screenshots: conversational AI with admin controls over tone, custom instructions and source documentation; and agentic proposal intake with side-by-side comparison. Both are about *control*, not magic — the admin-controls framing is a mature answer to the "can I trust the AI" objection.

**Trust.** Dedicated Security page linked in the footer alongside Terms and Privacy.

**Palette read** *(inferred)*. Two logo variants shipped — colour and white — implying dark and light sections. Reads as a restrained, modern SaaS palette with a warm accent; the marquee uses inverted white logos on a dark band.

**Steal:** the audience-first two-level nav; the three economic pillars; the admin-controls framing of AI trust; one great testimonial instead of four adequate ones.
**Avoid:** the unqualified stat band. Their premium number is exactly the kind of figure our own corpus flags as undefined and unverifiable. If we build a stat band, every number gets a defined unit and a date.

---

## 1.3 Planyear — planyear.ai

| | |
|---|---|
| Stack | Webflow |
| Named platform | BEACON |
| Named assistant | SAGE |
| Primary CTA | GET STARTED |

**Information architecture.** Product (Platform / Assistant / Features) · Solutions (Benefits consultants / General Agents / Insurance Carriers / Employers & Employees) · **Implementation** · **Security** · Resources. Two of those five top-level items are de-risking pages, not product pages. That is a deliberate signal to a conservative buyer: *we know you are worried about the rollout and the data*.

**Naming.** A named platform (BEACON) and a named assistant (SAGE), both in caps. The category is converging on this convention — bswift has Emma, Zywave has Producer Agent and Advisor Agent, Businessolver has Sofia, Healthee has Zoe. See file 02 for the strategic read on whether TruHu should follow.

**Origin story as credibility.** The footer carries the line that matters most on the whole site: born from a brokerage, built by benefits consultants. For a buyer who has been sold to by outsiders for twenty years, *we are one of you* outperforms any feature list. TruHu has an equivalent asset and does not currently use it.

**Imagery.** Font Awesome duotone "light-full" icons (`island-tropical`, `ear-listen`, `comment-heart`). Product screenshots of BEACON. Section eyebrows in lowercase ("one platform, every perspective", "capabilities in context") — a small, distinctive typographic tic.

**Capability table.** A plain two-column *Platform Feature / How it helps* table listing Employee Benefits Portal, SAGE Assistant, Mobile App, Decisioning Support, Spanish Translations. Unfashionable and useful; it answers a buyer scanning for a specific capability without making them read prose.

**Steal:** Implementation and Security as top-level nav items; the born-from-a-brokerage credibility line; the feature/benefit table.
**Avoid:** the tropical-island icon. The icon set is generic and does nothing for the subject.

---

## 1.4 Flimp — flimp.net

*(Read from search-indexed content and the 2024 rebrand release rather than a live fetch this pass.)*

The instructive thing about Flimp is its **honest hybrid positioning**: it describes itself as both a technology provider and a managed creative-services company. Its architecture is a named campaign product (Flimp Campaigns) sitting on three named platforms — Canvas for content creation, Connect for text and email delivery, Decisions for decision support. Deliverable list is long and concrete: digital postcards, microsites, videos, benefits guides, print, presentations, virtual benefits fairs, texting.

Scale claim: more than 1,200 corporate clients including the top ten US brokers `[vendor-stated]` — noting that this figure and the 1,800+ figure elsewhere in the corpus do not reconcile with third-party estimates.

**Why it matters to us.** Flimp is the incumbent *shape* that Advisor is displacing: a services company with software attached, priced and paced like a services company. Every argument our site makes about speed and per-client cost is implicitly an argument against Flimp's model. That argument is stronger when it is made structurally (a comparison of how the work gets done) than when it is made with an unverified price or turnaround number.

**Steal:** the named-sub-platform architecture (Canvas / Connect / Decisions) as a way to give parts of a platform their own identity.
**Avoid:** the deliverable laundry list. It reads as an agency menu, not a product.

---

# LANE 2 — Broker-side platform incumbents (the sites our Advisor page is *compared* against by the same buyer)

## 1.5 ThreeFlow — threeflow.com

**The best-executed broker-facing B2B site in the set. If one competitor's site is used as the structural benchmark for the new truhu.ai, it should be this one.**

| | |
|---|---|
| Stack | Webflow |
| Positioning line | The only benefits placement system built for the AI era |
| Primary CTA | Request demo |
| Secondary CTA | **Take the tour** (self-serve product tour) |

**Category creation.** ThreeFlow does not describe itself as software. It names a category — **Benefits Placement System (BPS)** — and then puts a *What is a BPS?* explainer block on its own homepage, subtitled as the missing link in the modern broker and carrier tech stack. This is the highest-leverage move on any site reviewed. It reframes every comparison: a prospect is no longer choosing between vendors, they are deciding whether to adopt a category. See file 02 §7 and file 03 §2 for whether TruHu should attempt the same.

**Hero — the pattern most directly applicable to Advisor's workflow roadmap.** Six labelled workflow stages act as tabs, and **each has its own looping MP4 of the product doing that stage**: Renew & go to market · AI-populated quotes · Analyze & negotiate · Present · AI-assisted builds · Implement with GAs. The hero *is* the workflow map. A broker sees their own calendar reflected back at them before they read a word of copy.

**Segmented social proof.** Three separate rotating logo walls under one repeated heading, one per constituency — brokers (Arista, Axion, Henderson Brothers, M3, NFP, Scott), carriers (Guardian, Lincoln Financial, OneAmerica, The Hartford, Wellpoint), partners (Applied, BenefitPoint, Connexure, Ideon, Reliance Matrix, Salesforce). Every logo carries descriptive alt text. Segmenting the wall is strictly better than mixing it: each cohort sees itself.

**Stat band.** Headed *BY THE NUMBERS* with the subhead "the industry's shared system of action": premium under management, broker locations, certified carriers, employer groups. Four numbers, four defined units.

**Third-party statistics with attribution — the discipline to copy.** Pain statistics are cited to named external sources and dated: a LIMRA broker-tech report for the collaboration-friction figure, a BenefitsPro survey for the workaround figure, and their own user data, *labelled as their own user data*, for the placement-time figure. Every ROI number in the AI section is prefixed "Firms using ThreeFlow:" so the reader knows the population. This is exactly the standard the positioning thesis demands of us, executed by a competitor.

**Anti-rip-and-replace message.** Stated three times in different words: a BPS does not replace your stack, it connects it. For a buyer with an AMS, a ben-admin and a quoting tool already in place, "we connect" beats "we replace."

**Closing line.** Shared systems beat shared spreadsheets. A memorable, argument-carrying closer instead of a generic CTA headline.

**Nav.** Platform · Solutions (For brokers / For Centers of Excellence / For carriers) · Partners · Resources (Blog, Reports, Webinars, Case studies) · Company. Note **AI that works** as its own nav item, and **Security and compliance** and **Customer support** sitting inside the Platform menu — support treated as product surface.

**Palette read** *(inferred)*. White and near-white base with deep-navy sections, a green accent in social iconography, generous whitespace, AVIF/SVG assets throughout.

**Steal:** the tabbed workflow hero with per-stage video; segmented logo walls; attributed third-party pain stats; "Take the tour" as a second CTA; the anti-rip-and-replace line; a closing line that argues.
**Avoid:** their homepage repeats the same four feature blocks twice in the markup. Whatever the reason, it is duplication a reader can perceive.

---

## 1.6 Zywave (Apex) — zywave.com/ai

**The incumbent's AI story. Read this one for objection-handling and governance, not for aesthetics.**

| | |
|---|---|
| Stack | WordPress + WPBakery; site built by an outside agency (Digital Silk) |
| Sub-brand | **Zywave Apex**, with its own logo and its own nav section |
| Positioning line | The AI platform for the front office of insurance |
| Key phrase | Systems of action — AI that doesn't just know, but does |

**Named agents with lifecycle status badges.** Producer Agent (**Live**), Advisor Agent (**Early Access**), Apex MCP (**Live**), and a "Coming Soon — more agents are on the way" card. Publishing the roadmap *with honest status labels* is a strong move for a platform story: it makes the platform feel like a growing surface rather than a fixed feature list, and the Early Access badge converts an incomplete product into a scarcity offer. **This is the single most transferable idea for TruHu's workflow roadmap**, where renewal decks are Apr 2027 and stewardship Jul 2027.

**Animated stat counters.** Four figures that count up on scroll: employers, household profiles, expert-reviewed content, loss benchmarks.

**The liability appeal, stated bluntly.** One wrong sentence has the potential to become an E&O event — used as the reason generic AI cannot serve this market, and the reason thirty years of proprietary data matters. This is the sharpest articulation of the risk appeal anywhere in the set, and it is available to TruHu with better standing, because our output goes to employees rather than to a producer's inbox.

**A dedicated governance section.** Headed *Built for governance — every AI action, observable and controlled*, with three tabs and a screenshot each: Security and Access (OAuth2, token binding), Audit and Compliance (full audit trail, automatic PII redaction, SOC 2), Org-Level Controls (role/team/user restriction). Enterprise buyers now expect this section to exist. TruHu has no equivalent anywhere on truhu.ai.

**Deployment-time answers on the page.** Producer Agent deploys in 30 days; MCP connects in under an hour; enterprise deployments run four to six weeks. Naming the number removes the biggest silent objection.

**A twelve-question FAQ written as an objection-handling script.** What is Apex · What is MCP · How does each agent work · **Does it replace my existing systems** (no) · What AI clients does it work with · **How long does it take to deploy** · Is it secure · What data does it run on · Who is it for · **How is it different from generic AI**. This is not SEO filler; it is the discovery call, written down.

**"The platform behind Apex."** Four proprietary data assets with screenshots, positioned as the thing generic AI cannot replicate. A moat section, on the marketing site.

**Palette read** *(inferred)*. Blue-led — their logo asset is literally named `zywave-logo-insuring-growth-blue`. Corporate, dense, information-heavy; a WordPress-era layout rather than a modern editorial one.

**Steal:** lifecycle status badges on roadmap capabilities; the governance section with tabs and screenshots; deployment timelines on the page; the objection-handling FAQ; the E&O/liability framing; a data-foundation section.
**Avoid:** the density. Mega-menus with case studies embedded in every column, duplicated across five tabs, is an incumbent's site. Do not confuse comprehensiveness with authority.

---

## 1.7 bswift — bswift.com

*(Read from indexed content across the homepage, platform, Simplify, Emma and channel-partner pages.)*

**The named-AI strategy taken furthest.** Emma™ Intelligence is a persona-level brand with a family of named sub-products: Emma Chat, Emma EnrollPro, Emma AdminPro, Emma Agent Assistant — plus a separate trademarked method name, Mindful AI®, and a separate recommendation engine, Evive™.

**The definitional defence.** bswift repeatedly defines *AI-native* as meaning built into the platform and workflows rather than added as a separate chatbot or bolt-on. This is a claim designed to disqualify competitors by definition rather than by comparison, and it is aimed squarely at companies whose AI arrived later than their product. TruHu should assume this framing will be used against it and should have an answer.

**Hard operational metrics used as proof.** Post-call satisfaction, first-call resolution rate, and the share of chats occurring outside business hours. That third number is the cleverest of the three: it proves the product does something a human team structurally cannot, rather than merely doing it better.

**Channel-partner page.** A dedicated page for brokers and channel partners, with Simplify described as sold exclusively through that channel rather than direct. For a company selling *through* brokers, having an explicit partner page is table stakes.

**Steal:** the sub-product naming discipline; the "chats outside business hours" style of metric — proof of a structural capability, not an incremental one.
**Avoid:** trademarking a method name. Mindful AI® adds a symbol, not credibility, and invites the question of what it means.

---

# LANE 3 — Decision support and navigation

## 1.8 Nayya — nayya.com

| | |
|---|---|
| Stack | Webflow |
| Positioning line | The agentic AI adviser optimizing health and wealth |
| Hero headline | Smarter decisions for life's most important moments |

**Thought-leadership announcement bar.** A persistent top bar promoting original research — a finding about employees receiving wrong benefits advice from AI that was not purpose-built — linking to a downloadable report. The report does two jobs at once: it generates leads, and it *disqualifies generic AI* on the reader's behalf before they reach the product. This is the strongest content-marketing pattern in the set.

**Two domains, two audiences.** `nayya.com` for the platform and the buyer; `nayya.ai` for the intelligence/orchestration layer and the technical evaluator. A deliberate split rather than one overloaded site.

**Three differentiation cards** with WebP illustrations: Beyond Recommendations (it acts, not just advises) · Unified Intelligence (health and wealth optimised together) · Native Integration (lives in Slack, Teams, iMessage — the memorable line is about no more abandoned portals).

**Stat band** of three: employees served, reduction in benefits-related HR questions, average amount reclaimed through automated claims filing. Note that two of the three are *customer outcomes*, not company scale. Better than a pure scale band.

**Compliance as a named section.** A privacy-forward approach to ethical AI, with a badge row and an explicit list: HIPAA, WCAG AA 2.1, SOC 2 + HITRUST, ADA, CCPA, NIST 800. Note **WCAG AA 2.1 sitting inside a trust claim** — accessibility marketed as compliance. Relevant to us: our output is read by employees, so an accessibility posture is more defensible for TruHu than for most of this set.

**In the news** section with three dated items — an acquisition, an advisory board announcement, and an engineering post about how a product was built. The engineering post is the one that signals a real company.

**Palette read** *(inferred)*. Deep violet/indigo brand with light content sections; illustration-led rather than photography-led.

**Steal:** the original-research report as an announcement bar; customer-outcome stats over vanity scale; the named compliance list including accessibility; a dated newsroom strip.
**Avoid:** the mission language in the middle of the page ("join our movement"). On a B2B site aimed at an account manager with a renewal deadline, mission copy is a section a reader scrolls past.

---

## 1.9 Jellyvision (ALEX) and 1.10 Healthee — brief notes

Both are employee-facing brands and both carry more *personality* than anything on the broker-side. Jellyvision's long-running position is conversational, warmly humorous, and built around a named character (ALEX); Healthee runs a named assistant (Zoe). Their relevance here is narrow but real: **they set the expectation for what the employee-facing artefact should feel like.** When a broker evaluates TruHu Advisor, the guide their employees will see is being judged against ALEX. That is an argument for showing the *employee experience* on our site in a real device frame, not just the admin console.

---

# LANE 4 — Frontline / workforce communication (the sites our Workforce page is judged against)

## 1.11 TeamSense — teamsense.com

**The pain-statistic model, executed hard.** TeamSense front-loads external statistics about the frontline communication gap — the share of frontline workers who say they do not get enough communication from management, the share who feel out of the loop on policy changes, the share who feel engaged, and a global productivity-loss figure. The whole site is built on making the reader feel the problem before the product appears.

Product framing is relentlessly single-minded: everything over text, no apps, no emails, no logins. Multilingual support and an Employee Assistant that answers from the company's approved documents and escalates to HR when it cannot answer confidently. That escalation behaviour is marketed as a *feature* — an honest AI posture that reads as competence rather than limitation.

**Steal:** naming the escalation path as a feature; the single-mechanic clarity ("everything over text").
**Avoid:** the stat stack. Our own corpus is explicit that engagement and deskless-workforce statistics in this market are largely VC-definitional or vendor-sourced, and that email open rates are corrupted. Building a homepage on borrowed statistics is a liability we specifically decided not to take on.

## 1.12 Yourco — yourco.io

**The two things Yourco does that we do not.**

1. **Published pricing with a free tier.** Free to 50 employees, then a per-employee monthly rate to 200, volume discounts above that, custom at enterprise scale. This lands them inside an account before a procurement conversation happens. It is the most commercially aggressive move in the lane.
2. **Compliance content as the acquisition channel.** Long-form pages on policy acknowledgement, texting compliance and audit-ready records — written as practitioner guidance, ranking for the exact searches an HR manager makes when they are worried. Their language is precise: responses recorded, timestamped and linked to the worker's ID.

Also relevant: Frontline Intelligence (Mar 2026) markets AI analysis of workforce communication for sentiment and emerging issues — the same compounding-data-asset story our own moat analysis reserves for ourselves.

**Steal:** compliance-anxiety content as a demand channel; the precision of the acknowledgement language.
**Consider, don't copy blind:** the free tier. It fits an employer-direct motion. TruHu sells to a broker who deploys across a book, and a free tier priced per employee reads differently through that channel.

## 1.13 goHappy — gohappyhub.com

App-free frontline engagement at scale, with recognisable QSR and retail logos. Their strongest copy is the removal of *three* frictions at once — no app download, no account creation, and no opt-in. Note for our claims register: our verification pass could not source any compliance or audit-trail capability on goHappy's own pages, so their absence in that area is a genuine gap, not an oversight in their marketing.

---

# Cross-cutting observations

**Platform.** Five of the six most modern sites in this set are on **Webflow** (Brite, Pasito, Planyear, ThreeFlow, Nayya). The incumbents are on **WordPress** (Zywave). Nobody visible in this lane is on a bespoke Next.js front end. That is an opportunity: a properly built Next.js site can beat every one of these on load performance, and performance on a benefits site is not vanity — account managers open these pages on bad hotel wifi between client meetings, and employees open the *output* on phones with two bars.

**Nobody in this set shows the deliverable.** Every Advisor-lane competitor shows the *builder* — the admin console, the guide editor, the analytics dashboard. Not one of them puts the finished artefact the broker hands their client on the homepage at full size. For a company whose entire argument is about the quality and speed of a deliverable, that is an unclaimed position.

**Nobody in this set shows time.** Everyone claims speed ("in minutes", "launch in days not months", "weeks of work into minutes") and nobody proves it. A single unedited timed clip of a real guide being produced from real plan documents would be the most differentiated asset in the category, and it is the cheapest asset on the whole list to make.
