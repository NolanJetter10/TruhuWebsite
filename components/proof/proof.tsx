import Link from "next/link";
import { ShieldCheck } from "@phosphor-icons/react/ssr";
import type { CaseStudy, Quote, Resource } from "@/lib/content";
import { BROKER_LOGOS, LOGO_WALL_HEADING, TRUST_BADGES } from "@/lib/content";
import {
  Card,
  Chip,
  SourceNote,
  TextLink,
  cx,
  stagger,
} from "@/components/ui/primitives";

/* -------------------------------------------------------------------------- */

/**
 * Set as wordmarks rather than image files. Only firms on the brand's approved
 * partner list appear. Register §2: every logo has to be defensible as a
 * customer relationship at the level the wall implies.
 */
export function LogoWall({
  heading = LOGO_WALL_HEADING,
  tone = "dark",
  className,
}: {
  heading?: string;
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <div className={className}>
      <p
        className={cx(
          "t-caption text-center font-medium",
          tone === "light" ? "text-white/60" : "text-grey-500",
        )}
      >
        {heading}
      </p>
      <ul className="stagger mt-6 flex flex-wrap items-center justify-center gap-x-9 gap-y-4 sm:gap-x-12">
        {BROKER_LOGOS.map((name, i) => (
          <li
            key={name}
            style={stagger(i)}
            className={cx(
              "text-[0.9375rem] font-bold tracking-[-0.01em] whitespace-nowrap sm:text-base",
              tone === "light" ? "text-white/55" : "text-navy-900/40",
            )}
          >
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * One quote, not a carousel. There is no photo slot: a stock portrait attached
 * to a named person discredits the quote and every other quote on the site.
 */
export function Testimonial({
  quote,
  tone = "dark",
  className,
}: {
  quote: Quote;
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <figure className={cx("max-w-3xl", className)}>
      <blockquote
        className={cx(
          "t-h2 font-medium",
          tone === "light" ? "text-white" : "text-ink-900",
        )}
      >
        <span aria-hidden className="text-green-500">
          &ldquo;
        </span>
        {quote.quote}
        <span aria-hidden className="text-green-500">
          &rdquo;
        </span>
      </blockquote>
      <figcaption className="mt-7 flex items-center gap-4">
        <span
          className={cx(
            "card-shape-sm flex size-11 shrink-0 items-center justify-center text-[0.8125rem] font-bold",
            tone === "light" ? "bg-white/10 text-white" : "bg-tint-100 text-navy-700",
          )}
          aria-hidden
        >
          {quote.initials}
        </span>
        <span>
          <span
            className={cx(
              "block text-[0.9375rem] font-semibold",
              tone === "light" ? "text-white" : "text-ink-900",
            )}
          >
            {quote.name}
          </span>
          <span
            className={cx(
              "block text-[0.8125rem]",
              tone === "light" ? "text-muted-300" : "text-grey-500",
            )}
          >
            {quote.title}, {quote.org}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

/* -------------------------------------------------------------------------- */

/** Small, quiet, always present. This is what gets a deal through ops review. */
export function TrustStrip({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <div
      className={cx(
        "flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between",
        tone === "light" ? "text-white" : "text-ink-900",
      )}
    >
      <ul className="flex flex-wrap items-center gap-x-8 gap-y-3">
        {TRUST_BADGES.map((badge) => (
          <li key={badge.label} className="flex items-center gap-2">
            <ShieldCheck
              weight="fill"
              className={cx(
                "size-4 shrink-0",
                tone === "light" ? "text-leaf-400" : "text-green-600",
              )}
              aria-hidden
            />
            <span className="text-[0.8125rem] font-semibold">{badge.label}</span>
            <span
              className={cx(
                "text-[0.8125rem]",
                tone === "light" ? "text-white/50" : "text-grey-500",
              )}
            >
              {badge.detail}
            </span>
          </li>
        ))}
      </ul>
      <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {[
          { href: "/security", label: "Security" },
          { href: "/implementation", label: "Implementation" },
          { href: "/integrations", label: "Integrations" },
        ].map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={cx(
                "text-[0.8125rem] font-semibold underline-offset-4 hover:underline",
                tone === "light" ? "text-leaf-400" : "text-blue-500",
              )}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function CaseStudyCard({ study }: { study: CaseStudy }) {
  return (
    <Card as="article" interactive className="relative flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="accent">{study.side}</Chip>
        <span className="t-caption text-grey-500">{study.sector}</span>
      </div>
      <h3 className="t-h3 mt-4">
        <Link href={`/customers/${study.slug}`} className="hover:text-navy-700">
          <span className="absolute inset-0" aria-hidden />
          {study.org}
        </Link>
      </h3>
      <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-grey-700">
        {study.summary}
      </p>
      {study.headlineStat ? (
        <div className="mt-6 border-t border-border-200 pt-5">
          <p
            className="font-bold text-green-500 tabular"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2.75rem",
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}
          >
            {study.headlineStat.value}
          </p>
          <p className="mt-2 text-[0.8125rem] font-medium text-ink-900">
            {study.headlineStat.label}
          </p>
          <SourceNote className="mt-2">{study.headlineStat.source}</SourceNote>
        </div>
      ) : null}
    </Card>
  );
}

export function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <Card as="article" interactive className="relative flex h-full flex-col">
      <div className="flex items-center gap-2">
        <span className="t-caption font-semibold text-blue-500 uppercase">
          {resource.kind}
        </span>
        <span className="t-caption text-grey-500">{resource.readingTime}</span>
      </div>
      <h3 className="t-h4 mt-3 text-[1.0625rem] leading-snug">
        <Link href={`/resources/${resource.slug}`}>
          <span className="absolute inset-0" aria-hidden />
          {resource.title}
        </Link>
      </h3>
      <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-grey-700">
        {resource.dek}
      </p>
    </Card>
  );
}

export function LinkCard({
  href,
  eyebrow,
  title,
  body,
  cta,
}: {
  href: string;
  eyebrow?: string;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <Card interactive className="relative flex h-full flex-col">
      {eyebrow ? (
        <p className="t-caption font-semibold text-blue-500 uppercase">{eyebrow}</p>
      ) : null}
      <h3 className="t-h3 mt-2">{title}</h3>
      <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-grey-700">
        {body}
      </p>
      <span className="mt-5">
        <TextLink href={href}>
          <span className="absolute inset-0" aria-hidden />
          {cta}
        </TextLink>
      </span>
    </Card>
  );
}
