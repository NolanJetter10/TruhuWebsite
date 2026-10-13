import Image from "next/image";
import { cx } from "@/components/ui/primitives";

/**
 * A person's face, or their initials on the brand sweep until a photo exists.
 * Square with the card's sharp corner, so it reads as part of the card system
 * rather than a social-media circle.
 */
export function Avatar({
  name,
  photo,
  size = 56,
  className,
}: {
  name: string;
  photo?: string | null;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const shape = size >= 64 ? "card-shape" : "card-shape-sm";

  if (photo) {
    return (
      <Image
        src={photo}
        alt=""
        width={size * 2}
        height={size * 2}
        // The optimizer doesn't take SVG (the placeholder); it needs none.
        unoptimized={photo.endsWith(".svg")}
        className={cx(shape, "shrink-0 object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cx(
        shape,
        "grid shrink-0 place-items-center font-display font-bold tracking-tight text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: "var(--grad-brand)",
      }}
    >
      {initials}
    </span>
  );
}
