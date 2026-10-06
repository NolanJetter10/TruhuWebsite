"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { cx } from "@/components/ui/primitives";
import { ADVISOR_PAGE } from "@/lib/content";
import { TabIcon, type OutputKey } from "./OutputShowcase";
import { useInView, useReducedMotion } from "./hooks";

/**
 * How Advisor works, laid out as one pipeline: the broker's book of client
 * folders, one client's files dropped in as they are, sorted and read, the
 * outputs picked, and every one built in the client's brand.
 *
 * Each stage is a small scene drawn from the time elapsed in it, so a scene
 * can tick, count and fill without timers of its own. Stages before the
 * active one hold their finished state and stages after it wait empty, so the
 * row always reads left to right as work done and work to come. Each lap
 * opens a different client's folder, and not every folder has last year's
 * guide in it.
 *
 * The server renders the finished pipeline, which is also what reduced motion
 * shows; the loop runs only while it is on screen. Picking a stage replays it
 * and stops the loop, so a reader comparing stages isn't overruled.
 */

const { pipeline, outputs } = ADVISOR_PAGE;
const STAGES = pipeline.stages;
const LAST = STAGES.length - 1;

type StageKey = (typeof STAGES)[number]["key"];
type Phase = "done" | "active" | "waiting";

/** How long each stage plays, in ms, in stage order. */
const STAGE_MS = [4000, 4000, 4600, 2800, 5400] as const;
/** Once on screen, the finished pipeline holds this long before the first lap. */
const INTRO_MS = 1600;
/** Later than anything in any scene: the scene's finished state. */
const SETTLED = 1e9;

/** Tile height, shared by the tiles and the connectors between them. */
const TILE_H = 272;

/* -------------------------------------------------------------------------- */
/* Sample content                                                              */
/* -------------------------------------------------------------------------- */

type Format = "pdf" | "xls" | "scan" | "guide";
type Tray = "medical" | "dental" | "rates" | "life" | "prior";
type Doc = { file: string; label: string; format: Format; tray: Tray };

type Client = {
  /** Where the client's folder sits in `FOLDERS`. */
  folder: number;
  name: string;
  initial: string;
  site: string;
  link: string;
  /** Deliberately not TruHu colours: every client keeps its own. */
  brand: string;
  accent: string;
  details: number;
  samples: readonly [string, string];
  docs: readonly Doc[];
};

/** The book as a file browser lists it: the same 60 clients as the problem's. */
const FOLDERS = [
  { name: "Bluewater Logistics", files: 9 },
  { name: "Harbor Clinics", files: 6 },
  { name: "Oakview Schools", files: 6 },
  { name: "Sample Company", files: 6 },
  { name: "Summit Tool & Die", files: 8 },
] as const;
const BOOK_SIZE = 60;

/** One client per lap. Sample Company leads, as the client every demo uses. */
const CLIENTS: readonly Client[] = [
  {
    folder: 3,
    name: "Sample Company",
    initial: "S",
    site: "samplecompany.com",
    link: "sampleco.truhu.site",
    brand: "#0E5A63",
    accent: "#F2A93B",
    details: 48,
    samples: ["Deductible $1,500", "HSA $750"],
    docs: [
      { file: "2026_Benefits_Guide.pdf", label: "2026 guide", format: "guide", tray: "prior" },
      { file: "2027_Rates.xlsx", label: "Rates", format: "xls", tray: "rates" },
      { file: "Dental_Vision_2027.pdf", label: "Dental", format: "pdf", tray: "dental" },
      { file: "Life_ADD_scan.pdf", label: "Life scan", format: "scan", tray: "life" },
      { file: "SBC_HDHP_3200.pdf", label: "SBC · HDHP", format: "pdf", tray: "medical" },
      { file: "SBC_PPO_1500.pdf", label: "SBC · PPO", format: "pdf", tray: "medical" },
    ],
  },
  {
    // No guide last year: just the carriers' documents.
    folder: 1,
    name: "Harbor Clinics",
    initial: "H",
    site: "harborclinics.org",
    link: "harborclinics.truhu.site",
    brand: "#5B3F99",
    accent: "#F4C95D",
    details: 41,
    samples: ["EPO copay $30", "HSA $500"],
    docs: [
      { file: "Brightsmile_Dental.pdf", label: "Dental", format: "pdf", tray: "dental" },
      { file: "ClearView_Vision.pdf", label: "Vision", format: "pdf", tray: "dental" },
      { file: "Contributions_27.xlsx", label: "Rates", format: "xls", tray: "rates" },
      { file: "LTD_policy_scan.pdf", label: "LTD scan", format: "scan", tray: "life" },
      { file: "Northwind_SBC_EPO.pdf", label: "SBC · EPO", format: "pdf", tray: "medical" },
      { file: "Northwind_SBC_HSA.pdf", label: "SBC · HSA", format: "pdf", tray: "medical" },
    ],
  },
  {
    folder: 2,
    name: "Oakview Schools",
    initial: "O",
    site: "oakviewschools.org",
    link: "oakview.truhu.site",
    brand: "#7A2E3A",
    accent: "#E8B04A",
    details: 52,
    samples: ["HMO copay $25", "Frames $150"],
    docs: [
      { file: "Guide_2026_FINAL_v3.pdf", label: "2026 guide", format: "guide", tray: "prior" },
      { file: "Renewal_rates.xlsx", label: "Rates", format: "xls", tray: "rates" },
      { file: "SBC_Gold_PPO.pdf", label: "SBC · PPO", format: "pdf", tray: "medical" },
      { file: "SBC_Silver_HMO.pdf", label: "SBC · HMO", format: "pdf", tray: "medical" },
      { file: "Scan_0041.pdf", label: "Life scan", format: "scan", tray: "life" },
      { file: "Vision_Dental.pdf", label: "Dental", format: "pdf", tray: "dental" },
    ],
  },
];

const TRAYS: readonly { key: Exclude<Tray, "prior">; name: string }[] = [
  { key: "medical", name: "Medical" },
  { key: "dental", name: "Dental & vision" },
  { key: "rates", name: "Rates" },
  { key: "life", name: "Life & LTD" },
];

/** The outputs' names where they sit under a thumbnail. */
const SHORT: Record<OutputKey, string> = {
  guide: "Guide",
  flipbook: "Flipbook",
  website: "Website",
  flyer: "Flyer",
  qna: "Chatbot",
  video: "Video",
};

/** Last year's guide keeps last year's generic look. */
const OLD_GUIDE = "#64748b";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const easeOut = (n: number) => 1 - Math.pow(1 - n, 3);

const rise = (delayMs = 0): CSSProperties => ({
  animation: "demo-rise 420ms var(--ease-out-expo) both",
  animationDelay: `${delayMs}ms`,
});

const pop: CSSProperties = {
  animation: "demo-pop 380ms var(--ease-out-back) both",
};

/* -------------------------------------------------------------------------- */
/* The pipeline                                                                */
/* -------------------------------------------------------------------------- */

export function IntakePipeline() {
  const [ref, inView] = useInView<HTMLElement>(0.3);
  const reduced = useReducedMotion();
  const playing = inView && !reduced;

  const [stage, setStage] = useState(LAST);
  const [lap, setLap] = useState(0);
  /** Bumped on every stage change, so replaying the same stage restarts it. */
  const [run, setRun] = useState(0);
  const [started, setStarted] = useState(false);
  const [exploring, setExploring] = useState(false);
  const [clock, setClock] = useState({ run: -1, ms: 0 });

  // Advance through the stages while on screen. Before the first lap the
  // finished pipeline holds for a beat, so it reads as a whole first.
  useEffect(() => {
    if (!playing || exploring) return;
    const id = window.setTimeout(
      () => {
        const next = started ? (stage + 1) % STAGES.length : 0;
        if (started && next === 0) setLap((n) => n + 1);
        setStarted(true);
        setStage(next);
        setRun((n) => n + 1);
      },
      started ? STAGE_MS[stage] : INTRO_MS,
    );
    return () => window.clearTimeout(id);
  }, [stage, run, started, playing, exploring]);

  // The clock inside the current stage. It stops once the stage has played,
  // so a stage picked by hand holds without re-rendering. Stale readings from
  // the previous stage are discarded below by comparing `run`.
  useEffect(() => {
    if (!playing || !started) return;
    const begin = performance.now();
    const id = window.setInterval(() => {
      const ms = performance.now() - begin;
      setClock({ run, ms });
      if (ms > STAGE_MS[stage]) window.clearInterval(id);
    }, 50);
    return () => window.clearInterval(id);
  }, [run, stage, playing, started]);

  const t = !started || reduced ? SETTLED : clock.run === run ? clock.ms : 0;
  const progress = clamp01(t / STAGE_MS[stage]);
  const client = CLIENTS[lap % CLIENTS.length];

  const phaseOf = (i: number): Phase =>
    i < stage ? "done" : i === stage ? "active" : "waiting";
  const timeOf = (i: number) => (i < stage ? SETTLED : i === stage ? t : 0);

  const pick = (i: number) => {
    setExploring(true);
    setStarted(true);
    setStage(i);
    setRun((n) => n + 1);
  };

  return (
    <figure ref={ref} className="relative">
      {/* Five columns on a wide screen; below that, the active stage alone
          above a stepper, since five tiles side by side get too narrow to
          read. */}
      <div className="grid xl:grid-cols-5 xl:gap-x-7">
        {STAGES.map((item, i) => {
          const phase = phaseOf(i);
          return (
            <div
              key={item.key}
              className={cx("relative min-w-0", phase !== "active" && "max-xl:hidden")}
            >
              <div className="relative max-xl:mx-auto max-xl:max-w-[380px]">
                <Tile phase={phase}>
                  <Scene kind={item.key} t={timeOf(i)} client={client} />
                </Tile>
              </div>

              {i > 0 ? (
                <Connector
                  lit={i <= stage}
                  moving={phase === "active" && t < 700}
                  run={run}
                />
              ) : null}

              <button
                type="button"
                onClick={() => pick(i)}
                aria-current={phase === "active" ? "step" : undefined}
                className="group/step mt-6 block w-full cursor-pointer text-left max-xl:hidden"
              >
                <span className="relative flex items-center">
                  <StepDot index={i} phase={phase} progress={progress} />
                  {i < LAST ? (
                    <span
                      aria-hidden
                      className="absolute top-1/2 right-[-20px] left-11 h-0.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/12"
                    >
                      <span
                        className="block h-full rounded-full transition-[width] duration-700 ease-out"
                        style={{
                          width: i < stage ? "100%" : "0%",
                          background: "var(--grad-brand-bright)",
                        }}
                      />
                    </span>
                  ) : null}
                </span>
                <span
                  className={cx(
                    "mt-3 block font-display text-[1.0625rem] font-bold transition-colors duration-500",
                    phase === "active"
                      ? "text-white"
                      : phase === "done"
                        ? "text-white/75"
                        : "text-white/50 group-hover/step:text-white/75",
                  )}
                >
                  {item.name}
                </span>
                <span
                  className={cx(
                    "mt-1 block text-[0.875rem] leading-snug transition-colors duration-500",
                    phase === "active" ? "text-slate-300" : "text-white/40",
                  )}
                >
                  {item.body}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* The stepper, below a wide screen. -------------------------------- */}
      <div className="mt-7 xl:hidden">
        <div className="mx-auto flex max-w-[560px] items-start">
          {STAGES.map((item, i) => {
            const phase = phaseOf(i);
            const edge =
              i === 0
                ? "left-0"
                : i === LAST
                  ? "right-0"
                  : "left-1/2 -translate-x-1/2";
            return (
              <div
                key={item.key}
                className={cx("flex items-center", i < LAST && "flex-1")}
              >
                <button
                  type="button"
                  onClick={() => pick(i)}
                  aria-label={`Step ${i + 1}: ${item.name}`}
                  aria-current={phase === "active" ? "step" : undefined}
                  className="relative cursor-pointer"
                >
                  <StepDot index={i} phase={phase} progress={progress} />
                  <span
                    className={cx(
                      "absolute top-full mt-2 hidden text-[11px] font-semibold whitespace-nowrap transition-colors duration-500 sm:block",
                      edge,
                      phase === "active"
                        ? "text-white"
                        : phase === "done"
                          ? "text-white/70"
                          : "text-white/40",
                    )}
                  >
                    {item.name}
                  </span>
                </button>
                {i < LAST ? (
                  <span className="mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-white/12">
                    <span
                      className="block h-full rounded-full transition-[width] duration-700 ease-out"
                      style={{
                        width: i < stage ? "100%" : "0%",
                        background: "var(--grad-brand-bright)",
                      }}
                    />
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>

        <div
          key={stage}
          className="mx-auto mt-5 max-w-[380px] text-center sm:mt-11"
          style={{ animation: "demo-caption 520ms var(--ease-out-expo) both" }}
        >
          <p className="font-display text-lg font-bold text-white">
            {STAGES[stage].name}
          </p>
          <p className="mt-1 text-[0.9375rem] leading-snug text-slate-300">
            {STAGES[stage].body}
          </p>
        </div>
      </div>

      <figcaption className="sr-only">
        How TruHu Advisor works:{" "}
        {STAGES.map((item) => `${item.name}. ${item.body}`).join(" ")}
      </figcaption>
    </figure>
  );
}

/* -------------------------------------------------------------------------- */
/* Frame                                                                       */
/* -------------------------------------------------------------------------- */

function Tile({ phase, children }: { phase: Phase; children: ReactNode }) {
  return (
    <div
      aria-hidden
      data-phase={phase}
      className={cx(
        "group card-shape relative flex flex-col overflow-hidden border p-3 select-none transition-[border-color,background-color,box-shadow] duration-500",
        phase === "active"
          ? "border-blue-400/50 bg-white/[0.06] shadow-[0_18px_50px_-20px_rgba(56,182,255,0.6)]"
          : phase === "done"
            ? "border-white/12 bg-white/[0.035]"
            : "border-white/[0.07] bg-white/[0.015]",
      )}
      style={{ height: TILE_H }}
    >
      <div
        className={cx(
          "flex min-h-0 flex-1 flex-col transition-opacity duration-500",
          phase === "waiting" && "opacity-40",
          phase === "done" && "opacity-85",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Work handed along from the stage before; it lights once it has passed. */
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
      className="absolute -left-7 hidden h-px w-7 xl:block"
      style={{ top: TILE_H / 2 }}
    >
      <span
        className={cx(
          "absolute inset-y-0 right-1.5 left-1 transition-colors duration-500",
          lit ? "bg-blue-400/60" : "bg-white/15",
        )}
      />
      <svg
        viewBox="0 0 6 8"
        className={cx(
          "absolute top-1/2 right-0.5 h-2 w-1.5 -translate-y-1/2 transition-colors duration-500",
          lit ? "text-blue-400" : "text-white/25",
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
          className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-400 shadow-[0_0_0_3px_rgba(87,217,94,0.2),0_0_12px_rgba(87,217,94,0.9)]"
          style={{ animation: "pipe-packet 700ms var(--ease-in-out-soft) both" }}
        />
      ) : null}
    </div>
  );
}

function StepDot({
  index,
  phase,
  progress,
}: {
  index: number;
  phase: Phase;
  progress: number;
}) {
  return (
    <span className="relative grid size-8 shrink-0 place-items-center rounded-full">
      <span
        className={cx(
          "absolute inset-0 rounded-full transition-colors duration-500",
          phase === "done" && "bg-green-500",
          phase === "waiting" && "bg-white/[0.08] ring-1 ring-white/20",
        )}
        style={
          phase === "active"
            ? {
                background: `conic-gradient(var(--color-blue-400) ${
                  progress * 360
                }deg, rgba(255,255,255,0.14) 0deg)`,
              }
            : undefined
        }
      />
      {phase === "active" ? (
        <span className="absolute inset-[3px] rounded-full bg-ink-900" />
      ) : null}
      <span
        className={cx(
          "relative text-[12px] font-bold",
          phase === "waiting" ? "text-white/45" : "text-white",
        )}
      >
        {phase === "done" ? <CheckIcon className="size-3.5" /> : index + 1}
      </span>
    </span>
  );
}

function SceneHead({
  kind,
  label,
  status,
}: {
  kind: StageKey;
  label: string;
  status: string;
}) {
  return (
    <div className="mb-2.5 flex shrink-0 items-center gap-1.5 border-b border-white/10 pb-2">
      <StageIcon
        kind={kind}
        className="size-3.5 shrink-0 text-white/45 transition-colors duration-500 group-data-[phase=active]:text-blue-400"
      />
      <p className="text-[9px] font-bold tracking-[0.12em] whitespace-nowrap text-white/55 uppercase">
        {label}
      </p>
      <p className="tabular ml-auto truncate text-[9px] font-semibold text-white/40">
        {status}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Scenes                                                                      */
/* -------------------------------------------------------------------------- */

type SceneProps = { t: number; client: Client };

function Scene({ kind, t, client }: SceneProps & { kind: StageKey }) {
  if (kind === "book") return <BookScene t={t} client={client} />;
  if (kind === "upload") return <UploadScene t={t} client={client} />;
  if (kind === "sort") return <SortScene t={t} client={client} />;
  if (kind === "choose") return <ChooseScene t={t} client={client} />;
  return <BuildScene t={t} client={client} />;
}

/* Your book: down every client folder, then this lap's client opens. -------- */

const ROW_H = 22;
const FILE_H = 16;
const HOP = { start: 250, each: 330 };
/** One beat after the highlight comes back to the client. */
const OPEN_AT = HOP.start + (FOLDERS.length + 1) * HOP.each;

function BookScene({ t, client }: SceneProps) {
  const hop = Math.floor((t - HOP.start) / HOP.each);
  const at = t < HOP.start ? -1 : hop < FOLDERS.length ? hop : client.folder;
  const open = t >= OPEN_AT;

  return (
    <>
      <SceneHead kind="book" label="Client files" status={`${BOOK_SIZE} clients`} />
      {/* Opening a folder pushes the rest of the book out of the bottom. */}
      <div className="relative min-h-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_bottom,black_84%,transparent)]">
        <span
          className="absolute inset-x-0 top-0 rounded-md bg-blue-400/15 ring-1 ring-blue-400/40 transition-[translate,opacity] duration-300"
          style={{
            height: ROW_H,
            translate: `0 ${Math.max(0, at) * ROW_H}px`,
            opacity: at < 0 ? 0 : 1,
            transitionTimingFunction: "var(--ease-out-expo)",
          }}
        />
        <ul className="relative">
          {FOLDERS.map((folder, i) => {
            const lit = i === at;
            const expanded = i === client.folder && open;
            return (
              <li key={folder.name}>
                <div
                  className="flex items-center gap-1.5 px-1.5"
                  style={{ height: ROW_H }}
                >
                  <Chevron open={expanded} className="size-2 shrink-0 text-white/35" />
                  <FolderIcon
                    open={expanded}
                    className={cx(
                      "size-3.5 shrink-0 transition-colors duration-300",
                      lit ? "text-blue-400" : "text-white/35",
                    )}
                  />
                  <span
                    className={cx(
                      "truncate text-[10px] font-semibold transition-colors duration-300",
                      lit ? "text-white" : "text-white/60",
                    )}
                  >
                    {folder.name}
                  </span>
                  <span className="tabular ml-auto shrink-0 text-[9px] text-white/35">
                    {folder.files}
                  </span>
                </div>
                {i === client.folder ? (
                  <div
                    className="grid transition-[grid-template-rows] duration-500"
                    style={{
                      gridTemplateRows: expanded ? "1fr" : "0fr",
                      transitionTimingFunction: "var(--ease-out-expo)",
                    }}
                  >
                    <ul className="overflow-hidden">
                      {client.docs.map((doc, d) => {
                        const shown = t >= OPEN_AT + 100 + d * 110;
                        return (
                          <li
                            key={doc.file}
                            className="flex items-center gap-1.5 pr-1.5 pl-[30px] transition-[opacity,translate] duration-300"
                            style={{
                              height: FILE_H,
                              opacity: shown ? 1 : 0,
                              translate: shown ? "0 0" : "0 4px",
                            }}
                          >
                            <FormatBadge format={doc.format} />
                            <span className="truncate text-[9.5px] text-white/65">
                              {doc.file}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

/* Upload: the folder as it is, dropped in and stacked. ---------------------- */

/** Where each document lands in the pile: across as a fraction, down in px. */
const PILE = [
  { x: 0.17, y: 2, r: -6 },
  { x: 0.5, y: 0, r: 3 },
  { x: 0.83, y: 4, r: -3 },
  { x: 0.18, y: 66, r: 4 },
  { x: 0.5, y: 70, r: -5 },
  { x: 0.82, y: 64, r: 6 },
];
const PAPER = { w: 44, h: 56 };
/** Where the inbox starts, below the pile, until every file is in. */
const INBOX_TOP = 140;
const INBOX_H = 78;
/** A document stacked in the inbox while the rest are still arriving... */
const STACK = { scale: 0.62, step: 10 };
/** ...and fanned across the middle once they all have. */
const FAN = { scale: 0.8, step: 16, top: 62 };
const UPLOAD = { appear: 150, stagger: 110, drop: 1250, each: 210, travel: 520 };

/** Where a document sits in the inbox. Documents scale about their centre,
 *  so each is placed by its visual box rather than its layout box. */
function inboxSpot(i: number, count: number, received: boolean) {
  const { scale, step } = received ? FAN : STACK;
  const inset = { x: (PAPER.w * (1 - scale)) / 2, y: (PAPER.h * (1 - scale)) / 2 };
  if (received) {
    const width = PAPER.w * scale + (count - 1) * step;
    return {
      left: `calc(50% - ${width / 2 + inset.x - i * step}px)`,
      top: FAN.top - inset.y,
      transform: `rotate(${(i - (count - 1) / 2) * 3}deg) scale(${scale})`,
    };
  }
  return {
    left: `${12 + i * step - inset.x}px`,
    top: INBOX_TOP + (INBOX_H - PAPER.h * scale) / 2 - inset.y,
    transform: `rotate(${(i - (count - 1) / 2) * 2}deg) scale(${scale})`,
  };
}

function UploadScene({ t, client }: SceneProps) {
  const { docs } = client;
  const landed = docs.filter(
    (_, i) => t >= UPLOAD.drop + i * UPLOAD.each + UPLOAD.travel,
  ).length;
  const received = landed === docs.length;
  const receiving = t >= UPLOAD.drop && !received;

  return (
    <>
      <SceneHead
        kind="upload"
        label="Upload"
        status={received ? `${docs.length} files` : landed ? `${landed} of ${docs.length}` : ""}
      />
      <div className="relative min-h-0 flex-1">
        {/* The inbox. Once everything is in, it takes the whole tile. */}
        <div
          className={cx(
            "absolute inset-x-0 bottom-0 rounded-lg border border-dashed transition-[top,border-color,background-color] duration-500",
            receiving
              ? "border-blue-400/70 bg-blue-400/[0.08]"
              : received
                ? "border-green-400/40 bg-green-400/[0.05]"
                : "border-white/20 bg-white/[0.02]",
          )}
          style={{
            top: received ? 0 : INBOX_TOP,
            transitionTimingFunction: "var(--ease-out-expo)",
          }}
        >
          {received ? (
            <div
              className="absolute inset-x-2 text-center"
              style={{ top: FAN.top + PAPER.h * FAN.scale + 16 }}
            >
              <p className="tabular text-[15px] leading-none font-bold text-white">
                {docs.length} files in
              </p>
              <p className="mt-1.5 flex items-center justify-center gap-1 text-[9px] font-semibold text-green-400">
                <CheckIcon className="size-2.5" />
                Received, as they came
              </p>
            </div>
          ) : landed ? (
            <div className="absolute top-1/2 right-2 left-[98px] -translate-y-1/2">
              <p className="tabular text-[15px] leading-none font-bold text-white">
                {landed}
                <span className="text-[10px] font-semibold text-white/45">
                  {" "}
                  / {docs.length}
                </span>
              </p>
              <p className="mt-1 text-[9px] font-semibold text-blue-400">
                Uploading
              </p>
            </div>
          ) : (
            <div className="grid h-full place-items-center text-center">
              <div>
                <UploadIcon
                  className={cx(
                    "mx-auto size-5 transition-colors duration-300",
                    receiving ? "text-blue-400" : "text-white/35",
                  )}
                />
                <p className="mt-1 text-[9.5px] font-semibold text-white/50">
                  Drop files here
                </p>
              </div>
            </div>
          )}
        </div>

        {/* The documents: a messy pile, then into the inbox. The scan came
            in sideways. */}
        {docs.map((doc, i) => {
          const shown = t >= UPLOAD.appear + i * UPLOAD.stagger;
          const dropped = t >= UPLOAD.drop + i * UPLOAD.each;
          const spot = PILE[i];
          const tilt = doc.format === "scan" ? -84 : spot.r;
          const place = dropped
            ? inboxSpot(i, docs.length, received)
            : {
                left: `calc(${spot.x * 100}% - ${PAPER.w / 2}px)`,
                top: spot.y,
                transform: `rotate(${tilt}deg) scale(${shown ? 1 : 0.85})`,
              };
          return (
            <div
              key={doc.file}
              className="absolute"
              style={{
                ...place,
                width: PAPER.w,
                height: PAPER.h,
                opacity: shown ? 1 : 0,
                transition:
                  "left 560ms var(--ease-in-out-soft), top 560ms var(--ease-in-out-soft), transform 560ms var(--ease-in-out-soft), opacity 300ms ease-out",
              }}
            >
              <Paper doc={doc} />
            </div>
          );
        })}
      </div>
    </>
  );
}

function Paper({ doc }: { doc: Doc }) {
  if (doc.format === "guide") {
    return (
      <div
        className="flex h-full flex-col overflow-hidden rounded-[3px] p-1.5 shadow-[0_6px_14px_-6px_rgba(0,0,0,0.7)]"
        style={{ background: OLD_GUIDE }}
      >
        <span className="block h-1 w-3 rounded-full bg-white/60" />
        <span className="mt-auto text-[11px] leading-none font-bold text-white">
          2026
        </span>
        <span className="mt-0.5 text-[5.5px] leading-tight font-semibold text-white/80">
          Benefits Guide
        </span>
      </div>
    );
  }

  const sheet = doc.format === "xls";
  return (
    <div
      className={cx(
        "flex h-full flex-col overflow-hidden rounded-[3px] p-1.5 shadow-[0_6px_14px_-6px_rgba(0,0,0,0.7)]",
        doc.format === "scan" ? "bg-[#e7e3d8]" : "bg-white",
      )}
    >
      <FormatBadge format={doc.format} />
      {sheet ? (
        <div className="mt-1.5 grid grid-cols-3 gap-px">
          {Array.from({ length: 9 }, (_, k) => (
            <span key={k} className="h-1 bg-green-700/25" />
          ))}
        </div>
      ) : (
        <div className="mt-1.5 space-y-[3px]">
          <span className="block h-[2px] rounded-full bg-ink/25" />
          <span className="block h-[2px] w-4/5 rounded-full bg-ink/15" />
          <span className="block h-[2px] w-11/12 rounded-full bg-ink/15" />
        </div>
      )}
      <span className="mt-auto truncate text-[6.5px] font-bold text-ink/70">
        {doc.label}
      </span>
    </div>
  );
}

/* Auto-sort: read, filed, mined. -------------------------------------------- */

const SORT = { start: 200, each: 400, details: 2800, count: 1000 };
const filedAt = (i: number) => SORT.start + (i + 1) * SORT.each;

function SortScene({ t, client }: SceneProps) {
  const { docs } = client;
  const reading = Math.floor((t - SORT.start) / SORT.each);
  const allFiled = t >= filedAt(docs.length - 1);
  const prior = docs.findIndex((doc) => doc.tray === "prior");
  const found =
    t < SORT.details
      ? 0
      : Math.round(client.details * easeOut(clamp01((t - SORT.details) / SORT.count)));
  const live = t < SETTLED;

  return (
    <>
      <SceneHead
        kind="sort"
        label="AI sort"
        status={
          allFiled
            ? "Sorted"
            : reading >= 0
              ? `Reading ${reading + 1} of ${docs.length}`
              : ""
        }
      />
      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
        {/* The file being read */}
        <div className="relative flex h-7 shrink-0 items-center gap-1.5 overflow-hidden rounded-md border border-white/10 bg-white/[0.04] px-2">
          {allFiled ? (
            <span className="flex items-center gap-1.5 text-[9.5px] font-semibold text-green-400">
              <CheckIcon className="size-3" />
              {docs.length} files sorted
            </span>
          ) : reading >= 0 ? (
            <>
              <FormatBadge format={docs[reading].format} />
              <span className="truncate text-[9.5px] text-white/80">
                {docs[reading].file}
              </span>
              <span
                key={reading}
                className="pointer-events-none absolute inset-y-0 left-0 w-1/2"
                style={{
                  background:
                    "linear-gradient(100deg, transparent, rgba(56,182,255,0.3), transparent)",
                  animation: `demo-sweep ${SORT.each}ms linear both`,
                }}
              />
            </>
          ) : (
            <span className="text-[9.5px] text-white/35">Waiting for files</span>
          )}
        </div>

        {/* The trays */}
        <div className="grid shrink-0 grid-cols-2 gap-1.5">
          {TRAYS.map((tray) => {
            const filed = docs
              .map((doc, i) => ({ doc, i }))
              .filter(({ doc, i }) => doc.tray === tray.key && t >= filedAt(i));
            const flash = filed.some(({ i }) => t - filedAt(i) < 450);
            return (
              <div
                key={tray.key}
                className={cx(
                  "min-w-0 rounded-md border px-2 py-1.5 transition-colors duration-300",
                  flash
                    ? "border-blue-400/60 bg-blue-400/10"
                    : "border-white/10 bg-white/[0.03]",
                )}
              >
                <p className="truncate text-[8.5px] font-semibold text-white/55">
                  {tray.name}
                </p>
                <div className="mt-1 flex h-3 items-center gap-0.5">
                  {filed.map(({ doc }) => (
                    <MiniDoc
                      key={doc.file}
                      format={doc.format}
                      style={live ? pop : undefined}
                    />
                  ))}
                  <span className="tabular ml-auto text-[10px] font-bold text-white">
                    {filed.length}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Last year's guide is recognised and kept out of the build. */}
        <div className="flex h-6 shrink-0 items-center gap-1.5 rounded-md border border-dashed border-white/15 px-2 text-[9px]">
          <span className="shrink-0 font-semibold text-white/45">Set aside</span>
          {prior >= 0 && t >= filedAt(prior) ? (
            <span
              className="ml-auto flex min-w-0 items-center gap-1 text-white/70"
              style={live ? pop : undefined}
            >
              <MiniDoc format="guide" />
              <span className="truncate">Last year&rsquo;s guide</span>
            </span>
          ) : prior < 0 && allFiled ? (
            <span className="ml-auto truncate text-white/40">No old guide</span>
          ) : null}
        </div>

        {/* What was pulled out of them */}
        <div
          className={cx(
            "mt-auto rounded-md px-2 py-1.5 ring-1 transition-colors duration-500",
            found > 0
              ? "bg-blue-400/[0.08] ring-blue-400/30"
              : "bg-white/[0.02] ring-white/10",
          )}
        >
          <p className="flex items-baseline gap-1 text-[9px] font-semibold text-white/55">
            <span
              className={cx(
                "tabular text-[14px] leading-none font-bold",
                found > 0 ? "text-white" : "text-white/30",
              )}
            >
              {found}
            </span>
            plan details found
          </p>
          <div className="mt-1 flex h-3.5 gap-1 overflow-hidden">
            {client.samples.map((sample, k) =>
              t >= SORT.details + 300 + k * 300 ? (
                <span
                  key={sample}
                  className="shrink-0 rounded bg-white/10 px-1 text-[8px] leading-[14px] font-semibold whitespace-nowrap text-white/80"
                  style={live ? rise() : undefined}
                >
                  {sample}
                </span>
              ) : null,
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* Choose: what this client gets. -------------------------------------------- */

const CHOOSE = { client: 100, start: 250, each: 230, brand: 1750, press: 2150 };
const tickedAt = (i: number) => CHOOSE.start + (i + 1) * CHOOSE.each;

function ChooseScene({ t, client }: SceneProps) {
  const ticked = outputs.tabs.filter((_, i) => t >= tickedAt(i)).length;
  const all = ticked === outputs.tabs.length;
  const pressing = t >= CHOOSE.press && t < CHOOSE.press + 240;
  const live = t < SETTLED;

  return (
    <>
      <SceneHead kind="choose" label="Create" status={`${ticked} selected`} />
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-9 shrink-0 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-2">
          {t >= CHOOSE.client ? (
            <div
              className="flex min-w-0 items-center gap-2"
              style={live ? rise() : undefined}
            >
              <span
                className="grid size-6 shrink-0 place-items-center rounded-[5px] text-[10px] font-black text-white"
                style={{ background: client.brand }}
              >
                {client.initial}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold text-white">
                  {client.name}
                </p>
                <p className="truncate text-[8.5px] text-white/45">
                  Plan year 2027 · {client.details} details
                </p>
              </div>
            </div>
          ) : (
            <span className="h-1.5 w-20 rounded-full bg-white/10" />
          )}
        </div>

        {/* Rows sized so all six outputs fit above the Build button. */}
        <ul className="mt-2 space-y-0.5">
          {outputs.tabs.map((tab, i) => {
            const on = t >= tickedAt(i);
            return (
              <li
                key={tab.key}
                className={cx(
                  "flex h-4 items-center gap-2 rounded-md px-1.5 text-[10px] font-semibold transition-colors duration-300",
                  on ? "bg-white/[0.06] text-white" : "text-white/50",
                )}
              >
                <span
                  className={cx(
                    "grid size-3.5 shrink-0 place-items-center rounded-[4px] border transition-colors duration-200",
                    on ? "border-blue-500 bg-blue-500 text-white" : "border-white/25",
                  )}
                >
                  {on ? (
                    <CheckIcon className="size-2.5" style={live ? pop : undefined} />
                  ) : null}
                </span>
                <TabIcon kind={tab.key} className="size-3.5 shrink-0 opacity-70" />
                <span className="truncate">{tab.name}</span>
              </li>
            );
          })}
        </ul>

        {/* The brand comes from the client's own website. */}
        <div className="mt-2 flex h-5 shrink-0 items-center text-[9px] text-white/55">
          {t >= CHOOSE.brand ? (
            <span
              className="flex min-w-0 items-center gap-1.5"
              style={live ? rise() : undefined}
            >
              <span className="flex shrink-0 -space-x-0.5">
                {[client.brand, client.accent, "#ffffff"].map((color) => (
                  <span
                    key={color}
                    className="size-2.5 rounded-full ring-1 ring-ink-900"
                    style={{ background: color }}
                  />
                ))}
              </span>
              <span className="truncate">Brand from {client.site}</span>
            </span>
          ) : null}
        </div>

        <span
          className={cx(
            "mt-auto flex h-7 shrink-0 items-center justify-center gap-1 rounded-md bg-blue-500 text-[10px] font-semibold text-white transition-[opacity,scale,filter] duration-150",
            !all && "opacity-40",
            pressing && "scale-95 brightness-90",
          )}
        >
          {ticked
            ? `Build ${ticked} output${ticked === 1 ? "" : "s"}`
            : "Build"}{" "}
          &rarr;
        </span>
      </div>
    </>
  );
}

/* Build: every output, in the client's brand. ------------------------------- */

const BUILD = { start: 200, each: 600, link: 4000 };
const builtAt = (i: number) => BUILD.start + (i + 1) * BUILD.each;

function BuildScene({ t, client }: SceneProps) {
  const progress = clamp01((t - BUILD.start) / (outputs.tabs.length * BUILD.each));
  const linked = t >= BUILD.link;
  const live = t < SETTLED;

  return (
    <>
      <SceneHead
        kind="build"
        label="Outputs"
        status={
          progress >= 1 ? "Ready" : t >= BUILD.start ? `${Math.round(progress * 100)}%` : ""
        }
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="h-1 shrink-0 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-[width] duration-100 ease-linear"
            style={{
              width: `${progress * 100}%`,
              background: "var(--grad-brand-bright)",
            }}
          />
        </div>

        {/* Three across, so all six outputs fit in two rows. */}
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {outputs.tabs.map((tab, i) => {
            const done = t >= builtAt(i);
            const active = !done && t >= BUILD.start + i * BUILD.each;
            return (
              <div key={tab.key} className="min-w-0">
                <div
                  className={cx(
                    "relative h-[58px] overflow-hidden rounded-md",
                    done
                      ? "shadow-[0_8px_20px_-10px_rgba(0,0,0,0.8)]"
                      : active
                        ? "border border-dashed border-blue-400/60 bg-blue-400/[0.06]"
                        : "border border-dashed border-white/15",
                  )}
                >
                  {done ? (
                    <div className="absolute inset-0" style={live ? pop : undefined}>
                      <OutputThumb kind={tab.key} client={client} />
                      <span className="absolute right-1 bottom-1 grid size-3.5 place-items-center rounded-full bg-green-500 text-white ring-2 ring-ink-900">
                        <CheckIcon className="size-2" />
                      </span>
                    </div>
                  ) : (
                    <div className="grid h-full place-items-center">
                      {active ? (
                        <Spinner />
                      ) : (
                        <TabIcon kind={tab.key} className="size-4 text-white/25" />
                      )}
                    </div>
                  )}
                </div>
                <p
                  className={cx(
                    "mt-1 truncate text-[9px] font-semibold transition-colors duration-300",
                    done ? "text-white/80" : "text-white/40",
                  )}
                >
                  {SHORT[tab.key]}
                </p>
              </div>
            );
          })}
        </div>

        <div
          className={cx(
            "mt-auto flex h-7 shrink-0 items-center rounded-md border px-2 transition-colors duration-500",
            linked
              ? "border-green-400/35 bg-green-400/[0.06]"
              : "border-white/10 bg-white/[0.02]",
          )}
        >
          {linked ? (
            <span
              className="flex min-w-0 flex-1 items-center gap-1.5"
              style={live ? rise() : undefined}
            >
              <LinkIcon className="size-3 shrink-0 text-green-400" />
              <span className="truncate font-mono text-[9px] text-white/80">
                {client.link}
              </span>
              <span className="ml-auto shrink-0 rounded-full bg-green-400/15 px-1.5 text-[8px] leading-[14px] font-bold text-green-400">
                Live
              </span>
            </span>
          ) : (
            <span className="text-[9px] text-white/30">Not published yet</span>
          )}
        </div>
      </div>
    </>
  );
}

/** Each output, small, in the client's brand. Also ends the home page's flow. */
export function OutputThumb({
  kind,
  client,
}: {
  kind: OutputKey;
  client: Pick<Client, "brand" | "accent">;
}) {
  const { brand, accent } = client;

  if (kind === "guide") {
    return (
      <div className="relative h-full" style={{ background: brand }}>
        <svg
          viewBox="0 0 80 58"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <circle cx="62" cy="24" r="7" fill={accent} opacity="0.9" />
          <path d="M0 44 22 30l14 9 16-13 28 20v12H0z" fill="#fff" opacity="0.14" />
          <path d="M0 52 26 42l18 6 16-8 20 10v8H0z" fill="#08192b" opacity="0.3" />
        </svg>
        <div className="relative px-2 pt-1.5">
          <span className="block size-2 rounded-[2px] bg-white" />
          <p
            className="mt-1.5 text-[5px] font-bold tracking-[0.16em]"
            style={{ color: accent }}
          >
            2027
          </p>
          <p className="text-[7.5px] leading-[1.05] font-bold text-white">
            Benefits
            <br />
            Guide
          </p>
        </div>
      </div>
    );
  }

  if (kind === "flipbook") {
    return (
      <div className="grid h-full place-items-center bg-white/[0.08]">
        <div className="relative flex h-[38px] w-[58px] shadow-md" style={{ perspective: 120 }}>
          <div className="flex-1 space-y-[3px] rounded-l-[2px] bg-white px-1 pt-1.5">
            <span className="block h-[3px] w-4 rounded-full" style={{ background: brand }} />
            <span className="block h-[2px] rounded-full bg-ink/20" />
            <span className="block h-[2px] w-3/4 rounded-full bg-ink/15" />
            <span className="block h-[2px] w-5/6 rounded-full bg-ink/15" />
          </div>
          <div className="flex-1 rounded-r-[2px] bg-white" />
          {/* The cover, partway through turning. */}
          <div
            className="absolute inset-y-0 right-0 w-1/2 origin-left rounded-r-[2px] px-1 pt-1.5"
            style={{ background: brand, transform: "rotateY(-62deg)" }}
          >
            <span className="block h-[3px] w-3 rounded-full" style={{ background: accent }} />
            <span className="mt-[2px] block h-[3px] w-4 rounded-full bg-white/85" />
          </div>
        </div>
      </div>
    );
  }

  if (kind === "website") {
    return (
      <div className="flex h-full flex-col bg-white">
        <div className="px-1.5 pt-1 pb-1.5" style={{ background: brand }}>
          <div className="flex items-center">
            <span className="size-1.5 rounded-[1px] bg-white" />
            <span
              className="ml-auto h-1.5 w-3 rounded-full"
              style={{ background: accent }}
            />
          </div>
          <span className="mt-1 block h-[3px] w-8 rounded-full bg-white/85" />
          <span className="mt-[2px] block h-[3px] w-5 rounded-full bg-white/55" />
        </div>
        <div className="grid flex-1 grid-cols-3 gap-1 p-1.5">
          {[0, 1, 2].map((k) => (
            <div key={k} className="rounded-[2px] border border-line p-[3px]">
              <span
                className="block h-[2px] w-2.5 rounded-full"
                style={{ background: brand }}
              />
              <span className="mt-1 block h-[2px] rounded-full bg-ink/15" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === "video") {
    return (
      <div className="relative h-full" style={{ background: brand }}>
        <span className="absolute top-[44%] left-1/2 grid size-4 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white">
          <svg viewBox="0 0 8 8" className="ml-px size-2" aria-hidden>
            <path d="M2 1.2v5.6L6.6 4z" fill={brand} />
          </svg>
        </span>
        <span className="absolute inset-x-1.5 bottom-1.5 h-[2px] overflow-hidden rounded-full bg-white/30">
          <span className="block h-full w-2/5 rounded-full" style={{ background: accent }} />
        </span>
      </div>
    );
  }

  if (kind === "flyer") {
    return (
      <div className="grid h-full place-items-center bg-white/[0.08]">
        <div className="flex h-[48px] w-[37px] -rotate-3 flex-col overflow-hidden rounded-[2px] bg-white shadow-md">
          <div className="px-1 pt-1 pb-1.5" style={{ background: brand }}>
            <span className="block h-[3px] w-5 rounded-full bg-white/85" />
            <span
              className="mt-[2px] block h-[3px] w-3 rounded-full"
              style={{ background: accent }}
            />
          </div>
          <div className="flex-1 space-y-[2px] px-1 pt-1">
            <span className="block h-[2px] rounded-full bg-ink/20" />
            <span className="block h-[2px] w-3/4 rounded-full bg-ink/15" />
          </div>
          {/* The QR code that opens the site. */}
          <span className="mr-1 mb-1 ml-auto grid size-2.5 grid-cols-2 gap-px">
            <span className="bg-ink" />
            <span className="bg-ink/40" />
            <span className="bg-ink/40" />
            <span className="bg-ink" />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-center gap-1 bg-paper px-1.5">
      <span
        className="h-2.5 w-3/5 self-end rounded-md rounded-br-[2px]"
        style={{ background: brand }}
      />
      <div className="w-4/5 space-y-[3px] self-start rounded-md rounded-bl-[2px] bg-white px-1 py-1 shadow-sm">
        <span className="block h-[2px] rounded-full bg-ink/25" />
        <span className="block h-[2px] w-2/3 rounded-full bg-ink/15" />
      </div>
      <span
        className="h-2.5 w-2/5 self-end rounded-md rounded-br-[2px] opacity-85"
        style={{ background: brand }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Small parts                                                                 */
/* -------------------------------------------------------------------------- */

function FormatBadge({ format }: { format: Format }) {
  const sheet = format === "xls";
  return (
    <span
      className={cx(
        "grid h-4 w-3.5 shrink-0 place-items-end rounded-[2px] pb-px text-[5px] font-bold text-white",
        sheet ? "bg-green-700" : "bg-red-600/85",
      )}
    >
      {sheet ? "XLS" : "PDF"}
    </span>
  );
}

function MiniDoc({ format, style }: { format: Format; style?: CSSProperties }) {
  return (
    <span
      className={cx(
        "block h-3 w-2.5 shrink-0 rounded-[1.5px]",
        format === "xls" && "bg-green-500/80",
        format === "scan" && "bg-[#e7e3d8]",
        format === "pdf" && "bg-white/85",
      )}
      style={{ ...(format === "guide" ? { background: OLD_GUIDE } : null), ...style }}
    />
  );
}

function Spinner() {
  return (
    <span className="inline-block size-3.5 shrink-0 animate-spin rounded-full border-[1.5px] border-blue-400/25 border-t-blue-400" />
  );
}

function StageIcon({ kind, className }: { kind: StageKey; className?: string }) {
  const paths: Record<StageKey, ReactNode> = {
    book: (
      <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2.8l1.4 1.5h4.8A1.5 1.5 0 0 1 14 6v5.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11.5z" />
    ),
    upload: (
      <>
        <path d="M8 10.5V3m0 0L5.3 5.7M8 3l2.7 2.7" />
        <path d="M3 9.5V12a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 13 12V9.5" />
      </>
    ),
    sort: <path d="M8 2c.4 3 2 4.6 5 5-3 .4-4.6 2-5 5-.4-3-2-4.6-5-5 3-.4 4.6-2 5-5Z" />,
    choose: (
      <>
        <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1" />
        <rect x="9" y="2.5" width="4.5" height="4.5" rx="1" />
        <rect x="2.5" y="9" width="4.5" height="4.5" rx="1" />
        <path d="m9.4 11.3 1.4 1.4 2.5-2.7" />
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

function FolderIcon({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <path
        d="M1.5 4A1.5 1.5 0 0 1 3 2.5h3L7.5 4H13a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 13 13H3a1.5 1.5 0 0 1-1.5-1.5z"
        fill="currentColor"
        opacity={open ? 0.4 : 0.9}
      />
      {open ? <path d="M3.4 6.5h11.4L13.2 13H1.6z" fill="currentColor" /> : null}
    </svg>
  );
}

function Chevron({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 8 8"
      className={cx(className, "transition-transform duration-300", open && "rotate-90")}
      aria-hidden
    >
      <path
        d="M2.5 1.5 5.5 4l-3 2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
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

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="m6.5 9.5 3-3M7 4.5l1-1a2.5 2.5 0 0 1 3.5 3.5l-1 1M9 11.5l-1 1a2.5 2.5 0 0 1-3.5-3.5l1-1" />
    </svg>
  );
}

function CheckIcon({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} style={style} aria-hidden>
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
