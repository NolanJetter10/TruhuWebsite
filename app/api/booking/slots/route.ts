import type { NextRequest } from "next/server";
import { bookingProvider } from "@/lib/booking";
import { addDays, isValidTimeZone } from "@/lib/booking/time";
import type { SlotsByDay } from "@/lib/booking/types";

/**
 * Open times for the booking widget, grouped by date in the visitor's zone.
 *
 * Results are held for 30 seconds per (range, zone). That keeps a busy page
 * well inside Cal.com's per-key rate limit, and a slot that goes in the
 * meantime is caught when the booking is made, not here.
 */

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TTL_MS = 30_000;
const cache = new Map<string, { at: number; days: SlotsByDay }>();

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const timeZone = params.get("tz") ?? "America/New_York";

  if (!DATE.test(from) || !DATE.test(to) || to < from || addDays(from, 62) < to) {
    return Response.json({ error: "Bad date range." }, { status: 400 });
  }
  if (!isValidTimeZone(timeZone)) {
    return Response.json({ error: "Unknown time zone." }, { status: 400 });
  }

  const provider = bookingProvider();
  if (!provider) return Response.json({ available: false }, { status: 503 });

  const key = `${provider.name}|${from}|${to}|${timeZone}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return Response.json({ provider: provider.name, timeZone, days: hit.days });
  }

  try {
    // A day either side, then trimmed to the visitor's dates: the scheduler's
    // own day boundaries may sit in another zone.
    const wide = await provider.getSlots(addDays(from, -1), addDays(to, 1), timeZone);
    const days: SlotsByDay = {};
    for (const [day, slots] of Object.entries(wide)) {
      if (day >= from && day <= to && slots.length) days[day] = slots;
    }
    cache.set(key, { at: Date.now(), days });
    if (cache.size > 500) cache.clear();
    return Response.json({ provider: provider.name, timeZone, days });
  } catch (error) {
    console.error("[booking] slots failed", error);
    return Response.json({ error: "Times could not be loaded." }, { status: 502 });
  }
}
