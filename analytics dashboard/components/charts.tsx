"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Summary } from "@/lib/aggregate";

/**
 * Hand-rolled charts, following the dataviz rules this dashboard was built
 * to: thin marks with a 4px rounded data-end and a square baseline, a 2px
 * surface gap between stacked segments, hairline solid grid, one accent hue
 * plus a de-emphasis gray, values direct-labelled sparingly, a hover/focus
 * tooltip on every mark, and a table view behind the one chart whose values
 * are not all printed.
 */

export const fmt = new Intl.NumberFormat("en-US");
export const pct = (x: number) => `${Math.round(x * 100)}%`;

export function duration(sec: number) {
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return s ? `${m}m ${String(s).padStart(2, "0")}s` : `${m}m`;
}

/* ---------------------------------------------------------------- tooltip */

type Tip = {
  x: number;
  y: number;
  title: string;
  rows: { label: string; value: string; key?: "accent" | "quiet" }[];
} | null;

function Tooltip({ tip }: { tip: Tip }) {
  if (!tip) return null;
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 min-w-36 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg"
      style={{ left: tip.x, top: tip.y - 10 }}
    >
      <p className="text-muted">{tip.title}</p>
      {tip.rows.map((row) => (
        <p key={row.label} className="mt-1 flex items-center gap-2">
          {row.key ? (
            <span
              aria-hidden
              className="h-0.5 w-3 rounded-full"
              style={{ background: row.key === "accent" ? "var(--c-accent)" : "var(--c-quiet)" }}
            />
          ) : null}
          <span className="font-semibold text-ink tabular">{row.value}</span>
          <span className="text-ink-2">{row.label}</span>
        </p>
      ))}
    </div>
  );
}

/** Tooltip position for a pointer or a focused element, relative to `box`. */
function anchor(box: HTMLElement | null, event: { clientX?: number; clientY?: number; target: EventTarget }) {
  const outer = box?.getBoundingClientRect();
  if (!outer) return { x: 0, y: 0 };
  if (event.clientX !== undefined && event.clientY !== undefined && event.clientX !== 0) {
    return { x: event.clientX - outer.left, y: event.clientY - outer.top };
  }
  const rect = (event.target as Element).getBoundingClientRect();
  return { x: rect.left + rect.width / 2 - outer.left, y: rect.top - outer.top };
}

/* ----------------------------------------------------------------- funnel */

export function FunnelChart({ steps }: { steps: Summary["funnel"] }) {
  const top = steps[0]?.count ?? 0;
  const box = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip>(null);

  return (
    <div ref={box} className="relative">
      <ol className="space-y-1">
        {steps.map((step, i) => {
          const lost = i > 0 ? steps[i - 1].count - step.count : 0;
          const show = (e: { clientX?: number; clientY?: number; target: EventTarget }) =>
            setTip({
              ...anchor(box.current, e),
              title: `${step.label} — ${step.hint}`,
              rows: [
                { label: "visits", value: fmt.format(step.count), key: "accent" },
                { label: "of everyone who landed", value: pct(step.ofTop) },
                ...(i > 0 ? [{ label: "of the step before", value: pct(step.ofPrev) }] : []),
              ],
            });
          return (
            <li key={step.key}>
              {/* The loss between two steps, printed only where there is one. */}
              <p className="grid h-4 grid-cols-[9.5rem_1fr] items-center gap-4 text-[0.6875rem] text-muted sm:grid-cols-[11rem_1fr]">
                <span />
                <span>{lost > 0 ? `−${fmt.format(lost)} · ${pct(1 - step.ofPrev)} dropped` : ""}</span>
              </p>
              <div
                tabIndex={0}
                onPointerMove={show}
                onPointerLeave={() => setTip(null)}
                onFocus={show}
                onBlur={() => setTip(null)}
                className="group grid grid-cols-[9.5rem_1fr_4.5rem] items-center gap-4 rounded-md outline-none sm:grid-cols-[11rem_1fr_5rem]"
              >
                <span className="truncate text-sm font-medium text-ink">{step.label}</span>
                <span className="relative h-6">
                  <span className="absolute inset-y-0 left-0 w-full rounded-r-[4px] bg-grid" />
                  <span
                    className="bar-grow absolute inset-y-0 left-0 rounded-r-[4px] bg-accent transition-opacity group-hover:opacity-80 group-focus-visible:opacity-80"
                    style={{ width: top ? `max(${(step.count / top) * 100}%, ${step.count ? 3 : 0}px)` : 0 }}
                  />
                </span>
                <span className="text-right text-sm tabular">
                  <span className="font-semibold">{fmt.format(step.count)}</span>{" "}
                  <span className="text-muted">{pct(step.ofTop)}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      <Tooltip tip={tip} />
    </div>
  );
}

/* --------------------------------------------------- visits over time */

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(600);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

function niceMax(value: number) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 2.5, 5, 10]) {
    const candidate = step * magnitude;
    if (candidate >= value) return candidate;
  }
  return 10 * magnitude;
}

/** A column with only its top corners rounded: square where it meets the baseline. */
function columnPath(x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h);
  return `M${x},${y + h} V${y + radius} Q${x},${y} ${x + radius},${y} H${x + w - radius} Q${x + w},${y} ${x + w},${y + radius} V${y + h} Z`;
}

export function VisitsOverTime({
  series,
  unit,
}: {
  series: Summary["series"];
  unit: Summary["seriesUnit"];
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [tip, setTip] = useState<Tip>(null);
  const [active, setActive] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);

  const height = 200;
  const axisBand = 22;
  const left = 34;
  const plotW = Math.max(100, width - left - 4);
  const plotH = height - axisBand - 8;
  const max = niceMax(Math.max(...series.map((s) => s.visits), 0));
  const band = plotW / Math.max(series.length, 1);
  const barW = Math.max(2, Math.min(24, band * 0.62));
  const y = (v: number) => 8 + plotH - (v / max) * plotH;
  const every = Math.max(1, Math.ceil(series.length / Math.max(1, Math.floor(plotW / 44))));
  const gap = 2;

  return (
    <div ref={ref} className="relative">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs text-ink-2">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-[2px] bg-accent" /> Booked
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-[2px] bg-quiet" /> Didn&apos;t book
          </span>
        </div>
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          className="rounded-md px-2 py-1 text-xs font-medium text-accent-text hover:bg-accent-wash"
        >
          {asTable ? "Chart" : "Table"}
        </button>
      </div>

      {asTable ? (
        <div className="max-h-[200px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface text-left text-xs text-muted">
              <tr>
                <th className="py-1 font-medium">{unit === "hour" ? "Hour" : "Day"}</th>
                <th className="py-1 text-right font-medium">Visits</th>
                <th className="py-1 text-right font-medium">Booked</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {series.map((s) => (
                <tr key={s.key} className="border-t border-line">
                  <td className="py-1">{s.label}</td>
                  <td className="py-1 text-right">{s.visits}</td>
                  <td className="py-1 text-right">{s.booked}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <svg width={width} height={height} role="img" aria-label="Visits over time, split by whether the visit booked">
            {[0, max / 2, max].map((tick) => (
              <g key={tick}>
                <line x1={left} x2={left + plotW} y1={y(tick)} y2={y(tick)} stroke="var(--c-grid)" strokeWidth={1} />
                <text x={left - 8} y={y(tick)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--c-muted)" className="tabular">
                  {fmt.format(tick)}
                </text>
              </g>
            ))}
            <line x1={left} x2={left + plotW} y1={y(0)} y2={y(0)} stroke="var(--c-axis)" strokeWidth={1} />

            {series.map((s, i) => {
              const cx = left + band * i + band / 2;
              const x = cx - barW / 2;
              const bookedH = (s.booked / max) * plotH;
              const restH = Math.max(0, ((s.visits - s.booked) / max) * plotH - (s.booked ? gap : 0));
              const dim = active !== null && active !== i;
              const show = (e: { clientX?: number; clientY?: number; target: EventTarget }) => {
                setActive(i);
                setTip({
                  ...anchor(ref.current, e),
                  title: unit === "hour" ? `Hour starting ${s.label}` : s.key,
                  rows: [
                    { label: "visits", value: fmt.format(s.visits) },
                    { label: "booked", value: fmt.format(s.booked), key: "accent" },
                    { label: "didn't book", value: fmt.format(s.visits - s.booked), key: "quiet" },
                  ],
                });
              };
              return (
                <g key={s.key} opacity={dim ? 0.55 : 1} style={{ transition: "opacity 150ms" }}>
                  {s.booked > 0 ? (
                    <path
                      d={columnPath(x, y(0) - bookedH, barW, bookedH, s.visits === s.booked ? 4 : 0)}
                      fill="var(--c-accent)"
                    />
                  ) : null}
                  {restH > 0 ? (
                    <path
                      d={columnPath(x, y(0) - bookedH - (s.booked ? gap : 0) - restH, barW, restH, 4)}
                      fill="var(--c-quiet)"
                    />
                  ) : null}
                  {i % every === 0 ? (
                    <text x={cx} y={height - 6} textAnchor="middle" fontSize={11} fill="var(--c-muted)" className="tabular">
                      {s.label}
                    </text>
                  ) : null}
                  <rect
                    x={left + band * i}
                    y={0}
                    width={band}
                    height={height - axisBand}
                    fill="transparent"
                    tabIndex={0}
                    aria-label={`${s.label}: ${s.visits} visits, ${s.booked} booked`}
                    onPointerMove={show}
                    onFocus={show}
                    onPointerLeave={() => {
                      setActive(null);
                      setTip(null);
                    }}
                    onBlur={() => {
                      setActive(null);
                      setTip(null);
                    }}
                    style={{ outline: "none" }}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      )}
      <Tooltip tip={tip} />
    </div>
  );
}

/* --------------------------------------------------------- bar lists */

export function BarList({
  items,
  empty,
  unitLabel = "visits",
}: {
  items: { label: string; count: number }[];
  empty: ReactNode;
  unitLabel?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip>(null);
  const total = items.reduce((n, item) => n + item.count, 0);
  const max = Math.max(...items.map((item) => item.count), 0);

  if (!total) return <p className="py-6 text-center text-sm text-muted">{empty}</p>;

  return (
    <div ref={box} className="relative">
      <ul className="space-y-2.5">
        {items.map((item) => {
          const show = (e: { clientX?: number; clientY?: number; target: EventTarget }) =>
            setTip({
              ...anchor(box.current, e),
              title: item.label,
              rows: [
                { label: unitLabel, value: fmt.format(item.count), key: "accent" },
                { label: "of this list", value: pct(item.count / total) },
              ],
            });
          return (
            <li
              key={item.label}
              tabIndex={0}
              onPointerMove={show}
              onPointerLeave={() => setTip(null)}
              onFocus={show}
              onBlur={() => setTip(null)}
              className="group outline-none"
            >
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-ink" title={item.label}>
                  {item.label}
                </span>
                <span className="shrink-0 tabular">
                  <span className="font-semibold">{fmt.format(item.count)}</span>{" "}
                  <span className="text-muted">{pct(item.count / total)}</span>
                </span>
              </div>
              <div className="mt-1 h-2 rounded-r-[4px] bg-grid">
                <div
                  className="bar-grow h-2 rounded-r-[4px] bg-accent group-hover:opacity-80 group-focus-visible:opacity-80"
                  style={{ width: `max(${(item.count / max) * 100}%, ${item.count ? 3 : 0}px)` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <Tooltip tip={tip} />
    </div>
  );
}

/** A small same-ramp meter for a rate inside a table cell. */
export function Meter({ value }: { value: number }) {
  return (
    <span aria-hidden className="inline-block h-1.5 w-12 rounded-full bg-accent-wash align-middle">
      <span
        className="block h-1.5 rounded-full bg-accent"
        style={{ width: `${Math.min(100, Math.round(value * 100))}%` }}
      />
    </span>
  );
}
