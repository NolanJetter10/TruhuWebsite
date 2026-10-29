"use client";

import { X } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useFlows } from "./FlowProvider";
import { inBryanBox, stillPageAround } from "./inert";

/**
 * The benefits-guides flipbook viewer, copied into public/flipbook/ with a
 * static copy of the shell the API serves for a published guide (see the
 * README there). It runs in a frame so its global CSS can't reach the site.
 */
const VIEWER = "/flipbook/kindlerye.html";

/**
 * Kindlerye's guide as a flipbook, over the whole of /BryanKleppe, when the
 * agent sends `open_flipbook`. A slim bar on top holds Bryan's line and the
 * close button; the viewer fills the rest, on a phone as well. The close
 * button or Esc (from the page or from inside the viewer) closes it.
 *
 * It renders into <body>, above every other layer of the page (the consent
 * banner included), and while it's open the rest of the page is inert and
 * holds still, so neither Tab nor a scroll wanders behind it. Bryan's box is
 * the exception: it floats above the flipbook and stays live (see inert.ts),
 * so it shows who's talking and the bar doesn't repeat his face.
 */
export function FlipbookOverlay() {
  const flows = useFlows();
  const open = flows?.flow === "flipbook";
  const close = flows?.close;
  const dialog = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);

  const onKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") close?.("escape");
    },
    [close],
  );

  useEffect(() => {
    const node = dialog.current;
    if (!open || !node) return;

    const before = document.activeElement;
    const wake = stillPageAround(node);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // A visitor typing to Bryan keeps the caret where it is.
    if (!inBryanBox(before)) node.focus({ preventScroll: true });
    if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
    }
    document.addEventListener("keydown", onKey);

    return () => {
      // The frame's listener goes with the frame.
      document.removeEventListener("keydown", onKey);
      wake();
      document.body.style.overflow = overflow;
      if (before instanceof HTMLElement && before.isConnected) before.focus({ preventScroll: true });
    };
  }, [open, onKey]);

  if (!open || !flows) return null;

  return createPortal(
    <div
      ref={dialog}
      role="dialog"
      // Not aria-modal: Bryan's box, outside it, stays usable. The rest of
      // the page is inert instead.
      aria-labelledby="flipbook-line"
      tabIndex={-1}
      data-section="flow-flipbook"
      className="fixed inset-0 z-[80] flex flex-col bg-ink-900 outline-none"
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-2 sm:px-5 sm:py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[0.6875rem] font-semibold tracking-wide text-blue-300 uppercase">
            {flows.copy.speaker}
          </p>
          <p
            id="flipbook-line"
            aria-live="polite"
            className="mt-0.5 text-[0.875rem] leading-snug text-white sm:text-[1rem]"
          >
            {flows.line}
          </p>
        </div>
        <button
          type="button"
          onClick={() => flows.close("button")}
          aria-label={flows.copy.close}
          title={flows.copy.close}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <X className="size-5" />
        </button>
      </div>
      <iframe
        ref={frame}
        src={VIEWER}
        title={flows.copy.flipbook.frameTitle}
        // Esc inside the viewer never reaches this document, so listen there
        // too. Same origin, so the frame's window is reachable.
        onLoad={() => frame.current?.contentWindow?.addEventListener("keydown", onKey)}
        className="block min-h-0 w-full flex-1 border-0 bg-[#52555c]"
      />
    </div>,
    document.body,
  );
}
