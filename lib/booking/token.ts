import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { BookingRecord } from "@/lib/analytics/store";

/**
 * A placeholder booking's uid carries the booking itself, encrypted, so the
 * confirmation and manage pages can show it from the link alone. Without a
 * database (lib/analytics/store.ts), production keeps bookings on each
 * server's own temporary disk, and the request that shows a booking often
 * lands on a different server from the one that took it.
 *
 * AES-256-GCM: nobody can read the name and email out of the link, or forge
 * a booking that shows. The key comes from BOOKING_TOKEN_SECRET, or else the
 * chat's ENSEMBLE_JWT_SECRET, which production already has. With neither the
 * links still work, but anyone with this code could read them.
 */

const PREFIX = "tb_";
const VERSION = 1;

function key() {
  const secret =
    process.env.BOOKING_TOKEN_SECRET || process.env.ENSEMBLE_JWT_SECRET || "truhu-booking-demo";
  return createHash("sha256").update(`booking-token:${secret}`).digest();
}

/** Keeps the link short enough for every page that takes one (under 600). */
const clip = (value: string | null, max: number) => (value ?? "").slice(0, max);

type Sealed = Omit<BookingRecord, "uid" | "visit_id">;

export function sealBooking(row: Sealed) {
  const payload = JSON.stringify([
    VERSION,
    row.start_at,
    row.end_at,
    clip(row.name, 60),
    clip(row.email, 100),
    clip(row.agency, 60),
    clip(row.client_count, 30),
    clip(row.time_zone, 40),
    row.status,
  ]);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

/** The booking a uid carries, or null if it isn't one of ours. */
export function openBooking(uid: string): BookingRecord | null {
  if (!uid.startsWith(PREFIX) || uid.length > 600) return null;
  try {
    const raw = Buffer.from(uid.slice(PREFIX.length), "base64url");
    if (raw.length < 29) return null;
    const decipher = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const text = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
    const [version, start_at, end_at, name, email, agency, client_count, time_zone, status] =
      JSON.parse(text) as [number, string, string | null, string, string, string, string, string, string];
    if (version !== VERSION || Number.isNaN(Date.parse(start_at))) return null;
    return {
      uid,
      visit_id: null,
      start_at,
      end_at,
      name,
      email,
      agency: agency || null,
      client_count: client_count || null,
      time_zone: time_zone || null,
      status,
    };
  } catch {
    return null;
  }
}
