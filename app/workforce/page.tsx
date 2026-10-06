import type { Icon } from "@phosphor-icons/react";
import {
  Handshake,
  ListChecks,
  TreeStructure,
  UsersThree,
} from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import { WorkforceCardArt } from "@/components/art/WorkforceCardArt";
import { PhoneBroadcast } from "@/components/demos/PhoneBroadcast";
import { WorkforceNetwork } from "@/components/demos/WorkforceNetwork";
import { CloseCta } from "@/components/layout/CloseCta";
import { CTAButton, TextLink } from "@/components/ui/CTAButton";
import { QuoteCarousel } from "@/components/ui/QuoteCarousel";
import { SpotlightCard } from "@/components/ui/Spotlight";
import { StatBand } from "@/components/ui/Stat";
import { Words, wordCount } from "@/components/ui/Words";
import {
  Container,
  Section,
  SectionHeading,
  stagger,
} from "@/components/ui/primitives";
import { FAQ_PAGE, WORKFORCE, WORKFORCE_PAGE } from "@/lib/content";
import extendWorkforce from "@/public/images/extend-workforce.png";
import sharkSign from "@/public/images/shark-sign-swimmer.jpg";
import faceJulia from "@/public/images/unsplash/photo-1504941319307-771ebfa02a51.jpg";
import faceJenel from "@/public/images/unsplash/photo-1541888946425-d81bb19240f5.jpg";
import faceFulton from "@/public/images/unsplash/photo-1557160854-e1e89fdd3286.jpg";

const { hero, network, problem, categories, voices, roi, fit, close } =
  WORKFORCE_PAGE;

const VOICE_FACES = [faceJenel, faceFulton, faceJulia] as const;

/** The fit test's four categories, keyed by `fit.cards[].key`. */
const FIT_ICONS: Record<(typeof fit.cards)[number]["key"], Icon> = {
  workforce: UsersThree,
  systems: TreeStructure,
  compliance: ListChecks,
  culture: Handshake,
};

export const metadata: Metadata = {
  title: "TruHu Workforce",
  description: hero.lede,
  alternates: { canonical: "/workforce" },
};

export default function WorkforcePage() {
  return (
    <>
      {/* Hero — live copy beside the running delivery demo. ----------------- */}
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

              {/* One step under the site's h1 on wide screens: the headline
                  is long, and at full size it broke into five lines. */}
              <h1 className="t-h1 mt-6 text-white lg:text-[3rem]">
                <Words text={hero.titleLead} />{" "}
                <Words
                  text={hero.titleAccent}
                  start={wordCount(hero.titleLead)}
                  gradient
                />
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
              <PhoneBroadcast />
            </div>
          </div>

          {/* The network, on the hero's own surface rather than in a section
              of its own: the demo above is one send to one shift, this is the
              whole company it reaches. No visible heading; the region is
              named for screen readers. */}
          <section
            aria-labelledby="network-heading"
            className="mt-24 sm:mt-28 lg:mt-32"
          >
            <h2 id="network-heading" className="sr-only">
              {network.title}
            </h2>
            <WorkforceNetwork />
          </section>
        </Container>
      </Section>

      {/* The problem ------------------------------------------------------- */}
      <Section tone="paper" labelledBy="problem-heading">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="reveal">
              <SectionHeading
                id="problem-heading"
                title={
                  <>
                    {problem.titleLead}{" "}
                    <span className="text-blue-700">{problem.titleAccent}</span>
                  </>
                }
                lede={problem.body}
              />
              <p className="mt-8">
                <TextLink href={problem.cta.href}>{problem.cta.label}</TextLink>
              </p>
            </div>

            <div className="reveal-tilt min-w-0">
              <Image
                src={sharkSign}
                alt={problem.imageAlt}
                className="card-shape-lg h-auto w-full object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* What it does -------------------------------------------------------
          Moved off the home page, where it read as a cross-sell. Here it is the
          plain account of the mechanism, so it sits between the problem and the
          six message categories. The "See TruHu Workforce" link and the
          sold-separately footnote went with the move — both spoke to a broker
          reading another page. */}
      <Section tone="white" labelledBy="workforce-heading">
        <Container>
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-20">
            <div className="reveal">
              <SectionHeading
                id="workforce-heading"
                title={WORKFORCE.title}
                lede={WORKFORCE.lede}
              />
              <ul className="stagger mt-10 space-y-5">
                {WORKFORCE.points.map((point, i) => (
                  <li key={point.name} style={stagger(i)} className="flex gap-4">
                    <span
                      aria-hidden
                      className="mt-2 size-2 shrink-0 rounded-full bg-green-500"
                    />
                    <span>
                      <span className="t-h4 block">{point.name}</span>
                      <span className="mt-1 block text-[0.9375rem] leading-relaxed text-slate-600">
                        {point.blurb}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="reveal-tilt min-w-0">
              <Image
                src={extendWorkforce}
                alt="A team meeting around a table, mid-conversation"
                className="card-shape-lg h-auto w-full object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* Six categories ----------------------------------------------------- */}
      <Section tone="dark" ambient labelledBy="categories-heading">
        <Container>
          <SectionHeading
            id="categories-heading"
            tone="light"
            align="center"
            title={
              <>
                {categories.titleLead}{" "}
                <span className="t-gradient">{categories.titleAccent}</span>
              </>
            }
            className="reveal"
          />
          <p className="reveal t-caption mt-4 hidden text-center text-white/45 md:block">
            {categories.lede}
          </p>

          <ul className="stagger mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.items.map((item, i) => (
              <SpotlightCard
                key={item.name}
                as="li"
                tone="dark"
                padding="none"
                style={stagger(i)}
                className="group"
              >
                <div className="relative aspect-[4/3]">
                  {/* Drawn product scenes in place of stock photos: each shows
                      the thing the card names, and all six share one stage. */}
                  <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
                    <WorkforceCardArt kind={item.image} />
                  </div>
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-950/55 to-ink-950/15"
                  />
                  <div className="absolute inset-0 flex flex-col justify-end p-6">
                    <p className="t-eyebrow text-green-400">{item.num}</p>
                    <h3 className="t-h4 mt-2 text-white">{item.name}</h3>
                    <p className="mt-1 text-[0.8125rem] font-semibold text-green-400/90">
                      {item.tagline}
                    </p>
                    <div className="overflow-hidden transition-all duration-500 ease-out md:max-h-0 md:opacity-0 md:group-hover:max-h-28 md:group-hover:opacity-100">
                      <p className="pt-3 text-[0.8125rem] leading-relaxed text-white/70">
                        {item.summary}
                      </p>
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            ))}
          </ul>
        </Container>
      </Section>

      {/* What companies are saying ------------------------------------------ */}
      <Section tone="white" labelledBy="voices-heading">
        <Container>
          <h2
            id="voices-heading"
            className="t-eyebrow reveal mb-12 text-center text-slate-400"
          >
            {voices.eyebrow}
          </h2>
          <div className="reveal">
            <QuoteCarousel
              quotes={voices.quotes.map((quote, i) => ({
                ...quote,
                image: VOICE_FACES[i],
              }))}
            />
          </div>
        </Container>
      </Section>

      {/* Return on investment ------------------------------------------------ */}
      <Section tone="dark" ambient labelledBy="roi-heading">
        <Container>
          <SectionHeading
            id="roi-heading"
            tone="light"
            align="center"
            title={roi.title}
            lede={roi.body}
            className="reveal"
          />

          <p className="reveal t-eyebrow mt-12 mb-8 text-center text-slate-400">
            {roi.caption}
          </p>
          <StatBand stats={roi.stats} />
        </Container>
      </Section>

      {/* Fit score ---------------------------------------------------------- */}
      <Section tone="paper" labelledBy="fit-heading">
        <Container>
          <SectionHeading
            id="fit-heading"
            align="center"
            title={fit.title}
            lede={fit.lede}
            className="reveal"
          />

          {/* One row of four on wide screens, two by two below that. The
              question carries the card; the category is its label. */}
          <ul className="stagger mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {fit.cards.map((card, i) => {
              const FitIcon = FIT_ICONS[card.key];
              return (
                <SpotlightCard key={card.name} as="li" style={stagger(i)}>
                  <span className="grid size-11 place-items-center rounded-xl bg-blue-100 text-blue-700">
                    <FitIcon aria-hidden weight="duotone" className="size-6" />
                  </span>
                  <h3 className="t-eyebrow mt-6 text-slate-400">{card.name}</h3>
                  <p className="mt-2 font-display text-[1.0625rem] leading-snug font-semibold text-ink">
                    {card.question}
                  </p>
                </SpotlightCard>
              );
            })}
          </ul>

          <div className="reveal mt-10 text-center">
            {fit.notes.map((note) => (
              <p key={note} className="t-caption text-slate-500">
                {note}
              </p>
            ))}
            <div className="mt-6 flex justify-center">
              <CTAButton href={fit.cta.href} size="lg">
                {fit.cta.label}
              </CTAButton>
            </div>
            <p className="t-caption mt-5 text-slate-400">{fit.caption}</p>
          </div>
        </Container>
      </Section>

      {/* FAQ pointer ---------------------------------------------------------
          The questions themselves live on /faq now; a screen and a half of
          accordions between the fit test and the close was the wrong trade. */}
      <Section tone="white" size="tight">
        <Container>
          <p className="reveal flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center">
            <span className="t-h4">{FAQ_PAGE.pointer.workforce}</span>
            <TextLink href="/faq">{FAQ_PAGE.pointer.label}</TextLink>
          </p>
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
