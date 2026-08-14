"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useReducedMotion } from "@/components/demos/hooks";
import { SpotlightCard } from "@/components/ui/Spotlight";
import { Pill, SampleTag, cx } from "@/components/ui/primitives";
import {
  RESOURCE_KINDS,
  formatResourceDate,
  type Resource,
  type ResourceKind,
} from "@/lib/resources";

/**
 * One half of the library, filtered by topic.
 *
 * Only the topic filter is client state — the blog/case-studies split is a
 * route now, so it is the nav's job rather than this component's. The grid is
 * keyed on the active topic, which is what makes a filter change replay the
 * stagger instead of silently swapping rows underneath the reader.
 */

const ALL = "All topics";

export function ResourceGrid({ kind }: { kind: ResourceKind }) {
  const [topic, setTopic] = useState(ALL);
  const reduced = useReducedMotion();

  const config = RESOURCE_KINDS[kind];
  const items = config.items;

  // Only topics with something behind them, so a filter can never lead to an
  // empty grid.
  const topics = useMemo(
    () => [ALL, ...Array.from(new Set(items.map((item) => item.topic)))],
    [items],
  );

  const visible = useMemo(
    () => (topic === ALL ? items : items.filter((i) => i.topic === topic)),
    [items, topic],
  );

  const featured = visible.find((item) => item.featured);
  const rest = visible.filter((item) => item !== featured);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="flex flex-wrap gap-2">
          {topics.map((name) => {
            const on = name === topic;
            return (
              <button
                key={name}
                type="button"
                aria-pressed={on}
                onClick={() => setTopic(name)}
                className={cx(
                  "rounded-full border px-3.5 py-1.5 text-[0.8125rem] font-semibold transition-all duration-200",
                  on
                    ? "border-ink-900 bg-ink-900 text-white"
                    : "border-line text-slate-600 hover:border-slate-400 hover:text-ink",
                )}
              >
                {name}
              </button>
            );
          })}
        </div>

        <p className="tabular t-caption text-slate-400" aria-live="polite">
          {visible.length} {config.noun}
          {visible.length === 1 ? "" : "s"}
        </p>
      </div>

      <div key={topic} className="mt-10">
        {featured ? <FeaturedCard resource={featured} reduced={reduced} /> : null}

        <div
          className={cx(
            "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
            featured && "mt-6",
          )}
        >
          {rest.map((resource, i) => (
            <ResourceCard
              key={resource.slug}
              resource={resource}
              index={featured ? i + 1 : i}
              reduced={reduced}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** Entrance delay for the nth card. A timeout rather than a scroll timeline
 *  because the grid remounts on every filter change. */
function entrance(index: number, reduced: boolean) {
  return reduced
    ? undefined
    : { animation: `hero-in 600ms var(--ease-out-expo) ${index * 55}ms both` };
}

function FeaturedCard({
  resource,
  reduced,
}: {
  resource: Resource;
  reduced: boolean;
}) {
  return (
    <SpotlightCard
      as="article"
      padding="none"
      className="group"
      style={entrance(0, reduced)}
    >
      <div className="grid items-stretch gap-0 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="p-7 sm:p-9">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="green">Featured</Pill>
            <Pill>{resource.topic}</Pill>
          </div>
          <h3 className="t-h3 mt-5 text-ink">
            <Link
              href={`/resources/${resource.slug}`}
              className="after:absolute after:inset-0"
            >
              {resource.title}
            </Link>
          </h3>
          <p className="measure mt-4 text-[1.0625rem] leading-relaxed text-slate-600">
            {resource.dek}
          </p>
          <Meta resource={resource} className="mt-6" />
        </div>

        {/* Stands in for artwork that does not exist yet. */}
        <div className="relative hidden min-h-[15rem] overflow-hidden border-l border-line bg-ink-950 md:block">
          <div className="grid-field opacity-70" aria-hidden />
          <div className="absolute inset-0 grid place-items-center p-8">
            <p className="t-h4 text-center text-white/80">
              {resource.kind === "case"
                ? resource.client?.name
                : "TruHu Journal"}
            </p>
          </div>
          <SampleTag tone="dark" className="absolute top-4 right-4">
            Placeholder art
          </SampleTag>
        </div>
      </div>
    </SpotlightCard>
  );
}

function ResourceCard({
  resource,
  index,
  reduced,
}: {
  resource: Resource;
  index: number;
  reduced: boolean;
}) {
  return (
    <SpotlightCard
      as="article"
      className="group flex flex-col"
      style={entrance(index, reduced)}
    >
      <div className="flex items-center gap-2">
        <Pill>{resource.topic}</Pill>
      </div>

      <h3 className="t-h4 mt-4 text-ink">
        <Link
          href={`/resources/${resource.slug}`}
          className="after:absolute after:inset-0"
        >
          {resource.title}
        </Link>
      </h3>

      <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-slate-600">
        {resource.dek}
      </p>

      {resource.results ? (
        <dl className="mt-5 flex gap-5 border-t border-line pt-4">
          {resource.results.slice(0, 2).map((result) => (
            <div key={result.label}>
              <dt className="sr-only">{result.label}</dt>
              <dd className="tabular t-h4 text-ink">{result.value}</dd>
              <p className="t-caption mt-0.5 text-slate-400">{result.label}</p>
            </div>
          ))}
        </dl>
      ) : null}

      <Meta resource={resource} className="mt-5" />
    </SpotlightCard>
  );
}

function Meta({
  resource,
  className,
}: {
  resource: Resource;
  className?: string;
}) {
  return (
    <p className={cx("t-caption flex items-center gap-2 text-slate-400", className)}>
      <time dateTime={resource.date}>{formatResourceDate(resource.date)}</time>
      <span aria-hidden>·</span>
      <span>{resource.readingMinutes} min read</span>
    </p>
  );
}
