import { Fragment, type CSSProperties } from "react";
import { cx } from "./primitives";

/**
 * Splits a phrase into masked words for the hero's load sequence. Each word
 * rides up from behind its own clip box, offset by `--i`, so the headline
 * assembles left to right instead of fading in as one block.
 *
 * `start` continues the counter across a second call, which is what keeps the
 * accent phrase in step with the lead phrase.
 */
export function Words({
  text,
  className,
  start = 0,
}: {
  text: string;
  className?: string;
  start?: number;
}) {
  return (
    <>
      {text.split(/\s+/).map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          {i > 0 ? " " : null}
          <span
            className={cx("word", className)}
            style={{ "--i": start + i } as CSSProperties}
          >
            <span>{word}</span>
          </span>
        </Fragment>
      ))}
    </>
  );
}

/** How many words a phrase contributes, so the next call can continue. */
export const wordCount = (text: string) => text.split(/\s+/).length;
