"use client";

import { useEffect, useRef } from "react";

/**
 * Brand light that follows the cursor across a lit surface.
 *
 * Three blurred fields share one pointer position but ease toward it at
 * different speeds: a small teal core that keeps up, a blue field that lags,
 * and a green one that lags further still. The separation is what reads as
 * depth — a single blob tracking exactly would just look like a big cursor.
 *
 * Nothing here re-renders. The handler writes two custom properties onto the
 * layer and CSS does the rest, throttled to one reflow per frame.
 */
export function PointerGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = ref.current;
    // The layer is rendered as a direct child of the lit <section>, so the
    // section is what the pointer is tracked against.
    const host = layer?.parentElement;
    if (!layer || !host) return;

    let frame = 0;
    let clientX = 0;
    let clientY = 0;

    const apply = () => {
      frame = 0;
      const box = host.getBoundingClientRect();
      layer.style.setProperty("--px", `${clientX - box.left}px`);
      layer.style.setProperty("--py", `${clientY - box.top}px`);
      layer.dataset.active = "true";
    };

    const onMove = (event: PointerEvent) => {
      clientX = event.clientX;
      clientY = event.clientY;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onLeave = () => {
      layer.dataset.active = "false";
    };

    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className="pointer-glow" data-active="false" aria-hidden>
      <span />
      <span />
      <span />
    </div>
  );
}
