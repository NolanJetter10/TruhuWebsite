import type { Metadata } from "next";
import { Check } from "@phosphor-icons/react/ssr";
import { LeafMotif } from "@/components/art/Leaf";
import { FAQ } from "@/components/conversion/FAQ";
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

export const metadata: Metadata = {
  title: "Implementation",
  description:
    "Week by week: what TruHu needs from your brokerage, what your team does, who builds the first guide, and when the book-wide rollout starts.",
  alternates: { canonical: "/implementation" },
};

const WEEKS = [
  {
    week: "Week 1",
    title: "Kickoff and access",
    truhu: ["Named implementation lead on day one.", "Workspace, roles and SSO configured.", "Security questionnaire answered."],
    you: ["One decision-maker and one account manager, 45 minutes.", "Pick a real first client with a real deadline."],
  },
  {
    week: "Week 2",
    title: "First client, built together",
    truhu: ["We build the first guide with your AM, on a screen share.", "Brand set up and locked.", "Approval workflow configured."],
    you: ["The plan documents you already have.", "About two hours from one account manager."],
  },
  {
    week: "Week 3",
    title: "Your team builds the next three",
    truhu: ["One hour of training, recorded.", "We watch the first three builds and correct as we go."],
    you: ["Three to five more clients queued.", "The people who will actually use it."],
  },
  {
    week: "Week 4",
    title: "Book-wide rollout starts",
    truhu: ["Rollout sequenced against your renewal calendar.", "Reporting configured.", "Handover to a named CS contact."],
    you: ["Sign off the sequence.", "Tell us which renewal months hurt most."],
  },
];

const FAQS = [
  {
    q: "Who builds the first guide?",
    a: "We do, with your account manager watching. By the third one your team is building and we are reviewing. The goal is that you do not need us present by week four.",
  },
  {
    q: "How much of our team's time does this take?",
    a: "Roughly two hours in week two and an hour of training in week three, per account manager. A rollout that needs a project team is a rollout that stalls in busy season.",
  },
  {
    q: "What if we start in the middle of open enrollment?",
    a: "Then we sequence behind your calendar rather than in front of it, and start with the clients whose renewal is furthest out.",
  },
  {
    q: "What does support look like afterwards?",
    a: "A named customer success contact rather than a queue, business-hours support with a same-business-day response target, and escalation to the people who build the product.",
  },
];

export default function ImplementationPage() {
  return (
    <>
      <Section tone="navy">
        <LeafMotif className="-top-44 -left-32 h-[660px] w-[360px]" opacity={0.08} flip />
        <Container>
          <div className="hero-seq max-w-3xl">
            <Eyebrow tone="light">Implementation</Eyebrow>
            <h1 className="t-display mt-5 text-white">
              First client live in week two.{" "}
              <span className="text-green-500">Book-wide by week four.</span>
            </h1>
            <p className="t-lede measure mt-7 text-muted-300">
              We publish the shape of it, because the absence of a number is
              usually read as a bad number.
            </p>
          </div>

          <ul className="stagger mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { stat: "Week 2", label: "First client live" },
              { stat: "3 hrs", label: "Per account manager, total" },
              { stat: "5 days", label: "Documents to a live guide" },
            ].map((item, i) => (
              <Card as="li" key={item.label} tone="navy" style={stagger(i)}>
                <p
                  className="font-bold text-green-500 tabular"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "2rem",
                    lineHeight: 1,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {item.stat}
                </p>
                <p className="mt-2 text-[0.8125rem] text-muted-300">{item.label}</p>
              </Card>
            ))}
          </ul>
          <SourceNote tone="light" className="mt-5">
            Target timeline for a standard rollout, confirmed against your
            renewal calendar in scoping. Not a contractual commitment.
          </SourceNote>
        </Container>
      </Section>

      {/* The four weeks ------------------------------------------------------ */}
      <Section tone="white" labelledBy="weeks-heading">
        <Container>
          <SectionHeading
            id="weeks-heading"
            eyebrow="The first 30 days"
            title="Two Columns, Because Half a Rollout Is What the Vendor Stops Asking For"
          />

          <ol className="stagger mt-12 space-y-4">
            {WEEKS.map((week, i) => (
              <li key={week.week} style={stagger(i)}>
                <Card className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,220px)_1fr_1fr] lg:gap-10">
                  <div>
                    <p className="t-caption font-semibold text-blue-500 uppercase">
                      {week.week}
                    </p>
                    <h3 className="t-h3 mt-2">{week.title}</h3>
                  </div>
                  <div>
                    <p className="t-caption font-semibold text-grey-500 uppercase">
                      We do
                    </p>
                    <ul className="mt-3 space-y-2.5">
                      {week.truhu.map((line) => (
                        <li key={line} className="flex gap-2.5 text-[0.9375rem] leading-relaxed text-grey-700">
                          <Check weight="bold" className="mt-1 size-3.5 shrink-0 text-green-600" aria-hidden />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="t-caption font-semibold text-grey-500 uppercase">
                      You do
                    </p>
                    <ul className="mt-3 space-y-2.5">
                      {week.you.map((line) => (
                        <li key={line} className="flex gap-2.5 text-[0.9375rem] leading-relaxed text-grey-700">
                          <Check weight="bold" className="mt-1 size-3.5 shrink-0 text-blue-500" aria-hidden />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* What it does not involve ---------------------------------------------- */}
      <Section tone="section" labelledBy="notneeded-heading">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <SectionHeading
              id="notneeded-heading"
              eyebrow="Just as important"
              title="What a Rollout Does Not Involve"
              lede="Most of the fear in benefits technology comes from projects that touch enrollment. This one does not."
            />
            <ul className="stagger space-y-3">
              {[
                "No ben-admin migration.",
                "No EDI work. Carrier feeds stay where they are.",
                "No data project. The documents are ones you already have.",
                "No employee onboarding. Employees never create an account.",
                "No professional services quote attached to the word implementation.",
              ].map((line, i) => (
                <li
                  key={line}
                  style={stagger(i)}
                  className="card-shape flex gap-3 border border-border-200 bg-white p-4 text-[0.9375rem] text-grey-700"
                >
                  <Check weight="bold" className="mt-1 size-4 shrink-0 text-green-600" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section tone="white" labelledBy="impl-faq-heading">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,300px)_1fr] lg:gap-16">
            <SectionHeading id="impl-faq-heading" eyebrow="Questions" title="Rollout, Answered" />
            <FAQ items={FAQS} />
          </div>
        </Container>
      </Section>

      <Section tone="navy" size="loose">
        <LeafMotif className="-right-32 -bottom-32 h-[600px] w-[340px]" opacity={0.08} />
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="t-h1 text-white">
              Pick the client with the worst deadline.{" "}
              <span className="text-green-500">Start there.</span>
            </h2>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <CTAButton href="/contact" size="lg">
                Book a demo
              </CTAButton>
              <CTAButton href="/integrations" variant="onNavySecondary" size="lg">
                See the integrations
              </CTAButton>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
