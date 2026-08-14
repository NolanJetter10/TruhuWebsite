"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange: () => void) {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Read as an external store rather than as effect state, so the preference is
 * a derived value everywhere it is used and never triggers a second render
 * pass of its own. The server snapshot is `false`, which is also what the
 * markup is generated against.
 */
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
}

/**
 * Demos only run while they are on screen. Without IntersectionObserver the
 * element is treated as visible on the next frame, so the demo still plays.
 */
export function useInView<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? false),
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}

/**
 * A looping step counter for the product demos.
 *
 * Under reduced motion the loop never starts and the value is pinned to the
 * final step, which is the one carrying the most information.
 */
export function useSequence(steps: number, intervalMs: number, active: boolean) {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (steps < 2 || reduced || !active) return;
    const id = window.setInterval(
      () => setStep((current) => (current + 1) % steps),
      intervalMs,
    );
    return () => window.clearInterval(id);
  }, [steps, intervalMs, active, reduced]);

  return [reduced ? steps - 1 : step, setStep] as const;
}

/**
 * Counts to `value` the first time the element is seen.
 *
 * The final value is what renders on the server and on first paint, so a
 * statistic is never briefly wrong for a visitor with JavaScript disabled or
 * for one who lands mid-page. The wind-back to zero happens inside the first
 * animation frame rather than on activation, so there is no render where the
 * number is both visible and zero.
 */
export function useCountUp(value: number, active: boolean, durationMs = 1100) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const started = useRef(false);

  useEffect(() => {
    if (reduced || value === 0 || !active || started.current) return;
    started.current = true;

    let frame = 0;
    const begin = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - begin) / durationMs);
      setDisplay(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, active, durationMs, reduced]);

  return display;
}
