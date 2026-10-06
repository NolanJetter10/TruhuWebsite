"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** How far a card travels in, the gap between neighbours in a row setting
 *  off, and how long a row waits after the last card of the row above. */
const SLIDE_PX = 96;
const CARD_GAP_MS = 110;
const ROW_GAP_MS = 520;

/**
 * A grid whose rows slide into place from alternating sides the first time
 * they come on screen: the first row travels in from the left, card by card
 * left to right; the next from the right, right to left; and so on down.
 *
 * A row sets off once it is well into view, not as it clears the bottom edge,
 * and never before the row above has had its turn. As with DropIn, the
 * finished layout is what renders on the server and on first paint: a card is
 * only hidden after mount, and only while it is below the fold, so nothing
 * visible ever disappears. Without IntersectionObserver, or under reduced
 * motion, the cards simply sit in place.
 */
export function SlideIn({
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
    if (typeof IntersectionObserver === "undefined") return;

    const cards = Array.from(list.children) as HTMLElement[];
    const waiting = cards.filter(
      (card) => card.getBoundingClientRect().top >= window.innerHeight,
    );
    if (!waiting.length) return;

    /** The earliest moment the next row may set off. */
    let nextRowAt = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        const arriving = entries
          .filter((entry) => entry.intersectionRatio >= 0.5)
          .map((entry) => entry.target as HTMLElement);
        if (!arriving.length) return;

        // Sides alternate by row across the whole grid, not just this batch,
        // so the second row scrolled in on its own still comes from the right.
        const rowTops = [...new Set(cards.map((card) => card.offsetTop))].sort(
          (a, b) => a - b,
        );
        const rows = new Map<number, HTMLElement[]>();
        for (const card of arriving) {
          rows.set(card.offsetTop, [...(rows.get(card.offsetTop) ?? []), card]);
        }

        const now = performance.now();
        for (const [top, row] of [...rows].sort((a, b) => a[0] - b[0])) {
          const fromRight = rowTops.indexOf(top) % 2 === 1;
          row.sort((a, b) =>
            fromRight ? b.offsetLeft - a.offsetLeft : a.offsetLeft - b.offsetLeft,
          );
          const start = Math.max(now, nextRowAt);
          row.forEach((card, k) => {
            card.style.setProperty(
              "--slide-x",
              `${fromRight ? SLIDE_PX : -SLIDE_PX}px`,
            );
            card.style.setProperty(
              "--slide-delay",
              `${start - now + k * CARD_GAP_MS}ms`,
            );
            card.dataset.slide = "in";
            observer.unobserve(card);
          });
          // Stacked on a phone, every card is its own row; those keep the
          // ordinary gap rather than a pause apiece.
          nextRowAt =
            start +
            (row.length - 1) * CARD_GAP_MS +
            (row.length > 1 ? ROW_GAP_MS : CARD_GAP_MS);
        }
      },
      // The trigger line sits a fifth of the way up from the bottom edge, and
      // half a card has to be past it.
      { rootMargin: "0px 0px -20% 0px", threshold: 0.5 },
    );

    for (const card of waiting) {
      card.dataset.slide = "out";
      observer.observe(card);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <ul ref={ref} className={className}>
      {children}
    </ul>
  );
}
