"use client";

import { CaretDown } from "@phosphor-icons/react";
import Image from "next/image";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type SyntheticEvent,
} from "react";
import { track } from "@/lib/analytics/tracker";
import { DELIVERABLES, type DeliverableKind } from "./deliverables";
import { useFlows } from "./FlowProvider";
import { inBryanBox } from "./inert";

/** The deliverable's title, which names the overlay (FlowPanel) for screen readers. */
export const DELIVERABLE_TITLE_ID = "flow-deliverable-title";

const EXPO = "cubic-bezier(0.16, 1, 0.3, 1)";

/**
 * The exploded view: a region of one page, magnified, in a card over the
 * viewer. Sizes are in CSS pixels, relative to the viewer.
 */
type Lens = {
  page: number;
  /** The card. */
  left: number;
  top: number;
  width: number;
  height: number;
  /** The whole page at the lens's magnification, and the part of it shown. */
  pageWidth: number;
  pageHeight: number;
  x: number;
  y: number;
  /** The clicked spot, where the card grows from. */
  fromX: number;
  fromY: number;
};

/**
 * One of Kindlerye's sample deliverables in the overlay (FlowPanel): the
 * reworked benefits guide or the open enrollment flyer, every page stacked in
 * one scroll, each as wide as the overlay.
 *
 * The scroll has focus when it opens, so the arrow keys, Page Up/Down and
 * Space move through it. A pill at the foot says which page is in view and
 * jumps to any other. The first two pages load at once and the rest as they
 * near the view; each has its size set, so nothing shifts as they arrive.
 *
 * A click on a page (or Enter on it) explodes that spot: a card over the
 * viewer shows the region around it magnified, sharp enough for the small
 * print. A click anywhere, Esc, or a scroll puts it away.
 *
 * The pages are plain WebP files (next/image, unoptimized): the optimizer
 * would re-encode them at quality 75, which blurs the small print.
 */
export function DeliverableViewer({ kind }: { kind: DeliverableKind }) {
  const flows = useFlows();
  const doc = DELIVERABLES[kind];
  const pages = doc.pages;
  const [index, setIndex] = useState(0);
  const [lens, setLens] = useState<Lens | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const dim = useRef<HTMLDivElement>(null);
  const dismiss = useRef<HTMLButtonElement>(null);
  /** A page picked in the pill, so arriving there counts as a pick, not a scroll. */
  const picked = useRef<number | null>(null);
  /** The page the lens came from, to hand focus back to. */
  const opener = useRef<HTMLElement | null>(null);
  const closing = useRef(false);
  /** When the lens opened: a scroll still coasting from before then doesn't put it away. */
  const openedAt = useRef(0);

  // A visitor typing to Bryan keeps the caret where it is.
  useEffect(() => {
    if (!inBryanBox(document.activeElement)) scroller.current?.focus({ preventScroll: true });
  }, []);

  // The page across the middle of the view is the one being read.
  useEffect(() => {
    const view = scroller.current;
    if (!view) return;
    let current = 0;
    const watch = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue;
          const at = Number(entry.target.dataset.page);
          if (at === current) continue;
          current = at;
          setIndex(at);
          track("deliverable_page", kind, { page: at + 1, via: picked.current === at ? "picker" : "scroll" });
          picked.current = null;
        }
      },
      { root: view, rootMargin: "-50% 0px -50% 0px" },
    );
    for (const el of view.querySelectorAll("[data-page]")) watch.observe(el);
    return () => watch.disconnect();
  }, [kind]);

  const shut = () => {
    const open = lens;
    if (!open || closing.current) return;
    closing.current = true;
    track("deliverable_zoom", kind, { page: open.page + 1, zoomed: false });
    const done = () => {
      closing.current = false;
      setLens(null);
      opener.current?.focus({ preventScroll: true });
    };
    const el = card.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
    const back = `translate(${open.fromX - open.left - open.width / 2}px, ${open.fromY - open.top - open.height / 2}px) scale(0.2)`;
    el.animate([{ transform: "none", opacity: 1 }, { transform: back, opacity: 0 }], {
      duration: 180,
      easing: "cubic-bezier(0.4, 0, 1, 1)",
      fill: "forwards",
    }).onfinish = done;
    dim.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: "forwards" });
  };

  // While the lens is up, a click anywhere (but Bryan's box) or Esc puts it
  // away, and only it: the overlay stays open.
  const shutRef = useRef(shut);
  useLayoutEffect(() => {
    shutRef.current = shut;
  });
  const onScrollAway = (event: SyntheticEvent) => {
    if (event.timeStamp - openedAt.current > 400) shutRef.current();
  };
  useEffect(() => {
    if (!lens) return;
    const onClick = (event: Event) => {
      if (inBryanBox(event.target instanceof Element ? event.target : null)) return;
      event.stopPropagation();
      event.preventDefault();
      shutRef.current();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      shutRef.current();
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [lens]);

  // The lens grows out of the spot that was clicked.
  useLayoutEffect(() => {
    const el = card.current;
    if (!lens || !el) return;
    dismiss.current?.focus({ preventScroll: true });
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = `translate(${lens.fromX - lens.left - lens.width / 2}px, ${lens.fromY - lens.top - lens.height / 2}px) scale(0.2)`;
    el.animate([{ transform: still ? "none" : from, opacity: 0 }, { transform: "none", opacity: 1 }], {
      duration: still ? 120 : 340,
      easing: EXPO,
    });
    dim.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: still ? 120 : 220, easing: "ease-out" });
  }, [lens]);

  if (!flows) return null;
  const copy = flows.copy[kind];
  const pageOf = copy.pageOf.replace("{n}", String(index + 1)).replace("{total}", String(pages.length));

  function jump(to: number) {
    const view = scroller.current;
    const page = view?.querySelector<HTMLElement>(`[data-page="${to}"]`);
    if (!view || !page || to === index) return;
    picked.current = to;
    view.scrollTo({ top: page.offsetTop - 12 });
  }

  /** Explodes the spot clicked on page `i`, or its middle from the keyboard. */
  function explode(i: number, event: MouseEvent<HTMLButtonElement>) {
    const box = root.current?.getBoundingClientRect();
    if (!box || lens) return;
    const pic = event.currentTarget.getBoundingClientRect();
    const keyboard = event.detail === 0;
    const fx = keyboard ? 0.5 : (event.clientX - pic.left) / pic.width;
    const fy = keyboard ? 0.5 : (event.clientY - pic.top) / pic.height;
    const p = pages[i];
    // Twice the size it's drawn at, so the small print reads, but no less
    // than the file's own size and no more than 1.75 times it, past which
    // the text blurs.
    const pageWidth = Math.min(Math.max(pic.width * 2, p.width), p.width * 1.75);
    const pageHeight = (pageWidth * p.height) / p.width;
    const width = Math.min(box.width * 0.88, pageWidth);
    const height = Math.min(box.height * 0.65, pageHeight);
    const clamp = (v: number, max: number) => Math.min(Math.max(v, 0), max);
    opener.current = event.currentTarget;
    openedAt.current = event.timeStamp;
    setLens({
      page: i,
      left: (box.width - width) / 2,
      top: (box.height - height) / 2,
      width,
      height,
      pageWidth,
      pageHeight,
      x: clamp(fx * pageWidth - width / 2, pageWidth - width),
      y: clamp(fy * pageHeight - height / 2, pageHeight - height),
      fromX: pic.left - box.left + fx * pic.width,
      fromY: pic.top - box.top + fy * pic.height,
    });
    track("deliverable_zoom", kind, { page: i + 1, zoomed: true });
  }

  return (
    <div ref={root} data-section={`flow-${kind}`} data-track-ignore className="relative h-full">
      <h2 id={DELIVERABLE_TITLE_ID} className="sr-only">
        {doc.title}
      </h2>

      <div
        ref={scroller}
        role="region"
        aria-labelledby={DELIVERABLE_TITLE_ID}
        tabIndex={0}
        // Scrolling the pages away puts the lens away too.
        onScroll={onScrollAway}
        className="relative h-full overflow-y-auto overscroll-contain outline-none [scrollbar-color:rgb(255_255_255/0.3)_transparent] [scrollbar-width:thin] focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-inset"
      >
        <div className="flex flex-col gap-3 px-3 pt-3 pb-16 sm:gap-4 sm:px-5 sm:pt-5">
          {pages.map((p, i) => (
            <button
              key={p.src}
              type="button"
              data-page={i}
              onClick={(event) => explode(i, event)}
              aria-label={`${copy.zoomIn}: ${p.alt}`}
              className="block w-full cursor-zoom-in rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
            >
              <Image
                src={p.src}
                alt=""
                width={p.width}
                height={p.height}
                unoptimized
                loading={i < 2 ? "eager" : "lazy"}
                draggable={false}
                className="block h-auto w-full rounded-[3px] bg-white shadow-[0_22px_50px_-20px_rgba(0,0,0,0.85)] ring-1 ring-white/10"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Which page is in view; also a picker that jumps to any page. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
        <label className="pointer-events-auto relative flex items-center gap-1.5 rounded-full bg-ink-950/80 px-4 py-2 text-[0.875rem] font-semibold text-white tabular shadow-[0_10px_30px_-10px_rgba(2,8,18,0.9)] ring-1 ring-white/15 backdrop-blur-sm transition-colors hover:bg-ink-950/95 has-[select:focus-visible]:ring-2 has-[select:focus-visible]:ring-blue-400">
          <span aria-hidden>{pageOf}</span>
          <CaretDown aria-hidden className="size-3.5 shrink-0 text-slate-300" />
          <select
            aria-label={copy.jump}
            value={index}
            onChange={(event) => jump(Number(event.target.value))}
            className="absolute inset-0 cursor-pointer appearance-none bg-white text-ink opacity-0"
          >
            {pages.map((p, i) => (
              <option key={p.src} value={i}>
                {i + 1}. {p.alt}
              </option>
            ))}
          </select>
        </label>
      </div>

      {lens ? (
        <div
          role="dialog"
          aria-label={copy.zoomed.replace("{n}", String(lens.page + 1))}
          data-exploded
          onWheel={onScrollAway}
          onTouchMove={onScrollAway}
          className="absolute inset-0 z-20 cursor-zoom-out"
        >
          <div ref={dim} aria-hidden className="absolute inset-0 bg-ink-950/65 backdrop-blur-[2px]" />
          <div
            ref={card}
            role="img"
            aria-label={pages[lens.page].alt}
            className="absolute rounded-2xl bg-white bg-no-repeat shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/25"
            style={{
              left: lens.left,
              top: lens.top,
              width: lens.width,
              height: lens.height,
              backgroundImage: `url(${pages[lens.page].src})`,
              backgroundSize: `${lens.pageWidth}px ${lens.pageHeight}px`,
              backgroundPosition: `${-lens.x}px ${-lens.y}px`,
            }}
          />
          {/* Where focus goes, so Enter or Space puts the lens away too. */}
          <button ref={dismiss} type="button" className="sr-only">
            {copy.zoomOut}
          </button>
        </div>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {`${pageOf}: ${pages[index].alt}`}
      </p>
    </div>
  );
}
