import type { Metadata } from "next";
import { DemoForm } from "@/components/conversion/DemoForm";
import { Container, Section, SectionHeading } from "@/components/ui/primitives";
import { PRICING_PAGE } from "@/lib/content";

export const metadata: Metadata = {
  title: "Pricing",
  description: PRICING_PAGE.lede,
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <Section tone="paper" ambient size="loose">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <div className="reveal">
            <SectionHeading
              title={PRICING_PAGE.title}
              lede={PRICING_PAGE.lede}
            />
            <p className="t-caption measure mt-8 text-slate-500">
              {PRICING_PAGE.caption}
            </p>
          </div>

          <div className="reveal-wipe">
            <DemoForm variant="pricing" />
          </div>
        </div>
      </Container>
    </Section>
  );
}
