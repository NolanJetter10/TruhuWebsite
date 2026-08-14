import { cx } from "@/components/ui/primitives";

/**
 * The brand leaf, exactly as drawn in the deck kit's truhu-leaf.svg. Angular,
 * not a generic blob. It stays atmosphere: low opacity, large, bleeding off a
 * corner, one per section at most, never behind body text.
 *
 * It carries the page's only parallax, and only because nothing here has to be
 * read.
 */
export function LeafMotif({
  className,
  opacity = 0.08,
  flip,
  rotate = 0,
  parallax = true,
}: {
  className?: string;
  opacity?: number;
  flip?: boolean;
  rotate?: number;
  parallax?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cx(
        "pointer-events-none absolute -z-10 overflow-hidden",
        parallax && "leaf-parallax",
        className,
      )}
      style={{ opacity }}
    >
      <svg
        viewBox="0 0 226 470"
        className="size-full"
        preserveAspectRatio="xMidYMid meet"
        style={{
          transform: `${flip ? "scaleX(-1) " : ""}rotate(${rotate}deg)`,
        }}
        focusable="false"
      >
        <path
          d="M2 467.991C42.2885 467.638 80.0263 456.63 112.558 437.656C179.052 398.881 223.72 326.798 223.72 244.278V2.10742C179.455 4.60905 138.477 19.3476 104.088 43.0059L102.43 44.1572L101.01 45.1592C41.0777 87.7844 2 157.783 2 236.918V467.991Z"
          className="fill-leaf-400 stroke-leaf-400"
          fillOpacity="0.4"
          strokeWidth="4"
        />
      </svg>
    </div>
  );
}
