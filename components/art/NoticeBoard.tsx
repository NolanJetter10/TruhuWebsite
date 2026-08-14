import { cx } from "@/components/ui/primitives";

/**
 * A conceptual illustration, in the same spirit as the shark-sign image: an
 * image doing a job no screenshot can. Photography is not used here because we
 * do not have a real workplace we have permission to show, and a purchased
 * office photograph would be doing work it cannot do. (File 02 §3.)
 */
export function NoticeBoard({ className }: { className?: string }) {
  const sheets = [
    { x: 46, y: 58, w: 128, h: 154, rot: -3, lines: 5, highlight: false },
    { x: 196, y: 44, w: 128, h: 168, rot: 2, lines: 6, highlight: true },
    { x: 344, y: 66, w: 116, h: 140, rot: -2, lines: 4, highlight: false },
    { x: 92, y: 214, w: 150, h: 84, rot: 1.5, lines: 3, highlight: false },
    { x: 268, y: 224, w: 158, h: 74, rot: -1.5, lines: 2, highlight: false },
  ];

  return (
    <svg
      viewBox="0 0 506 330"
      className={cx("h-auto w-full", className)}
      role="img"
      aria-label="A break-room notice board with five printed notices pinned to it. One is highlighted. There is no way to know whether anyone has read any of them."
    >
      <rect
        x="8"
        y="8"
        width="490"
        height="314"
        rx="10"
        className="fill-tint-100 stroke-border-200"
        strokeWidth="2"
      />

      {sheets.map((sheet, i) => (
        <g
          key={i}
          transform={`rotate(${sheet.rot} ${sheet.x + sheet.w / 2} ${sheet.y + sheet.h / 2})`}
        >
          <rect
            x={sheet.x}
            y={sheet.y}
            width={sheet.w}
            height={sheet.h}
            rx="3"
            className="fill-white stroke-border-200"
            strokeWidth="1.5"
          />
          <rect
            x={sheet.x + 14}
            y={sheet.y + 18}
            width={sheet.w * 0.58}
            height="7"
            rx="3.5"
            className={sheet.highlight ? "fill-navy-900" : "fill-ink-900"}
            opacity={sheet.highlight ? 1 : 0.7}
          />
          {Array.from({ length: sheet.lines }).map((_, li) => (
            <rect
              key={li}
              x={sheet.x + 14}
              y={sheet.y + 38 + li * 14}
              width={sheet.w - 28 - (li % 3) * 16}
              height="5"
              rx="2.5"
              className="fill-grey-500"
              opacity="0.35"
            />
          ))}
          <circle
            cx={sheet.x + sheet.w / 2}
            cy={sheet.y + 8}
            r="5"
            className={sheet.highlight ? "fill-green-500" : "fill-grey-500"}
            opacity={sheet.highlight ? 1 : 0.5}
          />
        </g>
      ))}
    </svg>
  );
}
