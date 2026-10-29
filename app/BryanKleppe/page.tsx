import { Check } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { Avatar } from "@/components/get-started/Avatar";
import { BookingWidget } from "@/components/get-started/BookingWidget";
import { EnsembleChat } from "@/components/get-started/EnsembleChat";
import { FlipbookOverlay } from "@/components/get-started/FlipbookOverlay";
import { FlowPanel } from "@/components/get-started/FlowPanel";
import { FlowProvider } from "@/components/get-started/FlowProvider";
import { FunnelTracker } from "@/components/get-started/FunnelTracker";
import { Words, wordCount } from "@/components/ui/Words";
import { Container, Section } from "@/components/ui/primitives";
import { GET_STARTED_PAGE } from "@/lib/content";

const { meta, hero, host, chat, outcomes, proof, booking } = GET_STARTED_PAGE;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: "/BryanKleppe" },
};

/**
 * Written out in full so Tailwind finds it. On a desktop viewport under 820px
 * tall, the lines that matter least (the stat cards and the "not a hard sales
 * pitch" note) leave so the rest still fits without scrolling.
 */
const SHORT_SCREEN_HIDDEN = "lg:[@media(max-height:820px)]:hidden";

/**
 * The page campaigns point at, at /BryanKleppe. It is one screen with no site
 * header or footer (see HideOnBarePages): the headline, the chat and what the
 * visitor gets out of it on the left, the calendar and the proof on the right. The
 * chat takes whatever height the viewport has left over (see EnsembleChat). If
 * the content is still taller than the viewport the page scrolls, and on a
 * phone the blocks stack with the calendar before the proof.
 *
 * Every block carries `data-section`, which is how the funnel tracker knows
 * what a visitor looked at and where they were when they left.
 */
export default function BryanKleppePage() {
  return (
    // The chat can open a popup in the middle of the screen (FlowPanel), and
    // Bryan's box floats to the corner while it's open (EnsembleChat).
    <FlowProvider copy={chat.flows}>
      {/* The tracker's page id stays "/get-started": the analytics dashboard
          filters on it, so the history before the rename stays in the same funnel. */}
      <FunnelTracker page="/get-started" />

      <Section
        tone="dark"
        ambient
        pointer
        pointerFade
        size="none"
        className="py-10 lg:flex lg:min-h-dvh lg:items-center lg:py-6"
      >
        <Container>
          <div className="grid gap-x-14 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,35rem)] lg:items-center">
            <div className="flex flex-col gap-4">
              {/* Intro ----------------------------------------------------- */}
              {/* A size container, so the headline can scale to two lines. */}
              <div data-section="intro" className="@container">
                {/* Two lines at any width: the size follows the column (about
                    6.4% of its width), up to the 2.5rem it used to be. */}
                <h1 className="t-h1 text-[min(2.5rem,6.4cqw)] text-white">
                  <Words text={hero.titleLead} />{" "}
                  <Words
                    text={hero.titleAccent}
                    start={wordCount(hero.titleLead)}
                    gradient
                  />
                </h1>
              </div>

              {/* The AI chat, which takes the height left over -------------- */}
              <EnsembleChat copy={chat} />

              {/* What you'll get out of it ---------------------------------- */}
              <section
                data-section="outcomes"
                aria-labelledby="outcomes-heading"
                style={{ animation: "hero-in 800ms var(--ease-out-expo) 460ms both" }}
              >
                <h2
                  id="outcomes-heading"
                  className="text-[0.9375rem] font-semibold text-slate-300"
                >
                  {outcomes.label}
                </h2>
                <ul className="mt-2.5 space-y-2">
                  {outcomes.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-green-500/15 text-green-400">
                        <Check weight="bold" className="size-3" />
                      </span>
                      <span className="text-[0.9375rem] leading-snug text-white">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className={`mt-2.5 text-[0.875rem] text-slate-300 ${SHORT_SCREEN_HIDDEN}`}>
                  {outcomes.notIt}
                </p>
              </section>
            </div>

            <FlowPanel booking={booking} host={host}>
              {/* The calendar ---------------------------------------------- */}
              <div className="demo-in">
                <BookingWidget copy={booking} hostName={host.name} hostPhoto={host.photo} />
              </div>

              {/* Proof, directly under the calendar ------------------------- */}
              <section
                data-section="proof"
                aria-label={proof.label}
                style={{ animation: "hero-in 800ms var(--ease-out-expo) 520ms both" }}
              >
                <figure className="card-shape border border-white/10 bg-white/[0.05] p-5 backdrop-blur-sm">
                  <blockquote className="font-display text-[1rem] leading-snug font-medium text-white">
                    <span aria-hidden className="text-green-400">
                      &ldquo;
                    </span>
                    <Quote text={proof.quote} accent={proof.accent} />
                  </blockquote>
                  <figcaption className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <Avatar name={proof.name} photo={proof.photo} size={40} />
                    <div className="min-w-[11rem] flex-1">
                      <p className="text-[0.9375rem] font-semibold text-white">{proof.name}</p>
                      <p className="text-[0.8125rem] leading-snug text-slate-300">
                        {proof.role} · {proof.agency}
                      </p>
                    </div>
                    <span className="rounded-full bg-green-500/15 px-3 py-1 text-[0.75rem] font-semibold text-green-400">
                      {proof.result}
                    </span>
                  </figcaption>
                </figure>

                <div className={SHORT_SCREEN_HIDDEN}>
                  <dl className="mt-3 grid grid-cols-2 gap-3">
                    {proof.stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="card-shape-sm flex items-center gap-3 border border-white/10 bg-white/[0.03] px-4 py-2.5"
                      >
                        <dd className="t-h2 t-gradient tabular text-[1.75rem]">{stat.value}</dd>
                        <dt className="text-[0.8125rem] leading-snug text-slate-300">
                          {stat.label}
                        </dt>
                      </div>
                    ))}
                  </dl>
                  <p className="t-caption mt-1.5 text-slate-400">Source: {proof.statsSource}</p>
                </div>
              </section>
            </FlowPanel>
          </div>
        </Container>
      </Section>
      <FlipbookOverlay />
    </FlowProvider>
  );
}

/** The quote with its point carried by the brand sweep. */
function Quote({ text, accent }: { text: string; accent: string }) {
  const at = text.indexOf(accent);
  if (at < 0) return <>{text}&rdquo;</>;
  return (
    <>
      {text.slice(0, at)}
      <span className="t-gradient">{accent}</span>
      {text.slice(at + accent.length)}&rdquo;
    </>
  );
}
