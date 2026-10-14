import { Broadcast, Check, Clock, Monitor } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { Avatar } from "@/components/get-started/Avatar";
import { BookingWidget } from "@/components/get-started/BookingWidget";
import { FunnelTracker } from "@/components/get-started/FunnelTracker";
import { CTAButton } from "@/components/ui/CTAButton";
import { Words, wordCount } from "@/components/ui/Words";
import { Container, Section, stagger } from "@/components/ui/primitives";
import { GET_STARTED_PAGE } from "@/lib/content";

const { meta, hero, host, outcomes, proof, booking, agenda } = GET_STARTED_PAGE;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: "/get-started" },
};

const FORMAT_ICONS = [Clock, Broadcast, Monitor];

/**
 * The page campaigns point at. One lit screen does the whole job: who the
 * visitor will meet and what they get on the left, the calendar on the right,
 * held in view while they read, and the proof directly beside it rather than
 * at the bottom. On a phone the same blocks stack with the calendar before the
 * proof, so the ask still comes before the scroll gets long.
 *
 * Every block carries `data-section`, which is how the funnel tracker knows
 * what a visitor looked at and where they were when they left.
 */
export default function GetStartedPage() {
  return (
    <>
      <FunnelTracker page="/get-started" />

      <Section tone="dark" ambient pointer pointerFade size="none" className="pt-12 pb-20 sm:pt-16 lg:pt-20 lg:pb-28">
        <Container>
          <div className="grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,35rem)] lg:items-start">
            <div className="space-y-10 lg:pt-4">
              {/* Intro ----------------------------------------------------- */}
              <div data-section="intro">
                <p
                  className="t-eyebrow inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-blue-400 backdrop-blur-sm"
                  style={{ animation: "hero-in 700ms var(--ease-out-expo) both" }}
                >
                  <span className="size-1.5 rounded-full bg-green-400 anim-pulse" />
                  {hero.eyebrow}
                </p>
                <h1 className="t-h1 mt-6 text-white">
                  <Words text={hero.titleLead} />{" "}
                  <Words
                    text={hero.titleAccent}
                    start={wordCount(hero.titleLead)}
                    gradient
                  />
                </h1>
                <p
                  className="t-lede measure mt-6 text-slate-300"
                  style={{ animation: "hero-in 800ms var(--ease-out-expo) 300ms both" }}
                >
                  {hero.lede}
                </p>
              </div>

              {/* 1. Who you'll meet ---------------------------------------- */}
              <section
                data-section="host"
                aria-labelledby="host-heading"
                style={{ animation: "hero-in 800ms var(--ease-out-expo) 380ms both" }}
              >
                <h2 id="host-heading" className="text-[0.9375rem] font-semibold text-slate-300">
                  {host.label}
                </h2>
                <div className="card-shape mt-3 flex gap-5 border border-white/10 bg-white/[0.05] p-5 backdrop-blur-sm sm:p-6">
                  <Avatar name={host.name} photo={host.photo} size={76} />
                  <div className="min-w-0">
                    <span className="mb-2.5 inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-[0.6875rem] font-semibold tracking-wide text-amber-300 uppercase">
                      {host.placeholderLabel}
                    </span>
                    <p className="t-h3 text-white">{host.name}</p>
                    <p className="mt-1 text-[0.875rem] text-slate-300">
                      {host.role}, TruHu
                    </p>
                    <p className="mt-3 font-display text-[1.0625rem] leading-snug font-semibold text-white">
                      &ldquo;{host.line}&rdquo;
                    </p>
                    <p className="t-caption mt-2 text-slate-300">{host.credential}</p>
                  </div>
                </div>
              </section>

              {/* 2. What you'll get out of it ------------------------------ */}
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
                <ul className="mt-4 space-y-3.5">
                  {outcomes.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-green-500/15 text-green-400">
                        <Check weight="bold" className="size-3.5" />
                      </span>
                      <span className="text-[1rem] leading-relaxed text-white">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  {outcomes.format.map((item, i) => {
                    const Icon = FORMAT_ICONS[i] ?? Clock;
                    return (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[0.8125rem] font-semibold text-white"
                      >
                        <Icon aria-hidden className="size-3.5 text-blue-400" />
                        {item}
                      </span>
                    );
                  })}
                </div>
                <p className="mt-4 text-[0.9375rem] text-slate-300">{outcomes.notIt}</p>
              </section>
            </div>

            <div className="space-y-4">
              {/* 4. The calendar ------------------------------------------- */}
              <div className="demo-in">
                <BookingWidget copy={booking} hostName={host.name} hostPhoto={host.photo} />
              </div>

              {/* 3. Proof, directly under the calendar --------------------- */}
              <section
                data-section="proof"
                aria-label={proof.label}
                style={{ animation: "hero-in 800ms var(--ease-out-expo) 520ms both" }}
              >
                <figure className="card-shape border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm sm:p-7">
                  <span
                    aria-hidden
                    className="block font-display text-5xl leading-[0.5] text-green-400"
                  >
                    &ldquo;
                  </span>
                  <blockquote className="mt-3 font-display text-[1.125rem] leading-relaxed font-medium text-white">
                    <Quote text={proof.quote} accent={proof.accent} />
                  </blockquote>
                  <figcaption className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
                    <Avatar name={proof.name} photo={proof.photo} size={46} />
                    <div className="min-w-[11rem] flex-1">
                      <p className="font-semibold text-white">{proof.name}</p>
                      <p className="text-[0.8125rem] leading-snug text-slate-300">
                        {proof.role} · {proof.agency}
                      </p>
                    </div>
                    <span className="rounded-full bg-green-500/15 px-3 py-1 text-[0.75rem] font-semibold text-green-400">
                      {proof.result}
                    </span>
                  </figcaption>
                </figure>

                <dl className="mt-4 grid grid-cols-2 gap-4">
                  {proof.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="card-shape-sm border border-white/10 bg-white/[0.03] px-5 py-4"
                    >
                      <dd className="t-h2 t-gradient tabular">{stat.value}</dd>
                      <dt className="mt-1.5 text-[0.875rem] leading-snug text-slate-300">
                        {stat.label}
                      </dt>
                    </div>
                  ))}
                </dl>
                <p className="t-caption mt-2.5 text-slate-400">Source: {proof.statsSource}</p>
              </section>
            </div>
          </div>
        </Container>
      </Section>

      {/* How the ten minutes go -------------------------------------------- */}
      <Section tone="paper" labelledBy="agenda-heading">
        <Container>
          <div data-section="agenda">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 id="agenda-heading" className="t-h2 reveal">
                {agenda.title}
              </h2>
              <CTAButton href="#calendar" variant="secondary">
                {booking.title}
              </CTAButton>
            </div>
            <ol className="stagger mt-12 grid gap-x-10 gap-y-10 md:grid-cols-3">
              {agenda.steps.map((step, i) => (
                <li key={step.time} style={stagger(i)} className="border-t border-line pt-6">
                  <p className="t-eyebrow tabular text-green-700">{step.time}</p>
                  <h3 className="t-h3 mt-4">{step.title}</h3>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-slate-600">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>
    </>
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
