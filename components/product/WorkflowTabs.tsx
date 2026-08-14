"use client";

import { useRef, useState, type ReactNode } from "react";
import { cx } from "@/components/ui/primitives";

/**
 * ThreeFlow's pattern: labelled workflow stages act as tabs, and each swaps the
 * product view below. A broker sees their own process reflected back before
 * they read a word of copy. Transitions crossfade; they never slide.
 */
export function WorkflowTabs({
  stages,
  panels,
  label = "Workflow stages",
}: {
  stages: { id: string; label: string }[];
  panels: ReactNode[];
  label?: string;
}) {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = stages.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowRight") next = active === last ? 0 : active + 1;
    if (e.key === "ArrowLeft") next = active === 0 ? last : active - 1;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = last;
    if (next !== null) {
      e.preventDefault();
      setActive(next);
      tabRefs.current[next]?.focus();
    }
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="flex snap-x gap-1.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {stages.map((stage, i) => (
          <button
            key={stage.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            role="tab"
            id={`tab-${stage.id}`}
            aria-selected={i === active}
            aria-controls={`panel-${stage.id}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className={cx(
              "shrink-0 snap-start rounded-lg border px-3.5 py-2 text-[0.8125rem] font-semibold whitespace-nowrap transition-colors duration-150",
              i === active
                ? "border-white/25 bg-white text-navy-900"
                : "border-white/15 text-white/70 hover:border-white/30 hover:text-white",
            )}
          >
            <span className="mr-1.5 text-[11px] opacity-60 tabular">
              0{i + 1}
            </span>
            {stage.label}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {stages.map((stage, i) =>
          i === active ? (
            <div
              key={stage.id}
              role="tabpanel"
              id={`panel-${stage.id}`}
              aria-labelledby={`tab-${stage.id}`}
              tabIndex={0}
              className="anim-line card-shape-lg overflow-hidden border border-white/12 bg-white shadow-[0_28px_70px_-32px_rgba(0,0,0,0.5)]"
            >
              {panels[i]}
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}
