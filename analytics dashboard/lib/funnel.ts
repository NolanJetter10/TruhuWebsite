/**
 * The names the website records, and what the dashboard calls them. This
 * mirrors FUNNEL, PATHS and PATH_OF_FLOW on the website (lib/analytics/schema.ts
 * and components/get-started/flows.ts); the contract between the two is
 * site-log/plans/2026-11-02-bryan-paths-and-analytics.md. When this app moves
 * to its own repo, change both sides together.
 */

/** The page id the website records for Bryan's page and its follow-ons. */
export const TRACKED_PAGE = "/BryanKleppe";

/** `visits.furthest_step`. The browser sends up to 3; leads and bookings set 4. */
export const FUNNEL = [
  { step: 0, key: "landed", label: "Landed", hint: "Page loaded" },
  { step: 1, key: "engaged", label: "Engaged", hint: "10 s active, a scroll or a click" },
  { step: 2, key: "interested", label: "Interested", hint: "Opened any popup" },
  {
    step: 3,
    key: "started",
    label: "Started",
    hint: "Viewed a sample, typed in a form, added a file or picked a time",
  },
  { step: 4, key: "converted", label: "Converted", hint: "Lead or booking saved" },
] as const;

export const CONVERTED = 4;

/** Bryan's ways forward, and what converts each. */
export const PATHS = [
  { key: "samples", label: "Samples", converts: "Work email sent from the sample picker" },
  { key: "build", label: "Build a guide", converts: "Build request sent" },
  { key: "rebuild", label: "Rebuild last year's guide", converts: "Last year's guide uploaded" },
  { key: "book", label: "Book a call", converts: "Booking saved" },
] as const;

export type PathKey = (typeof PATHS)[number]["key"];

export const PATH_LABEL: Record<string, string> = Object.fromEntries(
  PATHS.map((p) => [p.key, p.label]),
);

/** Each popup's name, and the path it belongs to (`options` has none). */
export const FLOWS: Record<string, { label: string; path: PathKey | null }> = {
  options: { label: "Chooser", path: null },
  samples: { label: "Sample picker", path: "samples" },
  sampleGuide: { label: "Sample guide", path: "samples" },
  flipbook: { label: "Flipbook", path: "samples" },
  microsite: { label: "Microsite", path: "samples" },
  flyer: { label: "Flyer", path: "samples" },
  build: { label: "Build form", path: "build" },
  guide: { label: "Guide upload", path: "rebuild" },
  calendar: { label: "Calendar", path: "book" },
  trailer: { label: "Trailer", path: "book" },
};

export const flowLabel = (flow: string) => FLOWS[flow]?.label ?? flow;

/** `props.from` on `flow_open`: what opened the popup. */
export const FROM: Record<string, string> = {
  call: "Bryan's call",
  chat: "Chat",
  buildButton: "Call-card button",
  links: "Links",
  options: "Chooser",
  samples: "Picker",
  trailer: "Trailer",
  realBryan: "Real Bryan button",
  book: "Book button",
};

/** `conversations.ended_by`. */
export const ENDED: Record<string, string> = {
  visitor: "Visitor ended",
  left: "Left page",
  error: "Error",
  denied: "Mic denied",
  dropped: "Dropped",
};

/** The page's `data-section` blocks and popups. */
export const SECTIONS: Record<string, string> = {
  intro: "Intro",
  chat: "Chat",
  links: "Links",
  outcomes: "Links",
  proof: "Proof",
  calendar: "Calendar",
  confirmed: "Confirmed",
  note: "Note",
  manage: "Manage",
  "flow-calendar": "Calendar popup",
  "flow-guide": "Guide upload",
  "flow-microsite": "Microsite",
  "flow-sampleGuide": "Sample guide",
  "flow-flyer": "Flyer",
  "flow-flipbook": "Flipbook",
  "flow-options": "Chooser",
  "flow-samples": "Sample picker",
  "flow-build": "Build form",
  "flow-trailer": "Trailer",
};
