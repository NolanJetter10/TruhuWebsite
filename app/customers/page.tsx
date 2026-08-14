import type { Metadata } from "next";
import { LeafMotif } from "@/components/art/Leaf";
import { CTAButton } from "@/components/ui/CTAButton";
import {
  Container,
  Eyebrow,
  Section,
  SourceNote,
  stagger,
} from "@/components/ui/primitives";
import { CaseStudyCard, LogoWall, Testimonial } from "@/components/proof/proof";
import { CASE_STUDIES, QUOTE_OPS } from "@/lib/content";

export const metadata: Metadata = {
  title: "Customers",
  description:
    "Named organisations, defined metrics and stated periods. Every number says what it measured, across whom, and when.",
  alternates: { canonical: "/customers" },
};

export default function CustomersPage() {
  return (
    <>
      <Section tone="navy">
        <LeafMotif className="-top-44 -right-32 h-[620px] w-[340px]" opacity={0.08} />
        <Container>
          <div className="hero-seq max-w-3xl">
            <Eyebrow tone="light">Customers</Eyebrow>
            <h1 className="t-display mt-5 text-white">
              Named organisations.{" "}
              <span className="text-green-500">Defined metrics.</span>
            </h1>
            <p className="t-lede measure mt-7 text-muted-300">
              Where we cannot say what a number measured, across whom and when,
              we do not publish it. Which is why there are fewer here than you
              might expect.
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="white">
        <Container>
          <ul className="stagger grid gap-5 md:grid-cols-2">
            {CASE_STUDIES.map((study, i) => (
              <li key={study.slug} className="h-full" style={stagger(i)}>
                <CaseStudyCard study={study} />
              </li>
            ))}
          </ul>
          <SourceNote className="mt-8">
            Published with customer permission. More are in production and will
            appear when the organisation has signed off on the numbers.
          </SourceNote>
        </Container>
      </Section>

      <Section tone="section" size="tight">
        <Container>
          <LogoWall />
        </Container>
      </Section>

      <Section tone="white">
        <Container>
          <div className="reveal">
            <Testimonial quote={QUOTE_OPS} />
          </div>
        </Container>
      </Section>

      <Section tone="navy" size="loose">
        <LeafMotif className="-bottom-32 -left-32 h-[580px] w-[320px]" opacity={0.08} flip />
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="t-h1 text-white">
              The most useful case study is{" "}
              <span className="text-green-500">the one on your own client.</span>
            </h2>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <CTAButton href="/contact" size="lg">
                Book a demo
              </CTAButton>
              <CTAButton href="/resources" variant="onNavySecondary" size="lg">
                Read the research
              </CTAButton>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
