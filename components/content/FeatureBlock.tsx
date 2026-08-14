import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { IconBullet, TextLink, cx } from "@/components/ui/primitives";

/**
 * Outcome headline, one line of explanation, four bullets, the product, a link.
 * The brand's deck spec keeps the word count down: the explainer is one
 * sentence and the bullets are phrases, not sentences.
 */
export function FeatureBlock({
  eyebrow,
  title,
  explainer,
  bullets,
  media,
  link,
  reverse,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  explainer: string;
  bullets: { icon: Icon; text: string }[];
  media?: ReactNode;
  link?: { href: string; label: string };
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div className={cx("grid items-center gap-10 lg:grid-cols-2 lg:gap-16", className)}>
      <div className={cx("reveal", reverse && "lg:order-2")}>
        {eyebrow ? <p className="t-eyebrow mb-4 text-blue-500">{eyebrow}</p> : null}
        <h3 className="t-h2">{title}</h3>
        <p className="measure mt-4 text-[1.0625rem] leading-relaxed text-grey-700">
          {explainer}
        </p>
        <ul className="mt-7 grid gap-3.5 sm:grid-cols-2">
          {bullets.map((bullet) => (
            <IconBullet
              key={bullet.text}
              icon={<bullet.icon className="size-[18px]" weight="bold" />}
            >
              {bullet.text}
            </IconBullet>
          ))}
        </ul>
        {link ? (
          <p className="mt-7">
            <TextLink href={link.href}>{link.label}</TextLink>
          </p>
        ) : null}
      </div>
      {media ? (
        <div className={cx("reveal-media min-w-0", reverse && "lg:order-1")}>{media}</div>
      ) : null}
    </div>
  );
}
