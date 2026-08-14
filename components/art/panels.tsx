import type { ReactNode } from "react";
import {
  ArrowRight,
  Broadcast,
  Check,
  FileText,
  LockKey,
  PaperPlaneTilt,
  Translate,
} from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/primitives";
import { SampleDataTag } from "./frames";

/* -------------------------------------------------------------------------- */

function PanelShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("relative min-h-[336px] bg-white p-4 sm:p-5", className)}>
      <SampleDataTag className="absolute top-3 right-3 z-10" />
      {children}
    </div>
  );
}

function Rail() {
  return (
    <div className="hidden w-[168px] shrink-0 border-r border-border-200 pr-4 sm:block">
      <p className="t-caption font-semibold text-grey-500 uppercase">Book</p>
      <ul className="mt-3 space-y-1">
        {[
          "Ridgeline Manufacturing",
          "Delta Foods Group",
          "Kestrel Logistics",
          "Northgate Health",
          "306 more",
        ].map((item, i) => (
          <li
            key={item}
            className={cx(
              "card-shape-sm px-2.5 py-1.5 text-[0.8125rem]",
              i === 0 ? "bg-tint-100 font-semibold text-navy-900" : "text-grey-700",
            )}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DocRow({
  name,
  meta,
  done = true,
}: {
  name: string;
  meta: string;
  done?: boolean;
}) {
  return (
    <li className="flex items-center gap-2.5 border-b border-border-200 py-2 last:border-0">
      <FileText className="size-4 shrink-0 text-grey-500" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.8125rem] font-medium text-ink-900">
          {name}
        </span>
        <span className="block truncate text-[11px] text-grey-500">{meta}</span>
      </span>
      {done ? (
        <span className="flex size-5 items-center justify-center rounded-full bg-green-100">
          <Check weight="bold" className="size-3 text-green-600" aria-hidden />
        </span>
      ) : (
        <span className="size-5 rounded-full border border-dashed border-border-200" />
      )}
    </li>
  );
}

function FieldChip({
  label,
  value,
  cite,
}: {
  label: string;
  value: string;
  cite: string;
}) {
  return (
    <div className="card-shape-sm bg-section px-3 py-2">
      <p className="text-[10px] font-semibold tracking-wide text-grey-500 uppercase">
        {label}
      </p>
      <p className="text-[0.9375rem] leading-tight font-bold text-ink-900 tabular">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-medium text-blue-500">{cite}</p>
    </div>
  );
}

/* 1 · Ingest ---------------------------------------------------------------- */

export function IngestPanel() {
  return (
    <PanelShell>
      <div className="flex gap-4">
        <Rail />
        <div className="min-w-0 flex-1">
          <p className="t-h4">Source documents</p>
          <ul className="mt-3">
            <DocRow name="Medical SBC, PPO 1500.pdf" meta="Read, 8 pages" />
            <DocRow name="Medical SBC, HDHP 3200.pdf" meta="Read, 8 pages" />
            <DocRow name="Dental and vision.pdf" meta="Read, 4 pages" />
            <DocRow name="2026 rate sheet.xlsx" meta="Reading" done={false} />
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-3">
            <FieldChip label="Deductible" value="$1,500" cite="SBC p.1" />
            <FieldChip label="Primary care" value="$25" cite="SBC p.2" />
            <FieldChip label="Employer HSA" value="$750" cite="Rate sheet" />
          </div>
          <p className="t-caption mt-3 text-grey-500">
            Every value keeps the page it came from.
          </p>
        </div>
      </div>
    </PanelShell>
  );
}

/* 2 · Generate -------------------------------------------------------------- */

const BUILD_STEPS = [
  { label: "Reading plan documents", state: "done" },
  { label: "Extracting values with citations", state: "done" },
  { label: "Drafting sections", state: "active" },
  { label: "Translating, 14 languages", state: "queued" },
  { label: "Queued for review by A. Reyes", state: "queued" },
] as const;

export function GeneratePanel() {
  return (
    <PanelShell>
      <div className="flex gap-4">
        <Rail />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="t-h4">2026 open enrollment guide</p>
            <span className="t-caption text-grey-500 tabular">00:41</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-tint-100">
            <div className="anim-fill h-full w-[64%] rounded-full bg-green-500" />
          </div>
          <ul className="mt-4 space-y-2.5">
            {BUILD_STEPS.map((step) => (
              <li key={step.label} className="flex items-center gap-2.5">
                {step.state === "done" ? (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-green-100">
                    <Check weight="bold" className="size-3 text-green-600" aria-hidden />
                  </span>
                ) : step.state === "active" ? (
                  <span className="anim-pulse size-5 shrink-0 rounded-full border-2 border-green-500" />
                ) : (
                  <span className="size-5 shrink-0 rounded-full border border-dashed border-border-200" />
                )}
                <span
                  className={cx(
                    "text-[0.8125rem]",
                    step.state === "queued" ? "text-grey-500" : "text-ink-900",
                  )}
                >
                  {step.label}
                </span>
              </li>
            ))}
          </ul>
          <div className="card-shape-sm mt-4 bg-section px-3 py-2.5">
            <p className="text-[0.8125rem] font-semibold text-ink-900">
              Nothing publishes without a named approver
            </p>
          </div>
        </div>
      </div>
    </PanelShell>
  );
}

/* 3 · Brand ----------------------------------------------------------------- */

export function BrandPanel() {
  return (
    <PanelShell>
      <div className="grid gap-4 sm:grid-cols-[190px_1fr]">
        <div>
          <p className="t-h4">Client brand</p>
          <p className="t-caption mt-0.5 text-grey-500">Ridgeline Manufacturing</p>
          <div className="mt-3 space-y-3">
            <div className="card-shape-sm border border-border-200 p-3">
              <p className="text-[10px] font-semibold tracking-wide text-grey-500 uppercase">
                Palette
              </p>
              <div className="mt-2 flex gap-1.5" aria-hidden>
                <span className="size-6 rounded-md bg-[#8c2f39]" />
                <span className="size-6 rounded-md bg-[#2b3a55]" />
                <span className="size-6 rounded-md bg-[#d9c9a3]" />
              </div>
            </div>
            <p className="flex items-center gap-2 text-[0.8125rem] text-grey-700">
              <LockKey className="size-4 shrink-0 text-blue-500" aria-hidden />
              Locked at generation
            </p>
          </div>
        </div>

        <div className="card-shape-sm bg-section p-4">
          <div className="card-shape-sm border border-border-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <span className="size-5 rounded-sm bg-[#8c2f39]" aria-hidden />
              <span className="text-[0.8125rem] font-bold tracking-tight text-[#2b3a55]">
                RIDGELINE MANUFACTURING
              </span>
            </div>
            <p className="mt-3 text-lg leading-tight font-bold text-[#2b3a55]">
              Your 2026 benefits
            </p>
            <div className="mt-3 space-y-1.5" aria-hidden>
              <span className="block h-2 w-full rounded-full bg-tint-100" />
              <span className="block h-2 w-10/12 rounded-full bg-tint-100" />
            </div>
            <span className="mt-3 inline-flex rounded-full bg-[#8c2f39] px-3 py-1.5 text-[11px] font-semibold text-white">
              See my plans
            </span>
          </div>
          <p className="t-caption mt-3 text-grey-500">
            You power it. Your client gets the credit.
          </p>
        </div>
      </div>
    </PanelShell>
  );
}

/* 4 · Distribute ------------------------------------------------------------ */

export function DistributePanel() {
  return (
    <PanelShell>
      <p className="t-h4">Enrollment campaign</p>
      <p className="t-caption mt-0.5 text-grey-500">
        412 employees, 3 sites, no work email at two of them
      </p>

      <ul className="mt-4 space-y-2">
        {[
          { icon: Broadcast, when: "Oct 20", what: "Enrollment opens, text with guide link", note: "Primary" },
          { icon: PaperPlaneTilt, when: "Oct 24", what: "Email to the people who have an address", note: "Secondary" },
          { icon: Translate, when: "Oct 27", what: "Follow-up to people who have not opened", note: "Non-openers" },
          { icon: Broadcast, when: "Nov 5", what: "Two days left, to people who have not enrolled", note: "Non-completers" },
        ].map((row) => (
          <li
            key={row.when}
            className="card-shape-sm flex items-center gap-3 border border-border-200 px-3 py-2.5"
          >
            <row.icon className="size-4 shrink-0 text-blue-500" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.8125rem] font-medium text-ink-900">
                {row.what}
              </span>
              <span className="block text-[11px] text-grey-500 tabular">{row.when}</span>
            </span>
            <span className="hidden shrink-0 rounded-full bg-tint-100 px-2 py-0.5 text-[10px] font-semibold text-navy-700 sm:block">
              {row.note}
            </span>
          </li>
        ))}
      </ul>

      <p className="t-caption mt-3 text-grey-500">
        Quiet hours and opt-out are enforced per client.
      </p>
    </PanelShell>
  );
}

/* 5 · Track ----------------------------------------------------------------- */

const GROUPS = [
  { name: "Ridgeline Manufacturing", clicked: 81, unreached: 6 },
  { name: "Delta Foods Group", clicked: 74, unreached: 12 },
  { name: "Kestrel Logistics", clicked: 69, unreached: 3 },
  { name: "Northgate Health", clicked: 88, unreached: 1 },
];

export function TrackPanel() {
  return (
    <PanelShell>
      <div className="flex items-baseline justify-between gap-3">
        <p className="t-h4">Book rollup</p>
        <span className="t-caption text-grey-500">310 groups</span>
      </div>

      <ul className="mt-4 space-y-3">
        {GROUPS.map((g) => (
          <li key={g.name}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-[0.8125rem] font-medium text-ink-900">
                {g.name}
              </span>
              <span className="shrink-0 text-[0.8125rem] font-bold text-green-600 tabular">
                {g.clicked}%
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-tint-100">
              <div
                className="h-full rounded-full bg-green-500"
                style={{ width: `${g.clicked}%` }}
              />
            </div>
            <p className="t-caption mt-1 text-grey-500">
              {g.unreached} could not be reached
            </p>
          </li>
        ))}
      </ul>

      <div className="card-shape-sm mt-4 bg-section px-3 py-2.5">
        <p className="text-[0.8125rem] font-semibold text-ink-900">
          Delivered, failed, clicked, replied, acknowledged
        </p>
        <p className="t-caption mt-0.5 text-grey-500">Not open rate.</p>
      </div>
    </PanelShell>
  );
}

/* -------------------------------------------------------------------------- */

export function GroundingDiagram({ className }: { className?: string }) {
  const stages = [
    {
      title: "Your client's documents",
      body: "Carrier summaries, SBCs, the rate sheet. Nothing else.",
      items: ["Medical SBC", "Dental", "Rate sheet"],
    },
    {
      title: "Grounded generation",
      body: "Values extracted with the page they came from, then drafted.",
      items: ["Extract", "Cite", "Draft", "Translate"],
    },
    {
      title: "Reviewed, then published",
      body: "A named approver signs off. Every version is retained.",
      items: ["Approve", "Publish", "Version"],
    },
  ];

  return (
    <ol className={cx("stagger grid gap-4 md:grid-cols-3", className)}>
      {stages.map((stage, i) => (
        <li key={stage.title} className="relative" style={{ "--i": i } as React.CSSProperties}>
          <div className="card-shape h-full border border-border-200 bg-white p-5">
            <span className="t-caption font-bold text-blue-500 tabular">0{i + 1}</span>
            <p className="t-h4 mt-2">{stage.title}</p>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-grey-700">
              {stage.body}
            </p>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {stage.items.map((item) => (
                <li
                  key={item}
                  className="rounded-full bg-tint-100 px-2.5 py-1 text-[11px] font-semibold text-navy-700"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {i < stages.length - 1 ? (
            <ArrowRight
              weight="bold"
              className="absolute top-1/2 -right-3 z-10 hidden size-5 -translate-y-1/2 text-border-200 md:block"
              aria-hidden
            />
          ) : null}
        </li>
      ))}
    </ol>
  );
}
