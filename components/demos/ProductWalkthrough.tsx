"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { BrowserFrame } from "@/components/art/frames";
import { cx } from "@/components/ui/primitives";
import { useInView, useReducedMotion } from "./hooks";

/**
 * The whole product in one ~28 second loop, played like a screen recording:
 * create an account, drop in the plan documents, watch them get classified,
 * build a guide, ask the AI for a change, share it.
 *
 * The app screens are deliberately simplified versions of the real ones. The
 * real screens are the reference for layout and wording, not something to
 * copy element for element.
 *
 * Timing is a list of beats. Each beat names the screen, what the cursor
 * does, and how long it lasts; everything inside a beat is derived from the
 * time elapsed in it, so a screen can type, tick and update without timers of
 * its own. The cursor is placed from layout offsets rather than from
 * `getBoundingClientRect`, so the hero's 3D entrance and the modals' scale-in
 * never throw its aim off.
 */

const STAGES = [
  { name: "Upload your documents", short: "Upload" },
  { name: "AI organizes and extracts your documents", short: "Organize" },
  { name: "Build the output", short: "Build" },
  { name: "Refine your guide and share", short: "Refine & share" },
] as const;

type SceneName = "accounts" | "account" | "building" | "editor";
type OverlayName = "new-account" | "upload";
/** A `data-demo` target, or a point as fractions of the screen. */
type Target = string | readonly [number, number];

type Beat = {
  id: string;
  stage: number;
  ms: number;
  scene: SceneName;
  overlay?: OverlayName;
  moves?: readonly { to: Target; at: number }[];
  /** When the cursor presses whatever it last moved to. */
  click?: number;
  /** The window, in beat time, where the cursor is carrying files. */
  carry?: readonly [number, number];
  hideCursor?: boolean;
};

const BEATS: readonly Beat[] = [
  // Upload your documents
  { id: "accounts", stage: 0, ms: 1500, scene: "accounts", moves: [{ to: "new-account", at: 250 }], click: 1100 },
  { id: "type-account", stage: 0, ms: 2300, scene: "accounts", overlay: "new-account", moves: [{ to: "name-field", at: 350 }], click: 850 },
  { id: "create", stage: 0, ms: 1000, scene: "accounts", overlay: "new-account", moves: [{ to: "create", at: 0 }], click: 700 },
  { id: "open-upload", stage: 0, ms: 1400, scene: "account", moves: [{ to: "upload", at: 300 }], click: 1100 },
  {
    id: "drag",
    stage: 0,
    ms: 1900,
    scene: "account",
    overlay: "upload",
    moves: [
      { to: [1.06, 0.66], at: 0 },
      { to: "dropzone", at: 850 },
    ],
    carry: [650, 1650],
  },
  // AI organizes and extracts your documents
  { id: "classify", stage: 1, ms: 3000, scene: "account", overlay: "upload", moves: [{ to: [0.9, 0.9], at: 200 }] },
  { id: "extract", stage: 1, ms: 2000, scene: "account", overlay: "upload", moves: [{ to: "done", at: 900 }], click: 1650 },
  // Build the output
  { id: "choose-output", stage: 2, ms: 1400, scene: "account", moves: [{ to: "make-guide", at: 250 }], click: 1100 },
  { id: "building", stage: 2, ms: 3000, scene: "building", hideCursor: true },
  { id: "built", stage: 2, ms: 1500, scene: "editor", hideCursor: true },
  // Refine your guide and share
  { id: "prompt", stage: 3, ms: 3300, scene: "editor", moves: [{ to: "prompt", at: 0 }], click: 600 },
  { id: "apply", stage: 3, ms: 900, scene: "editor", moves: [{ to: "apply", at: 0 }], click: 650 },
  { id: "update", stage: 3, ms: 2100, scene: "editor", moves: [{ to: [0.3, 0.72], at: 150 }] },
  { id: "share", stage: 3, ms: 1200, scene: "editor", moves: [{ to: "share", at: 150 }], click: 950 },
  { id: "shared", stage: 3, ms: 2100, scene: "editor" },
];

/**
 * Reduced motion never plays the loop: it shows the end of one stage, with
 * every change in it already landed. The final stage by default; the progress
 * circles still switch between them.
 */
const SETTLED = 1e9;

const STAGE_MS = STAGES.map((_, s) =>
  BEATS.filter((b) => b.stage === s).reduce((sum, b) => sum + b.ms, 0),
);

/** How far through its stage a beat starts, in ms. */
const STAGE_OFFSET = BEATS.map((b, i) =>
  BEATS.slice(0, i)
    .filter((prev) => prev.stage === b.stage)
    .reduce((sum, prev) => sum + prev.ms, 0),
);

const FIRST_BEAT_OF_STAGE = STAGES.map((_, s) =>
  BEATS.findIndex((b) => b.stage === s),
);

const LAST_BEAT_OF_STAGE = STAGES.map((_, s) =>
  BEATS.findLastIndex((b) => b.stage === s),
);

const URLS: Record<SceneName, string> = {
  accounts: "app.truhu.ai / accounts",
  account: "app.truhu.ai / accounts / sampleco",
  building: "app.truhu.ai / sampleco / guides / new",
  editor: "app.truhu.ai / guides / sampleco-2027",
};

/* -------------------------------------------------------------------------- */
/* Sample content                                                              */
/* -------------------------------------------------------------------------- */

/** Deliberately not a TruHu colour: after the AI edit the guide carries the client's brand. */
const CLIENT_BRAND = "#0E5A63";
const CLIENT_ACCENT = "#F2A93B";
const PLACEHOLDER_BRAND = "#64748b";

const COMPANY = "Sample Company";
const WEBSITE = "samplecompany.com";
const PROMPT =
  "Make the branding match the company's website and include more information in the tables";

const ACCOUNTS = [
  { initials: "BL", name: "Bluewater Logistics", renewal: "Jan 1", live: true },
  { initials: "HC", name: "Harbor Clinics", renewal: "Feb 1", live: true },
  { initials: "ST", name: "Summit Tool & Die", renewal: "Mar 1", live: false },
  { initials: "OS", name: "Oakview Schools", renewal: "Jul 1", live: true },
];

const FILES = [
  { name: "SampleCompany_2027_SBC_PPO.pdf", kind: "Summary of benefits" },
  { name: "SampleCompany_2027_SBC_HDHP.pdf", kind: "Summary of benefits" },
  { name: "2027_Rates_Contributions.xlsx", kind: "Rate sheet" },
  { name: "Dental_Vision_Summary.pdf", kind: "Dental & vision" },
];

const EXTRACTED = ["PPO deductible $1,500", "HSA seed $750", "Dental $0 / check"];

const OUTPUTS = ["Benefits guide", "Website", "Flyer"];

const BUILD_STEPS = [
  "Reading 4 plan documents",
  "Writing plan sections",
  "Building cost tables",
  "Laying out 12 pages",
];

const PLANS = [
  { plan: "PPO 1500", deductible: "$1,500", oop: "$4,000", check: "$48" },
  { plan: "HDHP 3200", deductible: "$3,200", oop: "$6,400", check: "$22" },
  { plan: "EPO 1000", deductible: "$1,000", oop: "$3,500", check: "$61" },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function typed(text: string, t: number, start: number, perChar: number) {
  const n = Math.floor((t - start) / perChar);
  return text.slice(0, Math.max(0, Math.min(text.length, n)));
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Offset of `el` inside `root`, ignoring transforms on either. */
function offsetWithin(el: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return node === root ? { x, y } : null;
}

function locate(root: HTMLElement | null, to: Target) {
  if (!root) return null;
  if (typeof to !== "string") {
    return { x: to[0] * root.clientWidth, y: to[1] * root.clientHeight };
  }
  const el = root.querySelector<HTMLElement>(`[data-demo="${to}"]`);
  if (!el) return null;
  const at = offsetWithin(el, root);
  if (!at) return null;
  return {
    x: at.x + Math.min(el.offsetWidth * 0.6, el.offsetWidth - 8),
    y: at.y + el.offsetHeight * 0.62,
  };
}

const rise = (delayMs = 0): CSSProperties => ({
  animation: "demo-rise 420ms var(--ease-out-expo) both",
  animationDelay: `${delayMs}ms`,
});

const pop: CSSProperties = {
  animation: "demo-pop 380ms var(--ease-out-back) both",
};

/* -------------------------------------------------------------------------- */
/* The loop                                                                    */
/* -------------------------------------------------------------------------- */

export function ProductWalkthrough() {
  const [ref, inView] = useInView<HTMLElement>(0.25);
  const reduced = useReducedMotion();
  const running = inView && !reduced;

  const [index, setIndex] = useState(0);
  const [pinnedStage, setPinnedStage] = useState(STAGES.length - 1);
  const [clock, setClock] = useState({ beat: 0, ms: 0 });
  const [cursor, setCursor] = useState({ x: 0, y: 0, placed: false });
  const screenRef = useRef<HTMLDivElement>(null);
  const aimRef = useRef<Target | null>(null);

  const beatIndex = reduced ? LAST_BEAT_OF_STAGE[pinnedStage] : index;
  const beat = BEATS[beatIndex];
  const t = reduced ? SETTLED : clock.beat === index ? clock.ms : 0;

  // Advance through the beats while on screen.
  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(
      () => setIndex((i) => (i + 1) % BEATS.length),
      BEATS[index].ms,
    );
    return () => window.clearTimeout(id);
  }, [index, running]);

  // The clock inside the current beat. Stale readings from the previous beat
  // are discarded above by comparing `clock.beat`.
  useEffect(() => {
    if (!running) return;
    const start = performance.now();
    const id = window.setInterval(
      () => setClock({ beat: index, ms: performance.now() - start }),
      50,
    );
    return () => window.clearInterval(id);
  }, [index, running]);

  // Cursor moves, scheduled per beat and aimed when they fire so the target
  // has finished mounting.
  useEffect(() => {
    if (!running) return;
    const timers = (BEATS[index].moves ?? []).map((move) =>
      window.setTimeout(() => {
        const p = locate(screenRef.current, move.to);
        if (!p) return;
        aimRef.current = move.to;
        setCursor({ ...p, placed: true });
      }, move.at),
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [index, running]);

  // Keep the cursor on its target when the layout reflows.
  useEffect(() => {
    const onResize = () => {
      if (!aimRef.current) return;
      const p = locate(screenRef.current, aimRef.current);
      if (p) setCursor({ ...p, placed: true });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const lastMove = beat.moves?.[beat.moves.length - 1]?.to;
  const clickAt = beat.click;
  const pressing =
    clickAt !== undefined && t >= clickAt && t < clickAt + 240;
  const pressed = pressing && typeof lastMove === "string" ? lastMove : null;
  const carrying = beat.carry ? t >= beat.carry[0] && t < beat.carry[1] : false;

  const stage = beat.stage;
  const stageProgress = reduced
    ? 1
    : clamp01((STAGE_OFFSET[beatIndex] + t) / STAGE_MS[stage]);

  const jumpTo = (s: number) => {
    aimRef.current = null;
    setIndex(FIRST_BEAT_OF_STAGE[s]);
    setPinnedStage(s);
  };

  return (
    <figure ref={ref} className="relative">
      {/* Caption ----------------------------------------------------------- */}
      <div className="mb-4 min-h-[4.25rem] sm:min-h-0">
        <p className="t-eyebrow text-blue-400">
          Step {stage + 1} of {STAGES.length}
        </p>
        <p
          key={stage}
          className="mt-1.5 font-display text-lg leading-snug font-bold text-white sm:text-xl"
          style={{ animation: "demo-caption 520ms var(--ease-out-expo) both" }}
        >
          {STAGES[stage].name}
        </p>
      </div>

      <BrowserFrame label={URLS[beat.scene]}>
        <div
          ref={screenRef}
          className="relative h-[350px] overflow-hidden bg-white text-ink select-none sm:h-[340px]"
          aria-hidden
        >
          <div
            key={beat.scene}
            className="absolute inset-0"
            style={{ animation: "demo-fade 380ms ease-out both" }}
          >
            {beat.scene === "accounts" ? (
              <AccountsScreen pressed={pressed} />
            ) : beat.scene === "account" ? (
              <AccountScreen
                ready={beat.stage >= 1}
                pressed={pressed}
              />
            ) : beat.scene === "building" ? (
              <BuildingScreen t={t} />
            ) : (
              <EditorScreen id={beat.id} t={t} pressed={pressed} />
            )}
          </div>

          {beat.overlay ? (
            <div key={beat.overlay} className="absolute inset-0 z-20">
              <div
                className="absolute inset-0 bg-ink-950/35"
                style={{ animation: "demo-fade 300ms ease-out both" }}
              />
              {beat.overlay === "new-account" ? (
                <NewAccountModal id={beat.id} t={t} pressed={pressed} />
              ) : (
                <UploadModal id={beat.id} t={t} pressed={pressed} />
              )}
            </div>
          ) : null}

          <Cursor
            x={cursor.x}
            y={cursor.y}
            visible={running && cursor.placed && !beat.hideCursor}
            pressing={pressing}
            clickKey={clickAt !== undefined && t >= clickAt ? beatIndex : null}
            carrying={carrying}
          />
        </div>
      </BrowserFrame>

      {/* Progress ---------------------------------------------------------- */}
      <ol className="mt-5 flex items-start pb-5">
        {STAGES.map((s, i) => {
          const done = i < stage;
          const active = i === stage;
          const edge =
            i === 0 ? "left-0" : i === STAGES.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2";
          return (
            <li
              key={s.name}
              className={cx("flex items-center", i < STAGES.length - 1 && "flex-1")}
            >
              <button
                type="button"
                onClick={() => jumpTo(i)}
                aria-label={`Step ${i + 1}: ${s.name}`}
                aria-current={active ? "step" : undefined}
                className="relative grid size-8 shrink-0 cursor-pointer place-items-center rounded-full"
              >
                <span
                  className={cx(
                    "absolute inset-0 rounded-full transition-colors duration-500",
                    done && "bg-green-500",
                    !done && !active && "bg-white/[0.08] ring-1 ring-white/20",
                  )}
                  style={
                    active
                      ? {
                          background: `conic-gradient(var(--color-blue-400) ${
                            stageProgress * 360
                          }deg, rgba(255,255,255,0.14) 0deg)`,
                        }
                      : undefined
                  }
                />
                {active ? (
                  <span className="absolute inset-[3px] rounded-full bg-ink-900" />
                ) : null}
                <span
                  className={cx(
                    "relative text-[12px] font-bold",
                    done ? "text-white" : active ? "text-white" : "text-white/45",
                  )}
                >
                  {done ? <CheckIcon className="size-3.5" /> : i + 1}
                </span>
                <span
                  className={cx(
                    "absolute top-full mt-2 hidden whitespace-nowrap text-[11px] font-semibold transition-colors duration-500 sm:block",
                    edge,
                    active ? "text-white" : done ? "text-white/70" : "text-white/40",
                  )}
                >
                  {s.short}
                </span>
              </button>
              {i < STAGES.length - 1 ? (
                <span className="mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-white/12">
                  <span
                    className="block h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{
                      width: done ? "100%" : "0%",
                      background: "var(--grad-brand-bright)",
                    }}
                  />
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>

      <figcaption className="sr-only">
        A walkthrough of TruHu Advisor: a broker creates a client account,
        uploads the plan documents, the AI classifies them and extracts the plan
        details, a benefits guide is built, the broker asks the AI to match the
        client&rsquo;s branding and add detail to the tables, and then shares
        the guide.
      </figcaption>
    </figure>
  );
}

/* -------------------------------------------------------------------------- */
/* Cursor                                                                      */
/* -------------------------------------------------------------------------- */

function Cursor({
  x,
  y,
  visible,
  pressing,
  clickKey,
  carrying,
}: {
  x: number;
  y: number;
  visible: boolean;
  pressing: boolean;
  clickKey: number | null;
  carrying: boolean;
}) {
  return (
    <div
      className="pointer-events-none absolute top-0 left-0 z-40"
      style={{
        transform: `translate3d(${x}px, ${y}px, 0)`,
        opacity: visible ? 1 : 0,
        transition:
          "transform 720ms var(--ease-in-out-soft), opacity 300ms ease-out",
      }}
    >
      {clickKey !== null ? (
        <span
          key={clickKey}
          className="absolute top-0 left-0 size-9 rounded-full bg-blue-500/40"
          style={{ animation: "demo-ripple 520ms ease-out both" }}
        />
      ) : null}

      <div
        className="absolute top-3 left-3 transition-[opacity,scale] duration-300"
        style={{ opacity: carrying ? 1 : 0, scale: carrying ? "1" : "0.7" }}
      >
        <FileStack />
      </div>

      <svg
        width="18"
        height="22"
        viewBox="0 0 18 22"
        className="relative drop-shadow-[0_2px_3px_rgba(5,14,26,0.35)] transition-transform duration-150"
        style={{ transform: pressing ? "scale(0.82)" : "none", transformOrigin: "0 0" }}
      >
        <path
          d="M1.5 1.5v16.2l4.3-4.1 2.9 6.6 2.7-1.2-2.8-6.4h6.1z"
          fill="#fff"
          stroke="#0a1826"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function FileStack() {
  return (
    <div className="relative h-11 w-16">
      {[2, 1, 0].map((n) => (
        <span
          key={n}
          className="absolute rounded-[5px] border border-line bg-white shadow-md"
          style={{
            width: 36,
            height: 44,
            left: n * 9,
            top: n * -3,
            rotate: `${(n - 1) * 7}deg`,
          }}
        >
          <span
            className={cx(
              "absolute bottom-1.5 left-1 rounded-[2px] px-0.5 text-[6px] font-bold text-white",
              n === 1 ? "bg-green-700" : "bg-red-600/80",
            )}
          >
            {n === 1 ? "XLS" : "PDF"}
          </span>
          <span className="absolute top-2 right-1.5 left-1.5 h-0.5 rounded-full bg-ink/15" />
          <span className="absolute top-3.5 right-2.5 left-1.5 h-0.5 rounded-full bg-ink/10" />
        </span>
      ))}
      <span className="absolute -top-2 left-10 grid size-4 place-items-center rounded-full bg-blue-500 text-[8px] font-bold text-white ring-2 ring-white">
        4
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared bits of the app                                                      */
/* -------------------------------------------------------------------------- */

function Button({
  target,
  pressed,
  variant = "primary",
  className,
  children,
}: {
  target?: string;
  pressed: string | null;
  variant?: "primary" | "secondary" | "quiet";
  className?: string;
  children: ReactNode;
}) {
  const down = target !== undefined && pressed === target;
  return (
    <span
      data-demo={target}
      className={cx(
        "inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] leading-none font-semibold whitespace-nowrap transition-[transform,filter] duration-150",
        variant === "primary" && "bg-blue-500 text-white shadow-sm",
        variant === "secondary" && "border border-line bg-white text-ink",
        variant === "quiet" && "border border-line bg-paper text-slate-400",
        down && "scale-95 brightness-90",
        className,
      )}
    >
      {children}
    </span>
  );
}

function Modal({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "absolute inset-x-4 flex flex-col overflow-hidden rounded-xl bg-white shadow-[0_24px_60px_-20px_rgba(5,14,26,0.55)] sm:inset-x-10",
        className,
      )}
      style={{ animation: "demo-modal 420ms var(--ease-out-expo) both" }}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  focused,
  target,
}: {
  label: string;
  value: string;
  placeholder: string;
  focused: boolean;
  target?: string;
}) {
  return (
    <div>
      <p className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase">
        {label}
      </p>
      <div
        data-demo={target}
        className={cx(
          "mt-1 flex h-7 items-center rounded-md border px-2 text-[11px] transition-colors duration-200",
          focused ? "border-blue-500 ring-2 ring-blue-500/15" : "border-line",
        )}
      >
        {value ? (
          <span className="truncate text-ink">{value}</span>
        ) : focused ? null : (
          <span className="truncate text-slate-400/70">{placeholder}</span>
        )}
        {focused ? (
          <span className="anim-blink ml-px h-3.5 w-px shrink-0 bg-ink" />
        ) : null}
      </div>
    </div>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "inline-block size-3 shrink-0 animate-spin rounded-full border-[1.5px] border-blue-500/25 border-t-blue-500",
        className,
      )}
    />
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path
        d="M3.5 8.4 6.6 11.3 12.5 4.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <path
        d="M8 1.5c.4 3.1 2 4.9 5.5 5.5-3.5.6-5.1 2.4-5.5 5.5-.4-3.1-2-4.9-5.5-5.5C6 6.4 7.6 4.6 8 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FileIcon({ name }: { name: string }) {
  const sheet = name.endsWith(".xlsx");
  return (
    <span
      className={cx(
        "grid h-4 w-3.5 shrink-0 place-items-end rounded-[2px] pb-px text-[5px] font-bold text-white",
        sheet ? "bg-green-700" : "bg-red-600/80",
      )}
    >
      {sheet ? "XLS" : "PDF"}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Screens                                                                     */
/* -------------------------------------------------------------------------- */

function AccountsScreen({ pressed }: { pressed: string | null }) {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-[16px] font-bold">Accounts</p>
        <Button target="new-account" pressed={pressed}>
          + New account
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          ["14", "accounts"],
          ["3", "renewing <30d"],
          ["11", "guides live"],
        ].map(([n, label]) => (
          <div key={label} className="rounded-lg border border-line px-2.5 py-2">
            <p className="font-display text-[15px] leading-none font-bold">{n}</p>
            <p className="mt-1 truncate text-[10px] text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-hidden rounded-lg border border-line">
        <div className="flex justify-between border-b border-line bg-paper px-3 py-1.5 text-[9px] font-semibold tracking-wider text-slate-400 uppercase">
          <span>Account</span>
          <span>Renewal</span>
        </div>
        {ACCOUNTS.map((a) => (
          <div
            key={a.name}
            className="flex items-center gap-2.5 border-b border-line px-3 py-2 last:border-b-0"
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-md border border-line bg-paper text-[9px] font-bold text-slate-600">
              {a.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold">{a.name}</p>
              <p className="flex items-center gap-1 text-[9px] text-slate-400">
                <span
                  className={cx(
                    "size-1.5 rounded-full",
                    a.live ? "bg-green-500" : "bg-amber-500/70",
                  )}
                />
                {a.live ? "Guide live" : "Draft"}
              </p>
            </div>
            <span className="text-[10px] text-slate-600">{a.renewal}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewAccountModal({
  id,
  t,
  pressed,
}: {
  id: string;
  t: number;
  pressed: string | null;
}) {
  const typing = id === "type-account";
  const name = typing ? typed(COMPANY, t, 950, 34) : COMPANY;
  const site = typing ? typed(WEBSITE, t, 1850, 30) : WEBSITE;
  const onSite = typing && t >= 1800;

  return (
    <Modal className="top-4 bottom-4">
      <div className="border-b border-line px-4 pt-3.5 pb-3">
        <p className="font-display text-[14px] font-bold">New account</p>
        <p className="text-[10px] text-slate-400">Create a new client account.</p>
      </div>
      <div className="flex-1 space-y-3 px-4 py-3">
        <Field
          label="Company name *"
          value={name}
          placeholder="e.g. Acme Corporation"
          focused={typing && t >= 850 && !onSite}
          target="name-field"
        />
        <Field
          label="Website"
          value={site}
          placeholder="e.g. acmecorp.com"
          focused={onSite}
        />
        <div>
          <p className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase">
            Managed by
          </p>
          <span className="mt-1 inline-flex items-center gap-1 rounded-md border border-line bg-paper px-2 py-1 text-[10px]">
            You <span className="text-slate-400">×</span>
          </span>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-4 py-2.5">
        <Button variant="secondary" pressed={pressed}>
          Cancel
        </Button>
        <Button
          target="create"
          pressed={pressed}
          className={cx(
            "transition-opacity",
            name.length < COMPANY.length && "opacity-45",
          )}
        >
          Create account →
        </Button>
      </div>
    </Modal>
  );
}

function AccountScreen({
  ready,
  pressed,
}: {
  ready: boolean;
  pressed: string | null;
}) {
  return (
    <div className="flex h-full flex-col p-4">
      <p className="text-[10px] text-slate-400">← Accounts</p>

      <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-line bg-paper px-3 py-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-white text-[12px] font-bold text-slate-400">
          S
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold">{COMPANY}</p>
          <p className="text-[10px] text-slate-400">{WEBSITE}</p>
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-3 border-b border-line text-[11px]">
        <span className="-mb-px border-b-2 border-blue-500 pb-1.5 font-semibold text-blue-700">
          Plan year 2027
        </span>
        <span className="pb-1.5 text-slate-400">+ Add renewal</span>
      </div>

      <div className="mt-3 grid min-h-0 flex-1 grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase">
            Create
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {OUTPUTS.map((label, i) => (
              <Button
                key={label}
                target={i === 0 ? "make-guide" : undefined}
                pressed={pressed}
                variant={ready ? "primary" : "quiet"}
                className={cx(ready && i > 0 && "bg-blue-500/80")}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="mt-3 grid h-[72px] place-items-center rounded-lg border border-dashed border-line px-3 text-center text-[10px] leading-snug text-slate-400">
            {ready ? (
              <span style={rise()}>
                <span className="font-semibold text-green-700">
                  4 documents ready.
                </span>{" "}
                Choose what to build.
              </span>
            ) : (
              "No guides yet. Upload documents to get started."
            )}
          </div>
        </div>

        <div className="min-w-0 border-l border-line pl-3">
          <p className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase">
            Files
          </p>
          <Button
            target="upload"
            pressed={pressed}
            className="mt-1.5 w-full justify-center"
          >
            + Upload files
          </Button>
          {ready ? (
            <ul className="mt-2 space-y-1">
              {FILES.map((f, i) => (
                <li
                  key={f.name}
                  className="flex items-center gap-1.5 text-[9px]"
                  style={rise(i * 60)}
                >
                  <FileIcon name={f.name} />
                  <span className="truncate text-slate-600">{f.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-center text-[10px] text-slate-400">
              No documents yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadModal({
  id,
  t,
  pressed,
}: {
  id: string;
  t: number;
  pressed: string | null;
}) {
  const dragging = id === "drag";
  const extracting = id === "extract";
  const hovering = dragging && t >= 1250;

  // Each row resolves in turn; in the extract beat they are all settled.
  const rowDone = (i: number) => extracting || t >= 650 + i * 520;
  const allDone = FILES.every((_, i) => rowDone(i));

  return (
    <Modal className="top-3 bottom-3">
      <div className="px-4 pt-3 pb-2">
        <p className="font-display text-[14px] font-bold">Upload files</p>
        <p className="text-[10px] text-slate-400">
          Upload files for {COMPANY}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4">
        {dragging ? (
          <div
            data-demo="dropzone"
            className={cx(
              "grid flex-1 place-items-center rounded-lg border-2 border-dashed text-center transition-colors duration-300",
              hovering ? "border-blue-500 bg-blue-100" : "border-line bg-paper",
            )}
          >
            <div>
              <svg viewBox="0 0 24 24" className={cx("mx-auto size-7 transition-colors", hovering ? "text-blue-500" : "text-slate-300")} fill="none">
                <path d="M7 17.5h-.5a4 4 0 0 1-.6-8 6 6 0 0 1 11.6-.5 3.8 3.8 0 0 1 .3 7.5H17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                <path d="M12 11v8m0-8-3 3m3-3 3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-1.5 text-[12px] font-semibold text-ink">
                {hovering ? "Drop to upload" : "Drop files or ZIP files here"}
              </p>
              <p className="mt-0.5 text-[9px] text-slate-400">
                PDF, Excel, Word, images and more
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-line bg-paper px-3 py-1.5 text-[10px]">
              {allDone ? (
                <>
                  <span className="grid size-3.5 place-items-center rounded-full bg-green-500 text-white">
                    <CheckIcon className="size-2.5" />
                  </span>
                  <span className="font-semibold text-green-700">
                    4 documents classified
                  </span>
                </>
              ) : (
                <>
                  <SparkIcon className="size-3 text-blue-500 anim-pulse" />
                  <span className="font-semibold text-blue-700">
                    Reading and classifying documents…
                  </span>
                </>
              )}
            </div>

            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 border-b border-line pb-1 text-[9px] font-semibold tracking-wider text-slate-400 uppercase">
              <span>File</span>
              <span>Classification</span>
            </div>
            {FILES.map((f, i) => {
              const done = rowDone(i);
              return (
                <div
                  key={f.name}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-b border-line py-[5px] text-[10px]"
                  style={id === "classify" ? rise(i * 90) : undefined}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <FileIcon name={f.name} />
                    <span className="truncate">{f.name}</span>
                  </span>
                  {done ? (
                    <span
                      key="done"
                      className="rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-semibold text-green-700"
                      style={id === "classify" ? pop : undefined}
                    >
                      {f.kind}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[9px] text-blue-700">
                      <Spinner className="size-2.5" />
                      Processing
                    </span>
                  )}
                </div>
              );
            })}

            {extracting ? (
              <div
                className="mt-2 rounded-lg border border-blue-500/20 bg-blue-100/70 px-2.5 py-2"
                style={rise()}
              >
                <p className="flex items-center gap-1 text-[10px] font-semibold text-blue-700">
                  <SparkIcon className="size-3" />
                  48 plan details extracted
                  <span className="hidden sm:inline">
                    , each linked to its source page
                  </span>
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {EXTRACTED.map((v, i) => (
                    <span
                      key={v}
                      className={cx(
                        "rounded-md bg-white px-1.5 py-0.5 text-[9px] font-semibold text-ink shadow-sm",
                        i === EXTRACTED.length - 1 && "hidden sm:inline",
                      )}
                      style={rise(150 + i * 140)}
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="mt-2 flex justify-end border-t border-line px-4 py-2">
        <Button
          target="done"
          pressed={pressed}
          className={cx("transition-opacity", !extracting && "opacity-45")}
        >
          Done
        </Button>
      </div>
    </Modal>
  );
}

function BuildingScreen({ t }: { t: number }) {
  const STEP_MS = 640;
  const progress = clamp01((t - 150) / (STEP_MS * BUILD_STEPS.length));

  return (
    <div className="grid h-full place-items-center bg-paper p-4">
      <div className="w-full max-w-[440px] rounded-xl border border-line bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <SparkIcon className="size-4 text-blue-500" />
          <p className="font-display text-[14px] font-bold">
            Building benefits guide
          </p>
          <span className="tabular ml-auto text-[11px] font-semibold text-slate-400">
            {Math.round(progress * 100)}%
          </span>
        </div>
        <p className="mt-0.5 text-[10px] text-slate-400">
          {COMPANY} · Plan year 2027
        </p>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full transition-[width] duration-100 ease-linear"
            style={{ width: `${progress * 100}%`, background: "var(--grad-brand)" }}
          />
        </div>

        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-4">
          <ul className="space-y-2">
            {BUILD_STEPS.map((step, i) => {
              const start = 150 + i * STEP_MS;
              const done = t >= start + STEP_MS;
              const active = !done && t >= start;
              return (
                <li key={step} className="flex items-center gap-2 text-[11px]">
                  {done ? (
                    <span
                      className="grid size-3.5 place-items-center rounded-full bg-green-500 text-white"
                      style={pop}
                    >
                      <CheckIcon className="size-2.5" />
                    </span>
                  ) : active ? (
                    <Spinner className="size-3.5" />
                  ) : (
                    <span className="size-3.5 rounded-full border-[1.5px] border-line" />
                  )}
                  <span
                    className={cx(
                      "truncate transition-colors",
                      done ? "text-ink" : active ? "font-semibold text-ink" : "text-slate-400",
                    )}
                  >
                    {step}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* Pages stacking up as they are laid out. */}
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 6 }, (_, i) =>
              t >= 350 + i * 380 ? (
                <span
                  key={i}
                  className="block h-9 w-7 overflow-hidden rounded-[3px] border border-line bg-white shadow-sm"
                  style={pop}
                >
                  <span className="block h-2" style={{ background: PLACEHOLDER_BRAND }} />
                  <span className="mx-1 mt-1 block h-0.5 rounded-full bg-ink/20" />
                  <span className="mx-1 mt-0.5 block h-0.5 w-3 rounded-full bg-ink/10" />
                  <span className="mx-1 mt-1 block h-2 rounded-[1px] bg-ink/[0.06]" />
                </span>
              ) : (
                <span
                  key={i}
                  className="block h-9 w-7 rounded-[3px] border border-dashed border-line"
                />
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditorScreen({
  id,
  t,
  pressed,
}: {
  id: string;
  t: number;
  pressed: string | null;
}) {
  const order = ["built", "prompt", "apply", "update", "share", "shared"];
  const at = order.indexOf(id);

  const prompt =
    id === "prompt" ? typed(PROMPT, t, 700, 26) : at > 1 ? PROMPT : "";
  const focused = id === "prompt" && t >= 600;
  const updating = id === "update" && t < 950;
  const updated = at > 3 || (id === "update" && t >= 950);
  const shared = id === "shared";

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <span className="text-[12px] text-slate-400">←</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold">
            Sample Company 2027 Benefits Guide
          </p>
          <p className="truncate text-[9px] text-slate-400">
            {updated ? "Saved just now" : "Draft · 12 pages"}
          </p>
        </div>
        <Button target="share" pressed={pressed}>
          <ShareIcon className="size-3" />
          Share guide
        </Button>
      </div>

      <div className="relative grid min-h-0 flex-1 grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {/* Canvas */}
        <div className="relative min-w-0 overflow-hidden bg-paper p-2 sm:p-3">
          <div style={id === "built" ? rise(120) : undefined}>
            <GuidePage branded={updated} detailed={updated} />
            <NextPage branded={updated} />
          </div>

          {updating ? (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <span
                className="absolute inset-y-0 w-2/3"
                style={{
                  background:
                    "linear-gradient(100deg, transparent, rgba(56,182,255,0.28), transparent)",
                  animation: "demo-sweep 950ms var(--ease-in-out-soft) both",
                }}
              />
            </div>
          ) : null}

          {id === "built" ? (
            <span
              className="absolute top-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[9px] font-semibold whitespace-nowrap text-white shadow-lg"
              style={rise(300)}
            >
              <CheckIcon className="size-2.5 text-green-400" />
              Guide built · 12 pages
            </span>
          ) : null}
        </div>

        {/* AI panel */}
        <div className="flex min-w-0 flex-col border-l border-line p-2.5">
          <div className="flex items-center gap-3 border-b border-line pb-1.5 text-[10px]">
            <span className="flex items-center gap-1 font-semibold text-blue-700">
              <SparkIcon className="size-3" />
              AI
            </span>
            <span className="text-slate-400">Images</span>
            <span className="hidden text-slate-400 sm:inline">Content</span>
          </div>

          <div
            data-demo="prompt"
            className={cx(
              "mt-2 h-[112px] overflow-hidden rounded-md border p-2 sm:h-[92px] text-[10px] leading-snug transition-colors duration-200",
              focused ? "border-blue-500 ring-2 ring-blue-500/15" : "border-line",
            )}
          >
            {prompt ? (
              <span className="text-ink">{prompt}</span>
            ) : (
              <span className="text-slate-400/80">What would you like to change?</span>
            )}
            {focused ? (
              <span className="anim-blink ml-px inline-block h-3 w-px translate-y-0.5 bg-ink" />
            ) : null}
          </div>

          <div className="mt-1.5 flex justify-end">
            <Button
              target="apply"
              pressed={pressed}
              className={cx(
                "transition-opacity",
                !(id === "apply" || (id === "prompt" && prompt === PROMPT)) && "opacity-45",
              )}
            >
              Apply ↵
            </Button>
          </div>

          {at >= 3 ? (
            <div
              className="mt-2 rounded-md border border-line bg-paper p-2 text-[9px] leading-snug"
              style={rise()}
            >
              {updating ? (
                <p className="flex items-center gap-1.5 font-semibold text-blue-700">
                  <Spinner className="size-2.5" />
                  Applying changes…
                </p>
              ) : (
                <>
                  <p className="flex items-center gap-1 font-semibold text-green-700">
                    <CheckIcon className="size-2.5" />
                    Done
                  </p>
                  <p className="mt-0.5 text-slate-600">
                    Matched {WEBSITE} colours and logo. Added out-of-pocket
                    max and the EPO plan.
                  </p>
                </>
              )}
            </div>
          ) : null}
        </div>

        {shared ? <SharePopover /> : null}
      </div>
    </div>
  );
}

function GuidePage({ branded, detailed }: { branded: boolean; detailed: boolean }) {
  const brand = branded ? CLIENT_BRAND : PLACEHOLDER_BRAND;
  const cols = detailed
    ? "minmax(0,1.25fr) minmax(0,1fr) minmax(0,1fr) minmax(0,0.9fr)"
    : "minmax(0,1.25fr) minmax(0,1fr) minmax(0,0fr) minmax(0,0.9fr)";

  return (
    <div className="mx-auto max-w-[300px] overflow-hidden rounded-[4px] bg-white shadow-[0_10px_30px_-14px_rgba(5,14,26,0.45)]">
      <div
        className="flex items-center gap-1.5 px-3 py-2 transition-colors duration-700"
        style={{ background: brand }}
      >
        <span
          className="grid size-4 shrink-0 place-items-center rounded-[3px] text-[8px] font-black transition-all duration-500"
          style={{
            background: branded ? "#fff" : "rgba(255,255,255,0.25)",
            color: brand,
          }}
        >
          {branded ? "S" : ""}
        </span>
        <span className="truncate text-[9px] font-bold tracking-[0.12em] text-white">
          SAMPLE CO
        </span>
        <span className="ml-auto shrink-0 text-[8px] text-white/70">2027</span>
      </div>
      <div
        className="h-[3px] transition-opacity duration-700"
        style={{ background: CLIENT_ACCENT, opacity: branded ? 1 : 0 }}
      />

      <div className="px-3 pt-2 pb-3">
        <p
          className="text-[8px] font-bold tracking-wider uppercase transition-colors duration-700"
          style={{ color: branded ? CLIENT_BRAND : "#94a3b8" }}
        >
          Medical
        </p>
        <p className="font-display text-[13px] leading-tight font-bold">
          Your 2027 medical plans
        </p>
        <p className="mt-0.5 text-[8.5px] leading-snug text-slate-400">
          Compare what you pay each paycheck and when you get care.
        </p>

        <div className="mt-2 overflow-hidden rounded-[3px] border border-line text-[8.5px]">
          <div
            className="grid transition-[grid-template-columns,background-color,color] duration-700"
            style={{
              gridTemplateColumns: cols,
              background: branded ? CLIENT_BRAND : "#eef2f6",
              color: branded ? "#fff" : "var(--color-slate-600)",
            }}
          >
            {["Plan", "Deductible", "OOP max", "Per check"].map((h, i) => (
              <span
                key={h}
                className={cx(
                  "truncate px-1 py-1 font-bold transition-opacity duration-500 sm:px-1.5",
                  i === 2 && !detailed && "opacity-0",
                )}
              >
                {h}
              </span>
            ))}
          </div>
          {PLANS.map((p, row) => (
            <div
              key={p.plan}
              className="grid transition-[grid-template-rows] duration-700"
              style={{
                gridTemplateRows: row < 2 || detailed ? "1fr" : "0fr",
              }}
            >
              <div className="overflow-hidden">
                <div
                  className="grid border-t border-line transition-[grid-template-columns] duration-700"
                  style={{ gridTemplateColumns: cols }}
                >
                  {[p.plan, p.deductible, p.oop, p.check].map((v, i) => (
                    <span
                      key={i}
                      className={cx(
                        "tabular truncate px-1 py-1 transition-opacity duration-500 sm:px-1.5",
                        i === 0 && "font-semibold",
                        i === 2 && !detailed && "opacity-0",
                      )}
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The top of the following page, so the canvas reads as a document. */
function NextPage({ branded }: { branded: boolean }) {
  return (
    <div className="mx-auto mt-3 max-w-[300px] overflow-hidden rounded-[4px] bg-white shadow-[0_10px_30px_-14px_rgba(5,14,26,0.45)]">
      <div
        className="h-2 transition-colors duration-700"
        style={{ background: branded ? CLIENT_BRAND : PLACEHOLDER_BRAND }}
      />
      <div className="space-y-1.5 px-3 py-2.5">
        <span
          className="block h-1.5 w-12 rounded-full transition-colors duration-700"
          style={{ background: branded ? CLIENT_BRAND : "#cbd5e1" }}
        />
        <span className="block h-2 w-32 rounded-full bg-ink/20" />
        <span className="block h-1 w-full rounded-full bg-ink/[0.08]" />
        <span className="block h-1 w-4/5 rounded-full bg-ink/[0.08]" />
        <span className="block h-1 w-11/12 rounded-full bg-ink/[0.08]" />
      </div>
    </div>
  );
}

function SharePopover() {
  return (
    <div
      className="absolute top-2 right-3 z-10 w-[210px] rounded-lg border border-line bg-white p-2.5 shadow-[0_18px_40px_-16px_rgba(5,14,26,0.5)]"
      style={{ animation: "demo-modal 380ms var(--ease-out-expo) both" }}
    >
      <p className="flex items-center gap-1.5 text-[11px] font-bold">
        <span className="grid size-4 place-items-center rounded-full bg-green-500 text-white">
          <CheckIcon className="size-2.5" />
        </span>
        Guide published
      </p>
      <div className="mt-2 flex items-center gap-1.5 rounded-md border border-line bg-paper px-2 py-1">
        <span className="truncate font-mono text-[9px] text-slate-600">
          sampleco.truhu.ai/2027
        </span>
        <span className="ml-auto shrink-0 text-[9px] font-semibold text-green-700">
          Copied
        </span>
      </div>
      <p className="mt-1.5 text-[9px] leading-snug text-slate-400">
        Ready to send to every employee by link, text or email.
      </p>
    </div>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path
        d="M8 10V2.5m0 0L5.2 5.3M8 2.5l2.8 2.8M3.5 8.5v4a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
