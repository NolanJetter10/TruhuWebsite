import { BROKERS } from "@/lib/content";

/**
 * The trust rail. Two identical runs sit in one track; translating the track by
 * exactly -50% loops it with an invisible seam, and the mask keeps names from
 * appearing or vanishing at a hard edge. It pauses on hover so a name can
 * actually be read.
 *
 * Wordmarks stand in for logo files until we hold the artwork.
 */
export function LogoMarquee() {
  return (
    <div className="marquee w-full overflow-hidden">
      <div className="marquee-track" aria-hidden>
        {[0, 1].map((run) => (
          <ul key={run} className="flex shrink-0 items-center">
            {BROKERS.map((broker) => (
              <li
                key={broker}
                className="px-8 text-[1.0625rem] font-bold whitespace-nowrap text-slate-400 opacity-70 transition-[color,opacity] duration-300 hover:text-ink hover:opacity-100"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
              >
                {broker}
              </li>
            ))}
          </ul>
        ))}
      </div>
      <p className="sr-only">
        Brokerages using TruHu include {BROKERS.join(", ")}.
      </p>
    </div>
  );
}
