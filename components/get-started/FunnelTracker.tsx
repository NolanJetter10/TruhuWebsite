"use client";

import { useEffect } from "react";
import { setSection, startTracking, track } from "@/lib/analytics/tracker";

const SECTION = "[data-section]";

/**
 * Starts the funnel tracker for a page and watches its `data-section` blocks:
 * each is logged the first time a visitor actually looks at it, and whichever
 * fills most of the screen is the visit's current section — the "where were
 * they when they left" on the dashboard.
 *
 * Blocks that mount later count too. The popups (`flow-*` sections) render
 * through a portal only once opened, so a MutationObserver picks them up as
 * they arrive and lets them go as they close. While one is open it is the
 * current section, since it sits over whatever the page shows behind it.
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
    const onScreen = new Map<HTMLElement, number>();

    const settle = () => {
      let current: string | undefined;
      let most = 0;
      let popup = false;
      for (const [el, height] of onScreen) {
        if (height <= 0) continue;
        const name = el.dataset.section!;
        const isPopup = name.startsWith("flow-");
        if (popup && !isPopup) continue;
        if ((isPopup && !popup) || height > most) {
          most = height;
          current = name;
          popup ||= isPopup;
        }
      }
      if (current) setSection(current);
    };

    const intersections = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          const name = el.dataset.section;
          if (!name || !onScreen.has(el)) continue;
          const height = entry.isIntersecting ? entry.intersectionRect.height : 0;
          onScreen.set(el, height);
          // Half of a short block, or 40% of the screen for a tall one.
          const looked =
            entry.intersectionRatio >= 0.5 || height >= window.innerHeight * 0.4;
          if (looked && !seen.has(name)) {
            seen.add(name);
            track("section", name);
          }
        }
        settle();
      },
      { threshold: [0, 0.1, 0.25, 0.35, 0.5, 0.75, 1] },
    );

    /** Every section in or under `node`, itself included. */
    const sectionsIn = (node: Node) => {
      if (!(node instanceof HTMLElement)) return [];
      const found = [...node.querySelectorAll<HTMLElement>(SECTION)];
      return node.matches(SECTION) ? [node, ...found] : found;
    };

    const watch = (el: HTMLElement) => {
      if (onScreen.has(el)) return;
      onScreen.set(el, 0);
      intersections.observe(el);
    };

    document.querySelectorAll<HTMLElement>(SECTION).forEach(watch);

    const mutations = new MutationObserver((records) => {
      let removed = false;
      for (const record of records) {
        record.addedNodes.forEach((node) => sectionsIn(node).forEach(watch));
        record.removedNodes.forEach((node) => {
          for (const el of sectionsIn(node)) {
            if (el.isConnected || !onScreen.delete(el)) continue;
            intersections.unobserve(el);
            removed = true;
          }
        });
      }
      // A closed popup stops being where the visitor is.
      if (removed) settle();
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      intersections.disconnect();
      stop();
    };
  }, [page, resumeOnly]);

  return null;
}
