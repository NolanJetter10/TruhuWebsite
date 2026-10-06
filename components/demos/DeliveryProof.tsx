"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { PhoneFrame } from "@/components/art/frames";
import { cx } from "@/components/ui/primitives";
import { useInView, useReducedMotion } from "./hooks";

/**
 * TruHu Workforce in three beats, framed like the Advisor walkthrough so the
 * two hero demos read as one family:
 *
 *   1. Send    HR writes one message and picks a segment.
 *   2. Deliver It lands on a personal phone as a plain text with a link.
 *   3. Track   A per-person record fills in; the person with no number on
 *              file is named, and a follow-up goes only to non-clickers.
 *
 * Each stage is one scene, and everything in a scene is derived from the
 * time elapsed in it. That is what lets Pause freeze a frame exactly, lets a
 * clicked stage play once and hold, and lets reduced motion show a settled
 * frame without running anything.
 *
 * Claims discipline: SMS has no read receipt, so nothing here says "read" or
 * "opened". The statuses are sent, delivered, clicked and acknowledged.
 */

type Mode = "loop" | "hold" | "paused";

const STAGES = [
  {
    short: "Send",
    name: "Write it once. Send it to the whole shift.",
    view: "HR · New message",
    ms: 5000,
    settle: 5000,
  },
  {
    short: "Deliver",
    name: "It lands as a text. No app, no login.",
    view: "Maria’s phone",
    ms: 6000,
    // Reduced motion shows the text on the phone, which is this stage's point,
    // rather than the page it opens.
    settle: 2200,
  },
  {
    short: "Track",
    name: "See who got it, by name.",
    view: "HR · Delivery record",
    ms: 7400,
    settle: 7400,
  },
] as const;

const LAST = STAGES.length - 1;

/* -------------------------------------------------------------------------- */
/* Sample content                                                              */
/* -------------------------------------------------------------------------- */

/** The client's brand, not TruHu's: the message page is Sample Company's. */
const CLIENT_BRAND = "#0E5A63";

const SENDER = "Sample Company HR";
const MESSAGE =
  "Oak St opens at 10 AM tomorrow. Day shift, check your updated schedule.";
const LINK = "truhu.link/oak-st";
const SENT_AT = "9:40 AM";
const AUDIENCE = ["Day shift", "Oak St"] as const;

// One segment, internally consistent: everyone with a number was delivered,
// and the follow-up audience is exactly the delivered who have not clicked.
const TOTAL = 214;
const NO_NUMBER = 3;
const DELIVERED = TOTAL - NO_NUMBER;
const CLICKED = 163;
const ACKNOWLEDGED = 142;
const NOT_CLICKED = DELIVERED - CLICKED;

const POINTS = [
  "Arrives as a plain text",
  "No app to download",
  "No login. No password.",
];

type Status = "sent" | "delivered" | "clicked" | "acknowledged" | "no-number";

type Person = {
  name: string;
  initials: string;
  /** Status changes, in ms from the start of the Track stage. */
  path: readonly (readonly [Status, number])[];
  unreachable?: boolean;
  followUp?: boolean;
};

const PEOPLE: readonly Person[] = [
  {
    name: "Maria Santos",
    initials: "MS",
    path: [
      ["delivered", 500],
      ["clicked", 1300],
      ["acknowledged", 2100],
    ],
  },
  {
    name: "Devon Price",
    initials: "DP",
    path: [
      ["delivered", 640],
      ["clicked", 1500],
    ],
  },
  { name: "Rosa Martinez", initials: "RM", path: [], unreachable: true },
  {
    name: "Tomás Reyes",
    initials: "TR",
    path: [["delivered", 780]],
    followUp: true,
  },
];

const PILL: Record<Status, { label: string; className: string }> = {
  sent: { label: "Sent", className: "bg-paper text-slate-400" },
  delivered: { label: "Delivered", className: "bg-blue-100 text-blue-700" },
  clicked: { label: "Clicked", className: "bg-blue-700 text-white" },
  acknowledged: { label: "Acknowledged", className: "bg-green-700 text-white" },
  "no-number": {
    label: "No number on file",
    className: "bg-amber-100 text-amber-800",
  },
};

/** `at` is when the count starts; null means it is known before anything sends. */
const STATS = [
  { label: "Delivered", value: DELIVERED, at: 350, bar: "bg-blue-400" },
  { label: "Clicked", value: CLICKED, at: 1150, bar: "bg-blue-700" },
  { label: "Acknowledged", value: ACKNOWLEDGED, at: 1950, bar: "bg-green-500" },
  { label: "No number", value: NO_NUMBER, at: null, bar: "bg-amber-500" },
] as const;

/* Beat times inside each stage, in ms from the start of that stage. -------- */

const SEND = {
  chips: 300,
  chipGap: 260,
  count: 860,
  type: 1150,
  perChar: 22,
  ready: 2950,
  press: 3250,
  sent: 3500,
} as const;
const TYPE_END = SEND.type + MESSAGE.length * SEND.perChar;

const DELIVER = {
  arrive: 450,
  points: 900,
  pointGap: 180,
  tap: 2400,
  open: 2650,
  ackPress: 3900,
  acked: 4150,
} as const;

const TRACK = { countMs: 1100, followUp: 3300, tag: 3550 } as const;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const easeOut = (n: number) => 1 - Math.pow(1 - n, 3);

function typed(text: string, t: number, start: number, perChar: number) {
  const n = Math.floor((t - start) / perChar);
  return text.slice(0, Math.max(0, Math.min(text.length, n)));
}

function statusAt(person: Person, t: number): Status {
  if (person.unreachable) return "no-number";
  let status: Status = "sent";
  for (const [next, at] of person.path) if (t >= at) status = next;
  return status;
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
  transition:
    "opacity 420ms ease-out, transform 520ms var(--ease-out-expo)",
});

/* -------------------------------------------------------------------------- */
/* The loop                                                                    */
/* -------------------------------------------------------------------------- */

export function DeliveryProof() {
  const [ref, inView] = useInView<HTMLElement>(0.25);
  const reduced = useReducedMotion();
  const running = inView && !reduced;

  const [stage, setStage] = useState(0);
  /** The stage reduced motion shows: the record, until another is chosen. */
  const [pinned, setPinned] = useState<number>(LAST);
  /** Bumped on every stage entry, so re-entering a stage restarts it. */
  const [epoch, setEpoch] = useState(0);
  const [clock, setClock] = useState({ epoch: 0, ms: 0 });
  const [mode, setMode] = useState<Mode>("loop");
  /** Time into the current stage, kept across pauses and scrolling away. */
  const elapsed = useRef(0);

  const current = reduced ? pinned : stage;
  const t = reduced
    ? STAGES[current].settle
    : clock.epoch === epoch
      ? clock.ms
      : 0;
  const progress = reduced ? 1 : clamp01(t / STAGES[current].ms);

  // The stage clock. Runs only on screen and not paused; at the end of a
  // stage it advances when looping, or holds on the last frame.
  useEffect(() => {
    if (!running || mode === "paused") return;
    const length = STAGES[stage].ms;
    if (mode === "hold" && elapsed.current >= length) return;

    const begin = performance.now() - elapsed.current;
    const id = window.setInterval(() => {
      const ms = performance.now() - begin;
      if (ms < length) {
        elapsed.current = ms;
        setClock({ epoch, ms });
        return;
      }
      window.clearInterval(id);
      if (mode === "loop") {
        elapsed.current = 0;
        setStage((s) => (s + 1) % STAGES.length);
        setEpoch((e) => e + 1);
      } else {
        elapsed.current = length;
        setClock({ epoch, ms: length });
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [running, mode, stage, epoch]);

  /** A chosen stage plays once and holds; the loop stops until Play. */
  const jumpTo = (s: number) => {
    elapsed.current = 0;
    setStage(s);
    setPinned(s);
    setEpoch((e) => e + 1);
    setMode("hold");
  };

  const togglePlay = () => {
    if (mode === "loop") {
      setMode("paused");
      return;
    }
    if (elapsed.current >= STAGES[stage].ms) {
      elapsed.current = 0;
      setStage((s) => (s + 1) % STAGES.length);
      setEpoch((e) => e + 1);
    }
    setMode("loop");
  };

  return (
    <figure ref={ref} className="relative mx-auto w-full max-w-[640px]">
      {/* Caption ----------------------------------------------------------- */}
      <div className="mb-3.5 min-h-[5rem] sm:min-h-0">
        <div className="flex min-h-6 items-center justify-between gap-3">
          <p className="t-eyebrow text-blue-400">
            Step {current + 1} of {STAGES.length}
          </p>
          {reduced ? null : (
            <button
              type="button"
              onClick={togglePlay}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[11px] leading-none font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              {mode === "loop" ? (
                <>
                  <PauseIcon className="size-2.5" />
                  Pause
                </>
              ) : (
                <>
                  <PlayIcon className="size-2.5" />
                  Play
                </>
              )}
            </button>
          )}
        </div>
        <p
          key={current}
          className="mt-1.5 font-display text-lg leading-snug font-bold text-white sm:text-xl"
          style={{ animation: "demo-caption 520ms var(--ease-out-expo) both" }}
        >
          {STAGES[current].name}
        </p>
      </div>

      {/* The light surface -------------------------------------------------- */}
      <div className="card-shape-lg overflow-hidden border border-line bg-white shadow-[0_40px_90px_-40px_rgba(5,14,26,0.55)]">
        <div className="flex items-center gap-3 border-b border-line bg-paper px-4 py-2.5">
          <span
            key={current}
            className="flex min-w-0 items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-[12px] leading-none font-semibold text-slate-600 ring-1 ring-line"
            style={{ animation: "demo-fade 380ms ease-out both" }}
          >
            {current === 1 ? (
              <PhoneIcon className="size-3.5 shrink-0 text-slate-400" />
            ) : (
              <MonitorIcon className="size-3.5 shrink-0 text-slate-400" />
            )}
            <span className="truncate">{STAGES[current].view}</span>
          </span>
        </div>

        <div
          className="relative h-[330px] overflow-hidden bg-white text-ink select-none"
          aria-hidden
        >
          <div
            key={`${current}:${epoch}`}
            className="absolute inset-0"
            style={{ animation: "demo-fade 420ms ease-out both" }}
          >
            {current === 0 ? (
              <SendScene t={t} />
            ) : current === 1 ? (
              <DeliverScene t={t} />
            ) : (
              <TrackScene t={t} />
            )}
          </div>
        </div>
      </div>

      {/* Stages ------------------------------------------------------------ */}
      <ol className="mt-4 flex items-start pb-6">
        {STAGES.map((s, i) => {
          const done = i < current;
          const active = i === current;
          const edge =
            i === 0 ? "left-0" : i === LAST ? "right-0" : "left-1/2 -translate-x-1/2";
          return (
            <li
              key={s.short}
              className={cx("flex items-center", i < LAST && "flex-1")}
            >
              <button
                type="button"
                onClick={() => jumpTo(i)}
                aria-label={`Step ${i + 1} of ${STAGES.length}, ${s.short}: ${s.name}`}
                aria-current={active ? "step" : undefined}
                className="group relative grid size-8 shrink-0 cursor-pointer place-items-center rounded-full"
              >
                <span
                  className={cx(
                    "absolute inset-0 rounded-full transition-colors duration-500",
                    done && "bg-green-500",
                    !done &&
                      !active &&
                      "bg-white/[0.08] ring-1 ring-white/20 group-hover:ring-white/45",
                  )}
                  style={
                    active
                      ? {
                          background: `conic-gradient(var(--color-blue-400) ${
                            progress * 360
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
                    done || active ? "text-white" : "text-white/55",
                  )}
                >
                  {done ? <CheckIcon className="size-3.5" /> : i + 1}
                </span>
                <span
                  className={cx(
                    "absolute top-full mt-2 text-[12px] leading-none font-semibold whitespace-nowrap transition-colors duration-500",
                    edge,
                    active
                      ? "text-white"
                      : done
                        ? "text-white/70"
                        : "text-white/50 group-hover:text-white/75",
                  )}
                >
                  {s.short}
                </span>
              </button>
              {i < LAST ? (
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
        A sample TruHu Workforce message in three steps. Sample Company HR writes one
        message, &ldquo;{MESSAGE}&rdquo;, and sends it to the {TOTAL} people on
        the Oak St day shift. It arrives on an employee&rsquo;s phone as a plain
        text message with a link, with no app and no login, and she opens the
        link and acknowledges it. The sender&rsquo;s record then lists each
        person by name: {DELIVERED} delivered, {CLICKED} clicked,{" "}
        {ACKNOWLEDGED} acknowledged, and {NO_NUMBER} with no mobile number on
        file, named rather than dropped. An automatic follow-up goes only to
        the {NOT_CLICKED} who have not clicked.
      </figcaption>
    </figure>
  );
}

/* -------------------------------------------------------------------------- */
/* 1. Send                                                                     */
/* -------------------------------------------------------------------------- */

function SendScene({ t }: { t: number }) {
  const text = typed(MESSAGE, t, SEND.type, SEND.perChar);
  const typing = t >= SEND.type - 200 && t < TYPE_END + 300;
  const ready = t >= SEND.ready;
  const pressing = t >= SEND.press && t < SEND.sent;
  const sent = t >= SEND.sent;

  return (
    <div className="relative flex h-full flex-col px-4 pt-2 pb-4 sm:px-5">
      <FieldRow label="From">
        <BrandMark className="size-5 rounded-md text-[10px]" />
        <span className="truncate text-[13px] font-semibold text-ink">
          {SENDER}
        </span>
      </FieldRow>

      <FieldRow label="To">
        {AUDIENCE.map((chip, i) =>
          t >= SEND.chips + i * SEND.chipGap ? (
            <span
              key={chip}
              className="inline-flex shrink-0 items-center rounded-full bg-blue-100 px-2.5 py-1.5 text-[13px] leading-none font-semibold whitespace-nowrap text-blue-700"
              style={pop}
            >
              {chip}
            </span>
          ) : null,
        )}
        <span
          className="ml-auto flex shrink-0 items-center gap-1.5 text-[13px] leading-none font-bold whitespace-nowrap text-ink"
          style={reveal(t >= SEND.count)}
        >
          <PeopleIcon className="size-4 text-slate-400" />
          {TOTAL} people
        </span>
      </FieldRow>

      <div
        className={cx(
          "mt-3 min-h-0 flex-1 rounded-xl border px-3.5 py-3 transition-[border-color,box-shadow] duration-300",
          typing ? "border-blue-500 ring-4 ring-blue-500/10" : "border-line",
        )}
      >
        <p className="text-[15px] leading-relaxed sm:text-[16px]">
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

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2.5 text-[13px] leading-none font-semibold whitespace-nowrap text-slate-600">
          <ClockIcon className="size-3.5 text-slate-400" />
          Schedule
        </span>
        <span
          className={cx(
            "inline-flex items-center gap-1.5 rounded-lg border border-transparent px-3.5 py-2.5 text-[13px] leading-none font-semibold whitespace-nowrap text-white shadow-sm transition-[background-color,opacity,scale,filter] duration-200",
            sent ? "bg-green-700" : "bg-blue-500",
            !ready && "opacity-45",
            pressing && "scale-95 brightness-90",
          )}
        >
          {sent ? (
            <>
              <CheckIcon className="size-3.5" />
              Sent
            </>
          ) : (
            <>
              <SendIcon className="size-3.5" />
              Send to {TOTAL} people
            </>
          )}
        </span>
      </div>

      {sent ? (
        <span
          className="absolute bottom-[4.75rem] left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-[13px] leading-none font-semibold whitespace-nowrap text-white shadow-[0_14px_30px_-12px_rgba(5,14,26,0.6)]"
          style={rise(80)}
        >
          <CheckIcon className="size-3.5 text-green-400" />
          Sent to {TOTAL} people
        </span>
      ) : null}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex h-11 items-center gap-3 border-b border-line">
      <span className="w-10 shrink-0 text-[13px] text-slate-400">{label}</span>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Deliver                                                                  */
/* -------------------------------------------------------------------------- */

function DeliverScene({ t }: { t: number }) {
  const arrived = t >= DELIVER.arrive;
  const tapping = t >= DELIVER.tap && t < DELIVER.open;
  const open = t >= DELIVER.open;
  const acking = t >= DELIVER.ackPress && t < DELIVER.acked;
  const acked = t >= DELIVER.acked;

  return (
    <div className="relative h-full overflow-hidden bg-paper">
      {/* What the employee does not need, beside the phone on wider screens. */}
      <ul className="absolute inset-y-0 left-8 hidden w-[42%] flex-col justify-center gap-4 sm:flex">
        {POINTS.map((point, i) => (
          <li
            key={point}
            className="flex items-center gap-3 text-[14px] leading-snug font-semibold text-ink"
            style={reveal(t >= DELIVER.points + i * DELIVER.pointGap)}
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-green-100 text-green-700">
              <CheckIcon className="size-3.5" />
            </span>
            {point}
          </li>
        ))}
      </ul>

      <div
        className="absolute top-4 left-1/2 isolate -translate-x-1/2 sm:right-10 sm:left-auto sm:translate-x-0"
        style={{ animation: "hero-in 700ms var(--ease-out-expo) both" }}
      >
        <span className="absolute -inset-8 -z-10 rounded-full bg-blue-500/12 blur-3xl" />
        <PhoneFrame width={220}>
          <div className="relative h-[300px] overflow-hidden">
            {/* The thread */}
            <div className="px-2.5">
              <div className="relative flex flex-col items-center border-b border-line pb-2">
                <ChevronLeftIcon className="absolute top-2 left-0 size-4 text-blue-500" />
                <BrandMark className="size-8 rounded-full text-[13px]" />
                <span className="mt-1 text-[11px] leading-none font-semibold text-ink">
                  {SENDER}
                </span>
              </div>
              <p className="mt-2 text-center text-[9.5px] leading-none text-slate-400">
                Text Message · Today {SENT_AT}
              </p>

              {arrived ? (
                <div
                  className="mt-2 origin-bottom-left"
                  style={{
                    animation: "demo-modal 460ms var(--ease-out-expo) both",
                  }}
                >
                  <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-line px-3 py-2 text-[12px] leading-snug text-ink">
                    {MESSAGE}
                    <br />
                    <span className="font-medium text-blue-700 underline decoration-blue-700/40 underline-offset-2">
                      {LINK}
                    </span>
                  </div>

                  <div
                    className={cx(
                      "relative mt-1 w-[92%] overflow-hidden rounded-2xl border border-line bg-white transition-[scale,filter] duration-200",
                      tapping && "scale-[0.97] brightness-95",
                    )}
                  >
                    <div
                      className="flex h-9 items-center gap-1.5 px-2.5"
                      style={{ background: CLIENT_BRAND }}
                    >
                      <span
                        className="grid size-4 place-items-center rounded-[4px] bg-white text-[9px] font-black"
                        style={{ color: CLIENT_BRAND }}
                      >
                        S
                      </span>
                      <span className="text-[9px] font-bold tracking-[0.14em] text-white">
                        SAMPLE CO
                      </span>
                    </div>
                    <div className="px-2.5 py-1.5">
                      <p className="truncate text-[11.5px] leading-tight font-bold text-ink">
                        Oak St schedule update
                      </p>
                      <p className="mt-0.5 text-[10px] leading-tight text-slate-400">
                        truhu.link
                      </p>
                    </div>
                    {t >= DELIVER.tap ? (
                      <span
                        className="absolute top-1/2 left-1/2 size-14 rounded-full bg-ink/15"
                        style={{ animation: "demo-ripple 520ms ease-out both" }}
                      />
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            {/* The page the link opens: no app, no sign-in. */}
            <div
              className="absolute inset-0 flex flex-col bg-white"
              style={{
                transform: open ? "none" : "translate3d(0, 104%, 0)",
                transition: "transform 620ms var(--ease-out-expo)",
              }}
            >
              <div className="mx-2.5 flex items-center justify-center gap-1 rounded-md bg-paper py-1 text-[10px] leading-none text-slate-400">
                <LockIcon className="size-2.5" />
                {LINK}
              </div>
              <div className="mt-2 px-3.5 py-3" style={{ background: CLIENT_BRAND }}>
                <p className="text-[9px] leading-none font-bold tracking-[0.14em] text-white/75">
                  SAMPLE COMPANY
                </p>
                <p className="mt-1.5 font-display text-[16px] leading-tight font-bold text-white">
                  Oak St opens at 10 AM tomorrow
                </p>
              </div>
              <div className="px-3.5 pt-3">
                <p className="text-[11.5px] leading-snug text-slate-600">
                  Day shift, here&rsquo;s your updated schedule for tomorrow.
                </p>
                <div className="mt-2.5 rounded-lg border border-line px-3 py-2">
                  <p className="text-[10px] leading-none text-slate-400">
                    Tomorrow · Day shift
                  </p>
                  <p className="tabular mt-1 text-[13px] leading-tight font-bold text-ink">
                    10:00 AM – 6:30 PM
                  </p>
                </div>
                <span
                  className={cx(
                    "mt-3 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] leading-none font-semibold text-white transition-[background-color,scale,filter] duration-300",
                    acking && "scale-[0.97] brightness-90",
                  )}
                  style={{
                    background: acked ? "var(--color-green-700)" : CLIENT_BRAND,
                  }}
                >
                  {acked ? (
                    <>
                      <CheckIcon className="size-3.5" />
                      Acknowledged
                    </>
                  ) : (
                    "Acknowledge"
                  )}
                </span>
              </div>
            </div>
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Track                                                                    */
/* -------------------------------------------------------------------------- */

function TrackScene({ t }: { t: number }) {
  return (
    <div className="flex h-full flex-col px-4 pt-3.5 pb-3.5 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-[15px] leading-tight font-bold text-ink">
            Oak St opens at 10 AM tomorrow
          </p>
          <p className="mt-0.5 truncate text-[12px] leading-tight text-slate-400">
            {AUDIENCE.join(" · ")} · {TOTAL} people
          </p>
        </div>
        <p className="hidden shrink-0 text-[11px] leading-tight text-slate-400 sm:block">
          Sent {SENT_AT}
        </p>
      </div>

      <div className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {STATS.map((stat) => {
          const shown =
            stat.at === null
              ? stat.value
              : Math.round(
                  stat.value * easeOut(clamp01((t - stat.at) / TRACK.countMs)),
                );
          const unreachable = stat.at === null;
          return (
            <div
              key={stat.label}
              className={cx(
                "min-w-0 rounded-lg border border-line px-2 py-1.5 sm:px-2.5",
                unreachable && "hidden sm:block",
              )}
            >
              <p
                className={cx(
                  "tabular font-display text-[22px] leading-none font-bold",
                  unreachable ? "text-amber-800" : "text-ink",
                )}
              >
                {shown}
              </p>
              <p className="mt-1 truncate text-[11px] leading-tight font-semibold text-slate-600">
                {stat.label}
              </p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-paper">
                <div
                  className={cx("h-full rounded-full", stat.bar)}
                  style={{
                    width: `${shown ? Math.max(3, (shown / TOTAL) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <ul className="mt-2.5 divide-y divide-line overflow-hidden rounded-lg border border-line">
        {PEOPLE.map((person) => {
          const status = statusAt(person, t);
          const pill = PILL[status];
          return (
            <li
              key={person.name}
              className={cx(
                "flex h-8 items-center gap-2.5 px-3",
                status === "no-number" && "bg-amber-50",
              )}
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-paper text-[10px] leading-none font-bold text-slate-600">
                {person.initials}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] leading-tight font-semibold text-ink">
                {person.name}
              </span>
              {person.followUp ? (
                <span
                  className="flex shrink-0 items-center gap-1 text-[11px] leading-none font-semibold whitespace-nowrap text-blue-700"
                  style={reveal(t >= TRACK.tag)}
                >
                  <RefreshIcon className="size-3.5" />
                  <span className="hidden sm:inline">Follow-up sent</span>
                </span>
              ) : null}
              <span
                className={cx(
                  "inline-flex shrink-0 items-center rounded-full px-2 py-1 text-[11px] leading-none font-semibold whitespace-nowrap transition-colors duration-500",
                  pill.className,
                )}
              >
                <span key={status} className="inline-flex items-center gap-1" style={rise()}>
                  {status === "acknowledged" ? (
                    <CheckIcon className="size-3" />
                  ) : null}
                  {pill.label}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto pt-2.5">
        <p
          className="flex items-center gap-2.5 rounded-lg bg-blue-100 px-3 py-2 text-[12px] leading-snug text-blue-700 sm:text-[12.5px]"
          style={reveal(t >= TRACK.followUp)}
        >
          <RefreshIcon className="size-4 shrink-0" />
          <span className="sm:hidden">
            <b className="font-semibold">Auto-resent</b> to the {NOT_CLICKED}{" "}
            who haven&rsquo;t clicked
          </span>
          <span className="hidden sm:inline">
            <b className="font-semibold">Automatic follow-up</b> sent only to
            the {NOT_CLICKED} who haven&rsquo;t clicked
          </span>
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Marks and icons                                                             */
/* -------------------------------------------------------------------------- */

function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "grid shrink-0 place-items-center leading-none font-bold text-white",
        className,
      )}
      style={{ background: CLIENT_BRAND }}
    >
      S
    </span>
  );
}

function Icon({
  className,
  children,
  fill,
}: {
  className?: string;
  children: ReactNode;
  fill?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M3.5 8.4 6.6 11.3 12.5 4.8" strokeWidth="2" />
    </Icon>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M14 2 7.2 8.8M14 2 9.8 14 7.2 8.8 2 6.2z" />
    </Icon>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.8V8l2.2 1.4" />
    </Icon>
  );
}

function PeopleIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="6" cy="5.5" r="2.4" />
      <path d="M1.8 13.5c.5-2.3 2.1-3.6 4.2-3.6s3.7 1.3 4.2 3.6" />
      <path d="M10.6 3.3a2.4 2.4 0 0 1 0 4.5M11.9 10.1c1.2.5 2 1.6 2.3 3.4" />
    </Icon>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <rect x="4.2" y="1.5" width="7.6" height="13" rx="1.8" />
      <path d="M7 12.2h2" />
    </Icon>
  );
}

function MonitorIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <rect x="1.5" y="2.5" width="13" height="8.8" rx="1.5" />
      <path d="M8 11.3v3M5.5 14.3h5" />
    </Icon>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M13.3 8.6A5.4 5.4 0 1 1 11.6 4" />
      <path d="M12.6 1.8v2.8H9.8" />
    </Icon>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <rect x="3.5" y="7" width="9" height="7" rx="1.4" />
      <path d="M5.6 7V5.2a2.4 2.4 0 0 1 4.8 0V7" />
    </Icon>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M10 3 5 8l5 5" strokeWidth="2" />
    </Icon>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <Icon className={className} fill>
      <rect x="3.5" y="2.5" width="3" height="11" rx="0.8" />
      <rect x="9.5" y="2.5" width="3" height="11" rx="0.8" />
    </Icon>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <Icon className={className} fill>
      <path d="M4.5 2.6v10.8c0 .5.5.8.9.5l8-5.4a.6.6 0 0 0 0-1L5.4 2.1c-.4-.3-.9 0-.9.5Z" />
    </Icon>
  );
}
