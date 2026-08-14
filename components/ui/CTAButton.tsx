import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "./primitives";

/**
 * The primary CTA is a brand-green pill; the label is navy rather than white
 * because white on #38B000 measures 2.9:1 and fails WCAG AA, while navy
 * measures 5.1:1 and keeps both canonical colours.
 *
 * Every variant carries `.sheen`, a light sweep that crosses the button once
 * on hover. The signature 3-rounded-1-sharp shape belongs to cards only.
 */

type Variant = "primary" | "secondary" | "onDark" | "ghost";

const BASE =
  "sheen group inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-green-500 text-ink-950 shadow-[0_10px_28px_-12px_rgba(56,176,0,0.75)] hover:bg-green-400 hover:shadow-[0_16px_36px_-12px_rgba(56,176,0,0.85)]",
  secondary:
    "border-[1.5px] border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white",
  onDark:
    "border border-white/25 bg-white/[0.06] text-white backdrop-blur-sm hover:border-white/50 hover:bg-white/[0.12]",
  ghost: "text-blue-700 hover:bg-blue-100",
};

const SIZE = {
  sm: "px-4 py-2 text-[0.875rem]",
  default: "px-6 py-3 text-[0.9375rem]",
  lg: "px-7 py-3.5 text-base",
} as const;

export function CTAButton({
  href,
  children,
  variant = "primary",
  className,
  size = "default",
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  size?: keyof typeof SIZE;
}) {
  const classes = cx(BASE, VARIANT[variant], SIZE[size], className);
  const label = (
    <>
      <span className="relative z-[2]">{children}</span>
      <span
        aria-hidden
        className="relative z-[2] transition-transform duration-200 group-hover:translate-x-1"
      >
        &rarr;
      </span>
    </>
  );

  if (href.startsWith("http")) {
    return (
      <a href={href} className={classes} rel="noreferrer">
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {label}
    </Link>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
  className,
  pending,
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  pending?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={cx(BASE, VARIANT[variant], SIZE.default, className)}
    >
      <span className="relative z-[2]">{children}</span>
    </button>
  );
}

/** An inline link with a rule that grows from the left on hover. */
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
        "group inline-flex items-center gap-1.5 font-semibold",
        tone === "light" ? "text-green-400" : "text-blue-700",
        className,
      )}
    >
      <span className="relative">
        {children}
        <span
          aria-hidden
          className={cx(
            "absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100",
            tone === "light" ? "bg-green-400" : "bg-blue-700",
          )}
        />
      </span>
      <span
        aria-hidden
        className="transition-transform duration-200 group-hover:translate-x-1"
      >
        &rarr;
      </span>
    </Link>
  );
}
