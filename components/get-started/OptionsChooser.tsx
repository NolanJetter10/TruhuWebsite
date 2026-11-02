"use client";

import { ArrowRight, FileArrowUp, Sparkle, SquaresFour, type Icon } from "@phosphor-icons/react";
import type { Flow } from "./flows";
import { useFlows } from "./FlowProvider";

type Choice = "guide" | "samples" | "build";

/** In Nolan's order: rebuild, samples, build. */
const CHOICES: { flow: Choice & Flow; Icon: Icon }[] = [
  { flow: "guide", Icon: FileArrowUp },
  { flow: "samples", Icon: SquaresFour },
  { flow: "build", Icon: Sparkle },
];

/**
 * The chooser, `options`: three big bubbles under the card's title, "How
 * would you like to move forward?" (Bryan's line, in FlowPanel's header).
 * Each opens its own popup in place of this one, as if Bryan had: the guide
 * upload to rebuild last year's guide, the sample picker, or the form for a
 * client's guide.
 */
export function OptionsChooser() {
  const flows = useFlows();
  if (!flows) return null;
  const { choices } = flows.copy.options;

  return (
    <div data-section="flow-options" data-track-ignore className="grid gap-2.5 sm:gap-3">
      {CHOICES.map(({ flow, Icon }, i) => (
        <button
          key={flow}
          type="button"
          onClick={() => flows.open(flow, "options")}
          style={{ animationDelay: `${60 + i * 50}ms` }}
          className="bk-enter group flex items-center gap-3.5 rounded-[18px] bg-white px-4 py-4 text-left text-ink shadow-[0_18px_40px_-24px_rgba(2,8,18,0.9)] ring-1 ring-white/10 transition-[transform,box-shadow] duration-200 ease-out-expo outline-none hover:-translate-y-0.5 hover:ring-2 hover:ring-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400 sm:gap-4 sm:px-5 sm:py-5"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700 transition-colors group-hover:bg-blue-500 group-hover:text-white sm:size-12">
            <Icon weight="duotone" className="size-6" />
          </span>
          <span className="min-w-0 flex-1 text-[1rem] leading-snug font-semibold text-balance sm:text-[1.0625rem]">
            {choices[flow]}
          </span>
          <ArrowRight
            aria-hidden
            weight="bold"
            className="size-5 shrink-0 text-blue-700 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </button>
      ))}
    </div>
  );
}
