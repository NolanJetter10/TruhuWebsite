import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { WorkflowStatus } from "@/lib/workflows";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/** Index for a scroll-staggered child inside a `.stagger` container. */
export const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

/* -------------------------------------------------------------------------- */

export function Container({
  children,
  className,
  wide,
}: {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={cx(
        "mx-auto w-full px-5 sm:px-8",
        wide ? "max-w-[1440px]" : "max-w-[1200px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* Section rhythm alternates white and deep navy, with the light greys between. */
type SectionTone = "white" | "section" | "tint" | "navy";

const SECTION_TONE: Record<SectionTone, string> = {
  white: "bg-white text-ink-900",
  section: "bg-section text-ink-900",
  tint: "bg-tint-100 text-ink-900",
  navy: "bg-navy-900 text-white on-navy",
};

export function Section({
  children,
  tone = "white",
  className,
  id,
  size = "default",
  as: Tag = "section",
  labelledBy,
}: {
  children: ReactNode;
  tone?: SectionTone;
  className?: string;
  id?: string;
  size?: "default" | "tight" | "loose" | "none";
  as?: "section" | "div";
  labelledBy?: string;
}) {
  const pad =
    size === "none"
      ? ""
      : size === "tight"
        ? "py-10 sm:py-12"
        : size === "loose"
          ? "py-20 sm:py-28 lg:py-36"
          : "py-16 sm:py-20 lg:py-28";

  return (
    <Tag
      id={id}
      aria-labelledby={labelledBy}
      className={cx(
        "relative isolate overflow-hidden",
        SECTION_TONE[tone],
        pad,
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/* -------------------------------------------------------------------------- */

export function Eyebrow({
  children,
  tone = "blue",
  className,
}: {
  children: ReactNode;
  tone?: "blue" | "light" | "grey";
  className?: string;
}) {
  return (
    <p
      className={cx(
        "t-eyebrow",
        tone === "blue" && "text-blue-500",
        tone === "light" && "text-leaf-400",
        tone === "grey" && "text-grey-500",
        className,
      )}
    >
      {children}
    </p>
  );
}

/**
 * A heading, and at most one line under it. The brand's deck spec cuts summary
 * bands and lets the evidence stand alone, so `lede` is used sparingly.
 */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
  tone = "dark",
  id,
  className,
  level = 2,
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
  id?: string;
  className?: string;
  level?: 1 | 2;
}) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <div
      className={cx(
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl",
        className,
      )}
    >
      {eyebrow ? (
        <Eyebrow tone={tone === "light" ? "light" : "blue"} className="mb-4">
          {eyebrow}
        </Eyebrow>
      ) : null}
      <Heading
        id={id}
        className={cx(
          level === 1 ? "t-h1" : "t-h2",
          tone === "light" && "text-white",
        )}
      >
        {title}
      </Heading>
      {lede ? (
        <p
          className={cx(
            "t-lede mt-5",
            align === "center" ? "mx-auto measure" : "measure",
            tone === "light" ? "text-muted-300" : "text-grey-700",
          )}
        >
          {lede}
        </p>
      ) : null}
    </div>
  );
}

/** A hairline that draws itself as the section arrives. */
export function DrawnRule({
  tone = "dark",
  className,
}: {
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cx(
        "rule-draw h-px w-full",
        tone === "light" ? "bg-white/20" : "bg-border-200",
        className,
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */

export function Card({
  children,
  className,
  tone = "white",
  interactive,
  as: Tag = "div",
  style,
}: {
  children: ReactNode;
  className?: string;
  tone?: "white" | "tint" | "navy" | "green";
  interactive?: boolean;
  as?: "div" | "li" | "article";
  style?: CSSProperties;
}) {
  return (
    <Tag
      style={style}
      className={cx(
        "card-shape border p-6 sm:p-7",
        tone === "white" && "border-border-200 bg-white",
        tone === "tint" && "border-transparent bg-tint-100",
        tone === "green" && "border-transparent bg-green-100",
        tone === "navy" && "border-white/12 bg-white/[0.05]",
        interactive &&
          "transition-all duration-200 hover:-translate-y-1 hover:border-navy-900/20 hover:shadow-[0_18px_40px_-20px_rgba(15,42,68,0.28)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Brand component: 48px circle, green tint, navy glyph. */
export function IconCircle({
  children,
  tone = "green",
  className,
}: {
  children: ReactNode;
  tone?: "green" | "blue" | "navy" | "onNavy";
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex size-12 shrink-0 items-center justify-center rounded-full",
        tone === "green" && "bg-green-100 text-navy-900",
        tone === "blue" && "bg-blue-100 text-navy-900",
        tone === "navy" && "bg-navy-900 text-white",
        tone === "onNavy" && "bg-white/10 text-leaf-400",
        className,
      )}
      aria-hidden
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */

export function StatusPill({
  status,
  label,
  className,
  onNavy,
}: {
  status: WorkflowStatus;
  label: string;
  className?: string;
  onNavy?: boolean;
}) {
  const dot =
    status === "live"
      ? "bg-green-500"
      : status === "early-access"
        ? "bg-amber-500"
        : "bg-grey-500";

  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase",
        onNavy
          ? "border-white/18 bg-white/8 text-white/85"
          : status === "live"
            ? "border-transparent bg-green-100 text-green-600"
            : status === "early-access"
              ? "border-amber-500/25 bg-amber-500/8 text-amber-500"
              : "border-border-200 bg-section text-grey-700",
        className,
      )}
    >
      <span className={cx("size-1.5 rounded-full", dot)} aria-hidden />
      {label}
    </span>
  );
}

/**
 * A neutral label. Kept apart from StatusPill on purpose: the status colours
 * mean live, early access or roadmap and nothing else.
 */
export function Chip({
  children,
  tone = "quiet",
  className,
}: {
  children: ReactNode;
  tone?: "quiet" | "accent" | "light";
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase",
        tone === "quiet" && "bg-section text-grey-700",
        tone === "accent" && "bg-tint-100 text-navy-700",
        tone === "light" && "bg-white/10 text-white/85",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Required under any statistic. A Stat cannot render without one. */
export function SourceNote({
  children,
  tone = "dark",
  className,
}: {
  children: ReactNode;
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <p
      className={cx(
        "t-caption",
        tone === "light" ? "text-white/50" : "text-grey-500",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function IconBullet({
  icon,
  children,
  tone = "dark",
}: {
  icon: ReactNode;
  children: ReactNode;
  tone?: "dark" | "light";
}) {
  return (
    <li className="flex gap-3">
      <span
        className={cx(
          "mt-0.5 shrink-0",
          tone === "light" ? "text-leaf-400" : "text-blue-500",
        )}
        aria-hidden
      >
        {icon}
      </span>
      <span
        className={cx(
          "text-[0.9375rem] leading-relaxed",
          tone === "light" ? "text-muted-300" : "text-grey-700",
        )}
      >
        {children}
      </span>
    </li>
  );
}

export function TextLink({
  href,
  children,
  tone = "dark",
  className,
}: {
  href: string;
  children: ReactNode;
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "group inline-flex items-center gap-1.5 font-semibold underline-offset-4 hover:underline",
        tone === "light" ? "text-leaf-400" : "text-blue-500",
        className,
      )}
    >
      {children}
      <span
        aria-hidden
        className="transition-transform duration-200 group-hover:translate-x-1"
      >
        &rarr;
      </span>
    </Link>
  );
}
