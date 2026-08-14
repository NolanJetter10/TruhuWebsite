import { CTAButton } from "@/components/ui/CTAButton";
import { LeafMotif } from "@/components/art/Leaf";
import { Container, Eyebrow, Section, TextLink } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <Section tone="navy" size="loose">
      <LeafMotif className="-top-32 -right-32 h-[560px] w-[320px]" opacity={0.08} />
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow tone="light">404</Eyebrow>
          <h1 className="t-h1 mt-5 text-white">
            That page is <span className="text-green-500">not here.</span>
          </h1>
          <p className="t-lede measure mx-auto mt-6 text-muted-300">
            If you followed a link from somewhere on this site, that is our bug
            and we would like to know.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <CTAButton href="/">Back to the homepage</CTAButton>
            <CTAButton href="/advisor/workflows" variant="onNavySecondary">
              See the workflow map
            </CTAButton>
          </div>
          <p className="mt-8">
            <TextLink href="/contact" tone="light">
              Tell us about the broken link
            </TextLink>
          </p>
        </div>
      </Container>
    </Section>
  );
}
