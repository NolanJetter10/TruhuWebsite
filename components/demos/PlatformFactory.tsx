"use client";

import { Sparkle } from "@phosphor-icons/react";
import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import { cx } from "@/components/ui/primitives";
import { TECH_PAGE } from "@/lib/content";
import { useInView, useReducedMotion } from "./hooks";

/**
 * Why a platform, told as a factory: three chapters, one per slide of the deck
 * the analogy comes from. The factory with a line running through it; one
 * stage opened up; and a second line assembled from the first one's stages,
 * with only one stage built new.
 *
 * Copy in one column, the diagram in the other, every chapter stacked in the
 * same grid cell, so the section holds its size as the chapters turn. They
 * turn on a dwell timer drawn into the active tab, the carousel's pattern: the
 * timer is the fill animation, so it pauses exactly where the eye left it. It
 * pauses while the reader is over the copy or the tabs, and stops for good
 * once a chapter is picked.
 *
 * Each diagram plays its own loop only while it is showing and on screen. The
 * server renders every diagram finished, which is also what reduced motion
 * shows and what a diagram returns to when it is put away.
 */

const { factory } = TECH_PAGE;
const CHAPTERS = factory.chapters;
type ChapterKey = (typeof CHAPTERS)[number]["key"];

/** How long a chapter holds before the next takes over. */
const DWELL = 14000;
const REDUCED = "(prefers-reduced-motion: reduce)";

const pop: CSSProperties = {
  animation: "demo-pop 380ms var(--ease-out-back) both",
};

/**
 * Steps through `durations` on a loop while `live`, counting the laps. The
 * diagrams remount when they go live, so every run starts on the first beat.
 */
function useBeats(durations: readonly number[], live: boolean) {
  const [clock, setClock] = useState({ beat: 0, lap: 0 });

  useEffect(() => {
    if (!live) return;
    const id = window.setTimeout(
      () =>
        setClock(({ beat, lap }) =>
          beat + 1 < durations.length
            ? { beat: beat + 1, lap }
            : { beat: 0, lap: lap + 1 },
        ),
      durations[clock.beat],
    );
    return () => window.clearTimeout(id);
  }, [clock, live, durations]);

  return clock;
}

/* -------------------------------------------------------------------------- */
/* The chapters                                                                */
/* -------------------------------------------------------------------------- */

export function PlatformFactory() {
  const [ref, inView] = useInView<HTMLDivElement>(0.35);
  const reduced = useReducedMotion();
  const [chapter, setChapter] = useState(0);
  const [picked, setPicked] = useState(false);
  const [reading, setReading] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const auto = !picked && !reduced;
  const last = CHAPTERS.length - 1;

  const pick = (i: number) => {
    setPicked(true);
    setChapter(i);
  };

  /* Checked at call time as well: the global reduced-motion rule collapses the
     fill to 0.001ms, so it can end before the preference has been read. */
  const advance = () => {
    if (window.matchMedia(REDUCED).matches) return;
    setChapter((current) => (current === last ? 0 : current + 1));
  };

  const onTabKey = (event: KeyboardEvent) => {
    const next =
      event.key === "ArrowRight"
        ? chapter === last ? 0 : chapter + 1
        : event.key === "ArrowLeft"
          ? chapter === 0 ? last : chapter - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : -1;
    if (next < 0) return;
    event.preventDefault();
    pick(next);
    tabs.current[next]?.focus();
  };

  // A reader over the copy, or the tabs, is reading: the chapter holds.
  const hold = {
    onMouseEnter: () => setReading(true),
    onMouseLeave: () => setReading(false),
    onFocusCapture: () => setReading(true),
    onBlurCapture: () => setReading(false),
  };

  return (
    <div ref={ref}>
      <div
        role="tablist"
        aria-label="The platform as a factory"
        onKeyDown={onTabKey}
        className="grid grid-cols-3 gap-4 sm:gap-6"
        {...hold}
      >
        {CHAPTERS.map((item, i) => {
          const active = i === chapter;
          return (
            <button
              key={item.key}
              ref={(node) => {
                tabs.current[i] = node;
              }}
              type="button"
              role="tab"
              id={`factory-tab-${item.key}`}
              aria-selected={active}
              aria-controls={`factory-panel-${item.key}`}
              tabIndex={active ? 0 : -1}
              onClick={() => pick(i)}
              className="group cursor-pointer text-left"
            >
              <span className="block h-[3px] overflow-hidden rounded-full bg-line transition-colors group-hover:bg-slate-400/40">
                <span
                  className={cx(
                    "block h-full w-full origin-left rounded-full bg-blue-500",
                    i < chapter && "scale-x-100",
                    i > chapter && "scale-x-0",
                  )}
                  onAnimationEnd={active ? advance : undefined}
                  style={
                    active && auto
                      ? {
                          animation: `dot-fill ${DWELL}ms linear both`,
                          animationPlayState:
                            reading || !inView ? "paused" : "running",
                        }
                      : undefined
                  }
                />
              </span>
              <span className="mt-3 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2.5">
                <span
                  className={cx(
                    "tabular text-[12px] font-bold transition-colors duration-300",
                    active ? "text-blue-700" : "text-slate-400",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={cx(
                    "font-display text-[0.9375rem] leading-tight font-bold transition-colors duration-300 sm:text-[1.0625rem]",
                    active ? "text-ink" : "text-slate-400 group-hover:text-slate-600",
                  )}
                >
                  {item.tab}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-7 grid items-center gap-8 lg:mt-9 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        {/* The copy. */}
        <div className="grid" {...hold}>
          {CHAPTERS.map((item, i) => {
            const active = i === chapter;
            return (
              <div
                key={item.key}
                role="tabpanel"
                id={`factory-panel-${item.key}`}
                aria-labelledby={`factory-tab-${item.key}`}
                tabIndex={active ? 0 : -1}
                className={cx(
                  "col-start-1 row-start-1 transition-[opacity,visibility,translate] duration-500",
                  active ? "opacity-100" : "invisible translate-y-1.5 opacity-0",
                )}
                style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
              >
                <h3 className="t-h3">{item.title}</h3>
                <p className="mt-3 text-[1rem] leading-relaxed text-slate-600">
                  {item.body}
                </p>
                <ul className="mt-5 space-y-2.5 border-t border-line pt-5">
                  {item.points.map((point, k) => (
                    <li
                      key={point.name}
                      className="flex gap-3 text-[0.9375rem] leading-snug text-slate-600"
                    >
                      <span
                        aria-hidden
                        className={cx("mt-[4px] shrink-0", MARKS[item.key][k])}
                      />
                      <span>
                        <span className="font-semibold text-ink">{point.name}.</span>{" "}
                        {point.body}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* The diagrams, drawn above the copy on a phone. The top padding is
            room for the frame's label, which sits on its border. */}
        <div aria-hidden className="@container order-first grid pt-3 lg:order-none">
          {CHAPTERS.map((item, i) => {
            const showing = i === chapter;
            const live = showing && inView && !reduced;
            return (
              <div
                key={item.key}
                className={cx(
                  "col-start-1 row-start-1 transition-[opacity,visibility,translate] duration-500",
                  showing ? "opacity-100" : "invisible translate-y-1.5 opacity-0",
                )}
                style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
              >
                <Diagram key={live ? "live" : "still"} kind={item.key} live={live} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Each point's marker, drawn from the part of the diagram it describes. */
const MARKS: Record<ChapterKey, readonly string[]> = {
  factory: [
    "size-3 rounded-[3px] border-2 border-ink-900",
    "size-3 rounded-[3px] bg-ink-900",
    "size-3 rounded-full border-2 border-green-500",
  ],
  stage: Array(4).fill("mx-[3px] mt-[7px] size-1.5 rounded-full bg-ink-900"),
  lines: [
    "size-3 rounded-[3px] bg-blue-500",
    "size-3 rounded-full border-2 border-green-500",
    "size-3 rounded-[3px] border-2 border-dashed border-green-500",
  ],
};

function Diagram({ kind, live }: { kind: ChapterKey; live: boolean }) {
  if (kind === "factory") return <FactoryScene live={live} />;
  if (kind === "stage") return <StageScene live={live} />;
  return <LinesScene live={live} />;
}

/* -------------------------------------------------------------------------- */
/* The factory: one line, packets riding the conveyor through it.              */
/* -------------------------------------------------------------------------- */

/** Raw material in, the four stages, the finished product out. */
const SLOTS = ["raw", 1, 2, 3, 4, "done"] as const;
const LAST_SLOT = SLOTS.length - 1;
/** The workers work, then the conveyor moves every packet on one stage. */
const FACTORY_BEATS = [950, 650] as const;

/**
 * Every station is busy at once, as on a real line. A packet's fill is the
 * stages that have worked on it. The belt runs down the side of a narrow
 * diagram and under the stages of a wide one; either way a packet's place on
 * it is the centre of its station's slot, as a share of the belt's length.
 */
function FactoryScene({ live }: { live: boolean }) {
  const { beat, lap } = useBeats(FACTORY_BEATS, live);
  const working = live && beat === 0;
  const moving = live && beat === 1;
  const tick = lap + (moving ? 1 : 0);

  return (
    <Frame
      label="The factory = the platform"
      aside={
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
          <span className="size-3 rounded-full border-2 border-green-500 bg-white" />
          = LLM worker
        </span>
      }
      caption={CHAPTERS[0].caption}
    >
      <div className="flex gap-3 @md:flex-col-reverse @md:gap-2.5">
        {/* The conveyor. One slot past the end is a packet leaving, fading
            out over the finished product. */}
        <div className="relative w-2.5 shrink-0 @md:h-2.5 @md:w-full">
          <span
            className={cx("belt absolute inset-0 rounded-full", moving && "belt-moving")}
          />
          {Array.from({ length: SLOTS.length + 1 }, (_, s) => (
            <span
              key={tick - s}
              className={cx(
                "absolute top-[var(--at)] left-1/2 size-[18px] -translate-x-1/2 -translate-y-1/2 transition-[left,top,opacity,scale] duration-500 @md:top-1/2 @md:left-[var(--at)]",
                s > LAST_SLOT && "scale-50 opacity-0",
              )}
              style={
                {
                  "--at": `${((Math.min(s, LAST_SLOT) + 0.5) / SLOTS.length) * 100}%`,
                  transitionTimingFunction: "var(--ease-in-out-soft)",
                } as CSSProperties
              }
            >
              <Packet
                fill={s === 0 ? 0 : Math.min(4, moving ? s - 1 : s)}
                done={s >= LAST_SLOT}
                style={live && s === 0 ? pop : undefined}
              />
            </span>
          ))}
        </div>

        <ol className="flex min-w-0 flex-1 flex-col @md:flex-row">
          {SLOTS.map((slot, s) => (
            <li
              key={slot}
              className="relative flex h-12 items-center gap-2.5 @md:h-auto @md:flex-1 @md:flex-col-reverse @md:gap-2 @md:px-2"
            >
              <Station
                slot={slot}
                active={working}
                landed={!live || working}
                tick={tick}
              />
              {typeof slot === "number" ? (
                <Worker working={working} />
              ) : (
                <span className="size-9 shrink-0" />
              )}
              {s < LAST_SLOT ? (
                <Chevron className="absolute right-0 bottom-6 hidden size-2.5 translate-x-1/2 translate-y-1/2 text-slate-400 @md:block" />
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </Frame>
  );
}

function Station({
  slot,
  active,
  landed,
  tick,
}: {
  slot: (typeof SLOTS)[number];
  active: boolean;
  landed: boolean;
  tick: number;
}) {
  const box =
    "relative flex h-10 min-w-0 flex-1 flex-col items-center justify-center rounded-lg px-1.5 text-center transition-[background-color,box-shadow] duration-300 @md:h-12 @md:w-full @md:flex-none";
  const title = "text-[10.5px] leading-[1.15] font-bold text-ink";
  const sub = "block text-[9px] leading-tight text-slate-400 @md:hidden @xl:block";

  if (slot === "raw") {
    return (
      <span className={cx(box, "border border-ink/25 bg-white")}>
        <span className={title}>Raw material</span>
        <span className={sub}>packet in</span>
      </span>
    );
  }

  if (slot === "done") {
    return (
      <span
        className={cx(
          box,
          "border-2 border-green-500",
          landed ? "bg-green-100" : "bg-white",
        )}
      >
        <span className={title}>Finished product</span>
        <span className={sub}>result out</span>
        {landed ? (
          <CheckBadge
            key={tick}
            className="absolute -top-1.5 -right-1.5"
            style={active ? pop : undefined}
          />
        ) : null}
      </span>
    );
  }

  return (
    <span
      className={cx(
        box,
        "bg-ink-900",
        active &&
          "shadow-[0_0_0_2px_var(--color-paper),0_0_0_4px_var(--color-green-500)]",
      )}
    >
      <span className="text-[10.5px] font-bold tracking-[0.06em] whitespace-nowrap text-white uppercase">
        Stage {slot}
      </span>
    </span>
  );
}

function Worker({ working }: { working: boolean }) {
  return (
    <span
      className={cx(
        "relative grid size-9 shrink-0 place-items-center rounded-full border-2 bg-white transition-[border-color,box-shadow] duration-300",
        working
          ? "border-green-500 shadow-[0_0_0_4px_rgb(56_176_0_/_0.15)]"
          : "border-green-500/50",
      )}
    >
      {working ? (
        <span className="absolute -inset-[2px] animate-spin rounded-full border-2 border-transparent border-t-green-700" />
      ) : null}
      <Sparkle
        weight="fill"
        className={cx(
          "size-3.5 transition-colors duration-300",
          working ? "text-green-700" : "text-green-500/60",
        )}
      />
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* One stage, opened up: inputs in, the worker and its tools, work out.        */
/* -------------------------------------------------------------------------- */

/** Arrive, feed the worker, think with tools, apply, packet out, hand off. */
const STAGE_BEATS = [900, 900, 2300, 800, 1700, 700] as const;
/** What a still diagram shows: the work applied and the packet out. */
const STAGE_STILL = 4;

/** Where each input's line leaves its box, and where it meets the worker. */
const FEEDS = [
  { x0: 25, x1: 45 },
  { x0: 75, x1: 55 },
] as const;

function StageScene({ live }: { live: boolean }) {
  const { beat } = useBeats(STAGE_BEATS, live);
  const b = live ? beat : STAGE_STILL;
  const arriving = live && b === 0;
  const feeding = live && b === 1;
  const thinking = live && b === 2;
  const applying = live && b === 3;
  const handing = b === 5;
  const lit = b >= 1 && b <= 4;
  const applied = b === 3 || b === 4;
  const out = b >= 4;

  return (
    <Frame label="Inside one stage">
      <div className="mx-auto w-full max-w-[440px]">
        {/* What the stage is handed. */}
        <div className="grid grid-cols-2 gap-3">
          <InBox label="Processed packet" empty={handing}>
            <span
              className="block size-5"
              style={
                arriving
                  ? ({
                      "--slide-x": "-36px",
                      animation: "card-slide 700ms var(--ease-out-expo) both",
                    } as CSSProperties)
                  : undefined
              }
            >
              <Packet fill={2} dim={live && b >= 1 && b <= 3} />
            </span>
          </InBox>
          <InBox label="Job-specific context" empty={handing}>
            <span className="flex w-10 flex-col gap-[3px]">
              {["w-full", "w-4/5", "w-11/12"].map((width, k) => (
                <span
                  key={width}
                  className={cx("block h-[3px] rounded-full bg-blue-500/50", width)}
                  style={
                    arriving
                      ? {
                          animation: "demo-rise 420ms var(--ease-out-expo) both",
                          animationDelay: `${200 + k * 120}ms`,
                        }
                      : undefined
                  }
                />
              ))}
            </span>
          </InBox>
        </div>

        {/* Both inputs, into the worker. */}
        <div className="relative h-8">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 size-full overflow-visible"
          >
            {FEEDS.map(({ x0, x1 }) => (
              <line
                key={x0}
                x1={x0}
                y1="4"
                x2={x1}
                y2="96"
                strokeWidth="2"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className={cx(
                  "transition-colors duration-300",
                  feeding ? "stroke-blue-500" : "stroke-slate-400/50",
                )}
              />
            ))}
          </svg>
          {feeding
            ? FEEDS.map(({ x0, x1 }) => (
                <span
                  key={x0}
                  className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 shadow-[0_0_0_3px_rgb(5_130_220_/_0.2)]"
                  style={
                    {
                      "--x0": `${x0}%`,
                      "--x1": `${x1}%`,
                      animation: "feed-in 800ms var(--ease-in-out-soft) both",
                    } as CSSProperties
                  }
                />
              ))
            : null}
        </div>

        {/* The worker, and the tools it calls. */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center">
          <span />
          <span
            className={cx(
              "relative grid size-14 place-items-center rounded-full border-[3px] bg-white transition-[border-color,box-shadow] duration-300 @md:size-16",
              lit
                ? "border-green-500 shadow-[0_0_0_6px_rgb(56_176_0_/_0.12)]"
                : "border-green-500/45",
            )}
          >
            {thinking ? (
              <span className="absolute -inset-[3px] animate-spin rounded-full border-[3px] border-transparent border-t-green-700" />
            ) : null}
            <span className="text-[13px] font-bold text-ink">LLM</span>
          </span>
          <span className="flex min-w-0 items-center">
            <span
              className={cx(
                "relative mx-1.5 h-0.5 min-w-5 flex-1 rounded-full transition-colors duration-300",
                thinking ? "bg-blue-500/60" : "bg-slate-400/50",
              )}
            >
              <Chevron className="absolute top-1/2 -left-1 size-2 -translate-y-1/2 rotate-180 text-slate-400" />
              <Chevron className="absolute top-1/2 -right-1 size-2 -translate-y-1/2 text-slate-400" />
              {thinking ? (
                <span
                  className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500"
                  style={{
                    animation: "tool-call 1000ms var(--ease-in-out-soft) 200ms 2 both",
                  }}
                />
              ) : null}
            </span>
            <span
              className={cx(
                "shrink-0 rounded-lg bg-ink-900 px-2.5 py-2 text-center transition-shadow duration-300",
                thinking &&
                  "shadow-[0_0_0_2px_var(--color-paper),0_0_0_4px_var(--color-blue-500)]",
              )}
            >
              <span className="block text-[10.5px] font-bold tracking-[0.1em] text-white uppercase">
                Tools
              </span>
              <span className="block text-[9px] leading-tight whitespace-nowrap text-white/60">
                scoped to the job
              </span>
            </span>
          </span>
        </div>

        {/* Work applied, down to the packet out. */}
        <div className="relative h-9">
          <span
            className={cx(
              "absolute top-1.5 bottom-2 left-1/2 w-0.5 -translate-x-1/2 rounded-full transition-colors duration-300",
              applied ? "bg-green-500" : "bg-slate-400/50",
            )}
          />
          <Chevron
            className={cx(
              "absolute bottom-0.5 left-1/2 size-2.5 -translate-x-1/2 rotate-90 transition-colors duration-300",
              applied ? "text-green-500" : "text-slate-400",
            )}
          />
          {applying ? (
            <span
              className="absolute left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500 shadow-[0_0_0_3px_rgb(56_176_0_/_0.2)]"
              style={{ animation: "pipe-drop 700ms var(--ease-in-out-soft) both" }}
            />
          ) : null}
          <span
            className={cx(
              "absolute top-1/2 left-[calc(50%+12px)] -translate-y-1/2 text-[10.5px] font-bold whitespace-nowrap transition-colors duration-300",
              applied ? "text-green-700" : "text-slate-400",
            )}
          >
            work applied
          </span>
        </div>

        <div className="flex justify-center">
          <span
            className={cx(
              "relative flex h-12 w-40 items-center justify-center gap-2.5 rounded-lg border-2 bg-white transition-colors duration-300",
              out && !handing ? "border-green-500" : "border-green-500/40",
            )}
          >
            <span className="text-[11px] font-bold text-ink">Packet out</span>
            <span
              className={cx(
                "block size-5 transition-[opacity,translate] duration-500",
                out && !handing ? "opacity-100" : "opacity-0",
                handing && "translate-x-10",
              )}
            >
              {out ? <Packet fill={3} style={live && b === 4 ? pop : undefined} /> : null}
            </span>
            {b === STAGE_STILL ? (
              <CheckBadge
                className="absolute -top-1.5 -right-1.5"
                style={live ? pop : undefined}
              />
            ) : null}
          </span>
        </div>
      </div>
    </Frame>
  );
}

function InBox({
  label,
  empty,
  children,
}: {
  label: string;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <span className="flex h-[58px] flex-col items-center justify-center gap-1.5 rounded-lg border border-ink/20 bg-white px-2 text-center">
      <span className="text-[10.5px] leading-tight font-bold text-ink">{label}</span>
      <span
        className={cx(
          "flex h-5 items-center transition-opacity duration-500",
          empty && "opacity-0",
        )}
      >
        {children}
      </span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* The same factory, a second line: stages reused and reordered, one new.      */
/* -------------------------------------------------------------------------- */

type Tag = "blue" | "red" | "green" | "amber" | "violet";

/** The tags only have to tell five stages apart; they are not brand colours. */
const TAG: Record<Tag, string> = {
  blue: "#0582dc",
  red: "#e5484d",
  green: "#38b000",
  amber: "#f5a524",
  violet: "#8e4ec6",
};

const LINE_A: readonly Tag[] = ["blue", "red", "green", "amber"];
/** Three of line A's stages, reordered, and one built new. */
const LINE_B: readonly Tag[] = ["blue", "green", "red", "violet"];
const NEW_STAGE = 3;

/** Idle, three stages copied across, the new one built, done, cleared. */
const LINES_BEATS = [1100, 700, 700, 700, 1500, 2800, 600] as const;
const LINES_BUILD = 4;
/** What a still diagram shows: line B built. */
const LINES_STILL = 5;
const LINES_CLEAR = 6;

/**
 * Each reused stage is copied out of line A into its slot on line B, so it
 * visibly comes from the first line and the original stays where it was. The
 * copy is measured from both boxes, so it flies the right way whether the
 * lines run across the diagram or down it.
 */
function LinesScene({ live }: { live: boolean }) {
  const { beat } = useBeats(LINES_BEATS, live);
  const b = live ? beat : LINES_STILL;
  const sources = useRef<(HTMLSpanElement | null)[]>([]);
  const clearing = b === LINES_CLEAR;
  const copying = live && b >= 1 && b <= NEW_STAGE ? LINE_A.indexOf(LINE_B[b - 1]) : -1;

  return (
    <Frame label="Same factory, same platform" caption={CHAPTERS[2].caption}>
      <div className="flex flex-wrap gap-3 @md:flex-col @md:flex-nowrap @md:gap-2.5">
        <Line name="Line A" className="order-1">
          {LINE_A.map((tag, i) => (
            <Fragment key={tag}>
              <Block
                ref={(node) => {
                  sources.current[i] = node;
                }}
                tag={tag}
                ring={i === copying}
                className="@md:flex-1"
              />
              <Arrow />
            </Fragment>
          ))}
          <Product name="Product A" done="ink" />
        </Line>

        <p className="order-3 basis-full text-center text-[10px] font-bold tracking-[0.1em] text-green-700 uppercase @md:order-2">
          Same stages: new order, new workers, one new stage
        </p>

        <Line name="Line B" className="order-2 @md:order-3">
          {LINE_B.map((tag, j) => {
            const filled = j === NEW_STAGE ? b >= LINES_BUILD : b > j;
            return (
              <Fragment key={tag}>
                {/* An empty slot is a dashed outline, dropped once a stage
                    fills it so no edge of it shows around the stage. */}
                <span
                  className={cx(
                    "relative h-9 shrink-0 rounded-lg border border-dashed transition-colors duration-500 @md:h-11 @md:flex-1",
                    filled && !clearing ? "border-transparent" : "border-ink/20",
                  )}
                >
                  {!filled ? null : j === NEW_STAGE ? (
                    <NewBlock tag={tag} live={live} fading={clearing} />
                  ) : live ? (
                    <CopiedBlock
                      tag={tag}
                      source={sources}
                      at={LINE_A.indexOf(tag)}
                      fading={clearing}
                    />
                  ) : (
                    <Block tag={tag} className="absolute -inset-px" />
                  )}
                </span>
                <Arrow />
              </Fragment>
            );
          })}
          <Product
            name="Product B"
            done={b === LINES_STILL ? "green" : undefined}
            live={live}
          />
        </Line>
      </div>
    </Frame>
  );
}

function Line({
  name,
  className,
  children,
}: {
  name: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "flex min-w-0 flex-1 flex-col gap-1.5 @md:flex-none @md:flex-row @md:items-center @md:gap-0",
        className,
      )}
    >
      <p className="mb-0.5 text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase @md:mb-0 @md:w-12 @md:shrink-0">
        {name}
      </p>
      {children}
    </div>
  );
}

function Block({
  tag,
  ring,
  staffed,
  fading,
  className,
  ref,
}: {
  tag: Tag;
  ring?: boolean;
  /** The worker lands a beat after the stage does. */
  staffed?: boolean;
  fading?: boolean;
  className?: string;
  ref?: Ref<HTMLSpanElement>;
}) {
  return (
    <span
      ref={ref}
      className={cx(
        "relative flex h-9 min-w-0 items-center justify-center rounded-lg bg-ink-900 px-2 transition-[opacity,box-shadow] duration-500 @md:h-11",
        ring && "shadow-[0_0_0_2px_var(--color-paper),0_0_0_4px_var(--color-blue-500)]",
        fading && "opacity-0",
        className,
      )}
    >
      <span
        className="absolute -top-1 -left-1 size-2.5 rounded-[3px] ring-2 ring-paper"
        style={{ background: TAG[tag] }}
      />
      <span className="truncate text-[10.5px] font-bold tracking-[0.08em] text-white uppercase">
        {tag}
      </span>
      <span
        className="absolute -top-1 -right-1 size-2.5 rounded-full border-2 border-green-500 bg-white"
        style={staffed ? { ...pop, animationDelay: "560ms" } : undefined}
      />
    </span>
  );
}

/** A stage copied out of line A: it starts over its original and flies home. */
function CopiedBlock({
  tag,
  source,
  at,
  fading,
}: {
  tag: Tag;
  source: RefObject<(HTMLSpanElement | null)[]>;
  at: number;
  fading: boolean;
}) {
  const self = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const from = source.current[at];
    const node = self.current;
    if (!from || !node) return;
    const a = from.getBoundingClientRect();
    const b = node.getBoundingClientRect();
    node.animate(
      [
        {
          transform: `translate(${a.left - b.left}px, ${a.top - b.top}px)`,
          boxShadow: "0 16px 30px -12px rgb(10 24 38 / 0.45)",
        },
        { transform: "none", boxShadow: "0 0 0 0 rgb(10 24 38 / 0)" },
      ],
      { duration: 650, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
  }, [source, at]);

  return (
    <Block
      ref={self}
      tag={tag}
      staffed
      fading={fading}
      className="absolute -inset-px z-10"
    />
  );
}

/** The one stage line B needed that line A didn't have: built in place. */
function NewBlock({
  tag,
  live,
  fading,
}: {
  tag: Tag;
  live: boolean;
  fading: boolean;
}) {
  return (
    <span
      className={cx(
        "absolute -inset-px flex items-center justify-center rounded-lg border-2 border-dashed border-green-500 bg-white px-2 transition-opacity duration-500",
        fading && "opacity-0",
      )}
      style={live ? { animation: "demo-fade 300ms ease-out both" } : undefined}
    >
      <span
        className="absolute inset-[3px] origin-left rounded-[5px] bg-green-100"
        style={
          live
            ? { animation: "dot-fill 1000ms var(--ease-in-out-soft) 200ms both" }
            : undefined
        }
      />
      <span
        className="absolute -top-1 -left-1 size-2.5 rounded-[3px] ring-2 ring-paper"
        style={{ background: TAG[tag] }}
      />
      <span className="relative truncate text-[10.5px] font-bold tracking-[0.08em] text-ink uppercase">
        {tag}
      </span>
      <span
        className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded bg-green-500 px-1 text-[8px] leading-[13px] font-bold tracking-wide text-white uppercase @md:top-auto @md:right-auto @md:-bottom-2 @md:left-1/2 @md:-translate-x-1/2 @md:translate-y-0"
        style={live ? { ...pop, animationDelay: "1150ms" } : undefined}
      >
        New
      </span>
    </span>
  );
}

function Product({
  name,
  done,
  live,
}: {
  name: string;
  done?: "ink" | "green";
  live?: boolean;
}) {
  return (
    <span
      className={cx(
        "relative flex h-9 shrink-0 items-center justify-center rounded-lg border-2 bg-white px-2 transition-colors duration-500 @md:h-11 @md:flex-[1.3]",
        done === "ink" && "border-ink-900",
        done === "green" && "border-green-500",
        !done && "border-dashed border-ink/20",
      )}
    >
      <span
        className={cx(
          "truncate text-[10.5px] font-bold tracking-[0.06em] uppercase transition-colors duration-500",
          done ? "text-ink" : "text-slate-400",
        )}
      >
        {name}
      </span>
      {done === "green" ? (
        <CheckBadge
          className="absolute -top-1.5 -right-1.5"
          style={live ? pop : undefined}
        />
      ) : null}
    </span>
  );
}

function Arrow() {
  return (
    <span className="hidden w-4 shrink-0 place-items-center text-slate-400 @md:grid">
      <Chevron className="size-2.5" />
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared parts                                                                */
/* -------------------------------------------------------------------------- */

/** The slides' frame: a tinted floor, its name on a tab across the border. */
function Frame({
  label,
  aside,
  caption,
  children,
}: {
  label: string;
  aside?: ReactNode;
  caption?: string;
  children: ReactNode;
}) {
  return (
    <div className="card-shape-lg relative flex h-full flex-col border border-ink/15 bg-paper px-4 pt-9 pb-4 select-none @md:px-5">
      <p className="absolute -top-3 left-4 rounded-md bg-ink-900 px-2.5 py-1.5 text-[10px] leading-none font-bold tracking-[0.12em] whitespace-nowrap text-white uppercase @md:left-5">
        {label}
      </p>
      {aside ? <div className="absolute top-3 right-4 @md:right-5">{aside}</div> : null}
      <div className="my-auto">{children}</div>
      {caption ? (
        <p className="mt-5 text-center text-[11.5px] leading-snug text-slate-400">
          {caption}
        </p>
      ) : null}
    </div>
  );
}

/** A unit of work: four quarters, one filled by each stage that works on it. */
function Packet({
  fill,
  done,
  dim,
  style,
}: {
  fill: number;
  done?: boolean;
  dim?: boolean;
  style?: CSSProperties;
}) {
  return (
    <span
      style={style}
      className={cx(
        "grid size-full grid-cols-2 gap-px rounded-[4px] bg-white p-[2px] shadow-[0_2px_5px_-1px_rgb(10_24_38_/_0.3)] ring-1 transition-opacity duration-300",
        done ? "ring-green-500" : "ring-ink/25",
        dim && "opacity-45",
      )}
    >
      {[0, 1, 2, 3].map((q) => (
        <span
          key={q}
          className={cx(
            "rounded-[1.5px] transition-colors duration-300",
            done ? "bg-green-500" : q < fill ? "bg-blue-500" : "bg-ink/10",
          )}
        />
      ))}
    </span>
  );
}

function CheckBadge({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <span
      className={cx(
        "grid size-4 place-items-center rounded-full bg-green-500 text-white ring-2 ring-paper",
        className,
      )}
      style={style}
    >
      <svg viewBox="0 0 16 16" fill="none" className="size-2.5">
        <path
          d="M3.5 8.4 6.6 11.3 12.5 4.8"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 6 8" className={className}>
      <path
        d="M1 1l4 3-4 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
