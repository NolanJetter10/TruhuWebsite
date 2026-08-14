import type { Metadata } from "next";
import { LeafMotif } from "@/components/art/Leaf";
import { ResourceForm } from "@/components/conversion/forms";
import {
  Container,
  Eyebrow,
  Chip,
  Section,
  SectionHeading,
  TextLink,
} from "@/components/ui/primitives";
import { ResourceCard } from "@/components/proof/proof";
import { RESOURCES } from "@/lib/content";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Original research about the brokerage's own year, plus writing on what a communication platform can honestly measure and what a broker should ask an AI vendor.",
  alternates: { canonical: "/resources" },
};

export default function ResourcesPage() {
  const featured = RESOURCES.find((r) => r.featured);
  const rest = RESOURCES.filter((r) => !r.featured);

  return (
    <>
      <Section tone="navy" className="overflow-hidden">
        <LeafMotif className="-top-52 -right-40 h-[600px] w-[600px]" opacity={0.06} />
        <Container>
          <div className="hero-seq max-w-3xl">
            <Eyebrow tone="light">Resources</Eyebrow>
            <h1 className="t-display mt-5 text-white">
              Writing about the broker&rsquo;s year, not about ours.
            </h1>
            <p className="measure mt-7 t-lede text-tint-100">
              This category publishes a great deal about employees and almost
              nothing about the account manager&rsquo;s October. That seemed like
              an odd gap to leave, so we have started filling it.
            </p>
          </div>
        </Container>
      </Section>

      {featured ? (
        <Section tone="white">
          <Container>
            <div className="card-shape-lg grid gap-10 border border-border-200 bg-section p-7 sm:p-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <Chip tone="accent">{featured.kind}</Chip>
                  <span className="t-caption text-grey-500">
                    {featured.readingTime} read
                  </span>
                </div>
                <h2 className="t-h2 mt-5">{featured.title}</h2>
                <p className="measure mt-5 t-lede text-grey-700">
                  {featured.dek}
                </p>
                <ul className="mt-7 space-y-2.5">
                  {[
                    "Nine deliverables, documented end to end.",
                    "Running orders and exhibit inventories as they actually exist.",
                    "The compliance calendar, and what sits on it in each quarter.",
                    "Every figure carries its source and date. Vendor-sourced numbers are labelled as such.",
                  ].map((line) => (
                    <li key={line} className="flex gap-3 text-[0.9375rem] text-grey-700">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-green-500" aria-hidden />
                      {line}
                    </li>
                  ))}
                </ul>
                <p className="mt-7">
                  <TextLink href={`/resources/${featured.slug}`}>
                    Read the introduction first
                  </TextLink>
                </p>
              </div>

              <div className="card-shape border border-border-200 bg-white p-6 sm:p-7 lg:self-start">
                <p className="t-h4">Get the full research</p>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-grey-700">
                  One email address, one PDF, no drip campaign. If it is not
                  useful to you, we would rather you told us than unsubscribed.
                </p>
                <div className="mt-6">
                  <ResourceForm resource={featured.title} />
                </div>
              </div>
            </div>
          </Container>
        </Section>
      ) : null}

      <Section tone="section" labelledBy="all-heading">
        <Container>
          <SectionHeading id="all-heading" eyebrow="Everything else" title="More reading." />
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {rest.map((resource) => (
              <li key={resource.slug} className="h-full">
                <ResourceCard resource={resource} />
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
}
