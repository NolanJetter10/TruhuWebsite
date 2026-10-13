import { after } from "next/server";
import { recordBooking } from "@/lib/analytics/store";
import { bookingProvider } from "@/lib/booking";
import { isValidTimeZone } from "@/lib/booking/time";
import { BookingError } from "@/lib/booking/types";
import { GET_STARTED_PAGE } from "@/lib/content";

/**
 * Makes the booking. The widget posts the chosen time and the four fields;
 * this checks them, books through the scheduler, and only then records the
 * booking against the visit that made it — so the dashboard's "booked" count
 * is bookings that exist, never form submissions that failed.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BANDS: readonly string[] = GET_STARTED_PAGE.booking.form.clientBands;

const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 6;
const hits = new Map<string, number[]>();

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > MAX_PER_WINDOW;
}

const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }

  // Honeypot: a field no person sees. Answer as if it worked.
  if (text(body.website, 200)) return Response.json({ ok: true, uid: null });

  const start = text(body.start, 40);
  const name = text(body.name, 100);
  const email = text(body.email, 200).toLowerCase();
  const agency = text(body.agency, 120);
  const clients = text(body.clients, 40);
  const timeZone = text(body.timeZone, 60);
  const context = (body.context ?? {}) as Record<string, unknown>;

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Tell us your name.";
  if (!email) errors.email = "We need an email for the invite.";
  else if (!EMAIL.test(email)) errors.email = "That doesn't look like an email address.";
  if (!agency) errors.agency = "Which agency are you with?";
  if (!BANDS.includes(clients)) errors.clients = "Pick the closest range.";
  const startAt = new Date(start);
  if (!start || Number.isNaN(startAt.getTime()) || startAt.getTime() < Date.now()) {
    errors.start = "Pick a time that's still ahead.";
  }
  if (Object.keys(errors).length) {
    return Response.json({ error: "Check the highlighted fields.", errors }, { status: 422 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip) || rateLimited(email)) {
    return Response.json(
      { error: "That's a lot of bookings in a few minutes. Try again shortly." },
      { status: 429 },
    );
  }

  const provider = bookingProvider();
  if (!provider) {
    return Response.json({ error: "Booking is offline.", code: "unavailable" }, { status: 503 });
  }

  const visitId = text(context.visitId, 40);
  const visitorId = text(context.visitorId, 40);
  const source = text(context.source, 120);
  const medium = text(context.medium, 120);
  const campaign = text(context.campaign, 160);
  const zone = isValidTimeZone(timeZone) ? timeZone : "America/New_York";

  try {
    const booking = await provider.createBooking({
      start: startAt.toISOString(),
      name,
      email,
      agency,
      clients,
      timeZone: zone,
      // Shows on the booking in Cal.com too, so the campaign is visible there.
      metadata: Object.fromEntries(
        Object.entries({ visit_id: visitId, source, medium, campaign }).filter(
          ([, value]) => value,
        ),
      ),
    });

    after(async () => {
      try {
        await recordBooking({
          uid: booking.uid,
          visit_id: UUID.test(visitId) ? visitId : null,
          visitor_id: UUID.test(visitorId) ? visitorId : null,
          start_at: booking.start,
          end_at: booking.end,
          name,
          email,
          agency,
          client_count: clients,
          time_zone: zone,
          status: "booked",
          source: source || null,
          medium: medium || null,
          campaign: campaign || null,
        });
      } catch (error) {
        console.error("[analytics] record_booking failed", error);
      }
    });

    return Response.json({ ok: true, uid: booking.uid });
  } catch (error) {
    if (error instanceof BookingError) {
      const status = error.code === "slot_taken" ? 409 : error.code === "invalid" ? 422 : 502;
      return Response.json({ error: error.message, code: error.code }, { status });
    }
    console.error("[booking] create failed", error);
    return Response.json(
      { error: "The booking did not go through. Try again in a moment.", code: "unavailable" },
      { status: 502 },
    );
  }
}
