import "server-only";

import {
  BookingError,
  type Booking,
  type BookingProvider,
  type BookingRequest,
  type SlotsByDay,
} from "./types";

/**
 * Cal.com as the scheduling engine behind our own booking UI (API v2).
 *
 * Cal.com owns the hard parts: it reads Bryan's connected Google or Outlook
 * calendar for conflicts, applies his working hours and buffers, writes the
 * event to his calendar, sends both sides the invite with the video link, and
 * hosts the reschedule and cancel pages. The page only ever asks it for open
 * times and hands it a booking.
 *
 * Each endpoint is pinned to an API version: Cal.com versions per resource, and
 * an unpinned call silently gets whatever the default is that month.
 */

const API = "https://api.cal.com/v2";
const SLOTS_VERSION = "2024-09-04";
const BOOKINGS_VERSION = "2026-02-25";

/** Read per call, so setting the variables needs no restart. */
function config() {
  return {
    key: process.env.CAL_API_KEY ?? "",
    eventTypeId: Number(process.env.CAL_EVENT_TYPE_ID),
    /** Where Cal.com's own reschedule and cancel pages live. */
    publicBase: (process.env.CAL_PUBLIC_URL ?? "https://cal.com").replace(/\/+$/, ""),
    /** Slugs of the two booking questions added to the event type in Cal.com. */
    fieldAgency: process.env.CAL_FIELD_AGENCY ?? "agency",
    fieldClients: process.env.CAL_FIELD_CLIENTS ?? "clients",
  };
}

export function calConfigured() {
  const { key, eventTypeId } = config();
  return Boolean(key && Number.isFinite(eventTypeId) && eventTypeId > 0);
}

function headers(version: string) {
  return {
    authorization: `Bearer ${config().key}`,
    "cal-api-version": version,
    "content-type": "application/json",
  };
}

type CalBooking = {
  uid: string;
  start: string;
  end: string;
  status: string;
  location?: string;
  meetingUrl?: string;
  attendees?: { name: string; email: string; timeZone: string }[];
  bookingFieldsResponses?: Record<string, unknown>;
};

function toBooking(data: CalBooking): Booking {
  const { fieldAgency, fieldClients, publicBase } = config();
  const attendee = data.attendees?.[0];
  const responses = data.bookingFieldsResponses ?? {};
  const location = data.location ?? data.meetingUrl;
  const status = (["accepted", "pending", "cancelled", "rejected"] as const).find(
    (s) => s === data.status,
  );
  return {
    uid: data.uid,
    start: new Date(data.start).toISOString(),
    end: new Date(data.end).toISOString(),
    status: status ?? "accepted",
    attendee: {
      name: attendee?.name ?? "",
      email: attendee?.email ?? "",
      timeZone: attendee?.timeZone ?? "America/New_York",
    },
    agency:
      typeof responses[fieldAgency] === "string" ? (responses[fieldAgency] as string) : undefined,
    clients: responses[fieldClients] != null ? String(responses[fieldClients]) : undefined,
    meetingUrl: location && /^https?:\/\//.test(location) ? location : undefined,
    rescheduleUrl: `${publicBase}/reschedule/${data.uid}`,
    cancelUrl: `${publicBase}/booking/${data.uid}?cancel=true`,
    invites: true,
  };
}

async function failure(res: Response, fallback: string): Promise<never> {
  const text = await res.text().catch(() => "");
  console.error(`[booking] cal.com ${res.status}: ${text.slice(0, 500)}`);
  // Cal.com answers a slot that was taken in the meantime with a 400 naming
  // the conflict; treat any of those as "pick another time".
  if (
    res.status === 409 ||
    /no available users|not available|already has booking|conflict|booking limit/i.test(text)
  ) {
    throw new BookingError("That time was just taken. Pick another one.", "slot_taken");
  }
  if (res.status === 400) throw new BookingError(fallback, "invalid");
  throw new BookingError(fallback, "unavailable");
}

export const calProvider: BookingProvider = {
  name: "cal",
  persists: false,

  async getSlots(from, to, timeZone) {
    const url = new URL(`${API}/slots`);
    url.searchParams.set("eventTypeId", String(config().eventTypeId));
    url.searchParams.set("start", from);
    url.searchParams.set("end", to);
    url.searchParams.set("timeZone", timeZone);
    const res = await fetch(url, { headers: headers(SLOTS_VERSION), cache: "no-store" });
    if (!res.ok) return failure(res, "Times could not be loaded.");
    const body = (await res.json()) as { data?: Record<string, { start: string }[]> };
    const days: SlotsByDay = {};
    for (const [day, slots] of Object.entries(body.data ?? {})) {
      days[day] = slots.map((slot) => new Date(slot.start).toISOString());
    }
    return days;
  },

  async createBooking(request: BookingRequest) {
    const res = await fetch(`${API}/bookings`, {
      method: "POST",
      headers: headers(BOOKINGS_VERSION),
      cache: "no-store",
      body: JSON.stringify({
        start: request.start,
        eventTypeId: config().eventTypeId,
        attendee: {
          name: request.name,
          email: request.email,
          timeZone: request.timeZone,
          language: "en",
        },
        bookingFieldsResponses: {
          [config().fieldAgency]: request.agency,
          [config().fieldClients]: request.clients,
        },
        metadata: request.metadata,
      }),
    });
    if (!res.ok) return failure(res, "The booking did not go through.");
    const body = (await res.json()) as { data: CalBooking | CalBooking[] };
    const data = Array.isArray(body.data) ? body.data[0] : body.data;
    return toBooking(data);
  },

  async getBooking(uid) {
    const res = await fetch(`${API}/bookings/${encodeURIComponent(uid)}`, {
      headers: headers(BOOKINGS_VERSION),
      cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) return failure(res, "The booking could not be loaded.");
    const body = (await res.json()) as { data: CalBooking };
    return toBooking(body.data);
  },
};
