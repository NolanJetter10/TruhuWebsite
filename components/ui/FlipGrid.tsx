"use client";

import { useEffect, useRef } from "react";

/** Timing for one way. The turn back takes the same, run in reverse. */
const DURATION = 560;
const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";

/** Reach of the cursor, in px. Every cell whose centre falls inside turns. */
const RADIUS = 45;

/**
 * The longest a released cell waits before turning back, which is what the
 * cell right under the cursor gets. Cells further out wait proportionally
 * less, so a patch folds up from its rim inward.
 */
const CASCADE = 450;

/**
 * How far the pointer may travel between two move events and still be treated
 * as a sweep. Anything further is a jump, such as re-entering from another
 * side, and should not draw a line of flips across the surface.
 */
const MAX_SWEEP_PX = 800;

type Tile = {
  anim: Animation;
  /** Inside the cursor's reach right now. */
  held: boolean;
  /** The closest the cursor has come to this cell since it last reached it. */
  nearest: number;
  /** When a released cell may start turning back. */
  releaseAt: number;
  timer: number;
};

type Reach = { col: number; row: number; d: number };

/**
 * The dense grid on the lit surfaces. Every cell within the cursor's reach
 * turns over to show a tinted back, and turns back once the cursor moves off.
 *
 * Nothing is rendered per cell. A tile is created only when the cursor
 * reaches its cell and is removed once it has turned back, so the surface
 * only holds the tiles that are in motion. The cell size and both faces are
 * read from the layer's CSS, so the grid and the tiles cannot drift apart.
 *
 * Turning back is staggered by how close the cursor came to each cell: the
 * rim goes first and the centre last, whether the cursor leaves the surface
 * or moves on and leaves a wake. Every tile also finishes turning over before
 * it turns back, which is what makes a quick sweep leave whole flips rather
 * than a flicker.
 */
export function FlipGrid({
  tone,
  fade = false,
}: {
  tone: "dark" | "light";
  /** Dim the cursor's highlight down the surface: full at the top, faint at
   * the bottom. For tall sections, where an even glow overpowers the content
   * further down. */
  fade?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = ref.current;
    // The layer is rendered as a direct child of the lit <section>, so the
    // section is what the pointer is tracked against.
    const host = layer?.parentElement;
    if (!layer || !host) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const style = getComputedStyle(layer);
    const cell = parseFloat(style.getPropertyValue("--grid-cell"));
    const front = parseFloat(style.getPropertyValue("--tile-front"));
    if (!cell || Number.isNaN(front)) return;

    // Only transform and opacity move, so every flip runs on the compositor.
    // The front face is the back at low opacity, and it changes at the exact
    // moment the tile is edge-on, whichever way it is turning, because both
    // are keyed to the same progress. The perspective scales with the cell so
    // the turn has the same depth at any density.
    const turn = (deg: number) =>
      `perspective(${cell * 4}px) rotateY(${deg}deg)`;
    const keyframes: Keyframe[] = [
      { offset: 0, transform: turn(0), opacity: front },
      { offset: 0.5, transform: turn(90), opacity: front },
      { offset: 0.5, transform: turn(90), opacity: 1 },
      { offset: 1, transform: turn(180), opacity: 1 },
    ];

    const tiles = new Map<string, Tile>();
    let last: { x: number; y: number } | null = null;

    const run = (tile: Tile, rate: 1 | -1) => {
      // Already turning that way, or already there. Calling `play()` on a
      // finished animation would rewind it and turn it over a second time.
      if (tile.anim.playbackRate === rate) return;
      tile.anim.playbackRate = rate;
      tile.anim.play();
    };

    // Turns a released tile back once it is fully over and its wait is up.
    const settle = (tile: Tile) => {
      clearTimeout(tile.timer);
      const { anim } = tile;
      // Held, already turning back, or still turning over, in which case its
      // finish handler settles it again.
      if (tile.held || anim.playbackRate < 0 || anim.playState !== "finished")
        return;
      const wait = tile.releaseAt - performance.now();
      if (wait > 0) tile.timer = window.setTimeout(() => settle(tile), wait);
      else run(tile, -1);
    };

    const release = (tile: Tile, at: number) => {
      tile.held = false;
      tile.releaseAt = at + CASCADE * (1 - tile.nearest / RADIUS);
      settle(tile);
    };

    const engage = (key: string, { col, row, d }: Reach) => {
      const existing = tiles.get(key);
      if (existing) {
        if (existing.held) {
          existing.nearest = Math.min(existing.nearest, d);
          return;
        }
        existing.held = true;
        existing.nearest = d;
        clearTimeout(existing.timer);
        run(existing, 1);
        return;
      }

      const el = document.createElement("span");
      el.className = "flip-tile";
      el.style.left = `${col * cell + 1}px`;
      el.style.top = `${row * cell + 1}px`;
      layer.append(el);

      const tile: Tile = {
        anim: el.animate(keyframes, {
          duration: DURATION,
          easing: EASE,
          fill: "both",
        }),
        held: true,
        nearest: d,
        releaseAt: 0,
        timer: 0,
      };
      tile.anim.onfinish = () => {
        // A finish event can arrive after the tile was already sent the other
        // way. Only a tile that is actually at rest gets acted on.
        if (tile.anim.playState !== "finished") return;
        if (tile.anim.playbackRate > 0) {
          settle(tile);
        } else {
          el.remove();
          tiles.delete(key);
        }
      };
      tiles.set(key, tile);
    };

    const onMove = (event: PointerEvent) => {
      // A finger dragging to scroll is not hovering.
      if (event.pointerType === "touch") return;
      const box = layer.getBoundingClientRect();
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;
      const cols = Math.ceil(box.width / cell);
      const rows = Math.ceil(box.height / cell);

      // Collects every cell within reach of a point, keeping the closest the
      // cursor came to each.
      const reach = (px: number, py: number, into: Map<string, Reach>) => {
        const c0 = Math.max(0, Math.floor((px - RADIUS) / cell));
        const c1 = Math.min(cols - 1, Math.floor((px + RADIUS) / cell));
        const r0 = Math.max(0, Math.floor((py - RADIUS) / cell));
        const r1 = Math.min(rows - 1, Math.floor((py + RADIUS) / cell));
        for (let row = r0; row <= r1; row++) {
          for (let col = c0; col <= c1; col++) {
            const d = Math.hypot(
              (col + 0.5) * cell - px,
              (row + 0.5) * cell - py,
            );
            if (d > RADIUS) continue;
            const key = `${col}:${row}`;
            const seen = into.get(key);
            if (!seen || d < seen.d) into.set(key, { col, row, d });
          }
        }
      };

      const current = new Map<string, Reach>();
      reach(x, y, current);

      // Move events are coalesced to the frame, so a fast pointer skips
      // ground. Walk the path in between so the wake stays unbroken; those
      // cells are reached and released in the same move.
      const passed = new Map<string, Reach>();
      if (last) {
        const dx = x - last.x;
        const dy = y - last.y;
        const length = Math.hypot(dx, dy);
        if (length <= MAX_SWEEP_PX) {
          const steps = Math.ceil(length / cell);
          for (let i = 1; i < steps; i++) {
            reach(last.x + (dx * i) / steps, last.y + (dy * i) / steps, passed);
          }
        }
      }
      last = { x, y };

      passed.forEach((cellReach, key) => engage(key, cellReach));
      current.forEach((cellReach, key) => engage(key, cellReach));

      const at = performance.now();
      tiles.forEach((tile, key) => {
        if (tile.held && !current.has(key)) release(tile, at);
      });
    };

    const onLeave = () => {
      const at = performance.now();
      tiles.forEach((tile) => {
        if (tile.held) release(tile, at);
      });
      last = null;
    };

    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      tiles.forEach((tile) => {
        clearTimeout(tile.timer);
        tile.anim.cancel();
      });
      tiles.clear();
      layer.replaceChildren();
    };
  }, []);

  // The tiles get their own layer, after the grid so they paint over it, and
  // outside the grid's edge fade so they show anywhere on the surface.
  const dark = tone === "dark";
  return (
    <>
      <div
        className={`${dark ? "grid-field" : "grid-field-light"} grid-dense`}
        aria-hidden
      />
      <div
        ref={ref}
        className={`${dark ? "flip-field" : "flip-field-light"} grid-dense${fade ? " flip-fade" : ""}`}
        aria-hidden
      />
    </>
  );
}
