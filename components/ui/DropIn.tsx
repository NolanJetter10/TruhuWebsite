"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Gap between neighbours landing, and the tilt each one falls at. */
const DROP_GAP_MS = 180;
const TILTS = ["-1.6deg", "1.1deg", "-0.8deg", "1.4deg", "-1.2deg"];

/**
 * A list whose cards fall into their slots the first time they come on screen.
 *
 * Cards that arrive together, a row on a wide screen, land left to right; a
 * card arriving alone, as in the stacked mobile layout, lands at once. As with
 * CountUp, the finished layout is what renders on the server and on first
 * paint: a card is only lifted out of its slot after mount, and only while it
 * is entirely off screen, so nothing visible ever disappears. Without
 * IntersectionObserver, or under reduced motion, the cards simply sit in place.
 */
export function DropIn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = ref.current;
    if (!list) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    const seen = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        const landing: HTMLElement[] = [];

        for (const entry of entries) {
          const card = entry.target as HTMLElement;
          if (!seen.has(card)) {
            seen.add(card);
            if (entry.intersectionRatio > 0) {
              observer.unobserve(card);
            } else {
              card.dataset.drop = "up";
            }
            continue;
          }
          if (card.dataset.drop === "up" && entry.intersectionRatio >= 0.25) {
            landing.push(card);
          }
        }

        landing
          .sort(
            (a, b) =>
              a.getBoundingClientRect().top - b.getBoundingClientRect().top ||
              a.getBoundingClientRect().left - b.getBoundingClientRect().left,
          )
          .forEach((card, k) => {
            card.style.setProperty("--drop-delay", `${k * DROP_GAP_MS}ms`);
            card.style.setProperty("--drop-tilt", TILTS[k % TILTS.length]);
            card.dataset.drop = "down";
            observer.unobserve(card);
          });
      },
      { threshold: [0, 0.25] },
    );

    for (const card of Array.from(list.children)) observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <ol ref={ref} className={className}>
      {children}
    </ol>
  );
}
