import "server-only";

import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * The website's side of the analytics database: funnel writes, and the
 * booking rows the placeholder scheduler books against.
 *
 * With SUPABASE_URL and SUPABASE_SECRET_KEY set, every write is one call to a
 * Postgres function defined in `analytics dashboard/supabase/schema.sql`, so
 * the merge rules (running totals only ever go up, a booking marks its visit,
 * one live booking per start time) live in the database rather than here.
 *
 * Without them, in development, the same calls are appended to a local file
 * that the dashboard replays with the same rules, so the whole loop runs on a
 * laptop with no accounts. In production without them, writes are dropped
 * with one warning rather than failing the page.
 *
 * The keys are read per call rather than at import, so adding them to
 * .env.local takes effect without restarting the dev server.
 */

type Row = Record<string, unknown>;

/** Another live booking already holds that start time. */
export class SlotConflictError extends Error {}

function supabase() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  return url && key ? { url, key } : null;
}

export function analyticsBackend(): "supabase" | "file" | "none" {
  if (supabase()) return "supabase";
  return process.env.NODE_ENV === "production" ? "none" : "file";
}

const devFile = () =>
  process.env.ANALYTICS_DEV_FILE ??
  path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "analytics dashboard",
    ".data",
    "analytics.ndjson",
  );

function headers(key: string, extra: Record<string, string> = {}) {
  return {
    apikey: key,
    // Legacy service_role keys are JWTs and go in Authorization too; the
    // newer sb_secret_ keys are not JWTs and must only be sent as apikey.
    ...(key.startsWith("eyJ") ? { authorization: `Bearer ${key}` } : {}),
    ...extra,
  };
}

let warned = false;

async function call(fn: string, args: Row) {
  const db = supabase();
  if (db) {
    const res = await fetch(`${db.url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: headers(db.key, { "content-type": "application/json" }),
      body: JSON.stringify(args),
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      // 23505 is Postgres's unique violation: the one-booking-per-slot index.
      if (res.status === 409 || text.includes("23505")) throw new SlotConflictError(text);
      throw new Error(`analytics ${fn} failed: ${res.status} ${text}`);
    }
    return;
  }

  if (analyticsBackend() === "file") {
    if (fn === "record_booking" || fn === "update_booking_status") {
      await checkFileConflict(fn, args);
    }
    const file = devFile();
    await mkdir(path.dirname(file), { recursive: true });
    await appendFile(file, `${JSON.stringify({ op: fn, args, ts: new Date().toISOString() })}\n`);
    return;
  }

  if (!warned) {
    warned = true;
    console.warn(
      "[analytics] SUPABASE_URL / SUPABASE_SECRET_KEY are not set; funnel events are being dropped.",
    );
  }
}

/* ---------------------------------------------------------------- writes */

/** One beacon: upsert the visit, append its events. */
export function ingest(visit: Row, events: Row[]) {
  return call("ingest", { visit, events });
}

/**
 * A booking, tied back to the visit that made it. Throws SlotConflictError if
 * another live booking holds the same start time.
 */
export function recordBooking(booking: Row) {
  return call("record_booking", { booking });
}

/** A cancellation or a move. Moving onto a taken time throws SlotConflictError. */
export function updateBookingStatus(args: {
  booking_uid: string;
  new_status: "cancelled" | "rescheduled";
  new_start?: string | null;
  new_end?: string | null;
  new_uid?: string | null;
}) {
  return call("update_booking_status", {
    booking_uid: args.booking_uid,
    new_status: args.new_status,
    new_start: args.new_start ?? null,
    new_end: args.new_end ?? null,
    new_uid: args.new_uid ?? null,
  });
}

/* ----------------------------------------------------------------- reads */

export type BookingRecord = {
  uid: string;
  visit_id: string | null;
  start_at: string;
  end_at: string | null;
  name: string;
  email: string;
  agency: string | null;
  client_count: string | null;
  time_zone: string | null;
  status: string;
};

const BOOKING_COLUMNS =
  "uid,visit_id,start_at,end_at,name,email,agency,client_count,time_zone,status";

const iso = (value: string | null) => (value ? new Date(value).toISOString() : value);

function normalise(row: BookingRecord): BookingRecord {
  return { ...row, start_at: iso(row.start_at)!, end_at: iso(row.end_at) };
}

async function select<T>(query: string): Promise<T[]> {
  const db = supabase()!;
  const res = await fetch(`${db.url}/rest/v1/${query}`, {
    headers: headers(db.key, { accept: "application/json" }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase ${query.split("?")[0]}: ${res.status} ${await res.text()}`);
  return res.json();
}

/** Bookings that still hold their time, starting in [from, to). */
export async function activeBookings(from: string, to: string): Promise<BookingRecord[]> {
  if (supabase()) {
    const rows = await select<BookingRecord>(
      `bookings?select=${BOOKING_COLUMNS}&status=neq.cancelled` +
        `&start_at=gte.${encodeURIComponent(from)}&start_at=lt.${encodeURIComponent(to)}`,
    );
    return rows.map(normalise);
  }
  if (analyticsBackend() === "file") {
    return [...(await fileBookings()).values()].filter(
      (b) => b.status !== "cancelled" && b.start_at >= from && b.start_at < to,
    );
  }
  return [];
}

export async function findBooking(uid: string): Promise<BookingRecord | null> {
  if (supabase()) {
    const rows = await select<BookingRecord>(
      `bookings?select=${BOOKING_COLUMNS}&uid=eq.${encodeURIComponent(uid)}&limit=1`,
    );
    return rows[0] ? normalise(rows[0]) : null;
  }
  if (analyticsBackend() === "file") return (await fileBookings()).get(uid) ?? null;
  return null;
}

/* ----------------------------------------------- the local file's bookings */

/** record_booking and update_booking_status, replayed from the dev file. */
async function fileBookings() {
  const bookings = new Map<string, BookingRecord>();
  let text = "";
  try {
    text = await readFile(devFile(), "utf8");
  } catch {
    return bookings;
  }
  for (const line of text.split("\n")) {
    if (!line.includes('"op":"record_booking"') && !line.includes('"op":"update_booking_status"')) {
      continue;
    }
    let entry: { op: string; args: Row };
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (entry.op === "record_booking") {
      const b = entry.args.booking as BookingRecord & Row;
      bookings.set(b.uid, {
        uid: b.uid,
        visit_id: (b.visit_id as string) ?? null,
        start_at: iso(b.start_at)!,
        end_at: iso(b.end_at ?? null),
        name: b.name ?? "",
        email: b.email ?? "",
        agency: b.agency ?? null,
        client_count: b.client_count ?? null,
        time_zone: b.time_zone ?? null,
        status: b.status ?? "booked",
      });
    } else {
      const a = entry.args as Record<string, string | null>;
      const booking = bookings.get(a.booking_uid!);
      if (!booking) continue;
      bookings.delete(booking.uid);
      booking.status = a.new_status!;
      booking.start_at = iso(a.new_start) ?? booking.start_at;
      booking.end_at = iso(a.new_end) ?? booking.end_at;
      booking.uid = a.new_uid ?? booking.uid;
      bookings.set(booking.uid, booking);
    }
  }
  return bookings;
}

/** The unique-slot index, for the file: no two live bookings at one start. */
async function checkFileConflict(fn: string, args: Row) {
  const start =
    fn === "record_booking"
      ? iso((args.booking as Row).start_at as string)
      : args.new_status !== "cancelled"
        ? iso(args.new_start as string | null)
        : null;
  if (!start) return;
  const self = fn === "record_booking" ? (args.booking as Row).uid : args.booking_uid;
  for (const booking of (await fileBookings()).values()) {
    if (booking.uid !== self && booking.status !== "cancelled" && booking.start_at === start) {
      throw new SlotConflictError(`slot ${start} is taken`);
    }
  }
}
