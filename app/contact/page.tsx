import type { Metadata } from "next";
import { CalendarCheck, ChatCircleText, ShieldCheck } from "@phosphor-icons/react/ssr";
import { LeafMotif } from "@/components/art/Leaf";
import { DemoForm } from "@/components/conversion/forms";
import {
  Card,
  Container,
  Eyebrow,
  Section,
  TextLink,
  stagger,
} from "@/components/ui/primitives";
import { TrustStrip } from "@/components/proof/proof";

export const metadata: Metadata = {
  title: "Book a Demo",
  description:
    "Bring one client group and their plan documents. You will see the deliverable before the call is over. No CAPTCHA, one reply, from a person.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <Section tone="navy">
        <LeafMotif className="-top-44 -left-32 h-[660px] w-[360px]" opacity={0.08} flip />
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
            <div className="hero-seq">
              <Eyebrow tone="light">Book a demo</Eyebrow>
              <h1 className="t-display mt-5 text-white">
                Bring one client.{" "}
                <span className="text-green-500">Leave with their guide.</span>
              </h1>
              <p className="t-lede measure mt-7 text-muted-300">
                Send us one group&rsquo;s plan documents beforehand and we will
                build the guide live.
              </p>

              <ul className="mt-10 space-y-5">
                {[
                  {
                    icon: CalendarCheck,
                    title: "One reply, within a business day",
                    body: "From a person who can answer the security questions.",
                  },
                  {
                    icon: ChatCircleText,
                    title: "45 minutes, not a discovery process",
                    body: "Your book size and your renewal calendar is most of what we need.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Bring your reviewer",
                    body: "We would rather the security conversation happened at the start.",
                  },
                ].map((item) => (
                  <li key={item.title} className="flex gap-4">
                    <item.icon
                      weight="fill"
                      className="mt-0.5 size-5 shrink-0 text-leaf-400"
                      aria-hidden
                    />
                    <div>
                      <p className="text-[0.9375rem] font-semibold text-white">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted-300">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <Card tone="navy" className="p-6 sm:p-8">
              <DemoForm tone="dark" />
            </Card>
          </div>
        </Container>
      </Section>

      <Section tone="white" size="tight">
        <Container>
          <TrustStrip />
        </Container>
      </Section>

      <Section tone="section">
        <Container>
          <ul className="stagger grid gap-5 md:grid-cols-3">
            {[
              {
                t: "Not ready for a call?",
                b: "The Fit Test takes two minutes, asks for no email address, and will tell you if the answer is no.",
                href: "/fit-test",
                cta: "Take the Fit Test",
              },
              {
                t: "Security questionnaire first?",
                b: "Ask for the pack: SOC 2 Type II, penetration-test summary and the named subprocessor list, under NDA.",
                href: "/security",
                cta: "Read the security page",
              },
              {
                t: "Reporting a vulnerability?",
                b: "Write to security@truhu.ai. Acknowledged within one business day, and we will tell you when it is fixed.",
                href: "/security#disclosure",
                cta: "Disclosure policy",
              },
            ].map((item, i) => (
              <Card as="li" key={item.t} style={stagger(i)} className="flex flex-col">
                <p className="t-h4">{item.t}</p>
                <p className="mt-2.5 flex-1 text-[0.9375rem] leading-relaxed text-grey-700">
                  {item.b}
                </p>
                <p className="mt-5">
                  <TextLink href={item.href}>{item.cta}</TextLink>
                </p>
              </Card>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
}
