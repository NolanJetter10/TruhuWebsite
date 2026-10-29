"use client";

import { CalendarCheck } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import { useFlows } from "./FlowProvider";

/** --ease-out-expo */
const EXPO = "cubic-bezier(0.16, 1, 0.3, 1)";
/**
 * Its glow at rest and at the top of each breath, in blue-400, the page's
 * blue on dark. The rest glow is also the button's own shadow, so the breath
 * starts from it and a still button keeps it.
 */
const GLOW_REST = "0 0 14px 0 rgba(56, 182, 255, 0.35)";
const GLOW_PEAK = "0 0 28px 5px rgba(56, 182, 255, 0.75)";

/**
 * "Talk to the real Bryan", over the bottom of a live call (BryanCall). It
 * opens the booking calendar, and Bryan says a line of his own for it in
 * place of the calendar's usual one, cutting off whatever he was saying.
 *
 * Blue, the colour of the page's booking buttons, so it reads as a way to the
 * person rather than another call control beside the green start and red end.
 * It rises in once the call is live, then breathes: a slow swell of its glow
 * and size, which stays still for anyone who asks for reduced motion. Hidden
 * while the calendar is already open; smaller in the floating corner window.
 */
export function RealBryanButton({
  compact = false,
  cramped = false,
}: {
  compact?: boolean;
  /**
   * A corner window with no room for another row on a phone (the Video
   * look's, 11rem by 9.6rem): left out below `sm`, where it would push the
   * caption up under the window's label. It's back once the popup closes.
   */
  cramped?: boolean;
}) {
  const flows = useFlows();
  const ref = useRef<HTMLButtonElement>(null);
  const shown = flows !== null && flows.flow !== "calendar";

  // Played on each showing, so it comes up again after the calendar closes.
  useEffect(() => {
    const button = ref.current;
    if (!shown || !button || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rise = button.animate(
      [
        { opacity: 0, translate: "0 0.75rem", scale: "0.94" },
        { opacity: 1, translate: "0 0", scale: "1" },
      ],
      { duration: 560, delay: 200, easing: EXPO, fill: "backwards" },
    );
    const breathe = button.animate(
      [
        { scale: "1", boxShadow: GLOW_REST },
        { scale: "1.04", boxShadow: GLOW_PEAK },
        { scale: "1", boxShadow: GLOW_REST },
      ],
      { duration: 2400, delay: 900, iterations: Infinity, easing: "ease-in-out" },
    );
    return () => {
      rise.cancel();
      breathe.cancel();
    };
  }, [shown]);

  if (!flows || !shown) return null;
  const { label, line } = flows.copy.realBryan;

  return (
    <div className={`flex justify-center ${compact ? "mb-1.5" : "mb-3"} ${cramped ? "max-sm:hidden" : ""}`}>
      <button
        ref={ref}
        type="button"
        onClick={() => flows.open("calendar", "realBryan", line)}
        className={`sheen flex items-center rounded-full bg-blue-400 font-semibold whitespace-nowrap text-ink-950 shadow-[0_0_14px_0_rgba(56,182,255,0.35)] transition-colors hover:bg-[#6cc9ff] ${
          compact
            ? "gap-1.5 px-3 py-1 text-[0.75rem] sm:text-[0.8125rem]"
            : "gap-2 px-5 py-2.5 text-[0.9375rem]"
        }`}
      >
        <CalendarCheck weight="fill" className={compact ? "size-3.5 sm:size-4" : "size-5"} />
        {label}
      </button>
    </div>
  );
}
