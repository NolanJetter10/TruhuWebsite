import type { Metadata } from "next";
import { DownloadSimple, FileText, Info, Scales } from "@phosphor-icons/react/ssr";
import { LeafMotif } from "@/components/art/Leaf";
import { DeliveryLedger } from "@/components/art/diagrams";
import { FAQ } from "@/components/conversion/FAQ";
import { CTAButton } from "@/components/ui/CTAButton";
import {
  Card,
  Container,
  Eyebrow,
  IconCircle,
  Section,
  SectionHeading,
  SourceNote,
  stagger,
} from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Acknowledgement and Proof of Delivery",
  description:
    "What TruHu Workforce records: delivered, failed, clicked, replied, acknowledged. Per named employee, timestamped, exportable. Plus a plain statement of what we do not claim about the law.",
  alternates: { canonical: "/workforce/compliance" },
};

const EVENTS = [
  { name: "Delivered", means: "The carrier accepted it for that number.", note: "Not read. Nothing on this list means read." },
  { name: "Failed", means: "Rejected, or the number is unreachable.", note: "The most actionable event in the set." },
  { name: "Clicked", means: "The link was opened from that person's message.", note: "The strongest passive signal available." },
  { name: "Replied", means: "They sent a message back, content retained.", note: "Includes STOP, honoured immediately." },
  { name: "Acknowledged", means: "An explicit action confirming receipt.", note: "The only event reflecting a deliberate act." },
];

const NOT_CLAIMED = [
  {
    title: "We do not say OSHA requires a signature.",
    body: "As a general rule it does not. What it requires around training is that it happens and is documented. If your counsel wants signatures, the product collects them, but the requirement is theirs to state.",
  },
  {
    title: "We do not say acknowledgement is a statutory mandate in your state.",
    body: "It is widely treated as employment-law best practice and it is useful evidence. You will not find an 'X states require' construction anywhere on this site, because we could not stand behind one.",
  },
  {
    title: "We do not repeat the 30-day document rule.",
    body: "Practitioners state it uniformly. Our verification could not locate it in the section it is usually attributed to. That is not the same as it being wrong, but we cannot cite it, so it is not here.",
  },
];

const FAQS = [
  {
    q: "Is an acknowledgement in TruHu legally sufficient?",
    a: "That is a question for your counsel. What we can tell you precisely is what the record contains: the named employee, the message version they were shown, the channel, the timestamp of each event, and the exact action they took. Whether that satisfies a particular obligation is a legal judgement we will not make on a marketing page.",
  },
  {
    q: "How long is the record kept?",
    a: "For the retention window configured for that employer, including after an employee leaves. A record that vanishes with the person is not evidence.",
  },
  {
    q: "Can we export it?",
    a: "Yes, per campaign, per employee or per date range, as CSV. An audit trail you cannot get out is not an audit trail.",
  },
  {
    q: "What if an employee replies STOP?",
    a: "Opt-out is honoured immediately at the phone number, permanently until they re-consent, and cannot be overridden by a campaign. The opt-out is itself timestamped and recorded.",
  },
];

export default function CompliancePage() {
  return (
    <>
      <Section tone="navy">
        <LeafMotif className="-top-44 -left-32 h-[660px] w-[360px]" opacity={0.08} flip />
        <Container>
          <div className="hero-seq max-w-3xl">
            <Eyebrow tone="light">TruHu Workforce</Eyebrow>
            <h1 className="t-display mt-5 text-white">
              Proof of delivery,{" "}
              <span className="text-green-500">per named employee.</span>
            </h1>
            <p className="t-lede measure mt-7 text-muted-300">
              Precision about the artefact is more persuasive than an assertion
              about the law, and it cannot be wrong.
            </p>
          </div>
        </Container>
      </Section>

      {/* The record --------------------------------------------------------- */}
      <Section tone="white" labelledBy="record-heading">
        <Container>
          <SectionHeading
            id="record-heading"
            eyebrow="The record"
            title="Five Events. Each One Defined."
          />

          <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:gap-16">
            <div className="reveal overflow-x-auto">
              <table className="w-full min-w-[440px] border-collapse text-left">
                <caption className="sr-only">Events recorded and what each means</caption>
                <thead>
                  <tr className="border-b border-border-200">
                    <th scope="col" className="t-caption pb-3 font-semibold text-grey-500 uppercase">
                      Event
                    </th>
                    <th scope="col" className="t-caption pb-3 font-semibold text-grey-500 uppercase">
                      What it means
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {EVENTS.map((event) => (
                    <tr key={event.name} className="border-b border-border-200 align-top">
                      <th scope="row" className="w-[8.5rem] py-4 pr-6">
                        <span className="t-h4">{event.name}</span>
                      </th>
                      <td className="py-4">
                        <p className="text-[0.9375rem] leading-relaxed text-grey-700">
                          {event.means}
                        </p>
                        <p className="t-caption mt-1 text-grey-500">{event.note}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <SourceNote className="mt-5">
                Product behaviour, verifiable in a demo. Not legal advice.
              </SourceNote>
            </div>

            <div className="reveal-media">
              <DeliveryLedger />
            </div>
          </div>
        </Container>
      </Section>

      {/* Retention ------------------------------------------------------------ */}
      <Section tone="section" labelledBy="retention-heading">
        <Container>
          <SectionHeading
            id="retention-heading"
            eyebrow="Retention and export"
            title="An Audit Trail You Cannot Get Out Is Not an Audit Trail"
          />
          <ul className="stagger mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: FileText,
                title: "Retained past employment",
                body: "The record survives the employee leaving, for the configured window.",
              },
              {
                icon: DownloadSimple,
                title: "Exportable as CSV",
                body: "Per campaign, per employee or per date range, including the version each person saw.",
              },
              {
                icon: Scales,
                title: "Versioned content",
                body: "Acknowledging 'the handbook update' is weak. Acknowledging version 4, sent Oct 14, is what counsel wants.",
              },
            ].map((item, i) => (
              <Card as="li" key={item.title} style={stagger(i)} className="flex flex-col">
                <IconCircle>
                  <item.icon className="size-5" aria-hidden />
                </IconCircle>
                <h3 className="t-h4 mt-4">{item.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-grey-700">
                  {item.body}
                </p>
              </Card>
            ))}
          </ul>
        </Container>
      </Section>

      {/* What we do not claim -------------------------------------------------- */}
      <Section tone="white" labelledBy="notclaimed-heading">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-20">
            <div className="reveal">
              <SectionHeading
                id="notclaimed-heading"
                eyebrow="Stated plainly"
                title="What We Do Not Claim"
                lede="A compliance product that gets compliance wrong on its own site has a problem no design can fix."
              />
              <div className="card-shape mt-8 flex gap-3 bg-section p-5">
                <Info weight="fill" className="mt-0.5 size-4 shrink-0 text-blue-500" aria-hidden />
                <p className="text-[0.8125rem] leading-relaxed text-grey-700">
                  Nothing here is legal advice. Every regulatory statement we do
                  make carries a citation, or it is not made.
                </p>
              </div>
            </div>

            <ul className="stagger space-y-4">
              {NOT_CLAIMED.map((item, i) => (
                <li
                  key={item.title}
                  style={stagger(i)}
                  className="card-shape border border-border-200 p-6"
                >
                  <h3 className="t-h4">{item.title}</h3>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-grey-700">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section tone="section" labelledBy="compliance-faq-heading">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,300px)_1fr] lg:gap-16">
            <SectionHeading
              id="compliance-faq-heading"
              eyebrow="Questions"
              title="What People Ask at 11pm"
            />
            <FAQ items={FAQS} />
          </div>
        </Container>
      </Section>

      <Section tone="navy" size="loose">
        <LeafMotif className="-right-32 -bottom-32 h-[600px] w-[340px]" opacity={0.08} />
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="t-h1 text-white">
              Show us the notice.{" "}
              <span className="text-green-500">We will show you the record.</span>
            </h2>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <CTAButton href="/contact" size="lg">
                Book a demo
              </CTAButton>
              <CTAButton href="/security" variant="onNavySecondary" size="lg">
                Read the security page
              </CTAButton>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
