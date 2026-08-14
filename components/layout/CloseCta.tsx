import { CTAButton } from "@/components/ui/CTAButton";
import { Container, Section } from "@/components/ui/primitives";

/**
 * The one CTA every page ends on. Same lit dark surface as the home close, so
 * every route lands on the same note: bring one real client and see it built.
 */
export function CloseCta({
  titleLead,
  titleAccent,
  lede,
  cta,
}: {
  titleLead: string;
  titleAccent: string;
  lede?: string;
  cta: { href: string; label: string };
}) {
  return (
    <Section tone="dark" ambient pointer size="loose">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="t-h1 text-white">
            {titleLead} <span className="t-gradient">{titleAccent}</span>
          </h2>
          {lede ? (
            <p className="t-lede measure mx-auto mt-7 text-slate-300">{lede}</p>
          ) : null}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <CTAButton href={cta.href} size="lg">
              {cta.label}
            </CTAButton>
          </div>
        </div>
      </Container>
    </Section>
  );
}
