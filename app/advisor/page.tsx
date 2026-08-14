import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowsClockwise,
  ChartLineUp,
  ClockCounterClockwise,
  DownloadSimple,
  FileText,
  LockKey,
  MagnifyingGlass,
  Prohibit,
  SealCheck,
  Timer,
  Translate,
  UsersThree,
  Broadcast,
  GlobeHemisphereWest,
  Clock,
} from "@phosphor-icons/react/ssr";
import {
  BrandPanel,
  DistributePanel,
  GeneratePanel,
  IngestPanel,
  TrackPanel,
} from "@/components/art/panels";
import {
  ApprovalPanel,
  MessageThread,
  MiniGuideCard,
} from "@/components/art/advisorMedia";
import { BookOfBusiness, DeliveryLedger } from "@/components/art/diagrams";
import { LeafMotif } from "@/components/art/Leaf";
import { ProductLockup } from "@/components/art/Logo";
import { WorkflowTabs } from "@/components/product/WorkflowTabs";
import { BookCalculator } from "@/components/product/BookCalculator";
import { FeatureBlock } from "@/components/content/FeatureBlock";
import { FAQ } from "@/components/conversion/FAQ";
import { EarlyAccessForm } from "@/components/conversion/forms";
import { CTAButton } from "@/components/ui/CTAButton";
import { StatBand } from "@/components/ui/Stat";
import {
  Card,
  Container,
  DrawnRule,
  Eyebrow,
  Section,
  SectionHeading,
  SourceNote,
  StatusPill,
  TextLink,
  stagger,
} from "@/components/ui/primitives";
import { LogoWall, Testimonial, TrustStrip } from "@/components/proof/proof";
import {
  ADVISOR_FAQ,
  ADVISOR_STATS,
  CASE_STUDIES,
  QUOTE_BROKER,
  visibleIntegrationsByCategory,
} from "@/lib/content";
import { WORKFLOWS } from "@/lib/workflows";

export const metadata: Metadata = {
  title: "TruHu Advisor",
  description:
    "The brokerages growing fastest are not working the most hours. Advisor builds the guides, microsites and campaigns your team already produces, from your clients' own plan documents, across the whole book.",
  alternates: { canonical: "/advisor" },
};

const STAGES = [
  { id: "ingest", label: "Ingest documents" },
  { id: "generate", label: "Generate" },
  { id: "brand", label: "Brand it" },
  { id: "distribute", label: "Distribute" },
  { id: "track", label: "Track" },
];

export default function AdvisorPage() {
  const lake = CASE_STUDIES[0];

  return (
    <>
      {/* Hero ------------------------------------------------------------ */}
      <Section tone="navy" size="none" className="pt-14 pb-16 lg:pt-16 lg:pb-20">
        <LeafMotif className="-top-48 -left-32 h-[720px] w-[400px]" opacity={0.08} flip />
        <Container>
          <div className="hero-seq max-w-3xl">
            <ProductLockup product="Advisor" tone="light" />
            <h1 className="t-display mt-6 text-white">
              The brokerages growing fastest are{" "}
              <span className="text-green-500">not working more hours.</span>
            </h1>
            <p className="t-lede measure mt-7 text-muted-300">
              They stopped rebuilding the same documents by hand, one account at
              a time.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <CTAButton href="/contact" size="lg">
                Book a demo
              </CTAButton>
              <CTAButton href="#tour" variant="onNavySecondary" size="lg">
                Take the tour
              </CTAButton>
            </div>
          </div>

          <div id="tour" className="hero-media mt-14 scroll-mt-24">
            <WorkflowTabs
              stages={STAGES}
              label="How Advisor produces a guide"
              panels={[
                <IngestPanel key="ingest" />,
                <GeneratePanel key="generate" />,
                <BrandPanel key="brand" />,
                <DistributePanel key="distribute" />,
                <TrackPanel key="track" />,
              ]}
            />
          </div>
        </Container>
      </Section>

      <Section tone="white" size="tight">
        <Container>
          <LogoWall />
        </Container>
      </Section>

      {/* The forgotten 90% ------------------------------------------------ */}
      <Section tone="section" labelledBy="problem-heading">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="reveal">
              <SectionHeading
                id="problem-heading"
                eyebrow="The forgotten 90%"
                title={
                  <>
                    Your top accounts get everything.{" "}
                    <span className="text-green-600">The rest get a PDF.</span>
                  </>
                }
                lede="Not because anyone decided it. Because a guide takes a person a day and a half, and there are only so many days before the enrollment window."
              />
            </div>

            <figure className="reveal-media">
              <div className="card-shape border border-border-200 bg-white p-6 sm:p-8">
                <BookOfBusiness />
                <figcaption className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                  <span className="flex items-center gap-2 text-[0.8125rem] text-grey-700">
                    <span className="size-3 rounded-[2px] bg-green-500" aria-hidden />
                    Gets the full programme
                  </span>
                  <span className="flex items-center gap-2 text-[0.8125rem] text-grey-700">
                    <span
                      className="size-3 rounded-[2px] bg-tint-100 ring-1 ring-border-200"
                      aria-hidden
                    />
                    Gets whatever fits
                  </span>
                </figcaption>
              </div>
              <SourceNote className="mt-3">
                Illustrative. The proportions are the argument.
              </SourceNote>
            </figure>
          </div>
        </Container>
      </Section>

      {/* Stats ------------------------------------------------------------- */}
      <Section tone="white">
        <Container>
          <StatBand facts={ADVISOR_STATS} />
        </Container>
      </Section>

      {/* Capabilities ------------------------------------------------------ */}
      <Section tone="section" labelledBy="capabilities-heading">
        <Container>
          <SectionHeading
            id="capabilities-heading"
            eyebrow="What Advisor does"
            title="Four Things. The Fourth Is the One Buyers Look For."
          />

          <div className="mt-14 space-y-20 lg:space-y-28">
            <FeatureBlock
              eyebrow="Guides and microsites"
              title="Built From the Client's Own Documents"
              explainer="Not a template you fill in. Plan values come out of the SBCs and the rate sheet you already have, and the guide and the microsite are produced together."
              bullets={[
                { icon: MagnifyingGlass, text: "Read from the client's own documents" },
                { icon: Translate, text: "36 languages at generation" },
                { icon: Timer, text: "Live in minutes, not a production cycle" },
                { icon: GlobeHemisphereWest, text: "A microsite with no login" },
              ]}
              media={<MiniGuideCard />}
              link={{ href: "/advisor/guides", label: "How guides get built" }}
            />

            <FeatureBlock
              reverse
              eyebrow="Distribution"
              title="On the Channel Every Employee Actually Has"
              explainer="A phone number is the only contact detail that exists for the whole roster. Follow-up goes to the people who did not act, not to everyone twice."
              bullets={[
                { icon: Broadcast, text: "Text first, email where there is an address" },
                { icon: ArrowsClockwise, text: "Automatic follow-up to non-openers" },
                { icon: Prohibit, text: "No app, no login, no work email" },
                { icon: Clock, text: "Quiet hours enforced per client" },
              ]}
              media={<MessageThread />}
              link={{ href: "/advisor/communications", label: "How campaigns run" }}
            />

            <FeatureBlock
              eyebrow="Visibility"
              title="Per Group, Rolled Up Across the Book"
              explainer="Delivered, failed, clicked, replied, acknowledged. Per named employee, exportable. We do not report open rates, because they cannot be measured honestly."
              bullets={[
                { icon: ChartLineUp, text: "Per-group and book-level rollups" },
                { icon: UsersThree, text: "Per named employee, timestamped" },
                { icon: DownloadSimple, text: "Exportable for the client" },
                { icon: FileText, text: "The list of people not reached at all" },
              ]}
              media={<DeliveryLedger />}
              link={{ href: "/workforce/compliance", label: "What the record contains" }}
            />

            <FeatureBlock
              reverse
              eyebrow="Control"
              title="Approvals, Citations, Brand Locks, Versions"
              explainer="Every generated value carries the document and page it came from, so review is checking rather than trusting. Nothing publishes without a named approver."
              bullets={[
                { icon: FileText, text: "Page-level citations on every value" },
                { icon: SealCheck, text: "Named approver required" },
                { icon: LockKey, text: "Brand locks generation cannot override" },
                { icon: ClockCounterClockwise, text: "Full version history" },
              ]}
              media={<ApprovalPanel />}
              link={{ href: "/security#responsible-ai", label: "How the AI is constrained" }}
            />
          </div>

          <DrawnRule className="mt-20" />

          <div className="mt-10 flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="t-h4">Fits the stack you already run.</p>
              <p className="mt-1.5 text-[0.9375rem] text-grey-700">
                Your ben-admin keeps enrollment. Your AMS keeps the book.
              </p>
            </div>
            <ul className="flex flex-wrap gap-2">
              {visibleIntegrationsByCategory().map((group) => (
                <li
                  key={group.category}
                  className="rounded-full bg-white px-3 py-1.5 text-[0.8125rem] font-semibold text-navy-700"
                >
                  {group.category}
                </li>
              ))}
              <li>
                <TextLink href="/integrations" className="px-2 py-1.5">
                  All integrations
                </TextLink>
              </li>
            </ul>
          </div>
        </Container>
      </Section>

      {/* Book economics ------------------------------------------------------ */}
      <Section tone="white" labelledBy="economics-heading">
        <Container>
          <SectionHeading
            id="economics-heading"
            eyebrow="Book economics"
            title="Run It on Your Own Book"
            lede="No preloaded number and no savings percentage. Your inputs, your arithmetic."
          />
          <div className="reveal mt-12">
            <BookCalculator />
          </div>
        </Container>
      </Section>

      {/* Roadmap -------------------------------------------------------------- */}
      <Section tone="section" labelledBy="roadmap-heading">
        <Container>
          <SectionHeading
            id="roadmap-heading"
            eyebrow="The platform argument"
            title="Not One Product. The Brokerage's Deliverables, One at a Time."
          />

          <ul className="stagger mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WORKFLOWS.map((workflow, i) => (
              <Card
                as="li"
                key={workflow.name}
                interactive
                style={stagger(i)}
                className="relative flex flex-col"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="t-h4 pr-2">
                    {workflow.slug ? (
                      <Link href={`/advisor/${workflow.slug}`}>
                        <span className="absolute inset-0" aria-hidden />
                        {workflow.short}
                      </Link>
                    ) : (
                      workflow.short
                    )}
                  </h3>
                  <StatusPill status={workflow.status} label={workflow.statusLabel} />
                </div>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-grey-700">
                  {workflow.tagline}
                </p>
              </Card>
            ))}
          </ul>

          <div className="reveal mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <Card className="p-6 sm:p-8">
              <Eyebrow>Next to ship</Eyebrow>
              <h3 className="t-h3 mt-3">Employee Q&amp;A is in early access</h3>
              <p className="measure mt-3 text-[0.9375rem] leading-relaxed text-grey-700">
                A small group and a real feedback loop, not a waiting list.
              </p>
              <div className="mt-6">
                <EarlyAccessForm workflow="Employee Q&A" />
              </div>
            </Card>
            <p className="text-[1.0625rem] text-grey-700">
              The whole map, including what a roadmap status means and the three
              things we deliberately do not build.{" "}
              <TextLink href="/advisor/workflows">See the workflow map</TextLink>
            </p>
          </div>
        </Container>
      </Section>

      {/* Proof ----------------------------------------------------------------- */}
      <Section tone="navy">
        <LeafMotif className="-right-32 -bottom-56 h-[680px] w-[380px]" opacity={0.07} />
        <Container>
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            <div className="reveal">
              <Eyebrow tone="light">Proof</Eyebrow>
              <h2 className="t-h2 mt-4 text-white">{lake.org}</h2>
              {lake.headlineStat ? (
                <div className="mt-8">
                  <p className="t-stat text-green-500">{lake.headlineStat.value}</p>
                  <p className="mt-3 max-w-[30ch] text-[0.9375rem] font-medium text-white">
                    {lake.headlineStat.label}
                  </p>
                  <SourceNote tone="light" className="mt-2 max-w-[40ch]">
                    {lake.headlineStat.source}
                  </SourceNote>
                </div>
              ) : null}
              <p className="mt-8">
                <TextLink href={`/customers/${lake.slug}`} tone="light">
                  Read the case study
                </TextLink>
              </p>
            </div>
            <div className="reveal lg:pt-6">
              <Testimonial quote={QUOTE_BROKER} tone="light" />
            </div>
          </div>

          <DrawnRule tone="light" className="my-12" />
          <TrustStrip tone="light" />
        </Container>
      </Section>

      {/* FAQ -------------------------------------------------------------------- */}
      <Section tone="white" labelledBy="faq-heading">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,300px)_1fr] lg:gap-16">
            <SectionHeading
              id="faq-heading"
              eyebrow="Answered in public"
              title="The Discovery Call, Written Down"
            />
            <FAQ items={ADVISOR_FAQ} />
          </div>
        </Container>
      </Section>

      {/* Close -------------------------------------------------------------------- */}
      <Section tone="navy" size="loose">
        <LeafMotif className="-top-32 -left-32 h-[640px] w-[360px]" opacity={0.08} flip />
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="t-h1 text-white">
              Grow the book{" "}
              <span className="text-green-500">without growing the hours.</span>
            </h2>
            <p className="t-lede measure mx-auto mt-6 text-muted-300">
              Bring one client and their plan documents. You will see the guide
              before the call is over.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <CTAButton href="/contact" size="lg">
                Book a demo
              </CTAButton>
              <CTAButton href="/fit-test" variant="onNavySecondary" size="lg">
                Take the Fit Test
              </CTAButton>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
