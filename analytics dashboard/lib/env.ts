import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Environment, with one convenience while this app lives inside the website's
 * repo: the Supabase keys are also read from the website's .env.local, so they
 * are pasted in one place, not two. This app's own environment always wins,
 * and once the folder is moved to its own repo there is no parent file and
 * this does nothing.
 *
 * Read per call (with a few seconds' cache), so adding the keys takes effect
 * without restarting the dashboard.
 */

const SHARED = new Set([
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  // Only used to link out to the tools from the header.
  "NEXT_PUBLIC_CLARITY_ID",
  "NEXT_PUBLIC_GA_ID",
]);
const TTL_MS = 3000;
let cache: { at: number; values: Record<string, string> } | null = null;

function parse(text: string, into: Record<string, string>) {
  for (const raw of text.split(/\r?\n/)) {
    const match = raw.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match || match[1] in into) continue;
    let value = match[2].trim();
    const quoted = value.match(/^(['"])(.*)\1$/);
    value = quoted ? quoted[2] : value.replace(/\s+#.*$/, "");
    into[match[1]] = value;
  }
}

function websiteEnv() {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.values;
  const values: Record<string, string> = {};
  for (const name of [".env.local", ".env"]) {
    try {
      parse(readFileSync(path.join(/* turbopackIgnore: true */ process.cwd(), "..", name), "utf8"), values);
    } catch {
      // No such file: nothing to add.
    }
  }
  cache = { at: Date.now(), values };
  return values;
}

export function env(name: string): string | undefined {
  const own = process.env[name];
  if (own) return own;
  return SHARED.has(name) ? websiteEnv()[name] || undefined : undefined;
}
