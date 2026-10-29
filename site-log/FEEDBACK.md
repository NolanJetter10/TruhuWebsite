# Feedback register

Every piece of advice about the site, one item each: who said it, their words, and where it stands. Work cites these IDs in `LOG.md`. This file is how we check that nothing got dropped.

Statuses:

- `open`: nothing done yet
- `partial`: some of it done; the Where line says what's left
- `check`: looks done in the code, but needs a visual check or Nolan's call
- `done`: done, with the evidence in a log entry
- `dropped`: decided against; the Where line says why and who decided

The statuses first set on Oct 20, 2026 come from reading the code at commit `0248d50`, not from looking at rendered pages.

To add advice: give each distinct point the next FB number, quote the person, put the full original in `sources/`, and set the status to `open`. When work touches an item, change its Status and Where lines and add the log ID to its Log line. Never delete an item; use `dropped`.

---

## Team feedback on the homepage draft (Oct 6, 2026)

Khurram, Xander, Satchel and Carolyn. Original: `sources/2026-10-06-team-feedback.md`, a copy of the Claude project doc `claude/landing-page/feedback/2026-10-06-team-feedback.md`.

### FB-001 · Line up the problem boxes and take the wobble off their tags
- From: Xander, Carolyn · Oct 6
- Said: "I think we should remove the wobble from the tags in these blocks, doesn't feel like the skews match with the rest of the clean/modern aesthetic" (Xander). "Why are the boxes not lined up?" (Carolyn)
- Status: check
- Where: The three "Today" cards (`WORKLOAD`) sit in a straight grid in `app/page.tsx`; their tags land with a scale and slide and no rotation (`piece-land` in `app/globals.css`). Not yet seen rendered.
- Log: L-001

### FB-002 · Remove "sample data" from the step-by-step deliverables tag
- From: Xander · Oct 6
- Said: "no need to say "sample data" on the deliverables tag in our step by step"
- Status: done
- Where: No "sample data" text renders anywhere. It survives only in a code comment on `CAMPAIGN`.
- Log: L-001

### FB-003 · Say "chatbot" and "video" instead of "Q&A"
- From: Xander · Oct 6
- Said: "let's make the chatbot and video functionality more explicit instead of saying "Q&A" which could be misconstrued"
- Status: partial
- Where: /advisor is fixed ("Benefits chatbot" and "Narrated video" in `ADVISOR_PAGE.outputs`). The home page still says Q&A twice: the How-it-works output chips `Guide · Website · Flyer · Q&A` (`OUTPUTS` in `components/demos/DocumentFlow.tsx`) and "Employee Q&A" on the Advisor product card (`PRODUCTS` in `lib/content.ts`).
- Log: L-001

### FB-004 · Add "flipbook" to the deliverables block, for symmetry
- From: Xander · Oct 6
- Said: "to keep it even I'd add "flipbook" to the deliverables block too just to keep things symmetrical"
- Status: open
- Where: The How-it-works output chips (`OUTPUTS` in `components/demos/DocumentFlow.tsx`) have no flipbook. Flipbook already appears on /advisor and among the added chips on the "With TruHu" card (`SOLUTION`).
- Log:

### FB-005 · No real companies or URLs as examples
- From: Carolyn · Oct 6
- Said: "I don't think we should use real urls as examples - ie ridgeline.com". "unless we have signed authorization, we should use generic/fake companies, not ones that exist. Especially if it guides you to a VC"
- Status: partial
- Where: Ridgeline is gone; the demos use Sample Company, Harbor Clinics, Oakview Schools, Summit Tool & Die and Northwind. Unchecked domains still on screen: samplecompany.com (`ProductWalkthrough.tsx`, `IntakePipeline.tsx`), harborclinics.org and oakviewschools.org (`IntakePipeline.tsx`), and acmecorp.com as an input placeholder (`ProductWalkthrough.tsx`). Real organizations may own them; `.example` addresses would settle it.
- Log: L-001

### FB-006 · Sell a better result and top-line growth, not only less work
- From: Khurram · Oct 6
- Said: "It's focused on reducing work but does not emphasize that the actual outcome is way better than what they could achieve manually". "we need to make it a competitive advantage for our brokers and not just a cost advantage"
- Status: partial
- Where: The hero reads "The AI platform benefit brokers grow with." and `SOLUTION` promises "the highest-quality deliverables in a fraction of the time." The open-enrollment section and the five-step flow still argue time saved.
- Log:

### FB-007 · Lead with what's different; "AI turns documents into guides" is an old story
- From: Khurram · Oct 6
- Said: "Our website needs to highlight differentiations, it can't be just what so many startups are claiming in our space already. Ai -> guides is becoming an old story already, what's more?"
- Status: open
- Where: The How-it-works heading tells that story: "Source data in, deliverables out." (`DOCUMENT_FLOW`)
- Log:

### FB-008 · Don't over-dramatize the problems
- From: Carolyn · Oct 6
- Said: "True problems don't need to be emphasized. They do that on their own..."
- Status: open
- Where: `WORKLOAD` reads "We get it — open enrollment is chaos.", "Your team is putting in 10-hour days on outdated tools…", "Output that suffers" and "Clients left guessing".
- Log:

### FB-009 · Keep the (truly) human side: show real people
- From: Carolyn, Satchel · Oct 6
- Said: "try NOT to loose the (Truly) human aspect" (Carolyn). "although we are a tech company, we work in an industry built on personal relationships" (Satchel)
- Status: partial
- Where: Three advisor quotes with pictures (`QUOTES`). The video reel is five empty "Video coming soon" slots (`STORIES`). Team photos for /about sit uncommitted in `public/images/team/`.
- Log:

### FB-010 · Show off the finished guides and benefits sites
- From: Khurram · Oct 6
- Said: "Highlight some beautiful guides, sites"
- Status: partial
- Where: /advisor: the before/after guide viewer, and the outputs tour, which shows Kindlerye's real guide, flipbook, benefits site, chatbot, narration and flyer, live (`OutputShowcase.tsx`). /BryanKleppe: Bryan's AI pulls up Kindlerye's reworked guide, flyer, microsite and flipbook when a visitor asks (L-010). Nothing on the home page yet.
- Log: L-004, L-010

### FB-011 · Translations into many languages in seconds
- From: Khurram · Oct 6
- Said: "many translations in seconds"
- Status: partial
- Where: Home: one clause in the `SOLUTION` lede ("translate them into 100+ languages in seconds"). /advisor: the "100+ Languages in Seconds" feature card.
- Log:

### FB-012 · Many ways to present: flipbooks, videos, presentations
- From: Khurram · Oct 6
- Said: "Talk about multiple ways to present - fills, videos, presentations" ("fills" is probably flipbooks)
- Status: partial
- Where: Home: three added chips on the "With TruHu" output card. /advisor: tabs for guide, flipbook, website, chatbot, narrated video and flyer, each showing the real deliverable for Kindlerye, live. /BryanKleppe: the guide as a full-page flipbook in the product's own viewer, plus the page-by-page guide, flyer and microsite, on request (L-010).
- Log: L-004, L-010

### FB-013 · Feature the AI design assistant
- From: Khurram · Oct 6
- Said: "Highlight ai design asst as that is unique to us and heavily used"
- Status: partial
- Where: Not named on the home page. /advisor: "AI Design Assistant" feature card.
- Log:

### FB-014 · Highlight accuracy
- From: Khurram · Oct 6
- Said: "Highlight accuracy as well"
- Status: partial
- Where: Home: the "Accurate plan data" chip and a line in Responsible AI. /advisor: the "Accurate to the Source" card.
- Log:

### FB-015 · Make the benefits assistant a key highlight
- From: Khurram · Oct 6
- Said: "highlight benefits assistant - that's part of our 'outcome is way way better and not just faster and cheaper to build'". "Ben assistant will end up being a key highlight"
- Status: partial
- Where: Home: one sentence in the `SOLUTION` lede. /advisor: the "Benefits chatbot" tab embeds the real Benefits Assistant on Kindlerye's site, so visitors can ask it questions.
- Log: L-004

### FB-016 · Narration, and asking questions partway through it
- From: Khurram · Oct 6
- Said: "narration and ability to ask questions in the middle of the narration are things we can actually claim to be pioneers on"
- Status: partial
- Where: Not on the home page. /advisor: the "Narrated video" tab ("In a TruHu first, employees can stop it to ask a question…") embeds Kindlerye's live guide, where "Explain my Guide" narrates and turns the pages, with "Ask a question" in the same bar (the asking itself not yet tried here).
- Log: L-004

### FB-017 · Study Outmarket's benefits page: a product demo that shows what's under the hood
- From: Satchel · Oct 6
- Said: "i like how outmarket looks like a product demo (not scared to show under the hood)" (outmarket.ai/platform/benefits)
- Status: partial
- Where: The customer-story row copies Outmarket's layout (`StoryReel`), and the demos show the product working. No deliberate pass against the Outmarket page yet.
- Log:

### FB-018 · Study FurtherAI: professional, with imagery of real people in the biggest markets
- From: Satchel · Oct 6
- Said: "the professionalism of further's. it looks like based on the imagery they are in the biggest markets and real people" (furtherai.com)
- Status: open
- Where: No photography of people on the home page.
- Log:

---

## Nolan's home page review (Sep 28, 2026)

Nolan's verdicts from going through the rebuilt home page section by section, in a Claude chat on Sep 28.

### FB-019 · Take the renewal calendar off the home page
- From: Nolan · Sep 28
- Said: The "Most of your book renews January 1" section and its days-out timeline don't belong on the home page. Maybe a place on /advisor, but it's a weak section with information that isn't what we're going for.
- Status: done
- Where: Not on the home page; no "renews January" text left in the code.
- Log: L-001

### FB-020 · Better quotes and testimonials
- From: Nolan · Sep 28
- Said: The home page quotes need to be better.
- Status: open
- Where: The same three quotes as the live site: first name and initial, role, no firm (`QUOTES`).
- Log:

### FB-021 · Remove "Where TruHu sits"
- From: Nolan · Sep 28
- Said: The "Neither system you own builds the guide" section, with its No AMS integration / No carrier feed / No ben-admin dependency / No IT project chips, should almost certainly come out.
- Status: done
- Where: Gone from the home page. The same line survives on /how-it-works (`HOW_PAGE`: "No AMS integration. No carrier feed. No ben-admin platform. No IT project at the employer.").
- Log: L-001

### FB-022 · Decide whether "Latest from TruHu" belongs on the home page
- From: Nolan · Sep 28
- Said: Not sure the resources block belongs on the home page; go by how P&C and benefits competitors structure theirs.
- Status: check
- Where: Not on the home page now. Nobody recorded whether that was the decision.
- Log: L-001

### FB-023 · Draw home page additions and copy from the competitor research
- From: Nolan · Sep 28
- Said: Wants home page additions and copy suggestions drawn from the competitor landing-page research (Claude project `claude/landing-page/competitors-designs/`).
- Status: open
- Where: The structure choice (options A to D in `03-options.md`) is still open; see DIRECTION.md.
- Log:

---

## Earlier conversations (Sep 14, 2026, before the build)

Nolan's notes from talks with Satchel, Carolyn, Xander, Bryan and Khurram, plus his own plan. Originals are in `C:\Users\nolan\Documents\Truhu\Marketing\03 notes\`; each item names its file. Only the points about the website are here.

### FB-024 · Don't oversell: TruHu does most of the work, not all
- From: Satchel · Sep 14 · 04-satchel-notes.md
- Said: "MOST of the work is done by TruHu, not all, so you can spend time reviewing for quality, feel, output. Not all of the work, but most. Make sure not to lie." And: "In-app demos: be a bit careful with false expectations… but it also shows honesty. Simple, don't oversell."
- Status: partial
- Where: The review step is stated on the home page (Responsible AI: "Nothing reaches a client until they do"; Advisor card: "Your team reviews it, then publishes"). Nobody has checked the demos for overselling.
- Log:

### FB-025 · Compare the old process with the new one on the home page
- From: Satchel · Sep 14 · 04-satchel-notes.md
- Said: "Home page: comparison of what the old process looks like vs. the new process with Advisor."
- Status: done
- Where: The "Today" cards (`WORKLOAD`) are answered card for card by "With TruHu" (`SOLUTION`). /advisor adds the before/after guide viewer.
- Log: L-001

### FB-026 · Use Satchel's new quotes
- From: Satchel · Sep 14 · 04-satchel-notes.md
- Said: "Add the new quotes that Satch has."
- Status: open
- Where: The quotes are still the three from the live site. Goes with FB-020.
- Log:

### FB-027 · Speak to growth executives and to account managers
- From: Satchel · Sep 14 · 04-satchel-notes.md
- Said: "Growth executives want the flash. Taglines hit for these guys. Account managers will look more deeply (they need examples, quotes, stuff like this, what can you actually do with it). Should try to target both."
- Status: partial
- Where: The home page leads with taglines and /advisor carries the examples. No clear path for account managers.
- Log:

### FB-028 · A drop-in video: files in, processing, here's your page
- From: Carolyn · Sep 14 · 03-carolyn-notes.md
- Said: "Video for things dropping in -> processing -> here is your page."
- Status: partial
- Where: The animated demos do this (`ProductWalkthrough`, `DocumentFlow`, `IntakePipeline`). No recorded video.
- Log:

### FB-029 · Live numbers pulled from the database
- From: Carolyn · Sep 14 · 03-carolyn-notes.md
- Said: "The numbers for guides built, brokerages, etc. pulled directly and pushed onto the page from some database."
- Status: open
- Where: The stat band (`TRUST_STATS`: 340+ brokerages, 5,200+ groups, 12,400+ guides) is placeholder data and cannot ship as it is.
- Log:

### FB-030 · Show Advisor's ROI instead of open-enrollment hours
- From: Carolyn · Sep 14 · 03-carolyn-notes.md
- Said: "Instead of the time for the open enrollment period, maybe I should emphasize the ROI for what Advisor does."
- Status: open
- Where: No ROI figure on the home page, and the open-enrollment section still leads with hours ("10-hour days").
- Log:

### FB-031 · Put responsible AI up front
- From: Carolyn · Sep 14 · 03-carolyn-notes.md
- Said: "Responsible AI is something that should be pushed forward."
- Status: done
- Where: The home section "AI saves time and money, but the expert never leaves the loop." (`RESPONSIBLE_AI`), linking to /security.
- Log: L-001

### FB-032 · Target today's friction on the main page
- From: Carolyn · Sep 14 · 03-carolyn-notes.md
- Said: "What's the friction they are working with now -> target that on the main page."
- Status: done
- Where: The open-enrollment section (`WORKLOAD`). It pulls against FB-008: name the friction without the drama.
- Log: L-001

### FB-033 · Video demos with Cathy and Cindy
- From: Carolyn · Sep 14 · 03-carolyn-notes.md
- Said: "Cathy and Cindy for video demos on the website (reach out to them)."
- Status: open
- Where: `STORIES` is five placeholder slots.
- Log:

### FB-034 · Broad hero, specific taglines
- From: Xander · Sep 14 · 06-xander-notes.md
- Said: "the hero says things broad, but have super specific taglines". "Taglines for the super specific stuff: guides, microsites, etc."
- Status: partial
- Where: The hero is broad. Specific taglines live on the /advisor tabs, less so on the home page.
- Log:

### FB-035 · Layer the pages: executives, then account managers, then IT
- From: Xander · Sep 14 · 06-xander-notes.md
- Said: "head pages for the execs -> copy for AMs who want to see how things work -> deeper dive into the platform for IT people."
- Status: check
- Where: Home (executives), /advisor and /how-it-works (account managers), /technology and /security (IT).
- Log: L-001

### FB-036 · Write for search engines and AI answers (GEO)
- From: Xander · Sep 14 · 06-xander-notes.md
- Said: "Look into GEO. Straightforward, informative language." And: "Citations, blog posts are probably good. Comparisons between products."
- Status: partial
- Where: /faq and /resources exist. No product comparison pages, and no deliberate GEO work yet.
- Log:

### FB-037 · Show the account manager's "oh wow" moments
- From: Xander · Sep 14 · 06-xander-notes.md
- Said: "build a guide from an account manager perspective. Load info once and build things. Translations. Hit the points of excitement." "'Oh wow' moments from the brokers."
- Status: partial
- Where: The hero demo builds a guide. No broker "oh wow" quotes.
- Log:

### FB-038 · Say what brokers can do right now
- From: Xander · Sep 14 · 06-xander-notes.md
- Said: "People often want to know: what can you practically do right now? Will you exist in the future? Trust… they want to know what they can do right now."
- Status: open
- Where: No section answers it directly.
- Log:

### FB-039 · A less technical demo: docs in, output out
- From: Xander · Sep 14 · 06-xander-notes.md
- Said: "Less techy on the demo? Verbiage: make it less technical, fewer steps, docs in -> output."
- Status: partial
- Where: How-it-works runs five steps (`DOCUMENT_FLOW_STEPS`).
- Log:

### FB-040 · Open-enrollment section: show we carry the load for them
- From: Xander · Sep 14 · 06-xander-notes.md
- Said: "Open enrollment section: more of how we impact -> more emphasis on 'carry the product load for them.'"
- Status: open
- Where: `WORKLOAD` describes the load and `SOLUTION` answers it, but not in those terms.
- Log:

### FB-041 · Real stats from the dashboard and Advisor sites
- From: Xander · Sep 14 · 06-xander-notes.md
- Said: "Barely scratching the surface on stats. Look at getting some Advisor sites." "ask Xander for a bolt-on to the dashboard."
- Status: open
- Where: The same placeholder band as FB-029.
- Log:

### FB-042 · A different pitch for producers, executives and operations
- From: Bryan · Sep 14 · 02-bryan-sales-meeting-advisor-positioning.md
- Said: "Producers: ROI framed as selling / retaining more groups. Execs: ROI framed as getting all their producers performing. Operations: ROI framed as eliminating admin burden"
- Status: open
- Where: One pitch for everyone today.
- Log:

### FB-043 · White glove for the other 90%
- From: Bryan · Sep 14 · 02-bryan-sales-meeting-advisor-positioning.md
- Said: "brokers only deliver a white-glove experience to the top 10% of clients. Pitch: what if you could do that for the other 90%?"
- Status: done
- Where: `SOLUTION`: "White glove for every client, not just your top 10%."
- Log: L-001

### FB-044 · Per-broker landing pages with a persona picker and a sandbox
- From: Bryan · Sep 14 · 02-bryan-sales-meeting-advisor-positioning.md
- Said: "Company-specific landing pages for each broker (e.g., Gallagher)": a persona selector on entry, upload last year's benefit guide, pull the logo from the company URL, book 20 minutes with Bryan or Satchel.
- Status: partial
- Where: /BryanKleppe lets a visitor upload last year's guide or plan documents when they ask Bryan's AI for a guide, for the team to build one from, and opens the calendar to book with Bryan (L-009). No per-broker pages, persona picker or logo pull yet; probably its own project.
- Log: L-009

### FB-045 · Position TruHu as responsible AI that brokers trust to save time and raise quality
- From: Nolan · Sep 14 · 05-khurram-website-meeting.md (his notes going into the Khurram meeting)
- Said: "Positioning to be: responsible AI trusted by benefits brokers to help them save time and produce a higher quality product."
- Status: partial
- Where: The hero reads "The AI platform benefit brokers grow with."; quality and trust are argued further down. The strategy sentence is still being worked out (see DIRECTION.md).
- Log:

### FB-046 · Lead positive, not "the rest get a PDF"
- From: Nolan · Sep 14 · 05-khurram-website-meeting.md
- Said: "'Top clients get everything, the rest get a PDF' is kind of negative -> lead with positivity."
- Status: open
- Where: The /advisor problem headline is still "Your top clients get everything, the rest get a pdf." (`ADVISOR_PAGE.problem`). Home: "Your top 10% get white glove. Everyone else gets what's left." (`WORKLOAD`).
- Log:

### FB-047 · A technology page for IT
- From: Nolan · Sep 14 · 05-khurram-website-meeting.md
- Said: "full page on technology: security, compliance, integrations, AI governing / guardrails, etc. Built for the IT teams (so can go more technical on this stuff)."
- Status: check
- Where: /technology and /security exist.
- Log: L-001

### FB-048 · Show we're legit: case studies, logos, interactive demo, video
- From: Nolan · Sep 14 · 01-nolan-marketing-batches.md
- Said: "Customer case studies, customer logos, interactive demo, video… simple and clean to show we are legit."
- Status: partial
- Where: The logo wall and the running demos are live, and /resources/case-studies exists. The /advisor outputs tour is an interactive demo of real deliverables (L-004). /BryanKleppe has a live video call with Bryan's AI avatar, in his face and cloned voice (L-008), which can open the calendar, a guide upload and Kindlerye's sample deliverables on request (L-009, L-010). The videos are placeholders.
- Log: L-004, L-008, L-009, L-010
