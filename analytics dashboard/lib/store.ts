import "server-only";

import { readFile, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Reads what the website wrote. Two backends, same rows out:
 *
 * - **Supabase** (SUPABASE_URL + SUPABASE_SECRET_KEY): plain REST calls to the
 *   tables in `supabase/schema.sql`, with the secret key, server-side only.
 * - **Local file** (development, no keys): the website appends every write to
 *   `.data/analytics.ndjson` in this folder; this replays it with the same
 *   merge rules the SQL functions use, so the dashboard behaves identically.
 */

export type Visit = {
  id: string;
  visitor_id: string;
  page: string;
  started_at: string;
  last_seen_at: string;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
  click_id: string | null;
  attribution: string | null;
  referrer: string | null;
  from_path: string | null;
  landing_url: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  returning: boolean;
  engaged_ms: number;
  max_scroll: number;
  furthest_step: number;
  last_section: string | null;
  exit_target: string | null;
  booked: boolean;
  booking_uid: string | null;
};

export type EventRow = {
  id: number;
  visit_id: string;
  at: string;
  type: string;
  name: string | null;
  props: Record<string, unknown> | null;
};

export type BookingRow = {
  uid: string;
  visit_id: string | null;
  visitor_id: string | null;
  created_at: string;
  updated_at: string;
  start_at: string;
  end_at: string | null;
  name: string;
  email: string;
  agency: string | null;
  client_count: string | null;
  time_zone: string | null;
  status: string;
  source: string | null;
  medium: string | null;
  campaign: string | null;
};

export type Snapshot = {
  visits: Visit[];
  bookings: BookingRow[];
  /** The newest events, newest first, for the live feed. */
  recent: EventRow[];
  /** Visits heard from in the last 45 seconds, whatever the range. */
  live: Visit[];
  /** Visit rows for the recent events, so the feed can say who did what. */
  feedVisits: Record<string, Visit>;
};

export const TRACKED_PAGE = "/get-started";
const LIVE_WINDOW_MS = 45_000;
const RECENT_EVENTS = 60;

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

export const BACKEND: "supabase" | "file" | "none" =
  SUPABASE_URL && SUPABASE_KEY
    ? "supabase"
    : process.env.NODE_ENV === "production"
      ? "none"
      : "file";

/* --------------------------------------------------------------- supabase */

function headers(extra: Record<string, string> = {}) {
  const key = SUPABASE_KEY!;
  return {
    apikey: key,
    // Legacy service_role keys are JWTs and go in Authorization too; the
    // newer sb_secret_ keys are not, and must only be sent as apikey.
    ...(key.startsWith("eyJ") ? { authorization: `Bearer ${key}` } : {}),
    accept: "application/json",
    ...extra,
  };
}

async function rest<T>(query: string, range?: [number, number]): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: headers(range ? { range: `${range[0]}-${range[1]}`, "range-unit": "items" } : {}),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Supabase ${query.split("?")[0]}: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

/** Every row of a query, a page of 1,000 at a time (the API's ceiling). */
async function restAll<T>(query: string, cap = 25_000): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; from < cap; from += 1000) {
    const page = await rest<T>(query, [from, from + 999]);
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows;
}

async function supabaseSnapshot(since: string | null): Promise<Snapshot> {
  const page = `page=eq.${encodeURIComponent(TRACKED_PAGE)}`;
  const after = (column: string) =>
    since ? `&${column}=gte.${encodeURIComponent(since)}` : "";
  const liveSince = new Date(Date.now() - LIVE_WINDOW_MS).toISOString();

  const [visits, bookings, recent, live] = await Promise.all([
    restAll<Visit>(`visits?select=*&${page}${after("started_at")}&order=started_at.desc`),
    restAll<BookingRow>(`bookings?select=*${after("created_at")}&order=created_at.desc`),
    rest<EventRow>(`events?select=*&order=id.desc&limit=${RECENT_EVENTS}`),
    rest<Visit>(`visits?select=*&${page}&last_seen_at=gte.${encodeURIComponent(liveSince)}`),
  ]);

  const known = new Map(visits.map((v) => [v.id, v]));
  const missing = [...new Set(recent.map((e) => e.visit_id))].filter((id) => !known.has(id));
  if (missing.length) {
    const extra = await rest<Visit>(`visits?select=*&id=in.(${missing.join(",")})`);
    for (const v of extra) known.set(v.id, v);
  }
  const feedVisits: Record<string, Visit> = {};
  for (const e of recent) {
    const v = known.get(e.visit_id);
    if (v) feedVisits[v.id] = v;
  }
  return { visits, bookings, recent, live, feedVisits };
}

async function supabasePulse() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/pulse`, {
    method: "POST",
    headers: headers({ "content-type": "application/json" }),
    body: "{}",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase pulse: ${res.status}`);
  return String(await res.json());
}

/* ------------------------------------------------------------------- file */

const DEV_FILE =
  process.env.ANALYTICS_DEV_FILE ??
  path.join(/* turbopackIgnore: true */ process.cwd(), ".data", "analytics.ndjson");

type Replayed = {
  visits: Map<string, Visit>;
  events: EventRow[];
  bookings: Map<string, BookingRow>;
};

let replayCache: { key: string; data: Replayed } | null = null;

const later = (a: string, b: string) => (a > b ? a : b);

/** The SQL functions in supabase/schema.sql, in TypeScript. */
function replay(text: string): Replayed {
  const visits = new Map<string, Visit>();
  const events: EventRow[] = [];
  const bookings = new Map<string, BookingRow>();
  let nextId = 1;

  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    let entry: { op: string; args: Record<string, unknown>; ts: string };
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    if (entry.op === "ingest") {
      const v = entry.args.visit as Partial<Visit> & { id: string };
      const existing = visits.get(v.id);
      if (!existing) {
        visits.set(v.id, {
          source: null, medium: null, campaign: null, content: null, term: null,
          click_id: null, attribution: null, referrer: null, from_path: null,
          landing_url: null, device: null, browser: null, os: null, country: null,
          region: null, city: null, last_section: null, exit_target: null,
          ...v,
          returning: Boolean(v.returning),
          engaged_ms: v.engaged_ms ?? 0,
          max_scroll: v.max_scroll ?? 0,
          furthest_step: v.furthest_step ?? 0,
          booked: false,
          booking_uid: null,
        } as Visit);
      } else {
        existing.last_seen_at = later(existing.last_seen_at, v.last_seen_at ?? existing.last_seen_at);
        existing.engaged_ms = Math.max(existing.engaged_ms, v.engaged_ms ?? 0);
        existing.max_scroll = Math.max(existing.max_scroll, v.max_scroll ?? 0);
        existing.furthest_step = Math.max(existing.furthest_step, v.furthest_step ?? 0);
        existing.last_section = v.last_section ?? existing.last_section;
        existing.exit_target = v.exit_target ?? existing.exit_target;
      }
      for (const e of (entry.args.events as Omit<EventRow, "id" | "visit_id">[]) ?? []) {
        events.push({ ...e, id: nextId++, visit_id: v.id, name: e.name ?? null, props: e.props ?? null });
      }
    } else if (entry.op === "record_booking") {
      const b = entry.args.booking as Record<string, string | null>;
      const visit = b.visit_id ? visits.get(b.visit_id) : undefined;
      const prior = bookings.get(b.uid!);
      bookings.set(b.uid!, {
        uid: b.uid!,
        visit_id: visit ? visit.id : null,
        visitor_id: b.visitor_id ?? null,
        created_at: prior?.created_at ?? entry.ts,
        updated_at: entry.ts,
        start_at: b.start_at!,
        end_at: b.end_at ?? null,
        name: b.name ?? "",
        email: b.email ?? "",
        agency: b.agency ?? null,
        client_count: b.client_count ?? null,
        time_zone: b.time_zone ?? null,
        status: b.status ?? "booked",
        source: b.source ?? null,
        medium: b.medium ?? null,
        campaign: b.campaign ?? null,
      });
      if (visit) {
        visit.booked = true;
        visit.booking_uid = b.uid!;
        visit.furthest_step = Math.max(visit.furthest_step, 6);
        visit.last_seen_at = later(visit.last_seen_at, entry.ts);
        events.push({
          id: nextId++,
          visit_id: visit.id,
          at: entry.ts,
          type: "booked",
          name: b.uid!,
          props: { agency: b.agency, client_count: b.client_count },
        });
      }
    } else if (entry.op === "update_booking_status") {
      const a = entry.args as Record<string, string | null>;
      const booking = bookings.get(a.booking_uid!);
      if (!booking) continue;
      bookings.delete(booking.uid);
      booking.status = a.new_status!;
      booking.start_at = a.new_start ?? booking.start_at;
      booking.end_at = a.new_end ?? booking.end_at;
      booking.uid = a.new_uid ?? booking.uid;
      booking.updated_at = entry.ts;
      bookings.set(booking.uid, booking);
      if (booking.visit_id) {
        const visit = visits.get(booking.visit_id);
        if (visit && a.new_uid) visit.booking_uid = a.new_uid;
        events.push({
          id: nextId++,
          visit_id: booking.visit_id,
          at: entry.ts,
          type: `booking_${a.new_status}`,
          name: booking.uid,
          props: { start: a.new_start },
        });
      }
    }
  }
  return { visits, events, bookings };
}

async function fileData(): Promise<Replayed> {
  let info;
  try {
    info = await stat(DEV_FILE);
  } catch {
    return { visits: new Map(), events: [], bookings: new Map() };
  }
  const key = `${info.size}:${info.mtimeMs}`;
  if (replayCache?.key === key) return replayCache.data;
  const data = replay(await readFile(DEV_FILE, "utf8"));
  replayCache = { key, data };
  return data;
}

async function fileSnapshot(since: string | null): Promise<Snapshot> {
  const data = await fileData();
  const all = [...data.visits.values()].filter((v) => v.page === TRACKED_PAGE);
  const visits = all
    .filter((v) => !since || v.started_at >= since)
    .sort((a, b) => b.started_at.localeCompare(a.started_at));
  const bookings = [...data.bookings.values()]
    .filter((b) => !since || b.created_at >= since)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const liveSince = new Date(Date.now() - LIVE_WINDOW_MS).toISOString();
  const live = all.filter((v) => v.last_seen_at >= liveSince);
  const recent = data.events.slice(-RECENT_EVENTS).reverse();
  const feedVisits: Record<string, Visit> = {};
  for (const e of recent) {
    const v = data.visits.get(e.visit_id);
    if (v) feedVisits[v.id] = v;
  }
  return { visits, bookings, recent, live, feedVisits };
}

async function filePulse() {
  try {
    const info = await stat(DEV_FILE);
    return `${info.size}:${info.mtimeMs}`;
  } catch {
    return "empty";
  }
}

/* ---------------------------------------------------------------- exports */

export async function snapshot(since: string | null): Promise<Snapshot> {
  if (BACKEND === "supabase") return supabaseSnapshot(since);
  if (BACKEND === "file") return fileSnapshot(since);
  return { visits: [], bookings: [], recent: [], live: [], feedVisits: {} };
}

/** A string that changes whenever anything the dashboard shows has changed. */
export async function pulse(): Promise<string> {
  if (BACKEND === "supabase") return supabasePulse();
  if (BACKEND === "file") return filePulse();
  return "none";
}
