import type { Metadata } from "next";
import Image from "next/image";
import { GuideBeforeAfter } from "@/components/demos/GuideBeforeAfter";
import { IntakePipeline } from "@/components/demos/IntakePipeline";
import { OutputShowcase } from "@/components/demos/OutputShowcase";
import { ProductWalkthrough } from "@/components/demos/ProductWalkthrough";
import { CloseCta } from "@/components/layout/CloseCta";
import { CTAButton, TextLink } from "@/components/ui/CTAButton";
import { Faq } from "@/components/ui/Faq";
import { SlideIn } from "@/components/ui/SlideIn";
import { SpotlightCard } from "@/components/ui/Spotlight";
import { StatBand } from "@/components/ui/Stat";
import { Words, wordCount } from "@/components/ui/Words";
import {
  Container,
  DrawnRule,
  Section,
  SectionHeading,
} from "@/components/ui/primitives";
import { ADVISOR_PAGE } from "@/lib/content";
import advisorDashboard from "@/public/images/advisor-dashboard.jpg";

const { hero, problem, pipeline, outputs, features, results, faq, close } =
  ADVISOR_PAGE;

export const metadata: Metadata = {
  title: "TruHu Advisor",
  description: hero.lede,
  alternates: { canonical: "/advisor" },
};

export default function AdvisorPage() {
  return (
    <>
      {/* Hero — the Advisor walkthrough beside the live site's copy. -------- */}
      <Section tone="dark" ambient pointer>
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
            <div>
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

              <div className="hero-seq">
                <p className="t-lede measure mt-6 text-slate-300">{hero.lede}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <CTAButton href={hero.primaryCta.href} size="lg">
                    {hero.primaryCta.label}
                  </CTAButton>
                </div>
                <p className="t-caption mt-6 text-white/45">{hero.note}</p>
              </div>
            </div>

            <div className="demo-in min-w-0">
              <ProductWalkthrough />
            </div>
          </div>
        </Container>
      </Section>

      {/* The problem -------------------------------------------------------
          The picture is the argument: the PDF most clients get today,
          scrolled through, then the guide TruHu builds in its place. */}
      <Section tone="paper" labelledBy="problem-heading">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="reveal-tilt relative min-w-0">
              <GuideBeforeAfter />
            </div>

            <div className="reveal">
              <h2 id="problem-heading" className="t-h2">
                {problem.title.lead}{" "}
                <em className="text-green-700">{problem.title.emphasisA}</em>{" "}
                {problem.title.mid} <em>{problem.title.emphasisB}</em>
              </h2>
              {problem.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="measure mt-5 text-[1.0625rem] leading-relaxed text-slate-600"
                >
                  {paragraph}
                </p>
              ))}
              <p className="t-h3 mt-8 text-green-700 italic">{problem.kicker}</p>
            </div>
          </div>
        </Container>
      </Section>

      {/* How it works ------------------------------------------------------
          The answer to "until now": a folder of a client's documents goes
          in as it is, is sorted and read, and comes out as finished
          materials in the client's brand. Tight, so the heading and the
          whole pipeline fit on one screen. */}
      <Section tone="dark" ambient size="tight" labelledBy="pipeline-heading">
        <Container>
          <SectionHeading
            id="pipeline-heading"
            tone="light"
            align="center"
            title={
              <>
                {pipeline.titleLead}{" "}
                <span className="t-gradient">{pipeline.titleAccent}</span>
              </>
            }
            // Wider than the usual heading so the title holds to two lines.
            className="reveal max-w-5xl!"
          />

          <div className="reveal mt-10">
            <IntakePipeline />
          </div>
        </Container>
      </Section>

      {/* What it builds ----------------------------------------------------
          Every output the pipeline ends in, one tab each, shown as the real
          deliverable for a sample employer. Wider than the usual container,
          since the deliverable is the point and the copy is one paragraph. */}
      <Section tone="white" id="outputs" labelledBy="outputs-heading">
        <Container className="max-w-[1320px]!">
          <SectionHeading
            id="outputs-heading"
            align="center"
            title={
              <>
                {outputs.titleLead}{" "}
                <span className="t-gradient-dark">{outputs.titleAccent}</span>
              </>
            }
            // Wide enough to hold the title to two lines.
            className="reveal max-w-5xl!"
          />

          <div className="reveal mt-8">
            <OutputShowcase />
          </div>
        </Container>
      </Section>

      {/* We power the experience -------------------------------------------
          The outputs tour showed what the client gets; this is what Advisor
          does for the broker. */}
      <Section tone="dark" ambient labelledBy="features-heading">
        <Container>
          {/* Heading beside the dashboard rather than stacked above it: the
              section carries six cards and a stat band underneath, and
              running the two full width put the cards well below the fold. */}
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
            <SectionHeading
              id="features-heading"
              tone="light"
              title={
                <>
                  {features.titleLead}{" "}
                  <span className="t-gradient">{features.titleAccent}</span>
                </>
              }
              lede={features.lede}
              className="reveal"
            />

            <div className="reveal-tilt relative min-w-0">
              <Image
                src={advisorDashboard}
                alt={features.dashboard.alt}
                className="card-shape-lg h-auto w-full object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
              <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                {features.dashboard.chips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center gap-2 rounded-full bg-ink-950/80 px-3 py-1.5 text-[0.8125rem] font-semibold text-white backdrop-blur-sm"
                  >
                    <span
                      aria-hidden
                      className="size-1.5 rounded-full bg-green-400"
                    />
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* What the broker gets: building and shaping the work slides in
              from the left, then what every deliverable comes with follows
              from the right, a beat behind. */}
          <SlideIn className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.items.map((item) => (
              <SpotlightCard key={item.name} as="li" tone="dark">
                <h3 className="t-h4 text-white">{item.name}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-slate-300">
                  {item.body}
                </p>
              </SpotlightCard>
            ))}
          </SlideIn>

          <DrawnRule tone="light" className="mt-16" />

          <div className="mt-12" aria-label={results.eyebrow}>
            <StatBand stats={results.stats} />
          </div>
        </Container>
      </Section>

      {/* FAQ ---------------------------------------------------------------
          Advisor's own questions, answered here instead of on a redirect. One
          flat two-column list with the rows closed, so the whole set fits in
          about half a screen; the grouped version lives on /faq. */}
      <Section tone="white" id="faq" labelledBy="faq-heading">
        <Container>
          <div className="reveal flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <SectionHeading id="faq-heading" title={faq.title} />
            <TextLink href={faq.more.href}>{faq.more.label}</TextLink>
          </div>

          <div className="mt-10 lg:mt-12">
            <Faq categories={faq.categories} compact />
          </div>
        </Container>
      </Section>

      {/* Close ------------------------------------------------------------- */}
      <CloseCta
        titleLead={close.titleLead}
        titleAccent={close.titleAccent}
        lede={close.lede}
        cta={close.primaryCta}
      />
    </>
  );
}
