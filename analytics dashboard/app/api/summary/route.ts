import type { NextRequest } from "next/server";
import { isRange, rangeStart, summarize, type RangeKey } from "@/lib/aggregate";
import { COOKIE, isSignedIn } from "@/lib/auth";
import { snapshot } from "@/lib/store";

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
    return Response.json(summary, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[dashboard] summary failed", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Summary failed." },
      { status: 502 },
    );
  }
}
