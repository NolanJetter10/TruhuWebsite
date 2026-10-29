import "server-only";

import { lookup } from "node:dns/promises";

/**
 * Whether a URL's host resolves, asked at most once a minute per host. On a
 * dev server, a Supabase project that no longer resolves (deleted, or a typo
 * in .env.local) counts as no Supabase, so the local fallbacks take over
 * (lib/analytics/store.ts, lib/guide/storage.ts) instead of every call failing.
 */

const probes = new Map<string, { ok: boolean; at: number }>();

export async function hostResolves(url: string, label: string) {
  const host = new URL(url).hostname;
  const probe = probes.get(host);
  if (probe && Date.now() - probe.at < 60_000) return probe.ok;
  const ok = await lookup(host).then(
    () => true,
    () => false,
  );
  if (!ok && probe?.ok !== false) {
    console.warn(`[${label}] ${host} doesn't resolve; using the local development fallback instead`);
  }
  probes.set(host, { ok, at: Date.now() });
  return ok;
}
