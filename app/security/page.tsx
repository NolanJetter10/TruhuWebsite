import type { Metadata } from "next";
import {
  Check,
  Files,
  LockKey,
  MapPin,
  SealCheck,
  ShieldCheck,
  Trash,
  X,
} from "@phosphor-icons/react/ssr";
import { LeafMotif } from "@/components/art/Leaf";
import { GroundingDiagram } from "@/components/art/panels";
import { CTAButton } from "@/components/ui/CTAButton";
import {
  Card,
  Container,
  Eyebrow,
  IconCircle,
  Section,
  SectionHeading,
  SourceNote,
  TextLink,
  stagger,
} from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Security and Responsible AI",
  description:
    "What TruHu handles and why, where it lives, how long it is kept, our SOC 2 posture, the subprocessor list, and a plain answer to what happens to your clients' plan documents.",
  alternates: { canonical: "/security" },
};

const POSTURE = [
  {
    icon: Files,
    title: "What we handle",
    body: "Plan design documents, and a roster of name, employer, site, language and mobile number. We do not need or want individual health information.",
  },
  {
    icon: MapPin,
    title: "Where it lives",
    body: "United States. TLS 1.2 or better in transit, AES-256 at rest, backups under the same rules. Every environment separated by customer.",
  },
  {
    icon: Trash,
    title: "Retention and deletion",
    body: "Delivery records survive the employee leaving. Source documents are kept so a published guide traces back. Deletion at termination is evidenced, not asserted.",
  },
  {
    icon: LockKey,
    title: "Access",
    body: "SAML SSO or enforced MFA, roles scoped to the groups a person works on. Staff access to customer content needs a named reason and is logged.",
  },
  {
    icon: SealCheck,
    title: "SOC 2 Type II",
    body: "Independently attested. Ask and we will send the report under NDA, usually the same day. We would rather your reviewer read it than take our word.",
  },
  {
    icon: ShieldCheck,
    title: "HIPAA, stated precisely",
    body: "Our products are designed so protected health information is not required, and our standard position is that we do not receive it. Where a deployment puts us in scope we will sign a BAA and scope it accordingly.",
  },
];

const AI_YES = [
  "Content is generated from the documents you supply for that client, and every value keeps its source page.",
  "A named person on your team approves before anything publishes.",
  "Every published version is retained, so you can show what was live on a date.",
  "Model providers appear in the subprocessor list, and changes are notified in advance.",
];

const AI_NO = [
  "Customer content is not used to train models. That is contractual, not a preference.",
  "Providers do not retain your content for their own purposes under our terms.",
  "The model is never asked what a typical plan looks like.",
  "No employee health information reaches a model, because we hold none.",
];

const SUBPROCESSORS = [
  { name: "Cloud infrastructure", purpose: "Hosting and storage", region: "United States" },
  { name: "Model provider", purpose: "Generation and translation", region: "United States" },
  { name: "SMS aggregator", purpose: "Delivery and receipts", region: "United States" },
  { name: "Email delivery", purpose: "Transactional and campaign email", region: "United States" },
  { name: "Error monitoring", purpose: "Application diagnostics", region: "United States" },
];

export default function SecurityPage() {
  return (
    <>
      <Section tone="navy">
        <LeafMotif className="-top-44 -right-32 h-[680px] w-[380px]" opacity={0.08} />
        <Container>
          <div className="hero-seq max-w-3xl">
            <Eyebrow tone="light">Security and privacy</Eyebrow>
            <h1 className="t-display mt-5 text-white">
              The answers your compliance team{" "}
              <span className="text-green-500">will ask for anyway.</span>
            </h1>
            <p className="t-lede measure mt-7 text-muted-300">
              Advisor reads plan documents and Workforce holds phone numbers.
              Both trigger a review, so here are the answers before the review
              starts.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <CTAButton href="/contact" size="lg">
                Request the SOC 2 report
              </CTAButton>
              <CTAButton href="#responsible-ai" variant="onNavySecondary" size="lg">
                Jump to the AI section
              </CTAButton>
            </div>
          </div>
        </Container>
      </Section>

      {/* Posture -------------------------------------------------------------- */}
      <Section tone="white" labelledBy="posture-heading">
        <Container>
          <SectionHeading id="posture-heading" eyebrow="Posture" title="Six Answers, Plainly" />
          <ul className="stagger mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {POSTURE.map((item, i) => (
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

      {/* Responsible AI --------------------------------------------------------- */}
      <Section tone="section" id="responsible-ai" labelledBy="ai-heading" className="scroll-mt-24">
        <Container>
          <SectionHeading
            id="ai-heading"
            eyebrow="Responsible AI"
            title={
              <>
                What Actually Happens to{" "}
                <span className="text-green-600">Your Client&rsquo;s Documents</span>
              </>
            }
          />

          <div className="mt-12">
            <GroundingDiagram />
          </div>

          <div className="reveal mt-10 grid gap-5 lg:grid-cols-2">
            <Card>
              <p className="t-h4 flex items-center gap-2">
                <Check weight="bold" className="size-5 text-green-600" aria-hidden />
                What happens
              </p>
              <ul className="mt-5 space-y-3">
                {AI_YES.map((line) => (
                  <li key={line} className="flex gap-3 text-[0.9375rem] leading-relaxed text-grey-700">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-green-500" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <p className="t-h4 flex items-center gap-2">
                <X weight="bold" className="size-5 text-grey-500" aria-hidden />
                What does not
              </p>
              <ul className="mt-5 space-y-3">
                {AI_NO.map((line) => (
                  <li key={line} className="flex gap-3 text-[0.9375rem] leading-relaxed text-grey-700">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-grey-500" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="reveal mt-6 flex gap-4">
            <LockKey className="mt-0.5 size-5 shrink-0 text-blue-500" aria-hidden />
            <p className="measure text-[0.9375rem] leading-relaxed text-grey-700">
              <strong className="font-semibold text-ink-900">
                The honest limitation:
              </strong>{" "}
              grounding makes a source error traceable. It does not make it
              disappear. If the summary says the copay is $25 and it is really
              $30, the guide says $25, with a citation to the page that said so.
              That is why a named approver is required.
            </p>
          </Card>
        </Container>
      </Section>

      {/* Subprocessors ----------------------------------------------------------- */}
      <Section tone="white" id="subprocessors" labelledBy="sub-heading" className="scroll-mt-24">
        <Container>
          <SectionHeading
            id="sub-heading"
            eyebrow="Subprocessors"
            title="Who Else Touches the Data"
            lede="Material changes are notified before they take effect. Named vendors are provided under NDA alongside the SOC 2 report."
          />
          <div className="reveal mt-10 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border-200">
                  {["Category", "Purpose", "Region"].map((h) => (
                    <th key={h} scope="col" className="t-caption pb-3 font-semibold text-grey-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SUBPROCESSORS.map((row) => (
                  <tr key={row.name} className="border-b border-border-200">
                    <th scope="row" className="py-4 pr-6 text-[0.9375rem] font-semibold text-ink-900">
                      {row.name}
                    </th>
                    <td className="py-4 pr-6 text-[0.9375rem] text-grey-700">{row.purpose}</td>
                    <td className="py-4 text-[0.9375rem] text-grey-700">{row.region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <SourceNote className="mt-5">
            Reviewed quarterly and on any change to the list.
          </SourceNote>

          <div className="mt-12" id="disclosure">
            <p className="t-h4">Found a vulnerability?</p>
            <p className="mt-2 text-[0.9375rem] text-grey-700">
              Report it to security@truhu.ai. Acknowledged within one business
              day, and we will tell you when it is fixed.{" "}
              <TextLink href="/contact">Request the security pack</TextLink>
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="navy" size="loose">
        <LeafMotif className="-bottom-32 -left-32 h-[600px] w-[340px]" opacity={0.08} flip />
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="t-h1 text-white">
              Bring your reviewer{" "}
              <span className="text-green-500">to the first call.</span>
            </h2>
            <p className="t-lede measure mx-auto mt-6 text-muted-300">
              Most vendors would rather you did not.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <CTAButton href="/contact" size="lg">
                Book a demo
              </CTAButton>
              <CTAButton href="/implementation" variant="onNavySecondary" size="lg">
                See how rollout works
              </CTAButton>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
