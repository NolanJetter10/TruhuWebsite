"use client";

import Image, { type StaticImageData } from "next/image";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { PhoneFrame } from "@/components/art/frames";
import { cx } from "@/components/ui/primitives";
import { ADVISOR_PAGE } from "@/lib/content";
import flipbookWide from "@/public/images/outputs/flipbook.webp";
import flyerWide from "@/public/images/outputs/flyer.webp";
import guideNarrow from "@/public/images/outputs/m-guide.webp";
import flyerNarrow from "@/public/images/outputs/m-flyer.webp";
import qnaNarrow from "@/public/images/outputs/m-qna.webp";
import websiteNarrow from "@/public/images/outputs/m-website.webp";
import qnaWide from "@/public/images/outputs/qna.webp";
import videoWide from "@/public/images/outputs/video.webp";
import websiteWide from "@/public/images/outputs/website.webp";
import { useInView, useReducedMotion } from "./hooks";

/**
 * What Advisor builds, one tab per output, each shown as the real thing:
 * the deliverables TruHu built for Kindlerye Baking Co., a made-up employer.
 *
 * The guide is its own pages, scrolled here. Every other tab is the live
 * published page, embedded. Until the visitor asks for it, an embed is a
 * capture of that page taken at the stage's exact size, so it costs nothing
 * to show, can't trap the page's scrolling, and swaps for the live page
 * without a jump. Below `lg`, where an embed would be cramped and would trap
 * touch scrolling, the capture sits on a phone and opens the page in a tab.
 *
 * The tabs advance on their own until the visitor picks one or reaches for
 * the stage; from then on the rotation stays out of the way.
 */

const { sample, tabs: TABS } = ADVISOR_PAGE.outputs;
type Tab = (typeof TABS)[number];
export type OutputKey = Tab["key"];

const DWELL = 7000;

/** The size the wide captures were taken at, and the size an embed is laid
 *  out at before it is scaled to the stage. Wide stages hold this ratio. */
const FRAME = { w: 1256, h: 600 };

const POSTERS: Record<
  Exclude<OutputKey, "guide">,
  { wide: StaticImageData; narrow: StaticImageData }
> = {
  flipbook: { wide: flipbookWide, narrow: guideNarrow },
  // Caught mid-narration, the way a video shows a frame from partway in.
  video: { wide: videoWide, narrow: guideNarrow },
  website: { wide: websiteWide, narrow: websiteNarrow },
  // The assistant opened, since the chatbot is what this tab is about.
  qna: { wide: qnaWide, narrow: qnaNarrow },
  flyer: { wide: flyerWide, narrow: flyerNarrow },
};

/** The published viewers render after their page loads, so the capture
 *  stays up a beat longer to cover it. */
const SETTLE_MS = 1200;

export function OutputShowcase() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [exploring, setExploring] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const autoplay = inView && !reduced && !exploring;

  useEffect(() => {
    if (!autoplay) return;
    const id = window.setTimeout(
      () => setActive((current) => (current + 1) % TABS.length),
      DWELL,
    );
    return () => window.clearTimeout(id);
  }, [active, autoplay]);

  const select = (i: number) => {
    setExploring(true);
    setActive(i);
  };

  // Arrow keys move between tabs, as a tablist should.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (active + step + TABS.length) % TABS.length;
    select(next);
    tabRefs.current[next]?.focus();
  };

  const tab = TABS[active];

  return (
    <div ref={ref}>
      <div
        role="tablist"
        aria-label="What TruHu Advisor builds"
        onKeyDown={onKeyDown}
        className="mx-auto grid max-w-full grid-cols-2 gap-1 rounded-2xl border border-line bg-paper p-1 sm:flex sm:w-fit sm:flex-wrap sm:justify-center sm:rounded-full [&>:last-child:nth-child(odd)]:col-span-2"
      >
        {TABS.map((item, i) => {
          const selected = i === active;
          return (
            <button
              key={item.key}
              ref={(node) => {
                tabRefs.current[i] = node;
              }}
              type="button"
              role="tab"
              id={`output-tab-${item.key}`}
              aria-selected={selected}
              aria-controls={`output-panel-${item.key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(i)}
              className={cx(
                "relative inline-flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full px-3 py-2 text-[0.875rem] font-semibold whitespace-nowrap transition-colors duration-300 xl:px-4 xl:text-[0.9375rem]",
                selected
                  ? "bg-ink text-white shadow-[0_10px_24px_-14px_rgba(5,14,26,0.8)]"
                  : "text-slate-600 hover:bg-white hover:text-ink",
              )}
            >
              <TabIcon kind={item.key} className="size-4 shrink-0" />
              {item.name}
              {/* How long until the next tab, while the tabs still rotate. */}
              {selected && autoplay ? (
                <span
                  key={active}
                  aria-hidden
                  className="absolute inset-x-4 bottom-1 h-0.5 origin-left rounded-full"
                  style={{
                    background: "var(--grad-brand-bright)",
                    animation: `dot-fill ${DWELL}ms linear both`,
                  }}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`output-panel-${tab.key}`}
        aria-labelledby={`output-tab-${tab.key}`}
        className="mt-6"
      >
        {/* One paragraph per output, held to three lines on wide screens so
            the stage below doesn't shift as the tabs change. */}
        <p
          key={tab.key}
          className="mx-auto max-w-[52rem] text-center text-[1rem] leading-[1.65] sm:text-[1.0625rem] text-slate-600 lg:min-h-[4.95em]"
          style={{ animation: "hero-in 600ms var(--ease-out-expo) both" }}
        >
          <strong className="font-semibold text-ink">{tab.lead}</strong>{" "}
          {tab.body}
        </p>

        <div
          onPointerEnter={() => setExploring(true)}
          onFocusCapture={() => setExploring(true)}
          className="card-shape-lg relative isolate mt-6 h-[440px] overflow-hidden border border-line bg-paper shadow-[0_40px_90px_-48px_rgba(5,14,26,0.5)] lg:aspect-[157/75] lg:h-auto"
        >
          <div
            key={tab.key}
            className="absolute inset-0"
            style={{ animation: "demo-fade 450ms var(--ease-out-expo) both" }}
          >
            {tab.key === "guide" ? (
              <GuideReader tab={tab} />
            ) : (
              <LiveEmbed tab={tab} poster={POSTERS[tab.key]} />
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-1.5 text-[0.875rem] sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <p className="flex items-center gap-2 font-medium text-ink">
            <PointerIcon className="size-4 shrink-0 text-blue-700" />
            {tab.hint}
          </p>
          <p className="text-slate-500">
            {sample}{" "}
            <a
              href={tab.live}
              target="_blank"
              rel="noopener"
              className="font-semibold whitespace-nowrap text-blue-700 underline-offset-4 hover:underline"
            >
              Open full screen
              <span aria-hidden> &#8599;</span>
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Live embeds                                                                 */
/* -------------------------------------------------------------------------- */

function LiveEmbed({
  tab,
  poster,
}: {
  tab: Tab;
  poster: { wide: StaticImageData; narrow: StaticImageData };
}) {
  const box = useRef<HTMLDivElement>(null);
  const scale = useFitScale(box, FRAME.w);
  // Mounted on hover so it is usually ready by the click; shown once asked
  // for and loaded.
  const [mounted, setMounted] = useState(false);
  const [wanted, setWanted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const live = wanted && loaded;
  const label = `the live ${tab.name.toLowerCase()}`;

  return (
    <>
      {/* Wide: the published page in place, laid out at the capture's size. */}
      <div ref={box} className="absolute inset-0 hidden lg:block">
        {mounted ? (
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{
              width: FRAME.w,
              height: FRAME.h,
              transform: `scale(${scale})`,
            }}
          >
            <iframe
              src={tab.live}
              title={`Kindlerye Baking Co. ${tab.name.toLowerCase()}, live`}
              allow="autoplay; microphone; clipboard-write; fullscreen"
              onLoad={() => window.setTimeout(() => setLoaded(true), SETTLE_MS)}
              inert={!live}
              className="size-full border-0 bg-white"
            />
          </div>
        ) : null}

        <button
          type="button"
          onPointerEnter={() => setMounted(true)}
          onFocus={() => setMounted(true)}
          onClick={() => {
            setMounted(true);
            setWanted(true);
          }}
          aria-label={`Try ${label}`}
          className={cx(
            "group absolute inset-0 cursor-pointer transition-opacity duration-500",
            live && "pointer-events-none opacity-0",
          )}
        >
          <Image
            src={poster.wide}
            alt=""
            fill
            sizes={`(min-width: 1024px) ${FRAME.w}px, 1px`}
            className="object-cover"
          />
          <span className="absolute inset-0 bg-ink-950/0 transition-colors duration-300 group-hover:bg-ink-950/10" />
          <TryPill
            busy={wanted && !loaded}
            label={wanted ? `Loading ${label}…` : `Try ${label}`}
          />
        </button>
      </div>

      {/* Narrow: the capture on a phone, opening the real page. */}
      <a
        href={tab.live}
        target="_blank"
        rel="noopener"
        aria-label={`Open ${label} in a new tab`}
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 lg:hidden"
      >
        <div className="grid-field-light" />
        <PhoneFrame width={252} className="relative">
          <Image
            src={poster.narrow}
            alt=""
            sizes="236px"
            className="block h-auto w-full"
          />
        </PhoneFrame>
        <span className="relative inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[0.8125rem] font-semibold text-white shadow-lg">
          <LiveDot />
          Open it live
          <span aria-hidden>&#8599;</span>
        </span>
      </a>
    </>
  );
}

/** Width of `ref`'s box over `width`, capped at 1, kept current. Measured
 *  before paint, so an embed never shows at the wrong size. */
function useFitScale(ref: RefObject<HTMLElement | null>, width: number) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      if (node.clientWidth) setScale(Math.min(1, node.clientWidth / width));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, width]);
  return scale;
}

/** Centred over a capture; `low` sits it near the bottom instead, off a page's
 *  title. */
function TryPill({
  label,
  busy = false,
  low = false,
}: {
  label: string;
  busy?: boolean;
  low?: boolean;
}) {
  return (
    <span
      className={cx(
        "absolute left-1/2 inline-flex -translate-x-1/2 items-center",
        low ? "bottom-6" : "top-1/2 -translate-y-1/2",
      )}
    >
      <span className="inline-flex items-center gap-2.5 rounded-full bg-ink/90 py-2.5 pr-5 pl-4 text-[0.9375rem] font-semibold whitespace-nowrap text-white shadow-[0_18px_40px_-16px_rgba(5,14,26,0.8)] ring-1 ring-white/15 backdrop-blur-sm transition-transform duration-300 group-hover:scale-[1.04]">
        {busy ? (
          <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <LiveDot />
        )}
        {label}
      </span>
    </span>
  );
}

function LiveDot() {
  return (
    <span aria-hidden className="relative grid size-2.5 place-items-center">
      <span className="absolute inset-0 rounded-full bg-green-400/60 anim-pulse" />
      <span className="size-1.5 rounded-full bg-green-400" />
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Benefits guide                                                              */
/* -------------------------------------------------------------------------- */

/** The guide proper runs to its back cover on page 23; the PDF then carries
 *  eleven pages of required notices, left to the full guide. */
const GUIDE_PAGES = 23;
const GUIDE_TOTAL = 34;
const PAGE = { w: 1102, h: 1426 };
const pageSrc = (n: number) =>
  `/images/outputs/guide/p${String(n).padStart(2, "0")}.webp`;

/** The guide's own table of contents, as its viewer lists it. */
const SECTIONS = [
  { label: "Cover", page: 1 },
  { label: "Benefits overview", page: 3 },
  { label: "Medical", page: 8 },
  { label: "Dental", page: 11 },
  { label: "Vision", page: 12 },
  { label: "FSA / HSA", page: 13 },
  { label: "Life & disability", page: 14 },
  { label: "Wellness & perks", page: 15 },
  { label: "Time off & leave", page: 17 },
  { label: "Compliance & notices", page: 19 },
  { label: "Additional benefits", page: 20 },
  { label: "Contacts & resources", page: 21 },
  { label: "Plan documents", page: 22 },
] as const;

const PAGE_NUMBERS = Array.from({ length: GUIDE_PAGES }, (_, i) => i + 1);

function GuideReader({ tab }: { tab: Tab }) {
  const reduced = useReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);
  const pages = useRef<(HTMLDivElement | null)[]>([]);
  // Held still until clicked, so scrolling the page past it never gets
  // caught in the guide.
  const [live, setLive] = useState(false);
  const [page, setPage] = useState(1);
  const section = SECTIONS.findLast((s) => s.page <= page) ?? SECTIONS[0];

  const start = () => {
    setLive(true);
    scroller.current?.focus({ preventScroll: true });
  };

  const jump = (n: number) => {
    start();
    const target = pages.current[n - 1];
    if (!target || !scroller.current) return;
    scroller.current.scrollTo({
      top: target.offsetTop - 24,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  const onScroll = () => {
    const node = scroller.current;
    if (!node) return;
    const line = node.scrollTop + node.clientHeight * 0.4;
    let current = 1;
    pages.current.forEach((el, i) => {
      if (el && el.offsetTop <= line) current = i + 1;
    });
    setPage(current);
  };

  return (
    <>
      {/* Wide: contents beside a continuous scroll of every page. */}
      <div className="absolute inset-0 hidden grid-cols-[220px_minmax(0,1fr)] lg:grid">
        <nav
          aria-label="Guide sections"
          className="flex min-h-0 flex-col border-r border-line bg-white"
        >
          <p className="px-4 pt-4 pb-2 text-[0.6875rem] font-bold tracking-[0.12em] text-slate-400 uppercase">
            Contents
          </p>
          <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            {SECTIONS.map((item) => {
              const current = item === section;
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => jump(item.page)}
                    aria-current={current ? "true" : undefined}
                    className={cx(
                      "flex w-full cursor-pointer items-center justify-between rounded-md px-2.5 py-1 text-left text-[0.8125rem] transition-colors duration-200",
                      current
                        ? "bg-blue-100 font-semibold text-blue-700"
                        : "text-slate-600 hover:bg-paper hover:text-ink",
                    )}
                  >
                    {item.label}
                    <span className="tabular text-[0.75rem] text-slate-400">
                      {item.page}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="tabular border-t border-line px-4 py-2.5 text-[0.75rem] font-semibold text-slate-500">
            Page {page} of {GUIDE_TOTAL}
          </p>
        </nav>

        <div className="relative min-h-0 bg-slate-100">
          <div
            ref={scroller}
            onScroll={onScroll}
            tabIndex={live ? 0 : -1}
            aria-label="Kindlerye Baking Co. benefits guide"
            className={cx(
              "relative h-full outline-none",
              live ? "overflow-y-auto" : "overflow-hidden",
            )}
          >
            <div className="mx-auto flex max-w-[600px] flex-col gap-5 px-6 py-6">
              {PAGE_NUMBERS.map((n) => (
                <div
                  key={n}
                  ref={(node) => {
                    pages.current[n - 1] = node;
                  }}
                  className="overflow-hidden rounded-[3px] bg-white shadow-[0_18px_40px_-24px_rgba(5,14,26,0.45)] ring-1 ring-black/5"
                >
                  <Image
                    src={pageSrc(n)}
                    alt={`Page ${n} of the guide`}
                    width={PAGE.w}
                    height={PAGE.h}
                    sizes="552px"
                    loading={n <= 2 ? "eager" : "lazy"}
                    className="block h-auto w-full"
                  />
                </div>
              ))}
              <MoreNotices href={tab.live} />
            </div>
          </div>

          {live ? null : (
            <button
              type="button"
              onClick={start}
              aria-label="Scroll through the guide"
              className="group absolute inset-0 cursor-pointer"
            >
              <span className="absolute inset-0 bg-ink-950/0 transition-colors duration-300 group-hover:bg-ink-950/5" />
              <TryPill label="Scroll through the guide" low />
            </button>
          )}
        </div>
      </div>

      {/* Narrow: the pages side by side, swiped, so they never catch the
          page's own vertical scrolling. */}
      <div className="absolute inset-0 lg:hidden">
        <div className="flex h-full snap-x snap-mandatory items-center gap-4 overflow-x-auto px-[14%] [scrollbar-width:none]">
          {PAGE_NUMBERS.map((n) => (
            <Image
              key={n}
              src={pageSrc(n)}
              alt={`Page ${n} of the guide`}
              width={PAGE.w}
              height={PAGE.h}
              sizes="300px"
              loading={n <= 2 ? "eager" : "lazy"}
              className="h-[84%] w-auto max-w-none shrink-0 snap-center rounded-[3px] shadow-[0_18px_40px_-24px_rgba(5,14,26,0.45)] ring-1 ring-black/5"
            />
          ))}
          <div className="flex h-[84%] shrink-0 snap-center items-center">
            <MoreNotices href={tab.live} />
          </div>
        </div>
        <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink/85 px-3 py-1.5 text-[0.75rem] font-semibold whitespace-nowrap text-white">
          Swipe through all {GUIDE_PAGES} pages
        </span>
      </div>
    </>
  );
}

function MoreNotices({ href }: { href: string }) {
  return (
    <div className="card-shape-sm w-64 border border-line bg-white p-5 text-center lg:w-auto">
      <p className="font-semibold text-ink">
        Plus {GUIDE_TOTAL - GUIDE_PAGES} pages of required notices
      </p>
      <p className="mt-1 text-[0.875rem] text-slate-600">
        FMLA, Medicaid and CHIP, and the rest, in the full guide.
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener"
        className="mt-3 inline-block text-[0.875rem] font-semibold text-blue-700 underline-offset-4 hover:underline"
      >
        Open the full guide<span aria-hidden> &#8599;</span>
      </a>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Small parts                                                                 */
/* -------------------------------------------------------------------------- */

function PointerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4 2.5 12.5 8 8.6 8.9 6.9 12.6z" />
      <path d="M8.6 8.9 11.5 12.5" strokeLinecap="round" />
    </svg>
  );
}

/** Also marks each output in the Advisor pipeline, so the two read as one set. */
export function TabIcon({ kind, className }: { kind: OutputKey; className?: string }) {
  const paths: Record<OutputKey, ReactNode> = {
    guide: (
      <>
        <path d="M3 3.5h4.5a1.5 1.5 0 0 1 1.5 1.5v8.5a1 1 0 0 0-1-1H3z" />
        <path d="M13 3.5H8.5A1.5 1.5 0 0 0 7 5v8.5a1 1 0 0 1 1-1h5z" />
      </>
    ),
    flipbook: (
      <>
        <path d="M8 5.2C6.6 4.3 4.6 3.8 2 3.8v8.8c2.6 0 4.6.5 6 1.4" />
        <path d="M8 5.2v8.8c1.4-.9 3.4-1.4 6-1.4V3.8c-1.1 0-2.1.1-3 .3" />
        {/* A page partway through turning. */}
        <path d="M8 5.2c.6-1.6 1.6-2.8 3-3.7v8.6c-1.4.9-2.4 2.1-3 3.9" />
      </>
    ),
    website: (
      <>
        <rect x="2" y="3" width="12" height="10" rx="1.5" />
        <path d="M2 6h12" />
      </>
    ),
    qna: (
      <>
        <path d="M2.5 4A1.5 1.5 0 0 1 4 2.5h8A1.5 1.5 0 0 1 13.5 4v5.5A1.5 1.5 0 0 1 12 11H7l-3 2.5V11a1.5 1.5 0 0 1-1.5-1.5z" />
        <path d="M5.5 6h5M5.5 8.2h3" />
      </>
    ),
    video: (
      <>
        <rect x="2" y="3" width="12" height="10" rx="1.5" />
        <path d="M6.75 6v4l3.5-2z" />
      </>
    ),
    flyer: (
      <>
        <rect x="3.5" y="2" width="9" height="12" rx="1" />
        <path d="M5.5 5h5M5.5 7h3" />
        <rect x="8.5" y="9.5" width="2.5" height="2.5" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      {paths[kind]}
    </svg>
  );
}
