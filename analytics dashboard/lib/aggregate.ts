import {
  CONVERTED,
  ENDED,
  FROM,
  FUNNEL,
  FLOWS,
  PATHS,
  PATH_LABEL,
  SECTIONS,
  TRACKED_PAGE,
  flowLabel,
  type PathKey,
} from "./funnel";
import type { EventRow, Snapshot, Visit } from "./store";

/**
 * Raw rows in, one summary out: everything the dashboard draws, already
 * counted, so the browser only ever receives totals plus the handful of rows
 * it lists. Pure — no I/O — so the same function serves both backends.
 */

export const RANGES = {
  today: "Today",
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  all: "All time",
} as const;
export type RangeKey = keyof typeof RANGES;

export const isRange = (value: string | null): value is RangeKey =>
  value !== null && value in RANGES;

/* ------------------------------------------------------------------ time */

function wall(instant: Date | string | number, tz: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(new Date(instant))
      .map((p) => [p.type, p.value]),
  );
  return {
    y: Number(parts.year),
    m: Number(parts.month),
    d: Number(parts.day),
    h: Number(parts.hour),
    min: Number(parts.minute),
  };
}

const dayKey = (instant: Date | string | number, tz: string) => {
  const { y, m, d } = wall(instant, tz);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};

function midnight(key: string, tz: string) {
  const [y, m, d] = key.split("-").map(Number);
  const target = Date.UTC(y, m - 1, d);
  let guess = target;
  for (let i = 0; i < 2; i++) {
    const w = wall(guess, tz);
    guess += target - Date.UTC(w.y, w.m - 1, w.d, w.h, w.min);
  }
  return new Date(guess);
}

const shiftDay = (key: string, days: number) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days, 12)).toISOString().slice(0, 10);
};

/** Days before today each range reaches back, today included. */
const DAYS_BACK: Record<RangeKey, number> = { today: 0, "7d": 6, "30d": 29, "90d": 89, all: 0 };

/** The UTC instant a range starts, in the viewer's zone; null for all time. */
export function rangeStart(range: RangeKey, tz: string): string | null {
  if (range === "all") return null;
  const today = dayKey(Date.now(), tz);
  return midnight(shiftDay(today, -DAYS_BACK[range]), tz).toISOString();
}

/** "2m 05s", for call lengths in the feed. */
export function clock(sec: number) {
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return s ? `${m}m ${String(s).padStart(2, "0")}s` : `${m}m`;
}

/* -------------------------------------------------------------- campaigns */

type Tagged = { campaign: string | null; source: string | null; medium?: string | null };

/** `utm_campaign`, `?c=` and `?tag=` all land in `campaign`. */
export function campaignKey(row: Tagged) {
  if (row.campaign) return `c:${row.campaign}`;
  if (row.source) return `s:${row.source}`;
  return "direct";
}

function campaignLabel(row: Tagged) {
  if (row.campaign) return row.campaign;
  if (row.source) return row.medium ? `${row.source} (${row.medium})` : row.source;
  return "Direct";
}

function campaignDetail(row: Tagged) {
  return row.campaign ? [row.source, row.medium].filter(Boolean).join(" · ") : "";
}

/* ---------------------------------------------------------------- summary */

type Count = { label: string; count: number };

export type Summary = {
  generatedAt: string;
  range: RangeKey;
  tz: string;
  /** Tables the database doesn't have yet. */
  missing: string[];
  campaignOptions: { key: string; label: string; visits: number }[];
  kpis: {
    visits: number;
    talked: number;
    talkedRate: number;
    leads: number;
    booked: number;
    cancelled: number;
    converted: number;
    conversion: number;
    liveNow: number;
  };
  funnel: {
    key: string;
    label: string;
    hint: string;
    count: number;
    ofTop: number;
    ofPrev: number;
  }[];
  paths: {
    key: PathKey;
    label: string;
    converts: string;
    opened: number;
    started: number;
    converted: number;
    rate: number | null;
  }[];
  openedFrom: Count[];
  sources: {
    key: string;
    label: string;
    detail: string;
    visits: number;
    talked: number;
    interested: number;
    converted: number;
    rate: number;
  }[];
  leads: {
    id: string;
    at: string;
    path: string;
    email: string;
    detail: string | null;
    href: string | null;
    source: string;
  }[];
  leadsTotal: number;
  bookings: {
    uid: string;
    createdAt: string;
    startAt: string;
    name: string;
    email: string;
    agency: string | null;
    clients: string | null;
    source: string;
    status: string;
  }[];
  bookingsTotal: number;
  calls: {
    id: string;
    at: string;
    updatedAt: string;
    mode: string;
    seconds: number;
    turns: number;
    flows: string[];
    ended: string;
    live: boolean;
    source: string;
  }[];
  callsTotal: number;
  series: { key: string; label: string; visits: number; converted: number }[];
  seriesUnit: "hour" | "day";
  trailer: { plays: number; reached: Count[] };
  stoppedAt: Count[];
  feed: { id: number; at: string; text: string; who: string; tone: "step" | "win" | "exit" | "plain" }[];
  live: { visitor: string; campaign: string; section: string; step: string; device: string }[];
};

const share = (part: number, whole: number) => (whole ? part / whole : 0);

/** Old rows can carry the earlier 7-step funnel; anything past 4 is converted. */
const stepOf = (v: Visit) => Math.min(v.furthest_step, CONVERTED);

const stepLabel = (step: number) => FUNNEL[Math.min(step, FUNNEL.length - 1)].label;

const isPath = (value: unknown): value is PathKey =>
  typeof value === "string" && PATHS.some((p) => p.key === value);

/** The path a `flow_open` counts toward: `props.path`, else the flow's own. */
function pathOfOpen(event: EventRow): PathKey | null {
  const props = event.props ?? {};
  if ("path" in props) return isPath(props.path) ? props.path : null;
  return FLOWS[event.name ?? ""]?.path ?? null;
}

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;

/** Every event the page sends, in a few words. */
function describe(event: EventRow): { text: string; tone: Summary["feed"][number]["tone"] } | null {
  const name = event.name ?? "";
  const props = (event.props ?? {}) as Record<string, unknown>;
  const num = (key: string) => {
    const n = Number(props[key]);
    return Number.isFinite(n) ? n : null;
  };
  switch (event.type) {
    case "view":
      return {
        text: name.includes("/confirmed")
          ? "Opened confirmation"
          : name.includes("/manage")
            ? "Opened manage page"
            : "Landed",
        tone: "plain",
      };
    case "section":
      return { text: `Viewing ${SECTIONS[name] ?? name}`, tone: "plain" };
    case "scroll":
      return { text: `Scrolled ${name}%`, tone: "plain" };
    case "click":
      return { text: `Clicked “${name}”`, tone: "plain" };
    case "exit":
      return { text: `Left for ${name}`, tone: "exit" };
    case "hide":
      return { text: "Left the tab", tone: "exit" };
    case "return":
      return { text: "Back on the tab", tone: "plain" };
    case "step":
      // Interested and Started arrive with the flow_open / path_start that
      // set them, which say more.
      return name === "engaged" ? { text: "Engaged", tone: "step" } : null;
    case "flow_open": {
      const from = typeof props.from === "string" ? (FROM[props.from] ?? props.from) : null;
      return { text: `Opened ${flowLabel(name)}${from ? ` · ${from}` : ""}`, tone: "step" };
    }
    case "flow_close":
      return { text: `Closed ${flowLabel(name)}`, tone: "plain" };
    case "path_start":
      return { text: `Started ${PATH_LABEL[name] ?? name}`, tone: "step" };
    case "lead":
      return { text: `Lead · ${PATH_LABEL[name] ?? name}`, tone: "win" };
    case "lead_error":
      return { text: `Lead error (${name})`, tone: "exit" };
    case "call_start":
      return { text: name === "chat" ? "Chat started" : "Call started", tone: "step" };
    case "call_end": {
      const parts = [name === "chat" ? "Chat ended" : "Call ended"];
      const seconds = num("seconds");
      const turns = num("turns");
      if (seconds !== null) parts.push(clock(seconds));
      if (turns) parts.push(plural(turns, "turn"));
      const by = typeof props.ended_by === "string" ? ENDED[props.ended_by] : undefined;
      if (by) parts.push(by);
      return { text: parts.join(" · "), tone: "plain" };
    }
    case "trailer_play":
      return { text: "Played trailer", tone: "step" };
    case "trailer_progress":
      return { text: `Trailer ${name}%`, tone: name === "100" ? "step" : "plain" };
    case "day":
      return { text: `Viewed ${name}`, tone: "plain" };
    case "time":
      return { text: `Picked a time${props.day ? ` · ${props.day}` : ""}`, tone: "step" };
    case "change_time":
      return { text: "Changed time", tone: "plain" };
    case "tz":
      return { text: `Time zone ${name}`, tone: "plain" };
    case "month":
      return { text: `Month ${name}`, tone: "plain" };
    case "field":
      return { text: `Typed ${name}`, tone: "plain" };
    case "form_invalid":
      return { text: `Form error: ${name}`, tone: "exit" };
    case "submit":
      return { text: "Hit confirm", tone: "step" };
    case "booking_error":
      return { text: `Booking error (${name})`, tone: "exit" };
    case "booking_offline":
      return { text: "Calendar offline", tone: "exit" };
    case "booked":
      return { text: "Booked a call", tone: "win" };
    case "booking_cancelled":
      return { text: "Cancelled booking", tone: "exit" };
    case "booking_rescheduled":
      return { text: "Rescheduled", tone: "plain" };
    case "reschedule_submit":
      return { text: "Moving booking", tone: "plain" };
    case "cancel_submit":
      return { text: "Cancelling booking", tone: "plain" };
    case "guide_files":
      return { text: `Added ${plural(Number(name) || 0, "file")}`, tone: "plain" };
    case "guide_sent":
      return { text: "Sent guide files", tone: "step" };
    case "guide_error":
      return { text: `Upload error (${name})`, tone: "exit" };
    case "guide_refused":
      return { text: `${plural(Number(name) || 0, "file")} refused`, tone: "exit" };
    case "deliverable_page":
      return { text: `${flowLabel(name)} p.${num("page") ?? "?"}`, tone: "plain" };
    case "deliverable_zoom":
      return { text: `Zoomed ${flowLabel(name)} p.${num("page") ?? "?"}`, tone: "plain" };
    case "microsite_open":
      return { text: "Opened live microsite", tone: "plain" };
    case "slots":
      // The calendar loading its times: the page, not the visitor.
      return null;
    default:
      // Never drop a new event silently: say its raw name.
      return { text: `${event.type.replace(/_/g, " ")}${name ? ` · ${name}` : ""}`, tone: "plain" };
  }
}

export function summarize(
  snap: Snapshot,
  { range, tz, campaign }: { range: RangeKey; tz: string; campaign: string | null },
): Summary {
  const inCampaign = (row: Tagged) => !campaign || campaignKey(row) === campaign;

  // Options come from the unfiltered range, so the list never empties itself.
  const optionCounts = new Map<string, { label: string; visits: number }>();
  for (const v of snap.visits) {
    const key = campaignKey(v);
    const entry = optionCounts.get(key) ?? { label: campaignLabel(v), visits: 0 };
    entry.visits++;
    optionCounts.set(key, entry);
  }
  const campaignOptions = [...optionCounts.entries()]
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.visits - a.visits);

  const visits = snap.visits.filter(inCampaign);
  const visitIds = new Set(visits.map((v) => v.id));
  const bookingRows = snap.bookings.filter(inCampaign);
  const leadRows = snap.leads.filter(inCampaign);
  const conversationRows = snap.conversations.filter(inCampaign);
  const live = snap.live.filter(inCampaign);
  const events = snap.pathEvents.filter((e) => visitIds.has(e.visit_id));

  /* Who did what, per visit ------------------------------------------------ */
  const talked = new Set<string>();
  for (const c of snap.conversations) if (c.visit_id && visitIds.has(c.visit_id)) talked.add(c.visit_id);

  const opened = new Map<PathKey, Set<string>>(PATHS.map((p) => [p.key, new Set()]));
  const started = new Map<PathKey, Set<string>>(PATHS.map((p) => [p.key, new Set()]));
  const converted = new Map<PathKey, Set<string>>(PATHS.map((p) => [p.key, new Set()]));
  const from = new Map<string, number>();
  const trailerPlays = new Set<string>();
  const trailerMarks = new Map<string, Set<string>>(["25", "50", "75", "100"].map((m) => [m, new Set()]));

  for (const e of events) {
    if (e.type === "flow_open") {
      const path = pathOfOpen(e);
      if (path) opened.get(path)!.add(e.visit_id);
      const source = typeof e.props?.from === "string" ? e.props.from : "unknown";
      from.set(source, (from.get(source) ?? 0) + 1);
    } else if (e.type === "path_start") {
      if (isPath(e.name)) started.get(e.name)!.add(e.visit_id);
    } else if (e.type === "call_start") {
      talked.add(e.visit_id);
    } else if (e.type === "trailer_play") {
      trailerPlays.add(e.visit_id);
    } else if (e.type === "trailer_progress") {
      trailerMarks.get(e.name ?? "")?.add(e.visit_id);
    }
  }
  // Leads convert their own path; a booking converts "book".
  for (const l of snap.leads) {
    if (l.visit_id && visitIds.has(l.visit_id) && isPath(l.path)) converted.get(l.path)!.add(l.visit_id);
  }
  for (const v of visits) if (v.booked) converted.get("book")!.add(v.id);

  /* KPIs ----------------------------------------------------------------- */
  const reached = (step: number) => visits.filter((v) => stepOf(v) >= step).length;
  const convertedVisits = reached(CONVERTED);
  const activeBookings = bookingRows.filter((b) => b.status !== "cancelled");

  const kpis: Summary["kpis"] = {
    visits: visits.length,
    talked: talked.size,
    talkedRate: share(talked.size, visits.length),
    leads: leadRows.length,
    booked: activeBookings.length,
    cancelled: bookingRows.length - activeBookings.length,
    converted: convertedVisits,
    conversion: share(convertedVisits, visits.length),
    liveNow: live.length,
  };

  /* Funnel --------------------------------------------------------------- */
  const funnel = FUNNEL.map((f, i) => {
    const count = reached(f.step);
    const prev = i === 0 ? count : reached(FUNNEL[i - 1].step);
    return {
      key: f.key,
      label: f.label,
      hint: f.hint,
      count,
      ofTop: share(count, visits.length),
      ofPrev: share(count, prev),
    };
  });

  /* Paths ------------------------------------------------------------------ */
  const paths: Summary["paths"] = PATHS.map((p) => {
    const o = opened.get(p.key)!.size;
    const c = converted.get(p.key)!.size;
    return {
      key: p.key,
      label: p.label,
      converts: p.converts,
      opened: o,
      started: started.get(p.key)!.size,
      converted: c,
      rate: o ? c / o : null,
    };
  });

  const openedFrom = [...from.entries()]
    .map(([key, count]) => ({ label: FROM[key] ?? key, count }))
    .sort((a, b) => b.count - a.count);

  /* Over time ------------------------------------------------------------ */
  const seriesUnit: Summary["seriesUnit"] = range === "today" ? "hour" : "day";
  const series: Summary["series"] = [];
  if (seriesUnit === "hour") {
    const nowHour = wall(Date.now(), tz).h;
    for (let h = 0; h <= nowHour; h++) {
      const label = h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`;
      series.push({ key: String(h), label, visits: 0, converted: 0 });
    }
    for (const v of visits) {
      const bucket = series[wall(v.started_at, tz).h];
      if (!bucket) continue;
      bucket.visits++;
      if (stepOf(v) >= CONVERTED) bucket.converted++;
    }
  } else {
    const today = dayKey(Date.now(), tz);
    const back =
      range === "all"
        ? Math.min(
            364,
            visits.length
              ? Math.round(
                  (midnight(today, tz).getTime() -
                    midnight(dayKey(visits[visits.length - 1].started_at, tz), tz).getTime()) /
                    86_400_000,
                )
              : 6,
          )
        : DAYS_BACK[range];
    const index = new Map<string, Summary["series"][number]>();
    for (let i = back; i >= 0; i--) {
      const key = shiftDay(today, -i);
      const [, m, d] = key.split("-").map(Number);
      const entry = { key, label: `${m}/${d}`, visits: 0, converted: 0 };
      index.set(key, entry);
      series.push(entry);
    }
    for (const v of visits) {
      const bucket = index.get(dayKey(v.started_at, tz));
      if (!bucket) continue;
      bucket.visits++;
      if (stepOf(v) >= CONVERTED) bucket.converted++;
    }
  }

  /* Sources ---------------------------------------------------------------- */
  const groups = new Map<string, Visit[]>();
  for (const v of visits) {
    const key = campaignKey(v);
    const rows = groups.get(key);
    if (rows) rows.push(v);
    else groups.set(key, [v]);
  }
  const sources = [...groups.entries()]
    .map(([key, rows]) => {
      const done = rows.filter((v) => stepOf(v) >= CONVERTED).length;
      return {
        key,
        label: campaignLabel(rows[0]),
        detail: campaignDetail(rows[0]),
        visits: rows.length,
        talked: rows.filter((v) => talked.has(v.id)).length,
        interested: rows.filter((v) => stepOf(v) >= 2).length,
        converted: done,
        rate: share(done, rows.length),
      };
    })
    .sort((a, b) => b.visits - a.visits || b.converted - a.converted);

  /* Where non-converters stopped ----------------------------------------- */
  const notConverted = visits.filter((v) => stepOf(v) < CONVERTED);
  const stoppedAt = FUNNEL.slice(0, -1).map((f) => ({
    label: f.label,
    count: notConverted.filter((v) => stepOf(v) === f.step).length,
  }));

  /* Leads, bookings, calls ------------------------------------------------- */
  const leads = leadRows.slice(0, 50).map((l) => {
    let detail: string | null = null;
    let href: string | null = null;
    if (l.client_url) {
      href = /^https?:\/\//i.test(l.client_url) ? l.client_url : `https://${l.client_url}`;
      detail = l.client_url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
    } else if (l.file_count != null) {
      detail = plural(l.file_count, "file");
    }
    return {
      id: l.id,
      at: l.created_at,
      path: PATH_LABEL[l.path] ?? l.path,
      email: l.email,
      detail,
      href,
      source: campaignLabel(l),
    };
  });

  const bookings = bookingRows.slice(0, 50).map((b) => ({
    uid: b.uid,
    createdAt: b.created_at,
    startAt: b.start_at,
    name: b.name,
    email: b.email,
    agency: b.agency,
    clients: b.client_count,
    source: campaignLabel(b),
    status: b.status,
  }));

  const liveVisits = new Set(snap.live.map((v) => v.id));
  const now = Date.now();
  const calls = conversationRows.slice(0, 50).map((c) => ({
    id: c.id,
    at: c.started_at,
    updatedAt: c.updated_at,
    mode: c.mode,
    seconds: Math.round(c.duration_ms / 1000),
    turns: c.turns,
    flows: c.flows.map(flowLabel),
    ended: c.ended_by ? (ENDED[c.ended_by] ?? c.ended_by) : "",
    live:
      !c.ended_at &&
      (now - new Date(c.updated_at).getTime() < 90_000 ||
        (c.visit_id !== null && liveVisits.has(c.visit_id))),
    source: campaignLabel(c),
  }));

  /* Live ------------------------------------------------------------------- */
  const feed: Summary["feed"] = [];
  // By when it happened, not when it arrived: a booking is written server-side
  // and can land a beat before the browser's last beacon.
  const recent = [...snap.recent].sort((a, b) => b.at.localeCompare(a.at) || b.id - a.id);
  for (const event of recent) {
    const visit = snap.feedVisits[event.visit_id];
    if (!visit || visit.page !== TRACKED_PAGE || !inCampaign(visit)) continue;
    const described = describe(event);
    if (!described) continue;
    feed.push({
      id: event.id,
      at: event.at,
      ...described,
      who: [campaignLabel(visit), visit.device, visit.city].filter(Boolean).join(" · "),
    });
    if (feed.length >= 40) break;
  }

  return {
    generatedAt: new Date().toISOString(),
    range,
    tz,
    missing: snap.missing,
    campaignOptions,
    kpis,
    funnel,
    paths,
    openedFrom,
    sources,
    leads,
    leadsTotal: leadRows.length,
    bookings,
    bookingsTotal: bookingRows.length,
    calls,
    callsTotal: conversationRows.length,
    series,
    seriesUnit,
    trailer: {
      plays: trailerPlays.size,
      reached: [...trailerMarks.entries()].map(([mark, ids]) => ({ label: `${mark}%`, count: ids.size })),
    },
    stoppedAt,
    feed,
    live: live.map((v) => ({
      visitor: v.visitor_id.slice(0, 6),
      campaign: campaignLabel(v),
      section: v.last_section ? (SECTIONS[v.last_section] ?? v.last_section) : "—",
      step: stepLabel(stepOf(v)),
      device: v.device ?? "—",
    })),
  };
}
