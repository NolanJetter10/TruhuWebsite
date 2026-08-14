import type { Metadata } from "next";
import { DemoForm } from "@/components/conversion/DemoForm";
import { Container, Section, SectionHeading } from "@/components/ui/primitives";
import { RESULTS } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Ask for a demo of TruHu Advisor and TruHu Workforce, built from your own plan documents.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <Section tone="paper" ambient size="loose">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <div className="reveal">
            <SectionHeading
              eyebrow="Get started"
              title="See a guide built from your own plan documents."
              lede="Send one client's plan files and we will show you what their employees would receive: branded, translated, and delivered without a login."
            />

            <dl className="mt-12 grid gap-8 sm:grid-cols-2">
              {RESULTS.facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="t-h2 text-blue-700">{fact.value}</dt>
                  <dd className="t-caption mt-1 text-slate-600">{fact.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="reveal-wipe">
            <DemoForm />
          </div>
        </div>
      </Container>
    </Section>
  );
}
