import type { ReactNode } from "react";
import { cx } from "@/components/ui/primitives";

/**
 * Device frames are the argument, not skeuomorphism: the whole differentiator
 * is that the artefact reaches a phone. (File 04 §6.)
 *
 * The browser frame takes the signature card shape. The phone keeps a real
 * device radius, a handset with a sharp corner reads as a mistake rather than
 * as a brand.
 */

export function BrowserFrame({
  children,
  label,
  className,
  tone = "light",
}: {
  children: ReactNode;
  label?: string;
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={cx(
        "card-shape-lg overflow-hidden border shadow-[0_28px_70px_-32px_rgba(15,42,68,0.45)]",
        tone === "light"
          ? "border-border-200 bg-white"
          : "border-white/12 bg-navy-700/40",
        className,
      )}
    >
      <div
        className={cx(
          "flex items-center gap-2 border-b px-4 py-2.5",
          tone === "light"
            ? "border-border-200 bg-section"
            : "border-white/10 bg-white/[0.04]",
        )}
      >
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2 rounded-full bg-border-200" />
          <span className="size-2 rounded-full bg-border-200" />
          <span className="size-2 rounded-full bg-border-200" />
        </span>
        {label ? (
          <span
            className={cx(
              "ml-2 truncate rounded-md px-2.5 py-1 font-mono text-[11px] tracking-tight",
              tone === "light"
                ? "bg-white text-grey-500 ring-1 ring-border-200"
                : "bg-white/8 text-white/60",
            )}
          >
            {label}
          </span>
        ) : null}
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

export function PhoneFrame({
  children,
  className,
  caption,
}: {
  children: ReactNode;
  className?: string;
  caption?: string;
}) {
  return (
    <figure className={cx("flex flex-col items-center", className)}>
      <div className="relative w-[248px] rounded-[2.25rem] border border-navy-900/12 bg-navy-900 p-2 shadow-[0_30px_60px_-24px_rgba(15,42,68,0.55)]">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-white">
          <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[10px] font-semibold text-ink-900/70">
            <span>9:41</span>
            <span className="flex items-center gap-1" aria-hidden>
              <span className="h-2 w-3.5 rounded-[2px] border border-ink-900/40" />
              <span className="h-2 w-1.5 rounded-[1px] bg-ink-900/40" />
            </span>
          </div>
          {children}
        </div>
      </div>
      {caption ? (
        <figcaption className="t-caption mt-4 text-center text-grey-500">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

/** Anything showing illustrative data must say so. (Register §1.) */
export function SampleDataTag({
  className,
  tone = "light",
  children = "Sample data",
}: {
  className?: string;
  tone?: "light" | "dark";
  children?: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase",
        tone === "light"
          ? "border-border-200 bg-white/90 text-grey-500"
          : "border-white/20 bg-navy-900/70 text-white/70",
        className,
      )}
    >
      {children}
    </span>
  );
}
