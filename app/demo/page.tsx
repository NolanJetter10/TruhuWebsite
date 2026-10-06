import type { Metadata } from "next";
import { DemoForm } from "@/components/conversion/DemoForm";
import { Container, Section, SectionHeading } from "@/components/ui/primitives";
import { DEMO_PAGE } from "@/lib/content";

export const metadata: Metadata = {
  title: "Book a demo",
  description: DEMO_PAGE.lede,
  alternates: { canonical: "/demo" },
};

export default function DemoPage() {
  return (
    <Section tone="paper" ambient size="loose">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <div className="reveal">
            <SectionHeading
              title={DEMO_PAGE.title}
              lede={DEMO_PAGE.lede}
            />

            <ul className="mt-10 space-y-4">
              {DEMO_PAGE.facts.map((fact) => (
                <li key={fact} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-2 size-2 shrink-0 rounded-full bg-green-500"
                  />
                  <span className="text-[0.9375rem] leading-relaxed text-slate-600">
                    {fact}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="reveal-wipe">
            <DemoForm />
          </div>
        </div>
      </Container>
    </Section>
  );
}
