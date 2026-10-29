# Direction

Read this first. It says what the site is for, what we're working on now, what has been decided, and the rules every word on the site follows. Change it when a decision is made or the focus moves, and date what you add.

## What the site is for

- To show about 50 target brokerages, and investors, that TruHu is a real and serious company. It is not a demand-generation site. (Nolan, Sep 14: "The point is to verify quality of company for prospective… not so much demand gen (only 50 prospects).")
- Readers, in order: executives on the home page, account managers on the product pages, IT on /technology and /security. (Xander, Sep 14; FB-035)

## Now

What's being worked on. Keep it short; finished work moves to the log.

- 2026-10-20 · Proposed first round (Claude, waiting on Nolan): FB-003 and FB-004 (Q&A wording and the missing flipbook in How-it-works), FB-005 (example domains), and the four banned words the script flags in `lib/content.ts`: "harness this chaos" and "The output, elevated" on the home page, "seamless" on /advisor, "Cutting-edge AI" on /technology.
- 2026-10-20 · Proposed after that: the story items FB-006, FB-007 and FB-008.

## Decisions

Newest first. Each line says who decided and where it came from.

- 2026-10-29 · /BryanKleppe opens on Call, not Video: Bryan's own photo in a circle with a ring that moves with his voice, the Video and Chat views beside it. During a live call a "Talk to the real Bryan" button opens the calendar while he says "Great! Let's get you scheduled with the real deal!" (Nolan; L-014)

- 2026-10-29 · /BryanKleppe ships to the company as a working prototype before its back end is wired: bookings, the guide upload and the emails all complete in the UI without a database, file storage or email service, and nothing they collect is kept until those are set up. (Nolan; L-013)
- 2026-10-29 · /BryanKleppe leads with Bryan's AI: the headline is "Take 10 minutes with Bryan, and see what he builds for you:" (two lines), the box takes all the height the screen has left, and the label bar, eyebrow tag, lede and call note are gone. Every popup opens in the middle of the screen while Bryan floats in the bottom-right corner; the calendar grows into its popup from its own spot. Both Video and typed Chat stay. (Nolan; L-011)
- 2026-10-28 · On /BryanKleppe, Bryan's AI shows Kindlerye (the made-up demo employer) as its samples: the reworked guide, flyer and microsite in the popup, and the guide as a flipbook over the whole page in the benefits-guides viewer. The assets live in this repo (public/kindlerye/, public/flipbook/). Its intro is Nolan's line: "I'm Bryan's AI assistant, and I look and sound just like him! …" (Nolan; L-010)
- 2026-10-28 · On /BryanKleppe the Ensemble agent decides when to open the calendar or the guide upload, by sending one of two page widgets; the page owns everything after that, including Bryan's lines, which are fixed copy in `lib/content.ts` rather than the model's words. Visitors always get the agent's published version, so a draft saved in Ensemble never reaches them; agent changes are tested on the dev server first and published only with Nolan's OK. (Nolan; L-009)
- 2026-10-28 · Guide uploads go to a private Supabase bucket (`guide-uploads`), and the team builds the guide by hand from an email with the visitor's address and download links. Accepted: plan documents or last year's guide as PDF, Word, PowerPoint or images. (Nolan; L-009)
- 2026-10-28 · The /BryanKleppe video is TruHu's own: Bryan's Anam avatar and cloned voice, with the "Bryan Kleppe" Ensemble agent as the brain. Ensemble's built-in video stays off there, because its face and voice are shared by every agent. The avatar always says it is an AI version of Bryan. (Nolan; L-008)
- 2026-10-28 · The booking page is /BryanKleppe (was /get-started). It has no site header or footer and fits one screen on a desktop; the "How the 10 minutes go" section was dropped to make that fit. (Nolan; L-006)
- 2026-10-20 · Advice and changes are tracked in this folder (`site-log/`); every agent logs its work (AGENTS.md). (Nolan)
- 2026-10-06 · The problem boxes are no longer misaligned on purpose. The tilt was meant to make the problems look chaotic; Xander and Carolyn disliked it, so it comes out. (Nolan, replying in Carolyn's thread; FB-001)
- 2026-09-28 · The renewal calendar does not belong on the home page; maybe on /advisor. (Nolan; FB-019)
- 2026-09-28 · "Where TruHu sits" comes off the home page. (Nolan; FB-021)

## Rules for anything the site says

- Writing: `C:\Users\nolan\Documents\Truhu\00 - Writing Standards.md`. Lead with the claim, no banned words or constructions, one em dash at most. `node scripts/site-log.mjs` flags banned words it finds in `lib/content.ts`. Customer quotes stay as they were said.
- Never lead a headline with the manual status quo. TruHu is the actor and automation is the claim. The "built by hand at eleven at night" line is retired everywhere. (Nolan, Aug 14)
- Numbers: every number on the site is one truhu.ai already publishes or one with a visible source. Placeholder figures never ship. (README, "Claims discipline")
- Example data: invented companies and addresses only. No real company or URL without signed permission. (Carolyn, Oct 6; FB-005)
- Honesty: TruHu does most of the work, not all, and the broker's team reviews before anything is published. (Satchel, Sep 14; FB-024)
- Reuse carefully worded existing TruHu copy as it is where it fits, rather than rewriting it. (Nolan, Sep 28)
- Ensemble is TruHu's own agentic platform. Copy must never make it sound outsourced or like a third party runs TruHu's AI. (Nolan, Sep 28)
- Advisor and Workforce are sold separately, so the home page never draws them as one build-and-send pipeline. (Product-truth memo, Aug 7. Whether this still holds is open question 3.)

## Open questions

These need Nolan or the team. Most come from the competitor research, Claude project `claude/landing-page/competitors-designs/03-options.md` (Sep 28).

1. Home page structure: option A (product-first), B (audience-first), C (job and calendar first, the doc's proposal) or D (role-first). Not decided. Note that C builds on the renewal calendar, which Nolan's Sep 28 review called weak (FB-019).
2. Who buys Workforce: the broker, the employer, or both?
3. Does the Aug 7 two-products rule still stand?
4. Which numbers can ship, with a defined population and a date? (FB-029, FB-041)
5. Which quotes can carry a firm name? (FB-020, FB-026)
6. How public can the roadmap be (Live / Early access / Coming soon labels)?
7. Pricing: footer only, in the FAQ, or shown?

## Background

- Team feedback originals: `site-log/sources/`, and the Claude project `claude/landing-page/feedback/`
- Competitor site research: Claude project `claude/landing-page/competitors-designs/`, and `C:\Users\nolan\Documents\Truhu\landing page\competitors designs\`
- Content spec (Aug 14) and blueprint (Aug 10): `C:\Users\nolan\Documents\Truhu\competitive landscape\website thematic research\` (`07-website-content-spec-aug14.md`, `03-truhu-website-blueprint.md`)
- Strategy sentence: `C:\Users\nolan\Documents\Truhu\strategy\12-strategy-sentence-notes-sep28.md`
- About page draft: `C:\Users\nolan\Documents\Truhu\landing page\about page - mission and values draft (Sep 28).md`
- Marketing point of view: `C:\Users\nolan\Documents\Truhu\Marketing\markdown\01-marketing-point-of-view-sep14.md`
