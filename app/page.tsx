import type { Metadata } from "next";
import { DeliveryProof } from "@/components/demos/DeliveryProof";
import { FeatureShowcase } from "@/components/demos/FeatureShowcase";
import { GuideBuilder } from "@/components/demos/GuideBuilder";
import { LogoMarquee } from "@/components/demos/LogoMarquee";
import { CTAButton, TextLink } from "@/components/ui/CTAButton";
import { SpotlightCard } from "@/components/ui/Spotlight";
import { StatBand } from "@/components/ui/Stat";
import { Words, wordCount } from "@/components/ui/Words";
import {
  Container,
  DrawnRule,
  Eyebrow,
  Section,
  SectionHeading,
  stagger,
} from "@/components/ui/primitives";
import {
  ADVISOR,
  CLOSING,
  HERO,
  QUOTE,
  RESOURCES,
  RESULTS,
  WORKFORCE,
} from "@/lib/content";

export const metadata: Metadata = {
  description: HERO.lede,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      {/* Hero -------------------------------------------------------------
          One screen: the argument on the left, the product running on the
          right. The height is capped to the viewport below the header so the
          fold lands exactly at the section edge. */}
      <Section
        tone="dark"
        ambient
        pointer
        size="none"
        className="flex min-h-[calc(100svh-4rem)] items-center py-14 lg:py-10"
      >
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-14">
            <div>
              <p
                className="t-eyebrow inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-blue-400 backdrop-blur-sm"
                style={{ animation: "hero-in 700ms var(--ease-out-expo) both" }}
              >
                <span className="size-1.5 rounded-full bg-green-400 anim-pulse" />
                {HERO.eyebrow}
              </p>

              <h1 className="t-h1 mt-6 text-white">
                <Words text={HERO.titleLead} />{" "}
                <span className="t-gradient">
                  <Words
                    text={HERO.titleAccent}
                    start={wordCount(HERO.titleLead)}
                  />
                </span>
              </h1>

              <div className="hero-seq">
                <p className="t-lede measure mt-6 text-slate-300">{HERO.lede}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <CTAButton href={HERO.primaryCta.href} size="lg">
                    {HERO.primaryCta.label}
                  </CTAButton>
                  <CTAButton
                    href={HERO.secondaryCta.href}
                    variant="onDark"
                    size="lg"
                  >
                    {HERO.secondaryCta.label}
                  </CTAButton>
                </div>
                <p className="t-caption mt-6 text-white/45">{HERO.note}</p>
              </div>
            </div>

            <div className="demo-in min-w-0">
              <GuideBuilder compact />
            </div>
          </div>
        </Container>
      </Section>

      {/* Trust rail ------------------------------------------------------ */}
      <Section tone="white" size="tight" labelledBy="trust-heading">
        <Container>
          <h2
            id="trust-heading"
            className="t-eyebrow mb-8 text-center text-slate-400"
          >
            Trusted by leading organizations
          </h2>
        </Container>
        <LogoMarquee />
      </Section>

      {/* Advisor --------------------------------------------------------- */}
      <Section tone="paper" id="advisor" ambient labelledBy="advisor-heading">
        <Container>
          <div className="reveal flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              id="advisor-heading"
              eyebrow={ADVISOR.eyebrow}
              title={ADVISOR.title}
              lede={ADVISOR.lede}
            />
            <TextLink href={ADVISOR.cta.href}>{ADVISOR.cta.label}</TextLink>
          </div>

          <div className="reveal-wipe mt-14">
            <FeatureShowcase />
          </div>
        </Container>
      </Section>

      {/* Results --------------------------------------------------------- */}
      <Section tone="dark" id="results" ambient labelledBy="results-heading">
        <Container>
          <SectionHeading
            id="results-heading"
            eyebrow={RESULTS.eyebrow}
            tone="light"
            align="center"
            title={
              <>
                {RESULTS.titleLead}{" "}
                <span className="t-gradient">{RESULTS.titleAccent}</span>
              </>
            }
            lede={RESULTS.lede}
          />

          <div className="reveal mt-16 lg:mt-20">
            <StatBand stats={RESULTS.stats} />
          </div>

          <DrawnRule tone="light" className="mt-16" />

          <ul className="stagger mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {RESULTS.facts.map((fact, i) => (
              <li key={fact.label} style={stagger(i)}>
                <p className="t-h1 text-green-400">{fact.value}</p>
                <p className="t-caption mt-2 text-slate-300">{fact.label}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Testimonial ----------------------------------------------------- */}
      <Section tone="white">
        <Container>
          <figure className="reveal mx-auto max-w-3xl text-center">
            <span
              aria-hidden
              className="t-display block leading-none text-blue-100 select-none"
            >
              &ldquo;
            </span>
            <blockquote className="t-h2 -mt-6">{QUOTE.text}</blockquote>
            <figcaption className="mt-8 text-[0.9375rem] text-slate-600">
              <span className="font-bold text-ink">{QUOTE.name}</span>
              <span className="mx-2 text-slate-400">·</span>
              {QUOTE.role}
            </figcaption>
          </figure>
        </Container>
      </Section>

      {/* Workforce ------------------------------------------------------- */}
      <Section tone="paper" id="workforce" labelledBy="workforce-heading">
        <Container>
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-20">
            <div className="reveal">
              <SectionHeading
                id="workforce-heading"
                eyebrow={WORKFORCE.eyebrow}
                title={WORKFORCE.title}
                lede={WORKFORCE.lede}
              />
              <ul className="stagger mt-10 space-y-5">
                {WORKFORCE.points.map((point, i) => (
                  <li key={point.name} style={stagger(i)} className="flex gap-4">
                    <span
                      aria-hidden
                      className="mt-2 size-2 shrink-0 rounded-full bg-green-500"
                    />
                    <span>
                      <span className="t-h4 block">{point.name}</span>
                      <span className="mt-1 block text-[0.9375rem] leading-relaxed text-slate-600">
                        {point.blurb}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-10">
                <TextLink href={WORKFORCE.cta.href}>{WORKFORCE.cta.label}</TextLink>
              </p>
            </div>

            <div className="reveal-tilt min-w-0">
              <DeliveryProof />
            </div>
          </div>
        </Container>
      </Section>

      {/* Resources ------------------------------------------------------- */}
      <Section tone="white" id="resources" labelledBy="resources-heading">
        <Container>
          <SectionHeading
            id="resources-heading"
            eyebrow={RESOURCES.eyebrow}
            title={RESOURCES.title}
            className="reveal"
          />

          <ul className="stagger mt-12 grid gap-5 md:grid-cols-3">
            {RESOURCES.items.map((item, i) => (
              <SpotlightCard
                key={item.title}
                as="li"
                style={stagger(i)}
                className="flex flex-col"
              >
                <Eyebrow>{item.kind}</Eyebrow>
                <h3 className="t-h3 mt-4">{item.title}</h3>
                <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-slate-600">
                  {item.blurb}
                </p>
              </SpotlightCard>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Close ----------------------------------------------------------- */}
      <Section tone="dark" ambient pointer size="loose">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="t-h1 text-white">
              {CLOSING.titleLead}{" "}
              <span className="t-gradient">{CLOSING.titleAccent}</span>
            </h2>
            <p className="t-lede measure mx-auto mt-7 text-slate-300">
              {CLOSING.lede}
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <CTAButton href={CLOSING.primaryCta.href} size="lg">
                {CLOSING.primaryCta.label}
              </CTAButton>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
