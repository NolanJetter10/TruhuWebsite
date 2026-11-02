"use client";

import { CaretRight, PlayCircle, Sparkle, SquaresFour, type Icon } from "@phosphor-icons/react";
import { cx } from "@/components/ui/primitives";
import type { Flow } from "./flows";
import { useFlows } from "./FlowProvider";

type Link = { flow: Flow; key: "samples" | "build" | "trailer"; Icon: Icon; tint: string };

/** Written out in full so Tailwind finds them. */
const LINKS: Link[] = [
  { flow: "samples", key: "samples", Icon: SquaresFour, tint: "bg-blue-400/15 text-blue-400" },
  { flow: "options", key: "build", Icon: Sparkle, tint: "bg-green-500/15 text-green-400" },
  { flow: "trailer", key: "trailer", Icon: PlayCircle, tint: "bg-blue-400/15 text-blue-400" },
];

/**
 * The three ways in under the chat: the sample picker, the options ("Build a
 * guide now", the same as on the call card) and the trailer. Each opens the
 * popup Bryan would open for the same ask, logged as `from: "links"`, so
 * every way in shares one flow and one set of numbers.
 */
export function FlowLinks() {
  const flows = useFlows();
  if (!flows) return null;
  const copy = flows.copy.links;

  return (
    <nav
      data-section="links"
      aria-label={copy.label}
      style={{ animation: "hero-in 800ms var(--ease-out-expo) 460ms both" }}
    >
      <ul className="card-shape-sm divide-y divide-white/10 overflow-hidden border border-white/10 bg-white/[0.04] backdrop-blur-sm">
        {LINKS.map(({ flow, key, Icon, tint }) => (
          <li key={key}>
            <button
              type="button"
              onClick={() => flows.open(flow, "links")}
              className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors outline-none hover:bg-white/[0.06] focus-visible:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-inset lg:[@media(max-height:820px)]:py-2"
            >
              <span className={cx("grid size-7 shrink-0 place-items-center rounded-full", tint)}>
                <Icon weight="fill" className="size-4" />
              </span>
              <span className="min-w-0 flex-1 text-[0.9375rem] leading-snug font-semibold text-white">
                {copy[key]}
              </span>
              <CaretRight
                aria-hidden
                weight="bold"
                className="size-4 shrink-0 text-slate-300 transition-[translate,color] duration-200 group-hover:translate-x-0.5 group-hover:text-white"
              />
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
