import Image from "next/image";
import { cx } from "@/components/ui/primitives";
import logo from "@/public/brand/truhu-logo.png";

/**
 * The canonical wordmark, used as the artwork rather than redrawn: lowercase
 * "truhu", "tru" in brand blue and "hu" in brand green. The brand's don'ts are
 * recolour, alter letterforms, change the tru/hu split, add effects, stretch.
 *
 * The reverse-white knockout is an approved variant and is produced the same
 * way the deck kit produces it, by flattening the artwork to white.
 */
export function Logo({
  tone = "dark",
  className,
  priority,
}: {
  tone?: "dark" | "light";
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={logo}
      alt="TruHu"
      priority={priority}
      className={cx(
        "h-7 w-auto",
        tone === "light" && "brightness-0 invert",
        className,
      )}
      sizes="120px"
    />
  );
}

/** Sub-brand lockup: the wordmark, a hairline, the product name. */
export function ProductLockup({
  product,
  tone = "dark",
  className,
}: {
  product: "Advisor" | "Workforce";
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <span className={cx("inline-flex items-center gap-3", className)}>
      <Logo tone={tone} className="h-6" />
      <span
        aria-hidden
        className={cx(
          "h-4 w-px",
          tone === "light" ? "bg-white/30" : "bg-line",
        )}
      />
      <span
        className={cx(
          "text-[0.9375rem] leading-none font-bold tracking-[-0.01em]",
          tone === "light" ? "text-white" : "text-ink",
        )}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {product}
      </span>
    </span>
  );
}
