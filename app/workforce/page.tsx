import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarCheck,
  ClipboardText,
  Heartbeat,
  Megaphone,
  UsersThree,
  Warning,
  ShieldCheck,
} from "@phosphor-icons/react/ssr";
import { MessageThread } from "@/components/art/advisorMedia";
import { DeliveryLedger } from "@/components/art/diagrams";
import { NoticeBoard } from "@/components/art/NoticeBoard";
import { LeafMotif } from "@/components/art/Leaf";
import { ProductLockup } from "@/components/art/Logo";
import { CTAButton } from "@/components/ui/CTAButton";
import { StatBand } from "@/components/ui/Stat";
import {
  Card,
  Container,
  DrawnRule,
  Eyebrow,
  IconCircle,
  Section,
  SectionHeading,
  SourceNote,
  TextLink,
  stagger,
} from "@/components/ui/primitives";
import { LinkCard, Testimonial, TrustStrip } from "@/components/proof/proof";
import { QUOTE_HR, WORKFORCE_STATS } from "@/lib/content";

export const metadata: Metadata = {
  title: "TruHu Workforce",
  description:
    "The employees other tools miss have no app, no login and no work email, just a phone number. Workforce reaches them, records what happened, and hands you the list of people it could not reach.",
  alternates: { canonical: "/workforce" },
};

const CATEGORIES = [
  { icon: Megaphone, name: "Open enrollment", body: "The window, the plans, the one action each person has to take." },
  { icon: ClipboardText, name: "Policy and handbook", body: "Updates that need to be seen, acknowledged and evidenced." },
  { icon: ShieldCheck, name: "Safety and compliance", body: "Notices with a date attached and a record of who got them." },
  { icon: CalendarCheck, name: "Operations", body: "Shift changes, closures, weather. Things that cannot wait." },
  { icon: Heartbeat, name: "Benefits and wellbeing", body: "Year-round nudges, not one email in October." },
  { icon: UsersThree, name: "Recognition", body: "What reaches everybody at a desk and nobody on the floor." },
];

export default function WorkforcePage() {
  return (
    <>
      {/* Hero -------------------------------------------------------------- */}
      <Section tone="navy" size="none" className="pt-14 pb-16 lg:pt-16 lg:pb-24">
        <LeafMotif className="-top-44 -right-32 h-[720px] w-[400px]" opacity={0.08} />
        <Container>
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
            <div className="hero-seq">
              <ProductLockup product="Workforce" tone="light" />
              <h1 className="t-display mt-6 text-white">
                Reach the employees{" "}
                <span className="text-green-500">every other tool misses.</span>
              </h1>
              <p className="t-lede measure mt-7 text-muted-300">
                No app. No login. No work email, because most of them never had
                one. A phone number is the only detail the whole roster shares.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <CTAButton href="/contact" size="lg">
                  Book a demo
                </CTAButton>
                <CTAButton href="/fit-test" variant="onNavySecondary" size="lg">
                  Take the Fit Test
                </CTAButton>
              </div>
            </div>
            <div className="hero-media">
              <MessageThread />
            </div>
          </div>
        </Container>
      </Section>

      {/* For brokers ------------------------------------------------------- */}
      <Section tone="tint" size="none" className="py-5">
        <Container>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.9375rem] text-navy-900">
              <span className="font-bold">For brokers:</span> deploy across your
              whole book from one console, with book-level reporting.
            </p>
            <TextLink href="/advisor">See how brokers run it</TextLink>
          </div>
        </Container>
      </Section>

      {/* Exposure ----------------------------------------------------------- */}
      <Section tone="white" labelledBy="exposure-heading">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="reveal">
              <SectionHeading
                id="exposure-heading"
                eyebrow="Why it matters"
                title={
                  <>
                    Unread isn&rsquo;t uninformed.{" "}
                    <span className="text-green-600">It&rsquo;s exposure.</span>
                  </>
                }
                lede="An employee who never saw the handbook update is not a metric. They are a person who does not know a rule you will later need them to have known."
              />
              <p className="mt-7">
                <TextLink href="/workforce/compliance">
                  What the record contains
                </TextLink>
              </p>
            </div>
            <figure className="reveal-media">
              <NoticeBoard />
              <figcaption className="t-caption measure mt-5 text-grey-500">
                Every employer has a wall like this. Nobody has ever proved that
                anyone read anything on it.
              </figcaption>
            </figure>
          </div>
        </Container>
      </Section>

      {/* Stats --------------------------------------------------------------- */}
      <Section tone="section">
        <Container>
          <StatBand facts={WORKFORCE_STATS} />
        </Container>
      </Section>

      {/* Categories ----------------------------------------------------------- */}
      <Section tone="white" labelledBy="categories-heading">
        <Container>
          <SectionHeading
            id="categories-heading"
            eyebrow="What gets sent"
            title="Everything That Has to Reach Everybody"
          />
          <ul className="stagger mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((category, i) => (
              <Card as="li" key={category.name} style={stagger(i)} className="flex flex-col">
                <IconCircle>
                  <category.icon className="size-5" aria-hidden />
                </IconCircle>
                <h3 className="t-h4 mt-4">{category.name}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-grey-700">
                  {category.body}
                </p>
              </Card>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Tracking -------------------------------------------------------------- */}
      <Section tone="section" labelledBy="tracking-heading">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="reveal">
              <SectionHeading
                id="tracking-heading"
                eyebrow="What is measured"
                title="Delivered. Failed. Clicked. Replied. Acknowledged."
                lede="Per named employee, timestamped, exportable. That is the whole list, and it is deliberately shorter than what our competitors publish."
              />
              <Card className="mt-8">
                <p className="t-h4">We do not report open rates.</p>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-grey-700">
                  Email opens fire when a mail client pre-loads an image. SMS has
                  no open event at all.
                </p>
              </Card>
              <p className="mt-6">
                <TextLink href="/resources/delivered-is-not-read">
                  Why we report it this way
                </TextLink>
              </p>
            </div>
            <div className="reveal-media">
              <DeliveryLedger />
            </div>
          </div>
        </Container>
      </Section>

      {/* Failure list ------------------------------------------------------------ */}
      <Section tone="navy">
        <LeafMotif className="-bottom-52 -left-32 h-[680px] w-[380px]" opacity={0.07} flip />
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:gap-20">
            <div className="reveal">
              <Eyebrow tone="light">The output nobody markets</Eyebrow>
              <h2 className="t-h2 mt-4 text-white">
                The most useful thing in a report is{" "}
                <span className="text-green-500">the list of people it missed.</span>
              </h2>
              <p className="t-lede measure mt-6 text-muted-300">
                Not the percentage. The names. A wrong number is not low
                engagement, it is a person who did not get the message.
              </p>
            </div>
            <Card tone="navy" className="reveal">
              <div className="flex items-center gap-2.5">
                <Warning weight="fill" className="size-5 text-leaf-400" aria-hidden />
                <p className="t-h4 text-white">Could not be reached, 3</p>
              </div>
              <ul className="mt-5 space-y-3">
                {[
                  { name: "M. Castellanos", why: "Number disconnected", site: "Field crew 4" },
                  { name: "P. Iyer", why: "No mobile on file", site: "Distribution" },
                  { name: "L. Okafor", why: "Carrier rejected", site: "Plant 2, nights" },
                ].map((person) => (
                  <li
                    key={person.name}
                    className="flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-0 last:pb-0"
                  >
                    <span>
                      <span className="block text-[0.9375rem] font-semibold text-white">
                        {person.name}
                      </span>
                      <span className="block text-[0.8125rem] text-white/50">
                        {person.site}
                      </span>
                    </span>
                    <span className="shrink-0 text-[0.8125rem] text-leaf-400">
                      {person.why}
                    </span>
                  </li>
                ))}
              </ul>
              <SourceNote tone="light" className="mt-5">
                Sample data. Real lists carry the same fields.
              </SourceNote>
            </Card>
          </div>

          <DrawnRule tone="light" className="my-12" />
          <div className="reveal">
            <Testimonial quote={QUOTE_HR} tone="light" />
          </div>
        </Container>
      </Section>

      {/* Deeper --------------------------------------------------------------- */}
      <Section tone="white" labelledBy="deeper-heading">
        <Container>
          <SectionHeading id="deeper-heading" eyebrow="Go deeper" title="Two Questions People Arrive Asking" />
          <ul className="stagger mt-10 grid gap-5 md:grid-cols-2">
            <li className="h-full" style={stagger(0)}>
              <LinkCard
                href="/workforce/compliance"
                eyebrow="Acknowledgement"
                title="Proof of delivery and the audit trail"
                body="What is recorded, how long it is kept, how to get it out, and every legal claim we decline to make."
                cta="Read it"
              />
            </li>
            <li className="h-full" style={stagger(1)}>
              <LinkCard
                href="/workforce/frontline"
                eyebrow="Reach"
                title="The deskless and no-email workforce"
                body="Plant floors, truck cabs, job sites and clinics. Rosters, consent and opt-out."
                cta="Read it"
              />
            </li>
          </ul>
          <DrawnRule className="mt-14 mb-10" />
          <TrustStrip />
        </Container>
      </Section>

      {/* Close ----------------------------------------------------------------- */}
      <Section tone="navy" size="loose">
        <LeafMotif className="-top-32 -right-32 h-[620px] w-[340px]" opacity={0.08} />
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="t-h1 text-white">
              Find out in two minutes{" "}
              <span className="text-green-500">whether this fits.</span>
            </h2>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <CTAButton href="/fit-test" size="lg">
                Take the Fit Test
              </CTAButton>
              <CTAButton href="/contact" variant="onNavySecondary" size="lg">
                Book a demo
              </CTAButton>
            </div>
            <p className="t-caption mt-8 text-white/45">
              Sold separately from{" "}
              <Link href="/advisor" className="text-leaf-400 underline underline-offset-4">
                TruHu Advisor
              </Link>
              . Plenty of customers buy one.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
