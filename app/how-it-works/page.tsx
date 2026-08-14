import type { Metadata } from "next";
import { CloseCta } from "@/components/layout/CloseCta";
import { Words, wordCount } from "@/components/ui/Words";
import { Container, Section } from "@/components/ui/primitives";
import { HOW_PAGE } from "@/lib/content";

const { hero, blocks, close } = HOW_PAGE;

export const metadata: Metadata = {
  title: "How it works",
  description: hero.lede,
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
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

      {/* The mechanics ----------------------------------------------------- */}
      <Section tone="paper" labelledBy="mechanics-heading">
        <Container>
          <h2 id="mechanics-heading" className="sr-only">
            The mechanics
          </h2>
          <ol className="mx-auto max-w-3xl">
            {blocks.map((block, i) => (
              <li
                key={block.name}
                className="reveal border-b border-line py-10 first:pt-0 last:border-b-0 last:pb-0"
              >
                <p className="t-eyebrow text-blue-700">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="t-h3 mt-3">{block.name}</h3>
                <p className="measure mt-4 text-[1.0625rem] leading-relaxed text-slate-600">
                  {block.body}
                </p>
              </li>
            ))}
          </ol>
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
