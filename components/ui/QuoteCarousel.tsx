"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useState } from "react";
import { cx } from "@/components/ui/primitives";

export type CarouselQuote = {
  text: string;
  /** A phrase inside `text` that carries brand green, as truhu.ai runs it. */
  accent?: string;
  name: string;
  role: string;
  image: StaticImageData;
};

/** How long one quote holds before the next takes over. */
const DWELL = 5000;

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The quote, with its accent phrase lifted into brand green. */
function Body({ text, accent }: { text: string; accent?: string }) {
  const at = accent ? text.indexOf(accent) : -1;
  if (at < 0 || !accent) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <span className="text-green-700">{accent}</span>
      {text.slice(at + accent.length)}
    </>
  );
}

/**
 * The rotating testimonial: one card, the quotes cross-fading inside it, and a
 * segmented bar along the bottom that fills through the set. The segments are
 * the controls as well as the indicator.
 *
 * The dwell timer *is* the fill animation rather than a JS interval, so pausing
 * it on hover holds the quote at exactly the point the eye left it and a
 * backgrounded tab stops advancing on its own. Under reduced motion the bar is
 * drawn complete and nothing rotates unless it is clicked.
 *
 * All quotes are stacked in one grid cell, so the card is as tall as the
 * longest of them and nothing below it moves as the carousel turns. Each figure
 * pushes its attribution to the bottom of that cell, which keeps the rule and
 * the face pinned in place across quotes of different lengths.
 */
export function QuoteCarousel({ quotes }: { quotes: readonly CarouselQuote[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /* Checked here as well as in state: the global reduced-motion rule collapses
     every animation to 0.001ms, so the fill can end before the effect above has
     had its chance to run. */
  const advance = () => {
    if (reduced()) return;
    setIndex((i) => (i + 1) % quotes.length);
  };

  return (
    <div className="relative">
      {/* Brand light behind the card, so it sits on the page rather than on a
          flat white field. */}
      <div
        aria-hidden
        className="absolute -inset-x-6 -inset-y-4 -z-10 rounded-[2rem] opacity-15 blur-2xl"
        style={{ backgroundImage: "var(--grad-brand)" }}
      />

      <div className="card-shape-lg border border-line bg-white px-7 pt-8 pb-7 shadow-[0_24px_60px_-28px_rgb(10_24_38_/_0.25)] sm:px-12 sm:pt-10 sm:pb-9 lg:px-16">
        <span
          aria-hidden
          className="block text-[2.75rem] leading-none font-bold text-blue-500 select-none"
        >
          &ldquo;
        </span>

        <div className="mt-5 grid">
          {quotes.map((quote, i) => (
            <figure
              key={quote.name}
              aria-hidden={i !== index}
              className={cx(
                "col-start-1 row-start-1 flex flex-col transition-all duration-500",
                i === index
                  ? "translate-y-0 opacity-100 blur-0"
                  : "invisible translate-y-1.5 opacity-0 blur-[3px]",
              )}
              style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
            >
              {/* The card runs the full container width, so the extra size
                  costs no height — the longest quote still sets the block. */}
              <blockquote className="t-h3 mb-9 text-[1.375rem] sm:text-[1.875rem] sm:leading-[1.28] lg:text-[2.125rem]">
                <Body text={quote.text} accent={quote.accent} />
              </blockquote>

              {/* `mt-auto` pins the rule and the face to the foot of the cell,
                  so they hold their place under a short quote as well as the
                  long one that sets the card's height. */}
              <figcaption className="mt-auto flex items-center gap-3 border-t border-line pt-6">
                <Image
                  src={quote.image}
                  alt=""
                  className="size-10 rounded-full object-cover"
                  sizes="40px"
                />
                <span className="text-[0.9375rem] leading-snug">
                  <span className="block font-bold text-ink">{quote.name}</span>
                  <span className="text-slate-400">{quote.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Pausing is scoped to the bar rather than the whole card: a cursor
            resting anywhere over a card this size would otherwise hold the
            rotation indefinitely. */}
        {quotes.length > 1 ? (
          <div
            className="mt-7 flex gap-1.5"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            {quotes.map((entry, i) => (
              <button
                key={entry.name}
                type="button"
                aria-label={`Show quote from ${entry.name}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className="group h-4 flex-1 cursor-pointer"
              >
                <span className="block h-[3px] w-full overflow-hidden rounded-full bg-line transition-colors group-hover:bg-slate-400/40">
                  <span
                    className={cx(
                      "block h-full w-full origin-left rounded-full bg-blue-500",
                      i < index && "scale-x-100",
                      i > index && "scale-x-0",
                    )}
                    onAnimationEnd={i === index ? advance : undefined}
                    style={
                      i === index && !still
                        ? {
                            animation: `dot-fill ${DWELL}ms linear both`,
                            animationPlayState: paused ? "paused" : "running",
                          }
                        : undefined
                    }
                  />
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
