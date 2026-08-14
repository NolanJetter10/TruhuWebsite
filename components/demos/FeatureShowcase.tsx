"use client";

import { useEffect, useState } from "react";
import { BrowserFrame } from "@/components/art/frames";
import { SampleTag, cx } from "@/components/ui/primitives";
import { FEATURES } from "@/lib/content";
import { useInView, useReducedMotion, useSequence } from "./hooks";

/**
 * The four Advisor capabilities, each with its own small running demo.
 *
 * The rail advances itself so a visitor who never clicks still sees all four,
 * and a click resets the dwell timer rather than stopping it — the timeout is
 * keyed on the active tab, so selecting a tab restarts the countdown.
 */

const DWELL = 5200;

export function FeatureShowcase() {
  const [ref, inView] = useInView<HTMLDivElement>(0.25);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;
    const id = window.setTimeout(
      () => setActive((current) => (current + 1) % FEATURES.length),
      DWELL,
    );
    return () => window.clearTimeout(id);
  }, [active, inView, reduced]);

  const feature = FEATURES[active]!;

  return (
    <div ref={ref} className="grid gap-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-14">
      {/* Rail ------------------------------------------------------------- */}
      <div role="tablist" aria-label="Advisor capabilities" className="flex flex-col gap-1">
        {FEATURES.map((item, i) => {
          const selected = i === active;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              id={`tab-${item.key}`}
              aria-selected={selected}
              aria-controls={`panel-${item.key}`}
              onClick={() => setActive(i)}
              className={cx(
                "group relative rounded-xl px-4 py-4 text-left transition-colors duration-300",
                selected ? "bg-white shadow-[0_18px_40px_-30px_rgba(5,14,26,0.6)]" : "hover:bg-white/60",
              )}
            >
              <span
                aria-hidden
                className={cx(
                  "absolute inset-y-3 left-0 w-0.5 rounded-full transition-colors duration-300",
                  selected ? "bg-line" : "bg-transparent",
                )}
              />
              {/* The dwell indicator doubles as the active marker. */}
              {selected ? (
                <span
                  key={active}
                  aria-hidden
                  className="absolute inset-y-3 left-0 w-0.5 origin-top rounded-full"
                  style={{
                    background: "var(--grad-brand)",
                    animation: reduced
                      ? "none"
                      : `dwell ${DWELL}ms linear forwards`,
                  }}
                />
              ) : null}
              <span
                className={cx(
                  "t-h4 block transition-colors duration-300",
                  selected ? "text-ink" : "text-slate-400 group-hover:text-ink",
                )}
              >
                {item.name}
              </span>
              <span
                className="grid transition-[grid-template-rows,opacity] duration-500 ease-out"
                style={{
                  gridTemplateRows: selected ? "1fr" : "0fr",
                  opacity: selected ? 1 : 0,
                }}
              >
                <span className="overflow-hidden">
                  <span className="mt-2 block text-[0.9375rem] leading-relaxed text-slate-600">
                    {item.blurb}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Panel ------------------------------------------------------------ */}
      <div
        role="tabpanel"
        id={`panel-${feature.key}`}
        aria-labelledby={`tab-${feature.key}`}
        className="relative min-w-0"
      >
        {/* Keyed so each panel replays its own entrance. */}
        <div key={feature.key} className="demo-in">
          {feature.key === "materials" ? <MaterialStack /> : null}
          {feature.key === "pipeline" ? <BuildTimeline /> : null}
          {feature.key === "brand" ? <MicrositeSwap /> : null}
          {feature.key === "answers" ? <QAChat /> : null}
        </div>
        <SampleTag className="absolute -top-3 right-4 shadow-sm" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const MATERIALS = [
  {
    kind: "OE guide",
    title: "Your 2027 Benefits",
    rows: ["PPO 1500", "HDHP 3200", "Dental + Vision"],
    cta: "Start my enrollment",
  },
  {
    kind: "Benefits website",
    title: "Ridgeline Benefits Hub",
    rows: ["Medical", "Dental & vision", "Enrollment steps"],
    cta: "ridgeline.truhu.site",
  },
  {
    kind: "Notice packet",
    title: "2027 Annual Notices",
    rows: ["CHIP notice", "Medicare Part D", "HIPAA privacy"],
    cta: "Delivery logged",
  },
  {
    kind: "Benefit flyer",
    title: "Enroll Nov 3–14",
    rows: ["Key dates", "What is changing", "How to enroll"],
    cta: "One page, their brand",
  },
];

/** The four material types off one engine, cycling to the front. */
function MaterialStack() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const [front] = useSequence(MATERIALS.length, 2300, inView);

  return (
    <div ref={ref} className="flex min-h-[330px] items-center justify-center py-6">
      <div className="relative h-[268px] w-[210px]">
        {MATERIALS.map((material, i) => {
          const offset = (i - front + MATERIALS.length) % MATERIALS.length;
          return (
            <div
              key={material.kind}
              className="card-shape absolute inset-0 overflow-hidden border border-line bg-white transition-all duration-[700ms] ease-out"
              style={{
                transform: `translate3d(${offset * 16}px, ${offset * -10}px, 0) scale(${1 - offset * 0.05})`,
                opacity: offset > 2 ? 0 : 1 - offset * 0.22,
                zIndex: MATERIALS.length - offset,
                boxShadow: "0 24px 50px -30px rgba(5,14,26,0.6)",
              }}
            >
              <div className="bg-[#0E5A63] px-3 py-2.5">
                <p className="text-[8px] font-bold tracking-wider text-white/70">
                  RIDGELINE MANUFACTURING
                </p>
                <p className="mt-1 text-[13px] leading-tight font-bold text-white">
                  {material.title}
                </p>
              </div>
              <div className="space-y-1.5 p-3">
                {material.rows.map((row) => (
                  <div key={row} className="rounded-md border border-line px-2 py-1.5">
                    <p className="text-[10px] font-bold text-ink">{row}</p>
                    <div className="mt-1 h-1 w-2/3 rounded-full bg-line" />
                  </div>
                ))}
                <p className="rounded-full bg-[#0E5A63] py-1.5 text-center text-[10px] font-semibold text-white">
                  {material.cta}
                </p>
              </div>
              <p className="absolute right-2 bottom-2 rounded-full bg-blue-100 px-1.5 py-0.5 text-[8px] font-bold text-blue-700">
                {material.kind}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const BUILD_STEPS = [
  { when: "Upload", what: "SBCs, rate sheets, plan documents", who: "Parsing starts on upload" },
  { when: "Read", what: "Every page classified and labeled", who: "Prior-year guides left out" },
  { when: "Structure", what: "The numbers become fields", who: "Side-by-side per benefit type" },
  { when: "Confirm", what: "You review the plan list", who: "The one human step" },
  { when: "Build", what: "Guide, site, notices, flyer", who: "Ready to edit before anyone sees it" },
];

/** The build pipeline filling in, one step at a time. */
function BuildTimeline() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const [beat] = useSequence(BUILD_STEPS.length + 1, 1300, inView);

  return (
    <div ref={ref} className="card-shape border border-line bg-white p-6 shadow-[0_30px_70px_-40px_rgba(5,14,26,0.5)]">
      <div className="relative pl-7">
        {/* The spine, and the progress travelling down it. */}
        <span aria-hidden className="absolute top-2 bottom-2 left-[7px] w-px bg-line" />
        <span
          aria-hidden
          className="absolute top-2 left-[7px] w-px origin-top transition-[height] duration-[1200ms] ease-out"
          style={{
            height: `${(Math.min(beat, BUILD_STEPS.length - 1) / (BUILD_STEPS.length - 1)) * 100}%`,
            bottom: "auto",
            background: "var(--grad-brand)",
          }}
        />
        <ul className="space-y-5">
          {BUILD_STEPS.map((step, i) => {
            const done = beat > i;
            return (
              <li key={step.when} className="relative">
                <span
                  aria-hidden
                  className={cx(
                    "absolute top-1 -left-7 grid size-[15px] place-items-center rounded-full border-2 transition-all duration-500",
                    done
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-line bg-white",
                  )}
                >
                  {done ? <span className="text-[8px] leading-none">✓</span> : null}
                </span>
                <div
                  className="transition-all duration-500 ease-out"
                  style={{ opacity: done ? 1 : 0.45 }}
                >
                  <p className="tabular text-[10px] font-bold tracking-wider text-blue-700 uppercase">
                    {step.when}
                  </p>
                  <p className="text-[13px] font-semibold text-ink">{step.what}</p>
                  <p className="text-[11px] text-slate-400">{step.who}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const CLIENTS = [
  { name: "Ridgeline Manufacturing", host: "ridgeline", brand: "#0E5A63", mark: "R" },
  { name: "Lake Medical Imaging", host: "lakemedical", brand: "#1E3A8A", mark: "L" },
  { name: "Securatech", host: "securatech", brand: "#7A2E3A", mark: "S" },
];

/** Every client gets their own hub: same build, their brand. */
function MicrositeSwap() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const [index] = useSequence(CLIENTS.length, 2600, inView);
  const client = CLIENTS[index]!;

  return (
    <div ref={ref}>
      <BrowserFrame label={`${client.host}.truhu.site`}>
        <div className="min-h-[320px]">
          <div
            className="px-5 py-4 transition-colors duration-[900ms] ease-out"
            style={{ background: client.brand }}
          >
            <div className="flex items-center gap-2.5">
              <span
                key={client.mark}
                className="grid size-7 place-items-center rounded-md bg-white/90 text-[13px] font-black"
                style={{ color: client.brand, animation: "hero-in 500ms var(--ease-out-expo) both" }}
              >
                {client.mark}
              </span>
              <div className="min-w-0">
                <p key={client.name} className="truncate text-[13px] font-bold text-white" style={{ animation: "hero-in 500ms var(--ease-out-expo) 60ms both" }}>
                  {client.name}
                </p>
                <p className="text-[9px] tracking-wider text-white/65 uppercase">
                  2027 Benefits Hub
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-4 text-[10px] font-semibold text-white/80">
              {["Medical", "Dental", "Vision", "401(k)", "Contact HR"].map((tab) => (
                <span key={tab}>{tab}</span>
              ))}
            </div>
          </div>

          <div className="grid gap-2.5 p-5 sm:grid-cols-2">
            {["Medical plans", "Dental & vision", "Enrollment steps", "Ask a question"].map(
              (title, i) => (
                <div
                  key={title}
                  className="card-shape-sm border border-line p-3 transition-all duration-500"
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <span
                    className="mb-2 block h-1.5 w-8 rounded-full transition-colors duration-[900ms]"
                    style={{ background: client.brand }}
                  />
                  <p className="text-[12px] font-bold text-ink">{title}</p>
                  <div className="mt-2 space-y-1">
                    <span className="block h-1 w-full rounded-full bg-line" />
                    <span className="block h-1 w-3/5 rounded-full bg-line" />
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </BrowserFrame>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const EXCHANGES = [
  {
    q: "Is urgent care covered on the PPO?",
    a: "Yes — a $40 copay in network on PPO 1500. The ER copay is $250, waived if you are admitted.",
  },
  {
    q: "When does open enrollment close?",
    a: "Friday, November 14. Your elections carry into the new plan year on January 1.",
  },
];

/** The share link hosts a chat that answers from this client's plan facts. */
function QAChat() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  // Two beats per exchange: the question lands, then the answer resolves.
  const [beat] = useSequence(EXCHANGES.length * 2, 2100, inView);
  const exchange = EXCHANGES[Math.floor(beat / 2) % EXCHANGES.length]!;
  const answered = beat % 2 === 1;

  return (
    <div
      ref={ref}
      className="card-shape border border-line bg-white p-6 shadow-[0_30px_70px_-40px_rgba(5,14,26,0.5)]"
    >
      <p className="t-eyebrow text-slate-400">Ask about your benefits</p>
      <p className="mt-1 text-[11px] text-slate-400">
        Answers come from this client&apos;s own plan documents.
      </p>

      <div className="mt-5 flex min-h-[220px] flex-col gap-3">
        <p
          key={exchange.q}
          className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-blue-100 px-4 py-2.5 text-[13px] leading-snug text-ink"
          style={{ animation: "hero-in 450ms var(--ease-out-expo) both" }}
        >
          {exchange.q}
        </p>

        {answered ? (
          <div
            key={exchange.a}
            className="max-w-[85%] self-start rounded-2xl rounded-bl-md bg-paper px-4 py-2.5"
            style={{ animation: "hero-in 450ms var(--ease-out-expo) both" }}
          >
            <p className="text-[13px] leading-snug text-slate-600">{exchange.a}</p>
            <p className="mt-1.5 text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
              From: PPO 1500 plan summary
            </p>
          </div>
        ) : (
          <span className="flex gap-1 self-start rounded-2xl rounded-bl-md bg-paper px-4 py-3">
            <span className="size-1.5 rounded-full bg-slate-400 anim-pulse" />
            <span className="size-1.5 rounded-full bg-slate-400 anim-pulse" style={{ animationDelay: "150ms" }} />
            <span className="size-1.5 rounded-full bg-slate-400 anim-pulse" style={{ animationDelay: "300ms" }} />
          </span>
        )}
      </div>

      <p className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-[11px] text-slate-400">
        <span className="size-1.5 shrink-0 rounded-full bg-green-500" />
        No app, no login — employees open a link.
      </p>
    </div>
  );
}
