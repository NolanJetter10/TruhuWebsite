/**
 * The contract between the tracker in the browser and `/api/track`.
 *
 * The browser never sends wall-clock times: each event carries how long ago it
 * happened (`ago`, in ms) and the server stamps it against its own clock, so a
 * visitor whose laptop is an hour off still lands in the right place on the
 * dashboard.
 *
 * The same column names are what `analytics dashboard/supabase/schema.sql`
 * defines, and what the dashboard reads back.
 */

/**
 * The page the funnel is for. Its confirmation and manage pages resume the
 * same visit under this id, and the dashboard filters on it. Visits recorded
 * under the old id, "/get-started", were localhost tests.
 */
export const TRACKED_PAGE = "/BryanKleppe";

/**
 * How far into the page a visit got. A visit's `furthest_step` only ever goes
 * up. The dashboard draws its funnel from these, so a change here is a change
 * there too.
 *
 * Steps 2 and 3 are reached inside the tracker (a `flow_open` event, and
 * `startPath()`), so components never name a step. Step 4 is set by the
 * server alone, when a lead or a booking is saved: the browser can claim at
 * most `started`, and /api/track clamps it there.
 */
export const FUNNEL = [
  { step: 0, key: "landed", label: "Landed", hint: "Opened the page" },
  {
    step: 1,
    key: "engaged",
    label: "Engaged",
    hint: "Stayed 10 seconds, scrolled, or clicked",
  },
  { step: 2, key: "interested", label: "Interested", hint: "Opened one of Bryan's flows" },
  {
    step: 3,
    key: "started",
    label: "Started",
    hint: "Viewed a sample, typed in a form, added a file or picked a time",
  },
  {
    step: 4,
    key: "converted",
    label: "Converted",
    hint: "Sent a request or booked a call",
  },
] as const;

export type FunnelKey = (typeof FUNNEL)[number]["key"];

export const STEP: Record<FunnelKey, number> = Object.fromEntries(
  FUNNEL.map((f) => [f.key, f.step]),
) as Record<FunnelKey, number>;

/**
 * The ways forward Bryan offers on /BryanKleppe, each counted on its own:
 * how many visits opened it, started it and converted on it. See
 * site-log/plans/2026-11-02-bryan-paths-and-analytics.md.
 */
export const PATHS = [
  { key: "samples", label: "See samples" },
  { key: "build", label: "Build a guide" },
  { key: "rebuild", label: "Rebuild last year's guide" },
  { key: "book", label: "Book a call" },
] as const;

export type Path = (typeof PATHS)[number]["key"];

/** Where a visit's campaign came from, strongest first. */
export type Attribution = "url" | "stored" | "referrer" | "direct";

export type Touch = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  clickId?: string;
};

export type BeaconVisit = Touch & {
  id: string;
  visitorId: string;
  page: string;
  returning: boolean;
  attribution: Attribution;
  referrer?: string;
  fromPath?: string;
  landingUrl: string;
  /** ms since the visit began, by the browser's clock. */
  startedAgo: number;
  engagedMs: number;
  maxScroll: number;
  step: number;
  section?: string;
  exit?: string;
};

export type BeaconEvent = {
  type: string;
  name?: string;
  /** ms between the event and the beacon leaving the browser. */
  ago: number;
  props?: Record<string, string | number | boolean | null>;
};

export type Beacon = {
  v: 1;
  visit: BeaconVisit;
  events: BeaconEvent[];
};

/** How a call or chat with Bryan's AI ended. */
export const ENDED_BY = [
  "visitor", // pressed End call
  "left", // the page was closed or navigated away from
  "error", // the call failed to start or broke
  "denied", // no microphone
  "dropped", // the connection closed by itself
] as const;

export type EndedBy = (typeof ENDED_BY)[number];

/** A transcript stops growing here, and each line is cut to this many characters. */
export const MAX_TRANSCRIPT = 400;
export const MAX_LINE = 2_000;

/**
 * One call or typed chat, as lib/analytics/conversation.ts posts it to
 * /api/conversation: whole each time, with times as `ago` like the beacon.
 */
export type ConversationBeacon = {
  /** Made in the browser, one per call or chat. */
  id: string;
  mode: "call" | "chat";
  startedAgo: number;
  endedAgo?: number;
  durationMs: number;
  endedBy?: EndedBy;
  /** Lines the visitor said or typed. */
  turns: number;
  /** Flows opened during it, in order. */
  flows: string[];
  transcript: { role: "visitor" | "bryan"; text: string; ago: number }[];
  /** trackingContext(): the visit and campaign. */
  context: {
    visitId: string;
    visitorId: string;
    source?: string;
    medium?: string;
    campaign?: string;
  } | null;
};

/**
 * Query parameters read as campaign tags. `tag` and `c` are short aliases for
 * links typed by hand: /BryanKleppe?tag=linkedin-oct.
 */
export const TAG_PARAMS = {
  source: ["utm_source", "src"],
  medium: ["utm_medium"],
  campaign: ["utm_campaign", "tag", "c"],
  content: ["utm_content"],
  term: ["utm_term"],
} as const;

/** Ad click ids, in the order they are checked. Only the name is kept. */
export const CLICK_IDS = ["gclid", "li_fat_id", "fbclid", "msclkid"] as const;
