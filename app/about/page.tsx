import type { Metadata } from "next";
import { LeafMotif } from "@/components/art/Leaf";
import { CTAButton } from "@/components/ui/CTAButton";
import {
  Card,
  Container,
  Eyebrow,
  Section,
  SectionHeading,
  TextLink,
  stagger,
} from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "About",
  description:
    "Truly Human Technologies builds two products for benefits brokers. This page explains how the company decides what to claim, and why that shows up everywhere on this site.",
  alternates: { canonical: "/about" },
};

/** Every principle below is checkable against this website. That is the point. */
const PRINCIPLES = [
  {
    title: "Every number carries its source",
    body: "The component that renders a statistic cannot render one without a source note. Structural, not editorial, because editorial discipline erodes.",
    check: "Look under any number here.",
  },
  {
    title: "No stock portrait on a named person",
    body: "A reader who recognises a purchased photograph discounts the quote, and then every other quote. You get initials and a firm instead.",
    check: "Every testimonial uses a monogram.",
  },
  {
    title: "The roadmap is public and lives in one file",
    body: "Status comes from a single config, so a workflow cannot say Live in one place and Roadmap in another. And no ship dates.",
    check: "See the workflow map.",
  },
  {
    title: "We name what we do not build",
    body: "Quoting. Ben-admin builds. Billing. A vendor who says everything is not believed, and it saves you a discovery call.",
    check: "Published on the workflow map.",
  },
  {
    title: "No legal claim without a citation",
    body: "The compliance argument is the easiest one to run in this category and the easiest to get wrong. One page exists purely to list what we decline to say.",
    check: "Read the acknowledgement page.",
  },
  {
    title: "We report what can be measured",
    body: "Delivered, failed, clicked, replied, acknowledged. No open rates. Smaller numbers, but they mean something.",
    check: "It is in the product, not just the marketing.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Section tone="navy">
        <LeafMotif className="-top-44 -right-32 h-[660px] w-[360px]" opacity={0.08} />
        <Container>
          <div className="hero-seq max-w-3xl">
            <Eyebrow tone="light">About</Eyebrow>
            <h1 className="t-display mt-5 text-white">
              We are called Truly Human Technologies, which turns out to be{" "}
              <span className="text-green-500">a constraint as much as a name.</span>
            </h1>
            <p className="t-lede measure mt-7 text-muted-300">
              Advisor produces the client-facing work a brokerage already makes.
              Workforce gets it to the employees who never had a work email. The
              people at the far end are the ones this industry is nominally
              serving and structurally missing.
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="white" labelledBy="principles-heading">
        <Container>
          <SectionHeading
            id="principles-heading"
            eyebrow="How we decide what to claim"
            title="Six Rules, Each One Checkable on This Site"
            lede="Not values on a wall. They are why some sections here are shorter than our competitors'."
          />
          <ul className="stagger mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((principle, i) => (
              <Card as="li" key={principle.title} style={stagger(i)} className="flex flex-col">
                <span className="t-caption font-bold text-blue-500 tabular">
                  0{i + 1}
                </span>
                <h3 className="t-h4 mt-2">{principle.title}</h3>
                <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-grey-700">
                  {principle.body}
                </p>
                <p className="t-caption mt-5 border-t border-border-200 pt-4 text-grey-500">
                  {principle.check}
                </p>
              </Card>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="section" labelledBy="careers-heading">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <SectionHeading
              id="careers-heading"
              eyebrow="Careers"
              title="We Hire People Who Would Rather Ship a Smaller True Claim"
              lede="If those six read as constraints you would enjoy working inside rather than around, we should talk."
            />
            <div className="lg:self-center">
              <CTAButton href="/contact" variant="secondary">
                Get in touch
              </CTAButton>
              <p className="mt-6 text-[0.9375rem] text-grey-700">
                Curious how the products fit together?{" "}
                <TextLink href="/platform">Read the platform page</TextLink>
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="navy" size="loose">
        <LeafMotif className="-bottom-32 -left-32 h-[580px] w-[320px]" opacity={0.08} flip />
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="t-h1 text-white">
              The people who need this most are{" "}
              <span className="text-green-500">the hardest to reach.</span>
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
