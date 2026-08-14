import { cx } from "@/components/ui/primitives";

/**
 * Illustration here is diagrammatic rather than decorative, the book of
 * business with a handful of accounts lit, the broker calendar, the delivery
 * ledger. Flat, hairline-weighted, no shading. Diagrams that happen to be
 * beautiful, which suits a company arguing about clarity. (File 04 §6.)
 */

const COLS = 20;
const ROWS = 13;
const STEP = 32;
const CELL = 26;

/** Deterministic, scattered. These are "the accounts that get everything". */
const LIT = [
  3, 17, 24, 41, 58, 66, 89, 104, 117, 133, 150, 168, 191, 214, 233, 247,
];

export function BookOfBusiness({ className }: { className?: string }) {
  const cells = Array.from({ length: COLS * ROWS }, (_, i) => i);
  const width = COLS * STEP - (STEP - CELL);
  const height = ROWS * STEP - (STEP - CELL);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cx("h-auto w-full", className)}
      role="img"
      aria-label={`A book of business drawn as ${COLS * ROWS} client groups. ${LIT.length} of them are highlighted, the accounts that get a full communication programme. The rest are unlit.`}
    >
      {cells.map((i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const lit = LIT.includes(i);
        return (
          <rect
            key={i}
            x={col * STEP}
            y={row * STEP}
            width={CELL}
            height={CELL}
            rx={3}
            className={lit ? "fill-green-500" : "fill-tint-100"}
          />
        );
      })}
    </svg>
  );
}

/**
 * The delivery ledger, drawn as the record it actually is: per named employee,
 * timestamped, with the failure list treated as the most useful output rather
 * than as an embarrassment. Nobody in the category markets this.
 */
const LEDGER_ROWS: {
  name: string;
  site: string;
  state: "Acknowledged" | "Clicked" | "Delivered" | "Failed";
  at: string;
}[] = [
  { name: "R. Alvarez", site: "Plant 2 · Nights", state: "Acknowledged", at: "Oct 14, 6:12 pm" },
  { name: "T. Nguyen", site: "Plant 2 · Days", state: "Acknowledged", at: "Oct 14, 7:40 am" },
  { name: "D. Okonkwo", site: "Distribution", state: "Clicked", at: "Oct 14, 12:03 pm" },
  { name: "S. Beaudry", site: "Field crew 4", state: "Delivered", at: "Oct 14, 7:02 am" },
  { name: "M. Castellanos", site: "Field crew 4", state: "Failed", at: "Oct 14, 7:02 am" },
  { name: "J. Whitfield", site: "Front office", state: "Acknowledged", at: "Oct 14, 9:18 am" },
  { name: "P. Iyer", site: "Distribution", state: "Failed", at: "Oct 14, 7:02 am" },
];

const STATE_STYLE: Record<string, string> = {
  Acknowledged: "bg-green-100 text-green-600",
  Clicked: "bg-tint-100 text-navy-700",
  Delivered: "bg-section text-grey-700",
  Failed: "bg-red-600/8 text-red-600",
};

export function DeliveryLedger({ className }: { className?: string }) {
  const failures = LEDGER_ROWS.filter((r) => r.state === "Failed");

  return (
    <div className={cx("card-shape border border-border-200 bg-white", className)}>
      <div className="flex items-center justify-between gap-4 border-b border-border-200 px-5 py-3.5">
        <p className="t-h4">Delivery record · Handbook update</p>
        <span className="t-caption text-grey-500">Oct 14</span>
      </div>

      <ul className="divide-y divide-border-200">
        {LEDGER_ROWS.map((row) => (
          <li
            key={row.name}
            className="flex items-center gap-3 px-5 py-2.5 text-[0.8125rem]"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-tint-100 text-[10px] font-semibold text-navy-700">
              {row.name
                .split(" ")
                .map((p) => p[0])
                .join("")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-ink-900">
                {row.name}
              </span>
              <span className="block truncate text-[11px] text-grey-500">
                {row.site}
              </span>
            </span>
            <span className="hidden shrink-0 text-[11px] text-grey-500 sm:block tabular">
              {row.at}
            </span>
            <span
              className={cx(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                STATE_STYLE[row.state],
              )}
            >
              {row.state}
            </span>
          </li>
        ))}
      </ul>

      <div className="border-t border-border-200 bg-section px-5 py-4">
        <p className="text-[0.8125rem] font-semibold text-ink-900">
          Could not be reached ({failures.length})
        </p>
        <p className="t-caption mt-1 text-grey-700">
          {failures.map((f) => f.name).join(", ")}, bad or missing number.
          This list is the output worth acting on.
        </p>
      </div>
    </div>
  );
}
