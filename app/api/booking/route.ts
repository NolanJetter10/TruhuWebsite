import { after } from "next/server";
import { recordBooking } from "@/lib/analytics/store";
import { bookingProvider, forgetSlots } from "@/lib/booking";
import { sendBookingEmails } from "@/lib/booking/email";
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
/** Per email. Per address it's wider, since a whole office shares one. */
const MAX_PER_WINDOW = 6;
const MAX_PER_ADDRESS = 30;
const hits = new Map<string, number[]>();

function rateLimited(key: string, max = MAX_PER_WINDOW) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > max;
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
  if (rateLimited(ip, MAX_PER_ADDRESS) || rateLimited(email)) {
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
  const zone = isValidTimeZone(timeZone) ? timeZone : "America/New_York";
  // The visit and campaign behind the booking. Ids that aren't UUIDs are
  // dropped here, since the database casts them.
  const metadata = Object.fromEntries(
    Object.entries({
      visit_id: UUID.test(visitId) ? visitId : "",
      visitor_id: UUID.test(visitorId) ? visitorId : "",
      source: text(context.source, 120),
      medium: text(context.medium, 120),
      campaign: text(context.campaign, 160),
    }).filter(([, value]) => value),
  );

  try {
    const booking = await provider.createBooking({
      start: startAt.toISOString(),
      name,
      email,
      agency,
      clients,
      timeZone: zone,
      metadata,
    });
    forgetSlots();

    // Cal.com emails its own invites; the placeholder's are sent from here,
    // after the response, so the visitor never waits on the email service.
    if (provider.name === "placeholder") {
      const origin = new URL(request.url).origin;
      after(() => sendBookingEmails("booked", booking, origin));
    }

    // The placeholder scheduler has already written the row (that write is
    // its double-booking guard); a Cal.com booking is recorded here.
    if (!provider.persists) {
      after(async () => {
        try {
          await recordBooking({
            uid: booking.uid,
            visit_id: metadata.visit_id ?? null,
            visitor_id: metadata.visitor_id ?? null,
            start_at: booking.start,
            end_at: booking.end,
            name,
            email,
            agency,
            client_count: clients,
            time_zone: zone,
            status: "booked",
            source: metadata.source ?? null,
            medium: metadata.medium ?? null,
            campaign: metadata.campaign ?? null,
          });
        } catch (error) {
          console.error("[analytics] record_booking failed", error);
        }
      });
    }

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
