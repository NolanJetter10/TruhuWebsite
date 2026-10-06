<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Shared working tree

Several agent sessions edit this checkout at the same time, all on `main`, with no worktrees, so every change shows up live on one dev server. Uncommitted changes you didn't make are another session's work in progress, not leftovers. Don't clean them up, revert them, or "fix" them.

## Dev server

- One shared `next dev` runs at http://localhost:3000. Don't start a second one. Check it first with `curl -sI http://localhost:3000`.
- If it's down, start it detached so it outlives your session:
  `Start-Process -FilePath cmd.exe -ArgumentList '/d /c npm run dev -- --port 3000 > .dev-server.log 2>&1' -WorkingDirectory <repo root> -WindowStyle Hidden`
- Its output, including compile errors and forwarded browser console errors, goes to `.dev-server.log`. `.next/dev/lock` has its PID.
- Don't stop or restart it, or delete `.next/`, unless it's actually wedged. Doing so cuts off every other session and the browser tab Nolan is watching.
- To check your work, load the page and read the log instead of running `next build`. Two builds at once collide in `.next/`.

## Looking at pages

- Never use Claude in Chrome (`mcp__claude-in-chrome__*`) here. It drives Nolan's real browser, and every call stops to ask him, which pops up a notification. One session raised nine in two minutes.
- Use `node scripts/browse.mjs` instead. It runs a headless Chrome of its own and needs no approval. It takes screenshots (whole page, viewport, or one element), runs JavaScript in the page, samples an animation over several frames, and reports console errors. Its header lists the options.
- Pass pages without the leading slash (`advisor`, not `/advisor`), because Git Bash rewrites `/advisor` into a file path. Save screenshots to your scratchpad, then open them with Read.
- Example: `node scripts/browse.mjs advisor --selector "#faq" --out <scratchpad>/faq.png`

## Editing

- Re-read a file right before you change it, since another session may have edited it since you last looked. Prefer targeted edits over rewriting a whole file, because a full rewrite drops whatever someone else added in between.
- Keep every save in a working state. A syntax error breaks the page for every session.
- Lint or type errors in files you didn't touch belong to someone else. Leave them alone.

## Git

- Stage only the files you changed, by name: `git add path/a.tsx path/b.ts`. Never use `git add -A`, `git add .`, or `git commit -a`, because they sweep up other sessions' half-finished work. If a file you changed also holds someone else's edits, committing it together is fine.
- Never run commands that move or discard the working tree: `stash`, `checkout`, `switch`, `restore`, `reset --hard`, `clean`, `pull`, `merge`, `rebase`. They silently destroy or yank away other sessions' uncommitted work. To undo your own change, edit it back by hand.
- If git reports `index.lock` exists, another session is mid-commit. Wait a few seconds and retry, and don't delete the lock.
