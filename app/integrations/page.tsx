import type { Metadata } from "next";
import { ArrowRight, Info } from "@phosphor-icons/react/ssr";
import { LeafMotif } from "@/components/art/Leaf";
import { CTAButton } from "@/components/ui/CTAButton";
import {
  Card,
  Container,
  Eyebrow,
  Section,
  SectionHeading,
  SourceNote,
  stagger,
} from "@/components/ui/primitives";
import { visibleIntegrationsByCategory } from "@/lib/content";

export const metadata: Metadata = {
  title: "Integrations",
  description:
    "What TruHu connects to, what each integration does, which way data flows, and whether it is live or planned. Every entry is verifiable with the partner.",
  alternates: { canonical: "/integrations" },
};

export default function IntegrationsPage() {
  const groups = visibleIntegrationsByCategory();

  return (
    <>
      <Section tone="navy">
        <LeafMotif className="-top-44 -right-32 h-[640px] w-[360px]" opacity={0.08} />
        <Container>
          <div className="hero-seq max-w-3xl">
            <Eyebrow tone="light">Integrations</Eyebrow>
            <h1 className="t-display mt-5 text-white">
              We produce the client-facing work.{" "}
              <span className="text-green-500">Your systems keep the rest.</span>
            </h1>
            <p className="t-lede measure mt-7 text-muted-300">
              Your ben-admin owns enrollment. Your AMS owns the book. We read
              what we need and stay out of the way.
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="white" labelledBy="grid-heading">
        <Container>
          <SectionHeading
            id="grid-heading"
            eyebrow="What connects"
            title="Every Integration, and Which Way Data Moves"
            lede="Anything listed here can be checked with the partner. That is the whole point of this page."
          />

          <div className="mt-12 space-y-10">
            {groups.map((group) => (
              <section key={group.category}>
                <h3 className="t-h3">{group.category}</h3>
                <ul className="stagger mt-5 grid gap-4 md:grid-cols-2">
                  {group.items.map((item, i) => (
                    <Card as="li" key={item.name} style={stagger(i)} className="flex flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="t-h4">{item.name}</h4>
                        <span
                          className={
                            item.status === "Live"
                              ? "shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-green-600 uppercase"
                              : "shrink-0 rounded-full bg-section px-2.5 py-1 text-[10px] font-semibold tracking-wide text-grey-500 uppercase"
                          }
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-grey-700">
                        {item.what}
                      </p>
                      <p className="mt-4 flex items-center gap-2 border-t border-border-200 pt-3 text-[0.8125rem] text-grey-500">
                        <ArrowRight weight="bold" className="size-3.5 shrink-0 text-blue-500" aria-hidden />
                        {item.direction}
                      </p>
                    </Card>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <Card className="reveal mt-12 flex gap-4">
            <Info weight="fill" className="mt-0.5 size-5 shrink-0 text-blue-500" aria-hidden />
            <div>
              <p className="t-h4">Why this list is shorter than you expected</p>
              <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-grey-700">
                A partner appears here only when the relationship is corroborated
                by the partner&rsquo;s own directory. One entry is held back
                pending exactly that. A longer page would be easy. A checkable
                one is worth more.
              </p>
            </div>
          </Card>

          <SourceNote className="mt-6">
            Reviewed quarterly and on any partner change. If something here does
            not match what a partner tells you, that is a bug and we want to know.
          </SourceNote>
        </Container>
      </Section>

      <Section tone="section" labelledBy="norip-heading">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <SectionHeading
              id="norip-heading"
              eyebrow="No rip and replace"
              title="Nothing Here Asks You to Move a System"
              lede="The most common reason a brokerage says no is that a purchase implies a migration. This one does not."
            />
            <ul className="stagger space-y-3">
              {[
                { t: "We do not do enrollment.", b: "Your ben-admin keeps it, with eligibility and every carrier feed." },
                { t: "We do not do quoting.", b: "Your tools and analysts own the marketing cycle. We take the output." },
                { t: "We do not do billing.", b: "That lives in your agency management system and should stay there." },
                { t: "No system at all is fine.", b: "A scheduled CSV drop is a first-class integration here." },
              ].map((item, i) => (
                <li key={item.t} style={stagger(i)} className="card-shape bg-white p-5">
                  <p className="t-h4">{item.t}</p>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-grey-700">{item.b}</p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section tone="navy" size="loose">
        <LeafMotif className="-bottom-32 -left-32 h-[580px] w-[320px]" opacity={0.08} flip />
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="t-h1 text-white">
              Tell us what you run on.{" "}
              <span className="text-green-500">We will tell you honestly.</span>
            </h2>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <CTAButton href="/contact" size="lg">
                Book a demo
              </CTAButton>
              <CTAButton href="/security" variant="onNavySecondary" size="lg">
                What happens to the data
              </CTAButton>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
