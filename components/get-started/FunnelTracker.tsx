"use client";

import { useEffect } from "react";
import {
  setCalendarVisible,
  setSection,
  startTracking,
  track,
} from "@/lib/analytics/tracker";

/**
 * Starts the funnel tracker for a page and watches its `data-section` blocks:
 * each is logged the first time a visitor actually looks at it, and whichever
 * fills most of the screen is the visit's current section — the "where were
 * they when they left" on the dashboard. The block named `calendar` also
 * drives the "Saw the calendar" step.
 */
export function FunnelTracker({
  page,
  resumeOnly = false,
}: {
  page: string;
  /** Only continue a visit already running in this tab; see `startTracking`. */
  resumeOnly?: boolean;
}) {
  useEffect(() => {
    const stop = startTracking(page, { resumeOnly });
    const seen = new Set<string>();
    const onScreen = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const name = (entry.target as HTMLElement).dataset.section;
          if (!name) continue;
          const height = entry.isIntersecting ? entry.intersectionRect.height : 0;
          onScreen.set(name, height);
          // Half of a short block, or 40% of the screen for a tall one.
          const looked =
            entry.intersectionRatio >= 0.5 || height >= window.innerHeight * 0.4;
          if (looked && !seen.has(name)) {
            seen.add(name);
            track("section", name);
          }
          if (name === "calendar") {
            setCalendarVisible(
              entry.intersectionRatio >= 0.35 || height >= window.innerHeight * 0.35,
            );
          }
        }
        let current: string | undefined;
        let most = 0;
        for (const [name, height] of onScreen) {
          if (height > most) {
            most = height;
            current = name;
          }
        }
        if (current) setSection(current);
      },
      { threshold: [0, 0.1, 0.25, 0.35, 0.5, 0.75, 1] },
    );

    document
      .querySelectorAll<HTMLElement>("[data-section]")
      .forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      stop();
    };
  }, [page, resumeOnly]);

  return null;
}
