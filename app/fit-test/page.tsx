import type { Metadata } from "next";
import { Clock, EyeSlash, Scales } from "@phosphor-icons/react/ssr";
import { LeafMotif } from "@/components/art/Leaf";
import { FitTest } from "@/components/conversion/FitTest";
import { Container, Eyebrow, Section } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "The Fit Test",
  description:
    "Four questions about how your book or your workforce actually works, and an honest read on whether TruHu fits, including probably not. Runs entirely in your browser.",
  alternates: { canonical: "/fit-test" },
};

export default function FitTestPage() {
  return (
    <>
      <Section tone="navy">
        <LeafMotif className="-top-40 -right-32 h-[560px] w-[320px]" opacity={0.08} />
        <Container>
          <div className="hero-seq max-w-3xl">
            <Eyebrow tone="light">The Fit Test</Eyebrow>
            <h1 className="t-display mt-5 text-white">
              Two minutes. Four questions.{" "}
              <span className="text-green-500">A straight answer.</span>
            </h1>
            <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              {[
                { icon: Clock, text: "About two minutes" },
                { icon: EyeSlash, text: "No email, nothing sent anywhere" },
                { icon: Scales, text: "An honest answer, including a no" },
              ].map((item) => (
                <li
                  key={item.text}
                  className="flex items-center gap-2 text-[0.9375rem] text-muted-300"
                >
                  <item.icon weight="fill" className="size-4 shrink-0 text-leaf-400" aria-hidden />
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section tone="section">
        <Container className="max-w-4xl!">
          <FitTest />
        </Container>
      </Section>
    </>
  );
}
