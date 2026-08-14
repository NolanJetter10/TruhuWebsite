"use client";

import { PhoneFrame } from "@/components/art/frames";
import { SampleTag, cx } from "@/components/ui/primitives";
import { CAMPAIGN } from "@/lib/content";
import { useCountUp, useInView, useSequence } from "./hooks";

/**
 * Workforce's claim is a delivery record against the eligible roster, not the
 * send log — so the demo has to show both halves: a message arriving on a
 * personal phone, and a per-employee record where the person with no number
 * on file shows up by name instead of disappearing from a send report.
 *
 * The meters fill on entry; the roster advances one status per beat, which is
 * what makes the cascade read as delivery happening rather than as a chart.
 */

const ROSTER = [
  { name: "Maria S.", segment: "Night crew", reachable: true },
  { name: "Devon P.", segment: "Warehouse", reachable: true },
  { name: "Rosa M.", segment: "Second shift", reachable: false },
  { name: "Tomás R.", segment: "Corporate", reachable: true },
];

const METERS = [
  { label: "Sent", count: CAMPAIGN.sent, tone: "#0582dc" },
  { label: "Delivered", count: CAMPAIGN.delivered, tone: "#38b000" },
];

export function DeliveryProof() {
  const [ref, inView] = useInView<HTMLDivElement>(0.25);
  // One beat per row, plus the lead-in the last row needs to finish.
  const [beat] = useSequence(ROSTER.length + 2, 1100, inView);

  return (
    <div ref={ref} className="relative flex flex-col items-center gap-7 sm:flex-row sm:items-stretch">
      {/* The message, on a personal phone, with no app and no login. ------- */}
      <PhoneFrame className="self-center" width={214}>
        <div className="h-[352px] bg-paper px-3 pt-2 pb-3">
          <p className="pb-2 text-center text-[9px] font-semibold text-slate-400">
            Ridgeline HR
          </p>

          <div
            className="rounded-2xl rounded-bl-md bg-white p-2.5 shadow-sm transition-all duration-700 ease-out"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "none" : "translateY(14px)",
            }}
          >
            <p className="text-[11px] leading-snug text-ink">
              Open enrollment closes Friday. Your 2027 benefits guide is ready —
              no login needed.
            </p>
            <div className="mt-2 overflow-hidden rounded-lg border border-line">
              <div className="bg-[#0E5A63] px-2 py-1.5 text-[8px] font-bold tracking-wide text-white">
                RIDGELINE MANUFACTURING
              </div>
              <p className="px-2 py-1.5 text-[9px] font-semibold text-blue-700">
                truhu.link/ridgeline-2027
              </p>
            </div>
          </div>

          <p
            className="mt-1.5 pr-1 text-right text-[8px] font-semibold text-green-700 transition-opacity duration-700 delay-700"
            style={{ opacity: inView ? 1 : 0 }}
          >
            ✓✓ Delivered 9:42 AM
          </p>
        </div>
      </PhoneFrame>

      {/* The record ------------------------------------------------------- */}
      <div className="card-shape w-full border border-line bg-white p-5 shadow-[0_30px_70px_-40px_rgba(5,14,26,0.5)]">
        <div className="flex items-baseline justify-between gap-3">
          <p className="t-h4">Open enrollment reminder</p>
          <p className="tabular text-[11px] font-semibold text-slate-400">
            {CAMPAIGN.roster} on the roster
          </p>
        </div>

        <div className="mt-5 space-y-4">
          {METERS.map((meter, i) => {
            const pct = Math.round((meter.count / CAMPAIGN.roster) * 100);
            return (
              <Meter
                key={meter.label}
                label={meter.label}
                count={meter.count}
                pct={pct}
                tone={meter.tone}
                delayMs={i * 180}
                active={inView}
              />
            );
          })}
        </div>

        {/* Counted against the roster, so the misses have names. */}
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-amber-100/60 px-3 py-2 text-[11px] leading-snug text-amber-800">
          <span className="size-1.5 shrink-0 rounded-full bg-amber-500" />
          {CAMPAIGN.noNumber} on the roster have no mobile number — listed by
          name, not lost in a send report.
        </p>

        <div className="mt-5 border-t border-line pt-4">
          <p className="t-eyebrow mb-3 text-slate-400">Per-employee record</p>
          <ul className="space-y-1.5">
            {ROSTER.map((person, i) => {
              const delivered = person.reachable && beat > i;
              return (
                <li
                  key={person.name}
                  className="flex items-center justify-between gap-3 rounded-lg bg-paper px-3 py-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-semibold text-ink">
                      {person.name}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {person.segment}
                    </span>
                  </span>
                  <span
                    className={cx(
                      "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase transition-colors duration-500",
                      !person.reachable
                        ? "bg-amber-100 text-amber-700"
                        : delivered
                          ? "bg-green-100 text-green-700"
                          : "bg-paper text-slate-400",
                    )}
                  >
                    {!person.reachable
                      ? "No number on file"
                      : delivered
                        ? "Delivered"
                        : "Sent"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <SampleTag className="absolute -top-3 right-4 shadow-sm" />
    </div>
  );
}

function Meter({
  label,
  count,
  pct,
  tone,
  delayMs,
  active,
}: {
  label: string;
  count: number;
  pct: number;
  tone: string;
  delayMs: number;
  active: boolean;
}) {
  const shown = useCountUp(count, active, 1400);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[12px] font-semibold text-ink">{label}</span>
        <span className="tabular text-[12px] text-slate-600">
          <span className="font-bold text-ink">{shown}</span> · {pct}%
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper">
        <div
          className="h-full rounded-full transition-[width] duration-[1400ms] ease-out"
          style={{
            width: active ? `${pct}%` : "0%",
            transitionDelay: `${delayMs}ms`,
            background: `linear-gradient(90deg, ${tone}bb, ${tone})`,
          }}
        />
      </div>
    </div>
  );
}
