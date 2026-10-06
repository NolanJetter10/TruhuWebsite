import { Fragment, type CSSProperties } from "react";
import { cx } from "./primitives";

/**
 * The hero sweep, in the green→blue direction truhu.ai runs on its home hero.
 * Mirrors --color-green-400 / --color-teal-400 / --color-blue-400, the on-dark
 * trio, as numbers so the slice per word can be interpolated.
 */
const SWEEP = [
  [0, [87, 217, 94]],
  [0.5, [33, 207, 192]],
  [1, [56, 182, 255]],
] as const satisfies readonly (readonly [
  number,
  readonly [number, number, number],
])[];

/** The colour of the sweep at `t`, clamped to [0, 1]. */
function sample(t: number) {
  const x = Math.min(1, Math.max(0, t));
  let i = 1;
  while (i < SWEEP.length - 1 && x > SWEEP[i][0]) i++;
  const [from, a] = SWEEP[i - 1];
  const [to, b] = SWEEP[i];
  const k = to === from ? 0 : (x - from) / (to - from);
  const ch = a.map((c, j) => Math.round(c + (b[j] - c) * k));
  return `rgb(${ch[0]} ${ch[1]} ${ch[2]})`;
}

/**
 * Splits a phrase into masked words for the hero's load sequence. Each word
 * rides up from behind its own clip box, offset by `--i`, so the headline
 * assembles left to right instead of fading in as one block.
 *
 * `start` continues the counter across a second call, which is what keeps the
 * accent phrase in step with the lead phrase.
 *
 * `gradient` paints the phrase with the brand sweep. `background-clip: text`
 * only shows where the element has a text run of its own, so the sweep has to
 * sit on the word spans rather than on a wrapper around them — a wrapper holds
 * no text and paints nothing, which is what made the old accent invisible. Each
 * word therefore gets the slice of the sweep its characters occupy, and the
 * line still reads as one continuous gradient.
 */
export function Words({
  text,
  className,
  start = 0,
  gradient = false,
}: {
  text: string;
  className?: string;
  start?: number;
  gradient?: boolean;
}) {
  const words = text.split(/\s+/);
  /* Where each word starts in the phrase, counting the spaces between them.
     Character position stands in for width closely enough that the per-word
     slices line up as one sweep. */
  const offsets = words.reduce<number[]>(
    (acc, word) => [...acc, acc[acc.length - 1] + word.length + 1],
    [0],
  );

  return (
    <>
      {words.map((word, i) => {
        const from = offsets[i] / text.length;
        const to = (offsets[i] + word.length) / text.length;

        return (
          <Fragment key={`${word}-${i}`}>
            {i > 0 ? " " : null}
            <span
              className={cx("word", className)}
              style={{ "--i": start + i } as CSSProperties}
            >
              <span
                className={gradient ? "grad-word" : undefined}
                style={
                  gradient
                    ? {
                        backgroundImage: `linear-gradient(90deg, ${sample(from)}, ${sample(to)})`,
                      }
                    : undefined
                }
              >
                {word}
              </span>
            </span>
          </Fragment>
        );
      })}
    </>
  );
}

/** How many words a phrase contributes, so the next call can continue. */
export const wordCount = (text: string) => text.split(/\s+/).length;
