import type { Metadata } from "next";
import { Check, Prohibit, ShieldCheck, Translate, UploadSimple } from "@phosphor-icons/react/ssr";
import { LeafMotif } from "@/components/art/Leaf";
import { MessageThread } from "@/components/art/advisorMedia";
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
  title: "Deskless and No-Email Reach",
  description:
    "Plant floors, truck cabs, job sites, clinics and retail. How TruHu Workforce reaches employees with no app, no login and no work email, and how rosters, consent and opt-out are handled.",
  alternates: { canonical: "/workforce/frontline" },
};

const SETTINGS = [
  { name: "Manufacturing", body: "Three shifts, two of which never see a desk." },
  { name: "Field services", body: "Crews that start at a site rather than an office." },
  { name: "Healthcare", body: "Clinical staff whose inbox is full of clinical mail." },
  { name: "Transport", body: "A cab, a route, and a schedule that overlaps with nobody." },
  { name: "Retail and hospitality", body: "High turnover and a roster that changes weekly." },
  { name: "Security and facilities", body: "Distributed across client sites, managed by phone tree." },
];

export default function FrontlinePage() {
  return (
    <>
      <Section tone="navy" size="none" className="pt-14 pb-16 lg:pt-16 lg:pb-24">
        <LeafMotif className="-top-44 -right-32 h-[700px] w-[380px]" opacity={0.08} />
        <Container>
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
            <div className="hero-seq">
              <Eyebrow tone="light">TruHu Workforce</Eyebrow>
              <h1 className="t-display mt-5 text-white">
                The channel matters{" "}
                <span className="text-green-500">more than the content.</span>
              </h1>
              <p className="t-lede measure mt-7 text-muted-300">
                A perfect guide that reaches nobody is worth less than a plain
                one that reaches everybody.
              </p>
            </div>
            <div className="hero-media">
              <MessageThread />
            </div>
          </div>
        </Container>
      </Section>

      {/* Roster --------------------------------------------------------------- */}
      <Section tone="white" labelledBy="roster-heading">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="reveal">
              <SectionHeading
                id="roster-heading"
                eyebrow="Start with the roster"
                title="Most Employers Do Not Have a Clean List"
                lede="Every vendor demo assumes a tidy directory. Real employers have a payroll export, a spreadsheet a supervisor keeps, and three people who started last week."
              />
              <ul className="mt-8 space-y-3">
                {[
                  "Sync from an HRIS or payroll system where one exists.",
                  "Scheduled CSV or SFTP where one does not, which is most of a book.",
                  "Supervisor additions for crews that turn over weekly.",
                  "Bad numbers surfaced as a list, not buried in a percentage.",
                ].map((line) => (
                  <li key={line} className="flex gap-3 text-[0.9375rem] text-grey-700">
                    <Check weight="bold" className="mt-1 size-4 shrink-0 text-green-600" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-7">
                <TextLink href="/integrations">Which systems we read from</TextLink>
              </p>
            </div>

            <ul className="stagger grid gap-4 sm:grid-cols-2 lg:content-start">
              {[
                { icon: Prohibit, title: "No app, no login", body: "Nothing to download and no password anyone will reset." },
                { icon: Translate, title: "36 languages", body: "Set per employee, applied to the message and the document." },
                { icon: UploadSimple, title: "Roster from anywhere", body: "HRIS, payroll, CSV, SFTP, or a supervisor on their phone." },
                { icon: ShieldCheck, title: "Consent per number", body: "Opt-out is immediate, permanent, and timestamped." },
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
          </div>
        </Container>
      </Section>

      {/* Settings -------------------------------------------------------------- */}
      <Section tone="section" labelledBy="settings-heading">
        <Container>
          <SectionHeading
            id="settings-heading"
            eyebrow="Where this comes up"
            title="The Same Shape, Six Industries"
          />
          <ul className="stagger mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SETTINGS.map((setting, i) => (
              <Card as="li" key={setting.name} style={stagger(i)} className="flex flex-col">
                <h3 className="t-h4">{setting.name}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-grey-700">
                  {setting.body}
                </p>
              </Card>
            ))}
          </ul>
          <SourceNote className="mt-8 measure">
            We do not publish deskless-workforce percentages. The figures
            circulating in this category are largely definitional or
            vendor-sourced, and we will not build an argument on a number we
            cannot stand behind.
          </SourceNote>
        </Container>
      </Section>

      <Section tone="navy" size="loose">
        <LeafMotif className="-bottom-32 -left-32 h-[600px] w-[340px]" opacity={0.08} flip />
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="t-h1 text-white">
              Bring the{" "}
              <span className="text-green-500">messiest roster you have.</span>
            </h2>
            <p className="t-lede measure mx-auto mt-6 text-muted-300">
              The demo that matters is the one on your own list, missing numbers
              and all.
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
