# Change log

Append-only, newest entry at the bottom. The template and rules are in `README.md`.

Log start: d3a428f (Aug 14, 2026). Every commit after it is either named in an entry here or carries an `L-` ID in its message. `node scripts/site-log.mjs` lists any that aren't.

---

## L-001 · 2026-10-06 · Nolan with Claude (backfilled Oct 20)
- What: Committed the shared working tree: the About, FAQ and Technology pages, the product demos (intake pipeline, document flow, phone broadcast, workforce network and others), the customer story reel and quote carousel, and section eyebrows removed. By this commit the Ridgeline examples were replaced by Sample Company and other invented clients, the problem-card tags landed square, "sample data" was gone from the step-by-step, /advisor called its outputs "Benefits chatbot", "Narrated video" and "Digital flipbook", and the renewal calendar and "Where TruHu sits" were off the home page.
- Why: The commit landed about three hours after the Oct 6 team feedback was filed. It brought in weeks of uncommitted work, so this entry can't say which changes answered the feedback and which came earlier.
- Feedback: FB-001 (check), FB-002 (done), FB-003 (partial), FB-005 (partial), FB-019 (done), FB-021 (done), FB-022 (check), FB-025, FB-031, FB-032, FB-043 (done), FB-035, FB-047 (check)
- Files: many; see `git show --stat 8e6adad`
- Commits: 8e6adad
- Check: backfilled from the diff and the code on Oct 20. Not seen rendered.
- Next: none

## L-002 · 2026-10-13 · Nolan with Claude (backfilled Oct 20)
- What: The /get-started booking page with first-party funnel tracking and a live analytics dashboard; a placeholder scheduler (Supabase and Resend) until Cal.com is connected; Microsoft Clarity and GA4 behind a consent banner for Europe; a flip grid on the /get-started hero; Vercel deploy author fix; a dashboard stream fix.
- Why: Not recorded.
- Feedback: none
- Files: see the commits
- Commits: db6311e, 4076812, a1b3601, 1ccc077, 4e42617, 4ff43cf, 0248d50
- Check: backfilled from commit messages only.
- Next: none

## L-003 · 2026-10-20 · Claude (project chat)
- What: Set up this log: `site-log/` (README, DIRECTION, FEEDBACK with 48 items, LOG, and `sources/` with the Oct 6 feedback), `scripts/site-log.mjs` with `npm run log`, and the logging rule in AGENTS.md. Added a pointer doc and a snapshot to the Claude project "truhu website", and a pointer in the Truhu folder's CLAUDE.md.
- Why: Nolan wants every change tied to the advice it answers, so work in VS Code and talk in the Claude project share one record.
- Feedback: none changed. Statuses for all 48 items were first set here, from a code read at 0248d50.
- Files: site-log/*, scripts/site-log.mjs, package.json, AGENTS.md, .gitignore
- Commits: the commits tagged L-003
- Check: ran `node scripts/site-log.mjs` and `node scripts/site-log.mjs snapshot` against the repo.
- Next: Nolan to confirm the first round under "Now" in DIRECTION.md.

## L-004 · 2026-10-20 · Claude Code (VS Code)
- What: The /advisor outputs tour ("Bring the premium experience…") shows real deliverables instead of drawn mock-ups: the ones TruHu built for Kindlerye Baking Co., the invented employer from the video work. The guide tab scrolls the guide's real pages 1–23, with a contents rail on wide screens and a swipe strip on phones. The flipbook, website, chatbot, narrated-video and flyer tabs each show a capture of the live published page; clicking swaps in the live page itself, embedded from advisor-api.truhu.dev, so visitors can turn pages, open the Benefits Assistant, or press "Explain my Guide" to hear the narration. Below 1024px the capture sits on a phone and opens the live page in a new tab. The layout gives the deliverable the full width (1256×600 at desktop); each tab's title, blurb and three bullets became one paragraph, with a one-line "what to try" under the stage. Also: `scripts/browse.mjs` takes `--scale` for 2× captures.
- Why: Nolan, Oct 20: use the real assets in place of the made-up visuals, prefer something interactive (flip a flipbook, scroll a guide, hear a narration), and give the deliverable more room and the text less.
- Feedback: FB-010 (partial), FB-012 (partial), FB-015 (partial), FB-016 (partial), FB-048 (partial)
- Files: components/demos/OutputShowcase.tsx, lib/content.ts, app/advisor/page.tsx, public/images/outputs/*, scripts/browse.mjs
- Commits: the commit tagged L-004
- Check: scripts/browse.mjs screenshots at 1440, 1024 and 390 wide, every tab; clicked the flipbook and website captures and confirmed the live page replaced them at the right scale; jumped the guide to Medical (counter read "Page 8 of 34"); console clean; tsc and eslint clean for the changed files.
- Next: Nolan to decide whether advisor-api.truhu.dev is fine to embed from the public site. Kindlerye content to fix in the platform before this ships: page 10 of the guide reads "No gender-affirming benefits were found in the provided source content…"; the site and flyer say 2026 while the guide says Nov 2026–Nov 2027; the flyer is three pages, has no QR code, and page 3 ends at an empty "Plan Comparison" heading. Re-capture the posters (public/images/outputs) after any regeneration.
