import type { Metadata } from "next";
import Link from "next/link";
import { CloseCta } from "@/components/layout/CloseCta";
import { Faq } from "@/components/ui/Faq";
import { Words, wordCount } from "@/components/ui/Words";
import {
  Container,
  Section,
  SectionHeading,
} from "@/components/ui/primitives";
import { ADVISOR_PAGE, FAQ_PAGE, WORKFORCE_PAGE } from "@/lib/content";

const { hero, jumpLabel, groups, close } = FAQ_PAGE;

/** Both question sets, each still owned by the product page it describes. */
const SETS = [
  { id: "for-brokers", chrome: groups.advisor, faq: ADVISOR_PAGE.faq },
  { id: "for-employers", chrome: groups.workforce, faq: WORKFORCE_PAGE.faq },
] as const;

export const metadata: Metadata = {
  title: "FAQ",
  description: hero.lede,
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
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

              {/* The page runs long by design, so the two audiences are one
                  click apart from the top. */}
              <nav
                aria-label={jumpLabel}
                className="mt-9 flex flex-wrap justify-center gap-3"
              >
                {SETS.map((set) => (
                  <Link
                    key={set.id}
                    href={`#${set.id}`}
                    className="t-eyebrow rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/[0.12]"
                  >
                    {set.chrome.title}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </Container>
      </Section>

      {/* One block per audience -------------------------------------------- */}
      {SETS.map((set, i) => (
        <Section
          key={set.id}
          id={set.id}
          tone={i % 2 === 0 ? "white" : "paper"}
          labelledBy={`${set.id}-heading`}
        >
          <Container>
            <SectionHeading
              id={`${set.id}-heading`}
              title={set.chrome.title}
              lede={set.faq.lede}
              className="reveal"
            />
            <div className="mt-12 max-w-3xl">
              <Faq categories={set.faq.categories} />
            </div>
          </Container>
        </Section>
      ))}

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
