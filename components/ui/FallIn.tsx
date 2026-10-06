"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "./primitives";

/** Where the first card's trigger line sits, as a fraction of the way down the
 *  viewport, and the least time between two cards setting off, however fast
 *  the page is scrolled. The fall distance itself lives in the CSS. */
const LINE_AT = 0.88;
const MIN_GAP_MS = 140;

/**
 * A grid whose cards fall into their slots one at a time, paced by the scroll
 * rather than a clock, so the whole landing plays out across the scroll that
 * brings the grid into view instead of in one burst.
 *
 * Each card has its own trigger line, a step higher than the card before it:
 * a step is a row's height divided by the number of columns, so on any layout
 * the next card sets off every same few pixels of scrolling. The order snakes:
 * left to right along the first row, right to left back along the next, and so
 * on down. A card starts well above its slot and comes down out from under the
 * one before it.
 *
 * As with SlideIn, the finished layout is what renders on the server and on
 * first paint: a card is only hidden after mount, and only while it is below
 * the fold, so nothing visible ever disappears. Under reduced motion the cards
 * simply sit in place.
 */
export function FallIn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = ref.current;
    if (!list) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cards = Array.from(list.children) as HTMLElement[];
    let waiting = cards.filter(
      (card) => card.getBoundingClientRect().top >= window.innerHeight,
    );
    if (!waiting.length) return;

    /** How far above the first line each card's own line sits, and its place
     *  in the landing order. */
    const step = new Map<HTMLElement, number>();
    const order = new Map<HTMLElement, number>();
    function measure() {
      const rows = new Map<number, HTMLElement[]>();
      for (const card of cards) {
        rows.set(card.offsetTop, [...(rows.get(card.offsetTop) ?? []), card]);
      }
      const cols = Math.max(...[...rows.values()].map((row) => row.length));
      let n = 0;
      [...rows.values()].forEach((row, r) => {
        row.sort((a, b) => a.offsetLeft - b.offsetLeft);
        if (r % 2) row.reverse();
        row.forEach((card, col) => {
          step.set(card, (col / cols) * card.offsetHeight);
          order.set(card, n);
          // Earlier cards sit on top, so each one slides out from beneath the
          // card above it rather than across it.
          card.style.zIndex = String(cards.length - n);
          n++;
        });
      });
      waiting.sort((a, b) => order.get(a)! - order.get(b)!);
    }

    /** The earliest moment the next card may set off. */
    let nextAt = 0;
    let frame = 0;

    function check() {
      frame = 0;
      const line = window.innerHeight * LINE_AT;
      const now = performance.now();
      // Waiting is kept in landing order, so cards crossing together still
      // land in turn along the snake.
      waiting = waiting.filter((card) => {
        if (card.getBoundingClientRect().top > line - (step.get(card) ?? 0)) {
          return true;
        }
        const start = Math.max(now, nextAt);
        card.style.setProperty("--fall-delay", `${start - now}ms`);
        card.dataset.fall = "in";
        nextAt = start + MIN_GAP_MS;
        return false;
      });
      if (!waiting.length) stop();
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(check);
    }

    function resize() {
      measure();
      schedule();
    }

    function stop() {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frame);
    }

    for (const card of waiting) card.dataset.fall = "out";
    measure();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", resize);
    return stop;
  }, []);

  // Isolated, so the stacking order set on the cards stays inside the grid.
  return (
    <ul ref={ref} className={cx("isolate", className)}>
      {children}
    </ul>
  );
}
