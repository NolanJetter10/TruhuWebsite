"use client";

import { X } from "@phosphor-icons/react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "@/components/ui/primitives";
import type { GET_STARTED_PAGE } from "@/lib/content";
import { BookingWidget } from "./BookingWidget";
import { DELIVERABLE_TITLE_ID, DeliverableViewer } from "./DeliverableViewer";
import type { Flow } from "./flows";
import { useFlows } from "./FlowProvider";
import { GuideUpload } from "./GuideUpload";
import { inBryanBox, stillPageAround } from "./inert";
import { MicrositeCard } from "./MicrositeCard";

type Page = typeof GET_STARTED_PAGE;
/** The flipbook has an overlay of its own (FlipbookOverlay). */
type Shown = Exclude<Flow, "flipbook">;

/**
 * Each flow's card, sized for what it holds: the calendar large, the upload
 * medium, the deliverables' pages the full height at a reading width, the
 * microsite wide. On a phone every card spans the screen bar a margin.
 * Written out in full so Tailwind finds them.
 */
const SIZE: Record<Shown, string> = {
  // Sized by the calendar inside, which growCalendar scales to the screen.
  calendar: "sm:w-fit",
  guide: "sm:max-w-[36rem]",
  sampleGuide: "h-full sm:max-w-[54rem]",
  flyer: "h-full sm:max-w-[54rem]",
  microsite: "h-full sm:max-h-[54rem] sm:max-w-[68rem]",
};
/** The cards that fill the height they're given, rather than fit their content. */
const FILLS = new Set<Shown>(["sampleGuide", "flyer", "microsite"]);

/** Room kept between the card and Bryan's floating box. */
const PIP_GAP = 12;

/** Where Bryan's box comes to rest in the corner, if it's floating. */
function pipRest(): DOMRect | null {
  const pip = document.querySelector<HTMLElement>('[data-bryan-pip="floating"]');
  if (!pip) return null;
  // On its way to the corner, the end of its move is where it will be.
  for (const animation of pip.getAnimations()) {
    if (!(animation.effect instanceof KeyframeEffect)) continue;
    const end = animation.effect.getKeyframes().at(-1);
    const box = [end?.left, end?.top, end?.width, end?.height].map((v) =>
      typeof v === "string" && v.endsWith("px") ? parseFloat(v) : NaN,
    );
    if (box.every(Number.isFinite)) return new DOMRect(box[0], box[1], box[2], box[3]);
  }
  return pip.getBoundingClientRect();
}

const px = (value: string, otherwise: number) => (value.endsWith("px") ? parseFloat(value) : otherwise);

/**
 * Keeps the card clear of Bryan's box in the corner. If the centred card
 * would run under it, the card moves left just far enough, or sits in the
 * space above the box where there isn't room beside it (a phone), whichever
 * leaves the card bigger.
 */
function makeRoom(layer: HTMLElement, card: HTMLElement, fills: boolean) {
  layer.style.paddingRight = "";
  layer.style.paddingBottom = "";
  const pip = pipRest();
  if (!pip) return;
  const vw = layer.clientWidth;
  const vh = layer.clientHeight;
  const pad = parseFloat(getComputedStyle(layer).paddingLeft);
  const w = Math.min(card.offsetWidth, vw - 2 * pad);
  const h = Math.min(fills ? px(getComputedStyle(card).maxHeight, Infinity) : card.offsetHeight, vh - 2 * pad);
  const edge = pip.left - PIP_GAP;
  const ceiling = pip.top - PIP_GAP;
  if ((vw + w) / 2 <= edge || (vh + h) / 2 <= ceiling) return;
  // Beside: centred and shifted left, or, if that's too tight, as wide as the
  // room left of the box allows.
  const shift = (vw + w) / 2 - edge;
  const beside = Math.min((edge - pad) / w, 1);
  const above = Math.min((ceiling - pad) / h, 1);
  if (beside >= above) layer.style.paddingRight = `${Math.min(pad + 2 * shift, vw - edge)}px`;
  else layer.style.paddingBottom = `${vh - ceiling}px`;
}

/** How much bigger the overlay draws the calendar than the column, at most. */
const MAX_GROW = 1.35;

/**
 * Draws the overlay's calendar as the column's, made bigger: laid out at the
 * column's width, then zoomed to fill the room the card has (up to
 * MAX_GROW). Being the same layout scaled up, it grows out of the column
 * without stretching. Where there isn't room for the column's width (a
 * phone), it just fills the card.
 */
function growCalendar(layer: HTMLElement, header: HTMLElement, wrap: HTMLElement) {
  wrap.style.zoom = "";
  wrap.style.width = "";
  // The column's width, 35rem; wider when the page is one column.
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const base = Math.min(document.getElementById("calendar")?.offsetWidth || Infinity, 35 * rem);
  const box = getComputedStyle(layer);
  const body = wrap.parentElement ? getComputedStyle(wrap.parentElement) : null;
  const aroundW = body ? parseFloat(body.paddingLeft) + parseFloat(body.paddingRight) : 0;
  const aroundH =
    header.offsetHeight + (body ? parseFloat(body.paddingTop) + parseFloat(body.paddingBottom) : 0);
  const roomW = layer.clientWidth - parseFloat(box.paddingLeft) - parseFloat(box.paddingRight) - aroundW;
  const roomH = layer.clientHeight - parseFloat(box.paddingTop) - parseFloat(box.paddingBottom) - aroundH;
  if (roomW < base) return;
  wrap.style.width = `${base}px`;
  const zoom = Math.max(1, Math.min(MAX_GROW, roomW / base, roomH / wrap.offsetHeight));
  wrap.style.zoom = String(zoom);
}

/** Sizes the card for its flow and keeps it clear of Bryan's box. */
function fitCard(
  layer: HTMLElement,
  card: HTMLElement,
  header: HTMLElement | null,
  wrap: HTMLElement | null,
  flow: Shown,
) {
  layer.style.paddingRight = "";
  layer.style.paddingBottom = "";
  const grow = flow === "calendar" && header && wrap ? () => growCalendar(layer, header, wrap) : null;
  grow?.();
  makeRoom(layer, card, FILLS.has(flow));
  // Moved aside for Bryan's box: fit the calendar to the room that's left.
  if (grow && (layer.style.paddingRight || layer.style.paddingBottom)) grow();
}

/** Below Tailwind's `lg` the page is one column and the calendar isn't beside Bryan. */
const STACKED = "(max-width: 63.99rem)";
const EXPO = "cubic-bezier(0.16, 1, 0.3, 1)";
const SETTLE = "cubic-bezier(0.32, 0.72, 0, 1)";

type Look = { transform: string; opacity: string };
const look = (el: HTMLElement): Look => {
  const style = getComputedStyle(el);
  return { transform: style.transform, opacity: style.opacity };
};

/** Scales the card by `s` about its centre (its transform origin is its top left). */
function about(card: HTMLElement, s: number, dy = 0) {
  const w = card.offsetWidth;
  const h = card.offsetHeight;
  return `translate(${((1 - s) * w) / 2}px, ${((1 - s) * h) / 2 + dy}px) scale(${s})`;
}

/** The transform that puts the card's calendar exactly over `to`. */
function onto(card: HTMLElement, calendar: HTMLElement, to: DOMRect) {
  const c = card.getBoundingClientRect();
  const w = calendar.getBoundingClientRect();
  const sx = to.width / w.width;
  const sy = to.height / w.height;
  const tx = to.left - c.left - sx * (w.left - c.left);
  const ty = to.top - c.top - sy * (w.top - c.top);
  return `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
}

/** The page's own calendar, if it's beside the chat and mostly on screen. */
function columnCalendar() {
  const el = document.getElementById("calendar");
  if (!el || window.matchMedia(STACKED).matches) return null;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  const seen = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
  return seen / r.height >= 0.4 ? el : null;
}

/**
 * The right column of /BryanKleppe, and the overlay the agent opens over the
 * whole page: a card in the centre of the screen over a dimmed, blurred
 * page, sized for the flow it holds. Bryan's current line sits at its top.
 * The close button, Esc or a click outside the card closes it.
 *
 * The calendar grows out of the column: the card starts exactly over the
 * page's own calendar, which hides while it's open, and moves and grows to
 * the centre, then shrinks back into the column on close. On a phone, or
 * with the column's calendar off screen, it grows from the centre like the
 * rest.
 *
 * While it's open the rest of the page is inert and holds still, except
 * Bryan's box, which floats above it in the corner (see inert.ts) and which
 * the card keeps clear of (makeRoom). The flipbook isn't shown here: it
 * covers the whole page (FlipbookOverlay).
 */
export function FlowPanel({
  booking,
  host,
  children,
}: {
  booking: Page["booking"];
  host: Page["host"];
  /** The column's usual content. */
  children: ReactNode;
}) {
  const flows = useFlows();
  const flow: Shown | null = flows?.flow && flows.flow !== "flipbook" ? flows.flow : null;
  const close = flows?.close;

  // The card stays up after the flow closes, until its way out has played.
  const [last, setLast] = useState<Shown | null>(null);
  if (flow && flow !== last) setLast(flow);
  const shown = flow ?? last;
  /** The deliverables show their pages alone, with no header. */
  const bare = shown === "sampleGuide" || shown === "flyer";

  const layer = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const chrome = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLDivElement>(null);
  /** Holds the calendar, drawn bigger (growCalendar). */
  const grow = useRef<HTMLDivElement>(null);
  const previous = useRef<Shown | null>(null);
  /** The flow on its way out, if any. */
  const leaving = useRef<Shown | null>(null);
  const running = useRef<Animation[]>([]);
  /** The column's calendar, while the card stands in for it. */
  const hidden = useRef<HTMLElement | null>(null);

  const open = flow !== null;

  // While it's open: the rest of the page inert and still, Esc to close, and
  // focus in the card, unless the visitor is typing to Bryan.
  useLayoutEffect(() => {
    const node = layer.current;
    if (!open || !node || !close) return;
    const before = document.activeElement;
    const wake = stillPageAround(node);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!inBryanBox(before)) card.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close("escape");
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      wake();
      document.body.style.overflow = overflow;
      const active = document.activeElement;
      const lost = !active || active === document.body || node.contains(active);
      if (lost && before instanceof HTMLElement && before.isConnected) {
        before.focus({ preventScroll: true });
      }
    };
  }, [open, close]);

  // The way in, the way out, and the change from one flow to another.
  useLayoutEffect(() => {
    const was = previous.current;
    previous.current = flow;
    const cardEl = card.current;
    const backdropEl = backdrop.current;
    if (flow === was || !cardEl || !backdropEl) return;
    const parts = [chrome.current, header.current].filter((el): el is HTMLDivElement => el !== null);
    const calendar = cardEl.querySelector<HTMLElement>("#flow-calendar");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Pick up from wherever an interrupted animation had got to.
    const reopened = flow !== null && flow === leaving.current && running.current.length > 0;
    leaving.current = flow ? null : was;
    const from = { card: look(cardEl), backdrop: look(backdropEl), parts: parts.map(look) };
    for (const animation of running.current) animation.cancel();
    running.current = [];

    const play = (el: HTMLElement, frames: Keyframe[], options: KeyframeAnimationOptions) => {
      const animation = el.animate(frames, options);
      running.current.push(animation);
      return animation;
    };
    const showColumn = () => {
      if (hidden.current) hidden.current.style.visibility = "";
      hidden.current = null;
    };

    if (!flow) {
      // Closing.
      const done = () => {
        showColumn();
        running.current = [];
        setLast(null);
      };
      const column = hidden.current && !still ? columnCalendar() : null;
      let out: Animation;
      if (column && calendar) {
        out = play(cardEl, [{ transform: from.card.transform }, { transform: onto(cardEl, calendar, column.getBoundingClientRect()) }], {
          duration: 460,
          easing: SETTLE,
          fill: "forwards",
        });
        parts.forEach((el, i) =>
          play(el, [{ opacity: from.parts[i].opacity }, { opacity: 0 }], { duration: 220, easing: "ease-out", fill: "forwards" }),
        );
        play(backdropEl, [{ opacity: from.backdrop.opacity }, { opacity: 0 }], { duration: 400, easing: "ease-out", fill: "forwards" });
      } else {
        out = play(
          cardEl,
          [
            { transform: from.card.transform, opacity: from.card.opacity },
            { transform: still ? "none" : about(cardEl, 0.96, 6), opacity: 0 },
          ],
          { duration: still ? 140 : 200, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" },
        );
        play(backdropEl, [{ opacity: from.backdrop.opacity }, { opacity: 0 }], {
          duration: still ? 140 : 240,
          easing: "ease-out",
          fill: "forwards",
        });
      }
      out.onfinish = done;
      return;
    }

    if (flow !== "calendar") showColumn();
    if (layer.current) fitCard(layer.current, cardEl, header.current, grow.current, flow);

    if (reopened) {
      // Opened again on its way out: back to where it was.
      play(cardEl, [{ transform: from.card.transform, opacity: from.card.opacity }, { transform: "none", opacity: 1 }], {
        duration: 420,
        easing: EXPO,
      });
      parts.forEach((el, i) => play(el, [{ opacity: from.parts[i].opacity }, { opacity: 1 }], { duration: 300, easing: "ease-out" }));
      play(backdropEl, [{ opacity: from.backdrop.opacity }, { opacity: 1 }], { duration: 300, easing: "ease-out" });
      return;
    }

    if (was !== null) {
      // One flow straight to another: the card is already up, so just settle.
      if (still) return;
      play(cardEl, [{ transform: about(cardEl, 0.98), opacity: 0.4 }, { transform: "none", opacity: 1 }], {
        duration: 320,
        easing: EXPO,
      });
      return;
    }

    // Opening.
    const column = flow === "calendar" && !still ? columnCalendar() : null;
    if (column && calendar) {
      const start = onto(cardEl, calendar, column.getBoundingClientRect());
      column.style.visibility = "hidden";
      hidden.current = column;
      play(cardEl, [{ transform: start }, { transform: "none" }], { duration: 640, easing: EXPO });
      parts.forEach((el) =>
        play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 380, delay: 100, easing: "ease-out", fill: "backwards" }),
      );
      play(backdropEl, [{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: "ease-out" });
      return;
    }
    play(
      cardEl,
      [
        { transform: still ? "none" : about(cardEl, 0.95, 12), opacity: 0 },
        { transform: "none", opacity: 1 },
      ],
      { duration: still ? 140 : 460, easing: EXPO },
    );
    play(backdropEl, [{ opacity: 0 }, { opacity: 1 }], { duration: still ? 140 : 320, easing: "ease-out" });
  }, [flow]);

  // Room for Bryan's box again when the window or the box changes size.
  useEffect(() => {
    const layerEl = layer.current;
    const cardEl = card.current;
    const pip = document.querySelector("[data-bryan-pip]");
    if (!flow || !layerEl || !cardEl) return;
    const where = () => {
      const r = pipRest();
      return r ? `${r.left} ${r.top} ${r.width} ${r.height}` : "";
    };
    // The way in already made room for where the box is headed.
    let rest = where();
    const refit = () => fitCard(layerEl, cardEl, header.current, grow.current, flow);
    const update = () => {
      const now = where();
      if (now === rest) return;
      rest = now;
      refit();
    };
    const onResize = () => {
      rest = where();
      refit();
    };
    const watch = new ResizeObserver(update);
    if (pip) watch.observe(pip);
    window.addEventListener("resize", onResize);
    return () => {
      watch.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [flow]);

  // Leaving the page with the card up still puts the column's calendar back.
  useEffect(
    () => () => {
      if (hidden.current) hidden.current.style.visibility = "";
    },
    [],
  );

  return (
    <div>
      <div className="space-y-3.5">{children}</div>

      {shown && flows
        ? createPortal(
            <div
              ref={layer}
              // On its way out it lets clicks through to the page.
              inert={!flow}
              className={cx(
                "fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6",
                // While a deliverable's page is exploded, a click anywhere puts it away.
                "has-[[data-exploded]]:cursor-zoom-out",
                !flow && "pointer-events-none",
              )}
            >
              <div
                ref={backdrop}
                aria-hidden
                onClick={() => flows.close("backdrop")}
                className="absolute inset-0 bg-ink-950/60 backdrop-blur-[6px]"
              />
              <div
                ref={card}
                role="dialog"
                aria-labelledby={bare ? DELIVERABLE_TITLE_ID : "flow-line"}
                tabIndex={-1}
                data-flow={shown}
                className={cx(
                  "relative flex max-h-full w-full min-w-0 origin-top-left flex-col outline-none",
                  SIZE[shown],
                )}
              >
                <div
                  ref={chrome}
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[22px] border border-white/10 bg-ink-900 shadow-[0_40px_120px_-30px_rgba(2,8,18,0.95)]"
                />
                {bare ? (
                  // The pages take the whole card; the close button floats over
                  // the first one, dark enough to read on a white page.
                  <button
                    type="button"
                    onClick={() => flows.close("button")}
                    aria-label={flows.copy.close}
                    title={flows.copy.close}
                    className="absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-full bg-ink-950/75 text-white shadow-[0_6px_20px_-6px_rgba(2,8,18,0.8)] ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-ink-950/95 sm:top-4 sm:right-4"
                  >
                    <X className="size-5" />
                  </button>
                ) : (
                  // Wraps to the card's width rather than widening it.
                  <div
                    ref={header}
                    className="relative flex shrink-0 items-start gap-3 px-4 pt-4 pb-3 [contain:inline-size] sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.6875rem] font-semibold tracking-wide text-blue-300 uppercase">
                        {flows.copy.speaker}
                      </p>
                      <p id="flow-line" aria-live="polite" className="mt-0.5 text-[1rem] leading-snug text-white">
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
                )}
                <div
                  className={
                    bare
                      ? "relative min-h-0 flex-1 overflow-hidden rounded-[22px]"
                      : "relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3 sm:px-4 sm:pb-4"
                  }
                >
                  {shown === "calendar" ? (
                    <div ref={grow}>
                      <BookingWidget
                        copy={booking}
                        hostName={host.name}
                        hostPhoto={host.photo}
                        section="flow-calendar"
                        tall
                      />
                    </div>
                  ) : shown === "guide" ? (
                    <GuideUpload />
                  ) : shown === "microsite" ? (
                    <MicrositeCard />
                  ) : (
                    // Keyed, so the other deliverable starts at its first page.
                    <DeliverableViewer key={shown} kind={shown} />
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
