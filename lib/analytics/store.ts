import "server-only";

import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * Where funnel analytics are written. The website only ever writes; the
 * dashboard in `analytics dashboard/` reads.
 *
 * With SUPABASE_URL and SUPABASE_SECRET_KEY set, every write is one call to a
 * Postgres function defined in `analytics dashboard/supabase/schema.sql`, so
 * the merge rules (running totals only ever go up, a booking marks its visit)
 * live in the database rather than here.
 *
 * Without them, in development, the same calls are appended to a local file
 * that the dashboard replays with the same rules, so the whole loop runs on a
 * laptop with no accounts. In production without them, writes are dropped
 * with one warning rather than failing the page.
 */

type Row = Record<string, unknown>;

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

export const ANALYTICS_BACKEND: "supabase" | "file" | "none" =
  SUPABASE_URL && SUPABASE_KEY
    ? "supabase"
    : process.env.NODE_ENV === "production"
      ? "none"
      : "file";

const DEV_FILE =
  process.env.ANALYTICS_DEV_FILE ??
  path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "analytics dashboard",
    ".data",
    "analytics.ndjson",
  );

let warned = false;

async function call(fn: string, args: Row) {
  if (ANALYTICS_BACKEND === "supabase") {
    const key = SUPABASE_KEY!;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: key,
        // Legacy service_role keys are JWTs and go in Authorization too; the
        // newer sb_secret_ keys are not JWTs and must only be sent as apikey.
        ...(key.startsWith("eyJ") ? { authorization: `Bearer ${key}` } : {}),
      },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`analytics ${fn} failed: ${res.status} ${await res.text()}`);
    }
    return;
  }

  if (ANALYTICS_BACKEND === "file") {
    await mkdir(path.dirname(DEV_FILE), { recursive: true });
    await appendFile(
      DEV_FILE,
      `${JSON.stringify({ op: fn, args, ts: new Date().toISOString() })}\n`,
    );
    return;
  }

  if (!warned) {
    warned = true;
    console.warn(
      "[analytics] SUPABASE_URL / SUPABASE_SECRET_KEY are not set; funnel events are being dropped.",
    );
  }
}

/** One beacon: upsert the visit, append its events. */
export function ingest(visit: Row, events: Row[]) {
  return call("ingest", { visit, events });
}

/** A booking made on the page, tied back to the visit that made it. */
export function recordBooking(booking: Row) {
  return call("record_booking", { booking });
}

/** A cancellation or reschedule, as reported by the Cal.com webhook. */
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
