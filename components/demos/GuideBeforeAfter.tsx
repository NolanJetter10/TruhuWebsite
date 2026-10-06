"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BrowserFrame } from "@/components/art/frames";
import { cx } from "@/components/ui/primitives";
import { ADVISOR_PAGE } from "@/lib/content";
import { GUIDE_PAGES } from "./guide-pages";
import { useInView, useReducedMotion } from "./hooks";

/**
 * The problem shown with the real thing. A client's existing guide is
 * scrolled page by page under "Before TruHu", then a seam wipes across to the
 * guide TruHu builds from the same benefits, which scrolls the same way under
 * "With TruHu". Then it wipes back and loops.
 *
 * One clock drives the whole sequence and writes positions straight to the
 * DOM each frame, so React only renders when the side or the page number
 * changes. The clock only runs while the viewer is on screen, so a visitor
 * who scrolls away and back picks up where they left off.
 *
 * The page images come from `scripts/guide-pages.py`.
 */

const { guides } = ADVISOR_PAGE.problem;

type Side = "before" | "after";
const SIDES: readonly Side[] = ["before", "after"];

/** All in ms. */
const TIMING = {
  /** On the first page before scrolling starts. */
  lead: 1400,
  /** One page-to-page flick, and the pause on the page it lands on. */
  move: 720,
  rest: 620,
  /** On the last page before the wipe. */
  tail: 1800,
  wipe: 1100,
  /** A long guide flicks faster, so a side's scroll never runs past this.
   *  The old packet is skimmed; the new guide gets time to be read. */
  flicks: { before: 6500, after: 8500 } satisfies Record<Side, number>,
};

/** The after layer clipped away to nothing at its right edge. */
const HIDDEN = "inset(0 100% 0 0)";
const SIZES = "(min-width: 1024px) 32rem, 90vw";

const ease = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

type Track = {
  /** Scroll offsets the flicks land on, one per page, in px. */
  stops: number[];
  /** Each page's top, for the page counter. */
  tops: number[];
  end: number;
  move: number;
  rest: number;
  duration: number;
};

function measure(track: HTMLElement, height: number, budget: number): Track {
  const pages = Array.from(track.children as HTMLCollectionOf<HTMLElement>);
  const pad = pages[0]?.offsetTop ?? 0;
  const end = Math.max(0, track.offsetHeight - height);
  const tops = pages.map((page) => page.offsetTop - pad);

  // The last pages all clamp to the bottom, so they collapse into one stop;
  // a last page taller than the viewer gets one more to reach its foot.
  const stops = [0];
  for (const top of tops) {
    const stop = Math.min(top, end);
    if (stop > stops[stops.length - 1] + 1) stops.push(stop);
  }
  if (end > stops[stops.length - 1] + 1) stops.push(end);

  const flicks = stops.length - 1;
  const pace = flicks
    ? Math.min(1, budget / (flicks * (TIMING.move + TIMING.rest)))
    : 1;
  const move = TIMING.move * pace;
  const rest = TIMING.rest * pace;
  return {
    stops,
    tops,
    end,
    move,
    rest,
    duration: TIMING.lead + flicks * (move + rest) - (flicks ? rest : 0) + TIMING.tail,
  };
}

function offsetAt({ stops, move, rest }: Track, elapsed: number) {
  let t = elapsed - TIMING.lead;
  if (t <= 0) return 0;
  for (let i = 1; i < stops.length; i++) {
    if (t < move) return stops[i - 1] + (stops[i] - stops[i - 1]) * ease(t / move);
    t -= move + rest;
    if (t < 0) return stops[i];
  }
  return stops[stops.length - 1];
}

export function GuideBeforeAfter() {
  const [ref, inView] = useInView<HTMLElement>(0.35);
  const reduced = useReducedMotion();
  const [shown, setShown] = useState<{ side: Side; page: number }>({
    side: "before",
    page: 1,
  });

  // Every page loads once the viewer is first seen. Lazy loading alone would
  // wait until a page scrolls into the clipped viewport, and pop in late.
  const [armed, setArmed] = useState(false);
  if (inView && !armed) setArmed(true);

  const viewportRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);
  const seamRef = useRef<HTMLDivElement>(null);
  const tracks = useRef<Record<Side, HTMLDivElement | null>>({
    before: null,
    after: null,
  });
  const clock = useRef(0);
  const last = useRef(shown);

  useEffect(() => {
    const viewport = viewportRef.current;
    const after = afterRef.current;
    const seam = seamRef.current;
    const { before: beforeTrack, after: afterTrack } = tracks.current;
    if (reduced || !inView || !viewport || !after || !seam || !beforeTrack || !afterTrack) {
      return;
    }

    let height = 0;
    let plan!: Record<Side, Track>;
    const remeasure = () => {
      height = viewport.clientHeight;
      plan = {
        before: measure(beforeTrack, height, TIMING.flicks.before),
        after: measure(afterTrack, height, TIMING.flicks.after),
      };
    };
    remeasure();
    const resize = new ResizeObserver(remeasure);
    resize.observe(viewport);

    const pageAt = (track: Track, y: number) =>
      Math.max(1, track.tops.filter((top) => top <= y + height * 0.45).length);

    const apply = (t: number) => {
      const B = plan.before.duration;
      const A = plan.after.duration;
      const W = TIMING.wipe;

      let side: Side;
      let beforeY = 0;
      let afterY = 0;
      let clip = "inset(0)";
      let wipe: number | null = null;

      if (t < B) {
        side = "before";
        beforeY = offsetAt(plan.before, t);
        clip = HIDDEN;
      } else if (t < B + W) {
        // The new guide sweeps in over the old one, left to right.
        side = "after";
        wipe = ease((t - B) / W);
        beforeY = plan.before.end;
        clip = `inset(0 ${(1 - wipe) * 100}% 0 0)`;
      } else if (t < B + W + A) {
        side = "after";
        afterY = offsetAt(plan.after, t - B - W);
      } else {
        // And gives way to the old one again, in the same direction.
        side = "before";
        wipe = ease((t - B - W - A) / W);
        afterY = plan.after.end;
        clip = `inset(0 0 0 ${wipe * 100}%)`;
      }

      beforeTrack.style.transform = `translate3d(0, ${-beforeY}px, 0)`;
      afterTrack.style.transform = `translate3d(0, ${-afterY}px, 0)`;
      after.style.clipPath = clip;
      seam.style.opacity = wipe === null ? "0" : "1";
      seam.style.transform = `translate3d(${(wipe ?? 0) * 100}%, 0, 0)`;

      const page = pageAt(plan[side], side === "before" ? beforeY : afterY);
      if (side !== last.current.side || page !== last.current.page) {
        last.current = { side, page };
        setShown(last.current);
      }
    };

    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const total = plan.before.duration + plan.after.duration + 2 * TIMING.wipe;
      // Capped, so a frame after a background tab doesn't jump the sequence.
      clock.current = (clock.current + Math.min(now - previous, 50)) % total;
      previous = now;
      apply(clock.current);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
    };
  }, [inView, reduced]);

  // Without motion, the two guides sit side by side on their first pages.
  if (reduced) {
    return (
      <figure ref={ref} className="grid grid-cols-2 gap-4 sm:gap-6">
        {SIDES.map((side) => (
          <div key={side}>
            <div className="card-shape overflow-hidden border border-line bg-white shadow-[0_30px_70px_-40px_rgba(5,14,26,0.55)]">
              <Image
                src={GUIDE_PAGES[side].pages[0]}
                alt=""
                sizes="(min-width: 1024px) 16rem, 46vw"
                placeholder="blur"
                className="h-auto w-full"
              />
            </div>
            <p className="mt-3 text-center text-[0.875rem] font-semibold text-slate-600">
              {guides[side].label}
            </p>
          </div>
        ))}
        <figcaption className="sr-only">{guides.description}</figcaption>
      </figure>
    );
  }

  return (
    <figure ref={ref}>
      <BrowserFrame
        label={guides[shown.side].file}
        aside={
          <span className="tabular font-mono text-[11px] text-slate-400">
            {GUIDE_PAGES[shown.side].numbers[shown.page - 1]} /{" "}
            {GUIDE_PAGES[shown.side].total}
          </span>
        }
      >
        <div
          ref={viewportRef}
          aria-hidden
          className="relative aspect-square overflow-hidden bg-[#e4eaf1]"
        >
          {SIDES.map((side) => (
            <div
              key={side}
              ref={side === "after" ? afterRef : undefined}
              className="absolute inset-0 bg-[#e4eaf1]"
              style={side === "after" ? { clipPath: HIDDEN } : undefined}
            >
              <div
                ref={(node) => {
                  tracks.current[side] = node;
                }}
                className="relative flex flex-col gap-4 p-5 will-change-transform sm:gap-5 sm:p-7"
              >
                {GUIDE_PAGES[side].pages.map((src, i) => (
                  <Image
                    key={src.src}
                    src={src}
                    alt=""
                    sizes={SIZES}
                    placeholder="blur"
                    loading={armed || i === 0 ? "eager" : "lazy"}
                    className="h-auto w-full rounded-[3px] shadow-[0_12px_30px_-16px_rgba(5,14,26,0.5)] ring-1 ring-ink/5"
                  />
                ))}
              </div>
            </div>
          ))}

          {/* The seam the wipe travels along. */}
          <div
            ref={seamRef}
            className="pointer-events-none absolute inset-0 opacity-0"
          >
            <span
              className="absolute inset-y-0 left-0 w-[3px] -translate-x-1/2"
              style={{
                background:
                  "linear-gradient(180deg, var(--color-blue-500), var(--color-teal-400), var(--color-green-500))",
                boxShadow: "0 0 28px 6px rgba(33, 207, 192, 0.45)",
              }}
            />
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-[#e4eaf1] to-transparent" />
          <p className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
            <span
              key={shown.side}
              className={cx(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.875rem] font-semibold shadow-[0_14px_30px_-14px_rgba(5,14,26,0.55)] backdrop-blur-md",
                shown.side === "before"
                  ? "bg-white/90 text-slate-600 ring-1 ring-line"
                  : "bg-ink-950/90 text-white",
              )}
              style={{ animation: "demo-caption 520ms var(--ease-out-expo) both" }}
            >
              <span
                className={cx(
                  "size-1.5 rounded-full",
                  shown.side === "before" ? "bg-slate-400" : "bg-green-400",
                )}
              />
              {guides[shown.side].label}
            </span>
          </p>
        </div>
      </BrowserFrame>
      <figcaption className="sr-only">{guides.description}</figcaption>
    </figure>
  );
}
