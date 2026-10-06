import type { ReactNode } from "react";
import { cx } from "@/components/ui/primitives";

/**
 * Device frames are the argument, not decoration: the differentiator is that
 * the artefact reaches an employee's phone. The browser frame takes the
 * signature card shape; the handset keeps a real device radius, because a
 * phone with a sharp corner reads as a mistake rather than as a brand.
 */

export function BrowserFrame({
  children,
  label,
  aside,
  className,
  tone = "light",
}: {
  children: ReactNode;
  label?: string;
  /** Sits at the far end of the toolbar, such as a page counter. */
  aside?: ReactNode;
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={cx(
        "card-shape-lg overflow-hidden border",
        tone === "light"
          ? "border-line bg-white shadow-[0_40px_90px_-40px_rgba(5,14,26,0.55)]"
          : "border-white/12 bg-ink-900/70 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.8)] backdrop-blur-xl",
        className,
      )}
    >
      <div
        className={cx(
          "flex items-center gap-2 border-b px-4 py-2.5",
          tone === "light" ? "border-line bg-paper" : "border-white/10 bg-white/[0.05]",
        )}
      >
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2 rounded-full bg-red-600/35" />
          <span className="size-2 rounded-full bg-amber-500/35" />
          <span className="size-2 rounded-full bg-green-500/40" />
        </span>
        {label ? (
          <span
            className={cx(
              "ml-2 truncate rounded-md px-2.5 py-1 font-mono text-[11px] tracking-tight",
              tone === "light"
                ? "bg-white text-slate-400 ring-1 ring-line"
                : "bg-white/[0.07] text-white/55",
            )}
          >
            {label}
          </span>
        ) : null}
        {aside ? <span className="ml-auto shrink-0">{aside}</span> : null}
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

export function PhoneFrame({
  children,
  className,
  width = 236,
}: {
  children: ReactNode;
  className?: string;
  width?: number;
}) {
  return (
    <div
      style={{ width }}
      className={cx(
        "relative shrink-0 rounded-[2.25rem] border border-white/10 bg-ink-950 p-2 shadow-[0_40px_80px_-32px_rgba(0,0,0,0.85)]",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-[1.75rem] bg-white">
        <div className="flex items-center justify-between px-5 pt-2.5 pb-1 text-[10px] font-semibold text-ink/60">
          <span>9:41</span>
          <span className="flex items-center gap-1" aria-hidden>
            <span className="h-2 w-3.5 rounded-[2px] border border-ink/35" />
            <span className="h-2 w-1.5 rounded-[1px] bg-ink/35" />
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
