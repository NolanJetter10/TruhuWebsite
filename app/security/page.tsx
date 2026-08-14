import type { Metadata } from "next";
import { CloseCta } from "@/components/layout/CloseCta";
import { Words, wordCount } from "@/components/ui/Words";
import { Container, Section, stagger } from "@/components/ui/primitives";
import { SECURITY_PAGE } from "@/lib/content";

const { hero, items, close } = SECURITY_PAGE;

export const metadata: Metadata = {
  title: "Security",
  description: hero.lede,
  alternates: { canonical: "/security" },
};

export default function SecurityPage() {
  return (
    <>
      {/* Hero ------------------------------------------------------------- */}
      <Section tone="dark" ambient pointer>
        <Container>
          <div className="mx-auto max-w-3xl text-center">
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
              <p className="t-lede measure mx-auto mt-6 text-slate-300">
                {hero.lede}
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* What is in production --------------------------------------------- */}
      <Section tone="white" labelledBy="controls-heading">
        <Container>
          <h2 id="controls-heading" className="sr-only">
            What is in production
          </h2>
          <div className="stagger grid gap-x-14 gap-y-12 sm:grid-cols-2">
            {items.map((item, i) => (
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
