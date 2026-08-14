import {
  Check,
  ClockCounterClockwise,
  FileText,
  LockKey,
  SealCheck,
} from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/primitives";
import { SampleDataTag } from "./frames";

/* -------------------------------------------------------------------------- */
/* A branded guide, at a glance                                                */
/* -------------------------------------------------------------------------- */

export function MiniGuideCard({ className }: { className?: string }) {
  return (
    <div className={cx("relative", className)}>
      <div className="card-shape overflow-hidden border border-border-200 bg-white shadow-[0_20px_50px_-28px_rgba(15,42,68,0.4)]">
        <div className="bg-[#2b3a55] px-6 py-5 text-white">
          <div className="flex items-center gap-2">
            <span className="size-4 rounded-sm bg-[#8c2f39]" aria-hidden />
            <span className="text-[10px] font-bold tracking-[0.12em]">
              RIDGELINE MANUFACTURING
            </span>
          </div>
          <p className="mt-4 text-xl leading-tight font-bold">
            Your 2026 benefits
          </p>
          <p className="mt-1.5 text-[0.8125rem] text-white/70">
            Enrollment is open October 20 to November 7
          </p>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {[
            { name: "PPO 1500", k: "Deductible", v: "$1,500" },
            { name: "HDHP 3200 + HSA", k: "Employer HSA", v: "$750" },
            { name: "Dental", k: "Cleanings", v: "3 / year" },
            { name: "Vision", k: "Frames", v: "$180" },
          ].map((plan) => (
            <div
              key={plan.name}
              className="card-shape-sm border border-border-200 px-3 py-2.5"
            >
              <p className="text-[0.8125rem] font-bold text-ink-900">
                {plan.name}
              </p>
              <p className="mt-1 flex items-baseline justify-between text-[11px]">
                <span className="text-grey-500">{plan.k}</span>
                <span className="font-semibold text-ink-900 tabular">{plan.v}</span>
              </p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 border-t border-border-200 px-5 py-3.5">
          {["English", "Español", "Kreyòl", "Tiếng Việt", "32 more"].map((lang) => (
            <span
              key={lang}
              className="rounded-full bg-tint-100 px-2.5 py-1 text-[11px] font-medium text-navy-700"
            >
              {lang}
            </span>
          ))}
        </div>
      </div>
      <SampleDataTag className="absolute -top-2 right-3">Sample guide</SampleDataTag>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* The message an employee actually receives                                   */
/* -------------------------------------------------------------------------- */

export function MessageThread({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        "card-shape relative border border-border-200 bg-section p-6",
        className,
      )}
    >
      <SampleDataTag className="absolute top-3 right-3" />
      <div className="space-y-3">
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-[0.8125rem] leading-relaxed text-ink-900 ring-1 ring-border-200">
            <p className="font-semibold">Ridgeline Manufacturing</p>
            <p className="mt-1 text-grey-700">
              Benefits enrollment is open until Nov 7. Your 2026 plans and costs
              are here, no login needed: truhu.link/rdg26
            </p>
            <p className="mt-2 text-[11px] text-grey-500">
              Reply STOP to opt out
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-navy-900 px-4 py-2.5 text-[0.8125rem] text-white">
            Does the HSA money still come through if I switch plans?
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-[0.8125rem] leading-relaxed text-grey-700 ring-1 ring-border-200">
            Yes. The $750 employer HSA contribution applies to the HDHP 3200
            plan. Here is that section of your guide: truhu.link/rdg26#hsa
          </div>
        </div>
      </div>

      <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border-200 pt-4">
        {[
          "Delivered 7:02 am",
          "Clicked 7:14 am",
          "Enrolled 7:31 am",
        ].map((event) => (
          <li
            key={event}
            className="flex items-center gap-1.5 text-[11px] font-medium text-grey-700"
          >
            <Check weight="bold" className="size-3.5 text-green-600" aria-hidden />
            {event}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Control, approvals, grounding, brand locks, versioning                     */
/* -------------------------------------------------------------------------- */

export function ApprovalPanel({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        "card-shape relative border border-border-200 bg-white",
        className,
      )}
    >
      <SampleDataTag className="absolute top-3 right-3" />
      <div className="border-b border-border-200 px-5 py-4">
        <p className="t-h4">2026 OE guide · Ridgeline Manufacturing</p>
        <p className="t-caption mt-0.5 text-grey-500">
          Draft v4 · waiting on A. Reyes
        </p>
      </div>

      <ul className="divide-y divide-border-200">
        {[
          {
            icon: FileText,
            title: "In-network deductible · $1,500",
            meta: "Medical SBC, PPO 1500.pdf, page 1",
          },
          {
            icon: FileText,
            title: "Employer HSA contribution · $750",
            meta: "2026 rate sheet.xlsx, Contributions",
          },
          {
            icon: FileText,
            title: "Dental cleanings · 3 per year",
            meta: "Dental & vision summary.pdf, page 2",
          },
        ].map((row) => (
          <li key={row.title} className="flex items-start gap-3 px-5 py-3">
            <row.icon className="mt-0.5 size-4 shrink-0 text-blue-500" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.8125rem] font-medium text-ink-900">
                {row.title}
              </span>
              <span className="block truncate text-[11px] text-blue-500">
                {row.meta}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <div className="space-y-2.5 border-t border-border-200 bg-section px-5 py-4">
        {[
          { icon: LockKey, text: "Client brand locked, generation cannot override" },
          { icon: ClockCounterClockwise, text: "Version history retained · 4 versions" },
          { icon: SealCheck, text: "Approval required before publish" },
        ].map((row) => (
          <p
            key={row.text}
            className="flex items-center gap-2 text-[0.8125rem] text-grey-700"
          >
            <row.icon className="size-3.5 shrink-0 text-green-600" aria-hidden />
            {row.text}
          </p>
        ))}
      </div>
    </div>
  );
}
