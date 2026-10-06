"use client";

import { useEffect, useState } from "react";
import { cx } from "@/components/ui/primitives";
import { TECH_PAGE } from "@/lib/content";
import { useInView, useReducedMotion } from "./hooks";

/**
 * The Ensemble platform at a glance, for the Technology hero: the four stacked
 * layers from Ensemble's architecture (channels, agents, context, security)
 * with observability alongside, and one employee question walked through them.
 *
 * Each step lights the layer doing the work and the parts of it in use. The
 * server renders the last step, with the question answered, so the panel
 * makes sense before any script runs and under reduced motion; the loop runs
 * only while the panel is on screen. Picking a step stops the loop, so a
 * reader comparing steps isn't overruled.
 */

const { flow } = TECH_PAGE;
const STEPS = flow.steps;
const LAST = STEPS.length - 1;
const DWELL = 2600;

type Layer = "channels" | "agents" | "context" | "security";

/** The stack, top to bottom, as Ensemble draws it. */
const LAYERS: readonly { key: Layer; name: string; parts: readonly string[] }[] = [
  { key: "channels", name: "Channels", parts: ["SMS", "Chat widget", "WhatsApp", "API"] },
  { key: "agents", name: "Agents", parts: ["Supervisor", "Sub-agent A", "Sub-agent B", "Model"] },
  { key: "context", name: "Context", parts: ["Knowledge bases", "Workflows", "Tools", "Memory"] },
  { key: "security", name: "Security", parts: ["Tenant isolation", "Access control", "Audit trail", "Key store"] },
];

const OBSERVE = ["Evals", "Tracing", "Feedback", "Improve"] as const;

/** Per step: the layer the request is in, and the parts it is using. */
const PLAN: readonly { layer: Layer; lit: readonly string[]; observe?: readonly string[] }[] = [
  { layer: "channels", lit: ["SMS"] },
  { layer: "agents", lit: ["Supervisor", "Sub-agent B", "Model"] },
  { layer: "context", lit: ["Knowledge bases"] },
  { layer: "context", lit: ["Workflows"] },
  { layer: "security", lit: ["Tenant isolation", "Access control"] },
  { layer: "channels", lit: ["SMS"], observe: ["Tracing", "Feedback"] },
];

/** Row height and gap, shared by the rows and the request marker's rail. */
const ROW = 60;
const GAP = 8;

export function PlatformFlow() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const reduced = useReducedMotion();
  const [step, setStep] = useState(LAST);
  const [exploring, setExploring] = useState(false);

  useEffect(() => {
    if (!inView || reduced || exploring) return;
    const id = window.setTimeout(
      () => setStep((current) => (current + 1) % STEPS.length),
      DWELL,
    );
    return () => window.clearTimeout(id);
  }, [step, inView, reduced, exploring]);

  const pick = (i: number) => {
    setExploring(true);
    setStep(i);
  };

  const plan = PLAN[step];
  const row = LAYERS.findIndex((layer) => layer.key === plan.layer);
  const answered = step === LAST;

  return (
    <div
      ref={ref}
      className="card-shape-lg relative border border-white/10 bg-white/[0.03] p-4 shadow-[0_40px_90px_-50px_rgba(0,0,0,0.9)] backdrop-blur-sm sm:p-5"
    >
      {/* The conversation the request belongs to. ------------------------- */}
      {/* Both bubbles always hold their space, so the panel never changes
          height as the answer comes and goes. */}
      <div aria-hidden className="flex flex-col gap-2">
        <p
          className="max-w-[80%] self-end rounded-2xl rounded-br-md bg-[#0E5A63] px-3.5 py-2 text-[13px] leading-snug text-white"
          style={{ animation: "hero-in 500ms var(--ease-out-expo) both" }}
          key={step === 0 ? "asked" : "held"}
        >
          {flow.question}
        </p>
        <div
          className={cx(
            "max-w-[86%] self-start rounded-2xl rounded-bl-md bg-white/[0.08] px-3.5 py-2 text-[13px] leading-snug text-white/90 transition-[opacity,translate] duration-500",
            answered ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0",
          )}
        >
          {flow.answer}
          <span className="mt-1 block text-[10px] font-semibold tracking-wider text-white/45 uppercase">
            From: {flow.source}
          </span>
        </div>
      </div>

      {/* The platform. ----------------------------------------------------- */}
      <div aria-hidden className="mt-4 grid grid-cols-[minmax(0,1fr)_88px] gap-2.5 sm:grid-cols-[minmax(0,1fr)_104px]">
        <div className="relative pl-5">
          {/* The request's path down the stack. */}
          <span className="absolute top-2 bottom-2 left-[5px] w-px bg-gradient-to-b from-white/5 via-white/20 to-white/5" />
          <span
            className="absolute left-0 size-[11px] rounded-full bg-green-400 shadow-[0_0_0_4px_rgba(87,217,94,0.18),0_0_18px_rgba(87,217,94,0.8)] transition-[top] duration-700"
            style={{
              top: row * (ROW + GAP) + ROW / 2 - 5.5,
              transitionTimingFunction: "var(--ease-out-expo)",
            }}
          />

          <ul className="flex flex-col" style={{ gap: GAP }}>
            {LAYERS.map((layer) => {
              const active = layer.key === plan.layer;
              return (
                <li
                  key={layer.key}
                  className={cx(
                    "flex flex-col justify-center rounded-xl border px-3 transition-[background-color,border-color,box-shadow] duration-500",
                    active
                      ? "border-blue-400/50 bg-blue-400/[0.08] shadow-[0_12px_36px_-14px_rgba(56,182,255,0.55)]"
                      : "border-white/10 bg-white/[0.025]",
                  )}
                  style={{ height: ROW }}
                >
                  <p
                    className={cx(
                      "text-[10px] font-bold tracking-[0.12em] uppercase transition-colors duration-500",
                      active ? "text-blue-400" : "text-white/40",
                    )}
                  >
                    {layer.name}
                  </p>
                  {/* On a phone the row runs out before the parts do; the
                      fade makes the cut read as deliberate. */}
                  <div className="mt-1.5 flex gap-1.5 overflow-hidden max-sm:[mask-image:linear-gradient(to_right,black_78%,transparent)]">
                    {layer.parts.map((part) => {
                      const lit = active && plan.lit.includes(part);
                      return (
                        <span
                          key={part}
                          className={cx(
                            "shrink-0 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold whitespace-nowrap transition-colors duration-500",
                            lit
                              ? "bg-green-400/15 text-green-400 ring-1 ring-green-400/40"
                              : active
                                ? "bg-white/[0.08] text-white/75"
                                : "bg-white/[0.04] text-white/40",
                          )}
                        >
                          {part}
                        </span>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Observability runs alongside every layer. */}
        <div
          className={cx(
            "flex flex-col rounded-xl border p-2.5 transition-[background-color,border-color] duration-500",
            plan.observe
              ? "border-blue-400/50 bg-blue-400/[0.08]"
              : "border-white/10 bg-white/[0.025]",
          )}
        >
          <p
            className={cx(
              "text-[10px] font-bold tracking-[0.12em] uppercase transition-colors duration-500",
              plan.observe ? "text-blue-400" : "text-white/40",
            )}
          >
            Observe
          </p>
          <ul className="mt-2 flex flex-1 flex-col justify-between gap-1.5">
            {OBSERVE.map((part) => (
              <li
                key={part}
                className={cx(
                  "rounded-md px-1.5 py-1 text-[10.5px] font-semibold transition-colors duration-500",
                  plan.observe?.includes(part)
                    ? "bg-green-400/15 text-green-400 ring-1 ring-green-400/40"
                    : "bg-white/[0.04] text-white/45",
                )}
              >
                {part}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Caption and steps. -------------------------------------------------- */}
      <div className="mt-4 flex items-center gap-4 border-t border-white/10 pt-4">
        <p aria-hidden className="tabular text-[11px] font-bold text-white/40">
          {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
        </p>
        <p
          aria-hidden
          key={step}
          className="flex min-h-[2.6em] min-w-0 flex-1 items-center text-[14px] leading-snug font-semibold text-white max-sm:min-h-[3.9em]"
          style={{ animation: "hero-in 450ms var(--ease-out-expo) both" }}
        >
          {STEPS[step].caption}
        </p>
        <div className="flex shrink-0 gap-1.5">
          {STEPS.map((item, i) => (
            <button
              key={item.caption}
              type="button"
              aria-label={`Step ${i + 1}: ${item.caption}`}
              aria-pressed={i === step}
              onClick={() => pick(i)}
              className={cx(
                "h-1.5 cursor-pointer rounded-full transition-[width,background-color] duration-300",
                i === step ? "w-5 bg-green-400" : "w-1.5 bg-white/25 hover:bg-white/50",
              )}
            />
          ))}
        </div>
      </div>

      {/* The whole walk-through, for anyone not watching it play. */}
      <ol className="sr-only">
        {STEPS.map((item) => (
          <li key={item.caption}>{item.caption}</li>
        ))}
      </ol>
    </div>
  );
}
