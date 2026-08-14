import type { Metadata } from "next";
import {
  Broadcast,
  ClipboardText,
  Files,
  LockKey,
  SealCheck,
  Translate,
} from "@phosphor-icons/react/ssr";
import { GroundingDiagram } from "@/components/art/panels";
import { LeafMotif } from "@/components/art/Leaf";
import { CTAButton } from "@/components/ui/CTAButton";
import {
  Card,
  Container,
  DrawnRule,
  Eyebrow,
  IconCircle,
  Section,
  SectionHeading,
  TextLink,
  stagger,
} from "@/components/ui/primitives";
import { LinkCard, TrustStrip } from "@/components/proof/proof";

export const metadata: Metadata = {
  title: "Platform",
  description:
    "The generation engine, the delivery layer, the record and the controls. What Advisor and Workforce share, and why they are still sold separately.",
  alternates: { canonical: "/platform" },
};

const PILLARS = [
  { icon: Files, name: "Grounded generation", body: "Produced from the documents a customer supplies, with a source reference on every value." },
  { icon: Translate, name: "Translation at generation", body: "36 languages produced as part of the build, so versions cannot drift apart." },
  { icon: Broadcast, name: "Delivery without identity", body: "Built around an employee who has a phone number and nothing else." },
  { icon: ClipboardText, name: "The record", body: "Delivered, failed, clicked, replied, acknowledged. Timestamped and exportable." },
  { icon: SealCheck, name: "Human approval", body: "A named approver is a required step, not a setting, and is recorded." },
  { icon: LockKey, name: "Controls", body: "Brand locks per client, role-scoped access, SSO, and full version history." },
];

export default function PlatformPage() {
  return (
    <>
      <Section tone="navy">
        <LeafMotif className="-top-44 -left-32 h-[660px] w-[360px]" opacity={0.08} flip />
        <Container>
          <div className="hero-seq max-w-3xl">
            <Eyebrow tone="light">Platform</Eyebrow>
            <h1 className="t-display mt-5 text-white">
              One engine. Two products.{" "}
              <span className="text-green-500">Sold separately, on purpose.</span>
            </h1>
            <p className="t-lede measure mt-7 text-muted-300">
              Advisor and Workforce share a foundation. They are still two
              products and two buying decisions, and this page does not pretend
              otherwise.
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="white" labelledBy="pillars-heading">
        <Container>
          <SectionHeading id="pillars-heading" eyebrow="The foundation" title="Six Things Both Products Stand On" />
          <ul className="stagger mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((pillar, i) => (
              <Card as="li" key={pillar.name} style={stagger(i)} className="flex flex-col">
                <IconCircle>
                  <pillar.icon className="size-5" aria-hidden />
                </IconCircle>
                <h3 className="t-h4 mt-4">{pillar.name}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-grey-700">
                  {pillar.body}
                </p>
              </Card>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="section" labelledBy="grounding-heading">
        <Container>
          <SectionHeading
            id="grounding-heading"
            eyebrow="How generation works"
            title="Documents In, Cited Content Out, a Human in the Middle"
            lede="Document-to-content generation is the category floor. What is worth saying is not that we do it, but exactly how it is constrained."
          />
          <div className="mt-12">
            <GroundingDiagram />
          </div>
          <p className="mt-8">
            <TextLink href="/security#responsible-ai">
              What happens to the documents, in detail
            </TextLink>
          </p>
        </Container>
      </Section>

      <Section tone="white" labelledBy="two-heading">
        <Container>
          <SectionHeading
            id="two-heading"
            eyebrow="Product truth"
            title="Where One Product Ends and the Other Begins"
            lede="There is no arrow between these two boxes on any diagram we publish."
          />

          <div className="stagger mt-12 grid gap-5 lg:grid-cols-2">
            <Card style={stagger(0)} className="flex flex-col p-7">
              <h3 className="t-h3">TruHu Advisor</h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-grey-700">
                Produces and publishes the deliverable: the guide, the microsite,
                the campaign content, branded for the client and approved by a
                named person on your team.
              </p>
              <p className="mt-6">
                <TextLink href="/advisor">Explore Advisor</TextLink>
              </p>
            </Card>
            <Card style={stagger(1)} className="flex flex-col p-7">
              <h3 className="t-h3">TruHu Workforce</h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-grey-700">
                Reaches the employee and records what happened: texting,
                acknowledgement, the delivery record, the failure list.
              </p>
              <p className="mt-6">
                <TextLink href="/workforce">Explore Workforce</TextLink>
              </p>
            </Card>
          </div>

          <DrawnRule className="mt-14 mb-10" />
          <TrustStrip />
        </Container>
      </Section>

      <Section tone="section" labelledBy="next-heading">
        <Container>
          <SectionHeading id="next-heading" eyebrow="Next" title="The Pages Your Reviewer Will Want" />
          <ul className="stagger mt-10 grid gap-5 md:grid-cols-3">
            <li className="h-full" style={stagger(0)}>
              <LinkCard
                href="/security"
                eyebrow="Security"
                title="Data, models and deletion"
                body="What we handle, where it lives, what the AI does with it, and the subprocessor list."
                cta="Read it"
              />
            </li>
            <li className="h-full" style={stagger(1)}>
              <LinkCard
                href="/implementation"
                eyebrow="Implementation"
                title="The first 30 days"
                body="Week by week, in two columns: what we do and what your team has to do."
                cta="See the plan"
              />
            </li>
            <li className="h-full" style={stagger(2)}>
              <LinkCard
                href="/integrations"
                eyebrow="Integrations"
                title="What we connect to"
                body="Ben-admin, HRIS, payroll, AMS and SSO, with the direction of flow for each."
                cta="See integrations"
              />
            </li>
          </ul>
        </Container>
      </Section>

      <Section tone="navy" size="loose">
        <LeafMotif className="-right-32 -bottom-32 h-[600px] w-[340px]" opacity={0.08} />
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="t-h1 text-white">
              A platform is a claim.{" "}
              <span className="text-green-500">Here is ours, written down.</span>
            </h2>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <CTAButton href="/contact" size="lg">
                Book a demo
              </CTAButton>
              <CTAButton href="/advisor/workflows" variant="onNavySecondary" size="lg">
                See the workflow map
              </CTAButton>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
