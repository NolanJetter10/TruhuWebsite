import type { NextRequest } from "next/server";
import { bookingProvider, openSlots } from "@/lib/booking";
import { addDays, isValidTimeZone } from "@/lib/booking/time";
import type { SlotsByDay } from "@/lib/booking/types";

/** Open times for the booking widget, grouped by date in the visitor's zone. */

const DATE = /^\d{4}-\d{2}-\d{2}$/;

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

  try {
    // A day either side, then trimmed to the visitor's dates: the scheduler's
    // own day boundaries may sit in another zone.
    const wide = await openSlots(provider, addDays(from, -1), addDays(to, 1), timeZone);
    const days: SlotsByDay = {};
    for (const [day, slots] of Object.entries(wide)) {
      if (day >= from && day <= to && slots.length) days[day] = slots;
    }
    return Response.json(
      { provider: provider.name, timeZone, days },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("[booking] slots failed", error);
    return Response.json({ error: "Times could not be loaded." }, { status: 502 });
  }
}
