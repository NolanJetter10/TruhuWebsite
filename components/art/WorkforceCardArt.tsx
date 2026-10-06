import type { CSSProperties, ReactNode } from "react";
import {
  ArrowsClockwiseIcon,
  CalendarBlankIcon,
  CheckIcon,
  ClockIcon,
  MoonStarsIcon,
  PaperPlaneTiltIcon,
  SunHorizonIcon,
  SunIcon,
} from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/primitives";

/**
 * Artwork for the six message-category cards on /workforce, in place of stock
 * photography. Each is a small still of the product doing the thing the card
 * names, on the same lit navy stage, so the six read as one set.
 *
 * The art fills its card and sits under the card's own copy and gradient. The
 * copy is anchored bottom-left and, below `md`, always shows its summary, so it
 * climbs to roughly the top third of the card there; above `md` the summary is
 * a hover reveal and the copy only takes the bottom third. Every scene keeps
 * its point inside that clear band (`Zone`, or a panel pinned to the top that
 * fades out before the copy), and trims secondary detail below `md` rather
 * than running it under the text.
 *
 * Static by default. Hover (the card is the `group`) adds one small change per
 * scene, all transitions, which the global reduced-motion rule flattens.
 * Names and times are illustrative, as in the other Workforce demos.
 */

export type WorkforceCardKind =
  | "proof-of-delivery"
  | "automated-follow-up"
  | "segment-your-workforce"
  | "shift-aware-scheduling"
  | "instant-mass-send"
  | "built-for-frontline";

export function WorkforceCardArt({ kind }: { kind: WorkforceCardKind }) {
  return <Stage>{scene(kind)}</Stage>;
}

function scene(kind: WorkforceCardKind) {
  switch (kind) {
    case "proof-of-delivery":
      return <ProofOfDelivery />;
    case "automated-follow-up":
      return <AutomatedFollowUp />;
    case "segment-your-workforce":
      return <SegmentYourWorkforce />;
    case "shift-aware-scheduling":
      return <ShiftAwareScheduling />;
    case "instant-mass-send":
      return <InstantMassSend />;
    case "built-for-frontline":
      return <BuiltForFrontline />;
  }
}

/* -------------------------------------------------------------------------- */
/* The stage                                                                   */
/* -------------------------------------------------------------------------- */

/** Sample Company's brand colour, as the delivery demo paints it. Not a TruHu colour. */
const CLIENT_BRAND = "#0E5A63";

const GRID: CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, rgb(255 255 255 / 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.05) 1px, transparent 1px)",
  backgroundSize: "22px 22px",
  backgroundPosition: "center top",
  maskImage:
    "radial-gradient(ellipse 80% 70% at 50% 22%, #000 12%, transparent 78%)",
};

const LIGHT: CSSProperties = {
  background:
    "radial-gradient(125% 95% at 50% -8%, var(--color-ink-800) 0%, var(--color-ink-900) 42%, var(--color-ink-950) 80%)",
};

const GLOW: CSSProperties = {
  background:
    "radial-gradient(closest-side, color-mix(in oklab, var(--color-blue-400) 24%, transparent), transparent)",
};

/**
 * Navy, lit from above, a fine grid, and one brand glow behind the scene.
 *
 * The stage is a width container: the card is always 4:3, so its width stands
 * in for its height, and a scene can drop a row when the card gets short.
 * Between `sm` and `md` the grid is two narrow columns with the summary always
 * shown, the copy covers nearly the whole card, and the scene recedes.
 */
function Stage({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden
      className="@container pointer-events-none absolute inset-0 overflow-hidden bg-ink-950 select-none"
    >
      <div className="absolute inset-0" style={LIGHT} />
      <div className="absolute inset-0" style={GRID} />
      <div
        className="absolute -top-1/3 left-1/2 h-[92%] w-full -translate-x-1/2 opacity-70 transition-opacity duration-700 ease-out group-hover:opacity-100"
        style={GLOW}
      />
      <div className="absolute inset-0 sm:max-md:opacity-35">{children}</div>
      {/* Above `md` the card's summary slides up over the art on hover; the
          art steps back behind it so the copy reads cleanly. */}
      <div className="absolute inset-0 bg-linear-to-t from-ink-950 via-ink-950/80 via-45% to-transparent to-75% opacity-0 transition-opacity duration-500 ease-out max-md:hidden md:group-hover:opacity-100" />
    </div>
  );
}

/**
 * The clear band above the card's copy: the top third below `md`, where the
 * summary is always shown, and the top ~60% above it.
 */
function Zone({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-x-0 top-0 flex h-[35%] items-center justify-center md:h-[62%]">
      {children}
    </div>
  );
}

/** A raised glass surface. Opaque enough that the grid does not show through. */
const PANEL =
  "rounded-xl border border-white/10 bg-ink-900 bg-linear-to-b from-white/[0.07] to-white/[0.02] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.07)]";

/** Lets a panel run long and dissolve into the stage instead of ending hard. */
const FADE: CSSProperties = {
  maskImage: "linear-gradient(to bottom, #000 72%, transparent)",
};

type Tone = "green" | "blue" | "neutral" | "amber";

const CHIP_TONE: Record<Tone, string> = {
  green: "bg-green-400/12 text-green-400 ring-green-400/30",
  blue: "bg-blue-400/12 text-blue-400 ring-blue-400/30",
  neutral: "bg-white/[0.06] text-white/70 ring-white/15",
  amber: "bg-amber-400/12 text-amber-300 ring-amber-400/30",
};

/**
 * A status chip. `className` lands on an outer wrapper, never on the chip
 * itself, so positioning and hover effects cannot collide with the tone's own
 * utilities (Tailwind resolves those by stylesheet order, not class order).
 * `solid` backs the chip for when it sits over artwork rather than a panel.
 */
function Chip({
  tone,
  children,
  className,
  caps = true,
  solid = false,
}: {
  tone: Tone;
  children: ReactNode;
  className?: string;
  caps?: boolean;
  solid?: boolean;
}) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 rounded-full",
        solid && "bg-ink-900",
        className,
      )}
    >
      <span
        className={cx(
          "inline-flex items-center gap-1 rounded-full px-1.5 py-[3px] text-[9px] leading-none whitespace-nowrap ring-1 ring-inset",
          caps ? "font-bold tracking-[0.05em] uppercase" : "font-semibold",
          CHIP_TONE[tone],
        )}
      >
        {children}
      </span>
    </span>
  );
}

const AVATAR_TONE: Record<Tone, string> = {
  green: "bg-green-400/15 text-green-400",
  blue: "bg-blue-400/15 text-blue-400",
  neutral: "bg-white/[0.08] text-white/70",
  amber: "bg-amber-400/15 text-amber-300",
};

function Avatar({ initials, tone }: { initials: string; tone: Tone }) {
  return (
    <span
      className={cx(
        "grid size-[20px] shrink-0 place-items-center rounded-full text-[9px] font-bold",
        AVATAR_TONE[tone],
      )}
    >
      {initials}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* 01 Proof of delivery: one person's receipt, then the rest of the record.    */
/* -------------------------------------------------------------------------- */

const TRAIL = [
  { label: "Delivered", time: "6:02 AM" },
  { label: "Clicked", time: "6:09 AM" },
  { label: "Acknowledged", time: "6:14 AM" },
] as const;

/**
 * The rest of the record. Rosa is the point, unreachable but named, and the
 * first thing to go when a short card has no room for her.
 */
const RECORD_ROWS = [
  { initials: "DP", name: "Devon P.", status: "Clicked", time: "6:11 AM", tone: "blue", optional: false },
  { initials: "RM", name: "Rosa M.", status: "No number on file", time: null, tone: "amber", optional: true },
] as const;

function ProofOfDelivery() {
  return (
    <div
      className="absolute top-2.5 left-1/2 w-[86%] max-w-[296px] -translate-x-1/2 md:top-4"
      style={FADE}
    >
      <div className={cx(PANEL, "overflow-hidden")}>
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-3 py-1.5 max-md:hidden">
          <p className="truncate text-[10px] font-semibold text-white/85">
            Safety policy update
          </p>
          <p className="shrink-0 text-[9px] font-semibold tracking-[0.08em] text-white/40 uppercase">
            Per employee
          </p>
        </div>

        {/* The receipt: every step, with its time. */}
        <div className="border-b border-white/[0.07] bg-green-400/[0.04] px-3 py-2">
          <div className="flex items-center gap-2">
            <Avatar initials="MS" tone="green" />
            <p className="min-w-0 flex-1 truncate text-[10.5px] font-semibold text-white">
              Maria S.{" "}
              <span className="font-normal text-white/40 @max-[330px]:hidden">
                · Night crew
              </span>
            </p>
            <Chip
              tone="green"
              className="transition-shadow duration-500 group-hover:shadow-[0_0_14px_-2px_rgba(87,217,94,0.7)]"
            >
              <CheckIcon weight="bold" className="size-2.5" />
              Acknowledged
            </Chip>
          </div>

          <ol className="relative mt-2 ml-[28px] grid grid-cols-3">
            <span className="absolute top-[3px] left-[3px] h-px w-[66.67%] bg-linear-to-r from-green-400/35 to-green-400/80" />
            {TRAIL.map((step) => (
              <li key={step.label} className="relative min-w-0">
                <span className="block size-[7px] rounded-full bg-green-400 shadow-[0_0_8px_rgba(87,217,94,0.7)]" />
                <span className="mt-1 block truncate text-[9px] leading-tight text-white/50">
                  {step.label}
                </span>
                <span className="tabular block text-[9px] leading-tight font-semibold text-white/85">
                  {step.time}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <ul className="max-md:hidden">
          {RECORD_ROWS.map((row) => (
            <li
              key={row.name}
              className={cx(
                "flex items-center gap-2 border-b border-white/[0.06] px-3 py-[5px] last:border-b-0",
                row.optional && "@max-[350px]:hidden",
              )}
            >
              <Avatar initials={row.initials} tone={row.tone} />
              <span className="min-w-0 flex-1 truncate text-[10.5px] font-semibold text-white/85">
                {row.name}
              </span>
              {row.time ? (
                <span className="tabular text-[9px] text-white/40">{row.time}</span>
              ) : null}
              <Chip tone={row.tone}>{row.status}</Chip>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 02 Automated follow-up: sent, a day passes, the non-openers get it again.   */
/* -------------------------------------------------------------------------- */

function AutomatedFollowUp() {
  return (
    <Zone>
      <div className="w-[82%] max-w-[292px]">
        {/* The track */}
        <div className="flex items-center">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-blue-400/12 text-blue-400 ring-1 ring-blue-400/40">
            <PaperPlaneTiltIcon weight="fill" className="size-3" />
          </span>
          <span className="relative mx-1.5 h-px flex-1 border-t border-dashed border-white/25">
            <span className="absolute top-1/2 left-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-ink-900 px-2 py-[3px] text-[9px] font-semibold whitespace-nowrap text-white/70 ring-1 ring-white/12">
              <ClockIcon weight="bold" className="size-2.5 text-white/50" />
              24 hrs
            </span>
          </span>
          <span className="relative grid size-6 shrink-0 place-items-center rounded-full bg-green-400 text-ink-950 shadow-[0_0_18px_-2px_rgba(87,217,94,0.75)]">
            <span className="absolute -inset-1.5 rounded-full ring-1 ring-green-400/30 transition-[scale,opacity] duration-700 ease-out group-hover:scale-125 group-hover:opacity-0" />
            <ArrowsClockwiseIcon weight="bold" className="size-3" />
          </span>
        </div>

        <div className="mt-1.5 flex justify-between gap-3 text-[9px] leading-tight">
          <span className="text-white/50">
            <span className="font-semibold text-white/85">Sent</span>{" "}
            <span className="tabular">Mon 6:00 AM</span>
          </span>
          <span className="text-right text-white/50">
            <span className="font-semibold text-white/85">Resent</span>{" "}
            <span className="tabular">Tue 6:00 AM</span>
          </span>
        </div>

        {/* What the resend did */}
        <div className={cx(PANEL, "mt-2.5 flex items-center gap-2 px-2.5 py-[7px]")}>
          <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-green-400/15 text-green-400">
            <ArrowsClockwiseIcon weight="bold" className="size-2.5" />
          </span>
          <p className="min-w-0 truncate text-[10.5px] text-white/80">
            Resent to <span className="font-bold text-green-400">38</span>{" "}
            who haven&rsquo;t opened
          </p>
        </div>

        <div className="mt-3 max-md:hidden">
          <div className="flex items-baseline justify-between text-[9px]">
            <span className="font-semibold tracking-[0.08em] text-white/45 uppercase">
              Acknowledged
            </span>
            <span className="tabular font-semibold text-white/60">
              213 <span className="text-white/30">&rarr;</span>{" "}
              <span className="text-green-400">247</span>
              <span className="text-white/35"> of 251</span>
            </span>
          </div>
          <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <span className="h-full w-[85%] rounded-l-full bg-blue-400/60" />
            <span className="h-full w-[13.5%] bg-green-400 shadow-[0_0_10px_rgba(87,217,94,0.8)]" />
          </div>
        </div>
      </div>
    </Zone>
  );
}

/* -------------------------------------------------------------------------- */
/* 03 Segment your workforce: the roster in groups, one of them chosen.        */
/* -------------------------------------------------------------------------- */

/**
 * Centre x, centre y and diameter in a 320-wide box: 96 tall below `md`, 120
 * above. Below `md` the bubbles shrink but the labels cannot, so they spread
 * out instead; everything is a percentage of the box, so it scales as one.
 */
const SEGMENTS = [
  { name: "Corporate", sm: [34, 50, 44], md: [30, 74, 56] },
  { name: "Warehouse", sm: [112, 44, 66], md: [113, 58, 94] },
  { name: "Night crew", sm: [198, 44, 62], md: [210, 56, 84], lit: true, count: 64 },
  { name: "Drivers", sm: [282, 52, 48], md: [290, 72, 60] },
] as const;

const pct = (n: number, of: number) => `${((n / of) * 100).toFixed(3)}%`;

function segmentBox(sm: readonly number[], md: readonly number[]) {
  return {
    "--x": pct(sm[0], 320),
    "--y": pct(sm[1], 96),
    "--d": pct(sm[2], 320),
    "--x-md": pct(md[0], 320),
    "--y-md": pct(md[1], 120),
    "--d-md": pct(md[2], 320),
  } as CSSProperties;
}

const crowd = (color: string): CSSProperties => ({
  backgroundImage: `radial-gradient(circle, ${color} 0 1.15px, transparent 1.7px)`,
  backgroundSize: "7px 7px",
  backgroundPosition: "center",
});

const CROWD_LIT = crowd("var(--color-blue-400)");
const CROWD_DIM = crowd("rgb(255 255 255 / 0.2)");

function SegmentYourWorkforce() {
  return (
    <Zone>
      <div className="relative aspect-[320/96] w-[88%] max-w-[340px] md:aspect-[320/120]">
        {SEGMENTS.map((s) => {
          const lit = "lit" in s;
          return (
            <div
              key={s.name}
              className={cx(
                "absolute top-(--y) left-(--x) aspect-square w-(--d) -translate-x-1/2 -translate-y-1/2 transition-[opacity,scale] duration-500 ease-out md:top-(--y-md) md:left-(--x-md) md:w-(--d-md)",
                lit ? "group-hover:scale-105" : "group-hover:opacity-45",
              )}
              style={segmentBox(s.sm, s.md)}
            >
              <span
                className={cx(
                  "absolute inset-0 rounded-full ring-1",
                  lit
                    ? "bg-blue-400/10 ring-blue-400/55 shadow-[0_0_34px_-4px_rgba(56,182,255,0.6)]"
                    : "bg-white/[0.02] ring-white/12",
                )}
              />
              <span
                className="absolute inset-[9%] rounded-full"
                style={lit ? CROWD_LIT : CROWD_DIM}
              />
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                {lit ? (
                  <Chip tone="blue" caps={false} solid>
                    <CheckIcon weight="bold" className="size-2.5" />
                    {s.name}
                    <span className="tabular text-blue-400/70 max-md:hidden">
                      &middot; {s.count}
                    </span>
                  </Chip>
                ) : (
                  <Chip tone="neutral" caps={false} solid>
                    {s.name}
                  </Chip>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </Zone>
  );
}

/* -------------------------------------------------------------------------- */
/* 04 Shift-aware scheduling: a 24-hour dial, a send at the top of each shift. */
/* -------------------------------------------------------------------------- */

/** Clock hours to degrees on a dial with midnight at the top, clockwise. */
const hourDeg = (h: number) => (h / 24) * 360;

/** 6a–2p, 2p–10p, 10p–6a, each sent to as its shift starts. */
const SHIFTS = [
  { name: "First shift", start: 6, send: "6:00 AM", label: "6a", Icon: SunHorizonIcon },
  { name: "Second shift", start: 14, send: "2:00 PM", label: "2p", Icon: SunIcon, next: true },
  { name: "Third shift", start: 22, send: "10:00 PM", label: "10p", Icon: MoonStarsIcon },
] as const;

/** Degrees of ring left open around each send marker. */
const RING_GAP = 22;

/**
 * The ring is the brand sweep run around the day, starting at 6a so the one
 * hard seam sits under a marker. A gap around each marker splits it into the
 * three shifts.
 */
const RING: CSSProperties = {
  background: `conic-gradient(from ${hourDeg(6)}deg, var(--color-blue-400), var(--color-teal-400), var(--color-green-400))`,
  maskImage: [
    ...SHIFTS.map(
      (s) =>
        `conic-gradient(from ${hourDeg(s.start) - RING_GAP / 2}deg, transparent 0 ${RING_GAP}deg, #000 ${RING_GAP}deg 360deg)`,
    ),
    "radial-gradient(farthest-side, transparent calc(100% - var(--ring)), #000 calc(100% - var(--ring) + 0.5px))",
  ].join(", "),
  maskComposite: "intersect",
};

/** Where on the ring's centre line a given hour sits, as CSS offsets. */
function onRing(h: number): CSSProperties {
  const rad = ((hourDeg(h) - 90) * Math.PI) / 180;
  const cos = Math.cos(rad).toFixed(4);
  const sin = Math.sin(rad).toFixed(4);
  return {
    left: `calc(50% + ${cos} * (50% - var(--ring) / 2))`,
    top: `calc(50% + ${sin} * (50% - var(--ring) / 2))`,
  };
}

/** Hour labels sit just outside the ring. */
function outsideRing(h: number, gap: number): CSSProperties {
  const rad = ((hourDeg(h) - 90) * Math.PI) / 180;
  return {
    left: `calc(50% + ${Math.cos(rad).toFixed(4)} * (50% + ${gap}px))`,
    top: `calc(50% + ${Math.sin(rad).toFixed(4)} * (50% + ${gap}px))`,
  };
}

function ShiftAwareScheduling() {
  return (
    <Zone>
      <div className="flex items-center gap-4 @min-[340px]:gap-7">
        <div className="relative size-[74px] shrink-0 [--ring:6px] md:size-[112px] md:[--ring:8px]">
          <span className="absolute inset-0 rounded-full bg-white/[0.04]" />
          <span
            className="absolute inset-0 rounded-full opacity-85 transition-opacity duration-500 group-hover:opacity-100"
            style={RING}
          />
          {/* Hour ticks, inside the ring */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
            {Array.from({ length: 24 }, (_, h) => {
              const rad = ((hourDeg(h) - 90) * Math.PI) / 180;
              const major = h % 6 === 0;
              const r1 = major ? 33 : 35.5;
              return (
                <line
                  key={h}
                  x1={50 + Math.cos(rad) * r1}
                  y1={50 + Math.sin(rad) * r1}
                  x2={50 + Math.cos(rad) * 38}
                  y2={50 + Math.sin(rad) * 38}
                  stroke="white"
                  strokeOpacity={major ? 0.3 : 0.14}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>

          {/* Send markers, one at the top of each shift */}
          {SHIFTS.map((s) => (
            <span
              key={s.label}
              className="absolute size-[11px] -translate-x-1/2 -translate-y-1/2 md:size-[13px]"
              style={onRing(s.start)}
            >
              <span className="absolute -inset-1.5 rounded-full bg-white/20 opacity-0 transition-[opacity,scale] duration-700 ease-out group-hover:scale-150 group-hover:opacity-100" />
              <span className="absolute inset-0 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.55)] ring-[2.5px] ring-ink-950" />
            </span>
          ))}

          {/* Hour labels, only where the dial is large and has room around it. */}
          {SHIFTS.map((s) => (
            <span
              key={s.label}
              className="tabular absolute -translate-x-1/2 -translate-y-1/2 text-[9px] font-semibold text-white/45 max-md:hidden @max-[340px]:hidden"
              style={outsideRing(s.start, 12)}
            >
              {s.label}
            </span>
          ))}

          <span className="absolute inset-0 grid place-items-center text-center">
            <span className="leading-tight">
              <span className="block text-[9px] font-semibold tracking-[0.08em] text-white/40 uppercase max-md:hidden">
                Next send
              </span>
              <span className="tabular block font-display text-[12px] font-bold text-white md:text-[15px]">
                2:00 PM
              </span>
              <span className="block text-[9px] text-white/45">2nd shift</span>
            </span>
          </span>
        </div>

        <ul
          className={cx(
            PANEL,
            "w-[160px] divide-y divide-white/[0.07] overflow-hidden",
          )}
        >
          {SHIFTS.map((s) => (
            <li
              key={s.label}
              className={cx(
                "flex items-center gap-1.5 px-2.5 py-[6px] md:py-2",
                "next" in s && "bg-white/[0.035]",
              )}
            >
              <s.Icon weight="fill" className="size-3 shrink-0 text-white/45" />
              <span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-white/85">
                {s.name}
              </span>
              <span className="tabular inline-flex shrink-0 items-center gap-0.5 text-[9px] font-semibold text-blue-400">
                <PaperPlaneTiltIcon weight="fill" className="size-2.5" />
                {s.send}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Zone>
  );
}

/* -------------------------------------------------------------------------- */
/* 05 Instant mass send: one send, rippling out across the whole roster.       */
/* -------------------------------------------------------------------------- */

/** Drawn in a 320 × 140 box; below `md` the box is cropped to its top 100. */
const SEND_W = 320;
const SEND_H = 140;
const SOURCE = { x: 160, y: 22 };

/** How far the send has reached at rest. Phones beyond it land on hover. */
const FRONT = 116;

/** The roster as a staggered crowd of phones, nearest the send first. */
const CROWD = Array.from({ length: 4 }, (_, row) => {
  const odd = row % 2 === 1;
  return Array.from({ length: odd ? 12 : 13 }, (_, col) => {
    const x = 16 + col * 24 + (odd ? 12 : 0);
    const y = 56 + row * 23;
    const dist = Math.hypot(x - SOURCE.x, y - SOURCE.y);
    return { key: `${row}-${col}`, x, y, dist, lit: dist < FRONT };
  });
}).flat();

/** A ripple: the lower half of a circle around the send. */
function ripple(r: number) {
  const { x, y } = SOURCE;
  return `M${x - r} ${y}A${r} ${r} 0 0 0 ${x + r} ${y}`;
}

const RIPPLES = [
  { r: 44, className: "stroke-blue-400/30" },
  { r: 80, className: "stroke-blue-400/25" },
  { r: FRONT, className: "stroke-green-400/55" },
] as const;

function InstantMassSend() {
  return (
    <Zone>
      <div
        className="relative aspect-[320/100] w-[88%] max-w-[340px] md:aspect-[320/140] md:w-[92%]"
        style={FADE}
      >
        <svg
          viewBox={`0 0 ${SEND_W} ${SEND_H}`}
          preserveAspectRatio="xMidYMin slice"
          className="absolute inset-0 size-full"
        >
          <defs>
            <radialGradient id="wca-bloom" cx={SOURCE.x} cy={SOURCE.y} r={FRONT + 10} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="var(--color-green-400)" stopOpacity="0.16" />
              <stop offset="1" stopColor="var(--color-green-400)" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx={SOURCE.x} cy={SOURCE.y} r={FRONT + 10} fill="url(#wca-bloom)" />

          {RIPPLES.map((ring) => (
            <path
              key={ring.r}
              d={ripple(ring.r)}
              fill="none"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              className={ring.className}
            />
          ))}
          <path
            d={ripple(FRONT + 42)}
            fill="none"
            strokeWidth={1}
            strokeDasharray="2 4"
            vectorEffect="non-scaling-stroke"
            className="stroke-white/12 transition-[stroke] duration-700 group-hover:stroke-green-400/40"
          />

          {CROWD.map((p) => (
            <rect
              key={p.key}
              x={p.x - 3.5}
              y={p.y - 5.5}
              width={7}
              height={11}
              rx={1.8}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              className={cx(
                "transition-[fill,stroke] duration-500 ease-out",
                p.lit
                  ? "fill-green-400 stroke-green-400"
                  : "fill-white/[0.03] stroke-white/25 group-hover:fill-green-400 group-hover:stroke-green-400",
              )}
              style={
                p.lit
                  ? { fillOpacity: 1 - (p.dist / FRONT) * 0.4 }
                  : { transitionDelay: `${Math.round((p.dist - FRONT) * 7)}ms` }
              }
            />
          ))}
        </svg>

        {/* The send, flanked by who and how */}
        <div className="absolute inset-x-0 top-[22%] grid -translate-y-1/2 grid-cols-[1fr_auto_1fr] items-center gap-2.5 md:top-[15.7%]">
          <Chip tone="neutral" solid className="justify-self-end">
            Every employee
          </Chip>
          <span className="relative size-8 md:size-9">
            <span className="absolute -inset-1.5 rounded-full ring-1 ring-blue-400/30 transition-[scale,opacity] duration-700 ease-out group-hover:scale-150 group-hover:opacity-0" />
            <span className="absolute inset-0 grid place-items-center rounded-full bg-blue-500 text-white shadow-[0_0_28px_-2px_rgba(5,130,220,0.9)] ring-1 ring-blue-400/60">
              <PaperPlaneTiltIcon weight="fill" className="size-4" />
            </span>
          </span>
          <Chip tone="neutral" solid className="justify-self-start">
            Text + email
          </Chip>
        </div>
      </div>
    </Zone>
  );
}

/* -------------------------------------------------------------------------- */
/* 06 Built for frontline: a plain text on a personal phone, with a link.      */
/* -------------------------------------------------------------------------- */

const PILL =
  "rounded-full border border-white/10 bg-ink-900 bg-linear-to-b from-white/[0.08] to-white/[0.03] shadow-[0_16px_32px_-16px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.07)]";

function BuiltForFrontline() {
  return (
    <>
      {/* Below `md` the handset runs off the top edge, so only the message
          itself sits in the clear band. */}
      <div
        className="absolute -top-2.5 left-[36%] w-[156px] -translate-x-1/2 md:top-3.5"
        style={FADE}
      >
        <div className="rounded-[25px] border border-white/15 bg-ink-950 p-[5px] shadow-[0_30px_60px_-24px_rgba(0,0,0,0.95)]">
          <div className="overflow-hidden rounded-[20px] bg-ink-900 bg-linear-to-b from-white/[0.05] to-transparent pb-3 max-md:pt-3">
            <div className="max-md:hidden">
              <div className="flex items-center justify-between px-4 pt-2 pb-1 text-[9px] font-semibold text-white/60">
                <span className="tabular">6:02</span>
                <span className="h-[6px] w-[11px] rounded-[2px] border border-white/40" />
              </div>
              <p className="flex items-center justify-center gap-1.5 pt-0.5 pb-2 text-[9.5px] font-semibold text-white/80">
                <span
                  className="grid size-4 place-items-center rounded-full text-[9px] font-black text-white"
                  style={{ background: CLIENT_BRAND }}
                >
                  S
                </span>
                Sample Company HR
              </p>
            </div>

            <div className="px-2">
              <p className="rounded-[14px] rounded-bl-[5px] bg-white/[0.11] px-2.5 py-[7px] text-[10px] leading-[1.35] text-white/90">
                Oak St opens at 10 AM tomorrow.
              </p>

              {/* A plain link: no app to install, nothing to sign in to. */}
              <div className="relative mt-1 flex items-center gap-1.5 overflow-hidden rounded-[11px] bg-white/[0.07] p-1.5 ring-1 ring-white/10 transition-[box-shadow] duration-500 group-hover:ring-blue-400/60">
                <span
                  className="grid size-6 shrink-0 place-items-center rounded-[6px] text-white"
                  style={{ background: CLIENT_BRAND }}
                >
                  <CalendarBlankIcon weight="fill" className="size-3" />
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-[9.5px] font-semibold text-white/90">
                    Shift schedule
                  </span>
                  <span className="block truncate text-[9px] text-blue-400">
                    truhu.link/oak-st
                  </span>
                </span>
                <span className="absolute top-1/2 left-[64%] size-8 -translate-x-1/2 -translate-y-1/2 scale-50 rounded-full bg-white/20 opacity-0 transition-[scale,opacity] duration-500 ease-out group-hover:scale-100 group-hover:opacity-100" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-[8%] left-[58%] flex flex-col items-start gap-2 md:top-[22%] md:gap-2.5">
        {["No app", "No login"].map((label, i) => (
          <span
            key={label}
            className={cx(
              PILL,
              "inline-flex items-center gap-1.5 py-1 pr-2.5 pl-1 text-[10.5px] font-semibold whitespace-nowrap text-white/90 transition-transform duration-500 ease-out",
              i === 0 ? "group-hover:translate-x-1" : "ml-4 group-hover:translate-x-2",
            )}
          >
            <span className="grid size-[18px] place-items-center rounded-full bg-green-400/15 text-green-400">
              <CheckIcon weight="bold" className="size-2.5" />
            </span>
            {label}
          </span>
        ))}
      </div>
    </>
  );
}
