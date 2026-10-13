import type { NextRequest } from "next/server";
import { isRange, rangeStart, summarize, type RangeKey } from "@/lib/aggregate";
import { COOKIE, isSignedIn } from "@/lib/auth";
import { backend, snapshot } from "@/lib/store";

/** Everything the dashboard draws, for one range, campaign and time zone. */
export async function GET(request: NextRequest) {
  if (!(await isSignedIn(request.cookies.get(COOKIE)?.value))) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const requested = params.get("range");
  const range: RangeKey = isRange(requested) ? requested : "7d";
  const campaign = params.get("campaign") || null;
  let tz = params.get("tz") || "America/New_York";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
  } catch {
    tz = "America/New_York";
  }

  try {
    const rows = await snapshot(rangeStart(range, tz));
    const summary = summarize(rows, { range, tz, campaign });
    return Response.json(
      { ...summary, backend: backend() },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("[dashboard] summary failed", error);
    return Response.json({ error: explain(error) }, { status: 502 });
  }
}

/** Turn a setup mistake into the step that fixes it. */
function explain(error: unknown) {
  const text = error instanceof Error ? error.message : String(error);
  if (/PGRST20[25]|Could not find the (table|function)|does not exist/i.test(text)) {
    return "Supabase is connected, but the tables aren't there yet. Run supabase/schema.sql in Supabase's SQL Editor.";
  }
  if (/\b401\b|Invalid API key|No API key|Unauthorized/i.test(text)) {
    return "Supabase rejected the key. Check SUPABASE_SECRET_KEY: it should be the secret key (starts with sb_secret_), not the publishable one.";
  }
  if (/fetch failed|ENOTFOUND|getaddrinfo|Invalid URL/i.test(text)) {
    return "Couldn't reach Supabase. Check SUPABASE_URL: it should look like https://abcdefghijklmnop.supabase.co";
  }
  return text;
}
