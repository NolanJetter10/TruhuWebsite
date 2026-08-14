"use client";

import { BrowserFrame } from "@/components/art/frames";
import { SampleTag } from "@/components/ui/primitives";
import { useInView, useSequence } from "./hooks";

/**
 * The product argument in one loop: a plan document goes in on the left, and a
 * branded, translated, delivered guide assembles on the right.
 *
 * The four stages run as a state machine rather than a single long keyframe so
 * each beat can drive several unrelated things at once — the scan beam, the
 * values landing in their rows, the client's brand colour replacing the
 * placeholder grey, the language switching.
 */

const STAGES = ["Ingest", "Extract", "Brand", "Deliver"] as const;

/** Deliberately not a TruHu colour: the guide carries the client's brand. */
const CLIENT_BRAND = "#0E5A63";

const ROWS = [
  { plan: "PPO 1500", field: "Deductible", value: "$1,500" },
  { plan: "HDHP 3200", field: "Employer HSA", value: "$750" },
  { plan: "Dental + Vision", field: "Employee cost", value: "$0" },
];

const LANGUAGES = ["English", "Español", "Tiếng Việt", "简体中文"];

/**
 * Body lines in the source document. The compact run drops to six so the whole
 * demo clears the fold when it sits beside the hero copy rather than under it.
 * Every third line is one the extractor lifts a value from.
 */
const DOC_LINES = {
  full: ["88%", "72%", "94%", "61%", "83%", "77%", "90%", "58%", "86%", "70%"],
  compact: ["88%", "94%", "61%", "83%", "58%", "76%"],
};

export function GuideBuilder({ compact = false }: { compact?: boolean }) {
  const [ref, inView] = useInView<HTMLElement>(0.25);
  const [stage] = useSequence(STAGES.length, 2400, inView);

  const extracted = stage >= 1;
  const branded = stage >= 2;
  const delivered = stage >= 3;

  const lines = compact ? DOC_LINES.compact : DOC_LINES.full;
  const pad = compact ? "p-3" : "p-4";

  return (
    <figure ref={ref} className="relative">
      <BrowserFrame
        label={
          compact
            ? "app.truhu.ai / ridgeline"
            : "app.truhu.ai / ridgeline-manufacturing / 2026-oe"
        }
      >
        {/* Stage rail ------------------------------------------------------ */}
        <div
          className={`relative border-b border-line bg-white ${
            compact ? "px-3 py-2.5" : "px-4 py-3"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            {STAGES.map((name, i) => (
              <div key={name} className="flex items-center gap-1.5">
                <span
                  className={`grid size-4 place-items-center rounded-full text-[9px] font-bold transition-all duration-500 ${
                    i < stage
                      ? "bg-green-500 text-white"
                      : i === stage
                        ? "bg-blue-500 text-white ring-4 ring-blue-500/15"
                        : "bg-line text-slate-400"
                  }`}
                >
                  {i < stage ? "✓" : i + 1}
                </span>
                <span
                  className={`text-[11px] font-semibold transition-colors duration-500 ${
                    i === stage ? "text-ink" : "text-slate-400"
                  }`}
                >
                  {name}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2.5 h-0.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full transition-[width] duration-[900ms] ease-out"
              style={{
                width: `${(stage / (STAGES.length - 1)) * 100}%`,
                background: "var(--grad-brand)",
              }}
            />
          </div>
        </div>

        <div className="grid gap-px bg-line text-xs sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          {/* Source document --------------------------------------------- */}
          <div className={`relative overflow-hidden bg-paper ${pad}`}>
            <p className="flex items-center gap-1.5 truncate font-mono text-[10px] text-slate-400">
              <span className="inline-block size-1.5 shrink-0 rounded-full bg-blue-500" />
              Ridgeline_2026_SBC.pdf
            </p>

            <div
              className={`relative mt-2.5 overflow-hidden rounded-md border border-line bg-white shadow-sm ${
                compact ? "p-2.5" : "p-3"
              }`}
            >
              <div className="h-1.5 w-2/5 rounded-full bg-ink/25" />
              <div className="mt-2.5 space-y-1.5" aria-hidden>
                {lines.map((w, i) => {
                  const isField = i % 3 === 2;
                  return (
                    <div
                      key={i}
                      style={{ width: w, transitionDelay: `${i * 45}ms` }}
                      className={`h-1 rounded-full transition-colors duration-500 ${
                        isField && extracted ? "bg-blue-500/70" : "bg-ink/10"
                      }`}
                    />
                  );
                })}
              </div>

              {/* The beam only sweeps while the document is being read. */}
              {stage === 0 ? (
                <div
                  key={`beam-${stage}`}
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-12"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent, rgba(5,130,220,0.22), transparent)",
                    animation: "scan-down 2.2s var(--ease-in-out-soft) infinite",
                  }}
                />
              ) : null}
            </div>

            <p className="mt-2.5 text-[10px] leading-relaxed text-slate-400">
              {stage === 0
                ? "Reading 24 pages…"
                : compact
                  ? `${ROWS.length * 4} values found`
                  : `${ROWS.length * 4} values found · each traceable to its source page`}
            </p>
          </div>

          {/* Generated guide ---------------------------------------------- */}
          <div className={`bg-white ${pad}`}>
            <div
              className="card-shape-sm overflow-hidden border border-line"
              style={{
                boxShadow: branded
                  ? `0 12px 30px -18px ${CLIENT_BRAND}`
                  : "0 8px 20px -16px rgba(5,14,26,0.4)",
                transition: "box-shadow 700ms var(--ease-out-expo)",
              }}
            >
              {/* The client's brand bar. Grey until the brand step lands. */}
              <div
                className="flex items-center gap-2 px-3 py-2.5 transition-colors duration-700"
                style={{ background: branded ? CLIENT_BRAND : "#94a3b8" }}
              >
                <span
                  className={`grid size-4 place-items-center rounded-sm bg-white/90 text-[8px] font-black transition-all duration-500 ${
                    branded ? "scale-100 opacity-100" : "scale-50 opacity-0"
                  }`}
                  style={{ color: CLIENT_BRAND }}
                >
                  R
                </span>
                <span className="truncate text-[10px] font-bold tracking-wide text-white">
                  {branded ? "RIDGELINE MANUFACTURING" : "CLIENT BRANDING"}
                </span>
              </div>

              <div className="space-y-1.5 p-3">
                <p className="text-[13px] font-bold text-ink">
                  Your 2026 Benefits
                </p>

                {ROWS.map((row, i) => (
                  <div
                    key={row.plan}
                    className="flex items-center justify-between gap-2 rounded-md border border-line px-2.5 py-2 transition-all duration-500 ease-out"
                    style={{
                      transitionDelay: `${i * 160}ms`,
                      opacity: extracted ? 1 : 0.45,
                      transform: extracted ? "none" : "translateY(6px)",
                    }}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold text-ink">
                        {row.plan}
                      </p>
                      <p className="text-[10px] text-slate-400">{row.field}</p>
                    </div>
                    {extracted ? (
                      <span className="tabular shrink-0 text-[11px] font-bold text-green-700">
                        {row.value}
                      </span>
                    ) : (
                      <span className="h-2 w-10 shrink-0 rounded-full bg-line" />
                    )}
                  </div>
                ))}

                <div
                  className="flex items-center justify-between gap-2 pt-1 transition-opacity duration-500"
                  style={{ opacity: delivered ? 1 : 0 }}
                >
                  <span
                    key={stage}
                    className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-semibold text-blue-700"
                  >
                    {LANGUAGES[stage % LANGUAGES.length]}
                  </span>
                  <span className="text-[9px] font-semibold text-green-700">
                    ✓ Sent to 1,204 employees
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-2.5 flex items-center gap-1.5 text-[10px] text-slate-400">
              <span
                className={`size-1.5 shrink-0 rounded-full ${
                  delivered ? "bg-green-500" : "bg-blue-500 anim-pulse"
                }`}
              />
              {delivered
                ? compact
                  ? "Delivered by text and email."
                  : "Delivered by text and email. No login required."
                : "Building guide from source document…"}
            </p>
          </div>
        </div>
      </BrowserFrame>

      <SampleTag className="absolute -top-3 right-4 shadow-sm" />
      <figcaption className="sr-only">
        A demonstration of TruHu Advisor turning a client&rsquo;s plan document
        into a branded, translated benefit guide and delivering it to employees.
      </figcaption>
    </figure>
  );
}
