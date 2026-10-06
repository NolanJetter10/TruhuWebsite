"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import {
  ArrowClockwise,
  CaretLeft,
  ChatCircle,
  Check,
  Eye,
  LockSimple,
  PaperPlaneTilt,
  Pause,
  Play,
  SealCheck,
  Translate,
  UsersThree,
} from "@phosphor-icons/react";
import { cx } from "@/components/ui/primitives";
import { useInView, useReducedMotion } from "./hooks";

/**
 * TruHu Workforce, told on phones. HR writes one message on the big phone in
 * the middle and sends it. It flies out to three employees, and each of them
 * gets something different:
 *
 *   Maria   In English. She opens the link, then acknowledges it.
 *   Sofia   The same message, translated into Spanish. She opens it.
 *   Nate    On the road. The text sits on his lock screen, unopened.
 *
 * Every open flies back to the sender's phone and lands on that person's row.
 * The sender resends only to the people who haven't viewed it, Nate among
 * them, and he opens it. The sender's phone ends on the report for the send.
 *
 * Claims discipline: SMS has no read receipt. "Viewed" means the link in the
 * text was opened, which is the page view TruHu records, so nothing here says
 * "read".
 *
 * One clock drives one timeline, and everything on screen is derived from the
 * time in it: Pause freezes an exact frame and the rail seeks. The scene is
 * drawn on a fixed canvas that CSS scales to the column (`.bcast` in
 * globals.css), in two arrangements: the receivers either side of the sender,
 * or in a row above it when the column is narrow. The flying messages are
 * painted straight onto their SVG nodes every frame; the rest re-renders about
 * thirty times a second. Reduced motion shows each step's settled frame and
 * never runs the clock.
 */

/* -------------------------------------------------------------------------- */
/* Story                                                                       */
/* -------------------------------------------------------------------------- */

// Names are kept to one line in the narrowest desktop column, so the scene
// never shifts down a line as the steps change.
const CHAPTERS = [
  { short: "Send", name: "Write it once. Send it from your phone.", at: 0, settle: 3100 },
  { short: "Deliver", name: "One text, in each person’s language.", at: 3900, settle: 6300 },
  { short: "View", name: "Watch it get seen, name by name.", at: 6400, settle: 10700 },
  { short: "Resend", name: "Resend only to the ones who missed it.", at: 10900, settle: 15300 },
  { short: "Report", name: "Then the whole picture, on your phone.", at: 15500, settle: 22000 },
] as const;

const LOOP = 22500;
const LAST = CHAPTERS.length - 1;

function chapterAt(t: number) {
  let i = 0;
  while (i < LAST && t >= CHAPTERS[i + 1].at) i++;
  return i;
}

/* Sample content ----------------------------------------------------------- */

/** The client's brand, not TruHu's: the message page is Sample Company's. */
const CLIENT = "#0E5A63";
const SENDER = "Sample Company HR";
const AUDIENCE = ["Oak St", "All shifts"] as const;
const MESSAGE = "Oak St opens at 10 AM tomorrow. Check your updated schedule.";
const REMINDER = `Reminder: ${MESSAGE}`;
const LINK = "truhu.link/oak-st";

// One send, internally consistent. The resend goes to exactly the delivered
// who hadn't viewed it, and the language split adds up to the delivered.
const TOTAL = 214;
const NO_NUMBER = 3;
const DELIVERED = TOTAL - NO_NUMBER;
const VIEWED_FIRST = 139;
const ACKED_FIRST = 118;
const RECOVERED = 48;
const VIEWED = VIEWED_FIRST + RECOVERED;
const ACKED = 142;
const UNSEEN = DELIVERED - VIEWED_FIRST;

const LANGUAGES = [
  { name: "English", n: 158, color: "#0582dc" },
  { name: "Español", n: 44, color: "#38b000" },
  { name: "Tiếng Việt", n: 9, color: "#9db2c7" },
] as const;

/** Views per interval: the first ten are the send, the rest the resend. */
const VIEWS = [40, 31, 22, 15, 10, 8, 5, 4, 2, 2, 17, 13, 9, 5, 3, 1];
const RESEND_BAR = 10;

type Lang = "en" | "es";

const TEXT: Record<
  Lang,
  { sms: string; card: string; title: string; body: string; slot: string; ack: string; acked: string }
> = {
  en: {
    sms: MESSAGE,
    card: "Oak St schedule update",
    title: "Oak St opens at 10 AM tomorrow",
    body: "Here’s your updated schedule.",
    slot: "Tomorrow · Day shift",
    ack: "Acknowledge",
    acked: "Acknowledged",
  },
  es: {
    sms: "Oak St abre mañana a las 10 AM. Revisa tu horario actualizado.",
    card: "Nuevo horario de Oak St",
    title: "Oak St abre mañana a las 10 AM",
    body: "Este es tu horario actualizado.",
    slot: "Mañana · Turno de día",
    ack: "Confirmar",
    acked: "Confirmado",
  },
};

/* Receivers ---------------------------------------------------------------- */

type ReceiverId = "maria" | "sofia" | "nate";

/** Moments on the shared timeline, in ms. */
type Beats = {
  arrive: number;
  open: number;
  tap: number;
  page: number;
  ackPress?: number;
  ack?: number;
  /** The screen goes dark with the text still unopened. */
  sleep?: number;
  /** The resend arrives. */
  again?: number;
};

type Receiver = {
  id: ReceiverId;
  name: string;
  initials: string;
  group: string;
  lang: Lang;
  beats: Beats;
};

const RECEIVERS: readonly Receiver[] = [
  {
    id: "maria",
    name: "Maria S.",
    initials: "MS",
    group: "Night crew",
    lang: "en",
    beats: { arrive: 4400, open: 5400, tap: 6500, page: 6750, ackPress: 8700, ack: 8900 },
  },
  {
    id: "sofia",
    name: "Sofia R.",
    initials: "SR",
    group: "Warehouse",
    lang: "es",
    beats: { arrive: 4480, open: 5900, tap: 7100, page: 7350 },
  },
  {
    id: "nate",
    name: "Nate G.",
    initials: "NG",
    group: "Drivers",
    lang: "en",
    beats: { arrive: 4560, sleep: 6100, again: 12850, open: 13450, tap: 14000, page: 14250 },
  },
];

const [MARIA, SOFIA, NATE] = RECEIVERS;

/* The sender's phone -------------------------------------------------------- */

const HUB_T = {
  chips: 250,
  chipGap: 220,
  count: 700,
  type: 950,
  perChar: 22,
  link: 2450,
  translate: 2700,
  askAck: 2900,
  press: 3200,
  sent: 3420,
  live: 3900,
  followUp: 11000,
  resendPress: 11650,
  resent: 11900,
  report: 15600,
} as const;

/* Messages in flight -------------------------------------------------------- */

const FLIGHT = 950;
const SPARK = 750;

type CometId =
  | "out-maria"
  | "out-sofia"
  | "out-nate"
  | "view-maria"
  | "view-sofia"
  | "ack-maria"
  | "resend-nate"
  | "view-nate";

/** `out` leaves the sender; `back` is an open or a sign-off returning. */
type Comet = { id: CometId; kind: "out" | "back"; start: number; dur: number };

const COMETS: readonly Comet[] = [
  { id: "out-maria", kind: "out", start: MARIA.beats.arrive - FLIGHT, dur: FLIGHT },
  { id: "out-sofia", kind: "out", start: SOFIA.beats.arrive - FLIGHT, dur: FLIGHT },
  { id: "out-nate", kind: "out", start: NATE.beats.arrive - FLIGHT, dur: FLIGHT },
  { id: "view-maria", kind: "back", start: MARIA.beats.page, dur: SPARK },
  { id: "view-sofia", kind: "back", start: SOFIA.beats.page, dur: SPARK },
  { id: "ack-maria", kind: "back", start: MARIA.beats.ack!, dur: SPARK },
  { id: "resend-nate", kind: "out", start: HUB_T.resent, dur: FLIGHT },
  { id: "view-nate", kind: "back", start: NATE.beats.page, dur: SPARK },
];

/** When each message lands, which is when its destination learns of it. */
const LAND = Object.fromEntries(
  COMETS.map((c) => [c.id, c.start + c.dur]),
) as Record<CometId, number>;

/* State at a moment ---------------------------------------------------------- */

type Status = "sending" | "delivered" | "unseen" | "resent" | "viewed" | "acked";

/** What the sender knows about one person, which is also what their tag says. */
function statusOf(r: Receiver, t: number): Status {
  const b = r.beats;
  if (t < b.arrive) return "sending";
  if (r.id === "maria" && t >= LAND["ack-maria"]) return "acked";
  if (t >= LAND[`view-${r.id}` as const]) return "viewed";
  if (b.again !== undefined) {
    if (t >= b.again) return "resent";
    if (t >= HUB_T.followUp) return "unseen";
  }
  return "delivered";
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const easeOut = (n: number) => 1 - Math.pow(1 - n, 3);
const easeInOut = (n: number) =>
  n < 0.5 ? 4 * n * n * n : 1 - Math.pow(-2 * n + 2, 3) / 2;

/** The sender's running counts. The three phones are the named part of it. */
function tally(t: number) {
  const late = easeOut(clamp01((t - LAND["view-nate"]) / 900));
  const first = (at: number, dur: number, total: number) =>
    t < at ? 0 : 1 + Math.round((total - 1) * easeOut(clamp01((t - at) / dur)));
  return {
    delivered:
      t < MARIA.beats.arrive
        ? 0
        : Math.round(DELIVERED * easeOut(clamp01((t - MARIA.beats.arrive) / 1400))),
    viewed: first(LAND["view-maria"], 2800, VIEWED_FIRST) + Math.round(RECOVERED * late),
    acked:
      first(LAND["ack-maria"], 1300, ACKED_FIRST) +
      Math.round((ACKED - ACKED_FIRST) * late),
    recovered: Math.round(RECOVERED * late),
  };
}

function typed(text: string, t: number, start: number, perChar: number) {
  const n = Math.floor((t - start) / perChar);
  return text.slice(0, Math.max(0, Math.min(text.length, n)));
}

const rise = (delayMs = 0): CSSProperties => ({
  animation: `demo-rise 420ms var(--ease-out-expo) ${delayMs}ms both`,
});

const pop: CSSProperties = {
  animation: "demo-pop 380ms var(--ease-out-back) both",
};

/** Present from the start so nothing reflows; fades up when `on`. */
const reveal = (on: boolean): CSSProperties => ({
  opacity: on ? 1 : 0,
  transform: on ? "none" : "translate3d(0, 6px, 0)",
  transition: "opacity 420ms ease-out, transform 520ms var(--ease-out-expo)",
});

/* -------------------------------------------------------------------------- */
/* Geometry                                                                    */
/* -------------------------------------------------------------------------- */

const HUB = { w: 236, pad: 7, screen: 440, bar: 30 } as const;
const HUB_H = HUB.screen + HUB.pad * 2;
const MINI = { w: 128, pad: 5, screen: 240 } as const;
const MINI_H = MINI.screen + MINI.pad * 2;

// Points on the sender's screen, from its top-left corner. The row and button
// positions follow from the fixed heights in `Live` and `Compose`.
const SEND_AT = { x: 111, y: 407 };
const RESEND_AT = { x: 165, y: 376 };
const ROWS_TOP = 171;
const ROW_H = 34;
const rowAt = (i: number, side: "avatar" | "pill") => ({
  x: side === "avatar" ? 30 : 178,
  y: ROWS_TOP + ROW_H * (i + 0.5),
});

// Points on a receiving phone, from its frame's top-left corner.
const NOTE_AT = { x: 64, y: 102 };
const PAGE_AT = { x: 64, y: 90 };
const ACK_AT = { x: 64, y: 146 };

type Pt = { x: number; y: number };
type Place = Pt & { r: number };
type Path = { pts: Pt[]; cum: number[]; len: number };
type Route = { d: string; path: Path; end: Pt };

/**
 * Drawn coordinates are rounded to a tenth. Node and the browser can disagree
 * in the last digit of a sine or cosine, and an unrounded value in a style or
 * SVG attribute is then a hydration mismatch.
 */
const r1 = (n: number) => Math.round(n * 10) / 10;
const pt = (x: number, y: number): Pt => ({ x: r1(x), y: r1(y) });

function makePath(pts: Pt[]): Path {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  return { pts, cum, len: cum[cum.length - 1] };
}

function pointAt(path: Path, t: number): Pt {
  const d = clamp01(t) * path.len;
  let i = 1;
  while (i < path.cum.length - 1 && path.cum[i] < d) i++;
  const span = path.cum[i] - path.cum[i - 1] || 1;
  const k = (d - path.cum[i - 1]) / span;
  const a = path.pts[i - 1];
  const b = path.pts[i];
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
}

/** A cubic curve, as SVG path data and as a polyline to move a dot along. */
function cubic(a: Pt, c1: Pt, c2: Pt, b: Pt): Route {
  const pts = Array.from({ length: 41 }, (_, i) => {
    const t = i / 40;
    const u = 1 - t;
    return pt(
      u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
      u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
    );
  });
  return {
    d: `M${a.x} ${a.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`,
    path: makePath(pts),
    end: b,
  };
}

type Layout = {
  key: "wide" | "tall";
  w: number;
  h: number;
  hub: Pt;
  halo: Pt;
  phones: Record<ReceiverId, Place>;
  /** The top centre of each name tag, just over the phone's bottom edge. */
  tags: Record<ReceiverId, Pt>;
  routes: Record<CometId, Route>;
};

function buildLayout(
  key: Layout["key"],
  size: { w: number; h: number },
  hub: Pt,
  phones: Record<ReceiverId, Place>,
  controls: Record<CometId, [Pt, Pt]>,
): Layout {
  const onHub = (p: Pt) => pt(hub.x + HUB.pad + p.x, hub.y + HUB.pad + p.y);
  // A point on a tilted phone: rotated about the phone's centre, as CSS does.
  const onPhone = (id: ReceiverId, p: Pt) => {
    const ph = phones[id];
    const a = (ph.r * Math.PI) / 180;
    const dx = p.x - MINI.w / 2;
    const dy = p.y - MINI_H / 2;
    return pt(
      ph.x + MINI.w / 2 + dx * Math.cos(a) - dy * Math.sin(a),
      ph.y + MINI_H / 2 + dx * Math.sin(a) + dy * Math.cos(a),
    );
  };
  const ends: Record<CometId, [Pt, Pt]> = {
    "out-maria": [onHub(SEND_AT), onPhone("maria", NOTE_AT)],
    "out-sofia": [onHub(SEND_AT), onPhone("sofia", NOTE_AT)],
    "out-nate": [onHub(SEND_AT), onPhone("nate", NOTE_AT)],
    "view-maria": [onPhone("maria", PAGE_AT), onHub(rowAt(0, "avatar"))],
    "ack-maria": [onPhone("maria", ACK_AT), onHub(rowAt(0, "avatar"))],
    "view-sofia": [onPhone("sofia", PAGE_AT), onHub(rowAt(1, "pill"))],
    "resend-nate": [onHub(RESEND_AT), onPhone("nate", NOTE_AT)],
    "view-nate": [onPhone("nate", PAGE_AT), onHub(rowAt(2, "pill"))],
  };
  const routes = Object.fromEntries(
    (Object.keys(ends) as CometId[]).map((id) => {
      const [a, b] = ends[id];
      const [c1, c2] = controls[id];
      return [id, cubic(a, c1, c2, b)];
    }),
  ) as Record<CometId, Route>;
  const tags = Object.fromEntries(
    RECEIVERS.map((r) => [r.id, onPhone(r.id, { x: MINI.w / 2, y: MINI_H - 12 })]),
  ) as Record<ReceiverId, Pt>;
  const centre = { x: hub.x + HUB.w / 2, y: hub.y + HUB_H / 2 };
  return {
    key,
    ...size,
    hub,
    halo: pt(centre.x - HALO.w / 2, centre.y - HALO.h / 2),
    phones,
    tags,
    routes,
  };
}

const HALO = { w: 460, h: 560 } as const;

/** Room either side of the sender: one phone on the left, two on the right. */
const WIDE = buildLayout(
  "wide",
  { w: 600, h: 590 },
  { x: 182, y: 50 },
  {
    maria: { x: 14, y: 164, r: -5 },
    sofia: { x: 458, y: 18, r: 4 },
    nate: { x: 458, y: 308, r: -3 },
  },
  {
    "out-maria": [{ x: 210, y: 484 }, { x: 150, y: 340 }],
    "out-sofia": [{ x: 420, y: 472 }, { x: 440, y: 220 }],
    "out-nate": [{ x: 400, y: 484 }, { x: 440, y: 424 }],
    "view-maria": [{ x: 140, y: 250 }, { x: 170, y: 244 }],
    "ack-maria": [{ x: 150, y: 330 }, { x: 175, y: 252 }],
    "view-sofia": [{ x: 470, y: 150 }, { x: 440, y: 272 }],
    "resend-nate": [{ x: 420, y: 452 }, { x: 460, y: 424 }],
    "view-nate": [{ x: 470, y: 380 }, { x: 440, y: 312 }],
  },
);

/** A narrow column: the three phones in a row above the sender. */
const TALL = buildLayout(
  "tall",
  { w: 420, h: 800 },
  { x: 92, y: 330 },
  {
    maria: { x: 8, y: 30, r: -4 },
    sofia: { x: 146, y: 12, r: 0 },
    nate: { x: 284, y: 30, r: 4 },
  },
  {
    "out-maria": [{ x: 40, y: 760 }, { x: 20, y: 420 }],
    "out-sofia": [{ x: 400, y: 740 }, { x: 400, y: 330 }],
    "out-nate": [{ x: 380, y: 760 }, { x: 420, y: 420 }],
    "view-maria": [{ x: 30, y: 260 }, { x: 40, y: 500 }],
    "ack-maria": [{ x: 30, y: 300 }, { x: 40, y: 510 }],
    "view-sofia": [{ x: 230, y: 300 }, { x: 300, y: 420 }],
    "resend-nate": [{ x: 390, y: 700 }, { x: 410, y: 360 }],
    "view-nate": [{ x: 400, y: 280 }, { x: 380, y: 560 }],
  },
);

const LAYOUTS = [WIDE, TALL] as const;

/** Both positions ride on every placed element; CSS picks one per column width. */
function place(wide: Pt & { r?: number }, tall: Pt & { r?: number }): CSSProperties {
  return {
    "--wx": `${wide.x}px`,
    "--wy": `${wide.y}px`,
    "--wr": `${wide.r ?? 0}deg`,
    "--tx": `${tall.x}px`,
    "--ty": `${tall.y}px`,
    "--tr": `${tall.r ?? 0}deg`,
  } as CSSProperties;
}

/* -------------------------------------------------------------------------- */
/* The loop                                                                    */
/* -------------------------------------------------------------------------- */

type CometRefs = Record<Layout["key"], (SVGGElement | null)[]>;

export function PhoneBroadcast() {
  const [ref, inView] = useInView<HTMLElement>(0.25);
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(true);
  const [t, setT] = useState(0);
  /** Laps completed; the first lap starts on the server's frame, not a fade. */
  const [lap, setLap] = useState(0);
  /** The step reduced motion shows: the report, until another is chosen. */
  const [pinned, setPinned] = useState<number>(LAST);
  const elapsed = useRef(0);
  const comets = useRef<CometRefs>({ wide: [], tall: [] });

  const running = inView && playing && !reduced;
  const now = reduced ? CHAPTERS[pinned].settle : t;
  const chapter = chapterAt(now);
  const fade = reduced
    ? 1
    : Math.min(1, lap > 0 ? now / 350 : 1, (LOOP - now) / 450);

  // Moves every message in flight to where it is at `ms`.
  const paint = useCallback((ms: number) => {
    for (const layout of LAYOUTS) {
      COMETS.forEach((comet, i) => {
        const node = comets.current[layout.key][i];
        if (!node) return;
        const p = (ms - comet.start) / comet.dur;
        if (p <= 0 || p >= 1) {
          node.setAttribute("opacity", "0");
          return;
        }
        const route = layout.routes[comet.id];
        const pos = easeInOut(p);
        const head = pointAt(route.path, pos);
        const [trace, tailLong, tailShort, halo, core] = Array.from(node.children);
        trace.setAttribute("opacity", (0.45 * Math.sin(Math.PI * p)).toFixed(3));
        tailLong.setAttribute("stroke-dashoffset", (0.3 - pos).toFixed(4));
        tailShort.setAttribute("stroke-dashoffset", (0.12 - pos).toFixed(4));
        for (const dot of [halo, core]) {
          dot.setAttribute("cx", head.x.toFixed(1));
          dot.setAttribute("cy", head.y.toFixed(1));
        }
        node.setAttribute("opacity", Math.min(1, p * 10, (1 - p) * 14).toFixed(3));
      });
    }
  }, []);

  // The clock. Runs only on screen and not paused, and wraps at the end of
  // the story; the scene fades across the seam.
  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = performance.now();
    let pushed = -1;
    const loop = (stamp: number) => {
      let next = elapsed.current + Math.min(stamp - last, 64);
      last = stamp;
      if (next >= LOOP) {
        next -= LOOP;
        setLap((n) => n + 1);
      }
      elapsed.current = next;
      paint(next);
      const q = Math.floor(next / 33);
      if (q !== pushed) {
        pushed = q;
        setT(next);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [running, paint]);

  /** A step plays from its start, and the story carries on from there. */
  const seek = (i: number) => {
    if (reduced) {
      setPinned(i);
      return;
    }
    elapsed.current = CHAPTERS[i].at;
    setT(CHAPTERS[i].at);
    paint(CHAPTERS[i].at);
    setPlaying(true);
  };

  return (
    <figure ref={ref} className="relative mx-auto w-full max-w-[600px]">
      {/* Caption ----------------------------------------------------------- */}
      <div className="mb-2">
        <p className="t-eyebrow text-blue-400">
          Step {chapter + 1} of {CHAPTERS.length}
        </p>
        <p
          key={chapter}
          className="mt-1.5 min-h-[2lh] font-display text-lg leading-snug font-bold text-white sm:min-h-[1lh] sm:text-xl"
          style={{ animation: "demo-caption 520ms var(--ease-out-expo) both" }}
        >
          {CHAPTERS[chapter].name}
        </p>
      </div>

      {/* The scene --------------------------------------------------------- */}
      <div className="bcast" data-paused={running ? undefined : ""}>
        <div className="bcast-frame">
          <div
            aria-hidden
            className={cx("bcast-canvas select-none", now < 400 && "bcast-instant")}
            style={{ opacity: fade }}
          >
            <Scene t={now} reduced={reduced} />
            <CometLayer layout={WIDE} t={now} reduced={reduced} refs={comets} />
            <CometLayer layout={TALL} t={now} reduced={reduced} refs={comets} />
          </div>
        </div>
      </div>

      {/* Steps ------------------------------------------------------------- */}
      <div className="mt-4 flex items-start gap-4 sm:gap-5">
        <ol className="grid flex-1 grid-cols-5 gap-2 sm:gap-3">
          {CHAPTERS.map((c, i) => {
            const active = i === chapter;
            const next = i < LAST ? CHAPTERS[i + 1].at : LOOP;
            const fill =
              i < chapter
                ? 1
                : active
                  ? reduced
                    ? 1
                    : clamp01((now - c.at) / (next - c.at))
                  : 0;
            return (
              <li key={c.short} className="min-w-0">
                <button
                  type="button"
                  onClick={() => seek(i)}
                  aria-label={`Step ${i + 1} of ${CHAPTERS.length}, ${c.short}: ${c.name}`}
                  aria-current={active ? "step" : undefined}
                  className="group/step block w-full min-w-0 cursor-pointer rounded-sm pt-2 pb-1 text-left"
                >
                  <span className="relative block h-[2px] overflow-hidden rounded-full bg-white/[0.12]">
                    <span
                      className="absolute inset-0 origin-left rounded-full"
                      style={{
                        background:
                          i < chapter ? "rgba(255,255,255,0.35)" : "var(--grad-brand-bright)",
                        transform: `scaleX(${fill})`,
                      }}
                    />
                  </span>
                  <span className="mt-2.5 flex items-baseline gap-1.5 text-[12px] leading-none font-semibold">
                    <span
                      className={cx(
                        "tabular hidden transition-colors duration-300 sm:inline",
                        active ? "text-blue-400" : "text-white/35",
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cx(
                        "truncate transition-colors duration-300",
                        active
                          ? "text-white"
                          : "text-white/50 group-hover/step:text-white/80",
                      )}
                    >
                      {c.short}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {reduced ? null : (
          <button
            type="button"
            aria-label={playing ? "Pause animation" : "Play animation"}
            onClick={() => setPlaying((p) => !p)}
            className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/40 hover:text-white"
          >
            {playing ? (
              <Pause aria-hidden weight="fill" className="size-3" />
            ) : (
              <Play aria-hidden weight="fill" className="size-3" />
            )}
          </button>
        )}
      </div>

      <figcaption className="sr-only">
        A sample TruHu Workforce send, shown on phones. Sample Company HR writes one
        message on a phone, &ldquo;{MESSAGE}&rdquo;, and sends it to the {TOTAL}{" "}
        people at Oak St. It arrives on each person&rsquo;s own phone as a plain
        text in their language: Maria gets it in English and Sofia in Spanish,
        while Nate&rsquo;s sits unopened. As people open the link, the sender
        sees it by name; Maria also acknowledges it. Sample Company resends only to
        the {UNSEEN} who haven&rsquo;t viewed it, and Nate opens it. The report:{" "}
        {DELIVERED} of {TOTAL} delivered, {VIEWED} viewed ({RECOVERED} after the
        resend), {ACKED} acknowledged, {NO_NUMBER} with no mobile number on
        file, sent in {LANGUAGES.length} languages.
      </figcaption>
    </figure>
  );
}

/* -------------------------------------------------------------------------- */
/* The scene                                                                   */
/* -------------------------------------------------------------------------- */

const FLOAT: Record<ReceiverId | "hub", CSSProperties> = {
  hub: { animationDelay: "-2s", animationDuration: "5.4s" },
  maria: { animationDelay: "-0.6s", animationDuration: "4.4s" },
  sofia: { animationDelay: "-3.1s", animationDuration: "4.9s" },
  nate: { animationDelay: "-1.7s", animationDuration: "4.2s" },
};

function Scene({ t, reduced }: { t: number; reduced: boolean }) {
  const report = t >= HUB_T.report;
  const sonar = !reduced && t >= HUB_T.sent && t < HUB_T.sent + 1500;

  return (
    <>
      {/* The sender's light, brightest as it sends and on the report. */}
      <div
        className="bcast-at pointer-events-none"
        style={{
          ...place(WIDE.halo, TALL.halo),
          width: HALO.w,
          height: HALO.h,
          background:
            "radial-gradient(closest-side, rgba(5,130,220,0.42), rgba(33,207,192,0.12) 58%, transparent)",
          opacity: report || sonar ? 1 : 0.6,
          transition: "opacity 900ms ease-out",
        }}
      />

      {RECEIVERS.map((r) => (
        <ReceiverPhone key={r.id} r={r} t={t} report={report} />
      ))}

      <div className="bcast-at z-20" style={place(WIDE.hub, TALL.hub)}>
        <div className="bcast-float" style={FLOAT.hub}>
          <div
            style={{
              transform: report ? "scale(1.035)" : "none",
              transition: "transform 1100ms var(--ease-out-expo)",
            }}
          >
            {sonar ? (
              <>
                <span
                  className="absolute inset-0 rounded-[40px] border-2 border-blue-400/60"
                  style={{ animation: "bcast-sonar 1200ms var(--ease-out-expo) both" }}
                />
                <span
                  className="absolute inset-0 rounded-[40px] border border-green-400/50"
                  style={{ animation: "bcast-sonar 1300ms var(--ease-out-expo) 260ms both" }}
                />
              </>
            ) : null}
            <HubPhone t={t} />
          </div>
        </div>
      </div>

      {RECEIVERS.map((r) => (
        <div
          key={r.id}
          className="bcast-at z-30"
          style={place(WIDE.tags[r.id], TALL.tags[r.id])}
        >
          <div
            style={{
              translate: "-50% 0",
              opacity: t < r.beats.arrive ? 0.7 : report ? 0.8 : 1,
              transition: "opacity 700ms ease-out",
            }}
          >
            <NameTag r={r} status={statusOf(r, t)} />
          </div>
        </div>
      ))}
    </>
  );
}

/* Flying messages ----------------------------------------------------------- */

const COMET_COLOR = { out: "#38b6ff", back: "#57d95e" } as const;

function CometLayer({
  layout,
  t,
  reduced,
  refs,
}: {
  layout: Layout;
  t: number;
  reduced: boolean;
  refs: RefObject<CometRefs>;
}) {
  return (
    <svg
      width={layout.w}
      height={layout.h}
      viewBox={`0 0 ${layout.w} ${layout.h}`}
      className={cx(
        "pointer-events-none absolute top-0 left-0 z-40 overflow-visible",
        layout.key === "wide" ? "bcast-wide" : "bcast-tall",
      )}
    >
      {COMETS.map((comet, i) => {
        const route = layout.routes[comet.id];
        const color = COMET_COLOR[comet.kind];
        return (
          <g
            key={comet.id}
            ref={(node) => {
              refs.current[layout.key][i] = node;
            }}
            opacity={0}
          >
            <path
              d={route.d}
              fill="none"
              stroke={color}
              strokeWidth={1}
              strokeDasharray="1.5 5"
              strokeLinecap="round"
              opacity={0}
            />
            <path
              d={route.d}
              pathLength={1}
              fill="none"
              stroke={color}
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray="0.3 2"
              strokeDashoffset={0.3}
              opacity={0.2}
            />
            <path
              d={route.d}
              pathLength={1}
              fill="none"
              stroke={color}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeDasharray="0.12 2"
              strokeDashoffset={0.12}
              opacity={0.8}
            />
            <circle r={12} fill={color} opacity={0.32} />
            <circle r={4} fill="#ffffff" />
          </g>
        );
      })}

      {/* A ring where each one lands. */}
      {reduced
        ? null
        : COMETS.filter((c) => t >= LAND[c.id] && t < LAND[c.id] + 700).map((c) => {
            const { end } = layout.routes[c.id];
            return (
              <circle
                key={c.id}
                cx={end.x}
                cy={end.y}
                r={14}
                fill="none"
                stroke={COMET_COLOR[c.kind]}
                strokeWidth={2}
                style={{
                  transformOrigin: `${end.x}px ${end.y}px`,
                  animation: "bcast-burst 700ms var(--ease-out-expo) both",
                }}
              />
            );
          })}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Handsets                                                                    */
/* -------------------------------------------------------------------------- */

function Handset({ size, children }: { size: "hub" | "mini"; children: ReactNode }) {
  const hub = size === "hub";
  return (
    <div
      className={cx("relative", hub ? "rounded-[40px] p-[7px]" : "rounded-[24px] p-[5px]")}
      style={{
        width: hub ? HUB.w : MINI.w,
        background: "linear-gradient(150deg, #22364b 0%, #0a1420 38%, #060d16 70%, #1a2a3b 100%)",
        boxShadow: hub
          ? "0 0 0 1px rgba(255,255,255,0.14), 0 50px 90px -30px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.12)"
          : "0 0 0 1px rgba(255,255,255,0.12), 0 26px 50px -22px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.1)",
      }}
    >
      {hub ? (
        <>
          <span className="absolute top-[92px] -left-[2px] h-[24px] w-[3px] rounded-l-sm bg-[#22364b]" />
          <span className="absolute top-[128px] -left-[2px] h-[40px] w-[3px] rounded-l-sm bg-[#22364b]" />
          <span className="absolute top-[120px] -right-[2px] h-[58px] w-[3px] rounded-r-sm bg-[#22364b]" />
        </>
      ) : null}
      <div
        className={cx(
          "relative overflow-hidden bg-white",
          hub ? "rounded-[33px]" : "rounded-[19px]",
        )}
        style={{ height: hub ? HUB.screen : MINI.screen }}
      >
        {children}
        <span
          className={cx(
            "absolute left-1/2 z-30 -translate-x-1/2 rounded-full bg-black",
            hub ? "top-[8px] h-[20px] w-[66px]" : "top-[5px] h-[9px] w-[32px]",
          )}
        />
      </div>
    </div>
  );
}

function StatusBar({ tone, size }: { tone: "light" | "dark"; size: "hub" | "mini" }) {
  const hub = size === "hub";
  const ink = tone === "dark" ? "bg-ink/70" : "bg-white/85";
  return (
    <div
      className={cx(
        "relative z-20 flex items-start justify-between font-semibold",
        hub ? "h-[30px] px-[24px] pt-[10px] text-[10px]" : "h-[18px] px-[12px] pt-[5px] text-[6.5px]",
        tone === "dark" ? "text-ink/75" : "text-white/85",
      )}
    >
      <span className="leading-none">9:41</span>
      <span className={cx("flex items-end", hub ? "gap-[5px]" : "gap-[3px]")}>
        <span className={cx("flex items-end", hub ? "h-[8px] gap-[1.5px]" : "h-[5px] gap-px")}>
          {[0.4, 0.6, 0.8, 1].map((h) => (
            <span
              key={h}
              className={cx("rounded-[0.5px]", ink, hub ? "w-[2px]" : "w-[1.2px]")}
              style={{ height: `${h * 100}%` }}
            />
          ))}
        </span>
        <span
          className={cx(
            "rounded-[2px] border p-px",
            tone === "dark" ? "border-ink/40" : "border-white/70",
            hub ? "h-[9px] w-[18px]" : "h-[5.5px] w-[11px] rounded-[1.5px]",
          )}
        >
          <span className={cx("block h-full w-[70%] rounded-[1px]", ink)} />
        </span>
      </span>
    </div>
  );
}

/** The client's mark: Sample Company's S in its own colour. */
function Mark({ className }: { className?: string }) {
  return (
    <span
      className={cx("grid shrink-0 place-items-center leading-none font-bold text-white", className)}
      style={{ background: CLIENT }}
    >
      S
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* The sender's phone                                                          */
/* -------------------------------------------------------------------------- */

function HubPhone({ t }: { t: number }) {
  const screen = t < HUB_T.live ? 0 : t < HUB_T.report ? 1 : 2;
  // Screens push in from the right, as an app navigates.
  const at = (i: number): CSSProperties => ({
    transform:
      i === screen ? "none" : i < screen ? "translate3d(-30%,0,0)" : "translate3d(104%,0,0)",
    opacity: i < screen ? 0 : 1,
    transition: "transform 650ms var(--ease-out-expo), opacity 450ms ease-out",
  });
  return (
    <Handset size="hub">
      <StatusBar tone="dark" size="hub" />
      <div className="absolute inset-x-0 bottom-0" style={{ top: HUB.bar }}>
        <div className="absolute inset-0 bg-white" style={at(0)}>
          <Compose t={t} />
        </div>
        <div className="absolute inset-0 bg-white" style={at(1)}>
          <Live t={t} />
        </div>
        <div className="absolute inset-0 bg-white" style={at(2)}>
          <Report t={t} />
        </div>
      </div>
    </Handset>
  );
}

function Ripple({ on, className }: { on: boolean; className?: string }) {
  return on ? (
    <span
      className={cx("absolute top-1/2 left-1/2 rounded-full bg-white/40", className)}
      style={{ animation: "demo-ripple 520ms ease-out both" }}
    />
  ) : null;
}

/* 1. Compose --------------------------------------------------------------- */

function Compose({ t }: { t: number }) {
  const text = typed(MESSAGE, t, HUB_T.type, HUB_T.perChar);
  const typing =
    t >= HUB_T.type - 200 && t < HUB_T.type + MESSAGE.length * HUB_T.perChar + 300;
  const pressing = t >= HUB_T.press && t < HUB_T.sent;
  const sent = t >= HUB_T.sent;

  return (
    <div className="relative h-full">
      <div className="flex h-[40px] items-center justify-between border-b border-line px-3">
        <span className="w-[44px] text-[10px] font-medium text-blue-500">Cancel</span>
        <span className="text-[11.5px] font-bold text-ink">New message</span>
        <span className="w-[44px]" />
      </div>

      <Field label="From">
        <Mark className="size-[18px] rounded-[5px] text-[9px]" />
        <span className="truncate text-[10.5px] font-semibold text-ink">{SENDER}</span>
      </Field>
      <Field label="To">
        {AUDIENCE.map((chip, i) =>
          t >= HUB_T.chips + i * HUB_T.chipGap ? (
            <span
              key={chip}
              className="shrink-0 rounded-full bg-blue-100 px-2 py-[4px] text-[9.5px] leading-none font-semibold whitespace-nowrap text-blue-700"
              style={pop}
            >
              {chip}
            </span>
          ) : null,
        )}
        <span
          className="ml-auto flex shrink-0 items-center gap-1 text-[10px] leading-none font-bold text-ink"
          style={reveal(t >= HUB_T.count)}
        >
          <UsersThree weight="bold" className="size-3 text-slate-400" />
          {TOTAL}
        </span>
      </Field>

      <div
        className={cx(
          "mx-3 mt-2.5 h-[92px] rounded-xl border px-2.5 py-2 transition-[border-color,box-shadow] duration-300",
          typing ? "border-blue-500 ring-[3px] ring-blue-500/10" : "border-line",
        )}
      >
        <p className="text-[11px] leading-[1.45]">
          {text ? (
            <span className="text-ink">{text}</span>
          ) : typing ? null : (
            <span className="text-slate-400/80">Write a message…</span>
          )}
          {typing ? (
            <span className="anim-blink ml-px inline-block h-[1.1em] w-px translate-y-[0.2em] bg-ink" />
          ) : null}
        </p>
      </div>

      <div
        className="mx-3 mt-2 flex h-[36px] items-center gap-2 rounded-lg border border-line px-2"
        style={reveal(t >= HUB_T.link)}
      >
        <Mark className="size-[22px] rounded-[6px] text-[10px]" />
        <span className="min-w-0">
          <span className="block truncate text-[9.5px] leading-tight font-bold text-ink">
            Oak St schedule update
          </span>
          <span className="block text-[8.5px] leading-tight text-slate-400">{LINK}</span>
        </span>
      </div>

      <div className="mx-3 mt-2.5 space-y-1.5">
        <Toggle
          on={t >= HUB_T.translate}
          icon={<Translate weight="bold" className="size-3" />}
          label="Translate for each person"
        />
        <Toggle
          on={t >= HUB_T.askAck}
          icon={<Check weight="bold" className="size-3" />}
          label="Ask them to acknowledge"
        />
      </div>

      <div className="absolute inset-x-3 bottom-3">
        <span
          className={cx(
            "relative flex h-[42px] items-center justify-center gap-1.5 overflow-hidden rounded-xl text-[11px] font-semibold text-white shadow-[0_10px_20px_-10px_rgba(5,130,220,0.8)] transition-[background-color,scale,filter] duration-200",
            sent ? "bg-green-700" : "bg-blue-500",
            pressing && "scale-95 brightness-90",
          )}
        >
          {sent ? (
            <>
              <Check weight="bold" className="size-3.5" />
              Sent to {TOTAL} people
            </>
          ) : (
            <>
              <PaperPlaneTilt weight="fill" className="size-3.5" />
              Send to {TOTAL} people
            </>
          )}
          <Ripple on={t >= HUB_T.press && t < HUB_T.press + 520} className="size-16" />
        </span>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mx-3 flex h-[34px] items-center gap-2 border-b border-line">
      <span className="w-[26px] shrink-0 text-[9.5px] text-slate-400">{label}</span>
      <div className="flex min-w-0 flex-1 items-center gap-1">{children}</div>
    </div>
  );
}

function Toggle({ on, icon, label }: { on: boolean; icon: ReactNode; label: string }) {
  return (
    <div className="flex h-[28px] items-center gap-1.5 rounded-lg bg-paper px-2">
      <span className={cx("transition-colors duration-300", on ? "text-blue-700" : "text-slate-400")}>
        {icon}
      </span>
      <span className="flex-1 truncate text-[9.5px] font-semibold text-ink">{label}</span>
      <span
        className={cx(
          "relative h-[14px] w-[24px] shrink-0 rounded-full transition-colors duration-300",
          on ? "bg-green-500" : "bg-slate-300",
        )}
      >
        <span
          className="absolute top-[2px] left-[2px] size-[10px] rounded-full bg-white shadow-sm transition-transform duration-300"
          style={{
            transform: on ? "translateX(10px)" : "none",
            transitionTimingFunction: "var(--ease-out-back)",
          }}
        />
      </span>
    </div>
  );
}

/* 2. Live record ------------------------------------------------------------ */

const PILL: Record<Status, { label: string; className: string }> = {
  sending: { label: "Sending", className: "bg-paper text-slate-400" },
  delivered: { label: "Delivered", className: "bg-blue-100 text-blue-700" },
  unseen: { label: "Not viewed", className: "bg-amber-50 text-amber-800" },
  resent: { label: "Resent", className: "bg-blue-100 text-blue-700" },
  viewed: { label: "Viewed", className: "bg-blue-700 text-white" },
  acked: { label: "Acknowledged", className: "bg-green-700 text-white" },
};

const LANG_NAME: Record<Lang, string> = { en: "English", es: "Español" };

/** When a returning message lands on each person's row. */
const LANDS_ON: Record<ReceiverId, number[]> = {
  maria: [LAND["view-maria"], LAND["ack-maria"]],
  sofia: [LAND["view-sofia"]],
  nate: [LAND["view-nate"]],
};

function Live({ t }: { t: number }) {
  const n = tally(t);
  const unseen = n.delivered - n.viewed;
  const ready = t >= HUB_T.followUp;
  const pressing = t >= HUB_T.resendPress && t < HUB_T.resent;
  const resent = t >= HUB_T.resent;

  return (
    <div className="relative h-full">
      <AppBar
        title="Oak St opens at 10 AM"
        sub={`Sent 9:40 AM · ${TOTAL} people`}
        right={
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-1.5 py-[3px] text-[7.5px] leading-none font-bold text-green-700">
            <span className="anim-pulse size-[5px] rounded-full bg-green-500" />
            Live
          </span>
        }
      />

      <div className="mx-2.5 mt-2 grid h-[60px] grid-cols-3 gap-1.5">
        <Tile label="Delivered" value={n.delivered} of={TOTAL} bar="bg-blue-400" />
        <Tile label="Viewed" value={n.viewed} of={DELIVERED} bar="bg-blue-700" />
        <Tile label="Acknowledged" value={n.acked} of={DELIVERED} bar="bg-green-500" />
      </div>

      <div className="flex h-[26px] items-end justify-between px-3 pb-[6px]">
        <span className="text-[7.5px] font-bold tracking-[0.12em] text-slate-400 uppercase">
          People
        </span>
        <span className="text-[7.5px] font-semibold text-slate-400">Latest first</span>
      </div>

      <ul className="mx-2.5 overflow-hidden rounded-lg border border-line">
        {RECEIVERS.map((r, i) => {
          const status = statusOf(r, t);
          const flash = LANDS_ON[r.id].some((at) => t >= at && t < at + 900);
          return (
            <li
              key={r.id}
              className={cx(
                "relative flex h-[34px] items-center gap-2 px-2",
                i > 0 && "border-t border-line",
              )}
            >
              <span
                className="absolute inset-0 bg-blue-100"
                style={{
                  opacity: flash ? 1 : 0,
                  transition: flash ? "none" : "opacity 800ms ease-out",
                }}
              />
              <span className="relative grid size-[22px] shrink-0 place-items-center rounded-full bg-paper text-[8px] font-bold text-slate-600">
                {r.initials}
              </span>
              <span className="relative min-w-0 flex-1">
                <span className="block truncate text-[9.5px] leading-tight font-bold text-ink">
                  {r.name}
                </span>
                <span className="block truncate text-[7.5px] leading-tight text-slate-400">
                  {r.group} · {LANG_NAME[r.lang]}
                </span>
              </span>
              <StatusPill status={status} />
            </li>
          );
        })}
        <li className="relative flex h-[34px] items-center gap-2 border-t border-line bg-amber-50/60 px-2">
          <span className="grid size-[22px] shrink-0 place-items-center rounded-full border border-dashed border-amber-500/60 text-[8px] font-bold text-amber-800">
            RM
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[9.5px] leading-tight font-bold text-ink">
              Rosa M.
            </span>
            <span className="block truncate text-[7.5px] leading-tight text-slate-400">
              Second shift
            </span>
          </span>
          <span className="inline-flex h-[17px] shrink-0 items-center rounded-full bg-amber-100 px-[6px] text-[7.5px] leading-none font-semibold text-amber-800">
            No number
          </span>
        </li>
      </ul>

      {/* Who hasn't looked yet, counting down as the views come in; the
          resend wakes up once the first wave has settled. */}
      {t >= MARIA.beats.arrive + 300 ? (
        <div
          className={cx(
            "absolute inset-x-2.5 top-[288px] h-[78px] rounded-xl border px-2.5 py-2 transition-[background-color,border-color,box-shadow] duration-500",
            ready
              ? "border-blue-500/40 bg-blue-100/60 shadow-[0_8px_20px_-12px_rgba(5,130,220,0.6)]"
              : "border-line bg-paper",
          )}
          style={{ animation: "demo-rise 480ms var(--ease-out-expo) both" }}
        >
          <p className="flex items-center gap-1 text-[10px] leading-tight font-bold text-ink">
            <ArrowClockwise
              weight="bold"
              className={cx("size-3", ready ? "text-blue-500" : "text-slate-400")}
            />
            {resent ? (
              `Resent to ${UNSEEN} people`
            ) : (
              <>
                <span className="tabular">{unseen}</span> haven’t viewed it yet
              </>
            )}
          </p>
          <p
            key={n.recovered > 0 ? "since" : resent ? "resent" : "idle"}
            className="mt-1 max-w-[118px] text-[8px] leading-snug text-slate-600"
            style={rise()}
          >
            {n.recovered > 0 ? (
              <>
                <b className="tabular font-bold text-green-700">{n.recovered} more</b> have
                viewed it since.
              </>
            ) : resent ? (
              "Only the people who haven’t opened it."
            ) : (
              "Delivered, link not opened yet."
            )}
          </p>
          <span
            className={cx(
              "absolute right-2 bottom-2 flex h-[24px] w-[78px] items-center justify-center gap-1 overflow-hidden rounded-lg text-[9px] font-semibold whitespace-nowrap text-white transition-[background-color,opacity,scale,filter] duration-300",
              resent ? "bg-green-700" : "bg-blue-500",
              !ready && "opacity-40",
              pressing && "scale-95 brightness-90",
            )}
          >
            {ready && !resent && t < HUB_T.resendPress ? (
              <span className="anim-pulse absolute inset-0 rounded-lg ring-2 ring-blue-400" />
            ) : null}
            {resent ? (
              <>
                <Check weight="bold" className="size-3" />
                Resent
              </>
            ) : (
              <span className="tabular">Resend to {unseen}</span>
            )}
            <Ripple
              on={t >= HUB_T.resendPress && t < HUB_T.resendPress + 520}
              className="size-12"
            />
          </span>
        </div>
      ) : null}
    </div>
  );
}

function AppBar({ title, sub, right }: { title: string; sub: string; right?: ReactNode }) {
  return (
    <div className="flex h-[46px] items-center gap-1.5 border-b border-line px-2.5">
      <CaretLeft weight="bold" className="size-3.5 shrink-0 text-blue-500" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10.5px] leading-tight font-bold text-ink">{title}</p>
        <p className="truncate text-[8px] leading-tight text-slate-400">{sub}</p>
      </div>
      {right}
    </div>
  );
}

function Tile({
  label,
  value,
  of,
  bar,
}: {
  label: string;
  value: number;
  of: number;
  bar: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-line px-1.5 py-1.5">
      <p className="tabular font-display text-[16px] leading-none font-bold text-ink">{value}</p>
      <p className="mt-[3px] truncate text-[7.5px] leading-tight font-semibold text-slate-600">
        {label}
      </p>
      <div className="mt-[5px] h-[3px] overflow-hidden rounded-full bg-paper">
        <div
          className={cx("h-full rounded-full", bar)}
          style={{ width: `${(value / of) * 100}%` }}
        />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  const pill = PILL[status];
  return (
    <span
      className={cx(
        "relative inline-flex h-[17px] shrink-0 items-center rounded-full px-[6px] text-[7.5px] leading-none font-semibold whitespace-nowrap transition-colors duration-500",
        pill.className,
      )}
    >
      <span key={status} className="inline-flex items-center gap-[3px]" style={rise()}>
        {status === "acked" ? <Check weight="bold" className="size-2" /> : null}
        {status === "resent" ? <ArrowClockwise weight="bold" className="size-2" /> : null}
        {pill.label}
      </span>
    </span>
  );
}

/* 3. Report ----------------------------------------------------------------- */

const RINGS = [
  { label: "Delivered", color: "#38b6ff", value: DELIVERED, of: TOTAL, note: `of ${TOTAL}` },
  { label: "Viewed", color: "#0582dc", value: VIEWED, of: DELIVERED, note: `+${RECOVERED}` },
  { label: "Acknowledged", color: "#38b000", value: ACKED, of: DELIVERED, note: "" },
] as const;

function Report({ t }: { t: number }) {
  const at = t - HUB_T.report;
  const grow = (i: number) => easeOut(clamp01((at - 450 - i * 170) / 1300));
  const viewedPct = Math.round((VIEWED / DELIVERED) * 100 * grow(1));

  return (
    <div className="relative h-full">
      <AppBar
        title="Report"
        sub="Oak St opens at 10 AM · 24 hrs"
        right={<span className="shrink-0 text-[8.5px] font-semibold text-blue-500">Export</span>}
      />

      <div className="mt-2 flex h-[112px] items-center gap-3 px-3">
        <svg viewBox="0 0 104 104" className="size-[104px] shrink-0">
          {RINGS.map((ring, i) => {
            const r = 46 - i * 10;
            const f = (ring.value / ring.of) * grow(i);
            return (
              <g key={ring.label}>
                <circle cx={52} cy={52} r={r} fill="none" stroke="#e8eef5" strokeWidth={7.5} />
                <circle
                  cx={52}
                  cy={52}
                  r={r}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={7.5}
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray={`${(f * 100).toFixed(2)} 100`}
                  transform="rotate(-90 52 52)"
                  opacity={f > 0.005 ? 1 : 0}
                />
              </g>
            );
          })}
          <text
            x={52}
            y={51}
            textAnchor="middle"
            className="fill-ink font-display"
            fontSize={15}
            fontWeight={700}
          >
            {viewedPct}%
          </text>
          <text x={52} y={62} textAnchor="middle" className="fill-slate-400" fontSize={6.5} fontWeight={600}>
            viewed
          </text>
        </svg>
        <ul className="min-w-0 flex-1 space-y-[8px]">
          {RINGS.map((ring, i) => (
            <li key={ring.label}>
              <p className="flex items-center gap-1 text-[7px] leading-none font-bold tracking-[0.08em] text-slate-400 uppercase">
                <span className="size-[6px] rounded-full" style={{ background: ring.color }} />
                {ring.label}
              </p>
              <p className="tabular mt-[3px] font-display text-[14px] leading-none font-bold text-ink">
                {Math.round(ring.value * grow(i))}
                {ring.note ? (
                  <span
                    className={cx(
                      "ml-1 font-sans text-[7.5px] font-semibold",
                      i === 1 ? "text-green-700" : "text-slate-400",
                    )}
                  >
                    {ring.note}
                  </span>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="mx-2.5 mt-2 flex h-[26px] items-center gap-1.5 rounded-lg bg-amber-50 px-2"
        style={reveal(at >= 1150)}
      >
        <span className="grid size-[13px] shrink-0 place-items-center rounded-full bg-amber-400 text-[8px] font-black text-ink-950">
          !
        </span>
        <span className="flex-1 truncate text-[8.5px] font-semibold text-amber-800">
          {NO_NUMBER} with no number on file
        </span>
        <span className="shrink-0 text-[7.5px] font-medium text-amber-800/70">Rosa M. +2</span>
      </div>

      <div
        className="mx-2.5 mt-2 rounded-lg border border-line px-2.5 pt-2 pb-1.5"
        style={reveal(at >= 700)}
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[8.5px] font-bold text-ink">Views over time</span>
          <span className="flex items-center gap-[3px] text-[7.5px] font-semibold text-green-700">
            <ArrowClockwise weight="bold" className="size-2.5" />+{RECOVERED} after resend
          </span>
        </div>
        <div className="relative mt-1.5 flex h-[44px] items-end gap-[3px]">
          {VIEWS.map((v, i) => (
            <span
              key={i}
              className={cx(
                "flex-1 rounded-t-[2px]",
                i >= RESEND_BAR ? "bg-green-500" : "bg-blue-500",
              )}
              style={{
                height: `${(v / VIEWS[0]) * 100 * easeOut(clamp01((at - 900 - i * 45) / 520))}%`,
              }}
            />
          ))}
          <span
            className="absolute top-[-2px] bottom-0 border-l border-dashed border-green-700/50"
            style={{ left: `calc(${(RESEND_BAR / VIEWS.length) * 100}% - 1.5px)` }}
          />
        </div>
        <div className="relative mt-1 flex justify-between text-[6.5px] leading-none text-slate-400">
          <span>Sent</span>
          <span
            className="absolute font-semibold text-green-700"
            style={{ left: `calc(${(RESEND_BAR / VIEWS.length) * 100}% - 1.5px)` }}
          >
            Resend
          </span>
          <span>Now</span>
        </div>
      </div>

      <div className="mx-2.5 mt-2.5 px-0.5" style={reveal(at >= 1500)}>
        <div className="flex items-baseline justify-between">
          <span className="text-[8.5px] font-bold text-ink">
            Sent in {LANGUAGES.length} languages
          </span>
          <span className="flex items-center gap-[3px] text-[7.5px] font-semibold text-slate-400">
            <Translate weight="bold" className="size-2.5" />
            Automatic
          </span>
        </div>
        <div className="mt-1.5 flex h-[6px] gap-[2px] overflow-hidden rounded-full bg-paper">
          {LANGUAGES.map((l) => (
            <span
              key={l.name}
              className="h-full"
              style={{
                width: `${(l.n / DELIVERED) * 100 * easeOut(clamp01((at - 1600) / 900))}%`,
                background: l.color,
              }}
            />
          ))}
        </div>
        <div className="mt-1.5 flex gap-2.5 text-[7px] leading-none text-slate-600">
          {LANGUAGES.map((l) => (
            <span key={l.name} className="whitespace-nowrap">
              <b className="tabular font-bold text-ink">{l.n}</b> {l.name}
            </span>
          ))}
        </div>
      </div>

      {/* The record that outlives the send. */}
      <div
        className="mx-2.5 mt-3 flex h-[32px] items-center gap-2 rounded-lg border border-line px-2"
        style={reveal(at >= 1900)}
      >
        <span className="grid size-[20px] shrink-0 place-items-center rounded-md bg-green-100 text-green-700">
          <SealCheck weight="fill" className="size-3" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[8.5px] leading-tight font-bold text-ink">
            {ACKED} timestamped sign-offs
          </span>
          <span className="block truncate text-[7px] leading-tight text-slate-400">
            Audit trail for HR records
          </span>
        </span>
        <span className="shrink-0 rounded-md bg-paper px-1.5 py-[3px] text-[7.5px] font-semibold text-blue-700">
          PDF
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* The receiving phones                                                        */
/* -------------------------------------------------------------------------- */

function ReceiverPhone({ r, t, report }: { r: Receiver; t: number; report: boolean }) {
  const b = r.beats;
  const awake = t >= b.arrive;
  const buzz =
    (t >= b.arrive && t < b.arrive + 520) ||
    (b.again !== undefined && t >= b.again && t < b.again + 520);
  const lit =
    (t >= b.arrive && t < b.arrive + 900) || (b.again !== undefined && t >= b.again && t < b.again + 900);
  const depth = report ? "receded" : awake ? "live" : "dormant";

  return (
    <div className="bcast-at z-10" style={place(WIDE.phones[r.id], TALL.phones[r.id])}>
      <div className="bcast-float" style={FLOAT[r.id]}>
        <div style={{ animation: buzz ? "bcast-buzz 520ms linear both" : undefined }}>
          <div
            className="relative isolate"
            style={{
              opacity: depth === "live" ? 1 : depth === "dormant" ? 0.62 : 0.45,
              filter: `blur(${depth === "live" ? 0 : depth === "dormant" ? 0.7 : 1.2}px)`,
              transform: depth === "live" ? "scale(1)" : "scale(0.95)",
              transition:
                "opacity 700ms ease-out, filter 700ms ease-out, transform 900ms var(--ease-out-expo)",
            }}
          >
            {/* It lights up when something lands. */}
            <span
              className="absolute -inset-5 -z-10 rounded-[40px] bg-blue-500/40 blur-2xl"
              style={{
                opacity: lit ? 1 : depth === "live" ? 0.35 : 0,
                transition: lit ? "opacity 150ms ease-out" : "opacity 1200ms ease-out",
              }}
            />
            <Handset size="mini">
              <ReceiverScreen r={r} t={t} />
            </Handset>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReceiverScreen({ r, t }: { r: Receiver; t: number }) {
  const b = r.beats;
  const copy = TEXT[r.lang];
  const notified = t >= b.arrive;
  const again = b.again !== undefined && t >= b.again;
  const asleep = !notified || (b.sleep !== undefined && t >= b.sleep && !again);
  const opened = t >= b.open;
  const onPage = t >= b.page;
  const tapping = t >= b.tap && t < b.tap + 450;
  const acking = b.ackPress !== undefined && b.ack !== undefined && t >= b.ackPress && t < b.ack;
  const acked = b.ack !== undefined && t >= b.ack;

  const notes = [
    ...(again ? [{ key: "again", text: REMINDER }] : []),
    ...(notified ? [{ key: "first", text: copy.sms }] : []),
  ];

  return (
    <div className="relative h-full">
      {/* Lock screen */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(130% 70% at 20% 0%, #1d4f7a 0%, #0d2740 45%, #050e1a 100%)",
          opacity: opened ? 0 : 1,
          transform: opened ? "scale(1.08)" : "none",
          transition: "opacity 380ms ease-out, transform 500ms var(--ease-out-expo)",
        }}
      >
        <StatusBar tone="light" size="mini" />
        <p className="mt-[5px] text-center text-[6.5px] leading-none font-medium text-white/70">
          Tuesday, March 3
        </p>
        <p className="mt-[3px] text-center font-display text-[30px] leading-none font-semibold tracking-tight text-white/95">
          9:41
        </p>
        <div className="absolute inset-x-[5px] top-[84px] flex flex-col gap-[4px]">
          {notes.map((note) => (
            <div
              key={note.key}
              className="rounded-[9px] bg-white/85 px-[6px] py-[5px] shadow-[0_6px_14px_-6px_rgba(0,0,0,0.6)] backdrop-blur-md"
              style={{ animation: "bcast-drop 480ms var(--ease-out-expo) both" }}
            >
              <div className="flex items-center gap-[3px]">
                <span className="grid size-[9px] place-items-center rounded-[2.5px] bg-green-500 text-white">
                  <ChatCircle weight="fill" className="size-[6px]" />
                </span>
                <span className="text-[5.5px] font-semibold tracking-[0.06em] text-slate-600 uppercase">
                  Messages
                </span>
                <span className="ml-auto text-[5.5px] text-slate-400">now</span>
              </div>
              <p className="mt-[3px] text-[7px] leading-none font-bold text-ink">{SENDER}</p>
              <p className="mt-[2px] line-clamp-3 text-[6.6px] leading-[1.3] text-slate-600">
                {note.text}
              </p>
            </div>
          ))}
        </div>
        <span className="absolute bottom-[14px] left-[12px] size-[18px] rounded-full bg-white/15" />
        <span className="absolute right-[12px] bottom-[14px] size-[18px] rounded-full bg-white/15" />
        <span className="absolute bottom-[5px] left-1/2 h-[3px] w-[40px] -translate-x-1/2 rounded-full bg-white/70" />
      </div>

      {/* Messages thread */}
      <div
        className="absolute inset-0 bg-white"
        style={{
          opacity: opened ? 1 : 0,
          transform: opened ? "none" : "scale(0.94)",
          transition: "opacity 380ms ease-out, transform 500ms var(--ease-out-expo)",
        }}
      >
        <StatusBar tone="dark" size="mini" />
        <div className="relative flex h-[36px] flex-col items-center border-b border-line">
          <CaretLeft weight="bold" className="absolute top-[5px] left-[6px] size-[9px] text-blue-500" />
          <Mark className="size-[17px] rounded-full text-[7.5px]" />
          <span className="mt-[2px] text-[6.5px] leading-none font-semibold text-ink">{SENDER}</span>
        </div>
        <p className="mt-[5px] text-center text-[5.5px] leading-none text-slate-400">
          Text Message · Today 9:40 AM
        </p>
        <div className="mt-[4px] space-y-[4px] px-[6px]">
          <Bubble text={copy.sms} />
          {again ? <Bubble text={REMINDER} /> : null}
          <div
            className={cx(
              "relative w-[88%] overflow-hidden rounded-[9px] border border-line bg-white transition-[scale,filter] duration-200",
              tapping && "scale-[0.96] brightness-95",
            )}
          >
            <div className="flex h-[15px] items-center gap-[3px] px-[5px]" style={{ background: CLIENT }}>
              <span
                className="grid size-[8px] place-items-center rounded-[2px] bg-white text-[5.5px] font-black"
                style={{ color: CLIENT }}
              >
                S
              </span>
              <span className="text-[5.5px] font-bold tracking-[0.14em] text-white">SAMPLE CO</span>
            </div>
            <div className="px-[5px] py-[4px]">
              <p className="truncate text-[6.8px] leading-tight font-bold text-ink">{copy.card}</p>
              <p className="mt-px text-[5.5px] leading-tight text-slate-400">truhu.link</p>
            </div>
            {t >= b.tap && t < b.tap + 520 ? (
              <span
                className="absolute top-1/2 left-1/2 size-10 rounded-full bg-ink/15"
                style={{ animation: "demo-ripple 520ms ease-out both" }}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* The page the link opens: no app, no sign-in. */}
      <div
        className="absolute inset-0 flex flex-col bg-white"
        style={{
          transform: onPage ? "none" : "translate3d(0, 104%, 0)",
          transition: "transform 620ms var(--ease-out-expo)",
        }}
      >
        <StatusBar tone="dark" size="mini" />
        <div className="mx-[6px] flex h-[13px] items-center justify-center gap-[2px] rounded-[5px] bg-paper text-[5.5px] leading-none text-slate-400">
          <LockSimple weight="bold" className="size-[5px]" />
          {LINK}
        </div>
        <div className="mt-[5px] px-[8px] py-[7px]" style={{ background: CLIENT }}>
          <p className="text-[5px] leading-none font-bold tracking-[0.14em] text-white/75">
            SAMPLE COMPANY
          </p>
          <p className="mt-[4px] font-display text-[10px] leading-[1.15] font-bold text-white">
            {copy.title}
          </p>
        </div>
        <div className="px-[8px] pt-[6px]">
          <p className="text-[6.5px] leading-snug text-slate-600">{copy.body}</p>
          <div className="mt-[5px] rounded-[6px] border border-line px-[6px] py-[4px]">
            <p className="text-[5.5px] leading-none text-slate-400">{copy.slot}</p>
            <p className="tabular mt-[2px] text-[8.5px] leading-tight font-bold text-ink">
              10:00 AM – 6:30 PM
            </p>
          </div>
          <span
            className={cx(
              "mt-[7px] flex h-[20px] items-center justify-center gap-[3px] rounded-[7px] text-[7px] leading-none font-semibold text-white transition-[background-color,scale,filter] duration-300",
              acking && "scale-[0.95] brightness-90",
            )}
            style={{ background: acked ? "var(--color-green-700)" : CLIENT }}
          >
            {acked ? (
              <>
                <Check weight="bold" className="size-[7px]" />
                {copy.acked}
              </>
            ) : (
              copy.ack
            )}
          </span>
        </div>
        <p className="mt-auto pb-[9px] text-center text-[5px] leading-none text-slate-400">
          Powered by TruHu
        </p>
      </div>

      {/* Screen off: before anything arrives, and Nate's, in his pocket. */}
      <div
        className="pointer-events-none absolute inset-0 z-10 bg-black"
        style={{ opacity: asleep ? 0.6 : 0, transition: "opacity 600ms ease-out" }}
      />
    </div>
  );
}

function Bubble({ text }: { text: string }) {
  return (
    <div
      className="max-w-[92%] rounded-[10px] rounded-bl-[3px] bg-[#e9edf2] px-[6px] py-[5px] text-[6.8px] leading-[1.35] text-ink"
      style={{ animation: "demo-modal 420ms var(--ease-out-expo) both" }}
    >
      {text}{" "}
      <span className="font-medium text-blue-700 underline decoration-blue-700/40 underline-offset-1">
        {LINK}
      </span>
    </div>
  );
}

/* Name tags ------------------------------------------------------------------ */

const TAG: Record<Status, { label: string; className: string }> = {
  sending: { label: "Sending…", className: "text-white/45" },
  delivered: { label: "Delivered", className: "text-blue-400" },
  unseen: { label: "Not viewed yet", className: "text-amber-400" },
  resent: { label: "Resent", className: "text-blue-400" },
  viewed: { label: "Viewed", className: "text-green-400" },
  acked: { label: "Acknowledged", className: "text-green-400" },
};

function NameTag({ r, status }: { r: Receiver; status: Status }) {
  const tag = TAG[status];
  return (
    <div className="rounded-[10px] border border-white/12 bg-ink-900/90 px-2 py-[5px] whitespace-nowrap shadow-[0_12px_26px_-10px_rgba(0,0,0,0.85)] backdrop-blur-md">
      <p className="flex items-center gap-1 text-[9.5px] leading-none font-semibold text-white">
        {r.name}
        {r.lang !== "en" ? (
          <span className="rounded-[3px] bg-white/15 px-[3px] py-[1.5px] text-[7px] font-bold tracking-wide text-white/85 uppercase">
            {r.lang}
          </span>
        ) : null}
        <span className="font-medium text-white/45">· {r.group}</span>
      </p>
      <p
        key={status}
        className={cx("mt-[4px] flex items-center gap-1 text-[9px] leading-none font-semibold", tag.className)}
        style={rise()}
      >
        <TagGlyph status={status} />
        {tag.label}
      </p>
    </div>
  );
}

function TagGlyph({ status }: { status: Status }) {
  switch (status) {
    case "sending":
      return <span className="size-[6px] rounded-full border border-white/40" />;
    case "delivered":
      return <span className="size-[6px] rounded-full bg-blue-400" />;
    case "unseen":
      return <span className="size-[6px] rounded-full border border-amber-400" />;
    case "resent":
      return <ArrowClockwise weight="bold" className="size-[9px]" />;
    case "viewed":
      return <Eye weight="bold" className="size-[10px]" />;
    case "acked":
      return (
        <span className="grid size-[10px] place-items-center rounded-full bg-green-400 text-ink-950">
          <Check weight="bold" className="size-[7px]" />
        </span>
      );
  }
}
