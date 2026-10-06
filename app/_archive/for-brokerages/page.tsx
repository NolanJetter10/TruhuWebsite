/**
 * ARCHIVED (September 2026). The underscore folder keeps this route out of
 * the app: it is not served, linked or in the sitemap. To restore it, move
 * the folder back to `app/for-brokerages` and re-add the nav and sitemap entries.
 */
import type { Metadata } from "next";
import { CloseCta } from "@/components/layout/CloseCta";
import { SpotlightCard } from "@/components/ui/Spotlight";
import { StatBand } from "@/components/ui/Stat";
import { Words, wordCount } from "@/components/ui/Words";
import {
  Container,
  DrawnRule,
  Section,
  SectionHeading,
  stagger,
} from "@/components/ui/primitives";
import { BROKERAGES_PAGE } from "@/lib/content";

const { hero, stats, statsNote, gap, hours, changes, close } = BROKERAGES_PAGE;

export const metadata: Metadata = {
  title: "For brokerages",
  description: hero.lede,
  alternates: { canonical: "/for-brokerages" },
};

export default function ForBrokeragesPage() {
  return (
    <>
      {/* Hero, with the numbers underneath -------------------------------- */}
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
              <Words
                text={hero.titleAccent}
                start={wordCount(hero.titleLead)}
                gradient
              />
            </h1>

            <div className="hero-seq">
              <p className="t-lede measure mx-auto mt-6 text-slate-300">
                {hero.lede}
              </p>
            </div>
          </div>

          <div className="reveal mt-16 lg:mt-20">
            <StatBand stats={stats} />
          </div>

          <DrawnRule tone="light" className="mt-16" />

          <p className="reveal measure mx-auto mt-10 text-center text-[1.0625rem] leading-relaxed text-slate-300">
            {statsNote}
          </p>
        </Container>
      </Section>

      {/* The expectations gap ---------------------------------------------- */}
      <Section tone="white" labelledBy="gap-heading">
        <Container>
          <div className="reveal mx-auto max-w-3xl">
            <SectionHeading id="gap-heading" title={gap.title} />
            <p className="measure mt-6 text-[1.0625rem] leading-relaxed text-slate-600">
              {gap.body}
            </p>
            <p className="t-caption mt-4 text-slate-400">{gap.source}</p>
          </div>
        </Container>
      </Section>

      {/* Where the hours go ------------------------------------------------ */}
      <Section tone="paper" labelledBy="hours-heading">
        <Container>
          <SectionHeading
            id="hours-heading"
            title={hours.title}
            className="reveal"
          />

          <ul className="stagger mt-12 grid gap-5 md:grid-cols-3">
            {hours.items.map((item, i) => (
              <SpotlightCard key={item.name} as="li" style={stagger(i)}>
                <h3 className="t-h4">{item.name}</h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-slate-600">
                  {item.blurb}
                </p>
              </SpotlightCard>
            ))}
          </ul>
        </Container>
      </Section>

      {/* What changes ------------------------------------------------------ */}
      <Section tone="white" labelledBy="changes-heading">
        <Container>
          <div className="reveal mx-auto max-w-3xl">
            <SectionHeading
              id="changes-heading"
              title={changes.title}
            />
            <p className="measure mt-6 text-[1.0625rem] leading-relaxed text-slate-600">
              {changes.body}
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
