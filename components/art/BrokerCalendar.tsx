import { BROKER_YEAR, MONTHS } from "@/lib/workflows";
import { cx } from "@/components/ui/primitives";

/**
 * The broker year with TruHu's coverage overlaid, grounded in the nine-workflow
 * anatomy in the broker research. No competitor has published anything
 * equivalent, which is most of the reason to publish it.
 *
 * Uncovered bands are drawn honestly. A vendor who says "everything" is not
 * believed; a vendor who says "these, not those" is.
 */
export function BrokerCalendar({ className }: { className?: string }) {
  return (
    <div className={cx("card-shape border border-border-200 bg-white p-5 sm:p-7", className)}>
      {/* Desktop: a real timeline ------------------------------------- */}
      <div className="hidden md:block">
        <div
          className="grid items-center gap-y-3"
          style={{ gridTemplateColumns: "minmax(150px,220px) repeat(12, 1fr)" }}
        >
          <span />
          {MONTHS.map((month) => (
            <span
              key={month}
              className="pb-2 text-center text-[11px] font-semibold tracking-wide text-grey-500 uppercase"
            >
              {month}
            </span>
          ))}

          {BROKER_YEAR.map((band) => {
            const start = Math.min(...band.months);
            const span = Math.max(...band.months) - start + 1;
            return (
              <div key={band.name} className="contents">
                <span className="pr-4 text-[0.8125rem] leading-snug font-medium text-ink-900">
                  {band.name}
                </span>
                <span
                  className="h-9"
                  style={{ gridColumn: `${start + 2} / span ${span}` }}
                >
                  <span
                    className={cx(
                      "flex h-full items-center rounded-md px-3 text-[11px] font-semibold",
                      band.covered
                        ? "bg-navy-900 text-white"
                        : "border border-dashed border-border-200 bg-section text-grey-500",
                    )}
                  >
                    {band.covered ? (
                      <span className="mr-2 size-1.5 shrink-0 rounded-full bg-green-500" aria-hidden />
                    ) : null}
                    <span className="truncate">
                      {band.covered ? "TruHu builds this" : "Not our lane"}
                    </span>
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: the same information as a list ------------------------ */}
      <ul className="space-y-3 md:hidden">
        {BROKER_YEAR.map((band) => {
          const first = MONTHS[Math.min(...band.months)];
          const last = MONTHS[Math.max(...band.months)];
          return (
            <li
              key={band.name}
              className={cx(
                "card-shape-sm border p-3",
                band.covered
                  ? "border-border-200 bg-white"
                  : "border-dashed border-border-200 bg-section",
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[0.9375rem] font-medium text-ink-900">
                  {band.name}
                </span>
                <span className="shrink-0 text-[11px] font-semibold text-grey-500 uppercase">
                  {first === last ? first : `${first} to ${last}`}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-[0.8125rem] text-grey-700">
                {band.covered ? (
                  <>
                    <span className="size-1.5 rounded-full bg-green-500" aria-hidden />
                    TruHu builds this
                  </>
                ) : (
                  "Not our lane"
                )}
              </p>
            </li>
          );
        })}
      </ul>

      <p className="t-caption mt-6 border-t border-border-200 pt-4 text-grey-500">
        Drawn for a January 1 renewal book. Shift the whole calendar for a July 1
        book; the sequence does not change.
      </p>
    </div>
  );
}
