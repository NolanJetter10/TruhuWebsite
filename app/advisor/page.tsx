import type { Metadata } from "next";
import { GuideBuilder } from "@/components/demos/GuideBuilder";
import { CloseCta } from "@/components/layout/CloseCta";
import { CTAButton } from "@/components/ui/CTAButton";
import { SpotlightCard } from "@/components/ui/Spotlight";
import { Words, wordCount } from "@/components/ui/Words";
import {
  Card,
  Container,
  Section,
  SectionHeading,
  stagger,
} from "@/components/ui/primitives";
import { ADVISOR_PAGE } from "@/lib/content";

const { hero, steps, materials, trust, book, comparison, close } = ADVISOR_PAGE;

export const metadata: Metadata = {
  title: "TruHu Advisor",
  description: hero.lede,
  alternates: { canonical: "/advisor" },
};

export default function AdvisorPage() {
  return (
    <>
      {/* Hero ------------------------------------------------------------- */}
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
                <span className="t-gradient">
                  <Words text={hero.titleAccent} start={wordCount(hero.titleLead)} />
                </span>
              </h1>

              <div className="hero-seq">
                <p className="t-lede measure mt-6 text-slate-300">{hero.lede}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <CTAButton href={hero.primaryCta.href} size="lg">
                    {hero.primaryCta.label}
                  </CTAButton>
                  <CTAButton href={hero.secondaryCta.href} variant="onDark" size="lg">
                    {hero.secondaryCta.label}
                  </CTAButton>
                </div>
                <p className="t-caption mt-6 text-white/45">{hero.note}</p>
              </div>
            </div>

            <div className="demo-in min-w-0">
              <GuideBuilder />
            </div>
          </div>
        </Container>
      </Section>

      {/* How it works ------------------------------------------------------ */}
      <Section tone="paper" ambient labelledBy="steps-heading">
        <Container>
          <SectionHeading
            id="steps-heading"
            eyebrow={steps.eyebrow}
            title={steps.title}
            lede={steps.lede}
            className="reveal"
          />

          <ol className="stagger mt-12 max-w-3xl space-y-5">
            {steps.items.map((step, i) => (
              <Card as="li" key={step.name} style={stagger(i)} className="flex gap-5">
                <span
                  aria-hidden
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-green-500 text-[0.875rem] font-bold text-ink-950"
                >
                  {i + 1}
                </span>
                <span>
                  <h3 className="t-h4">{step.name}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-slate-600">
                    {step.body}
                  </p>
                </span>
              </Card>
            ))}
          </ol>
        </Container>
      </Section>

      {/* What it produces -------------------------------------------------- */}
      <Section tone="white" id="materials" labelledBy="materials-heading">
        <Container>
          <SectionHeading
            id="materials-heading"
            eyebrow={materials.eyebrow}
            align="center"
            title={materials.title}
            className="reveal"
          />

          <ul className="stagger mt-12 grid gap-5 md:grid-cols-3">
            {materials.items.map((item, i) => (
              <SpotlightCard key={item.name} as="li" style={stagger(i)}>
                <h3 className="t-h4">{item.name}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-slate-600">
                  {item.blurb}
                </p>
              </SpotlightCard>
            ))}
          </ul>

          <p className="reveal t-caption mt-8 text-center text-slate-500">
            {materials.caption}
          </p>
        </Container>
      </Section>

      {/* Why the output holds up ------------------------------------------- */}
      <Section tone="dark" ambient labelledBy="trust-heading">
        <Container>
          <SectionHeading
            id="trust-heading"
            eyebrow={trust.eyebrow}
            tone="light"
            title={trust.title}
            className="reveal"
          />

          <div className="stagger mt-14 grid gap-x-14 gap-y-12 sm:grid-cols-2">
            {trust.items.map((item, i) => (
              <div key={item.name} style={stagger(i)}>
                <h3 className="t-h4 text-white">{item.name}</h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-slate-300">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Across the book --------------------------------------------------- */}
      <Section tone="paper" labelledBy="book-heading">
        <Container>
          <div className="reveal mx-auto max-w-3xl">
            <SectionHeading
              id="book-heading"
              eyebrow={book.eyebrow}
              title={book.title}
            />
            {book.body.map((paragraph) => (
              <p
                key={paragraph}
                className="measure mt-6 text-[1.0625rem] leading-relaxed text-slate-600"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </Container>
      </Section>

      {/* The comparison that matters --------------------------------------- */}
      <Section tone="white" labelledBy="comparison-heading">
        <Container>
          <div className="reveal mx-auto max-w-3xl">
            <SectionHeading
              id="comparison-heading"
              eyebrow={comparison.eyebrow}
              title={comparison.title}
            />
            <p className="measure mt-6 text-[1.0625rem] leading-relaxed text-slate-600">
              {comparison.body}
            </p>
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
