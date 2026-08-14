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
          {feature.key === "guides" ? <GuideStack /> : null}
          {feature.key === "comms" ? <CampaignTimeline /> : null}
          {feature.key === "microsites" ? <MicrositeSwap /> : null}
          {feature.key === "decision" ? <DecisionSupport /> : null}
        </div>
        <SampleTag className="absolute -top-3 right-4 shadow-sm" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const GUIDES = [
  { lang: "English", title: "Your 2026 Benefits", cta: "Start my enrollment" },
  { lang: "Español", title: "Sus beneficios 2026", cta: "Comenzar inscripción" },
  { lang: "Tiếng Việt", title: "Phúc lợi 2026", cta: "Bắt đầu đăng ký" },
  { lang: "简体中文", title: "您的 2026 年福利", cta: "开始参保" },
];

/** The same guide, one card per language, cycling to the front. */
function GuideStack() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const [front] = useSequence(GUIDES.length, 2300, inView);

  return (
    <div ref={ref} className="flex min-h-[330px] items-center justify-center py-6">
      <div className="relative h-[268px] w-[210px]">
        {GUIDES.map((guide, i) => {
          const offset = (i - front + GUIDES.length) % GUIDES.length;
          return (
            <div
              key={guide.lang}
              className="card-shape absolute inset-0 overflow-hidden border border-line bg-white transition-all duration-[700ms] ease-out"
              style={{
                transform: `translate3d(${offset * 16}px, ${offset * -10}px, 0) scale(${1 - offset * 0.05})`,
                opacity: offset > 2 ? 0 : 1 - offset * 0.22,
                zIndex: GUIDES.length - offset,
                boxShadow: "0 24px 50px -30px rgba(5,14,26,0.6)",
              }}
            >
              <div className="bg-[#0E5A63] px-3 py-2.5">
                <p className="text-[8px] font-bold tracking-wider text-white/70">
                  RIDGELINE MANUFACTURING
                </p>
                <p className="mt-1 text-[13px] leading-tight font-bold text-white">
                  {guide.title}
                </p>
              </div>
              <div className="space-y-1.5 p-3">
                {["PPO 1500", "HDHP 3200", "Dental + Vision"].map((plan) => (
                  <div key={plan} className="rounded-md border border-line px-2 py-1.5">
                    <p className="text-[10px] font-bold text-ink">{plan}</p>
                    <div className="mt-1 h-1 w-2/3 rounded-full bg-line" />
                  </div>
                ))}
                <p className="rounded-full bg-[#0E5A63] py-1.5 text-center text-[10px] font-semibold text-white">
                  {guide.cta}
                </p>
              </div>
              <p className="absolute right-2 bottom-2 rounded-full bg-blue-100 px-1.5 py-0.5 text-[8px] font-bold text-blue-700">
                {guide.lang}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const CAMPAIGN_STEPS = [
  { when: "Sep 15", what: "Open enrollment announcement", who: "All employees" },
  { when: "Oct 1", what: "Benefit guide delivered", who: "1,204 sent" },
  { when: "Oct 8", what: "Reminder to non-openers", who: "Automatic re-send" },
  { when: "Oct 18", what: "48 hours left to enroll", who: "Still-pending only" },
  { when: "Jan 6", what: "New hire onboarding", who: "Runs all year" },
];

/** A year of sends filling in, one node at a time. */
function CampaignTimeline() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const [beat] = useSequence(CAMPAIGN_STEPS.length + 1, 1300, inView);

  return (
    <div ref={ref} className="card-shape border border-line bg-white p-6 shadow-[0_30px_70px_-40px_rgba(5,14,26,0.5)]">
      <div className="relative pl-7">
        {/* The spine, and the progress travelling down it. */}
        <span aria-hidden className="absolute top-2 bottom-2 left-[7px] w-px bg-line" />
        <span
          aria-hidden
          className="absolute top-2 left-[7px] w-px origin-top transition-[height] duration-[1200ms] ease-out"
          style={{
            height: `${(Math.min(beat, CAMPAIGN_STEPS.length - 1) / (CAMPAIGN_STEPS.length - 1)) * 100}%`,
            bottom: "auto",
            background: "var(--grad-brand)",
          }}
        />
        <ul className="space-y-5">
          {CAMPAIGN_STEPS.map((step, i) => {
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
                  2026 Benefits Hub
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

const PROFILES = [
  {
    who: "Single · low usage · no prescriptions",
    pick: 1,
    reason: "Lower premium, and the HSA match covers the higher deductible.",
  },
  {
    who: "Family of four · ongoing prescriptions",
    pick: 0,
    reason: "Predictable copays beat the deductible at this level of usage.",
  },
];

const PLANS = [
  { name: "PPO 1500", premium: "$182/mo", deductible: "$1,500", extra: "Copays from $25" },
  { name: "HDHP 3200", premium: "$96/mo", deductible: "$3,200", extra: "Employer HSA $750" },
];

/** An employee's own situation resolving to a plan they can explain. */
function DecisionSupport() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  // Two beats per profile: one thinking, one resolved.
  const [beat] = useSequence(PROFILES.length * 2, 1900, inView);
  const profile = PROFILES[Math.floor(beat / 2) % PROFILES.length]!;
  const resolved = beat % 2 === 1;

  return (
    <div
      ref={ref}
      className="card-shape border border-line bg-white p-6 shadow-[0_30px_70px_-40px_rgba(5,14,26,0.5)]"
    >
      <p className="t-eyebrow text-slate-400">Your situation</p>
      <p key={profile.who} className="mt-2 text-[14px] font-semibold text-ink" style={{ animation: "hero-in 450ms var(--ease-out-expo) both" }}>
        {profile.who}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {PLANS.map((plan, i) => {
          const chosen = resolved && profile.pick === i;
          return (
            <div
              key={plan.name}
              className={cx(
                "card-shape-sm relative border p-4 transition-all duration-[600ms] ease-out",
                chosen
                  ? "-translate-y-1 border-green-500 bg-green-100/50 shadow-[0_18px_40px_-24px_rgba(56,176,0,0.8)]"
                  : "border-line",
              )}
              style={{ opacity: resolved && !chosen ? 0.55 : 1 }}
            >
              <p className="t-h4">{plan.name}</p>
              <p className="tabular mt-2 text-[1.375rem] leading-none font-bold text-ink">
                {plan.premium}
              </p>
              <dl className="mt-3 space-y-1 text-[11px] text-slate-600">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Deductible</dt>
                  <dd className="tabular font-semibold">{plan.deductible}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Also</dt>
                  <dd className="font-semibold">{plan.extra}</dd>
                </div>
              </dl>
              <span
                className="absolute -top-2.5 left-4 rounded-full bg-green-500 px-2 py-0.5 text-[9px] font-bold tracking-wide text-ink-950 uppercase transition-all duration-500"
                style={{
                  opacity: chosen ? 1 : 0,
                  transform: chosen ? "none" : "translateY(6px) scale(0.9)",
                }}
              >
                Best match
              </span>
            </div>
          );
        })}
      </div>

      <p
        className="mt-4 flex min-h-[2.5rem] items-center gap-2 rounded-lg bg-paper px-3 py-2 text-[12px] leading-snug text-slate-600 transition-opacity duration-500"
        style={{ opacity: resolved ? 1 : 0.4 }}
      >
        <span
          className={cx(
            "size-1.5 shrink-0 rounded-full",
            resolved ? "bg-green-500" : "bg-blue-500 anim-pulse",
          )}
        />
        {resolved ? profile.reason : "Comparing plans against your situation…"}
      </p>
    </div>
  );
}
