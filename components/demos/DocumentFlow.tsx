"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cx } from "@/components/ui/primitives";
import { DOCUMENT_FLOW_STEPS } from "@/lib/content";
import { OutputThumb } from "./IntakePipeline";
import { TabIcon, type OutputKey } from "./OutputShowcase";
import { useInView, useReducedMotion } from "./hooks";

/**
 * How TruHu works, for the home page, straight after the solution cards:
 * one client's files go in as they arrive, are filed, read for plan
 * details, kept on the client's record, and come out as finished materials in
 * the client's brand. The files land a little off-true, like the chips in the
 * problem above, and are straightened from the second step on.
 *
 * In a row, the five steps play in turn. Steps behind the active one hold
 * their finished state and steps ahead wait empty, so the row always reads
 * left to right as work done and work to come. Stacked, a reader sees one or
 * two steps at a time, so each plays once as it comes into view instead.
 *
 * The server renders every step finished, which is also what reduced motion
 * shows. Picking a step replays it and stops the loop, so a reader comparing
 * steps isn't overruled.
 */

const STEPS = DOCUMENT_FLOW_STEPS;
const LAST = STEPS.length - 1;
/** One past the last step: the whole row finished. */
const FINISHED = STEPS.length;

type StepKey = (typeof STEPS)[number]["key"];
/** A step waiting empty, playing in, or finished. */
type Mode = "wait" | "play" | "done";

/** How long each step plays, in ms, in step order. */
const STEP_MS = [2600, 2800, 3000, 2800, 3000] as const;
/** Once on screen, the finished row holds this long before the first lap. */
const INTRO_MS = 1400;
/** And this long at the end of every lap. */
const HOLD_MS = 3200;

/** Tile height, shared by the tiles and the connectors between them. */
const TILE_H = 212;

/** Where the stack turns into a row. Matches `xl`. */
const WIDE = "(min-width: 1280px)";

function subscribeToWidth(onChange: () => void) {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Read the way `useReducedMotion` is. The server renders the row. */
function useWide() {
  return useSyncExternalStore(
    subscribeToWidth,
    () => window.matchMedia(WIDE).matches,
    () => true,
  );
}

/* -------------------------------------------------------------------------- */
/* Sample content                                                              */
/* -------------------------------------------------------------------------- */

/** Sample Company, the client every demo uses, in its own colours. */
const CLIENT = {
  name: "Sample Company",
  initial: "S",
  brand: "#0E5A63",
  accent: "#F2A93B",
};

type Format = "pdf" | "xls" | "scan" | "guide";

/** One client's renewal as it arrives, in no order. `x` nudges a file
 *  sideways in the pile, in px; `tilt` is how far off-true it lands. */
const INBOX: readonly { file: string; format: Format; x: number; tilt: number }[] = [
  { file: "SBC_PPO_1500.pdf", format: "pdf", x: 4, tilt: -5 },
  { file: "2027_Rates.xlsx", format: "xls", x: 22, tilt: 4 },
  { file: "Scan_0041.pdf", format: "scan", x: 0, tilt: -2 },
  { file: "Dental_Vision.pdf", format: "pdf", x: 18, tilt: 5 },
  { file: "2026_Guide_v3.pdf", format: "guide", x: 6, tilt: -3 },
];

/** The same five files, each filed where it belongs. */
const FOLDERS: readonly { name: string; format: Format }[] = [
  { name: "Medical", format: "pdf" },
  { name: "Dental & vision", format: "pdf" },
  { name: "Rates", format: "xls" },
  { name: "Life & LTD", format: "scan" },
  { name: "Last year's guide", format: "guide" },
];

/** Read off the PPO's SBC: the figures the guide in `OutputShowcase` prints. */
const FIELDS = [
  { label: "Deductible", value: "$1,500" },
  { label: "Out-of-pocket max", value: "$4,000" },
  { label: "Doctor visit", value: "$25" },
  { label: "Per paycheck", value: "$48" },
] as const;

/** What the client's record keeps once the plans are confirmed. */
const RECORD = [
  { name: "Medical", note: "3 plans" },
  { name: "Dental & vision", note: "2 plans" },
  { name: "Rates", note: "2027" },
  { name: "Life & LTD", note: "2 plans" },
] as const;

const OUTPUTS: readonly { key: OutputKey; name: string }[] = [
  { key: "guide", name: "Guide" },
  { key: "website", name: "Website" },
  { key: "flyer", name: "Flyer" },
  { key: "qna", name: "Q&A" },
];

/* -------------------------------------------------------------------------- */
/* Motion                                                                      */
/* -------------------------------------------------------------------------- */

/** How each kind of part comes in, less its delay and fill. */
const ENTER = {
  rise: "demo-rise 420ms var(--ease-out-expo)",
  pop: "demo-pop 380ms var(--ease-out-back)",
  drop: "flow-drop 560ms var(--ease-out-back)",
  slide: "flow-slide 420ms var(--ease-out-expo)",
  fade: "demo-fade 300ms ease-out",
} as const;

/**
 * A part that arrives `delay` ms into its step: hidden while the step waits,
 * animated in while it plays, simply there once it is done.
 */
function arrive(
  mode: Mode,
  delay: number,
  animation: string = ENTER.rise,
): CSSProperties | undefined {
  if (mode === "wait") return { opacity: 0 };
  if (mode === "done") return undefined;
  return { animation: `${animation} ${delay}ms both` };
}

/** The reverse: a part that is there while the step waits, and leaves. */
function leave(mode: Mode, delay: number): CSSProperties | undefined {
  if (mode === "wait") return undefined;
  if (mode === "done") return { opacity: 0 };
  return { animation: `flow-out 240ms ease-out ${delay}ms both` };
}

/**
 * True from the first time the element is half on screen. Only watches while
 * `enabled`, which is when the steps are stacked.
 */
function useFirstSight<T extends HTMLElement>(enabled: boolean) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!enabled || seen || !node) return;

    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setSeen(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setSeen(true);
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, seen]);

  return [ref, seen] as const;
}

/* -------------------------------------------------------------------------- */
/* The flow                                                                    */
/* -------------------------------------------------------------------------- */

export function DocumentFlow() {
  const [ref, inView] = useInView<HTMLOListElement>(0.45);
  const reduced = useReducedMotion();
  const wide = useWide();
  const playing = inView && !reduced && wide;

  const [stage, setStage] = useState<number>(FINISHED);
  /** Bumped on every step change, so replaying the same step restarts it. */
  const [run, setRun] = useState(0);
  const [exploring, setExploring] = useState(false);

  useEffect(() => {
    if (!playing || exploring) return;
    const id = window.setTimeout(
      () => {
        setStage((current) => (current === FINISHED ? 0 : current + 1));
        setRun((n) => n + 1);
      },
      stage === FINISHED ? (run === 0 ? INTRO_MS : HOLD_MS) : STEP_MS[stage],
    );
    return () => window.clearTimeout(id);
  }, [stage, run, playing, exploring]);

  const pick = (i: number) => {
    setExploring(true);
    setStage(i);
    setRun((n) => n + 1);
  };

  return (
    <ol
      ref={ref}
      className="mx-auto grid max-w-3xl gap-12 sm:gap-10 xl:max-w-none xl:grid-cols-5 xl:gap-x-8"
    >
      {STEPS.map((step, i) => (
        <Step
          key={step.key}
          index={i}
          stage={stage}
          run={run}
          wide={wide}
          reduced={reduced}
          onPick={() => pick(i)}
        />
      ))}
    </ol>
  );
}

function Step({
  index,
  stage,
  run,
  wide,
  reduced,
  onPick,
}: {
  index: number;
  stage: number;
  run: number;
  wide: boolean;
  reduced: boolean;
  onPick: () => void;
}) {
  const step = STEPS[index];
  const [ref, seen] = useFirstSight<HTMLDivElement>(!wide && !reduced);
  /** Stacked, a step replays on its own, without the row's loop. */
  const [replay, setReplay] = useState(0);
  const [settled, setSettled] = useState(false);

  // Stacked, a step that has played settles once its time is up, so a column
  // of finished steps doesn't all stay lit as the one playing.
  useEffect(() => {
    if (wide || !seen) return;
    const id = window.setTimeout(() => setSettled(true), STEP_MS[index]);
    return () => window.clearTimeout(id);
  }, [wide, seen, replay, index]);

  const mode: Mode = wide
    ? index < stage
      ? "done"
      : index === stage
        ? "play"
        : "wait"
    : reduced
      ? "done"
      : !seen
        ? "wait"
        : settled
          ? "done"
          : "play";
  const take = wide ? run : replay;

  const pick = () => {
    if (wide) return onPick();
    setSettled(false);
    setReplay((n) => n + 1);
  };

  return (
    <li className="relative mx-auto grid w-full max-w-[24rem] min-w-0 gap-6 sm:max-w-none sm:grid-cols-[16rem_minmax(0,1fr)] sm:items-center sm:gap-8 xl:block">
      <div ref={ref} className="relative">
        <Tile mode={mode}>
          <Scene key={take} kind={step.key} mode={mode} />
        </Tile>
      </div>

      {index > 0 ? (
        <Connector lit={index <= stage} moving={wide && mode === "play"} run={run} />
      ) : null}

      <div className="xl:mt-6">
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={pick}
            aria-label={`Replay step ${index + 1}: ${step.name}`}
            className="cursor-pointer rounded-full"
          >
            <StepDot key={take} index={index} mode={mode} ms={STEP_MS[index]} />
          </button>
          {index < LAST ? (
            <span
              aria-hidden
              className="absolute top-1/2 right-[-1.5rem] left-11 hidden h-0.5 -translate-y-1/2 overflow-hidden rounded-full bg-slate-200 xl:block"
            >
              <span
                className="block h-full rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: index < stage ? "100%" : "0%",
                  background: "var(--grad-brand)",
                }}
              />
            </span>
          ) : null}
        </div>
        <h3 className="t-h4 mt-4">{step.name}</h3>
        <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-slate-600">
          {step.body}
        </p>
      </div>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Frame                                                                       */
/* -------------------------------------------------------------------------- */

function Tile({ mode, children }: { mode: Mode; children: ReactNode }) {
  return (
    <div
      aria-hidden
      data-mode={mode}
      className={cx(
        "group card-shape relative flex flex-col overflow-hidden border bg-white p-3 select-none transition-[border-color,box-shadow] duration-500",
        mode === "play"
          ? "border-blue-500/40 shadow-[0_22px_48px_-24px_rgba(5,130,220,0.55)]"
          : "border-line shadow-[0_16px_36px_-28px_rgba(10,24,38,0.5)]",
      )}
      style={{ height: TILE_H }}
    >
      <div
        className={cx(
          "flex min-h-0 flex-1 flex-col transition-opacity duration-500",
          mode === "wait" && "opacity-60",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Work handed along from the step before; it lights once it has passed. */
function Connector({
  lit,
  moving,
  run,
}: {
  lit: boolean;
  moving: boolean;
  run: number;
}) {
  return (
    <div
      aria-hidden
      className="absolute -left-8 hidden h-px w-8 xl:block"
      style={{ top: TILE_H / 2 }}
    >
      <span
        className={cx(
          "absolute inset-y-0 right-1.5 left-1 transition-colors duration-500",
          lit ? "bg-blue-500/50" : "bg-slate-300",
        )}
      />
      <svg
        viewBox="0 0 6 8"
        className={cx(
          "absolute top-1/2 right-0.5 h-2 w-1.5 -translate-y-1/2 transition-colors duration-500",
          lit ? "text-blue-500" : "text-slate-300",
        )}
      >
        <path
          d="M1 1l4 3-4 3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {moving ? (
        <span
          key={run}
          className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500 shadow-[0_0_0_3px_rgba(56,176,0,0.18),0_0_10px_rgba(56,176,0,0.55)]"
          style={{ animation: "pipe-packet 700ms var(--ease-in-out-soft) both" }}
        />
      ) : null}
    </div>
  );
}

/** The step's number, a ring that fills while it plays, then a check. */
function StepDot({ index, mode, ms }: { index: number; mode: Mode; ms: number }) {
  return (
    <span className="relative grid size-8 shrink-0 place-items-center rounded-full">
      <span
        className={cx(
          "absolute inset-0 rounded-full transition-colors duration-500",
          mode === "done" && "bg-green-500",
          mode === "play" && "bg-white ring-1 ring-blue-500/20 ring-inset",
          mode === "wait" && "bg-white ring-1 ring-slate-300 ring-inset",
        )}
      />
      {mode === "play" ? (
        <svg viewBox="0 0 32 32" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle
            cx="16"
            cy="16"
            r="15"
            fill="none"
            stroke="var(--color-blue-500)"
            strokeWidth="2"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="100"
            style={{ animation: `flow-ring ${ms}ms linear both` }}
          />
        </svg>
      ) : null}
      <span
        className={cx(
          "relative text-[12px] font-bold",
          mode === "done" ? "text-white" : mode === "play" ? "text-blue-700" : "text-slate-400",
        )}
      >
        {mode === "done" ? <CheckIcon className="size-3.5" /> : index + 1}
      </span>
    </span>
  );
}

function SceneHead({
  kind,
  label,
  status,
  statusAt,
  mode,
}: {
  kind: StepKey;
  label: string;
  status: string;
  /** When in the step the status comes up: once the scene's work is done. */
  statusAt: number;
  mode: Mode;
}) {
  return (
    <div className="mb-2.5 flex shrink-0 items-center gap-1.5 border-b border-line pb-2 leading-none">
      <StepIcon
        kind={kind}
        className="size-3.5 shrink-0 text-slate-400 transition-colors duration-500 group-data-[mode=play]:text-blue-500"
      />
      <p className="text-[9px] font-bold tracking-[0.12em] whitespace-nowrap text-slate-500 uppercase">
        {label}
      </p>
      <p
        className="tabular ml-auto truncate text-[9px] font-semibold text-slate-400"
        style={arrive(mode, statusAt, ENTER.fade)}
      >
        {status}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Scenes                                                                      */
/* -------------------------------------------------------------------------- */

type SceneProps = { mode: Mode };

function Scene({ kind, mode }: SceneProps & { kind: StepKey }) {
  if (kind === "upload") return <UploadScene mode={mode} />;
  if (kind === "organize") return <OrganizeScene mode={mode} />;
  if (kind === "extract") return <ExtractScene mode={mode} />;
  if (kind === "save") return <SaveScene mode={mode} />;
  return <BuildScene mode={mode} />;
}

/* Upload: the files tossed in, one on another, each a little askew. ---------- */

const TOSS = { start: 150, each: 220 };
const TOSSED = TOSS.start + INBOX.length * TOSS.each + 400;
/** How far down the pile each file lands, in px. A hair more than a file. */
const PILE_STEP = 27;

function UploadScene({ mode }: SceneProps) {
  return (
    <>
      <SceneHead
        kind="upload"
        label="Upload"
        status={`${INBOX.length} files`}
        statusAt={TOSSED}
        mode={mode}
      />
      <div className="relative min-h-0 flex-1 rounded-lg border border-dashed border-slate-300 bg-paper">
        {/* The empty drop zone, until the first file lands. */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-slate-400"
          style={leave(mode, TOSS.start)}
        >
          <UploadIcon className="size-6" />
          <span className="text-[10px] font-semibold">Drop files here</span>
        </div>
        <ul className="absolute inset-x-2 top-2 mx-auto max-w-[11rem]">
          {INBOX.map((doc, i) => (
            <li
              key={doc.file}
              className="absolute max-w-[calc(100%-1.5rem)]"
              style={{
                top: i * PILE_STEP,
                left: doc.x,
                rotate: `${doc.tilt}deg`,
                ...arrive(mode, TOSS.start + i * TOSS.each, ENTER.drop),
              }}
            >
              <span className="flex items-center gap-1.5 rounded-md border border-line bg-white py-1 pr-2 pl-1 shadow-[0_6px_14px_-8px_rgba(10,24,38,0.45)]">
                <FormatBadge format={doc.format} />
                <span className="truncate text-[10px] leading-none font-semibold text-ink/80">
                  {doc.file}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/* Sorted: the same files, straightened, one to a folder. -------------------- */

const FILE = { start: 200, each: 320 };
const FILED = FILE.start + FOLDERS.length * FILE.each + 250;

function OrganizeScene({ mode }: SceneProps) {
  return (
    <>
      <SceneHead
        kind="organize"
        label="Organized"
        status={`${FOLDERS.length} of ${FOLDERS.length} filed`}
        statusAt={FILED}
        mode={mode}
      />
      <ul className="flex min-h-0 flex-1 flex-col justify-between">
        {FOLDERS.map((folder, i) => (
          <li
            key={folder.name}
            className="flex h-[25px] items-center gap-1.5 rounded-md border border-line bg-paper px-1.5"
          >
            <FolderIcon className="size-3.5 shrink-0 text-blue-500/60" />
            <span className="truncate text-[10px] leading-none font-semibold text-ink/80">
              {folder.name}
            </span>
            <span
              className="ml-auto flex shrink-0 items-center gap-1"
              style={arrive(mode, FILE.start + i * FILE.each, ENTER.slide)}
            >
              <FormatBadge format={folder.format} />
              <CheckIcon className="size-3 text-green-500" />
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

/* Extracted: the SBC swept once, and the figures lifted off it. ------------- */

const READ = { sweep: 1100, start: 550, each: 300 };
const READ_OUT = READ.start + FIELDS.length * READ.each + 200;

function ExtractScene({ mode }: SceneProps) {
  return (
    <>
      <SceneHead
        kind="extract"
        label="Plan details"
        status="PPO 1500"
        statusAt={READ_OUT}
        mode={mode}
      />
      <div className="relative shrink-0 overflow-hidden rounded-md border border-line bg-paper px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          <FormatBadge format="pdf" />
          <span className="truncate text-[9.5px] leading-none font-semibold text-ink/70">
            SBC_PPO_1500.pdf
          </span>
        </div>
        <div className="mt-1.5 space-y-1">
          {["w-full", "w-4/5", "w-11/12"].map((width) => (
            <span
              key={width}
              className={cx("block h-[3px] rounded-full bg-slate-300/70", width)}
            />
          ))}
        </div>
        {mode === "play" ? (
          <span
            className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"
            style={{
              animation: `flow-sweep ${READ.sweep}ms var(--ease-in-out-soft) both`,
            }}
          />
        ) : null}
      </div>
      <ul className="mt-2 flex min-h-0 flex-1 flex-col justify-between">
        {FIELDS.map((field, i) => (
          <li
            key={field.label}
            className="flex items-center gap-2 text-[10px] leading-none"
          >
            <span className="truncate text-slate-500">{field.label}</span>
            {/* A blank until the figure lands on top of it. */}
            <span className="relative ml-auto grid shrink-0 place-items-center">
              <span className="absolute right-0 h-[3px] w-7 rounded-full bg-slate-200" />
              <span
                className="tabular relative rounded bg-blue-100 px-1.5 py-[3px] font-bold text-blue-700"
                style={arrive(mode, READ.start + i * READ.each, ENTER.pop)}
              >
                {field.value}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

/* Saved: the client's record, confirmed, and ready for next year. ----------- */

const KEEP = { start: 250, each: 280, confirmed: 1450, next: 1650 };

function SaveScene({ mode }: SceneProps) {
  return (
    <>
      <SceneHead
        kind="save"
        label="Client record"
        status="Confirmed"
        statusAt={KEEP.confirmed}
        mode={mode}
      />
      <div className="flex shrink-0 items-center gap-2">
        <span
          className="grid size-6 shrink-0 place-items-center rounded-md text-[11px] font-bold text-white"
          style={{ background: CLIENT.brand }}
        >
          {CLIENT.initial}
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[10.5px] font-bold text-ink">
            {CLIENT.name}
          </span>
          <span className="block text-[9px] text-slate-400">2027 plan year</span>
        </span>
      </div>
      <ul className="mt-2.5 space-y-1.5">
        {RECORD.map((row, i) => (
          <li key={row.name} className="flex items-center gap-1.5 text-[10px] leading-none">
            <span className="relative size-3.5 shrink-0 rounded-full ring-1 ring-slate-300 ring-inset">
              <span
                className="absolute inset-0 grid place-items-center rounded-full bg-green-500 text-white"
                style={arrive(mode, KEEP.start + i * KEEP.each, ENTER.pop)}
              >
                <CheckIcon className="size-2.5" />
              </span>
            </span>
            <span className="font-semibold text-ink/80">{row.name}</span>
            <span className="tabular ml-auto text-slate-400">{row.note}</span>
          </li>
        ))}
      </ul>
      <p
        className="mt-auto flex shrink-0 items-center gap-1.5 rounded-md border border-green-500/25 bg-green-100 px-2 py-1.5 text-[9.5px] leading-none font-semibold text-green-700"
        style={arrive(mode, KEEP.next)}
      >
        <RenewIcon className="size-3 shrink-0" />
        Ready for the 2028 renewal
      </p>
    </>
  );
}

/* Built: every output, in the client's brand, waiting on the team. ---------- */

const BUILD = { start: 250, each: 400 };
const BUILT = BUILD.start + OUTPUTS.length * BUILD.each + 150;

function BuildScene({ mode }: SceneProps) {
  return (
    <>
      <SceneHead
        kind="build"
        label="Deliverables"
        status={`${OUTPUTS.length} drafts`}
        statusAt={BUILT}
        mode={mode}
      />
      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2">
        {OUTPUTS.map((output, i) => (
          <div key={output.key} className="flex min-h-0 flex-col">
            <div className="relative min-h-0 flex-1 rounded-md border border-dashed border-slate-300 bg-paper">
              <span className="absolute inset-0 grid place-items-center text-slate-300">
                <TabIcon kind={output.key} className="size-4" />
              </span>
              <div
                className="absolute -inset-px overflow-hidden rounded-md bg-paper shadow-[0_8px_18px_-10px_rgba(10,24,38,0.5)]"
                style={arrive(mode, BUILD.start + i * BUILD.each, ENTER.pop)}
              >
                <OutputThumb kind={output.key} client={CLIENT} />
              </div>
              <span
                className="absolute -right-1 -bottom-1 grid size-3.5 place-items-center rounded-full bg-green-500 text-white ring-2 ring-white"
                style={arrive(mode, BUILD.start + i * BUILD.each + 200, ENTER.pop)}
              >
                <CheckIcon className="size-2" />
              </span>
            </div>
            <p className="mt-1 text-[9px] leading-none font-semibold text-slate-500">
              {output.name}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Small parts                                                                 */
/* -------------------------------------------------------------------------- */

const BADGE: Record<Format, string> = {
  pdf: "bg-red-600/85 text-white",
  xls: "bg-green-700 text-white",
  scan: "bg-[#d8d1bf] text-ink/70",
  guide: "bg-slate-400 text-white",
};

function FormatBadge({ format }: { format: Format }) {
  return (
    <span
      className={cx(
        "grid h-4 w-3.5 shrink-0 place-items-end rounded-[2px] pb-px text-[5px] font-bold",
        BADGE[format],
      )}
    >
      {format === "xls" ? "XLS" : "PDF"}
    </span>
  );
}

function StepIcon({ kind, className }: { kind: StepKey; className?: string }) {
  const paths: Record<StepKey, ReactNode> = {
    upload: (
      <>
        <path d="M8 10.5V3m0 0L5.3 5.7M8 3l2.7 2.7" />
        <path d="M3 9.5V12a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 13 12V9.5" />
      </>
    ),
    organize: (
      <>
        <path d="M6 4h7.5M6 8h7.5M6 12h7.5" />
        <path d="M2.5 4h.5M2.5 8h.5M2.5 12h.5" />
      </>
    ),
    extract: (
      <>
        <path d="M2.5 5.5v-2a1 1 0 0 1 1-1h2M10.5 2.5h2a1 1 0 0 1 1 1v2M13.5 10.5v2a1 1 0 0 1-1 1h-2M5.5 13.5h-2a1 1 0 0 1-1-1v-2" />
        <path d="M5 8h6" />
      </>
    ),
    save: (
      <>
        <ellipse cx="8" cy="4" rx="5" ry="1.8" />
        <path d="M3 4v8c0 1 2.2 1.8 5 1.8s5-.8 5-1.8V4" />
        <path d="M3 8c0 1 2.2 1.8 5 1.8s5-.8 5-1.8" />
      </>
    ),
    build: (
      <>
        <path d="M8 2.5 13.5 5 8 7.5 2.5 5z" />
        <path d="m2.5 8 5.5 2.5L13.5 8" />
        <path d="m2.5 11 5.5 2.5 5.5-2.5" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {paths[kind]}
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <path
        d="M1.5 4A1.5 1.5 0 0 1 3 2.5h3L7.5 4H13a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 13 13H3a1.5 1.5 0 0 1-1.5-1.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M7 17.5h-.5a4 4 0 0 1-.6-8 6 6 0 0 1 11.6-.5 3.8 3.8 0 0 1 .3 7.5H17"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M12 11v8m0-8-3 3m3-3 3 3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Round again: the record carried into next year. */
function RenewIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M13 6.5A5 5 0 0 0 3.8 5M3 9.5A5 5 0 0 0 12.2 11" />
      <path d="M3.5 2.5v2.7h2.7M12.5 13.5v-2.7H9.8" />
    </svg>
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
