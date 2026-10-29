import "server-only";

import {
  activeBookings,
  findBooking,
  recordBooking,
  SlotConflictError,
  updateBookingStatus,
  type BookingRecord,
} from "@/lib/analytics/store";
import { emailConfigured } from "./email";
import { addDays, dateKey, weekday, zonedToUtc } from "./time";
import { openBooking, sealBooking } from "./token";
import { BookingError, type Booking, type BookingProvider, type SlotsByDay } from "./types";

/**
 * The scheduler until Bryan's calendar is connected through Cal.com. It
 * behaves like the real thing from the visitor's side:
 *
 * - offers Bryan's working hours below, minus the notice period;
 * - stores every booking in the analytics database, so a taken time
 *   disappears for everyone and shows on the dashboard straight away;
 * - refuses a double booking — checked before writing, and guaranteed by the
 *   database's one-booking-per-start-time index for two people racing;
 * - supports reschedule and cancel through /BryanKleppe/manage/[uid].
 *
 * Each uid is the booking itself, encrypted (./token.ts), and a move or a
 * cancellation gives it a new one. So a booking shows correctly from its link
 * even on a server that never saw it, as happens in production without a
 * database, where each server keeps its own file.
 *
 * - emails the booker a real calendar invitation, and the team a heads-up,
 *   for every booking, move and cancellation (see ./email.ts).
 *
 * What it doesn't do is read or write Bryan's own calendar, so it can't see
 * his other meetings, and there's no Zoom link unless BOOKING_MEETING_URL
 * sets a standing one. Setting the Cal.com variables switches every new
 * booking over to the real calendar; nothing else changes.
 */

export const HOURS = {
  zone: "America/New_York",
  /** 1 = Monday … 5 = Friday. */
  weekdays: [1, 2, 3, 4, 5],
  /** First and last start times, in minutes after midnight. */
  firstStart: 9 * 60,
  lastStart: 16 * 60 + 30,
  every: 30,
  meetingMinutes: 10,
  noticeMs: 3 * 60 * 60_000,
  horizonDays: 60,
} as const;

const MEETING_MS = HOURS.meetingMinutes * 60_000;

/** Every start time the grid offers on one of Bryan's days. */
function startsOn(hostDay: string) {
  if (!(HOURS.weekdays as readonly number[]).includes(weekday(hostDay))) return [];
  const [y, m, d] = hostDay.split("-").map(Number);
  const starts: Date[] = [];
  for (let min = HOURS.firstStart; min <= HOURS.lastStart; min += HOURS.every) {
    starts.push(zonedToUtc(y, m, d, Math.floor(min / 60), min % 60, HOURS.zone));
  }
  return starts;
}

function inWindow(start: Date) {
  const t = start.getTime();
  const now = Date.now();
  return t >= now + HOURS.noticeMs && t <= now + HOURS.horizonDays * 86_400_000;
}

function overlaps(start: Date, booked: BookingRecord[]) {
  const s = start.getTime();
  const e = s + MEETING_MS;
  return booked.some((b) => {
    const bs = Date.parse(b.start_at);
    const be = b.end_at ? Date.parse(b.end_at) : bs + MEETING_MS;
    return s < be && bs < e;
  });
}

/** On the grid, inside the booking window, and not already taken. */
async function isOpen(start: Date, ignoreUid?: string) {
  if (Number.isNaN(start.getTime()) || !inWindow(start)) return false;
  const onGrid = startsOn(dateKey(start, HOURS.zone)).some(
    (s) => s.getTime() === start.getTime(),
  );
  if (!onGrid) return false;
  const around = await activeBookings(
    new Date(start.getTime() - 2 * 60 * 60_000).toISOString(),
    new Date(start.getTime() + 2 * 60 * 60_000).toISOString(),
  );
  return !overlaps(
    start,
    around.filter((b) => b.uid !== ignoreUid),
  );
}

function toBooking(row: BookingRecord): Booking {
  return {
    uid: row.uid,
    start: row.start_at,
    end: row.end_at ?? new Date(Date.parse(row.start_at) + MEETING_MS).toISOString(),
    status: row.status === "cancelled" ? "cancelled" : "accepted",
    attendee: { name: row.name, email: row.email, timeZone: row.time_zone ?? HOURS.zone },
    agency: row.agency ?? undefined,
    clients: row.client_count ?? undefined,
    meetingUrl: process.env.BOOKING_MEETING_URL || undefined,
    rescheduleUrl: `/BryanKleppe/manage/${row.uid}`,
    cancelUrl: `/BryanKleppe/manage/${row.uid}?cancel=1`,
    invites: emailConfigured(),
  };
}

const taken = () =>
  new BookingError("That time was just taken. Pick another one.", "slot_taken");

/** From the store, or failing that from the uid itself. */
const lookup = async (uid: string) => (await findBooking(uid)) ?? openBooking(uid);

export const placeholderProvider: BookingProvider = {
  name: "placeholder",
  persists: true,

  async getSlots(from, to, timeZone) {
    // Bryan's days a day either side, regrouped by the visitor's dates.
    const starts: Date[] = [];
    for (let day = addDays(from, -1); day <= addDays(to, 1); day = addDays(day, 1)) {
      starts.push(...startsOn(day));
    }
    if (!starts.length) return {};
    const booked = await activeBookings(
      starts[0].toISOString(),
      new Date(starts[starts.length - 1].getTime() + MEETING_MS).toISOString(),
    );
    const days: SlotsByDay = {};
    for (const start of starts) {
      if (!inWindow(start) || overlaps(start, booked)) continue;
      const key = dateKey(start, timeZone);
      if (key < from || key > to) continue;
      (days[key] ??= []).push(start.toISOString());
    }
    return days;
  },

  async createBooking(request) {
    const start = new Date(request.start);
    if (!(await isOpen(start))) throw taken();

    const fields = {
      start_at: start.toISOString(),
      end_at: new Date(start.getTime() + MEETING_MS).toISOString(),
      name: request.name,
      email: request.email,
      agency: request.agency,
      client_count: request.clients,
      time_zone: request.timeZone,
      status: "booked",
    };
    const row: BookingRecord = {
      ...fields,
      uid: sealBooking(fields),
      visit_id: request.metadata.visit_id ?? null,
    };
    try {
      await recordBooking({
        ...row,
        visitor_id: request.metadata.visitor_id ?? null,
        source: request.metadata.source ?? null,
        medium: request.metadata.medium ?? null,
        campaign: request.metadata.campaign ?? null,
      });
    } catch (error) {
      if (error instanceof SlotConflictError) throw taken();
      throw error;
    }
    return toBooking(row);
  },

  async getBooking(uid) {
    const row = await lookup(uid);
    return row ? toBooking(row) : null;
  },

  async reschedule(uid, startIso) {
    const row = await lookup(uid);
    if (!row) throw new BookingError("We couldn't find that booking.", "not_found");
    if (row.status === "cancelled") {
      throw new BookingError("That meeting was cancelled. Book a new time instead.", "invalid");
    }
    const start = new Date(startIso);
    if (!(await isOpen(start, uid))) throw taken();
    const moved = {
      ...row,
      start_at: start.toISOString(),
      end_at: new Date(start.getTime() + MEETING_MS).toISOString(),
      status: "rescheduled",
    };
    moved.uid = sealBooking(moved);
    try {
      await updateBookingStatus({
        booking_uid: uid,
        new_status: "rescheduled",
        new_start: moved.start_at,
        new_end: moved.end_at,
        new_uid: moved.uid,
      });
    } catch (error) {
      if (error instanceof SlotConflictError) throw taken();
      throw error;
    }
    return toBooking(moved);
  },

  async cancel(uid) {
    const row = await lookup(uid);
    if (!row) throw new BookingError("We couldn't find that booking.", "not_found");
    if (row.status === "cancelled") return toBooking(row);
    const cancelled = { ...row, status: "cancelled" };
    cancelled.uid = sealBooking(cancelled);
    await updateBookingStatus({ booking_uid: uid, new_status: "cancelled", new_uid: cancelled.uid });
    return toBooking(cancelled);
  },
};
