"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Quality floor (file 04 §9): "No stat renders as 0 before animation.
 * Server-render the final value; animate from it only when JS and motion are
 * both available."
 *
 * So: the final value is what renders on the server and on first paint. Only
 * after mount, and only if the element is still below the fold, and only if the
 * visitor has not asked for reduced motion, do we wind it back and count up.
 */
export function CountUp({
  value,
  prefix = "",
  suffix = "",
  durationMs = 900,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const node = ref.current;
    if (!node || value === 0) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    let raf = 0;
    let started = false;

    const run = () => {
      if (started) return;
      started = true;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(Math.round(value * eased));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          run();
          observer.disconnect();
        } else if (!started) {
          // Below the fold and untouched, safe to wind back to zero.
          setDisplay(0);
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, durationMs]);

  return (
    <span ref={ref} className="tabular">
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
