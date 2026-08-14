import { CTAButton } from "@/components/ui/CTAButton";
import { Container, Section } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <Section tone="dark" ambient size="loose">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="t-eyebrow text-blue-400">404</p>
          <h1 className="t-h1 mt-5 text-white">
            That page isn&rsquo;t <span className="t-gradient">here.</span>
          </h1>
          <p className="t-lede mx-auto mt-6 max-w-lg text-slate-300">
            The link may be out of date. Everything currently published lives on
            the home page.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <CTAButton href="/" size="lg">
              Back to home
            </CTAButton>
            <CTAButton href="/contact" variant="onDark" size="lg">
              Contact us
            </CTAButton>
          </div>
        </div>
      </Container>
    </Section>
  );
}
