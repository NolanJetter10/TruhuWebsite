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
  tone = "dark",
}: {
  stats: readonly {
    value: number;
    prefix?: string;
    suffix?: string;
    label: string;
    note?: string;
  }[];
  /** The surface the band sits on, not the colour of the band itself. */
  tone?: "dark" | "light";
}) {
  const [ref, inView] = useInView<HTMLDListElement>(0.35);
  const onDark = tone === "dark";

  return (
    <dl
      ref={ref}
      className={cx(
        "grid gap-y-12 sm:grid-cols-3 sm:gap-x-8 sm:divide-x",
        onDark ? "sm:divide-white/10" : "sm:divide-line",
      )}
    >
      {stats.map((stat, i) => (
        <div key={stat.label} className={cx("text-center", i > 0 && "sm:pl-8")}>
          {/* The number is kept as direct text of the <dd>: the sweep is
              clipped to this element's own text, so wrapping the digits in a
              span of their own would leave them invisible. */}
          <dd
            className={cx(
              "t-stat tabular",
              onDark ? "t-gradient" : "t-gradient-dark",
            )}
          >
            {stat.prefix}
            <Counted value={stat.value} active={inView} delayMs={i * 140} />
            {stat.suffix}
          </dd>
          <dt className={cx("t-h3 mt-5", onDark ? "text-white" : "text-ink")}>
            {stat.label}
          </dt>
          {stat.note ? (
            <p
              className={cx(
                "t-caption mt-2",
                onDark ? "text-slate-300" : "text-slate-400",
              )}
            >
              {stat.note}
            </p>
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
  // Grouped digits, so $228,321 reads as a dollar figure rather than an ID.
  return <>{shown.toLocaleString("en-US")}</>;
}
