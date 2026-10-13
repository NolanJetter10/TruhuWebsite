import "server-only";

import { randomBytes } from "node:crypto";
import {
  activeBookings,
  findBooking,
  recordBooking,
  SlotConflictError,
  updateBookingStatus,
  type BookingRecord,
} from "@/lib/analytics/store";
import { addDays, dateKey, weekday, zonedToUtc } from "./time";
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
 * - supports reschedule and cancel through /get-started/manage/[uid].
 *
 * What it doesn't do is touch a calendar or send email: the confirmation
 * page says so, and someone sends the video link by hand from the dashboard's
 * Bookings table. Setting the Cal.com variables switches every new booking
 * over to the real calendar; nothing else changes.
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
    rescheduleUrl: `/get-started/manage/${row.uid}`,
    cancelUrl: `/get-started/manage/${row.uid}?cancel=1`,
    invites: false,
  };
}

const taken = () =>
  new BookingError("That time was just taken. Pick another one.", "slot_taken");

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

    const row: BookingRecord = {
      uid: `tb_${randomBytes(15).toString("base64url")}`,
      visit_id: request.metadata.visit_id ?? null,
      start_at: start.toISOString(),
      end_at: new Date(start.getTime() + MEETING_MS).toISOString(),
      name: request.name,
      email: request.email,
      agency: request.agency,
      client_count: request.clients,
      time_zone: request.timeZone,
      status: "booked",
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
    const row = await findBooking(uid);
    return row ? toBooking(row) : null;
  },

  async reschedule(uid, startIso) {
    const row = await findBooking(uid);
    if (!row) throw new BookingError("We couldn't find that booking.", "not_found");
    if (row.status === "cancelled") {
      throw new BookingError("That meeting was cancelled. Book a new time instead.", "invalid");
    }
    const start = new Date(startIso);
    if (!(await isOpen(start, uid))) throw taken();
    const end = new Date(start.getTime() + MEETING_MS).toISOString();
    try {
      await updateBookingStatus({
        booking_uid: uid,
        new_status: "rescheduled",
        new_start: start.toISOString(),
        new_end: end,
      });
    } catch (error) {
      if (error instanceof SlotConflictError) throw taken();
      throw error;
    }
    return toBooking({ ...row, start_at: start.toISOString(), end_at: end, status: "rescheduled" });
  },

  async cancel(uid) {
    const row = await findBooking(uid);
    if (!row) throw new BookingError("We couldn't find that booking.", "not_found");
    if (row.status === "cancelled") return;
    await updateBookingStatus({ booking_uid: uid, new_status: "cancelled" });
  },
};
