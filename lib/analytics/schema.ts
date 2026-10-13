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
 * How far into the page a visit got. A visit's `furthest_step` only ever goes
 * up. The dashboard draws its funnel from these, so a change here is a change
 * there too.
 */
export const FUNNEL = [
  { step: 0, key: "landed", label: "Landed", hint: "Opened the page" },
  {
    step: 1,
    key: "engaged",
    label: "Engaged",
    hint: "Stayed 10 seconds, scrolled, or clicked",
  },
  {
    step: 2,
    key: "calendar",
    label: "Saw the calendar",
    hint: "Engaged with the calendar on screen",
  },
  { step: 3, key: "time", label: "Picked a time", hint: "Chose a slot" },
  {
    step: 4,
    key: "details",
    label: "Started details",
    hint: "Began typing name, email or agency",
  },
  { step: 5, key: "submitted", label: "Hit confirm", hint: "Submitted the form" },
  { step: 6, key: "booked", label: "Booked", hint: "Meeting on the calendar" },
] as const;

export type FunnelKey = (typeof FUNNEL)[number]["key"];

export const STEP: Record<FunnelKey, number> = Object.fromEntries(
  FUNNEL.map((f) => [f.key, f.step]),
) as Record<FunnelKey, number>;

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

/** Query parameters read as campaign tags. `c` is a short alias for links typed by hand. */
export const TAG_PARAMS = {
  source: ["utm_source", "src"],
  medium: ["utm_medium"],
  campaign: ["utm_campaign", "c"],
  content: ["utm_content"],
  term: ["utm_term"],
} as const;

/** Ad click ids, in the order they are checked. Only the name is kept. */
export const CLICK_IDS = ["gclid", "li_fat_id", "fbclid", "msclkid"] as const;
