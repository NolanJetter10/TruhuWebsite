import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "./primitives";

/**
 * Brand components: primary CTA is a green #38B000 pill, secondary is a
 * 1.5px navy outline pill, radius 9999, padding 14/28. The signature
 * 3-rounded-1-sharp shape belongs to cards only; putting it on everything
 * destroys it.
 *
 * One documented deviation: the brand file specifies a white label on the
 * green fill, which measures 2.9:1 and fails WCAG AA. The label here is navy
 * #0F2A44 on brand green, which measures 5.1:1 and keeps both canonical
 * colours. See README.
 */

type Variant = "primary" | "secondary" | "onNavySecondary" | "quiet";

const BASE =
  "group inline-flex items-center justify-center gap-2 rounded-full text-[0.9375rem] font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-45";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-green-500 text-navy-900 hover:bg-green-600 hover:text-white active:bg-green-600",
  secondary:
    "border-[1.5px] border-navy-900 text-navy-900 hover:bg-navy-900 hover:text-white",
  onNavySecondary:
    "border-[1.5px] border-white/35 text-white hover:border-white hover:bg-white/10",
  quiet: "text-blue-500 hover:bg-blue-100",
};

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
  size?: "default" | "sm" | "lg";
}) {
  const classes = cx(
    BASE,
    VARIANT[variant],
    size === "sm" && "px-4 py-2 text-[0.875rem]",
    size === "default" && "px-6 py-3",
    size === "lg" && "px-7 py-3.5 text-base",
    className,
  );

  if (href.startsWith("http")) {
    return (
      <a href={href} className={classes} rel="noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
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
      className={cx(BASE, VARIANT[variant], "px-6 py-3", className)}
    >
      {children}
    </button>
  );
}
