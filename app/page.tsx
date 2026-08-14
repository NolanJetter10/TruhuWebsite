import type { Metadata } from "next";
import Link from "next/link";
import { GeneratePanel } from "@/components/art/panels";
import { BrowserFrame, PhoneFrame } from "@/components/art/frames";
import { GuidePreview } from "@/components/art/GuidePreview";
import { LeafMotif } from "@/components/art/Leaf";
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
import { HOME_STATS, QUOTE_BROKER } from "@/lib/content";
import { WORKFLOWS } from "@/lib/workflows";

export const metadata: Metadata = {
  description:
    "TruHu Advisor builds the client-facing work your brokerage already produces. TruHu Workforce gets it to every employee, including the ones with no email.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      {/* Hero ----------------------------------------------------------- */}
      <Section tone="navy" size="none" className="pt-16 pb-20 lg:pt-24 lg:pb-28">
        <LeafMotif className="-top-40 -right-32 h-[760px] w-[420px]" opacity={0.09} />
        <Container>
          <div className="grid items-center gap-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
            <div className="hero-seq">
              <h1 className="t-display text-white">
                The work your best accounts get.{" "}
                <span className="text-green-500">For your whole book.</span>
              </h1>
              <p className="t-lede measure mt-7 text-muted-300">
                Advisor builds the guides, microsites and campaigns your team
                already produces. Workforce gets them to every employee,
                including the ones with no email.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <CTAButton href="/contact" size="lg">
                  Book a demo
                </CTAButton>
                <CTAButton href="#the-work" variant="onNavySecondary" size="lg">
                  See a guide
                </CTAButton>
              </div>
              <p className="t-caption mt-7 text-white/45">
                Two products. One platform. Bought separately.
              </p>
            </div>

            <div className="hero-media relative min-w-0">
              <BrowserFrame label="app.truhu.ai / ridgeline / 2026-oe">
                <GeneratePanel />
              </BrowserFrame>
              <div
                className="pointer-events-none absolute -right-6 -bottom-14 hidden origin-bottom-right scale-[0.74] xl:block"
                aria-hidden
              >
                <PhoneFrame>
                  <div className="h-[290px] overflow-hidden">
                    <div className="bg-[#2b3a55] px-5 pt-3 pb-4 text-white">
                      <p className="text-[9px] font-bold tracking-[0.12em]">
                        RIDGELINE MANUFACTURING
                      </p>
                      <p className="mt-2 text-[1.0625rem] leading-tight font-bold">
                        Your 2026 benefits
                      </p>
                    </div>
                    <div className="space-y-2.5 p-4">
                      <div className="card-shape-sm border border-border-200 p-3">
                        <p className="text-[0.8125rem] font-bold text-ink-900">
                          PPO 1500
                        </p>
                        <p className="mt-1 text-[11px] text-grey-500">
                          Deductible{" "}
                          <span className="font-bold text-ink-900">$1,500</span>
                        </p>
                      </div>
                      <div className="card-shape-sm border border-border-200 p-3">
                        <p className="text-[0.8125rem] font-bold text-ink-900">
                          HDHP 3200
                        </p>
                        <p className="mt-1 text-[11px] text-grey-500">
                          Employer HSA{" "}
                          <span className="font-bold text-ink-900">$750</span>
                        </p>
                      </div>
                      <span className="block rounded-full bg-[#8c2f39] py-2 text-center text-[0.8125rem] font-semibold text-white">
                        Start my enrollment
                      </span>
                    </div>
                  </div>
                </PhoneFrame>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Logo wall ------------------------------------------------------- */}
      <Section tone="white" size="tight">
        <Container>
          <LogoWall />
        </Container>
      </Section>

      {/* Two products ---------------------------------------------------- */}
      <Section tone="section" labelledBy="products-heading">
        <Container>
          <SectionHeading
            id="products-heading"
            eyebrow="Two products"
            title="One Buyer, Two Reasons to Buy"
          />

          <div className="stagger mt-12 grid gap-5 lg:grid-cols-2">
            <Card style={stagger(0)} className="flex flex-col p-7 sm:p-9">
              <Eyebrow>Your production line</Eyebrow>
              <h3 className="t-h2 mt-3">TruHu Advisor</h3>
              <p className="mt-4 flex-1 text-[1.0625rem] leading-relaxed text-grey-700">
                Guides, microsites and enrollment campaigns, generated from each
                client&rsquo;s own plan documents. Across the whole book, not
                just the top twenty.
              </p>
              <p className="mt-7">
                <TextLink href="/advisor">Explore Advisor</TextLink>
              </p>
            </Card>

            <Card style={stagger(1)} className="flex flex-col p-7 sm:p-9">
              <Eyebrow>Your retention line</Eyebrow>
              <h3 className="t-h2 mt-3">TruHu Workforce</h3>
              <p className="mt-4 flex-1 text-[1.0625rem] leading-relaxed text-grey-700">
                Reaches every employee on the roster with no app, no login and
                no work email. Then records who actually got it.
              </p>
              <p className="mt-7">
                <TextLink href="/workforce">Explore Workforce</TextLink>
              </p>
            </Card>
          </div>
        </Container>
      </Section>

      {/* Stats ------------------------------------------------------------ */}
      <Section tone="white">
        <Container>
          <StatBand facts={HOME_STATS} />
        </Container>
      </Section>

      {/* Workflow strip ---------------------------------------------------- */}
      <Section tone="section" labelledBy="workflows-heading">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              id="workflows-heading"
              eyebrow="The roadmap, in public"
              title="Every Deliverable a Brokerage Produces, One at a Time"
              className="max-w-2xl"
            />
            <TextLink href="/advisor/workflows">The workflow map</TextLink>
          </div>

          <ul className="stagger mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WORKFLOWS.map((workflow, i) => {
              const href = workflow.slug
                ? `/advisor/${workflow.slug}`
                : "/advisor/workflows";
              return (
                <Card
                  as="li"
                  key={workflow.name}
                  interactive
                  style={stagger(i)}
                  className="relative flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="t-h4 pr-2">
                      <Link href={href}>
                        <span className="absolute inset-0" aria-hidden />
                        {workflow.short}
                      </Link>
                    </h3>
                    <StatusPill
                      status={workflow.status}
                      label={workflow.statusLabel}
                    />
                  </div>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-grey-700">
                    {workflow.tagline}
                  </p>
                </Card>
              );
            })}
          </ul>
        </Container>
      </Section>

      {/* Testimonial and trust --------------------------------------------- */}
      <Section tone="navy">
        <LeafMotif
          className="-bottom-56 -left-32 h-[700px] w-[380px]"
          opacity={0.07}
          flip
        />
        <Container>
          <div className="reveal">
            <Testimonial quote={QUOTE_BROKER} tone="light" />
          </div>
          <DrawnRule tone="light" className="my-12" />
          <TrustStrip tone="light" />
        </Container>
      </Section>

      {/* See the work ------------------------------------------------------ */}
      <Section tone="white" id="the-work" labelledBy="the-work-heading">
        <Container>
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-20">
            <div className="reveal">
              <SectionHeading
                id="the-work-heading"
                eyebrow="The deliverable, not the dashboard"
                title="This Is What the Employee Opens"
              />
              <ul className="mt-8 space-y-3">
                {[
                  "No app, no login, no work email.",
                  "Branded to your client, not to us.",
                  "Every plan value traceable to its source page.",
                  "36 languages, translated at generation.",
                ].map((line) => (
                  <li
                    key={line}
                    className="flex gap-3 text-[1.0625rem] text-grey-700"
                  >
                    <span
                      className="mt-2.5 size-1.5 shrink-0 rounded-full bg-green-500"
                      aria-hidden
                    />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-8">
                <TextLink href="/advisor/guides">How guides get built</TextLink>
              </p>
            </div>

            <div className="reveal-media justify-self-center">
              <GuidePreview />
            </div>
          </div>
          <SourceNote className="mt-10">
            A sample guide. Publishing a real one is gated on customer
            permission.
          </SourceNote>
        </Container>
      </Section>

      {/* Close -------------------------------------------------------------- */}
      <Section tone="navy" size="loose">
        <LeafMotif className="-top-32 -right-32 h-[680px] w-[380px]" opacity={0.08} />
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="t-h1 text-white">
              Every client should get what your{" "}
              <span className="text-green-500">best ten accounts get.</span>
            </h2>
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
