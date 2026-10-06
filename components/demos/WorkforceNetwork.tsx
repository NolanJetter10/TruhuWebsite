"use client";

import { Clock, LockSimple, Pause, Play } from "@phosphor-icons/react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { PhoneFrame } from "@/components/art/frames";
import { cx } from "@/components/ui/primitives";
import { WORKFORCE_PAGE } from "@/lib/content";
import leaf from "@/public/brand/truhu-leaf.svg";
import { useInView, useReducedMotion } from "./hooks";

/**
 * How Workforce connects a company, told from both ends at once. On the left,
 * a phone running the Workforce app: someone types a message and sends it,
 * then the screen turns into that send's delivery record. On the right, the
 * company: one hub, six groups around it, and the message travelling out to
 * each person. Five scenarios cycle — a scheduled alert to one shift, a send
 * to everyone, a sign-off, a supervisor messaging only their team, and a
 * follow-up to only the people who haven't clicked.
 *
 * The phone's numbers and the graph are read from the same node states at
 * the same moment, so a count on the phone ticks exactly as a person lights
 * up on the graph.
 *
 * Every position is computed from constants at module load (no force layout),
 * so the server and client agree and nothing jitters. Lines are bundled — one
 * trunk per group from the hub, then short twigs to each person — which is
 * what keeps 32 people from reading as a hairball.
 *
 * One animation clock moves the message dots by writing their positions
 * directly; React re-renders twenty times a second for the node states and
 * the typing. The server renders each scenario's finished record, and under
 * reduced motion that is all there is; the rail still switches. Hovering never
 * pauses it; the Pause button does.
 */

const { network } = WORKFORCE_PAGE;
const { phone } = network;
type SceneId = (typeof network.scenarios)[number]["id"];
type SceneCopy = (typeof network.scenarios)[number];

/* -------------------------------------------------------------------------- */
/* Sample roster                                                              */
/* -------------------------------------------------------------------------- */

type GroupId = "ops" | "night" | "warehouse" | "drivers" | "second" | "corporate";

const GROUP_NAMES: Record<GroupId, string> = {
  ops: "HR & Ops",
  night: "Night crew",
  warehouse: "Warehouse",
  drivers: "Drivers & field",
  second: "Second shift",
  corporate: "Corporate",
};

type Person = {
  id: string;
  name: string;
  group: GroupId;
  role?: string;
  supervisor?: boolean;
};

const PEOPLE: readonly Person[] = [
  { id: "dana", name: "Dana K.", group: "ops", role: "HR" },
  { id: "priya", name: "Priya S.", group: "ops", role: "Operations" },
  { id: "tom", name: "Tom B.", group: "ops", role: "Benefits" },
  { id: "maria", name: "Maria S.", group: "night" },
  { id: "andre", name: "Andre W.", group: "night" },
  { id: "keisha", name: "Keisha L.", group: "night" },
  { id: "omar", name: "Omar H.", group: "night" },
  { id: "jin", name: "Jin P.", group: "night" },
  { id: "beth", name: "Beth C.", group: "night" },
  { id: "marcus", name: "Marcus J.", group: "warehouse", supervisor: true },
  { id: "devon", name: "Devon P.", group: "warehouse" },
  { id: "sofia", name: "Sofia R.", group: "warehouse" },
  { id: "hank", name: "Hank T.", group: "warehouse" },
  { id: "aisha", name: "Aisha B.", group: "warehouse" },
  { id: "carlos", name: "Carlos M.", group: "warehouse" },
  { id: "nate", name: "Nate G.", group: "drivers" },
  { id: "tanya", name: "Tanya F.", group: "drivers" },
  { id: "raj", name: "Raj K.", group: "drivers" },
  { id: "eddie", name: "Eddie V.", group: "drivers" },
  { id: "grace", name: "Grace O.", group: "drivers" },
  // Last on the arc: the open side, where his label fits on the wide layout.
  { id: "luis", name: "Luis R.", group: "drivers", supervisor: true },
  { id: "kevin", name: "Kevin D.", group: "second" },
  { id: "lena", name: "Lena W.", group: "second" },
  { id: "nina", name: "Nina M.", group: "second" },
  { id: "samir", name: "Samir A.", group: "second" },
  { id: "paula", name: "Paula N.", group: "second" },
  { id: "victor", name: "Victor E.", group: "second" },
  { id: "tomas", name: "Tomás R.", group: "corporate" },
  { id: "hannah", name: "Hannah L.", group: "corporate" },
  { id: "chris", name: "Chris P.", group: "corporate" },
  { id: "mei", name: "Mei T.", group: "corporate" },
  { id: "jordan", name: "Jordan S.", group: "corporate" },
];

const BY_ID = Object.fromEntries(PEOPLE.map((p) => [p.id, p])) as Record<
  string,
  Person
>;

const initials = (name: string) =>
  name
    .replace(/\./g, "")
    .split(" ")
    .map((part) => part[0])
    .join("");

/* -------------------------------------------------------------------------- */
/* Scenarios                                                                  */
/* -------------------------------------------------------------------------- */

type Outcome = "delivered" | "clicked" | "ack";

type ScenePlan = {
  /** Who sends it; null is the automatic follow-up, sent by the hub itself. */
  sender: string | null;
  audience: (p: Person) => boolean;
  /** Anyone not listed ends the scene as delivered. */
  outcome: Readonly<Record<string, Outcome>>;
  /** For the follow-up: where everyone stood before it went out. */
  prior?: Readonly<Record<string, Outcome>>;
  /** For the follow-up: the only people it goes to. */
  resend?: readonly string[];
  /** Draws a boundary round the group a supervisor may message. */
  boundary?: GroupId;
};

/** Delivered after the enrollment send but not clicked: the follow-up list. */
const NOT_CLICKED = [
  "keisha", "jin", "hank", "carlos", "eddie", "kevin", "paula", "chris", "jordan",
];

const everyoneElse = (p: Person) => p.group !== "ops";

const ENROLLMENT_OUTCOME: Record<string, Outcome> = Object.fromEntries(
  PEOPLE.filter(everyoneElse).map((p) => [
    p.id,
    NOT_CLICKED.includes(p.id) ? "delivered" : "clicked",
  ]),
);

const PLANS: Record<SceneId, ScenePlan> = {
  safety: {
    sender: "priya",
    audience: (p) => p.group === "night",
    outcome: { maria: "clicked", andre: "clicked", omar: "clicked", beth: "clicked" },
  },
  enrollment: {
    sender: "tom",
    audience: everyoneElse,
    outcome: ENROLLMENT_OUTCOME,
  },
  policy: {
    sender: "dana",
    audience: (p) => p.group === "warehouse",
    outcome: { marcus: "ack", devon: "ack", sofia: "ack", aisha: "ack" },
  },
  supervisor: {
    sender: "luis",
    audience: (p) => p.group === "drivers" && p.id !== "luis",
    outcome: { nate: "clicked", tanya: "clicked", raj: "clicked" },
    boundary: "drivers",
  },
  followup: {
    sender: null,
    audience: everyoneElse,
    prior: ENROLLMENT_OUTCOME,
    resend: NOT_CLICKED,
    outcome: {
      ...ENROLLMENT_OUTCOME,
      keisha: "clicked",
      hank: "clicked",
      eddie: "clicked",
      paula: "clicked",
      chris: "clicked",
    },
  },
};

/* -------------------------------------------------------------------------- */
/* Timeline                                                                   */
/* -------------------------------------------------------------------------- */

const SCENE_MS = 10000;
/** The finished record: rendered on the server and under reduced motion. */
const SETTLED = 9600;
/** How often React hears the clock: fine enough for the typing to read. */
const TICK = 50;
const T = {
  /** The phone: the message types out, Send is pressed, the record opens. */
  typeStart: 450,
  typeEnd: 2050,
  press: 2150,
  record: 2450,
  /** The graph: sender to hub, hub out to everyone, then states settle. */
  send: 2400,
  sendDur: 800,
  fan: 3200,
  stagger: 45,
  fanDur: 700,
  state: 4300,
  stateSpan: 1500,
  backDur: 750,
};

type DotKind = "send" | "out" | "back";
type Dot = { kind: DotKind; person: string; start: number; dur: number };

type Timing = { arrive: number; settle: number };

type Scene = {
  id: SceneId;
  plan: ScenePlan;
  recipients: readonly Person[];
  /** Who this send actually goes to: everyone, or the follow-up's list. */
  targets: readonly Person[];
  timing: Readonly<Record<string, Timing>>;
  dots: readonly Dot[];
  tally: { n: number; clicked: number; ack: number; resent: number };
};

function buildScene(id: SceneId): Scene {
  const plan = PLANS[id];
  const recipients = PEOPLE.filter(
    (p) => p.id !== plan.sender && plan.audience(p),
  );
  const targets = plan.resend
    ? recipients.filter((p) => plan.resend!.includes(p.id))
    : recipients;

  const dots: Dot[] = [];
  const timing: Record<string, Timing> = {};
  if (plan.sender) {
    dots.push({ kind: "send", person: plan.sender, start: T.send, dur: T.sendDur });
  }

  const step = T.stateSpan / Math.max(1, targets.length);
  targets.forEach((p, i) => {
    const start = T.fan + i * T.stagger;
    const arrive = start + T.fanDur;
    const settle = Math.max(arrive + 250, T.state + i * step);
    timing[p.id] = { arrive, settle };
    dots.push({ kind: "out", person: p.id, start, dur: T.fanDur });
    if (plan.outcome[p.id] === "ack") {
      dots.push({ kind: "back", person: p.id, start: settle, dur: T.backDur });
    }
  });

  const final = (p: Person) => plan.outcome[p.id] ?? "delivered";
  return {
    id,
    plan,
    recipients,
    targets,
    timing,
    dots,
    tally: {
      n: recipients.length,
      clicked: recipients.filter((p) => final(p) !== "delivered").length,
      ack: recipients.filter((p) => final(p) === "ack").length,
      resent: targets.length,
    },
  };
}

const SCENES: readonly Scene[] = network.scenarios.map((s) => buildScene(s.id));

type NodeState = "out" | "waiting" | "delivered" | "clicked" | "ack";

type NodeView = {
  state: NodeState;
  /** Waiting on the follow-up. */
  pending: boolean;
  sender: boolean;
};

function nodeView(scene: Scene, p: Person, e: number): NodeView {
  const { plan, timing } = scene;
  const sender = plan.sender === p.id;
  if (sender) return { state: "waiting", pending: false, sender };
  if (!plan.audience(p)) return { state: "out", pending: false, sender };

  const prior = plan.prior?.[p.id];
  const time = timing[p.id];
  if (!time) {
    // In the audience but not in this send: the follow-up's earlier clickers.
    return { state: prior ?? "delivered", pending: false, sender };
  }
  const final = plan.outcome[p.id] ?? "delivered";
  if (e >= time.settle) return { state: final, pending: false, sender };
  if (e >= time.arrive) return { state: "delivered", pending: false, sender };
  if (prior) return { state: prior, pending: true, sender };
  return { state: "waiting", pending: false, sender };
}

const STATUS_LABEL: Record<NodeState, string> = {
  out: "Not in this send",
  waiting: phone.sending,
  delivered: network.legend.delivered,
  clicked: network.legend.clicked,
  ack: network.legend.ack,
};

function fillCaption(template: string, tally: Scene["tally"]) {
  return template.replace(/\{(\w+)\}/g, (_, key: keyof Scene["tally"]) =>
    String(tally[key] ?? ""),
  );
}

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

/* -------------------------------------------------------------------------- */
/* Layouts                                                                    */
/* -------------------------------------------------------------------------- */

type Pt = { x: number; y: number };
type Path = { pts: Pt[]; cum: number[]; len: number };

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

const toSvg = (pts: Pt[]) =>
  pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

const deg = (d: number) => (d * Math.PI) / 180;

/**
 * Every drawn coordinate is rounded to a tenth. Node and the browser can
 * disagree in the last digit of a sine or cosine, and an unrounded value in an
 * SVG attribute is then a hydration mismatch.
 */
const r1 = (n: number) => Math.round(n * 10) / 10;
const pt = (x: number, y: number): Pt => ({ x: r1(x), y: r1(y) });

type GroupSpec = {
  center: Pt;
  /** The direction the group's arc faces, in radians. */
  facing: number;
  label: Pt;
  anchor: "start" | "middle" | "end";
  trunk: Pt[];
};

type Layout = {
  key: "wide" | "tall";
  w: number;
  h: number;
  hub: Pt;
  nodeR: number;
  arcR: number;
  /** Scales the SVG type, so it reads at the same size on both layouts. */
  type: number;
  groups: Record<GroupId, GroupSpec>;
  people: Record<string, Pt>;
  /** Hub to each person, along the trunk then the twig. */
  paths: Record<string, Path>;
};

function curve(a: Pt, b: Pt, bend: number): Pt[] {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const c = {
    x: mx - ((b.y - a.y) / len) * len * bend,
    y: my + ((b.x - a.x) / len) * len * bend,
  };
  return Array.from({ length: 21 }, (_, i) => {
    const t = i / 20;
    const u = 1 - t;
    return pt(
      u * u * a.x + 2 * u * t * c.x + t * t * b.x,
      u * u * a.y + 2 * u * t * c.y + t * t * b.y,
    );
  });
}

function finishLayout(
  base: Omit<Layout, "people" | "paths">,
  span: number,
): Layout {
  const people: Record<string, Pt> = {};
  const paths: Record<string, Path> = {};
  (Object.keys(GROUP_NAMES) as GroupId[]).forEach((gid) => {
    const g = base.groups[gid];
    const members = PEOPLE.filter((p) => p.group === gid);
    members.forEach((p, i) => {
      const k = members.length === 1 ? 0 : i / (members.length - 1) - 0.5;
      const a = g.facing + span * k;
      const at = pt(
        g.center.x + base.arcR * Math.cos(a),
        g.center.y + base.arcR * Math.sin(a),
      );
      people[p.id] = at;
      paths[p.id] = makePath([...g.trunk, at]);
    });
  });
  return { ...base, people, paths };
}

/**
 * Wide: the hub in the middle, the groups on a flat ellipse around it. Drawn
 * wider than tall so the whole scene, phone included, fits a laptop screen.
 */
const WIDE: Layout = (() => {
  const hub = { x: 480, y: 280 };
  const angles: Record<GroupId, number> = {
    ops: 180,
    night: 240,
    warehouse: 300,
    drivers: 0,
    second: 60,
    corporate: 120,
  };
  const arcR = 60;
  const groups = {} as Record<GroupId, GroupSpec>;
  (Object.keys(angles) as GroupId[]).forEach((gid) => {
    const a = deg(angles[gid]);
    const center = pt(hub.x + 340 * Math.cos(a), hub.y + 190 * Math.sin(a));
    const below = center.y > hub.y + 10;
    groups[gid] = {
      center,
      facing: Math.atan2(center.y - hub.y, center.x - hub.x),
      label: pt(center.x, below ? center.y + arcR + 38 : center.y - arcR - 26),
      anchor: "middle",
      trunk: curve(hub, center, 0.14),
    };
  });
  return finishLayout(
    { key: "wide", w: 960, h: 560, hub, nodeR: 14, arcR, type: 1.15, groups },
    deg(150),
  );
})();

/** Tall: senders on top, the hub, then the groups off a central spine. */
const TALL: Layout = (() => {
  const hub = { x: 200, y: 190 };
  const arcR = 58;
  const down = deg(90);
  const elbow = (center: Pt): Pt[] =>
    center.x === hub.x
      ? [hub, center]
      : [hub, { x: hub.x, y: center.y }, center];
  const g = (
    center: Pt,
    facing: number,
    label: Pt,
    anchor: GroupSpec["anchor"],
  ): GroupSpec => ({ center, facing, label, anchor, trunk: elbow(center) });
  const groups: Record<GroupId, GroupSpec> = {
    ops: g({ x: 200, y: 78 }, deg(-90), { x: 104, y: 82 }, "end"),
    night: g({ x: 100, y: 330 }, down, { x: 100, y: 308 }, "middle"),
    warehouse: g({ x: 300, y: 330 }, down, { x: 300, y: 308 }, "middle"),
    drivers: g({ x: 100, y: 465 }, down, { x: 100, y: 443 }, "middle"),
    second: g({ x: 300, y: 465 }, down, { x: 300, y: 443 }, "middle"),
    corporate: g({ x: 200, y: 600 }, down, { x: 64, y: 576 }, "middle"),
  };
  return finishLayout(
    { key: "tall", w: 400, h: 690, hub, nodeR: 13, arcR, type: 1, groups },
    deg(170),
  );
})();

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

type DotRefs = Record<Layout["key"], (SVGGElement | null)[]>;

export function WorkforceNetwork() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const reduced = useReducedMotion();
  const [scene, setScene] = useState(0);
  const [tick, setTick] = useState(Math.floor(SETTLED / TICK));
  const [playing, setPlaying] = useState(true);
  const [interacted, setInteracted] = useState(false);
  /** Bumped whenever a scene starts from the top, to restart its progress bar. */
  const [run, setRun] = useState(0);
  const elapsed = useRef(SETTLED);
  const started = useRef(false);
  const dotRefs = useRef<DotRefs>({ wide: [], tall: [] });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const current = SCENES[scene];
  const copy = network.scenarios[scene];
  const running = inView && playing && !reduced;
  const at = reduced ? SETTLED : tick * TICK;

  // Moves every dot for the given moment; called every animation frame.
  const paint = useCallback((ms: number, s: Scene) => {
    (Object.keys(dotRefs.current) as Layout["key"][]).forEach((key) => {
      const layout = key === "wide" ? WIDE : TALL;
      s.dots.forEach((dot, i) => {
        const node = dotRefs.current[key][i];
        if (!node) return;
        const t = (ms - dot.start) / dot.dur;
        if (t < 0 || t > 1) {
          node.setAttribute("opacity", "0");
          return;
        }
        const inbound = dot.kind === "send" || dot.kind === "back";
        const path = layout.paths[dot.person];
        const pos = inbound ? 1 - t : t;
        const lag = 20 / path.len;
        const head = pointAt(path, pos);
        const tail = pointAt(path, inbound ? pos + lag : pos - lag);
        const [halo, dotHead, dotTail] = node.children;
        for (const el of [halo, dotHead]) {
          el.setAttribute("cx", head.x.toFixed(1));
          el.setAttribute("cy", head.y.toFixed(1));
        }
        dotTail.setAttribute("cx", tail.x.toFixed(1));
        dotTail.setAttribute("cy", tail.y.toFixed(1));
        node.setAttribute("opacity", "1");
      });
    });
  }, []);

  // The clock. It restarts whenever a scene begins (the loop moves on, or a
  // scenario is picked), stops only while paused or off screen, and carries
  // on from where it was.
  useEffect(() => {
    if (!running) return;
    if (!started.current) {
      // First time on screen: play the first scene from the top rather than
      // from the finished record the server drew.
      started.current = true;
      elapsed.current = 0;
    }
    const s = SCENES[scene];
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      elapsed.current += Math.min(now - last, 64);
      last = now;
      if (elapsed.current >= SCENE_MS) {
        elapsed.current = 0;
        setScene((scene + 1) % SCENES.length);
        setRun((r) => r + 1);
        return;
      }
      paint(elapsed.current, s);
      setTick(Math.floor(elapsed.current / TICK));
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [running, scene, run, paint]);

  // Picking a scenario plays it from the top, and the loop carries on after.
  const pick = (i: number) => {
    setInteracted(true);
    setScene(i);
    if (reduced) return;
    started.current = true;
    elapsed.current = 0;
    setTick(0);
    setRun((r) => r + 1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const n = SCENES.length;
    const next =
      event.key === "ArrowRight"
        ? (scene + 1) % n
        : event.key === "ArrowLeft"
          ? (scene - 1 + n) % n
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? n - 1
              : -1;
    if (next < 0) return;
    event.preventDefault();
    pick(next);
    tabRefs.current[next]?.focus();
  };

  const views = Object.fromEntries(
    PEOPLE.map((p) => [p.id, nodeView(current, p, at)]),
  ) as Record<string, NodeView>;
  const caption = fillCaption(copy.caption, current.tally);
  const counter = `${String(scene + 1).padStart(2, "0")} / ${String(SCENES.length).padStart(2, "0")}`;

  return (
    <div ref={ref}>
      <div
        id="network-panel"
        role="tabpanel"
        aria-labelledby={`network-tab-${copy.id}`}
        className="grid items-center gap-10 lg:grid-cols-[252px_minmax(0,1fr)] lg:gap-12 xl:gap-16"
      >
        <div className="mx-auto w-fit lg:mx-0">
          <PhoneApp scene={current} copy={copy} at={at} views={views} />
        </div>

        <div className="relative min-w-0">
          <Legend className="pointer-events-none absolute top-0 right-0 z-[1] hidden flex-col gap-1.5 lg:flex" />
          <div className="hidden md:block">
            <NetworkSvg layout={WIDE} scene={current} views={views} at={at} dotRefs={dotRefs} />
          </div>
          <div className="md:hidden">
            <NetworkSvg layout={TALL} scene={current} views={views} at={at} dotRefs={dotRefs} />
          </div>
        </div>
      </div>

      {/* The scenario, in one line under the scene. */}
      <div className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
        <span className="t-eyebrow tabular text-blue-400">{counter}</span>
        <p
          key={scene}
          className="text-[0.9375rem] leading-relaxed text-slate-300"
          style={{ animation: "hero-in 600ms var(--ease-out-expo) both" }}
        >
          <span className="font-semibold text-white">{copy.tab}.</span> {caption}
        </p>
      </div>
      <Legend className="mt-3 flex flex-wrap gap-x-4 gap-y-2 lg:hidden" />

      {/* The chapter rail: one segment per scenario, the current one filling
          as it plays. The loop keeps running under the pointer; only Pause
          stops it (WCAG 2.2.2). */}
      <div className="mt-5 flex items-start gap-4 sm:gap-6">
        <div
          role="tablist"
          aria-label={network.label}
          onKeyDown={onKeyDown}
          className="grid flex-1 grid-cols-5 gap-2 sm:gap-4"
        >
          {network.scenarios.map((item, i) => {
            const selected = i === scene;
            return (
              <button
                key={item.id}
                ref={(node) => {
                  tabRefs.current[i] = node;
                }}
                type="button"
                role="tab"
                id={`network-tab-${item.id}`}
                aria-selected={selected}
                aria-controls="network-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => pick(i)}
                className="group/tab min-w-0 cursor-pointer rounded-sm pt-2 pb-1 text-left"
              >
                <span className="relative block h-[2px] overflow-hidden rounded-full bg-white/[0.12]">
                  <span
                    key={selected ? `on-${run}` : "off"}
                    aria-hidden
                    className={cx(
                      "absolute inset-0 origin-left rounded-full",
                      i < scene && "bg-white/35",
                      i > scene && "scale-x-0",
                    )}
                    style={
                      selected
                        ? {
                            background: "var(--grad-brand-bright)",
                            animationName: reduced ? "none" : "dot-fill",
                            animationDuration: `${SCENE_MS}ms`,
                            animationTimingFunction: "linear",
                            animationFillMode: "both",
                            animationPlayState: running ? "running" : "paused",
                          }
                        : undefined
                    }
                  />
                </span>
                <span className="mt-3 flex items-baseline gap-2 text-[0.8125rem] font-semibold">
                  <span
                    className={cx(
                      "tabular transition-colors duration-300",
                      selected ? "text-blue-400" : "text-white/35",
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={cx(
                      "hidden truncate transition-colors duration-300 md:inline",
                      selected
                        ? "text-white"
                        : "text-white/45 group-hover/tab:text-white/80",
                    )}
                  >
                    {item.tab}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {reduced ? null : (
          <button
            type="button"
            aria-label={playing ? network.pause : network.play}
            onClick={() => {
              setInteracted(true);
              setPlaying((p) => !p);
            }}
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

      {/* The same record as text. The caption is read out only once the
          reader has taken control, so the loop doesn't talk over the page. */}
      <div className="sr-only">
        <p aria-live={interacted ? "polite" : "off"}>{`${copy.tab}. ${caption}`}</p>
        <ul>
          {current.recipients.map((p) => (
            <li key={p.id}>
              {`${p.name}, ${GROUP_NAMES[p.group]}: ${
                STATUS_LABEL[nodeView(current, p, SETTLED).state]
              }`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Every state has a shape as well as a colour. */
function Legend({ className }: { className: string }) {
  const items: { label: string; swatch: string; glyph?: string }[] = [
    { label: network.legend.delivered, swatch: "bg-blue-500" },
    { label: network.legend.clicked, swatch: "bg-green-400" },
    { label: network.legend.ack, swatch: "bg-green-400", glyph: "✓" },
  ];
  return (
    <ul
      aria-hidden
      className={cx("text-[0.75rem] font-medium text-white/55", className)}
    >
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2 lg:justify-end">
          <span className="lg:order-2">
            <span
              className={cx(
                "grid size-3 place-items-center rounded-full text-[7px] font-black text-ink-950",
                item.swatch,
              )}
            >
              {item.glyph}
            </span>
          </span>
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/* The phone                                                                  */
/* -------------------------------------------------------------------------- */

const CHIP: Record<NodeState, string> = {
  out: "bg-paper text-slate-400",
  waiting: "bg-paper text-slate-400",
  delivered: "bg-blue-100 text-blue-700",
  clicked: "bg-green-100 text-green-700",
  ack: "bg-green-100 text-green-700",
};

/**
 * The Workforce app on the sender's phone. The compose screen types the
 * scenario's message and presses Send; the delivery record then counts up
 * from the same node states the graph is drawing.
 */
function PhoneApp({
  scene,
  copy,
  at,
  views,
}: {
  scene: Scene;
  copy: SceneCopy;
  at: number;
  views: Record<string, NodeView>;
}) {
  const sender = scene.plan.sender ? BY_ID[scene.plan.sender] : null;
  const auto = !sender;
  const count = scene.targets.length;
  const recordOn = at >= T.record;

  const typedLength = auto
    ? copy.message.length
    : Math.round(
        copy.message.length *
          clamp01((at - T.typeStart) / (T.typeEnd - T.typeStart)),
      );
  const typing =
    !auto && !recordOn && at >= T.typeStart && typedLength < copy.message.length;
  const pressed = at >= T.press && at < T.record;
  const scheduled = copy.when !== "Now" && !auto;

  // Live counts, read off the same states the graph draws.
  const reached = (p: Person) =>
    views[p.id].state !== "waiting" && !views[p.id].pending;
  const tiles = [
    auto
      ? {
          label: phone.resent,
          value: scene.targets.filter((p) => at >= scene.timing[p.id].arrive)
            .length,
          total: count,
          bar: "bg-blue-500",
        }
      : {
          label: network.legend.delivered,
          value: scene.recipients.filter(reached).length,
          total: scene.recipients.length,
          bar: "bg-blue-500",
        },
    scene.id === "policy"
      ? {
          label: network.legend.ack,
          value: scene.recipients.filter((p) => views[p.id].state === "ack")
            .length,
          total: scene.recipients.length,
          bar: "bg-green-500",
        }
      : {
          label: network.legend.clicked,
          value: scene.recipients.filter(
            (p) => views[p.id].state === "clicked" || views[p.id].state === "ack",
          ).length,
          total: scene.recipients.length,
          bar: "bg-green-500",
        },
  ];
  const rows = (auto ? scene.targets : scene.recipients).slice(0, 3);

  return (
    <PhoneFrame width={252}>
      <div className="relative h-[430px] overflow-hidden bg-white text-ink">
        {/* App bar. */}
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span className="flex items-center gap-1.5 text-[12px] font-bold">
            <Image src={leaf} alt="" className="h-4 w-auto" />
            {phone.app}
          </span>
          <span className="text-[10px] font-semibold text-slate-400">
            {phone.org}
          </span>
        </div>

        <div className="relative h-[calc(100%-41px)]">
          {/* Compose ----------------------------------------------------- */}
          <Screen on={!recordOn} from="left">
            <p className="font-display text-[15px] font-bold">
              {auto ? phone.auto : phone.compose}
            </p>
            <dl className="mt-3 space-y-2 text-[11px]">
              <Field label={phone.from}>
                {sender ? (
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-blue-100 text-[8px] font-bold text-blue-700">
                      {initials(sender.name)}
                    </span>
                    <span className="truncate font-semibold">
                      {sender.name}
                      <span className="font-normal text-slate-400">
                        {" "}
                        · {sender.supervisor ? "Supervisor" : sender.role}
                      </span>
                    </span>
                  </span>
                ) : (
                  <span className="font-semibold">{GROUP_NAMES.ops}</span>
                )}
              </Field>
              <Field label={phone.to}>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10.5px] font-semibold text-blue-700">
                  {scene.plan.boundary ? (
                    <LockSimple aria-hidden weight="bold" className="size-2.5" />
                  ) : null}
                  {copy.to} · {count} {phone.people}
                </span>
              </Field>
              <Field label={phone.via}>
                <span className="rounded-full bg-paper px-2 py-0.5 text-[10.5px] font-semibold text-slate-600">
                  {copy.via}
                </span>
              </Field>
              <Field label={phone.when}>
                <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 text-[10.5px] font-semibold text-slate-600">
                  {copy.when !== "Now" ? (
                    <Clock aria-hidden weight="bold" className="size-2.5" />
                  ) : null}
                  {copy.when}
                </span>
              </Field>
            </dl>

            <div className="mt-3 min-h-[92px] rounded-xl border border-line bg-paper px-3 py-2.5 text-[12px] leading-snug">
              {copy.message.slice(0, typedLength)}
              {typing ? (
                <span
                  aria-hidden
                  className="anim-blink ml-px inline-block h-3.5 w-px translate-y-0.5 bg-blue-500"
                />
              ) : null}
            </div>

            <div
              className={cx(
                "absolute inset-x-4 bottom-4 rounded-xl py-2.5 text-center text-[12px] font-bold text-white transition-[transform,background-color] duration-200",
                auto
                  ? "bg-ink/80"
                  : pressed
                    ? "scale-[0.97] bg-blue-700"
                    : "bg-blue-500",
              )}
            >
              {auto
                ? phone.running
                : scheduled
                  ? phone.schedule
                  : `${phone.send} ${count} ${phone.people}`}
            </div>
          </Screen>

          {/* Delivery record ---------------------------------------------- */}
          <Screen on={recordOn} from="right">
            <p className="font-display text-[15px] font-bold">{phone.record}</p>
            <p className="mt-1 truncate text-[11px] text-slate-600">
              {copy.message}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              {copy.to} · {scheduled || auto ? copy.when : phone.sentNow}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {tiles.map((tile) => (
                <div
                  key={tile.label}
                  className="rounded-xl border border-line p-2.5"
                >
                  <p className="font-display text-[20px] leading-none font-bold tabular">
                    {tile.value}
                    <span className="text-[11px] font-semibold text-slate-400">
                      /{tile.total}
                    </span>
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-slate-600">
                    {tile.label}
                  </p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-paper">
                    <div
                      className={cx(
                        "h-full rounded-full transition-[width] duration-300",
                        tile.bar,
                      )}
                      style={{
                        width: `${(tile.value / Math.max(1, tile.total)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[9px] font-bold tracking-wider text-slate-400 uppercase">
              {phone.list}
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {rows.map((p) => {
                const v = views[p.id];
                const label = v.pending ? phone.resending : STATUS_LABEL[v.state];
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-paper px-2.5 py-1.5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-semibold">
                        {p.name}
                      </span>
                      <span className="block text-[9px] text-slate-400">
                        {GROUP_NAMES[p.group]}
                      </span>
                    </span>
                    <span
                      className={cx(
                        "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold transition-colors duration-300",
                        v.pending ? "bg-blue-100 text-blue-700" : CHIP[v.state],
                      )}
                    >
                      {v.state === "ack" ? "✓ " : ""}
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>

            <p className="absolute inset-x-4 bottom-4 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-400">
              <span className="anim-pulse size-1.5 rounded-full bg-green-500" />
              {phone.live}
            </p>
          </Screen>
        </div>
      </div>
    </PhoneFrame>
  );
}

/**
 * One of the app's two screens. The outgoing screen leaves quickly and the
 * incoming one waits for it, so the two never show through each other.
 */
function Screen({
  on,
  from,
  children,
}: {
  on: boolean;
  from: "left" | "right";
  children: ReactNode;
}) {
  return (
    <div
      aria-hidden={!on}
      className={cx(
        "absolute inset-0 px-4 pt-3.5 transition-[opacity,translate]",
        on
          ? "translate-x-0 opacity-100 delay-200 duration-500"
          : from === "left"
            ? "-translate-x-6 opacity-0 duration-200"
            : "translate-x-6 opacity-0 duration-200",
      )}
      style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
    >
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <dt className="w-9 shrink-0 text-[9px] font-bold tracking-wider text-slate-400 uppercase">
        {label}
      </dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* The graph                                                                  */
/* -------------------------------------------------------------------------- */

const NODE_CLASS: Record<NodeState, string> = {
  out: "fill-ink-900 stroke-white/10",
  waiting: "fill-ink-900 stroke-white/25",
  delivered: "fill-blue-500 stroke-blue-400/80",
  clicked: "fill-green-400 stroke-green-400",
  ack: "fill-green-400 stroke-green-400",
};

/** A soft halo behind a reached node; no SVG filters, so it stays cheap. */
const GLOW_CLASS: Partial<Record<NodeState, string>> = {
  delivered: "fill-blue-500/20",
  clicked: "fill-green-400/[0.14]",
  ack: "fill-green-400/[0.14]",
};

const TEXT_CLASS: Record<NodeState, string> = {
  out: "fill-white/40",
  waiting: "fill-white/75",
  delivered: "fill-white",
  clicked: "fill-ink-950",
  ack: "fill-ink-950",
};

const DOT_CLASS: Record<DotKind, string> = {
  send: "fill-white",
  out: "fill-blue-400",
  back: "fill-green-400",
};

function NetworkSvg({
  layout,
  scene,
  views,
  at,
  dotRefs,
}: {
  layout: Layout;
  scene: Scene;
  views: Record<string, NodeView>;
  at: number;
  dotRefs: RefObject<DotRefs>;
}) {
  const uid = useId().replace(/:/g, "");
  const { hub, nodeR: R, type } = layout;
  const inScope = (gid: GroupId) =>
    scene.recipients.some((p) => p.group === gid) ||
    (scene.plan.sender !== null && BY_ID[scene.plan.sender].group === gid);
  const autoSend =
    scene.plan.sender === null && at >= T.send && at < T.fan + 400;
  const boundary = scene.plan.boundary;
  const groupIds = Object.keys(layout.groups) as GroupId[];

  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${layout.w} ${layout.h}`}
      className="block h-auto w-full overflow-visible select-none"
    >
      <defs>
        <linearGradient id={`${uid}-ring`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38b6ff" />
          <stop offset="55%" stopColor="#21cfc0" />
          <stop offset="100%" stopColor="#57d95e" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`}>
          <stop offset="0%" stopColor="#0582dc" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#0582dc" stopOpacity="0" />
        </radialGradient>
        {/* Each lit trunk fades from the hub out to its group. */}
        {groupIds.map((gid) => {
          const c = layout.groups[gid].center;
          return (
            <linearGradient
              key={gid}
              id={`${uid}-trunk-${gid}`}
              gradientUnits="userSpaceOnUse"
              x1={hub.x}
              y1={hub.y}
              x2={c.x}
              y2={c.y}
            >
              <stop offset="0%" stopColor="#38b6ff" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#38b6ff" stopOpacity="0.18" />
            </linearGradient>
          );
        })}
      </defs>

      {/* The hub's glow and its quiet rings, under everything else. */}
      <circle cx={hub.x} cy={hub.y} r={110} fill={`url(#${uid}-glow)`} />
      <circle
        cx={hub.x}
        cy={hub.y}
        r={56}
        fill="none"
        strokeWidth={1}
        className="stroke-white/[0.07]"
      />
      <circle
        cx={hub.x}
        cy={hub.y}
        r={86}
        fill="none"
        strokeWidth={1}
        strokeDasharray="2 7"
        className="stroke-white/[0.08]"
      />

      {/* Trunks and twigs. Lit only where this scene goes. */}
      {groupIds.map((gid) => {
        const g = layout.groups[gid];
        const lit = inScope(gid);
        return (
          <g key={gid}>
            <path
              d={toSvg(g.trunk)}
              fill="none"
              strokeWidth={lit ? 1.5 : 1}
              strokeLinecap="round"
              stroke={
                lit ? `url(#${uid}-trunk-${gid})` : "rgba(255,255,255,0.07)"
              }
            />
            {PEOPLE.filter((p) => p.group === gid).map((p) => (
              <line
                key={p.id}
                x1={g.center.x}
                y1={g.center.y}
                x2={layout.people[p.id].x}
                y2={layout.people[p.id].y}
                strokeWidth={0.8}
                className={cx(
                  "transition-[stroke] duration-500",
                  views[p.id].state === "out"
                    ? "stroke-white/[0.05]"
                    : "stroke-white/[0.16]",
                )}
              />
            ))}
            <circle
              cx={g.center.x}
              cy={g.center.y}
              r={2.5}
              className={cx(
                "transition-[fill] duration-500",
                lit ? "fill-blue-400/80" : "fill-white/15",
              )}
            />
          </g>
        );
      })}

      {/* The supervisor's reach. */}
      {boundary ? (
        <circle
          cx={layout.groups[boundary].center.x}
          cy={layout.groups[boundary].center.y}
          r={layout.arcR + 32}
          fill="none"
          strokeWidth={1.2}
          strokeDasharray="4 6"
          className="stroke-green-400/55"
          style={{ animation: "hero-in 600ms var(--ease-out-expo) both" }}
        />
      ) : null}

      {/* Group labels. */}
      {groupIds.map((gid) => {
        const g = layout.groups[gid];
        return (
          <text
            key={gid}
            x={g.label.x}
            y={g.label.y}
            textAnchor={g.anchor}
            fontSize={r1(10.5 * type)}
            fontWeight={600}
            letterSpacing="0.16em"
            className={cx(
              "uppercase transition-[fill] duration-500",
              inScope(gid) ? "fill-white/60" : "fill-white/[0.22]",
            )}
          >
            {GROUP_NAMES[gid]}
          </text>
        );
      })}

      {/* Moving dots, positioned by the animation clock: a soft halo, the
          dot, and a short tail. */}
      <g>
        {scene.dots.map((dot, i) => (
          <g
            key={`${scene.id}-${i}`}
            ref={(node) => {
              dotRefs.current[layout.key][i] = node;
            }}
            opacity={0}
            className={DOT_CLASS[dot.kind]}
          >
            <circle r={8} opacity={0.18} />
            <circle r={3.2} />
            <circle r={2} opacity={0.45} />
          </g>
        ))}
      </g>

      {/* People. */}
      {PEOPLE.map((p) => {
        const spot = layout.people[p.id];
        const v = views[p.id];
        const r = p.supervisor ? R + 1.5 : R;
        const glow = GLOW_CLASS[v.state];
        return (
          <g
            key={p.id}
            transform={`translate(${spot.x.toFixed(1)} ${spot.y.toFixed(1)})`}
            className="transition-opacity duration-500"
            opacity={v.state === "out" ? 0.25 : 1}
          >
            <circle
              r={r + 7}
              className={cx(
                "transition-opacity duration-500",
                glow ?? "fill-transparent",
              )}
              opacity={glow ? 1 : 0}
            />
            {v.pending ? (
              <circle
                r={r + 5}
                fill="none"
                strokeWidth={1.2}
                className="anim-pulse stroke-blue-400"
              />
            ) : null}
            {v.sender ? (
              <circle
                r={r + 4.5}
                fill="none"
                strokeWidth={1.5}
                className="stroke-white/90"
              />
            ) : null}
            {p.supervisor ? (
              <circle
                r={r + 3}
                fill="none"
                strokeWidth={0.8}
                className="stroke-white/30"
              />
            ) : null}
            <circle
              r={r}
              strokeWidth={1.2}
              className={cx(
                "transition-[fill,stroke] duration-500",
                NODE_CLASS[v.state],
              )}
            />
            <text
              textAnchor="middle"
              dy="0.35em"
              fontSize={r1(9.5 * type)}
              fontWeight={600}
              letterSpacing="0.02em"
              className={cx("transition-[fill] duration-500", TEXT_CLASS[v.state])}
            >
              {initials(p.name)}
            </text>
            {v.state === "ack" ? (
              <g transform={`translate(${r1(r * 0.72)} ${r1(r * 0.72)})`}>
                <circle
                  r={6}
                  className="fill-ink-950 stroke-green-400"
                  strokeWidth={1.2}
                />
                <path
                  d="M-2.6 0.1 L-0.8 1.9 L2.7 -1.8"
                  fill="none"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="stroke-green-400"
                />
              </g>
            ) : null}
          </g>
        );
      })}

      {/* The sender's name, under their node. On the tall layout the groups
          sit too close for a supervisor's label, so only the senders at the
          top get one there; the phone names Luis anyway. */}
      {PEOPLE.filter(
        (p) =>
          views[p.id].sender && (layout.key === "wide" || p.group === "ops"),
      ).map((p) => {
        const spot = layout.people[p.id];
        return (
          <text
            key={`label-${p.id}`}
            x={spot.x}
            y={r1(spot.y + R + 17 * type)}
            textAnchor="middle"
            fontSize={r1(10.5 * type)}
            fontWeight={600}
            stroke="#050e1a"
            strokeWidth={4}
            paintOrder="stroke"
            className="fill-white/85"
            style={{ animation: "hero-in 400ms var(--ease-out-expo) both" }}
          >
            {`${p.name} · ${p.supervisor ? "Supervisor" : p.role}`}
          </text>
        );
      })}

      {/* The hub. */}
      {autoSend ? (
        <circle
          cx={hub.x}
          cy={hub.y}
          r={44}
          fill="none"
          strokeWidth={1.5}
          className="anim-pulse stroke-green-400"
        />
      ) : null}
      <rect
        x={hub.x - 30}
        y={hub.y - 30}
        width={60}
        height={60}
        rx={17}
        className="fill-ink-900"
        stroke={`url(#${uid}-ring)`}
        strokeWidth={1.5}
      />
      <image
        href="/brand/truhu-leaf.svg"
        x={hub.x - 9.5}
        y={hub.y - 20}
        width={19}
        height={40}
      />
    </svg>
  );
}
