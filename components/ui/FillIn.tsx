"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Where the first card's trigger line sits, as a fraction of the way down the
 *  viewport, and how much higher each card along a row has its own, as a
 *  fraction of the viewport's height. A piece lands only once it is above its
 *  own line, so none land unseen below the fold. */
const LINE_AT = 0.82;
const STEP_AT = 0.2;
const PIECE_LINE_AT = 0.92;

/** The least time between two cards setting off, however fast the page is
 *  scrolled; how long a card is on its way down before its pieces may land;
 *  and the gap between two pieces, give or take the jitter. The motion itself
 *  lives in the CSS. */
const CARD_GAP_MS = 180;
const SETTLE_MS = 420;
const PIECE_GAP_MS = 120;
const JITTER_MS = 45;

/** A fresh order every time, so no two visits fill the same way. */
function shuffle<T>(items: T[]) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/**
 * A list of cards that slide down into their slots and then fill in, paced by
 * the scroll, so the whole thing plays out across the scroll that brings the
 * list into view rather than in one burst.
 *
 * Each card has its own trigger line, a step higher than the card before it
 * along the row, so a row comes down left to right as it rises up the screen;
 * stacked on a phone, every card is its own row and goes as it arrives. Once a
 * card is nearly down, everything inside it marked `data-piece` lands on it one
 * at a time, in no set order, each waiting until it is itself on screen, so the
 * card reads as piling up rather than being printed top to bottom.
 *
 * As with FallIn, the finished layout is what renders on the server and on
 * first paint: a card is only hidden after mount, and only while it is below
 * the fold, so nothing visible ever disappears. The shuffle happens then too,
 * on the client, so it never differs from the server's markup. Under reduced
 * motion the cards simply sit in place.
 */
export function FillIn({
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

    /** Each card's place along its row, and the waiting cards kept in landing
     *  order: down the rows, left to right along each. */
    const col = new Map<HTMLElement, number>();
    function measure() {
      const rows = new Map<number, HTMLElement[]>();
      for (const card of cards) {
        rows.set(card.offsetTop, [...(rows.get(card.offsetTop) ?? []), card]);
      }
      for (const row of rows.values()) {
        row
          .sort((a, b) => a.offsetLeft - b.offsetLeft)
          .forEach((card, k) => col.set(card, k));
      }
      waiting.sort(
        (a, b) => a.offsetTop - b.offsetTop || a.offsetLeft - b.offsetLeft,
      );
    }

    /** Cards on their way in: the pieces still to land on each, in shuffled
     *  order, and the earliest moment the next of them may. */
    let filling: { pieces: HTMLElement[]; nextAt: number }[] = [];
    /** The earliest moment the next card may set off. */
    let nextCardAt = 0;
    let frame = 0;

    function check() {
      frame = 0;
      const now = performance.now();
      const height = window.innerHeight;

      waiting = waiting.filter((card) => {
        const line = height * (LINE_AT - (col.get(card) ?? 0) * STEP_AT);
        if (card.getBoundingClientRect().top > line) return true;
        const start = Math.max(now, nextCardAt);
        card.style.setProperty("--fill-delay", `${start - now}ms`);
        card.dataset.fill = "in";
        nextCardAt = start + CARD_GAP_MS;
        filling.push({
          pieces: shuffle(
            Array.from(card.querySelectorAll<HTMLElement>("[data-piece]")),
          ),
          nextAt: start + SETTLE_MS,
        });
        return false;
      });

      // One piece per card per frame at most, the first in the shuffle that
      // is on screen. The loop runs on the clock only while a piece may be
      // due; one waiting below the fold waits for the scroll instead.
      const line = height * PIECE_LINE_AT;
      let due = false;
      for (const card of filling) {
        if (now < card.nextAt) {
          due = true;
          continue;
        }
        const k = card.pieces.findIndex(
          (piece) => piece.getBoundingClientRect().top < line,
        );
        if (k < 0) continue;
        const [piece] = card.pieces.splice(k, 1);
        piece.dataset.land = "in";
        card.nextAt = now + PIECE_GAP_MS + (Math.random() * 2 - 1) * JITTER_MS;
        if (card.pieces.length) due = true;
      }
      filling = filling.filter((card) => card.pieces.length);

      if (!waiting.length && !filling.length) stop();
      else if (due) frame = requestAnimationFrame(check);
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

    for (const card of waiting) card.dataset.fill = "out";
    measure();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", resize);
    return stop;
  }, []);

  return (
    <ul ref={ref} className={className}>
      {children}
    </ul>
  );
}
