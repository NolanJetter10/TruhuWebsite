import "server-only";

import { lookup } from "node:dns/promises";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { CONVERTED, TRACKED_PAGE } from "./funnel";
import { env } from "./env";

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
  returning_visitor: boolean;
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

/** A work email left on one of Bryan's paths (samples, build, rebuild). */
export type LeadRow = {
  id: string;
  visit_id: string | null;
  visitor_id: string | null;
  created_at: string;
  path: string;
  email: string;
  client_url: string | null;
  upload_id: string | null;
  file_count: number | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
};

export type TranscriptLine = { role: "visitor" | "bryan"; text: string; at: string };

/** One call or typed chat with AI Bryan. The transcript is read on its own. */
export type ConversationRow = {
  id: string;
  visit_id: string | null;
  visitor_id: string | null;
  mode: string;
  started_at: string;
  updated_at: string;
  ended_at: string | null;
  duration_ms: number;
  ended_by: string | null;
  turns: number;
  flows: string[];
  source: string | null;
  medium: string | null;
  campaign: string | null;
};

export type Snapshot = {
  visits: Visit[];
  bookings: BookingRow[];
  leads: LeadRow[];
  conversations: ConversationRow[];
  /** Popups, path starts, calls and trailer events in range, oldest first. */
  pathEvents: EventRow[];
  /** The newest events, newest first, for the live feed. */
  recent: EventRow[];
  /** Visits heard from in the last 45 seconds, whatever the range. */
  live: Visit[];
  /** Visit rows for the recent events, so the feed can say who did what. */
  feedVisits: Record<string, Visit>;
  /** Tables the database doesn't have yet (schema.sql not re-run). */
  missing: string[];
};

export { TRACKED_PAGE };
const LIVE_WINDOW_MS = 45_000;
const RECENT_EVENTS = 100;

/** The event types the paths, calls and trailer numbers are counted from. */
const PATH_EVENT_TYPES = [
  "flow_open",
  "path_start",
  "call_start",
  "trailer_play",
  "trailer_progress",
] as const;

const CONVERSATION_COLUMNS =
  "id,visit_id,visitor_id,mode,started_at,updated_at,ended_at,duration_ms,ended_by,turns,flows,source,medium,campaign";

function db() {
  const url = env("SUPABASE_URL")?.replace(/\/+$/, "");
  const key = env("SUPABASE_SECRET_KEY");
  return url && key ? { url, key } : null;
}

const probes = new Map<string, { ok: boolean; at: number }>();

/**
 * Whether the Supabase host resolves, asked at most once a minute. The
 * website treats a project that doesn't (deleted, or a typo in .env.local) as
 * no Supabase and writes the local file instead (its lib/reachable.ts), so in
 * development this reads that file too.
 */
async function resolves(url: string) {
  const host = new URL(url).hostname;
  const probe = probes.get(host);
  if (probe && Date.now() - probe.at < 60_000) return probe.ok;
  const ok = await lookup(host).then(
    () => true,
    () => false,
  );
  if (!ok && probe?.ok !== false) {
    console.warn(`[dashboard] ${host} doesn't resolve; reading the local file instead`);
  }
  probes.set(host, { ok, at: Date.now() });
  return ok;
}

/** Read per call, so adding the keys needs no restart. */
export async function backend(): Promise<"supabase" | "file" | "none"> {
  const production = process.env.NODE_ENV === "production";
  const conn = db();
  // Online, a bad SUPABASE_URL should say so (see explain() in the summary
  // route) rather than quietly show an empty file.
  if (conn && (production || (await resolves(conn.url)))) return "supabase";
  return production ? "none" : "file";
}

/* --------------------------------------------------------------- supabase */

function headers(extra: Record<string, string> = {}) {
  const key = db()!.key;
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
  const res = await fetch(`${db()!.url}/rest/v1/${query}`, {
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

const MISSING_TABLE = /PGRST20[25]|Could not find the table|does not exist/i;

/**
 * A table added after the first schema.sql run. Until Nolan runs the script
 * again it isn't there: the rest of the dashboard still works, and the page
 * says which tables are missing.
 */
async function optional<T>(table: string, missing: string[], read: () => Promise<T[]>) {
  try {
    return await read();
  } catch (error) {
    if (error instanceof Error && MISSING_TABLE.test(error.message)) {
      missing.push(table);
      return [];
    }
    throw error;
  }
}

async function supabaseSnapshot(since: string | null): Promise<Snapshot> {
  const page = `page=eq.${encodeURIComponent(TRACKED_PAGE)}`;
  const after = (column: string) =>
    since ? `&${column}=gte.${encodeURIComponent(since)}` : "";
  const liveSince = new Date(Date.now() - LIVE_WINDOW_MS).toISOString();
  const missing: string[] = [];

  const [visits, bookingRows, recent, live, leads, conversations, pathEvents] = await Promise.all([
    restAll<Visit>(`visits?select=*&${page}${after("started_at")}&order=started_at.desc`),
    // The booking's visit comes along, so ones made on an older page drop out.
    restAll<BookingRow & { visit: { page: string } | null }>(
      `bookings?select=*,visit:visits(page)${after("created_at")}&order=created_at.desc`,
    ),
    rest<EventRow>(`events?select=*&order=id.desc&limit=${RECENT_EVENTS}`),
    rest<Visit>(`visits?select=*&${page}&last_seen_at=gte.${encodeURIComponent(liveSince)}`),
    optional("leads", missing, () =>
      restAll<LeadRow>(`leads?select=*${after("created_at")}&order=created_at.desc`),
    ),
    optional("conversations", missing, () =>
      restAll<ConversationRow>(
        `conversations?select=${CONVERSATION_COLUMNS}${after("started_at")}&order=started_at.desc`,
      ),
    ),
    restAll<EventRow>(
      `events?select=*&type=in.(${PATH_EVENT_TYPES.join(",")})${after("at")}&order=id.asc`,
    ),
  ]);

  const bookings = bookingRows
    .filter((b) => !b.visit || b.visit.page === TRACKED_PAGE)
    .map(({ visit: _visit, ...b }) => b);

  const known = new Map(visits.map((v) => [v.id, v]));
  const unknown = [...new Set(recent.map((e) => e.visit_id))].filter((id) => !known.has(id));
  if (unknown.length) {
    const extra = await rest<Visit>(`visits?select=*&id=in.(${unknown.join(",")})`);
    for (const v of extra) known.set(v.id, v);
  }
  const feedVisits: Record<string, Visit> = {};
  for (const e of recent) {
    const v = known.get(e.visit_id);
    if (v) feedVisits[v.id] = v;
  }
  return { visits, bookings, leads, conversations, pathEvents, recent, live, feedVisits, missing };
}

async function supabaseTranscript(id: string) {
  const rows = await rest<{ transcript: TranscriptLine[] | null }>(
    `conversations?select=transcript&id=eq.${encodeURIComponent(id)}&limit=1`,
  );
  return rows.length ? (rows[0].transcript ?? []) : null;
}

async function supabasePulse() {
  const res = await fetch(`${db()!.url}/rest/v1/rpc/pulse`, {
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

type StoredConversation = ConversationRow & { transcript: TranscriptLine[] };

type Replayed = {
  visits: Map<string, Visit>;
  events: EventRow[];
  bookings: Map<string, BookingRow>;
  leads: Map<string, LeadRow>;
  conversations: Map<string, StoredConversation>;
};

const empty = (): Replayed => ({
  visits: new Map(),
  events: [],
  bookings: new Map(),
  leads: new Map(),
  conversations: new Map(),
});

let replayCache: { key: string; data: Replayed } | null = null;

const later = (a: string, b: string) => (a > b ? a : b);
const text = (value: unknown) => (typeof value === "string" && value ? value : null);
const count = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/** The SQL functions in supabase/schema.sql, in TypeScript. */
function replay(source: string): Replayed {
  const { visits, events, bookings, leads, conversations } = empty();
  let nextId = 1;

  for (const line of source.split("\n")) {
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
          // Older local entries used "returning", a word SQL reserves.
          returning_visitor: Boolean(
            v.returning_visitor ?? (v as { returning?: boolean }).returning,
          ),
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
        visit.furthest_step = Math.max(visit.furthest_step, CONVERTED);
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
    } else if (entry.op === "record_lead") {
      // Insert once (on conflict do nothing); a known visit converts.
      const l = (entry.args.lead ?? {}) as Record<string, unknown>;
      const id = text(l.id);
      if (!id || leads.has(id)) continue;
      const vid = text(l.visit_id);
      const visit = vid ? visits.get(vid) : undefined;
      const leadPath = text(l.path) ?? "";
      leads.set(id, {
        id,
        visit_id: visit ? visit.id : null,
        visitor_id: text(l.visitor_id),
        created_at: text(l.created_at) ?? entry.ts,
        path: leadPath,
        email: text(l.email) ?? "",
        client_url: text(l.client_url),
        upload_id: text(l.upload_id),
        file_count: l.file_count == null ? null : count(l.file_count),
        source: text(l.source),
        medium: text(l.medium),
        campaign: text(l.campaign),
      });
      if (visit) {
        visit.furthest_step = Math.max(visit.furthest_step, CONVERTED);
        visit.last_seen_at = later(visit.last_seen_at, entry.ts);
        events.push({
          id: nextId++,
          visit_id: visit.id,
          at: entry.ts,
          type: "lead",
          name: leadPath,
          props: { lead_id: id },
        });
      }
    } else if (entry.op === "record_conversation") {
      // Upsert by id. Totals keep the larger value, the transcript and flows
      // the longer one, and the end takes the new value when one is given.
      const c = (entry.args.convo ?? {}) as Record<string, unknown>;
      const id = text(c.id);
      if (!id) continue;
      const vid = text(c.visit_id);
      const visit = vid ? visits.get(vid) : undefined;
      const transcript = Array.isArray(c.transcript) ? (c.transcript as TranscriptLine[]) : [];
      const flows = Array.isArray(c.flows) ? c.flows.map(String) : [];
      const prior = conversations.get(id);
      if (!prior) {
        conversations.set(id, {
          id,
          visit_id: visit ? visit.id : null,
          visitor_id: text(c.visitor_id),
          mode: text(c.mode) ?? "call",
          started_at: text(c.started_at) ?? entry.ts,
          updated_at: entry.ts,
          ended_at: text(c.ended_at),
          duration_ms: count(c.duration_ms),
          ended_by: text(c.ended_by),
          turns: count(c.turns),
          flows,
          transcript,
          source: text(c.source),
          medium: text(c.medium),
          campaign: text(c.campaign),
        });
      } else {
        prior.duration_ms = Math.max(prior.duration_ms, count(c.duration_ms));
        prior.turns = Math.max(prior.turns, count(c.turns));
        if (transcript.length >= prior.transcript.length) prior.transcript = transcript;
        prior.ended_at = text(c.ended_at) ?? prior.ended_at;
        prior.ended_by = text(c.ended_by) ?? prior.ended_by;
        if (flows.length > prior.flows.length) prior.flows = flows;
        prior.visit_id ??= visit ? visit.id : null;
        prior.updated_at = entry.ts;
      }
    }
  }
  return { visits, events, bookings, leads, conversations };
}

async function fileData(): Promise<Replayed> {
  let info;
  try {
    info = await stat(DEV_FILE);
  } catch {
    return empty();
  }
  const key = `${info.size}:${info.mtimeMs}`;
  if (replayCache?.key === key) return replayCache.data;
  const data = replay(await readFile(DEV_FILE, "utf8"));
  replayCache = { key, data };
  return data;
}

async function fileSnapshot(since: string | null): Promise<Snapshot> {
  const data = await fileData();
  const inRange = (at: string) => !since || at >= since;
  const newest = <T>(rows: Iterable<T>, at: (row: T) => string) =>
    [...rows].filter((r) => inRange(at(r))).sort((a, b) => at(b).localeCompare(at(a)));
  /** Rows tied to a visit on another page (the old /get-started) drop out. */
  const onPage = (row: { visit_id: string | null }) =>
    !row.visit_id || data.visits.get(row.visit_id)?.page === TRACKED_PAGE;

  const all = [...data.visits.values()].filter((v) => v.page === TRACKED_PAGE);
  const visits = newest(all, (v) => v.started_at);
  const bookings = newest(data.bookings.values(), (b) => b.created_at).filter(onPage);
  const leads = newest(data.leads.values(), (l) => l.created_at).filter(onPage);
  const conversations = newest(data.conversations.values(), (c) => c.started_at)
    .filter(onPage)
    .map(({ transcript: _transcript, ...c }) => c);
  const types = new Set<string>(PATH_EVENT_TYPES);
  const pathEvents = data.events.filter((e) => types.has(e.type) && inRange(e.at));

  const liveSince = new Date(Date.now() - LIVE_WINDOW_MS).toISOString();
  const live = all.filter((v) => v.last_seen_at >= liveSince);
  const recent = data.events.slice(-RECENT_EVENTS).reverse();
  const feedVisits: Record<string, Visit> = {};
  for (const e of recent) {
    const v = data.visits.get(e.visit_id);
    if (v) feedVisits[v.id] = v;
  }
  return { visits, bookings, leads, conversations, pathEvents, recent, live, feedVisits, missing: [] };
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
  const mode = await backend();
  if (mode === "supabase") return supabaseSnapshot(since);
  if (mode === "file") return fileSnapshot(since);
  return {
    visits: [],
    bookings: [],
    leads: [],
    conversations: [],
    pathEvents: [],
    recent: [],
    live: [],
    feedVisits: {},
    missing: [],
  };
}

/** One call's transcript, or null when there's no such call. */
export async function transcript(id: string): Promise<TranscriptLine[] | null> {
  const mode = await backend();
  if (mode === "supabase") return supabaseTranscript(id);
  if (mode === "file") return (await fileData()).conversations.get(id)?.transcript ?? null;
  return null;
}

/** A string that changes whenever anything the dashboard shows has changed. */
export async function pulse(): Promise<string> {
  const mode = await backend();
  if (mode === "supabase") return `s:${await supabasePulse()}`;
  if (mode === "file") return `f:${await filePulse()}`;
  return "none";
}
