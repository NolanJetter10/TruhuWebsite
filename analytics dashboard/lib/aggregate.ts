import { FUNNEL, SECTIONS } from "./funnel";
import type { BookingRow, EventRow, Snapshot, Visit } from "./store";

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

/* -------------------------------------------------------------- campaigns */

type Tagged = { campaign: string | null; source: string | null; medium?: string | null };

export function campaignKey(row: Tagged) {
  if (row.campaign) return `c:${row.campaign}`;
  if (row.source) return `s:${row.source}`;
  return "direct";
}

function campaignLabel(row: Tagged) {
  if (row.campaign) return row.campaign;
  if (row.source) return row.medium ? `${row.source} (${row.medium})` : row.source;
  return "Direct / untagged";
}

function campaignDetail(row: Tagged) {
  if (row.campaign) return [row.source, row.medium].filter(Boolean).join(" · ") || "tagged link";
  if (row.source) return "no campaign tag";
  return "typed in, bookmarked, or untagged link";
}

/* ---------------------------------------------------------------- summary */

export type Summary = {
  generatedAt: string;
  range: RangeKey;
  tz: string;
  campaignOptions: { key: string; label: string; visits: number }[];
  kpis: {
    visits: number;
    visitors: number;
    returning: number;
    engaged: number;
    sawCalendar: number;
    bookedVisits: number;
    bookings: number;
    cancelled: number;
    conversion: number;
    medianEngagedSec: number;
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
  biggestDrop: { from: string; to: string; lost: number; share: number } | null;
  series: { key: string; label: string; visits: number; booked: number }[];
  seriesUnit: "hour" | "day";
  timeBuckets: { label: string; count: number }[];
  campaigns: {
    key: string;
    label: string;
    detail: string;
    visits: number;
    engagedRate: number;
    calendarRate: number;
    booked: number;
    conversion: number;
    medianEngagedSec: number;
  }[];
  stoppedAt: { label: string; count: number }[];
  leftFrom: { label: string; count: number }[];
  exits: { label: string; count: number }[];
  devices: { label: string; count: number }[];
  bookings: {
    uid: string;
    createdAt: string;
    startAt: string;
    name: string;
    email: string;
    agency: string | null;
    clients: string | null;
    campaign: string;
    status: string;
  }[];
  retarget: {
    visitor: string;
    lastSeen: string;
    campaign: string;
    step: string;
    engagedSec: number;
    device: string;
    place: string;
    returning: boolean;
  }[];
  retargetTotal: number;
  feed: { id: number; at: string; text: string; who: string; tone: "step" | "win" | "exit" | "plain" }[];
  live: { visitor: string; campaign: string; section: string; step: string; place: string; device: string }[];
};

const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const share = (part: number, whole: number) => (whole ? part / whole : 0);

function countBy<T>(items: T[], key: (item: T) => string | null | undefined, limit = 8) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

const place = (v: Visit) => [v.city, v.region, v.country].filter(Boolean).join(", ") || "—";

const stepLabel = (step: number) => FUNNEL[Math.min(step, FUNNEL.length - 1)].label;

function describe(event: EventRow): { text: string; tone: Summary["feed"][number]["tone"] } | null {
  const name = event.name ?? "";
  switch (event.type) {
    case "view":
      return {
        text: name.includes("confirmed") ? "Opened the confirmation page" : "Landed on the page",
        tone: "plain",
      };
    case "section":
      return { text: `Read “${SECTIONS[name] ?? name}”`, tone: "plain" };
    case "scroll":
      return { text: `Scrolled ${name}% down`, tone: "plain" };
    case "step": {
      const step = FUNNEL.find((f) => f.key === name);
      return step ? { text: `Reached: ${step.label}`, tone: "step" } : null;
    }
    case "day":
      return { text: `Looked at times on ${name}`, tone: "plain" };
    case "time": {
      const props = event.props as { day?: string } | null;
      return { text: `Picked a time${props?.day ? ` on ${props.day}` : ""}`, tone: "step" };
    }
    case "change_time":
      return { text: "Went back to change the time", tone: "plain" };
    case "field":
      return { text: `Started the ${name} field`, tone: "plain" };
    case "form_invalid":
      return { text: `Form error on: ${name}`, tone: "exit" };
    case "submit":
      return { text: "Hit confirm", tone: "step" };
    case "booked":
      return { text: "Booked a demo", tone: "win" };
    case "booking_error":
      return { text: `Booking error (${name})`, tone: "exit" };
    case "booking_cancelled":
      return { text: "Cancelled their booking", tone: "exit" };
    case "booking_rescheduled":
      return { text: "Rescheduled their booking", tone: "plain" };
    case "click":
      return { text: `Clicked “${name}”`, tone: "plain" };
    case "exit":
      return { text: `Left for ${name}`, tone: "exit" };
    case "hide":
      return { text: "Switched tabs or closed the page", tone: "exit" };
    case "return":
      return { text: "Came back to the tab", tone: "plain" };
    case "tz":
      return { text: `Changed time zone to ${name}`, tone: "plain" };
    case "month":
      return { text: `Browsed to ${name}`, tone: "plain" };
    case "booking_offline":
      return { text: "Saw the booking-offline fallback", tone: "exit" };
    default:
      return null;
  }
}

const TIME_BUCKETS: [number, string][] = [
  [10, "Under 10s"],
  [30, "10–30s"],
  [60, "30s–1m"],
  [120, "1–2m"],
  [300, "2–5m"],
  [Infinity, "5m+"],
];

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
  const bookingRows = snap.bookings.filter(inCampaign);
  const live = snap.live.filter(inCampaign);

  /* KPIs ----------------------------------------------------------------- */
  const reached = (step: number) => visits.filter((v) => v.furthest_step >= step).length;
  const bookedVisits = visits.filter((v) => v.booked).length;
  const activeBookings = bookingRows.filter((b) => b.status !== "cancelled");

  const kpis: Summary["kpis"] = {
    visits: visits.length,
    visitors: new Set(visits.map((v) => v.visitor_id)).size,
    returning: visits.filter((v) => v.returning_visitor).length,
    engaged: reached(1),
    sawCalendar: reached(2),
    bookedVisits,
    bookings: activeBookings.length,
    cancelled: bookingRows.length - activeBookings.length,
    conversion: share(bookedVisits, visits.length),
    medianEngagedSec: Math.round(median(visits.map((v) => v.engaged_ms / 1000))),
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

  let biggestDrop: Summary["biggestDrop"] = null;
  for (let i = 1; i < funnel.length; i++) {
    const lost = funnel[i - 1].count - funnel[i].count;
    if (lost > 0 && (!biggestDrop || lost > biggestDrop.lost)) {
      biggestDrop = {
        from: funnel[i - 1].label,
        to: funnel[i].label,
        lost,
        share: share(lost, funnel[i - 1].count),
      };
    }
  }

  /* Over time ------------------------------------------------------------ */
  const seriesUnit: Summary["seriesUnit"] = range === "today" ? "hour" : "day";
  const series: Summary["series"] = [];
  if (seriesUnit === "hour") {
    const nowHour = wall(Date.now(), tz).h;
    for (let h = 0; h <= nowHour; h++) {
      const label = h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`;
      series.push({ key: String(h), label, visits: 0, booked: 0 });
    }
    for (const v of visits) {
      const bucket = series[wall(v.started_at, tz).h];
      if (!bucket) continue;
      bucket.visits++;
      if (v.booked) bucket.booked++;
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
      const entry = { key, label: `${m}/${d}`, visits: 0, booked: 0 };
      index.set(key, entry);
      series.push(entry);
    }
    for (const v of visits) {
      const bucket = index.get(dayKey(v.started_at, tz));
      if (!bucket) continue;
      bucket.visits++;
      if (v.booked) bucket.booked++;
    }
  }

  /* Time on page ---------------------------------------------------------- */
  const timeBuckets = TIME_BUCKETS.map(([, label]) => ({ label, count: 0 }));
  for (const v of visits) {
    const sec = v.engaged_ms / 1000;
    timeBuckets[TIME_BUCKETS.findIndex(([max]) => sec < max)].count++;
  }

  /* Campaigns ------------------------------------------------------------- */
  const groups = new Map<string, Visit[]>();
  for (const v of visits) {
    const key = campaignKey(v);
    const rows = groups.get(key);
    if (rows) rows.push(v);
    else groups.set(key, [v]);
  }
  const campaigns = [...groups.entries()]
    .map(([key, rows]) => {
      const booked = rows.filter((v) => v.booked).length;
      return {
        key,
        label: campaignLabel(rows[0]),
        detail: campaignDetail(rows[0]),
        visits: rows.length,
        engagedRate: share(rows.filter((v) => v.furthest_step >= 1).length, rows.length),
        calendarRate: share(rows.filter((v) => v.furthest_step >= 2).length, rows.length),
        booked,
        conversion: share(booked, rows.length),
        medianEngagedSec: Math.round(median(rows.map((v) => v.engaged_ms / 1000))),
      };
    })
    .sort((a, b) => b.visits - a.visits || b.booked - a.booked);

  /* Where non-bookers stopped -------------------------------------------- */
  const didNotBook = visits.filter((v) => !v.booked);
  const stoppedAt = FUNNEL.slice(0, -1).map((f) => ({
    label: f.label,
    count: didNotBook.filter((v) => v.furthest_step === f.step).length,
  }));
  const leftFrom = countBy(didNotBook, (v) =>
    v.last_section ? (SECTIONS[v.last_section] ?? v.last_section) : null,
  );
  const exits = countBy(didNotBook, (v) => v.exit_target);
  const devices = countBy(visits, (v) => v.device);

  /* Bookings -------------------------------------------------------------- */
  const bookings = bookingRows.slice(0, 50).map((b: BookingRow) => ({
    uid: b.uid,
    createdAt: b.created_at,
    startAt: b.start_at,
    name: b.name,
    email: b.email,
    agency: b.agency,
    clients: b.client_count,
    campaign: campaignLabel(b),
    status: b.status,
  }));

  /* Clicked but didn't book ------------------------------------------------ */
  const warm = didNotBook
    .filter((v) => v.furthest_step >= 2)
    .sort((a, b) => b.furthest_step - a.furthest_step || b.last_seen_at.localeCompare(a.last_seen_at));
  const retarget = warm.slice(0, 25).map((v) => ({
    visitor: v.visitor_id.slice(0, 6),
    lastSeen: v.last_seen_at,
    campaign: campaignLabel(v),
    step: stepLabel(v.furthest_step),
    engagedSec: Math.round(v.engaged_ms / 1000),
    device: v.device ?? "—",
    place: place(v),
    returning: v.returning_visitor,
  }));

  /* Live ------------------------------------------------------------------- */
  const feed: Summary["feed"] = [];
  // By when it happened, not when it arrived: a booking is written server-side
  // and can land a beat before the browser's last beacon.
  const recent = [...snap.recent].sort((a, b) => b.at.localeCompare(a.at) || b.id - a.id);
  for (const event of recent) {
    const visit = snap.feedVisits[event.visit_id];
    if (!visit || visit.page !== "/get-started" || !inCampaign(visit)) continue;
    const described = describe(event);
    if (!described) continue;
    feed.push({
      id: event.id,
      at: event.at,
      ...described,
      who: [campaignLabel(visit), visit.device, visit.city].filter(Boolean).join(" · "),
    });
    if (feed.length >= 30) break;
  }

  return {
    generatedAt: new Date().toISOString(),
    range,
    tz,
    campaignOptions,
    kpis,
    funnel,
    biggestDrop,
    series,
    seriesUnit,
    timeBuckets,
    campaigns,
    stoppedAt,
    leftFrom,
    exits,
    devices,
    bookings,
    retarget,
    retargetTotal: warm.length,
    feed,
    live: live.map((v) => ({
      visitor: v.visitor_id.slice(0, 6),
      campaign: campaignLabel(v),
      section: v.last_section ? (SECTIONS[v.last_section] ?? v.last_section) : "—",
      step: stepLabel(v.furthest_step),
      place: place(v),
      device: v.device ?? "—",
    })),
  };
}
