import { Check } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import { ProductLockup } from "@/components/art/Logo";
import { GuidePreview, RecordPreview } from "@/components/art/ProductPreviews";
import { DocumentFlow } from "@/components/demos/DocumentFlow";
import { LogoMarquee } from "@/components/demos/LogoMarquee";
import { ProductWalkthrough } from "@/components/demos/ProductWalkthrough";
import { CloseCta } from "@/components/layout/CloseCta";
import { CTAButton, TextLink } from "@/components/ui/CTAButton";
import { FillIn } from "@/components/ui/FillIn";
import { QuoteCarousel } from "@/components/ui/QuoteCarousel";
import { SpotlightCard } from "@/components/ui/Spotlight";
import { StatBand } from "@/components/ui/Stat";
import { StoryReel } from "@/components/ui/StoryReel";
import { Words, wordCount } from "@/components/ui/Words";
import {
  Container,
  Pill,
  Section,
  SectionHeading,
  stagger,
} from "@/components/ui/primitives";
import {
  CLOSING,
  DOCUMENT_FLOW,
  HERO,
  PRODUCTS,
  QUOTES,
  QUOTES_HEADING,
  RESPONSIBLE_AI,
  SOLUTION,
  STORIES,
  TRUST_STATS,
  WORKLOAD,
} from "@/lib/content";
import christine from "@/public/images/advisors/christine.png";
import emily from "@/public/images/advisors/emily.png";
import john from "@/public/images/advisors/john.png";
import socBadge from "@/public/images/soc-badge.svg";

/** Artwork for `QUOTES`, keyed by the `face` each entry names. */
const FACES = { emily, john, christine };

/** What each product card shows above its copy. */
const PREVIEWS = { Advisor: GuidePreview, Workforce: RecordPreview };

export const metadata: Metadata = {
  description: HERO.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      {/* Hero -------------------------------------------------------------
          One screen: the argument on the left, the product running on the
          right. The height is capped to the viewport below the header so the
          fold lands exactly at the section edge. */}
      <Section
        tone="dark"
        ambient
        pointer
        size="none"
        className="flex min-h-[calc(100svh-4rem)] items-center py-14 lg:py-10"
      >
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-14">
            <div>
              <h1 className="t-h1 text-white">
                <Words text={HERO.titleLead} />{" "}
                <Words
                  text={HERO.titleAccent}
                  start={wordCount(HERO.titleLead)}
                  gradient
                />
              </h1>

              <div className="hero-seq">
                <p className="t-lede mt-6 max-w-[40ch] text-slate-300">
                  {HERO.lede.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <CTAButton href={HERO.primaryCta.href} size="lg">
                    {HERO.primaryCta.label}
                  </CTAButton>
                </div>
              </div>
            </div>

            <div className="demo-in min-w-0">
              <ProductWalkthrough />
            </div>
          </div>
        </Container>
      </Section>

      {/* Trust rail ------------------------------------------------------
          The logos, then customers telling it on video, then the same claim
          as a number. The band winds up as it
          arrives; the figures render at their final value on the server, so a
          visitor who lands mid-page never sees a number that is briefly wrong. */}
      <Section tone="white" labelledBy="trust-heading">
        <Container>
          <h2
            id="trust-heading"
            className="t-eyebrow mb-8 text-center text-slate-400"
          >
            Trusted by leading organizations
          </h2>
        </Container>

        <LogoMarquee />

        {/* Customer stories, set as outmarket.ai sets its row: the player,
            then the title on the left with the lede level with its last line
            on the right, then the strip that picks what plays. */}
        <Container className="mt-20 sm:mt-24">
          <StoryReel
            stories={STORIES.items}
            pendingLabel={STORIES.pendingLabel}
          >
            <div className="reveal mt-12 grid items-end gap-5 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
              <div>
                <h2 id="stories-heading" className="t-h2">
                  {STORIES.titleLead}{" "}
                  <span className="t-gradient-dark block">
                    {STORIES.titleAccent}
                  </span>
                </h2>
              </div>
              <p className="text-[1.0625rem] leading-relaxed text-slate-600 lg:text-right">
                {STORIES.lede}
              </p>
            </div>
          </StoryReel>
        </Container>

        <Container className="mt-16">
          <p className="reveal t-eyebrow mb-10 text-center text-slate-400">
            {TRUST_STATS.eyebrow}
          </p>
          <StatBand tone="light" stats={TRUST_STATS.stats} />
        </Container>
      </Section>

      {/* Open enrollment -------------------------------------------------
          The crunch, then the three problems TruHu takes on. */}
      <Section tone="dark" id="workload" ambient labelledBy="workload-heading">
        <Container>
          <SectionHeading
            id="workload-heading"
            tone="light"
            align="center"
            title={
              <>
                {WORKLOAD.titleLead}{" "}
                <span className="t-gradient">{WORKLOAD.titleAccent}</span>
              </>
            }
            lede={WORKLOAD.lede}
          />

          {/* Three problems. Each card comes down into place, then its
              inputs, chores or casualties land on it in no set order, so the
              mess reads before a word does. What a
              client never gets at all is drawn as an empty, dashed slot. */}
          <FillIn className="mt-12 grid gap-6 lg:grid-cols-3">
            {WORKLOAD.problems.map((item) => (
              <li
                key={item.problem}
                className="card-shape-lg border border-white/10 bg-white/[0.035] p-7 sm:p-9 lg:p-8"
              >
                <p className="t-eyebrow text-slate-400">{WORKLOAD.todayLabel}</p>
                {/* Two lines held side by side, so a title that fits on one
                    does not pull its card's copy out of line with the rest. */}
                <h3 className="t-h3 mt-3 text-white sm:text-[1.875rem] lg:min-h-[2lh]">
                  {item.problem}
                </h3>
                <p className="mt-2 text-[1.0625rem] text-slate-300">
                  {item.detail}
                </p>
                <ul className="mt-7 flex flex-wrap gap-2">
                  {item.pieces.map((piece) => (
                    <li
                      key={piece}
                      data-piece
                      className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[0.8125rem] font-semibold text-white/65"
                    >
                      {piece}
                    </li>
                  ))}
                  {("missing" in item ? item.missing : []).map((piece) => (
                    <li
                      key={piece}
                      data-piece
                      className="rounded-lg border border-dashed border-white/20 px-3 py-1.5 text-[0.8125rem] font-semibold text-white/40"
                    >
                      {piece}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </FillIn>

        </Container>
      </Section>

      {/* What TruHu does --------------------------------------------------
          The answer to the three problems above, card for card in the same
          layout: each "Today" becomes "With TruHu", and the slots a client
          never got come back filled. On light, after the dark crunch. The
          mechanics are one click away on /advisor. */}
      <Section tone="paper" id="solution" labelledBy="solution-heading">
        <Container>
          <SectionHeading
            id="solution-heading"
            align="center"
            title={
              <>
                {SOLUTION.titleLead}{" "}
                <span className="t-gradient-dark">{SOLUTION.titleAccent}</span>
              </>
            }
            lede={SOLUTION.lede}
            className="reveal max-w-5xl!"
          />

          <FillIn className="mt-10 grid gap-6 lg:mt-12 lg:grid-cols-3">
            {SOLUTION.answers.map((item) => (
              <li
                key={item.answer}
                className="card-shape-lg border border-line bg-white p-7 shadow-[0_18px_40px_-30px_rgba(10,24,38,0.35)] sm:p-9 lg:p-8"
              >
                <p className="t-eyebrow text-green-700">{SOLUTION.withLabel}</p>
                <h3 className="t-h3 mt-3 sm:text-[1.875rem] lg:min-h-[2lh]">
                  {item.answer}
                </h3>
                <p className="mt-2 text-[1.0625rem] text-slate-600">
                  {item.detail}
                </p>
                <ul className="mt-7 flex flex-wrap gap-2">
                  {item.pieces.map((piece) => (
                    <li
                      key={piece}
                      data-piece
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-paper px-3 py-1.5 text-[0.8125rem] font-semibold text-ink/75"
                    >
                      <Check aria-hidden weight="bold" className="size-3.5 text-green-500" />
                      {piece}
                    </li>
                  ))}
                  {("added" in item ? item.added : []).map((piece) => (
                    <li
                      key={piece}
                      data-piece
                      className="inline-flex items-center gap-1.5 rounded-lg border border-green-500/30 bg-green-100 px-3 py-1.5 text-[0.8125rem] font-semibold text-green-700"
                    >
                      <Check aria-hidden weight="bold" className="size-3.5" />
                      {piece}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </FillIn>

          <div className="reveal mt-12 flex justify-center">
            <CTAButton href={SOLUTION.cta.href} size="lg">
              {SOLUTION.cta.label}
            </CTAButton>
          </div>
        </Container>
      </Section>

      {/* How it works ----------------------------------------------------
          The platform above, as five steps that play in turn: files in,
          finished materials out. */}
      <Section tone="white" id="how-it-works" labelledBy="flow-heading">
        <Container>
          <SectionHeading
            id="flow-heading"
            align="center"
            title={
              <>
                {DOCUMENT_FLOW.titleLead}{" "}
                <span className="t-gradient-dark block">
                  {DOCUMENT_FLOW.titleAccent}
                </span>
              </>
            }
            className="reveal max-w-6xl!"
          />

          <div className="reveal mt-10 lg:mt-12">
            <DocumentFlow />
          </div>
        </Container>
      </Section>

      {/* Testimonials ---------------------------------------------------- */}
      <Section tone="white" labelledBy="voices-heading">
        <Container>
          <h2
            id="voices-heading"
            className="t-eyebrow reveal mb-10 text-center text-slate-400"
          >
            {QUOTES_HEADING}
          </h2>
          <div className="reveal">
            <QuoteCarousel
              quotes={QUOTES.map((quote) => ({
                ...quote,
                image: FACES[quote.face],
              }))}
            />
          </div>
        </Container>
      </Section>

      {/* Two products ----------------------------------------------------
          What each one hands back, side by side at equal weight. Nothing
          connects the two cards: they are sold separately. */}
      <Section tone="paper" id="products" labelledBy="products-heading">
        <Container>
          <SectionHeading
            id="products-heading"
            align="center"
            title={PRODUCTS.title}
            className="reveal"
          />

          <ul className="stagger mt-12 grid gap-6 md:grid-cols-2">
            {PRODUCTS.items.map((item, i) => {
              const Preview = PREVIEWS[item.product];
              return (
                <SpotlightCard
                  key={item.product}
                  as="li"
                  tone="paper"
                  padding="none"
                  style={stagger(i)}
                >
                  <div className="flex h-full flex-col">
                    {/* A floor rather than a fixed height: side by side the
                        two previews match, stacked each takes what it needs. */}
                    <div className="flex items-center border-b border-line bg-paper px-5 py-8 sm:px-8 md:min-h-80">
                      <Preview />
                    </div>

                    <div className="flex flex-1 flex-col p-6 sm:p-8">
                      <ProductLockup product={item.product} />
                      <h3 className="t-h3 mt-5">{item.title}</h3>
                      <p className="mt-3 text-[0.9375rem] leading-relaxed text-slate-600">
                        {item.body}
                      </p>
                      <ul
                        aria-label={`What ${item.product} produces`}
                        className="mt-5 flex flex-wrap gap-2"
                      >
                        {item.outputs.map((output) => (
                          <li key={output}>
                            <Pill>{output}</Pill>
                          </li>
                        ))}
                      </ul>
                      {/* The link's box covers the card, so the whole card
                          is the target without nesting interactive content. */}
                      <p className="mt-auto pt-7">
                        <TextLink
                          href={item.href}
                          className="after:absolute after:inset-0"
                        >
                          {item.cta}
                        </TextLink>
                      </p>
                    </div>
                  </div>
                </SpotlightCard>
              );
            })}
          </ul>

          <p className="reveal t-caption mt-8 text-center text-slate-500">
            {PRODUCTS.footnote}
          </p>
        </Container>
      </Section>

      {/* Responsible AI --------------------------------------------------
          The hero promises "enterprise-grade" AI; this is where the page
          backs it up, one line per pillar, with /security
          one click away for the detail. */}
      <Section tone="white" id="responsible-ai" labelledBy="ai-heading">
        <Container>
          <SectionHeading
            id="ai-heading"
            title={
              <>
                {RESPONSIBLE_AI.titleLead}{" "}
                <span className="t-gradient-dark block">
                  {RESPONSIBLE_AI.titleAccent}
                </span>
              </>
            }
            lede={RESPONSIBLE_AI.lede}
            className="reveal"
          />

          <ul className="stagger mt-12 grid gap-x-10 gap-y-10 md:grid-cols-3">
            {RESPONSIBLE_AI.pillars.map((pillar, i) => (
              <li
                key={pillar.name}
                style={stagger(i)}
                className="border-t border-line pt-6"
              >
                <h3 className="t-h4">{pillar.name}</h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-slate-600">
                  {pillar.body}
                </p>
              </li>
            ))}
          </ul>

          <div className="reveal mt-12 flex items-center gap-5">
            <Image
              src={socBadge}
              alt="SOC 2 Type II compliant"
              className="h-16 w-auto"
            />
            <TextLink href={RESPONSIBLE_AI.cta.href}>
              {RESPONSIBLE_AI.cta.label}
            </TextLink>
          </div>
        </Container>
      </Section>

      {/* Close ----------------------------------------------------------- */}
      <CloseCta
        titleLead={CLOSING.titleLead}
        titleAccent={CLOSING.titleAccent}
        lede={CLOSING.lede}
        cta={CLOSING.primaryCta}
      />
    </>
  );
}
