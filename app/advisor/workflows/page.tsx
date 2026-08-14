import type { Metadata } from "next";
import Link from "next/link";
import { X } from "@phosphor-icons/react/ssr";
import { BrokerCalendar } from "@/components/art/BrokerCalendar";
import { LeafMotif } from "@/components/art/Leaf";
import { EarlyAccessForm } from "@/components/conversion/forms";
import { CTAButton } from "@/components/ui/CTAButton";
import {
  Card,
  Container,
  Eyebrow,
  Section,
  SectionHeading,
  StatusPill,
  TextLink,
  stagger,
} from "@/components/ui/primitives";
import { NOT_IN_SCOPE, WORKFLOWS } from "@/lib/workflows";

export const metadata: Metadata = {
  title: "The Workflow Map",
  description:
    "A brokerage produces the same documents every year on the same calendar, and almost every one is still hand-built. Which ones TruHu builds, which are on the roadmap, and the three we do not touch.",
  alternates: { canonical: "/advisor/workflows" },
};

export default function WorkflowsPage() {
  return (
    <>
      <Section tone="navy">
        <LeafMotif className="-top-44 -right-32 h-[700px] w-[380px]" opacity={0.08} />
        <Container>
          <div className="hero-seq max-w-3xl">
            <Eyebrow tone="light">The workflow map</Eyebrow>
            <h1 className="t-display mt-5 text-white">
              Same documents every year.{" "}
              <span className="text-green-500">All still made by hand.</span>
            </h1>
            <p className="t-lede measure mt-7 text-muted-300">
              The renewal deck, the enrollment guide, the compliance packet, the
              stewardship report. Advisor is taking them one at a time.
            </p>
          </div>
        </Container>
      </Section>

      {/* The calendar ----------------------------------------------------- */}
      <Section tone="white" labelledBy="calendar-heading">
        <Container>
          <SectionHeading
            id="calendar-heading"
            eyebrow="The broker year"
            title="Where the Work Actually Falls"
          />
          <div className="reveal-media mt-12">
            <BrokerCalendar />
          </div>
        </Container>
      </Section>

      {/* The table --------------------------------------------------------- */}
      <Section tone="section" labelledBy="table-heading">
        <Container>
          <SectionHeading
            id="table-heading"
            eyebrow="One row per deliverable"
            title="How It Is Built Today, and What We Do About It"
          />

          <div className="stagger mt-12 space-y-4">
            {WORKFLOWS.map((workflow, i) => (
              <Card key={workflow.name} style={stagger(i)} className="p-6 sm:p-8">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,260px)_1fr] lg:gap-12">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="t-h3">{workflow.name}</h3>
                      <StatusPill
                        status={workflow.status}
                        label={workflow.statusLabel}
                      />
                    </div>
                    {workflow.slug ? (
                      <p className="mt-4">
                        <TextLink href={`/advisor/${workflow.slug}`}>
                          Open the page
                        </TextLink>
                      </p>
                    ) : (
                      <p className="t-caption mt-4 text-grey-500">
                        No page yet. A roadmap page that reads like a shipped
                        page is how you lose a diligence process.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <p className="t-caption font-semibold text-grey-500 uppercase">
                        Today
                      </p>
                      <ul className="mt-3 space-y-2">
                        {workflow.builtToday.slice(0, 2).map((line) => (
                          <li
                            key={line}
                            className="text-[0.8125rem] leading-relaxed text-grey-700"
                          >
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="t-caption font-semibold text-blue-500 uppercase">
                        With TruHu
                      </p>
                      <ul className="mt-3 space-y-2">
                        {workflow.truhuDoes.slice(0, 2).map((line) => (
                          <li
                            key={line}
                            className="text-[0.8125rem] leading-relaxed text-grey-700"
                          >
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* The boundary ------------------------------------------------------- */}
      <Section tone="white" labelledBy="scope-heading">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-20">
            <SectionHeading
              id="scope-heading"
              eyebrow="The boundary"
              title="And What We Do Not Build"
              lede="A vendor who says everything is not believed. A vendor who says these six, not those three, is."
            />
            <ul className="stagger space-y-4">
              {NOT_IN_SCOPE.map((item, i) => (
                <li
                  key={item.name}
                  style={stagger(i)}
                  className="card-shape flex gap-4 bg-section p-5"
                >
                  <X weight="bold" className="mt-1 size-4 shrink-0 text-grey-500" aria-hidden />
                  <div>
                    <p className="t-h4">{item.name}</p>
                    <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-grey-700">
                      {item.why}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* Early access -------------------------------------------------------- */}
      <Section tone="navy" size="loose">
        <LeafMotif className="-bottom-44 -left-32 h-[640px] w-[360px]" opacity={0.08} flip />
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="reveal">
              <Eyebrow tone="light">Early access</Eyebrow>
              <h2 className="t-h2 mt-4 text-white">
                Employee Q&amp;A is{" "}
                <span className="text-green-500">next out.</span>
              </h2>
              <p className="t-lede measure mt-5 text-muted-300">
                A small group, a real feedback loop, and a direct line to the
                people building it.
              </p>
            </div>
            <Card tone="navy" className="reveal p-6 sm:p-8">
              <EarlyAccessForm workflow="Employee Q&A" tone="dark" />
              <p className="t-caption mt-6 text-white/50">
                Waiting on a different workflow?{" "}
                <Link
                  href="/contact"
                  className="text-leaf-400 underline underline-offset-4"
                >
                  Tell us which one
                </Link>
                .
              </p>
            </Card>
          </div>

          <div className="mt-14 flex flex-wrap gap-3 border-t border-white/12 pt-10">
            <CTAButton href="/contact">Book a demo</CTAButton>
            <CTAButton href="/advisor" variant="onNavySecondary">
              Back to Advisor
            </CTAButton>
          </div>
        </Container>
      </Section>
    </>
  );
}
