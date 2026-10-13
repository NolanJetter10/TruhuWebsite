import "server-only";

import { addDays, dateKey, weekday, zonedToUtc } from "./time";
import type { Booking, BookingProvider, SlotsByDay } from "./types";

/**
 * Stands in for Cal.com in development, so the page can be built and tested
 * end to end before anyone has an account. Weekday half-hours in Bryan's zone
 * with a deterministic scatter of busy ones; a "booking" sends nothing and
 * writes nothing — its details ride inside the uid, so the confirmation page
 * can read them back without any storage.
 *
 * Never used in production: with Cal.com unconfigured there, the widget shows
 * a contact fallback instead.
 */

const HOST_ZONE = "America/New_York";
const DURATION_MIN = 10;
const LEAD_MS = 4 * 60 * 60_000;

/** A stable 0–1 per string, so the same slot is always free or always busy. */
function noise(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

function encode(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export const demoProvider: BookingProvider = {
  name: "demo",

  async getSlots(from, to, timeZone) {
    const days: SlotsByDay = {};
    const earliest = Date.now() + LEAD_MS;
    // Walk the host's calendar a day either side, then regroup by the
    // visitor's dates, which may not line up with the host's.
    for (let day = addDays(from, -1); day <= addDays(to, 1); day = addDays(day, 1)) {
      const dow = weekday(day);
      if (dow === 0 || dow === 6) continue;
      const [y, m, d] = day.split("-").map(Number);
      for (let minutes = 9 * 60; minutes <= 16 * 60 + 30; minutes += 30) {
        if (noise(`${day}:${minutes}`) < 0.38) continue;
        const start = zonedToUtc(y, m, d, Math.floor(minutes / 60), minutes % 60, HOST_ZONE);
        if (start.getTime() < earliest) continue;
        const key = dateKey(start, timeZone);
        if (key < from || key > to) continue;
        (days[key] ??= []).push(start.toISOString());
      }
    }
    for (const list of Object.values(days)) list.sort();
    return days;
  },

  async createBooking(request) {
    const start = new Date(request.start);
    const end = new Date(start.getTime() + DURATION_MIN * 60_000);
    const uid = `demo_${encode({
      s: start.toISOString(),
      n: request.name,
      e: request.email,
      a: request.agency,
      c: request.clients,
      z: request.timeZone,
    })}`;
    return {
      uid,
      start: start.toISOString(),
      end: end.toISOString(),
      status: "accepted",
      attendee: { name: request.name, email: request.email, timeZone: request.timeZone },
      agency: request.agency,
      clients: request.clients,
      rescheduleUrl: "/get-started#calendar",
      cancelUrl: "/get-started",
    };
  },

  async getBooking(uid) {
    if (!uid.startsWith("demo_")) return null;
    try {
      const v = JSON.parse(Buffer.from(uid.slice(5), "base64url").toString());
      const start = new Date(v.s);
      return {
        uid,
        start: start.toISOString(),
        end: new Date(start.getTime() + DURATION_MIN * 60_000).toISOString(),
        status: "accepted",
        attendee: { name: v.n, email: v.e, timeZone: v.z },
        agency: v.a,
        clients: v.c,
        rescheduleUrl: "/get-started#calendar",
        cancelUrl: "/get-started",
      } satisfies Booking;
    } catch {
      return null;
    }
  },
};
