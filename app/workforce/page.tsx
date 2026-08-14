import type { Metadata } from "next";
import { DeliveryProof } from "@/components/demos/DeliveryProof";
import { CloseCta } from "@/components/layout/CloseCta";
import { CTAButton } from "@/components/ui/CTAButton";
import { Words, wordCount } from "@/components/ui/Words";
import {
  Container,
  Section,
  SectionHeading,
  stagger,
} from "@/components/ui/primitives";
import { WORKFORCE_PAGE } from "@/lib/content";

const { hero, what, reaches, gets, why, close } = WORKFORCE_PAGE;

export const metadata: Metadata = {
  title: "TruHu Workforce",
  description: hero.lede,
  alternates: { canonical: "/workforce" },
};

export default function WorkforcePage() {
  return (
    <>
      {/* Hero ------------------------------------------------------------- */}
      <Section tone="dark" ambient pointer>
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
            <div>
              <p
                className="t-eyebrow inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-blue-400 backdrop-blur-sm"
                style={{ animation: "hero-in 700ms var(--ease-out-expo) both" }}
              >
                <span className="size-1.5 rounded-full bg-green-400 anim-pulse" />
                {hero.eyebrow}
              </p>

              <h1 className="t-h1 mt-6 text-white">
                <Words text={hero.titleLead} />{" "}
                <span className="t-gradient">
                  <Words text={hero.titleAccent} start={wordCount(hero.titleLead)} />
                </span>
              </h1>

              <div className="hero-seq">
                <p className="t-lede measure mt-6 text-slate-300">{hero.lede}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <CTAButton href={hero.primaryCta.href} size="lg">
                    {hero.primaryCta.label}
                  </CTAButton>
                </div>
                <p className="t-caption mt-6 text-white/45">{hero.note}</p>
              </div>
            </div>

            <div className="demo-in min-w-0">
              <DeliveryProof />
            </div>
          </div>
        </Container>
      </Section>

      {/* What it is -------------------------------------------------------- */}
      <Section tone="paper" labelledBy="what-heading">
        <Container>
          <div className="reveal mx-auto max-w-3xl">
            <SectionHeading
              id="what-heading"
              eyebrow={what.eyebrow}
              title={what.title}
            />
            <p className="measure mt-6 text-[1.0625rem] leading-relaxed text-slate-600">
              {what.body}
            </p>
          </div>
        </Container>
      </Section>

      {/* Who it reaches ---------------------------------------------------- */}
      <Section tone="dark" ambient labelledBy="reaches-heading">
        <Container>
          <div className="reveal mx-auto max-w-3xl">
            <SectionHeading
              id="reaches-heading"
              eyebrow={reaches.eyebrow}
              tone="light"
              title={reaches.title}
            />
            <p className="measure mt-6 text-[1.0625rem] leading-relaxed text-slate-300">
              {reaches.body}
            </p>
          </div>
        </Container>
      </Section>

      {/* What you get ------------------------------------------------------ */}
      <Section tone="white" labelledBy="gets-heading">
        <Container>
          <SectionHeading
            id="gets-heading"
            eyebrow={gets.eyebrow}
            title={gets.title}
            className="reveal"
          />

          <div className="stagger mt-14 grid gap-x-14 gap-y-12 sm:grid-cols-2">
            {gets.items.map((item, i) => (
              <div key={item.name} style={stagger(i)}>
                <h3 className="t-h4">{item.name}</h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-slate-600">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Why you offer it -------------------------------------------------- */}
      <Section tone="paper" labelledBy="why-heading">
        <Container>
          <div className="reveal mx-auto max-w-3xl">
            <SectionHeading
              id="why-heading"
              eyebrow={why.eyebrow}
              title={why.title}
            />
            <p className="measure mt-6 text-[1.0625rem] leading-relaxed text-slate-600">
              {why.body}
            </p>
          </div>
        </Container>
      </Section>

      {/* Close ------------------------------------------------------------- */}
      <CloseCta
        titleLead={close.titleLead}
        titleAccent={close.titleAccent}
        lede={close.lede}
        cta={close.primaryCta}
      />
    </>
  );
}
