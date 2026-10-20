/**
 * The site log at a glance: what we're focused on, which feedback is still
 * open, the latest entries, and anything that happened without an entry.
 * How the log works: site-log/README.md.
 *
 *   node scripts/site-log.mjs                 status (the default)
 *   node scripts/site-log.mjs status --all    list done and dropped items too
 *   node scripts/site-log.mjs next            the next log ID and a blank entry
 *   node scripts/site-log.mjs snapshot        one markdown page for the Claude project
 *   node scripts/site-log.mjs snapshot --out site-log/.snapshot.md   (git-ignored)
 *
 * No dependencies. Runs from any directory.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LOG_DIR = join(ROOT, "site-log");
const CONTENT = join(ROOT, "lib", "content.ts");

const STATUSES = ["open", "partial", "check", "done", "dropped"];
const UNFINISHED = new Set(["open", "partial", "check"]);

/** From the writing standards (Truhu\00 - Writing Standards.md, sections 2
 *  and 3). Each word also matches its endings: "elevate" finds "elevated". */
const BANNED = [
  "delve", "dive into", "underscore", "bolster", "foster", "harness",
  "leverag", "unlock", "unpack", "shed light on", "pave the way", "pivotal",
  "groundbreaking", "cutting-edge", "transformative", "game-changing",
  "game-changer", "innovative", "robust", "seamless", "intricate", "holistic",
  "multifaceted", "vibrant", "testament", "realm", "tapestry", "crucial",
  "vital", "myriad", "plethora", "meticulous", "elevat", "empower",
  "streamline", "supercharg", "revolutioniz", "comprehensive", "nuanced",
  "powerful", "compelling", "exciting", "eleven at night", "built by hand",
];

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { out: { type: "string" }, all: { type: "boolean" } },
});
const command = positionals[0] ?? "status";

function read(path) {
  return readFileSync(path, "utf8").replace(/\r\n/g, "\n");
}

function git(...args) {
  try {
    return execFileSync("git", args, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trimEnd();
  } catch {
    return "";
  }
}

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* ---------------------------------------------------------------- parsing */

/** Every `### FB-nnn · title` block in FEEDBACK.md, with its fields. */
function feedbackItems() {
  const items = [];
  let item = null;
  let section = "";
  for (const line of read(join(LOG_DIR, "FEEDBACK.md")).split("\n")) {
    const heading = line.match(/^## (.+)/);
    if (heading) {
      section = heading[1].trim();
      item = null;
      continue;
    }
    const head = line.match(/^### (FB-\d+)\s*[·:\-–—]\s*(.+)/);
    if (head) {
      item = { id: head[1], title: head[2].trim(), section, from: "", status: "?", log: "" };
      items.push(item);
      continue;
    }
    const field = item && line.match(/^- (From|Status|Log):\s*(.*)$/);
    if (field) item[field[1].toLowerCase()] = field[2].trim();
  }
  for (const it of items) {
    const word = it.status.toLowerCase().match(/[a-z]+/);
    it.status = word && STATUSES.includes(word[0]) ? word[0] : `?${it.status}`;
  }
  return items;
}

/** Every `## L-nnn · ...` entry in LOG.md, with its raw text. */
function logEntries(text) {
  const entries = [];
  let entry = null;
  for (const line of text.split("\n")) {
    const head = line.match(/^## (L-(\d+))\b\s*[·:\-–—]?\s*(.*)$/);
    if (head) {
      entry = { id: head[1], n: Number(head[2]), title: head[3].trim(), lines: [line] };
      entries.push(entry);
    } else if (/^## /.test(line) || /^---\s*$/.test(line)) {
      entry = null;
    } else if (entry) {
      entry.lines.push(line);
    }
  }
  for (const e of entries) e.text = e.lines.join("\n").trimEnd();
  return entries;
}

function nextId(entries) {
  const n = Math.max(0, ...entries.map((e) => e.n)) + 1;
  return `L-${String(n).padStart(3, "0")}`;
}

/** The lines under `## Now` in DIRECTION.md. */
function focus() {
  const out = [];
  let inside = false;
  for (const line of read(join(LOG_DIR, "DIRECTION.md")).split("\n")) {
    if (/^## /.test(line)) inside = /^## Now\b/.test(line);
    else if (inside && /^\s*[-*\d]/.test(line)) out.push(line.trim());
  }
  return out;
}

/** Commits since the log start that no entry names by hash and whose message
 *  carries no `L-nnn` ID. */
function unloggedCommits(logText) {
  const start = logText.match(/Log start:\s*`?([0-9a-f]{7,40})/)?.[1];
  if (!start) return { start: null, commits: [] };
  const raw = git(
    "log",
    "--no-merges",
    "--format=%H%x1f%h%x1f%cs%x1f%s%x1f%b%x1e",
    `${start}..HEAD`,
  );
  const named = logText.match(/\b[0-9a-f]{7,40}\b/g) ?? [];
  const commits = raw
    .split("\x1e")
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => {
      const [full, short, date, subject, body = ""] = r.split("\x1f");
      return { full, short, date, subject, body };
    })
    .filter(
      (c) =>
        !/\bL-\d+\b/.test(`${c.subject}\n${c.body}`) &&
        !named.some((h) => c.full.startsWith(h)),
    );
  return { start, commits };
}

function uncommitted() {
  return git("status", "--porcelain")
    .split("\n")
    .filter((l) => l.trim());
}

/** Banned words in lib/content.ts, skipping comments and customer quotes. */
function bannedWords() {
  let text;
  try {
    text = read(CONTENT);
  } catch {
    return [];
  }
  const patterns = BANNED.map((w) => ({
    word: w,
    re: new RegExp(`\\b${w.replace(/[-]/g, "\\-").replace(/ /g, "\\s+")}[a-z]*`, "i"),
  }));
  const hits = [];
  let inQuotes = false;
  text.split("\n").forEach((line, i) => {
    if (/^export const QUOTES\b/.test(line)) inQuotes = true;
    if (inQuotes) {
      if (/^\]\s*as const/.test(line)) inQuotes = false;
      return;
    }
    const t = line.trim();
    if (t.startsWith("*") || t.startsWith("/*") || t.startsWith("//")) return;
    for (const { re } of patterns) {
      const m = line.match(re);
      if (m) hits.push({ line: i + 1, word: m[0], text: t });
    }
  });
  return hits;
}

/* ---------------------------------------------------------------- output */

function countLine(items) {
  const counts = STATUSES.map((s) => `${items.filter((i) => i.status === s).length} ${s}`);
  const odd = items.filter((i) => i.status.startsWith("?")).length;
  if (odd) counts.push(`${odd} with an unknown status`);
  return `${items.length} items: ${counts.join(", ")}`;
}

function clip(s, n) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function head() {
  const branch = git("rev-parse", "--abbrev-ref", "HEAD") || "?";
  const sha = git("rev-parse", "--short", "HEAD") || "?";
  return { branch, sha };
}

function status() {
  const items = feedbackItems();
  const logText = read(join(LOG_DIR, "LOG.md"));
  const entries = logEntries(logText);
  const { start, commits } = unloggedCommits(logText);
  const dirty = uncommitted();
  const words = bannedWords();
  const { branch, sha } = head();
  const p = (s = "") => console.log(s);

  p(`Site log · ${today()} · ${branch} @ ${sha}`);
  p();
  p("Now (DIRECTION.md)");
  const now = focus();
  if (now.length) now.forEach((l) => p(`  ${l}`));
  else p("  (nothing under Now)");
  p();
  p(`Feedback: ${countLine(items)}`);
  const shown = values.all ? [...STATUSES, "?"] : [...UNFINISHED, "?"];
  for (const s of shown) {
    const group = items.filter((i) => (s === "?" ? i.status.startsWith("?") : i.status === s));
    if (!group.length) continue;
    p(`  ${s === "?" ? "unknown status" : s}`);
    for (const i of group) p(`    ${i.id}  ${clip(i.title, 72)}  (${i.from.split(" · ").slice(0, 2).join(" · ")})`);
  }
  p();
  p("Latest log entries");
  for (const e of entries.slice(-5)) p(`  ${clip(`${e.id} · ${e.title}`, 96)}`);
  p(`  Next ID: ${nextId(entries)}`);
  p();
  if (!start) p("Commits with no log entry: no 'Log start:' line in LOG.md");
  else if (!commits.length) p(`Commits with no log entry (since ${start}): none`);
  else {
    p(`Commits with no log entry (since ${start}): ${commits.length}`);
    for (const c of commits) p(`  ${c.short} ${c.date} ${clip(c.subject, 80)}`);
  }
  p();
  p(`Uncommitted files: ${dirty.length || "none"}`);
  for (const l of dirty.slice(0, 20)) p(`  ${l}`);
  if (dirty.length > 20) p(`  …and ${dirty.length - 20} more`);
  p();
  p(`Banned words in lib/content.ts: ${words.length || "none"}`);
  for (const w of words) p(`  ${String(w.line).padStart(5)}  ${w.word.padEnd(14)} ${clip(w.text, 70)}`);
}

function next() {
  const entries = logEntries(read(join(LOG_DIR, "LOG.md")));
  const id = nextId(entries);
  console.log(`## ${id} · ${today()} · <who>
- What:
- Why:
- Feedback: FB-000 (done)
- Files:
- Commits: the commit tagged ${id}
- Check:
- Next:`);
}

function snapshot() {
  const items = feedbackItems();
  const logText = read(join(LOG_DIR, "LOG.md"));
  const entries = logEntries(logText);
  const { start, commits } = unloggedCommits(logText);
  const dirty = uncommitted();
  const words = bannedWords();
  const { branch, sha } = head();
  const demote = (text) => text.replace(/^(#+) /gm, "$1# ");
  const cell = (s) => s.replace(/\|/g, "\\|");

  const direction = read(join(LOG_DIR, "DIRECTION.md")).replace(/^# .*\n+/, "");
  const out = [];
  out.push("# Site log snapshot");
  out.push("");
  out.push(
    `Generated ${today()} from the TruhuWebsite repo at \`${branch} @ ${sha}\` with \`node scripts/site-log.mjs snapshot\`. ` +
      "The live files are in `site-log/` in the repo on Nolan's PC (`C:\\Users\\nolan\\Documents\\GitHub\\TruhuWebsite\\site-log\\`). " +
      "This copy goes stale as soon as anything changes there; when the PC is linked, read the repo instead.",
  );
  out.push("");
  out.push("## Direction");
  out.push("");
  out.push(demote(direction).trim());
  out.push("");
  out.push("## Feedback status");
  out.push("");
  out.push(countLine(items));
  out.push("");
  out.push("| ID | Item | From | Status | Log |");
  out.push("|---|---|---|---|---|");
  for (const i of items) {
    out.push(`| ${i.id} | ${cell(i.title)} | ${cell(i.from.split(" · ").slice(0, 2).join(" · "))} | ${i.status} | ${cell(i.log)} |`);
  }
  out.push("");
  out.push(`## Recent log entries (last ${Math.min(8, entries.length)} of ${entries.length})`);
  out.push("");
  out.push(entries.slice(-8).map((e) => demote(e.text)).join("\n\n"));
  out.push("");
  out.push("## Loose ends");
  out.push("");
  out.push(
    commits.length
      ? `- Commits with no log entry (since ${start}): ${commits.map((c) => `\`${c.short}\` ${c.subject}`).join("; ")}`
      : "- Commits with no log entry: none",
  );
  out.push(
    dirty.length
      ? `- Uncommitted files (${dirty.length}): ${dirty.map((l) => `\`${l.trim()}\``).join(", ")}`
      : "- Uncommitted files: none",
  );
  out.push(
    words.length
      ? `- Banned words in lib/content.ts: ${words.map((w) => `line ${w.line} "${w.word}"`).join(", ")}`
      : "- Banned words in lib/content.ts: none",
  );
  const page = `${out.join("\n")}\n`;
  if (values.out) {
    writeFileSync(resolve(values.out), page);
    console.log(`Wrote ${resolve(values.out)}`);
  } else {
    process.stdout.write(page);
  }
}

const commands = { status, next, snapshot };
if (!commands[command]) {
  console.error(`Unknown command "${command}". Use status, next or snapshot.`);
  process.exit(1);
}
commands[command]();
