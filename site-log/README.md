# Site log

The record of what changes on truhu.ai, why, and which piece of advice each change answers. Nolan codes in VS Code and talks through progress in the Claude project "truhu website"; this folder keeps the two in step. Every agent working in this repo uses it (see AGENTS.md).

| File | What it holds |
|---|---|
| `DIRECTION.md` | What the site is for, what we're working on now, decisions, rules for copy, open questions. Read it first. |
| `FEEDBACK.md` | Every piece of advice, one item each (`FB-012`): who said it, their words, its status, where it stands in the code, and the log entries that touched it. |
| `LOG.md` | Append-only record of work: what changed, why, which FB items it answers, the commits. |
| `sources/` | Full originals of feedback, as received. |

Where things stand, in one command:

```bash
node scripts/site-log.mjs            # or: npm run log
node scripts/site-log.mjs next       # the next log ID and a blank entry
node scripts/site-log.mjs snapshot   # everything above as one page, for the Claude project
```

`status` (the default) prints the focus from DIRECTION.md, open items by status, the latest entries, commits that no entry covers yet, uncommitted files, and banned words in `lib/content.ts`.

## After each piece of work

1. Add an entry at the bottom of `LOG.md` with the next ID. One entry per piece of work, not per file.
2. For every FB item the work touches, update its Status and Where lines in `FEEDBACK.md` and add the log ID to its Log line.
3. If a decision was made, add a dated line to Decisions in `DIRECTION.md`. If the focus moved, update Now.
4. Commit the site-log files with the code, and put the log ID in the commit message: `Home: say chatbot instead of Q&A (L-014)`.

Entry template:

```markdown
## L-014 · 2026-10-21 · Claude Code (VS Code)
- What: The home page says "chatbot" instead of "Q&A", and How-it-works lists a flipbook.
- Why: Xander, Oct 6: "Q&A" could read as a static FAQ, and the deliverables should be symmetrical.
- Feedback: FB-003 (done), FB-004 (done)
- Files: lib/content.ts, components/demos/DocumentFlow.tsx
- Commits: the commit tagged L-014
- Check: home page screenshots at 1440 and 390 wide with scripts/browse.mjs; no console errors
- Next: none
```

Who: `Nolan`, `Claude Code (VS Code)`, `Codex`, `Copilot`, `Claude (project chat)`, or whoever did it.

## Rules

- `LOG.md` is append-only. Fix a wrong entry with a new one; only typos get edited in place.
- Other sessions write these files too. Re-read right before editing and make targeted edits, never whole-file rewrites.
- If two sessions take the same log ID, the later one renumbers.
- `done` needs evidence in the entry: what changed and how it was checked. If you couldn't look at the page, use `check`.
- `dropped` needs a reason and who decided. Never delete an FB item.
- Nolan's own commits from VS Code don't need an entry at commit time. `node scripts/site-log.mjs` lists commits no entry covers; the next agent or chat session writes one entry for them (ask Nolan the why if it isn't obvious).

## New advice

When someone gives feedback (Slack, a call, a doc, a comment):

1. Save the original, word for word, in `sources/YYYY-MM-DD-<who>.md`. In a Claude project chat, also save it under `claude/landing-page/feedback/` in the project.
2. Add one FB item per distinct point to `FEEDBACK.md`, quoting the person, with status `open`.
3. Add a line to LOG.md saying the advice was logged (no commits needed).

## The Claude project "truhu website"

Chats in the project read this folder through Nolan's linked PC (`C:\Users\nolan\Documents\GitHub\TruhuWebsite\site-log\`). At the start of a chat about the site: read DIRECTION.md, run `node scripts/site-log.mjs`, and read the recent LOG entries. Decisions made in chat go into DIRECTION.md here, not only into the conversation.

When a chat session changes anything here, it ends by running `node scripts/site-log.mjs snapshot --out site-log/.snapshot.md` (git-ignored) and saving that file to the project doc `claude/site-log/snapshot.md`, so the project still has the picture when the PC is off. The project doc `claude/site-log/00-how-we-track-changes.md` explains the same setup from the project's side.
