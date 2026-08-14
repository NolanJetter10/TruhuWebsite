import type { Metadata } from "next";
import Link from "next/link";
import { DeliveryProof } from "@/components/demos/DeliveryProof";
import { FeatureShowcase } from "@/components/demos/FeatureShowcase";
import { GuideBuilder } from "@/components/demos/GuideBuilder";
import { LogoMarquee } from "@/components/demos/LogoMarquee";
import { CloseCta } from "@/components/layout/CloseCta";
import { CTAButton, TextLink } from "@/components/ui/CTAButton";
import { SpotlightCard } from "@/components/ui/Spotlight";
import { Words } from "@/components/ui/Words";
import {
  Card,
  Container,
  DrawnRule,
  Eyebrow,
  Section,
  SectionHeading,
  stagger,
} from "@/components/ui/primitives";
import {
  ADVISOR,
  CALENDAR,
  CLOSING,
  HERO,
  QUOTE,
  RESOURCES,
  STACK,
  WORKFORCE,
} from "@/lib/content";
import { RESOURCES_LIBRARY } from "@/lib/resources";

/** The three newest entries, whatever kind they are. */
const LATEST_RESOURCES = [...RESOURCES_LIBRARY]
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 3);

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
                <Words text={HERO.title} />
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

      {/* The renewal calendar -------------------------------------------- */}
      <Section tone="dark" id="calendar" ambient labelledBy="calendar-heading">
        <Container>
          <SectionHeading
            id="calendar-heading"
            eyebrow={CALENDAR.eyebrow}
            tone="light"
            align="center"
            title={
              <>
                {CALENDAR.titleLead}{" "}
                <span className="t-gradient">{CALENDAR.titleAccent}</span>
              </>
            }
            lede={CALENDAR.lede}
          />

          <DrawnRule tone="light" className="mt-16" />

          <ul className="stagger mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {CALENDAR.steps.map((step, i) => (
              <li key={step.label} style={stagger(i)}>
                <p className="t-h1 text-green-400">{step.value}</p>
                <p className="t-caption mt-2 text-slate-300">{step.label}</p>
              </li>
            ))}
          </ul>

          <p className="reveal t-h3 mx-auto mt-16 max-w-3xl text-center text-white">
            {CALENDAR.noteLead}{" "}
            <span className="t-gradient">{CALENDAR.noteAccent}</span>
          </p>
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
              <p className="t-caption mt-5 text-slate-400">{WORKFORCE.footnote}</p>
            </div>

            <div className="reveal-tilt min-w-0">
              <DeliveryProof />
            </div>
          </div>
        </Container>
      </Section>

      {/* Where TruHu sits ------------------------------------------------ */}
      <Section tone="white" id="stack" labelledBy="stack-heading">
        <Container>
          <SectionHeading
            id="stack-heading"
            eyebrow={STACK.eyebrow}
            align="center"
            title={STACK.title}
            lede={STACK.lede}
            className="reveal"
          />

          <ul className="stagger mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STACK.starts.map((item, i) => (
              <Card as="li" key={item} tone="paper" style={stagger(i)} className="text-center">
                <p className="t-h4">{item}</p>
              </Card>
            ))}
          </ul>

          <p className="reveal t-caption mt-8 text-center text-slate-500">
            {STACK.caption}
          </p>
        </Container>
      </Section>

      {/* Resources ------------------------------------------------------- */}
      <Section tone="paper" id="resources" labelledBy="resources-heading">
        <Container>
          <SectionHeading
            id="resources-heading"
            eyebrow={RESOURCES.eyebrow}
            title={RESOURCES.title}
            className="reveal"
          />

          {/* Driven by the library itself, so the home page cannot drift from
              what /resources actually publishes. */}
          <ul className="stagger mt-12 grid gap-5 md:grid-cols-3">
            {LATEST_RESOURCES.map((item, i) => (
              <SpotlightCard
                key={item.slug}
                as="li"
                style={stagger(i)}
                className="flex flex-col"
              >
                <Eyebrow>{item.kind === "case" ? "Case study" : "Blog"}</Eyebrow>
                <h3 className="t-h3 mt-4">
                  <Link
                    href={`/resources/${item.slug}`}
                    className="after:absolute after:inset-0"
                  >
                    {item.title}
                  </Link>
                </h3>
                <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-slate-600">
                  {item.dek}
                </p>
              </SpotlightCard>
            ))}
          </ul>

          <div className="mt-10">
            <TextLink href="/resources">See all resources</TextLink>
          </div>
        </Container>
      </Section>

      {/* Close ----------------------------------------------------------- */}
      <CloseCta
        titleLead={CLOSING.titleLead}
        titleAccent={CLOSING.titleAccent}
        lede={CLOSING.lede}
        cta={CLOSING.primaryCta}
      />
    </>
  );
}
