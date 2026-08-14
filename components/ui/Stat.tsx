"use client";

import { useCountUp, useInView } from "@/components/demos/hooks";
import { cx } from "./primitives";

/**
 * A statistic winds up as it arrives. The final value is what renders on the
 * server and on first paint — it only resets to zero while it is still below
 * the fold — so a number is never briefly wrong for a visitor who lands
 * mid-page or has JavaScript disabled.
 */
export function StatBand({
  stats,
}: {
  stats: readonly { value: number; suffix?: string; label: string; note?: string }[];
}) {
  const [ref, inView] = useInView<HTMLDListElement>(0.35);

  return (
    <dl
      ref={ref}
      className="grid gap-y-12 sm:grid-cols-3 sm:gap-x-8 sm:divide-x sm:divide-white/10"
    >
      {stats.map((stat, i) => (
        <div key={stat.label} className={cx("text-center", i > 0 && "sm:pl-8")}>
          <dd className="t-stat t-gradient">
            <Counted value={stat.value} active={inView} delayMs={i * 140} />
            {stat.suffix}
          </dd>
          <dt className="t-h3 mt-5 text-white">{stat.label}</dt>
          {stat.note ? (
            <p className="t-caption mt-2 text-slate-300">{stat.note}</p>
          ) : null}
        </div>
      ))}
    </dl>
  );
}

function Counted({
  value,
  active,
  delayMs,
}: {
  value: number;
  active: boolean;
  delayMs: number;
}) {
  const shown = useCountUp(value, active, 1300 + delayMs);
  return <span className="tabular">{shown}</span>;
}
