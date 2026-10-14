import type { CSSProperties, ReactNode } from "react";
import { FlipGrid } from "./FlipGrid";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/** Index for a scroll-staggered child inside a `.stagger` container. */
export const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

/* -------------------------------------------------------------------------- */

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("mx-auto w-full max-w-[1180px] px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}

/** The page alternates white, cool paper, and the lit dark surface. */
type Tone = "white" | "paper" | "dark";

const TONE: Record<Tone, string> = {
  white: "bg-white text-ink",
  paper: "bg-paper text-ink",
  dark: "bg-ink-950 text-white on-dark",
};

export function Section({
  children,
  tone = "white",
  className,
  id,
  size = "default",
  labelledBy,
  /** Lit surfaces get the drifting colour fields and the grid. */
  ambient,
  /** Doubles the grid and turns over the cell under the cursor. Ambient
   * surfaces only. */
  pointer,
  /** With `pointer`: the highlight fades toward the bottom of the section. */
  pointerFade,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  id?: string;
  size?: "default" | "tight" | "loose" | "none";
  labelledBy?: string;
  ambient?: boolean;
  pointer?: boolean;
  pointerFade?: boolean;
}) {
  const pad =
    size === "none"
      ? ""
      : size === "tight"
        ? "py-12 sm:py-14"
        : size === "loose"
          ? "py-20 sm:py-28 lg:py-32"
          : "py-16 sm:py-20 lg:py-24";

  // Clip, never hide: `overflow: hidden` makes the section a scroll container,
  // and every scroll-driven reveal inside would then track the section, which
  // never scrolls, instead of the page, and freeze part-way, blurred.
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cx("relative isolate overflow-clip", TONE[tone], pad, className)}
    >
      {ambient ? (
        <>
          <div
            className={cx("aurora", tone !== "dark" && "aurora-soft")}
            aria-hidden
          >
            <span />
            <span />
            <span />
          </div>
          {/* Rendered as a direct child: FlipGrid tracks its parent. */}
          {pointer ? (
            <FlipGrid tone={tone === "dark" ? "dark" : "light"} fade={pointerFade} />
          ) : (
            <div
              className={tone === "dark" ? "grid-field" : "grid-field-light"}
              aria-hidden
            />
          )}
        </>
      ) : null}
      {children}
    </section>
  );
}

/* -------------------------------------------------------------------------- */

export function SectionHeading({
  title,
  lede,
  align = "left",
  tone = "dark",
  id,
  className,
}: {
  title: ReactNode;
  lede?: ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
  id?: string;
  className?: string;
}) {
  return (
    <div
      className={cx(
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl",
        className,
      )}
    >
      <h2 id={id} className={cx("t-h2", tone === "light" && "text-white")}>
        {title}
      </h2>
      {lede ? (
        <p
          className={cx(
            "t-lede mt-5",
            align === "center" ? "measure mx-auto" : "measure",
            tone === "light" ? "text-slate-300" : "text-slate-600",
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
        tone === "light" ? "bg-white/15" : "bg-line",
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
  as: Tag = "div",
  style,
}: {
  children: ReactNode;
  className?: string;
  tone?: "white" | "paper" | "dark";
  as?: "div" | "li" | "article" | "figure";
  style?: CSSProperties;
}) {
  return (
    <Tag
      style={style}
      className={cx(
        "card-shape relative border p-6 sm:p-7",
        tone === "white" && "border-line bg-white",
        tone === "paper" && "border-line bg-paper",
        tone === "dark" && "border-white/10 bg-white/[0.04]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function Pill({
  children,
  tone = "quiet",
  className,
}: {
  children: ReactNode;
  tone?: "quiet" | "green" | "light";
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase",
        tone === "quiet" && "bg-paper text-slate-600",
        tone === "green" && "bg-green-100 text-green-700",
        tone === "light" && "bg-white/10 text-white/80",
        className,
      )}
    >
      {children}
    </span>
  );
}
