import type { Metadata } from "next";
import Image, { type StaticImageData } from "next/image";
import { CloseCta } from "@/components/layout/CloseCta";
import { Words, wordCount } from "@/components/ui/Words";
import {
  Container,
  Section,
  SectionHeading,
  stagger,
} from "@/components/ui/primitives";
import { ABOUT_PAGE } from "@/lib/content";
import team01 from "@/public/images/team/01.webp";
import team02 from "@/public/images/team/02.webp";
import team03 from "@/public/images/team/03.webp";

const { hero, mission, beliefs, team, close } = ABOUT_PAGE;

/** One photo per team slot, by position. Pete's, the first, is still to come. */
const TEAM_PHOTOS: (StaticImageData | undefined)[] = [
  undefined,
  team01,
  team02,
  team03,
];

export const metadata: Metadata = {
  title: "About",
  description: mission.body,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
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
          </div>
        </Container>
      </Section>

      {/* Our mission -------------------------------------------------------- */}
      <Section tone="paper" size="loose" labelledBy="mission-heading">
        <Container>
          <div className="reveal mx-auto max-w-4xl text-center">
            <h2 id="mission-heading" className="t-eyebrow text-blue-700">
              {mission.label}
            </h2>
            <p className="t-h2 mt-6">{mission.body}</p>
          </div>
        </Container>
      </Section>

      {/* What we believe ---------------------------------------------------- */}
      <Section tone="white" labelledBy="beliefs-heading">
        <Container>
          <SectionHeading
            id="beliefs-heading"
            title={beliefs.title}
            className="reveal"
          />

          <ol className="stagger mt-12 grid gap-x-10 gap-y-12 md:grid-cols-3">
            {beliefs.items.map((item, i) => (
              <li
                key={item.name}
                style={stagger(i)}
                className="border-t border-line pt-6"
              >
                <p aria-hidden className="t-eyebrow tabular text-green-700">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="t-h3 mt-4">{item.name}</h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-slate-600">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* Our team ----------------------------------------------------------- */}
      <Section tone="paper" labelledBy="team-heading">
        <Container>
          <SectionHeading
            id="team-heading"
            title={team.title}
            lede={team.lede}
            className="reveal"
          />

          <ul className="stagger mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: team.slots }, (_, i) => {
              const person = team.people[i];
              const photo = TEAM_PHOTOS[i];
              return (
                <li
                  key={i}
                  style={stagger(i)}
                  className="card-shape border border-line bg-white p-5"
                >
                  {photo ? (
                    // The name sits right below, so the photo adds nothing
                    // for a screen reader.
                    <Image
                      src={photo}
                      alt=""
                      placeholder="blur"
                      sizes="(min-width: 1024px) 18rem, (min-width: 640px) 50vw, 100vw"
                      className="card-shape-sm aspect-[4/5] h-auto w-full object-cover"
                    />
                  ) : (
                    <div className="card-shape-sm grid aspect-[4/5] place-items-center border border-dashed border-slate-300 bg-paper text-sm text-slate-400">
                      Photo
                    </div>
                  )}
                  {/* Filled and empty slots share heights so the row lines up. */}
                  {person ? (
                    <>
                      <h3 className="t-h3 mt-5 flex h-8 items-center">
                        {person.name}
                      </h3>
                      <p className="t-eyebrow mt-2 flex h-7 items-center text-blue-700">
                        {person.role}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="mt-5 flex h-8 items-center rounded-md border border-dashed border-slate-300 px-3 text-sm text-slate-400">
                        Name
                      </div>
                      <div className="mt-2 flex h-7 w-2/3 items-center rounded-md border border-dashed border-slate-300 px-3 text-xs text-slate-400">
                        Role
                      </div>
                    </>
                  )}
                  <div className="mt-4 flex h-20 items-start rounded-md border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-400">
                    Short bio
                  </div>
                </li>
              );
            })}
          </ul>
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
