import type { StatFact } from "@/lib/content";
import { CountUp } from "./CountUp";
import { SourceNote, cx } from "./primitives";

/**
 * The stat numeral is the loudest thing on the page, and it is always attached
 * to a fact. Because green appears nowhere else at scale, the eye goes to the
 * number, which is a discipline as much as a style, since it forces every big
 * number to be defensible. (File 04 §2.2.)
 *
 * A Stat cannot be rendered without a source note. That is deliberate.
 */
export function Stat({
  fact,
  tone = "dark",
  className,
}: {
  fact: StatFact;
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col", className)}>
      <p
        className={cx(
          "t-stat",
          tone === "light" ? "text-leaf-400" : "text-green-500",
        )}
      >
        {typeof fact.numeric === "number" ? (
          <CountUp
            value={fact.numeric}
            prefix={fact.prefix}
            suffix={fact.suffix}
          />
        ) : (
          fact.value
        )}
      </p>
      <p
        className={cx(
          "mt-4 max-w-[26ch] text-[0.9375rem] leading-snug font-medium",
          tone === "light" ? "text-white" : "text-ink-900",
        )}
      >
        {fact.label}
      </p>
      <SourceNote tone={tone} className="mt-3 max-w-[34ch]">
        {fact.source}
      </SourceNote>
    </div>
  );
}

export function StatBand({
  facts,
  tone = "dark",
}: {
  facts: StatFact[];
  tone?: "dark" | "light";
}) {
  return (
    <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
      {facts.map((fact) => (
        <Stat key={fact.label} fact={fact} tone={tone} />
      ))}
    </div>
  );
}
