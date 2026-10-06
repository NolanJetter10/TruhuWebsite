import type { ReactNode } from "react";
import { cx } from "@/components/ui/primitives";
import { CAMPAIGN } from "@/lib/content";

/**
 * Still pictures of what each product hands back, for the home page's product
 * cards. Deliberately static: the product pages run the animated demos, and two
 * more loops side by side would compete with the hero's.
 *
 * Both use the same sample client as the demos (Sample Company, in its own teal
 * rather than a TruHu colour).
 */

/** Sample Company's brand colour, as the delivery demo already paints it. */
const CLIENT_BRAND = "#0E5A63";

const SHELL =
  "card-shape-sm overflow-hidden border border-line bg-white shadow-[0_24px_50px_-30px_rgba(5,14,26,0.45)]";

/** Centres the artwork. */
function Frame({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden className="flex w-full justify-center">
      <div className="w-full max-w-[330px]">
        {children}
      </div>
    </div>
  );
}

const PLANS = ["PPO 1000", "HDHP 3000"] as const;

const ROWS = [
  { label: "Deductible", values: ["$1,000", "$3,000"] },
  { label: "Out-of-pocket max", values: ["$4,500", "$6,500"] },
  { label: "Primary care visit", values: ["$25", "20%"] },
] as const;

/** Advisor: the client's guide, in the client's brand, with the Q&A under it. */
export function GuidePreview() {
  return (
    <Frame>
      <div className={SHELL}>
        <div className="px-4 py-3.5 text-white" style={{ background: CLIENT_BRAND }}>
          <p className="text-[9px] font-bold tracking-[0.12em] text-white/70">
            SAMPLE COMPANY
          </p>
          <p className="t-h4 mt-1 text-[15px] text-white">2027 Benefits Guide</p>
        </div>

        <div className="px-4 pt-3.5 pb-4">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[9px] tracking-wide text-slate-400 uppercase">
                <th className="pb-1.5 text-left font-semibold">Medical</th>
                {PLANS.map((plan) => (
                  <th key={plan} className="pb-1.5 text-right font-semibold">
                    {plan}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-t border-line">
                  <td className="py-1.5 text-slate-600">{row.label}</td>
                  {row.values.map((value) => (
                    <td
                      key={value}
                      className="tabular py-1.5 text-right font-semibold text-ink"
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mt-3 flex items-center justify-between gap-2 rounded-full border border-line bg-paper py-1.5 pr-1.5 pl-3 text-[10px] text-slate-400">
            Ask about your plans…
            <span
              className="grid size-5 place-items-center rounded-full text-[10px] text-white"
              style={{ background: CLIENT_BRAND }}
            >
              &uarr;
            </span>
          </p>
        </div>
      </div>
    </Frame>
  );
}

/**
 * Workforce: one send, counted against the roster, strongest outcome first.
 * The person with no number on file is the point — named, not dropped.
 */
const RECORD = [
  { name: "Maria S.", segment: "Night crew", status: "Acknowledged" },
  { name: "Devon P.", segment: "Warehouse", status: "Clicked" },
  { name: "Tomás R.", segment: "Corporate", status: "Delivered" },
  { name: "Rosa M.", segment: "Second shift", status: "No number on file" },
] as const;

const STATUS_TONE: Record<(typeof RECORD)[number]["status"], string> = {
  Acknowledged: "bg-green-100 text-green-700",
  Clicked: "bg-blue-100 text-blue-700",
  Delivered: "border border-line bg-white text-slate-600",
  "No number on file": "bg-amber-100 text-amber-700",
};

export function RecordPreview() {
  return (
    <Frame>
      <div className={cx(SHELL, "p-4")}>
        <div className="flex items-baseline justify-between gap-3">
          <p className="t-h4 text-[13px]">Open enrollment reminder</p>
          <p className="tabular shrink-0 text-[10px] font-semibold text-slate-400">
            {CAMPAIGN.roster} on the roster
          </p>
        </div>

        <ul className="mt-3 space-y-1.5">
          {RECORD.map((person) => (
            <li
              key={person.name}
              className="flex items-center justify-between gap-3 rounded-lg bg-paper px-3 py-1.5"
            >
              <span className="min-w-0">
                <span className="block truncate text-[11px] font-semibold text-ink">
                  {person.name}
                </span>
                <span className="block text-[9px] text-slate-400">
                  {person.segment}
                </span>
              </span>
              <span
                className={cx(
                  "shrink-0 rounded-full px-2 py-0.5 text-[8.5px] font-bold tracking-wide uppercase",
                  STATUS_TONE[person.status],
                )}
              >
                {person.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}
