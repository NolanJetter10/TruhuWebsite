import {
  CLICK_IDS,
  STEP,
  TAG_PARAMS,
  type Attribution,
  type Beacon,
  type BeaconEvent,
  type FunnelKey,
  type Touch,
} from "./schema";
import { thirdPartyEvent } from "./third-party";

/**
 * First-party funnel tracking for the pages that matter: no third-party
 * script, no cookies. Two ids live in the browser's own storage — a visitor id
 * that survives across visits (localStorage) and a visit id that lasts for one
 * tab until 30 minutes of inactivity (sessionStorage) — and a visitor sending
 * Global Privacy Control or Do Not Track gets neither persisted: they are
 * counted, but every visit looks new.
 *
 * One tracker runs per tracked page. Everything it learns goes out in small
 * beacons to /api/track: a second or two after something happens, every 15
 * seconds as a heartbeat (which is what "on the page now" is built from), and
 * once more as the tab hides or the visitor navigates away.
 */

const KEYS = {
  visitor: "truhu_vid",
  lastVisit: "truhu_seen",
  touch: "truhu_touch",
  visit: "truhu_visit",
  path: "truhu_path",
} as const;

const VISIT_IDLE_MS = 30 * 60_000;
const TOUCH_TTL_MS = 90 * 24 * 60 * 60_000;
const REFERRER_TOUCH_TTL_MS = 30 * 24 * 60 * 60_000;
const ACTIVE_WINDOW_MS = 30_000;
const ENGAGED_AFTER_MS = 10_000;
const FLUSH_DELAY_MS = 1_200;
const HEARTBEAT_MS = 15_000;
const ENDPOINT = "/api/track";

/* ------------------------------------------------------------------ storage */

function read(store: "local" | "session", key: string) {
  try {
    return (store === "local" ? localStorage : sessionStorage).getItem(key);
  } catch {
    return null;
  }
}

function write(store: "local" | "session", key: string, value: string) {
  try {
    (store === "local" ? localStorage : sessionStorage).setItem(key, value);
  } catch {
    // Private mode or storage disabled: the visit simply is not remembered.
  }
}

function readJson<T>(store: "local" | "session", key: string): T | null {
  const raw = read(store, key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function uuid() {
  // randomUUID needs a secure context; plain-http previews fall through.
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function privacySignal() {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.globalPrivacyControl === true || nav.doNotTrack === "1";
}

/* -------------------------------------------------------------- attribution */

type StoredTouch = { touch: Touch; at: number; kind: "url" | "referrer" };

/** Campaign tags on a URL, or null when it carries none. */
export function readTouch(url: URL): Touch | null {
  const touch: Touch = {};
  for (const [field, names] of Object.entries(TAG_PARAMS) as [
    keyof typeof TAG_PARAMS,
    readonly string[],
  ][]) {
    for (const name of names) {
      const value = url.searchParams.get(name)?.trim();
      if (value) {
        touch[field] = value.slice(0, 160);
        break;
      }
    }
  }
  const clickId = CLICK_IDS.find((id) => url.searchParams.has(id));
  if (clickId) {
    touch.clickId = clickId;
    // An ad click with no tags still says which network it came from.
    touch.source ??= {
      gclid: "google",
      li_fat_id: "linkedin",
      fbclid: "facebook",
      msclkid: "bing",
    }[clickId];
  }
  return Object.keys(touch).length ? touch : null;
}

const REFERRERS: [RegExp, string, string][] = [
  [/(^|\.)linkedin\.com$|(^|\.)lnkd\.in$/, "linkedin", "social"],
  [/(^|\.)mail\.google\.com$|outlook\.(live|office)\.com$/, "email", "email"],
  [/(^|\.)google\.[a-z.]+$/, "google", "organic"],
  [/(^|\.)bing\.com$/, "bing", "organic"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo", "organic"],
  [/(^|\.)(facebook\.com|fb\.me)$/, "facebook", "social"],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, "x", "social"],
  [/(^|\.)chatgpt\.com$|(^|\.)perplexity\.ai$|(^|\.)claude\.ai$/, "ai-assistant", "referral"],
];

/** Where an external referrer points, or null for none or our own site. */
export function referrerTouch(referrer: string, ownHost: string): Touch | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host === ownHost.replace(/^www\./, "")) return null;
    const known = REFERRERS.find(([pattern]) => pattern.test(host));
    return known
      ? { source: known[1], medium: known[2] }
      : { source: host, medium: "referral" };
  } catch {
    return null;
  }
}

/**
 * Runs on every page of the site, so a campaign link pointed at the home page
 * still credits that campaign when the visitor clicks through to book. Tagged
 * links always win; a plain referrer is only kept when nothing more specific
 * was seen in the last 30 days.
 */
export function captureTouch() {
  if (privacySignal()) return;
  const now = Date.now();
  const tagged = readTouch(new URL(location.href));
  if (tagged) {
    write("local", KEYS.touch, JSON.stringify({ touch: tagged, at: now, kind: "url" }));
    return;
  }
  const fromReferrer = referrerTouch(document.referrer, location.hostname);
  if (!fromReferrer) return;
  const stored = readJson<StoredTouch>("local", KEYS.touch);
  const fresh = stored && now - stored.at < REFERRER_TOUCH_TTL_MS;
  if (!fresh) {
    write(
      "local",
      KEYS.touch,
      JSON.stringify({ touch: fromReferrer, at: now, kind: "referrer" }),
    );
  }
}

/** Keeps the last two paths in this tab, so a visit knows which page sent it. */
export function recordPath(pathname: string) {
  const trail = readJson<{ prev?: string; cur?: string }>("session", KEYS.path) ?? {};
  if (trail.cur === pathname) return;
  write("session", KEYS.path, JSON.stringify({ prev: trail.cur, cur: pathname }));
}

function previousPath(current: string) {
  const trail = readJson<{ prev?: string; cur?: string }>("session", KEYS.path);
  if (trail?.cur && trail.cur !== current) return trail.cur;
  if (trail?.prev && trail.prev !== current) return trail.prev;
  try {
    const ref = new URL(document.referrer);
    if (ref.hostname === location.hostname && ref.pathname !== current) {
      return ref.pathname;
    }
  } catch {}
  return undefined;
}

function resolveTouch(): { touch: Touch; attribution: Attribution } {
  const tagged = readTouch(new URL(location.href));
  if (tagged) return { touch: tagged, attribution: "url" };

  const stored = readJson<StoredTouch>("local", KEYS.touch);
  if (stored && Date.now() - stored.at < TOUCH_TTL_MS) {
    return {
      touch: stored.touch,
      attribution: stored.kind === "url" ? "stored" : "referrer",
    };
  }

  const fromReferrer = referrerTouch(document.referrer, location.hostname);
  if (fromReferrer) return { touch: fromReferrer, attribution: "referrer" };
  return { touch: {}, attribution: "direct" };
}

/* ------------------------------------------------------------------ tracker */

type VisitState = {
  id: string;
  page: string;
  startedAt: number;
  lastSeen: number;
  engagedMs: number;
  maxScroll: number;
  step: number;
};

class Tracker {
  readonly page: string;
  readonly visitorId: string;
  readonly returning: boolean;
  readonly touch: Touch;
  readonly attribution: Attribution;
  private readonly referrer?: string;
  private readonly fromPath?: string;
  private readonly landingUrl: string;
  private state: VisitState;
  private queue: BeaconEvent[] = [];
  private stamps = new WeakMap<BeaconEvent, number>();
  private section?: string;
  private exit?: string;
  private lastActivity = Date.now();
  private calendarInView = false;
  private flushTimer?: number;
  private ticker?: number;
  private heartbeat?: number;
  private scrollMarks = new Set<number>();
  private teardown: (() => void)[] = [];

  constructor(page: string) {
    this.page = page;
    const ephemeral = privacySignal();

    const storedVisitor = ephemeral ? null : read("local", KEYS.visitor);
    this.visitorId = storedVisitor ?? uuid();
    if (!storedVisitor && !ephemeral) write("local", KEYS.visitor, this.visitorId);
    this.returning = !ephemeral && read("local", KEYS.lastVisit) !== null;

    const now = Date.now();
    const saved = readJson<VisitState>("session", KEYS.visit);
    this.state =
      saved && saved.page === page && now - saved.lastSeen < VISIT_IDLE_MS
        ? saved
        : {
            id: uuid(),
            page,
            startedAt: now,
            lastSeen: now,
            engagedMs: 0,
            maxScroll: 0,
            step: 0,
          };

    // Under a privacy signal nothing stored is consulted; the URL still counts.
    const tagged = ephemeral ? readTouch(new URL(location.href)) : null;
    const resolved = ephemeral
      ? tagged
        ? { touch: tagged, attribution: "url" as Attribution }
        : { touch: {}, attribution: "direct" as Attribution }
      : resolveTouch();
    this.touch = resolved.touch;
    this.attribution = resolved.attribution;
    this.referrer = document.referrer || undefined;
    this.fromPath = previousPath(location.pathname);
    this.landingUrl = location.href;
  }

  get visitId() {
    return this.state.id;
  }

  start() {
    this.event("view", location.pathname);
    this.listen();
    this.flushSoon();
  }

  /* ---------------------------------------------------------- public API */

  event(type: string, name?: string, props?: BeaconEvent["props"]) {
    const event: BeaconEvent = { type, name, ago: 0, props };
    this.stamps.set(event, Date.now());
    this.queue.push(event);
    this.flushSoon();
  }

  /** Advance the funnel. Steps only ever go forward. */
  reach(key: FunnelKey) {
    let target = STEP[key];
    // "Saw the calendar" only counts once the visit is a real one, so a
    // desktop bounce with the calendar above the fold is not credited with it.
    if (key === "calendar" && this.state.step < STEP.engaged) return;
    if (key === "engaged" && this.calendarInView) target = STEP.calendar;
    if (target <= this.state.step) return;
    const from = this.state.step;
    this.state.step = target;
    this.event("step", key, { from });
    // Mirrored to Clarity and GA4 (no-ops until consent has loaded them).
    thirdPartyEvent(`funnel_${key}`, { from_step: from });
  }

  calendarVisible(visible: boolean) {
    this.calendarInView = visible;
    if (visible) this.reach("calendar");
  }

  setSection(name: string) {
    this.section = name;
  }

  flush(final = false) {
    window.clearTimeout(this.flushTimer);
    this.flushTimer = undefined;
    const now = Date.now();
    this.state.lastSeen = now;
    write("session", KEYS.visit, JSON.stringify(this.state));
    if (!privacySignal()) write("local", KEYS.lastVisit, String(now));

    const events = this.queue.splice(0, 60).map((event) => ({
      ...event,
      ago: now - (this.stamps.get(event) ?? now),
    }));

    const beacon: Beacon = {
      v: 1,
      visit: {
        ...this.touch,
        id: this.state.id,
        visitorId: this.visitorId,
        page: this.page,
        returning: this.returning,
        attribution: this.attribution,
        referrer: this.referrer,
        fromPath: this.fromPath,
        landingUrl: this.landingUrl,
        startedAgo: now - this.state.startedAt,
        engagedMs: this.state.engagedMs,
        maxScroll: this.state.maxScroll,
        step: this.state.step,
        section: this.section,
        exit: this.exit,
      },
      events,
    };
    send(JSON.stringify(beacon), final);
    if (this.queue.length) this.flushSoon();
  }

  stop() {
    this.teardown.forEach((undo) => undo());
    this.teardown = [];
    window.clearInterval(this.ticker);
    window.clearInterval(this.heartbeat);
    this.flush(true);
  }

  /* ------------------------------------------------------------ internal */

  private flushSoon() {
    if (this.flushTimer !== undefined) return;
    this.flushTimer = window.setTimeout(() => this.flush(), FLUSH_DELAY_MS);
  }

  private active() {
    this.lastActivity = Date.now();
  }

  private listen() {
    const on = (
      target: Window | Document,
      type: string,
      handler: (event: Event) => void,
      options: AddEventListenerOptions = { passive: true },
    ) => {
      target.addEventListener(type, handler, options);
      this.teardown.push(() => target.removeEventListener(type, handler, options));
    };

    // Engaged time: seconds with the tab visible and some sign of a person in
    // the last 30 seconds. Reading without touching anything still counts.
    this.ticker = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - this.lastActivity > ACTIVE_WINDOW_MS) return;
      this.state.engagedMs += 1000;
      if (this.state.engagedMs >= ENGAGED_AFTER_MS) this.reach("engaged");
    }, 1000);

    this.heartbeat = window.setInterval(() => {
      if (document.visibilityState === "visible") this.flush();
    }, HEARTBEAT_MS);

    for (const type of ["pointermove", "keydown", "wheel", "touchstart"] as const) {
      on(window, type, () => this.active());
    }

    let scrollFrame = 0;
    on(window, "scroll", () => {
      this.active();
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        const doc = document.documentElement;
        const depth = Math.min(
          100,
          Math.round(((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100),
        );
        if (depth > this.state.maxScroll) this.state.maxScroll = depth;
        for (const mark of [25, 50, 75, 100]) {
          if (depth >= mark && !this.scrollMarks.has(mark)) {
            this.scrollMarks.add(mark);
            this.event("scroll", String(mark));
          }
        }
        if (window.scrollY > 240) this.reach("engaged");
      });
    });

    on(
      document,
      "click",
      (event) => {
        this.active();
        const target = event.target as Element | null;
        const el = target?.closest<HTMLElement>("a, button, [data-track]");
        if (!el || el.closest("[data-track-ignore]")) {
          if (el) this.reach("engaged");
          return;
        }
        this.reach("engaged");
        const label = (
          el.dataset.track ??
          el.getAttribute("aria-label") ??
          el.textContent ??
          ""
        )
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 80);
        const href = el instanceof HTMLAnchorElement ? el.href : undefined;
        this.event("click", label || el.tagName.toLowerCase(), href ? { href } : undefined);

        // Leaving by a link: note where to, and send now, before the page goes.
        if (href) {
          const to = new URL(href, location.href);
          const samePage =
            to.origin === location.origin && to.pathname === location.pathname;
          if (!samePage) {
            this.exit = to.origin === location.origin ? to.pathname : to.href;
            this.event("exit", this.exit);
            this.flush(true);
          }
        }
      },
      { capture: true, passive: true },
    );

    on(document, "visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.event("hide", this.section);
        this.flush(true);
      } else {
        this.active();
        this.event("return", this.section);
      }
    });

    on(window, "pagehide", () => this.flush(true));
  }
}

function send(body: string, final: boolean) {
  if (final && typeof navigator.sendBeacon === "function") {
    const queued = navigator.sendBeacon(
      ENDPOINT,
      new Blob([body], { type: "application/json" }),
    );
    if (queued) return;
  }
  fetch(ENDPOINT, {
    method: "POST",
    body,
    keepalive: true,
    headers: { "content-type": "application/json" },
  }).catch(() => {});
}

/* -------------------------------------------------------- module interface */

let current: Tracker | null = null;

/**
 * Starts (or resumes) tracking this page. Returns a stop function.
 *
 * `resumeOnly` continues a visit already under way in this tab and otherwise
 * does nothing — for a follow-on page such as the booking confirmation, which
 * should add to the visit that booked rather than count as a new arrival when
 * it is opened from an email.
 */
export function startTracking(page: string, { resumeOnly = false } = {}) {
  if (resumeOnly && current?.page !== page) {
    const saved = readJson<VisitState>("session", KEYS.visit);
    if (!saved || saved.page !== page || Date.now() - saved.lastSeen > VISIT_IDLE_MS) {
      return () => {};
    }
  }
  if (current?.page !== page) {
    current?.stop();
    current = new Tracker(page);
    current.start();
  }
  const mine = current;
  return () => {
    if (current === mine) {
      mine.stop();
      current = null;
    }
  };
}

export function track(type: string, name?: string, props?: BeaconEvent["props"]) {
  current?.event(type, name, props);
}

export function reachStep(key: FunnelKey) {
  current?.reach(key);
}

export function setSection(name: string) {
  current?.setSection(name);
}

export function setCalendarVisible(visible: boolean) {
  current?.calendarVisible(visible);
}

/** Sends whatever is queued now, as a beacon that survives navigation. */
export function flushNow() {
  current?.flush(true);
}

/**
 * The campaign this browser is attributed to and its visitor id, for Clarity
 * and GA4. Reads only; never creates an id. Empty under a privacy signal.
 */
export function attributionForTools() {
  if (privacySignal()) return {};
  const { touch } = resolveTouch();
  return {
    campaign: touch.campaign,
    source: touch.source,
    medium: touch.medium,
    visitorId: read("local", KEYS.visitor) ?? undefined,
  };
}

/** What a booking needs to be tied back to this visit and its campaign. */
export function trackingContext() {
  if (!current) return null;
  return {
    visitId: current.visitId,
    visitorId: current.visitorId,
    source: current.touch.source,
    medium: current.touch.medium,
    campaign: current.touch.campaign,
  };
}
