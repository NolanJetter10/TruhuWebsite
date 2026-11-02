"use client";

import { CalendarCheck, Sparkle, type Icon } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import { cx } from "@/components/ui/primitives";
import type { Flow } from "./flows";
import { useFlows } from "./FlowProvider";

/** --ease-out-expo */
const EXPO = "cubic-bezier(0.16, 1, 0.3, 1)";

/**
 * The two colours a call-card button comes in, from the page's palette on
 * dark: blue-400, the booking buttons' blue, for the way to the real Bryan;
 * green-400, the colour of the page's go-ahead buttons, for building a guide.
 * Each glows in its own colour, at rest and at the top of each breath. The
 * rest glow is also the button's own shadow, so the breath starts from it and
 * a still button keeps it. Written out in full so Tailwind finds them.
 */
const TONES = {
  blue: {
    button: "bg-blue-400 hover:bg-[#6cc9ff] shadow-[0_0_14px_0_rgba(56,182,255,0.35)]",
    rest: "0 0 14px 0 rgba(56, 182, 255, 0.35)",
    peak: "0 0 28px 5px rgba(56, 182, 255, 0.75)",
  },
  green: {
    button: "bg-green-400 hover:bg-[#7ae47f] shadow-[0_0_14px_0_rgba(87,217,94,0.35)]",
    rest: "0 0 14px 0 rgba(87, 217, 94, 0.35)",
    peak: "0 0 28px 5px rgba(87, 217, 94, 0.7)",
  },
} as const;

export type CallCardTone = keyof typeof TONES;

/**
 * One of the call card's highlighted buttons: a pill in one of two colours,
 * with an icon and a label. During a call it rises in once shown, then
 * breathes: a slow swell of its glow and size, which stays still for anyone
 * who asks for reduced motion. `still` (before a call, where nothing is
 * happening yet) skips both. Smaller in the floating corner window.
 *
 * "Talk to the real Bryan" and "Build a guide now" are two of these, drawn
 * the same apart from their colour, so they read as a pair.
 */
export function CallCardButton({
  tone,
  icon: Glyph,
  label,
  onClick,
  compact = false,
  still = false,
  wrap = false,
  disabled = false,
  className,
}: {
  tone: CallCardTone;
  icon: Icon;
  label: string;
  onClick: () => void;
  compact?: boolean;
  still?: boolean;
  /** Lets a long label wrap, beside "Talk to Bryan's AI" before a call. */
  wrap?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const { button, rest, peak } = TONES[tone];

  // Played each time it's shown, so it comes up again after its popup closes.
  useEffect(() => {
    const el = ref.current;
    if (still || !el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rise = el.animate(
      [
        { opacity: 0, translate: "0 0.75rem", scale: "0.94" },
        { opacity: 1, translate: "0 0", scale: "1" },
      ],
      { duration: 560, delay: 200, easing: EXPO, fill: "backwards" },
    );
    const breathe = el.animate(
      [
        { scale: "1", boxShadow: rest },
        { scale: "1.04", boxShadow: peak },
        { scale: "1", boxShadow: rest },
      ],
      { duration: 2400, delay: 900, iterations: Infinity, easing: "ease-in-out" },
    );
    return () => {
      rise.cancel();
      breathe.cancel();
    };
  }, [still, rest, peak]);

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "sheen flex items-center justify-center rounded-full font-semibold text-ink-950 transition-colors disabled:cursor-wait disabled:opacity-70",
        button,
        wrap ? "max-w-[14rem] text-left text-balance" : "whitespace-nowrap",
        compact
          ? "gap-1.5 px-3 py-1 text-[0.75rem] sm:text-[0.8125rem]"
          : wrap
            ? "gap-2 px-4 py-2.5 text-[0.875rem] leading-tight"
            : "gap-2 px-5 py-2.5 text-[0.9375rem]",
        className,
      )}
    >
      <Glyph weight="fill" className={cx("relative z-[2] shrink-0", compact ? "size-3.5 sm:size-4" : "size-5")} />
      <span className="relative z-[2]">{label}</span>
    </button>
  );
}

/** The popups that "Build a guide now" leads to: it hides while one is open. */
const BUILD_FLOWS = new Set<Flow>(["options", "samples", "build", "guide"]);

/**
 * Which of the call card's two buttons show: each hides while the popup it
 * leads to is open, as there's nowhere further for it to go.
 */
export function useCallCardActions() {
  const flows = useFlows();
  const flow = flows?.flow ?? null;
  const realBryan = flows !== null && flow !== "calendar";
  const build = flows !== null && !(flow && BUILD_FLOWS.has(flow));
  return { realBryan, build, any: realBryan || build, both: realBryan && build };
}

/**
 * Where the pair sits on the call card during a live call:
 * - "circle": in the Call look, under his photo in place of his name.
 * - "overlay": in the Video look, over the bottom of the call, under the
 *   captions.
 */
export type CallCardPlacement = "circle" | "overlay";

/**
 * "Talk to the real Bryan" and "Build a guide now", side by side and the same
 * width, so they sit symmetrically under Bryan in a live call. The first opens
 * the booking calendar, with a line of Bryan's own for it in place of the
 * calendar's usual one, cutting off whatever he was saying; the second opens
 * the options ("How would you like to move forward?").
 *
 * Where two don't fit side by side (a box under 26rem across, a phone, the
 * floating corner window), they stack, still the same width. The Video look's
 * corner window on a phone (11rem by 9.6rem) has room for neither, so there
 * it shows neither until the popup closes.
 */
export function CallCardActions({
  placement,
  compact = false,
}: {
  placement: CallCardPlacement;
  compact?: boolean;
}) {
  const flows = useFlows();
  const shown = useCallCardActions();
  if (!flows || !shown.any) return null;
  const { realBryan, buildNow } = flows.copy;

  const buttons = [
    shown.realBryan && (
      <CallCardButton
        key="realBryan"
        tone="blue"
        icon={CalendarCheck}
        label={realBryan.label}
        onClick={() => flows.open("calendar", "realBryan", realBryan.line)}
        compact={compact}
        className="w-full"
      />
    ),
    shown.build && (
      <CallCardButton
        key="build"
        tone="green"
        icon={Sparkle}
        label={buildNow.label}
        onClick={() => flows.open("options", "buildButton")}
        compact={compact}
        className="w-full"
      />
    ),
  ];

  const pair = (
    <div
      className={cx(
        "grid w-fit max-w-full",
        compact
          ? "grid-cols-1 gap-1"
          : // Side by side once there's room for both, measured on the
            // nearest container: the Call look's circle area, or the
            // overlay's own (below).
            shown.both && "gap-2 @min-[26rem]:grid-cols-2 @min-[26rem]:gap-2.5",
      )}
    >
      {buttons}
    </div>
  );

  if (placement === "circle") return pair;
  return (
    <div className={cx("flex justify-center @container", compact ? "mb-1.5 max-sm:hidden" : "mb-3")}>{pair}</div>
  );
}
