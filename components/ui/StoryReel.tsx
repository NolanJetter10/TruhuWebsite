"use client";

import { Play } from "@phosphor-icons/react";
import Image from "next/image";
import { type ReactNode, useId, useState } from "react";
import { cx } from "@/components/ui/primitives";

export type Story = {
  name: string;
  role: string;
  /** The recording, played in the big frame. Without one, the frame and the
   *  story's card hold a placeholder. */
  video?: string;
  /** A still from the recording, for the card and for the frame before it
   *  plays. */
  poster?: string;
};

/** Where the blue and the green light sit in each placeholder, so the empty
 *  slots read as a run of different videos, not one frame repeated. */
const GLOWS = [
  ["20% 120%", "95% -10%"],
  ["80% 125%", "10% -15%"],
  ["45% 130%", "100% 20%"],
  ["90% 115%", "0% 10%"],
  ["30% 120%", "75% -20%"],
];

const glow = (i: number) => {
  const [blueAt, greenAt] = GLOWS[i % GLOWS.length];
  return `radial-gradient(85% 110% at ${blueAt}, rgb(5 130 220 / 0.55), transparent 70%), radial-gradient(60% 80% at ${greenAt}, rgb(56 176 0 / 0.28), transparent 70%)`;
};

const label = (i: number) => `Story ${String(i + 1).padStart(2, "0")}`;

/**
 * The customer videos, laid out after outmarket.ai's customer-success row: one
 * big 16:9 player, the section's title under it (passed in as `children`), and
 * a strip of frames that picks what the player holds. The chosen frame is
 * lifted and lit with its speaker named underneath; the rest are dimmed back.
 *
 * Picking is a click, a tap or Enter, never a hover or a focus: either would
 * swap out a video someone is part-way through as the pointer or the tab key
 * crosses the strip. A story picked by click starts playing at once, which the
 * click itself allows; the first one waits for its own play button.
 *
 * Every caption is laid out under its own frame and hidden unless chosen, so
 * the name lands under the lifted card and the strip never changes height as
 * the choice moves along it. On desktop the strip fits the container.
 * Narrower, it turns into a sideways scroller that snaps a frame to the
 * gutter; its top padding leaves room for the lift, which the scroller would
 * otherwise clip.
 */
export function StoryReel({
  stories,
  pendingLabel,
  children,
}: {
  stories: readonly Story[];
  pendingLabel: string;
  children?: ReactNode;
}) {
  const [active, setActive] = useState(0);
  const [picked, setPicked] = useState(false);
  const playerId = useId();
  const story = stories[active];

  return (
    <>
      <div className="reveal relative">
        {/* Brand light behind the frame, as the testimonial card has it. */}
        <div
          aria-hidden
          className="absolute -inset-x-6 -inset-y-4 -z-10 rounded-[2rem] opacity-15 blur-2xl"
          style={{ backgroundImage: "var(--grad-brand)" }}
        />
        <div
          id={playerId}
          className="card-shape-lg relative isolate aspect-video overflow-hidden bg-ink-950 shadow-[0_40px_80px_-40px_rgb(10_24_38_/_0.6)]"
        >
          {story.video ? (
            <video
              key={active}
              src={story.video}
              poster={story.poster}
              controls
              playsInline
              autoPlay={picked}
              preload="metadata"
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <div
              key={active}
              className="absolute inset-0"
              style={{ animation: "demo-fade 600ms var(--ease-out-expo) both" }}
            >
              {story.poster ? (
                <Image
                  src={story.poster}
                  alt=""
                  fill
                  sizes="(min-width: 1180px) 1116px, 100vw"
                  className="object-cover opacity-60"
                />
              ) : (
                <span
                  aria-hidden
                  className="absolute inset-0"
                  style={{ backgroundImage: glow(active) }}
                />
              )}
              <div aria-hidden className="grid-field" />
              <p className="t-eyebrow absolute top-5 left-6 text-white/60 sm:top-8 sm:left-9">
                {label(active)}
              </p>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 sm:gap-4">
                <span
                  aria-hidden
                  className="grid size-14 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/30 backdrop-blur-sm sm:size-20"
                >
                  <Play weight="fill" className="ml-1 size-5 sm:size-7" />
                </span>
                <p className="text-[0.8125rem] font-semibold text-white/70 sm:text-[0.9375rem]">
                  {pendingLabel}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {children}

      <div className="reveal mt-10 lg:mt-12">
        <ul className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pt-3 [scrollbar-width:none] sm:-mx-8 sm:scroll-px-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
          {stories.map((entry, i) => {
            const on = i === active;
            return (
              <li
                key={i}
                className="w-[72%] shrink-0 snap-start sm:w-[44%] md:w-[31%] lg:w-auto"
              >
                <button
                  type="button"
                  aria-label={`${label(i)}: ${entry.name}, ${entry.role}`}
                  aria-controls={playerId}
                  aria-current={on}
                  onClick={() => {
                    setActive(i);
                    setPicked(true);
                  }}
                  className={cx(
                    "card-shape-sm relative block aspect-video w-full cursor-pointer overflow-hidden bg-ink-950 transition-[translate,filter,box-shadow] duration-500",
                    /* Dimmed by darkening rather than fading: a faded frame
                       turns to a grey smear on white, a darkened one stays a
                       frame. */
                    on
                      ? "-translate-y-3 shadow-[0_22px_40px_-20px_rgb(10_24_38_/_0.55)]"
                      : "brightness-55 saturate-40 hover:brightness-75",
                  )}
                  style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
                >
                  {entry.poster ? (
                    <Image
                      src={entry.poster}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 220px, 72vw"
                      className="object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="absolute inset-0"
                      style={{ backgroundImage: glow(i) }}
                    />
                  )}
                  <span
                    aria-hidden
                    className="absolute top-3 left-3.5 text-[0.6875rem] font-semibold tracking-[0.14em] text-white/55 uppercase"
                  >
                    {label(i)}
                  </span>
                  <span
                    aria-hidden
                    className={cx(
                      "absolute top-1/2 left-1/2 grid size-11 -translate-1/2 place-items-center rounded-full transition-colors duration-300",
                      on
                        ? "bg-white text-ink"
                        : "bg-white/10 text-white ring-1 ring-white/25",
                    )}
                  >
                    <Play weight="fill" className="ml-0.5 size-4" />
                  </span>
                  {/* The hairline that marks the chosen frame, drawn inside
                      it so the lift is the only thing that moves the edge. */}
                  <span
                    aria-hidden
                    className={cx(
                      "absolute inset-0 rounded-[inherit] ring-1 ring-white/70 ring-inset transition-opacity duration-500",
                      on ? "opacity-100" : "opacity-0",
                    )}
                  />
                </button>

                {/* The button already names the speaker; this is for the eye. */}
                <div
                  aria-hidden
                  className={cx(
                    "mt-5 transition-[opacity,translate] duration-500",
                    !on && "invisible translate-y-1 opacity-0",
                  )}
                  style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
                >
                  <p className="t-h4 text-[1.1875rem]">{entry.name}</p>
                  <p className="mt-0.5 text-[0.9375rem] text-slate-400">
                    {entry.role}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
