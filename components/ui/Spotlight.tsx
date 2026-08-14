"use client";

import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { cx } from "./primitives";

/**
 * A card lit from wherever the pointer is. The handler only writes two custom
 * properties; the gradient itself lives in CSS, so nothing re-renders on move.
 */
export function SpotlightCard({
  children,
  className,
  tone = "white",
  as: Tag = "div",
  style,
  /**
   * `none` is for cards that run their own content to the edge. It is a prop
   * rather than a `p-0` in `className` because Tailwind resolves conflicting
   * utilities by stylesheet order, where `p-0` is emitted before `p-6` and
   * would lose.
   */
  padding = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "white" | "paper" | "dark";
  as?: "div" | "li" | "article";
  style?: CSSProperties;
  padding?: "default" | "none";
}) {
  function track(event: PointerEvent<HTMLElement>) {
    const el = event.currentTarget;
    const box = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${event.clientX - box.left}px`);
    el.style.setProperty("--my", `${event.clientY - box.top}px`);
  }

  return (
    <Tag
      onPointerMove={track}
      style={style}
      className={cx(
        "spotlight card-shape relative overflow-hidden border transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1",
        padding === "default" && "p-6 sm:p-7",
        tone === "white" &&
          "border-line bg-white hover:border-blue-500/30 hover:shadow-[0_24px_50px_-28px_rgba(5,14,26,0.4)]",
        tone === "paper" &&
          "border-line bg-white hover:border-blue-500/30 hover:shadow-[0_24px_50px_-28px_rgba(5,14,26,0.4)]",
        tone === "dark" &&
          "spotlight-dark border-white/10 bg-white/[0.04] hover:border-white/25",
        className,
      )}
    >
      <div className="relative z-[1]">{children}</div>
    </Tag>
  );
}
