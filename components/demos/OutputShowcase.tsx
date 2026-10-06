"use client";

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { BrowserFrame, PhoneFrame } from "@/components/art/frames";
import { cx } from "@/components/ui/primitives";
import { ADVISOR_PAGE } from "@/lib/content";
import { useInView, useReducedMotion, useSequence } from "./hooks";

/**
 * What Advisor builds, one tab per output, each with a small running example
 * of the finished thing in a client's brand.
 *
 * The tabs advance on their own until the visitor picks one; from then on the
 * visitor is exploring and the rotation stays out of the way.
 */

const TABS = ADVISOR_PAGE.outputs.tabs;
export type OutputKey = (typeof TABS)[number]["key"];

const DWELL = 7000;

/** The sample client, shared with the hero walkthrough. Not a TruHu colour. */
const BRAND = "#0E5A63";
const ACCENT = "#F2A93B";
const TINT = "#E6F0F1";

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
        className="mt-12 grid items-center gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-16"
      >
        <div
          key={tab.key}
          style={{ animation: "hero-in 600ms var(--ease-out-expo) both" }}
        >
          <h3 className="t-h3">{tab.title}</h3>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-600">
            {tab.blurb}
          </p>
          <ul className="mt-6 space-y-3">
            {tab.points.map((point) => (
              <li
                key={point}
                className="flex gap-3 text-[0.9375rem] leading-snug text-ink"
              >
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-green-100 text-green-700">
                  <CheckIcon className="size-3" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div
          key={`demo-${tab.key}`}
          aria-hidden
          className="card-shape-lg relative h-[440px] min-w-0 overflow-hidden border border-line bg-paper select-none"
          style={{ animation: "hero-in 700ms var(--ease-out-expo) both" }}
        >
          <div className="grid-field-light" />
          <Demo kind={tab.key} />
        </div>
      </div>
    </div>
  );
}

function Demo({ kind }: { kind: OutputKey }) {
  if (kind === "guide") return <GuideDemo />;
  if (kind === "flipbook") return <FlipbookDemo />;
  if (kind === "website") return <WebsiteDemo />;
  if (kind === "qna") return <QnaDemo />;
  if (kind === "video") return <VideoDemo />;
  return <FlyerDemo />;
}

/* -------------------------------------------------------------------------- */
/* Benefits guide                                                              */
/* -------------------------------------------------------------------------- */

/** Every guide page is drawn at this size; thumbnails are the same page scaled. */
const PAGE = { w: 272, h: 352 };
const GUIDE_PAGES = ["Cover", "Medical", "Dental & vision", "Contacts"] as const;

function GuideDemo() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const [page] = useSequence(GUIDE_PAGES.length, 1900, inView);
  const thumb = 0.19;

  return (
    <div
      ref={ref}
      className="relative flex h-full items-center justify-center gap-6 px-6"
    >
      {/* Thumbnails */}
      <div className="hidden flex-col gap-2.5 sm:flex">
        {GUIDE_PAGES.map((name, i) => (
          <div key={name} className="flex items-center gap-2">
            <span
              className={cx(
                "tabular w-3 text-right text-[10px] font-semibold transition-colors duration-300",
                i === page ? "text-blue-700" : "text-slate-400",
              )}
            >
              {i + 1}
            </span>
            <div
              className={cx(
                "overflow-hidden rounded-[3px] bg-white shadow-sm ring-2 transition-[box-shadow,transform] duration-300",
                i === page ? "scale-105 ring-blue-500" : "ring-transparent",
              )}
              style={{ width: PAGE.w * thumb, height: PAGE.h * thumb }}
            >
              <div
                style={{
                  width: PAGE.w,
                  height: PAGE.h,
                  transform: `scale(${thumb})`,
                  transformOrigin: "0 0",
                }}
              >
                <GuidePage index={i} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* The page itself */}
      <div className="relative shrink-0" style={{ width: PAGE.w, height: PAGE.h }}>
        {GUIDE_PAGES.map((name, i) => (
          <div
            key={name}
            className="absolute inset-0 overflow-hidden rounded-[4px] bg-white shadow-[0_24px_50px_-24px_rgba(5,14,26,0.55)] transition-[opacity,transform] duration-700 ease-out"
            style={{
              opacity: i === page ? 1 : 0,
              transform:
                i === page
                  ? "none"
                  : i < page
                    ? "translate3d(0,-14px,0) scale(0.98)"
                    : "translate3d(0,14px,0) scale(0.98)",
            }}
          >
            <GuidePage index={i} />
          </div>
        ))}
      </div>

      <span className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap text-slate-600 shadow-sm">
        <span className="tabular">Page {page + 1} of 12</span>
        <span className="h-3 w-px bg-line" />
        <span className="text-blue-700">Download PDF</span>
        <span className="h-3 w-px bg-line" />
        <span className="text-blue-700">Share link</span>
      </span>
    </div>
  );
}

function GuidePage({ index }: { index: number }) {
  if (index === 0) return <GuideCover />;
  return (
    <GuideSheet label={GUIDE_PAGES[index]} folio={index + 2}>
      {index === 1 ? <GuideMedical /> : null}
      {index === 2 ? <GuideDentalVision /> : null}
      {index === 3 ? <GuideContacts /> : null}
    </GuideSheet>
  );
}

/** An inside page of the guide: the running head and folio around its body. */
function GuideSheet({
  label,
  folio,
  children,
}: {
  label: string;
  folio: number;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col bg-white text-ink">
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: BRAND }}
      >
        <Logo />
        <span className="text-[8px] font-semibold tracking-wider text-white/70 uppercase">
          {label}
        </span>
      </div>
      <div className="h-[3px]" style={{ background: ACCENT }} />
      <div className="flex-1 px-4 pt-3">{children}</div>
      <p className="px-4 pb-2.5 text-right text-[7px] text-slate-400">
        Sample Company · 2027 Benefits Guide · {folio}
      </p>
    </div>
  );
}

function GuideCover() {
  return (
    <div className="relative h-full overflow-hidden" style={{ background: BRAND }}>
      {/* A simple mountain range: the client's cover art. */}
      <svg
        viewBox="0 0 272 352"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
      >
        <circle cx="206" cy="196" r="34" fill={ACCENT} opacity="0.9" />
        <path d="M0 262 70 196l44 34 58-62 100 96v88H0z" fill="#ffffff" opacity="0.12" />
        <path d="M0 292 54 250l48 26 70-58 100 78v56H0z" fill="#ffffff" opacity="0.18" />
        <path d="M0 322 80 284l62 22 58-32 72 40v38H0z" fill="#08192b" opacity="0.35" />
      </svg>
      <div className="relative px-5 pt-5">
        <Logo />
        <p
          className="mt-12 text-[9px] font-bold tracking-[0.18em] uppercase"
          style={{ color: ACCENT }}
        >
          Plan year 2027
        </p>
        <p className="mt-2 font-display text-[28px] leading-[1.02] font-bold text-white">
          Employee
          <br />
          Benefits Guide
        </p>
        <p className="mt-3 text-[10px] text-white/75">
          Open enrollment · Nov 3 – Nov 14
        </p>
      </div>
    </div>
  );
}

function PageTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <>
      <p
        className="text-[8px] font-bold tracking-wider uppercase"
        style={{ color: BRAND }}
      >
        {kicker}
      </p>
      <p className="font-display text-[16px] leading-tight font-bold">{title}</p>
    </>
  );
}

function GuideMedical() {
  const rows = [
    ["Deductible", "$1,500", "$3,200", "$1,000"],
    ["Out-of-pocket max", "$4,000", "$6,400", "$3,500"],
    ["Doctor visit", "$25", "20%", "$20"],
    ["Per paycheck", "$48", "$22", "$61"],
  ];
  return (
    <>
      <PageTitle kicker="Medical" title="Compare your medical plans" />
      <p className="mt-1 text-[8.5px] leading-snug text-slate-600">
        Three plans, all with the same doctor network. Pick the one that fits
        how you use care.
      </p>
      <div className="mt-3 overflow-hidden rounded-[3px] border border-line text-[8px]">
        <div
          className="grid grid-cols-[1.4fr_1fr_1fr_1fr] font-bold text-white"
          style={{ background: BRAND }}
        >
          {["", "PPO 1500", "HDHP 3200", "EPO 1000"].map((h) => (
            <span key={h} className="px-1.5 py-1.5">
              {h}
            </span>
          ))}
        </div>
        {rows.map((row, r) => (
          <div
            key={row[0]}
            className="grid grid-cols-[1.4fr_1fr_1fr_1fr] border-t border-line"
            style={{ background: r === rows.length - 1 ? TINT : undefined }}
          >
            {row.map((cell, c) => (
              <span
                key={c}
                className={cx("tabular px-1.5 py-1.5", c === 0 && "font-semibold")}
              >
                {cell}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div
        className="mt-3 rounded-[3px] border-l-2 px-2 py-1.5 text-[8px] leading-snug text-slate-600"
        style={{ borderColor: ACCENT, background: "#FDF6EA" }}
      >
        <span className="font-bold text-ink">Tip:</span> the HDHP pairs with an
        HSA, and Sample Company adds $750 to it.
      </div>
    </>
  );
}

function GuideDentalVision() {
  return (
    <>
      <PageTitle kicker="Dental & vision" title="Keep your smile and sight" />
      <div className="mt-3 grid grid-cols-2 gap-2 text-[8px]">
        {[
          { name: "Dental Base", cost: "$4", lines: ["Cleanings 100%", "Fillings 80%", "Annual max $1,000"] },
          { name: "Dental Plus", cost: "$9", lines: ["Cleanings 100%", "Crowns 50%", "Annual max $2,000"] },
        ].map((plan) => (
          <div key={plan.name} className="rounded-[3px] border border-line p-2">
            <p className="font-bold">{plan.name}</p>
            <p className="font-display text-[15px] font-bold" style={{ color: BRAND }}>
              {plan.cost}
              <span className="text-[8px] font-medium text-slate-400"> / check</span>
            </p>
            <ul className="mt-1 space-y-0.5 text-slate-600">
              {plan.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-3 rounded-[3px] p-2 text-[8px]" style={{ background: TINT }}>
        <span
          className="grid size-7 shrink-0 place-items-center rounded-full text-white"
          style={{ background: BRAND }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="size-4">
            <circle cx="4.5" cy="9" r="2.5" />
            <circle cx="11.5" cy="9" r="2.5" />
            <path d="M7 9h2M2 9l.8-3.5M14 9l-.8-3.5" strokeLinecap="round" />
          </svg>
        </span>
        <div>
          <p className="font-bold">Vision · $3 / check</p>
          <p className="text-slate-600">$10 eye exam · $150 toward frames</p>
        </div>
      </div>
    </>
  );
}

function GuideContacts() {
  const contacts = [
    ["Medical", "Northwind Health", "(800) 555-0141"],
    ["Dental", "Brightsmile Dental", "(800) 555-0162"],
    ["Vision", "ClearView Vision", "(800) 555-0178"],
    ["HSA", "Summit HSA", "(800) 555-0190"],
    ["Questions", "Sample Company HR", "(800) 555-0125"],
  ];
  return (
    <>
      <PageTitle kicker="Contacts" title="Who to call" />
      <ul className="mt-2.5 text-[8px]">
        {contacts.map(([kind, who, how]) => (
          <li
            key={kind}
            className="grid grid-cols-[0.8fr_1.3fr_1.4fr] gap-1 border-b border-line py-1.5"
          >
            <span className="font-bold" style={{ color: BRAND }}>
              {kind}
            </span>
            <span>{who}</span>
            <span className="tabular truncate text-slate-600">{how}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center gap-2.5">
        <QrCode size={40} />
        <p className="text-[8px] leading-snug text-slate-600">
          <span className="font-bold text-ink">Scan for your benefits site.</span>
          <br />
          Everything in this guide, on your phone.
        </p>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Digital flipbook                                                            */
/* -------------------------------------------------------------------------- */

/** The guide's pages bound as leaves, front and back: the cover turns over
 *  onto the medical page, and so on. The last leaf lies on the enroll page. */
const LEAVES = [
  [0, 1],
  [2, 3],
] as const;

/** How many leaves have turned at each beat: the book opens, turns a page,
 *  turns it back, and closes. Reduced motion holds the last beat, open. */
const TURNED = [0, 1, 2, 1] as const;
const SPREADS = ["Cover", "Pages 3–4 of 12", "Pages 5–6 of 12"] as const;
const TURN_MS = 900;

function FlipbookDemo() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const reduced = useReducedMotion();
  const [beat] = useSequence(TURNED.length, 1800, inView);
  const turned = TURNED[beat];
  const before = TURNED[(beat + TURNED.length - 1) % TURNED.length];
  // The leaf turning now rides above the others until the next one goes.
  const moving = Math.min(turned, before);
  const closed = turned === 0;
  const ease = (property: string) =>
    reduced ? undefined : `${property} ${TURN_MS}ms var(--ease-in-out-soft)`;

  return (
    <div ref={ref} className="relative flex h-full items-center justify-center px-6 pb-10">
      <div
        className="shrink-0 scale-[0.58] sm:scale-[0.82]"
        style={{ width: PAGE.w * 2, height: PAGE.h }}
      >
        {/* Shut, the cover sits centred; open, the spread does. */}
        <div
          className="relative h-full"
          style={{
            perspective: 1800,
            transform: closed ? `translateX(${-PAGE.w / 2}px)` : "none",
            transition: ease("transform"),
          }}
        >
          <span
            className="absolute inset-y-0 right-0 rounded-[4px] shadow-[0_24px_50px_-24px_rgba(5,14,26,0.55)]"
            style={{ left: closed ? "50%" : 0, transition: ease("left") }}
          />
          <div className="absolute inset-y-0 right-0 w-1/2">
            <LeafFace side="right">
              <GuideSheet label="Enroll" folio={6}>
                <GuideEnroll />
              </GuideSheet>
            </LeafFace>
          </div>
          {LEAVES.map(([front, back], k) => {
            const over = k < turned;
            return (
              <div
                key={front}
                className="absolute inset-y-0 right-0 w-1/2 [transform-style:preserve-3d]"
                style={{
                  zIndex:
                    k === moving ? 30 : over ? 10 + k : 10 + LEAVES.length - k,
                  transformOrigin: "0 50%",
                  transform: `rotateY(${over ? -180 : 0}deg)`,
                  transition: ease("transform"),
                }}
              >
                <LeafFace side="right">
                  <GuidePage index={front} />
                </LeafFace>
                <LeafFace side="left">
                  <GuidePage index={back} />
                </LeafFace>
              </div>
            );
          })}
        </div>
      </div>

      <span className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap text-slate-600 shadow-sm">
        <Chevron
          className={cx("size-3", turned < before ? "text-blue-700" : "text-slate-400")}
        />
        <span className="tabular w-[6.5rem] text-center">{SPREADS[turned]}</span>
        <Chevron
          flip
          className={cx("size-3", turned > before ? "text-blue-700" : "text-slate-400")}
        />
        <span className="h-3 w-px bg-line" />
        <span className="text-blue-700">Share link</span>
      </span>
    </div>
  );
}

/** One side of a leaf. A left-hand page is the back of a leaf, so it is
 *  turned to face the reader once the leaf has gone over. */
function LeafFace({ side, children }: { side: "left" | "right"; children: ReactNode }) {
  const left = side === "left";
  return (
    <div
      className={cx(
        "absolute inset-0 overflow-hidden bg-white [backface-visibility:hidden]",
        left ? "rounded-l-[4px]" : "rounded-r-[4px]",
      )}
      style={left ? { transform: "rotateY(180deg)" } : undefined}
    >
      {children}
      {/* The fold into the spine. */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(to ${left ? "left" : "right"}, rgba(5,14,26,0.16), transparent 9%)`,
        }}
      />
    </div>
  );
}

function GuideEnroll() {
  const steps = [
    "Compare your plans in this guide",
    "Scan to open your benefits site",
    "Enroll by Nov 14",
  ];
  return (
    <>
      <PageTitle kicker="Enroll" title="Ready to enroll?" />
      <ol className="mt-3 space-y-2 text-[8.5px]">
        {steps.map((step, i) => (
          <li key={step} className="flex items-center gap-2">
            <span
              className="grid size-4 shrink-0 place-items-center rounded-full text-[8px] font-bold text-white"
              style={{ background: BRAND }}
            >
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <div
        className="mt-4 flex items-center gap-3 rounded-[3px] p-2"
        style={{ background: TINT }}
      >
        <QrCode size={48} />
        <p className="text-[8px] leading-snug text-slate-600">
          <span className="font-bold text-ink">sampleco.truhu.site</span>
          <br />
          No app, no login.
        </p>
      </div>
    </>
  );
}

function Chevron({ flip = false, className }: { flip?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden
    >
      <path d="M10 3.5 5.5 8l4.5 4.5" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Benefits website                                                            */
/* -------------------------------------------------------------------------- */

const SITE_TABS = [
  {
    name: "Medical",
    cards: [
      ["PPO 1500", "$48", "Most flexibility"],
      ["HDHP 3200", "$22", "Lowest premium + HSA"],
      ["EPO 1000", "$61", "Lowest deductible"],
    ],
  },
  {
    name: "Dental",
    cards: [
      ["Dental Base", "$4", "Cleanings covered"],
      ["Dental Plus", "$9", "Crowns and ortho"],
    ],
  },
  {
    name: "Vision",
    cards: [
      ["Vision", "$3", "$150 toward frames"],
      ["LASIK", "15% off", "In-network discount"],
    ],
  },
] as const;

function WebsiteDemo() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const [section] = useSequence(SITE_TABS.length, 2300, inView);
  const [chat] = useSequence(4, 1500, inView);
  const current = SITE_TABS[section];

  return (
    <div ref={ref} className="relative h-full p-5 sm:p-6">
      <div className="w-full sm:w-[88%]">
        <BrowserFrame label="sampleco.truhu.site">
          <div className="h-[330px] overflow-hidden bg-white text-ink">
            <div className="px-4 pt-3" style={{ background: BRAND }}>
              <div className="flex items-center justify-between">
                <Logo />
                <span
                  className="rounded-full px-2 py-1 text-[9px] font-bold text-ink"
                  style={{ background: ACCENT }}
                >
                  Enroll by Nov 14
                </span>
              </div>
              <p className="mt-4 font-display text-[18px] leading-tight font-bold text-white">
                Your 2027 benefits,
                <br />
                all in one place.
              </p>
              <div className="mt-4 flex gap-4 text-[10px] font-semibold">
                {[...SITE_TABS.map((t) => t.name), "401(k)", "Contacts"].map((name, i) => (
                  <span
                    key={name}
                    className={cx(
                      "border-b-2 pb-2 transition-colors duration-300",
                      i === section
                        ? "border-white text-white"
                        : "border-transparent text-white/60",
                      i > 2 && "hidden sm:inline",
                    )}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <div key={current.name} className="p-4" style={{ animation: "hero-in 500ms var(--ease-out-expo) both" }}>
              <p className="text-[12px] font-bold">{current.name} plans</p>
              <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {current.cards.map(([name, cost, note]) => (
                  <div key={name} className="card-shape-sm border border-line p-2.5">
                    <span className="block h-1 w-6 rounded-full" style={{ background: BRAND }} />
                    <p className="mt-2 text-[11px] font-bold">{name}</p>
                    <p className="font-display text-[15px] font-bold" style={{ color: BRAND }}>
                      {cost}
                      {cost.startsWith("$") ? (
                        <span className="text-[9px] font-medium text-slate-400"> / check</span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-[9px] text-slate-400">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </BrowserFrame>
      </div>

      {/* The same site on a phone, answering a question. */}
      <div className="absolute right-5 bottom-[-18px] hidden sm:block">
        <PhoneFrame width={168}>
          <div className="h-[268px] bg-white">
            <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: BRAND }}>
              <span className="grid size-3.5 place-items-center rounded-[3px] bg-white text-[7px] font-black" style={{ color: BRAND }}>
                S
              </span>
              <span className="text-[8px] font-bold tracking-wider text-white">
                ASK ABOUT YOUR BENEFITS
              </span>
            </div>
            <div className="flex flex-col gap-2 p-2.5 text-[9px] leading-snug">
              <p
                className="max-w-[88%] self-end rounded-xl rounded-br-sm px-2.5 py-1.5 text-white"
                style={{ background: BRAND }}
              >
                Is urgent care covered on the PPO?
              </p>
              {chat === 0 ? null : chat === 1 ? (
                <span className="flex gap-1 self-start rounded-xl rounded-bl-sm bg-paper px-2.5 py-2">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="size-1 rounded-full bg-slate-400 anim-pulse" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </span>
              ) : (
                <div
                  className="max-w-[92%] self-start rounded-xl rounded-bl-sm bg-paper px-2.5 py-1.5"
                  style={{ animation: "hero-in 400ms var(--ease-out-expo) both" }}
                >
                  <p className="text-ink">
                    Yes. It&rsquo;s a $40 copay in network, and the ER is $250.
                  </p>
                  <p className="mt-1 text-[7px] font-semibold tracking-wide text-slate-400 uppercase">
                    From: PPO 1500 plan summary
                  </p>
                </div>
              )}
            </div>
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Benefit flyer                                                               */
/* -------------------------------------------------------------------------- */

function FlyerDemo() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  // Camera finds the code, the link appears, the site opens.
  const [beat] = useSequence(4, 1500, inView);

  return (
    <div ref={ref} className="relative flex h-full items-center justify-center p-6">
      <div
        className="relative overflow-hidden rounded-[4px] bg-white text-ink shadow-[0_24px_50px_-24px_rgba(5,14,26,0.55)] sm:-translate-x-20"
        style={{ width: 250, height: 368, rotate: "-2.5deg" }}
      >
        <div className="relative px-5 pt-4 pb-6" style={{ background: BRAND }}>
          <Logo />
          <p
            className="mt-4 text-[9px] font-bold tracking-[0.18em] uppercase"
            style={{ color: ACCENT }}
          >
            Open enrollment
          </p>
          <p className="mt-1 font-display text-[24px] leading-[1.02] font-bold text-white">
            Your 2027 benefits are here.
          </p>
          <span
            className="mt-3 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold text-ink"
            style={{ background: ACCENT }}
          >
            Nov 3 – Nov 14
          </span>
          <svg viewBox="0 0 250 24" className="absolute inset-x-0 -bottom-px w-full" preserveAspectRatio="none">
            <path d="M0 24V12Q62 0 125 10T250 6v18z" fill="#fff" />
          </svg>
        </div>
        <div className="px-5 pt-2">
          <p className="text-[8px] font-bold tracking-wider text-slate-400 uppercase">
            What&rsquo;s new
          </p>
          <ul className="mt-1.5 space-y-1.5 text-[10px]">
            {["A lower PPO deductible", "$750 into your HSA from Sample Company", "Free virtual care visits"].map((line) => (
              <li key={line} className="flex items-center gap-2">
                <span className="grid size-3.5 shrink-0 place-items-center rounded-full text-white" style={{ background: BRAND }}>
                  <CheckIcon className="size-2" />
                </span>
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-3.5 flex items-center gap-3 rounded-[4px] p-2" style={{ background: TINT }}>
            <QrCode size={52} />
            <p className="text-[9px] leading-snug">
              <span className="font-bold">Scan to see your benefits</span>
              <br />
              <span className="text-slate-600">No app, no login.</span>
            </p>
          </div>
        </div>
      </div>

      {/* A phone scanning the flyer. */}
      <div className="absolute right-6 bottom-[-22px] hidden sm:block">
        <PhoneFrame width={164}>
          <div className="relative h-[272px] overflow-hidden">
            {beat < 3 ? (
              <div className="absolute inset-0 grid place-items-center bg-ink-900">
                <div className="relative p-3">
                  <div className="rounded-[3px] bg-white p-1.5 opacity-90">
                    <QrCode size={64} />
                  </div>
                  {/* Viewfinder corners */}
                  {["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2", "bottom-0 left-0 border-b-2 border-l-2", "right-0 bottom-0 border-r-2 border-b-2"].map((c) => (
                    <span
                      key={c}
                      className={cx(
                        "absolute size-4 rounded-[3px] transition-colors duration-300",
                        c,
                        beat >= 1 ? "border-green-400" : "border-white/80",
                      )}
                    />
                  ))}
                  {beat === 0 ? (
                    <span
                      className="absolute inset-x-2 h-px bg-green-400 shadow-[0_0_8px_rgba(87,217,94,0.9)]"
                      style={{ animation: "scan-down 1.4s var(--ease-in-out-soft) infinite" }}
                    />
                  ) : null}
                </div>
                <span
                  className="absolute inset-x-3 bottom-4 flex items-center gap-1.5 rounded-lg bg-white/95 px-2 py-1.5 text-[9px] font-semibold text-ink shadow-lg transition-[opacity,translate] duration-300"
                  style={{ opacity: beat >= 1 ? 1 : 0, translate: beat >= 1 ? "0 0" : "0 8px" }}
                >
                  <span className="grid size-4 shrink-0 place-items-center rounded-[4px] text-[7px] font-black text-white" style={{ background: BRAND }}>
                    S
                  </span>
                  <span className="truncate">sampleco.truhu.site</span>
                  <span className={cx("ml-auto shrink-0 text-blue-700", beat >= 2 && "font-bold")}>Open</span>
                </span>
              </div>
            ) : (
              <div className="absolute inset-0 bg-white" style={{ animation: "hero-in 450ms var(--ease-out-expo) both" }}>
                <div className="px-3 pt-2.5 pb-3" style={{ background: BRAND }}>
                  <Logo small />
                  <p className="mt-3 font-display text-[13px] leading-tight font-bold text-white">
                    Your 2027 benefits, all in one place.
                  </p>
                </div>
                <div className="space-y-1.5 p-2.5">
                  {[["Medical", "3 plans"], ["Dental", "2 plans"], ["Vision", "1 plan"], ["Ask a question", "Get an answer"]].map(([name, note]) => (
                    <div key={name} className="flex items-center justify-between rounded-md border border-line px-2 py-1.5 text-[9px]">
                      <span className="font-bold">{name}</span>
                      <span className="text-slate-400">{note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Benefits chatbot                                                            */
/* -------------------------------------------------------------------------- */

/** The client's documents the answers are drawn from. */
const SOURCES = [
  "PPO 1500 plan summary",
  "HDHP 3200 plan summary",
  "2027 rates & contributions",
  "2027 benefits guide",
] as const;

const EXCHANGES: readonly {
  q: string;
  a: string;
  source: (typeof SOURCES)[number];
}[] = [
  {
    q: "Is urgent care covered on the PPO?",
    a: "Yes. It’s a $40 copay in network, and the ER is $250.",
    source: "PPO 1500 plan summary",
  },
  {
    q: "How much goes into my HSA?",
    a: "Sample Company adds $750 when you enroll in the HDHP 3200.",
    source: "2027 rates & contributions",
  },
  {
    q: "When do I have to enroll by?",
    a: "Open enrollment runs Nov 3 to Nov 14.",
    source: "2027 benefits guide",
  },
];

/** Per exchange: the question lands, the reply is typed, the answer lands. */
const BEATS_PER_EXCHANGE = 3;

function QnaDemo() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  // One extra beat at the end to sit on the finished conversation.
  const [beat] = useSequence(
    EXCHANGES.length * BEATS_PER_EXCHANGE + 1,
    1200,
    inView,
  );
  const latest = EXCHANGES.findLastIndex(
    (_, i) => beat >= i * BEATS_PER_EXCHANGE + 2,
  );
  const cited = latest >= 0 ? EXCHANGES[latest].source : null;

  return (
    <div ref={ref} className="relative flex h-full items-center justify-center p-6">
      <div className="sm:-translate-x-28">
        <PhoneFrame width={220}>
          <div className="flex h-[372px] flex-col bg-white">
            <div
              className="flex items-center justify-between px-3 py-2.5"
              style={{ background: BRAND }}
            >
              <Logo small />
              <span className="text-[7px] font-bold tracking-wider text-white/80">
                ASK ABOUT YOUR BENEFITS
              </span>
            </div>

            {/* Anchored to the bottom, so the thread grows like a chat; the
                top edge fades, so earlier messages read as scrolled away. */}
            <div className="flex min-h-0 flex-1 flex-col justify-end gap-2 overflow-hidden p-3 text-[10px] leading-snug [mask-image:linear-gradient(to_bottom,transparent,black_40px)]">
              {EXCHANGES.map((exchange, i) => {
                const start = i * BEATS_PER_EXCHANGE;
                if (beat < start) return null;
                return (
                  <Fragment key={exchange.q}>
                    <p
                      className="max-w-[85%] self-end rounded-xl rounded-br-sm px-2.5 py-1.5 text-white"
                      style={{
                        background: BRAND,
                        animation: "hero-in 400ms var(--ease-out-expo) both",
                      }}
                    >
                      {exchange.q}
                    </p>
                    {beat === start + 1 ? (
                      <span className="flex gap-1 self-start rounded-xl rounded-bl-sm bg-paper px-2.5 py-2">
                        {[0, 150, 300].map((d) => (
                          <span
                            key={d}
                            className="size-1 rounded-full bg-slate-400 anim-pulse"
                            style={{ animationDelay: `${d}ms` }}
                          />
                        ))}
                      </span>
                    ) : beat >= start + 2 ? (
                      <div
                        className="max-w-[92%] self-start rounded-xl rounded-bl-sm bg-paper px-2.5 py-1.5"
                        style={{ animation: "hero-in 400ms var(--ease-out-expo) both" }}
                      >
                        <p className="text-ink">{exchange.a}</p>
                        <p className="mt-1 text-[7px] font-semibold tracking-wide text-slate-400 uppercase">
                          From: {exchange.source}
                        </p>
                      </div>
                    ) : null}
                  </Fragment>
                );
              })}
            </div>

            <div className="border-t border-line p-2">
              <p className="rounded-full border border-line bg-paper px-3 py-1.5 text-[9px] text-slate-400">
                Ask a question&hellip;
              </p>
            </div>
          </div>
        </PhoneFrame>
      </div>

      {/* Where each answer came from, lit as it is used. */}
      <div className="absolute top-1/2 right-5 hidden w-[210px] -translate-y-1/2 rounded-xl border border-line bg-white p-3 shadow-[0_24px_50px_-26px_rgba(5,14,26,0.55)] sm:block">
        <p className="text-[10px] font-bold text-blue-700">
          Answers from Sample Company&rsquo;s documents
        </p>
        <ul className="mt-2 space-y-1">
          {SOURCES.map((source) => (
            <li
              key={source}
              className={cx(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-[9.5px] font-semibold transition-colors duration-300",
                source === cited ? "bg-blue-100 text-blue-700" : "text-slate-600",
              )}
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
                className="size-3 shrink-0"
                aria-hidden
              >
                <path d="M4 2.5h5.5L12 5v8.5H4z" />
              </svg>
              {source}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Narrated video                                                              */
/* -------------------------------------------------------------------------- */

/** What the voice says over the medical slide, and the plan it lights. */
const NARRATION = [
  { plan: 0, line: "The PPO 1500 gives you the most flexibility, with $25 doctor visits." },
  { plan: 1, line: "The HDHP 3200 has the lowest premium, and it pairs with an HSA." },
] as const;

/** Two lines narrated, then the viewer stops it to ask, the reply is typed,
 *  and the answer lands. The answer is the last beat, which reduced motion
 *  holds. */
const VIDEO_BEATS = 5;
const ASKED_AT = NARRATION.length;

/** How far through the video each beat is. It stops moving once paused. */
const PLAYED = ["36%", "40%", "42%"] as const;
const CLOCK = ["3:08", "3:19", "3:26"] as const;

function VideoDemo() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const [beat] = useSequence(VIDEO_BEATS, 1400, inView);
  const paused = beat >= ASKED_AT;
  const said = NARRATION[Math.min(beat, NARRATION.length - 1)];
  const at = Math.min(beat, PLAYED.length - 1);

  return (
    <div ref={ref} className="relative flex h-full items-center justify-center p-5 sm:p-8">
      <div className="w-full max-w-[540px] overflow-hidden rounded-xl bg-ink-950 shadow-[0_24px_50px_-24px_rgba(5,14,26,0.55)]">
        {/* The guide, playing as a presentation. */}
        <div className="relative aspect-video overflow-hidden bg-white text-ink">
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{ background: BRAND }}
          >
            <Logo />
            <span className="text-[8px] font-semibold tracking-wider text-white/70 uppercase">
              Medical · 3 of 12
            </span>
          </div>
          <div className="h-[3px]" style={{ background: ACCENT }} />
          <div className="px-4 pt-3">
            <PageTitle kicker="Medical" title="Compare your medical plans" />
            <div className="mt-3 grid grid-cols-3 gap-2">
              {SITE_TABS[0].cards.map(([name, cost, note], i) => {
                const lit = !paused && said.plan === i;
                return (
                  <div
                    key={name}
                    className="card-shape-sm border border-line p-2 transition-[border-color,box-shadow] duration-300"
                    style={
                      lit
                        ? { borderColor: BRAND, boxShadow: `0 0 0 1px ${BRAND}` }
                        : undefined
                    }
                  >
                    <span className="block h-1 w-6 rounded-full" style={{ background: BRAND }} />
                    <p className="mt-1.5 text-[10px] font-bold">{name}</p>
                    <p className="font-display text-[14px] font-bold" style={{ color: BRAND }}>
                      {cost}
                      <span className="text-[8px] font-medium text-slate-400"> / check</span>
                    </p>
                    <p className="mt-0.5 hidden text-[8px] leading-snug text-slate-400 sm:block">
                      {note}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subtitles, while it plays. */}
          {!paused ? (
            <p
              key={beat}
              className="absolute inset-x-6 bottom-3 rounded-md bg-ink-950/85 px-3 py-1.5 text-center text-[10px] leading-snug text-white"
              style={{ animation: "hero-in 400ms var(--ease-out-expo) both" }}
            >
              {said.line}
            </p>
          ) : null}

          {/* Stopped partway to ask: the answer comes from the client's plans. */}
          <div
            className={cx(
              "absolute inset-0 bg-ink-950/25 transition-opacity duration-300",
              paused ? "opacity-100" : "opacity-0",
            )}
          />
          {paused ? (
            <div
              className="absolute inset-2 flex flex-col overflow-hidden rounded-lg border border-line bg-white p-2.5 shadow-[0_18px_40px_-20px_rgba(5,14,26,0.6)] sm:left-auto sm:w-[46%]"
              style={{ animation: "hero-in 450ms var(--ease-out-expo) both" }}
            >
              <p className="hidden text-[7px] font-bold tracking-wider text-slate-400 uppercase sm:block">
                Video paused · Ask anything
              </p>
              <div className="flex min-h-0 flex-1 flex-col gap-1.5 text-[9px] leading-snug sm:mt-2">
                <p
                  className="max-w-[90%] self-end rounded-xl rounded-br-sm px-2.5 py-1.5 text-white"
                  style={{ background: BRAND }}
                >
                  Does Sample Company put money in my HSA?
                </p>
                {beat === ASKED_AT + 1 ? (
                  <span className="flex gap-1 self-start rounded-xl rounded-bl-sm bg-paper px-2.5 py-2">
                    {[0, 150, 300].map((d) => (
                      <span
                        key={d}
                        className="size-1 rounded-full bg-slate-400 anim-pulse"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </span>
                ) : beat >= ASKED_AT + 2 ? (
                  <div
                    className="max-w-[94%] self-start rounded-xl rounded-bl-sm bg-paper px-2.5 py-1.5"
                    style={{ animation: "hero-in 400ms var(--ease-out-expo) both" }}
                  >
                    <p className="text-ink">
                      Yes. Sample Company adds $750 when you enroll in the HDHP 3200.
                    </p>
                    <p className="mt-1 text-[7px] font-semibold tracking-wide text-slate-400 uppercase">
                      From: 2027 rates &amp; contributions
                    </p>
                  </div>
                ) : null}
              </div>
              {beat >= ASKED_AT + 2 ? (
                <span
                  className="mt-1.5 inline-flex items-center gap-1 self-start rounded-full px-2 py-1 text-[8px] font-bold text-white"
                  style={{
                    background: BRAND,
                    animation: "hero-in 400ms var(--ease-out-expo) both",
                    animationDelay: "250ms",
                  }}
                >
                  <PlayGlyph paused className="size-2" />
                  Resume from {CLOCK[at]}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Player controls. */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 text-white">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/10">
            <PlayGlyph paused={paused} className="size-2.5" />
          </span>
          <span className="tabular shrink-0 text-[9px] text-white/60">
            {CLOCK[at]} / 8:40
          </span>
          <span className="relative h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/15">
            <span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: PLAYED[at],
                background: "var(--grad-brand-bright)",
                // Back to the start of the loop without running backwards.
                transition: beat === 0 ? "none" : "width 1300ms linear",
              }}
            />
          </span>
          <span className="hidden shrink-0 text-[9px] text-white/50 sm:inline">
            AI voice · 1.0&times;
          </span>
          <span
            className={cx(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold transition-colors duration-300",
              paused ? "bg-white text-ink" : "bg-white/10 text-white/80",
            )}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="size-3"
              aria-hidden
            >
              <rect x="5.5" y="2" width="5" height="8" rx="2.5" />
              <path d="M3.5 7.5a4.5 4.5 0 0 0 9 0M8 12v2" />
            </svg>
            Ask a question
          </span>
        </div>
      </div>
    </div>
  );
}

/** Play while paused, pause while playing, as a player's button shows it. */
function PlayGlyph({ paused, className }: { paused: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
      {paused ? (
        <path d="M4.5 2.5v11l9-5.5z" />
      ) : (
        <>
          <rect x="3.5" y="2.5" width="3" height="11" rx="0.75" />
          <rect x="9.5" y="2.5" width="3" height="11" rx="0.75" />
        </>
      )}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Small parts                                                                 */
/* -------------------------------------------------------------------------- */

function Logo({ small = false }: { small?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cx(
          "grid place-items-center rounded-[3px] bg-white font-black",
          small ? "size-3.5 text-[7px]" : "size-4 text-[8px]",
        )}
        style={{ color: BRAND }}
      >
        S
      </span>
      <span
        className={cx(
          "font-bold tracking-[0.14em] text-white",
          small ? "text-[7px]" : "text-[9px]",
        )}
      >
        SAMPLE CO
      </span>
    </span>
  );
}

/** A deterministic, QR-like pattern. Decorative: it does not encode anything. */
const QR_SIZE = 21;
const QR_CELLS = (() => {
  const cells: [number, number][] = [];
  let seed = 11;
  const next = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const inFinder = (x: number, y: number) =>
    (x < 8 && y < 8) || (x >= QR_SIZE - 8 && y < 8) || (x < 8 && y >= QR_SIZE - 8);
  for (let y = 0; y < QR_SIZE; y++) {
    for (let x = 0; x < QR_SIZE; x++) {
      if (!inFinder(x, y) && next() > 0.5) cells.push([x, y]);
    }
  }
  return cells;
})();

function QrCode({ size }: { size: number }) {
  const finders = [
    [0, 0],
    [QR_SIZE - 7, 0],
    [0, QR_SIZE - 7],
  ];
  return (
    <svg
      viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className="shrink-0"
    >
      <rect width={QR_SIZE} height={QR_SIZE} fill="#fff" />
      {QR_CELLS.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#0a1826" />
      ))}
      {finders.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="7" height="7" fill="#0a1826" />
          <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
          <rect x={x + 2} y={y + 2} width="3" height="3" fill="#0a1826" />
        </g>
      ))}
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

function CheckIcon({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} style={style} aria-hidden>
      <path
        d="M3.5 8.4 6.6 11.3 12.5 4.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
