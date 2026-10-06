import type { Icon } from "@phosphor-icons/react";
import {
  ArrowCounterClockwise,
  ArrowRight,
  Check,
  ListChecks,
  Sparkle,
  User,
} from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import { PlatformFactory } from "@/components/demos/PlatformFactory";
import { PlatformFlow } from "@/components/demos/PlatformFlow";
import { CloseCta } from "@/components/layout/CloseCta";
import { CTAButton, TextLink } from "@/components/ui/CTAButton";
import { DropIn } from "@/components/ui/DropIn";
import { Words, wordCount } from "@/components/ui/Words";
import {
  Container,
  Section,
  SectionHeading,
  cx,
  stagger,
} from "@/components/ui/primitives";
import { TECH_PAGE, type TechRole } from "@/lib/content";
import socBadge from "@/public/images/soc-badge.svg";

const { hero, roles, pipeline, lifecycle, factory, security, close } = TECH_PAGE;

export const metadata: Metadata = {
  title: "Technology",
  description: hero.lede,
  alternates: { canonical: "/technology" },
};

/** One colour per step type, used in the legend and on every stage. */
const ROLE_STYLE: Record<TechRole, { icon: Icon; chip: string }> = {
  ai: { icon: Sparkle, chip: "bg-blue-100 text-blue-700 ring-blue-500/20" },
  rules: { icon: ListChecks, chip: "bg-paper text-ink-800 ring-line" },
  you: { icon: User, chip: "bg-green-100 text-green-700 ring-green-500/25" },
};

function RoleChip({ role }: { role: TechRole }) {
  const { icon: RoleIcon, chip } = ROLE_STYLE[role];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] leading-none font-semibold ring-1 ring-inset",
        chip,
      )}
    >
      <RoleIcon aria-hidden weight="bold" className="size-3.5" />
      {roles[role].label}
    </span>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="tabular grid size-7 place-items-center rounded-full bg-green-700 text-[12px] font-bold text-white">
      {n}
    </span>
  );
}

/** The arrow from one card to the next, centred in a gap-5 gutter and level
 *  with the step numbers of p-6 cards. Only drawn once the row is one line. */
function FlowArrow() {
  return (
    <span
      aria-hidden
      className="absolute top-[38px] -right-2.5 z-[1] hidden size-7 translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-slate-400 shadow-[0_1px_2px_rgba(10,24,38,0.06)] lg:grid"
    >
      <ArrowRight weight="bold" className="size-3.5" />
    </span>
  );
}

export default function TechnologyPage() {
  return (
    <>
      {/* Hero ---------------------------------------------------------------
          The claim on the left, the platform walking one question through
          its layers on the right. */}
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
                <Words
                  text={hero.titleAccent}
                  start={wordCount(hero.titleLead)}
                  gradient
                />
              </h1>

              <div className="hero-seq">
                <p className="t-lede measure mt-6 text-slate-300">{hero.lede}</p>
                <ul className="mt-7 flex flex-wrap gap-2">
                  {hero.badges.map((badge) => (
                    <li
                      key={badge}
                      className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1 text-[0.8125rem] font-semibold text-white/80"
                    >
                      {badge}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap gap-3">
                  <CTAButton href={hero.primaryCta.href} size="lg">
                    {hero.primaryCta.label}
                  </CTAButton>
                </div>
              </div>
            </div>

            <div className="demo-in min-w-0">
              <PlatformFlow />
            </div>
          </div>
        </Container>
      </Section>

      {/* Hybrid workflows ----------------------------------------------------
          Ensemble's three step types, then an Advisor guide run through them.
          The key sits above so the tags read before the stages do; each stage
          names who runs it in its footer, out of the way of the step itself. */}
      <Section tone="white" id="pipeline" labelledBy="pipeline-heading">
        <Container>
          <SectionHeading
            id="pipeline-heading"
            title={pipeline.title}
            lede={pipeline.lede}
            className="reveal"
          />

          <dl className="reveal mt-10 grid gap-x-10 gap-y-5 border-y border-line py-6 sm:grid-cols-3">
            {(Object.keys(roles) as TechRole[]).map((role) => (
              <div key={role} className="flex items-center gap-3 sm:block">
                <dt className="shrink-0">
                  <RoleChip role={role} />
                </dt>
                <dd className="text-[0.9375rem] leading-snug text-slate-600 sm:mt-2.5">
                  {roles[role].blurb}
                </dd>
              </div>
            ))}
          </dl>

          <p className="reveal t-eyebrow mt-12 text-slate-400">
            {pipeline.caption}
          </p>
          <DropIn className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {pipeline.stages.map((stage, i) => (
              <li
                key={stage.name}
                className="card-shape relative flex flex-col border border-line bg-white p-6"
              >
                <StepNumber n={i + 1} />
                <h3 className="t-h3 mt-5">{stage.name}</h3>
                <p className="mt-1.5 text-[0.9375rem] leading-snug text-slate-600">
                  {stage.summary}
                </p>
                <ul className="mt-5 mb-6 space-y-2.5">
                  {stage.facts.map((fact) => (
                    <li
                      key={fact}
                      className="flex gap-2.5 text-[0.875rem] leading-snug text-slate-600"
                    >
                      <Check
                        aria-hidden
                        weight="bold"
                        className="mt-0.5 size-3.5 shrink-0 text-green-700"
                      />
                      {fact}
                    </li>
                  ))}
                </ul>
                <p className="mt-auto flex flex-wrap gap-1.5 border-t border-line pt-4">
                  <span className="sr-only">Run by:</span>
                  {stage.roles.map((role) => (
                    <RoleChip key={role} role={role} />
                  ))}
                </p>
                {i < pipeline.stages.length - 1 ? <FlowArrow /> : null}
              </li>
            ))}
          </DropIn>
        </Container>
      </Section>

      {/* Lifecycle ------------------------------------------------------------
          Why TruHu improves faster: the lifecycle Ensemble provides, drawn as
          the loop it is. The return path under the row only shows where the
          five steps sit side by side. */}
      <Section tone="paper" id="lifecycle" labelledBy="lifecycle-heading">
        <Container>
          <SectionHeading
            id="lifecycle-heading"
            title={lifecycle.title}
            lede={lifecycle.lede}
            className="reveal"
          />

          <div className="mt-12">
            <DropIn className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {lifecycle.steps.map((step, i) => (
                <li
                  key={step.name}
                  className="card-shape relative border border-line bg-white p-6"
                >
                  <StepNumber n={i + 1} />
                  <h3 className="t-h4 mt-5">{step.name}</h3>
                  <p className="mt-2 text-[0.875rem] leading-snug text-slate-600">
                    {step.body}
                  </p>
                  {i < lifecycle.steps.length - 1 ? <FlowArrow /> : null}
                </li>
              ))}
            </DropIn>

            {/* The return path, from Improve back to Build. Its ends sit under
                the first and last card centres: 10% of the row, less the
                share of the four 20px gutters. */}
            <div
              aria-hidden
              className="reveal relative mx-[calc(10%-8px)] hidden h-10 rounded-b-2xl border-x border-b border-dashed border-blue-500/45 lg:block"
            >
              <span className="absolute -top-1 -left-[5px] size-0 border-x-[5px] border-b-[7px] border-x-transparent border-b-blue-500/60" />
              <span className="t-eyebrow absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-paper px-3 text-blue-700">
                {lifecycle.loop}
              </span>
            </div>
          </div>

          <p className="reveal mt-10 flex items-center gap-3 text-[0.9375rem] text-slate-600">
            <ArrowCounterClockwise
              aria-hidden
              weight="bold"
              className="size-5 shrink-0 text-green-700"
            />
            {lifecycle.note}
          </p>
        </Container>
      </Section>

      {/* The factory ----------------------------------------------------------
          Why building on a platform serves partners faster, as the factory
          analogy: the platform, one stage inside a line, and a second line
          built from the first one's stages. The title stands alone, and the
          whole section is sized to sit on one screen. */}
      <Section
        tone="white"
        size="tight"
        className="lg:py-20"
        labelledBy="factory-heading"
      >
        <Container>
          <h2 id="factory-heading" className="t-h2 reveal max-w-4xl">
            {factory.title}
          </h2>
          <div className="reveal mt-9 lg:mt-10">
            <PlatformFactory />
          </div>
        </Container>
      </Section>

      {/* Security & governance ------------------------------------------------ */}
      <Section tone="paper" labelledBy="tech-security-heading">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-20">
            <div>
              <SectionHeading
                id="tech-security-heading"
                title={security.title}
                className="reveal"
              />
              <div className="reveal mt-8 flex items-center gap-5">
                <Image
                  src={socBadge}
                  alt="SOC 2 Type II compliant"
                  className="h-16 w-auto"
                />
                <dl className="space-y-1.5">
                  {security.certs.map((cert) => (
                    <div key={cert.owner} className="text-[0.875rem]">
                      <dt className="t-eyebrow text-slate-400">{cert.owner}</dt>
                      <dd className="font-semibold text-ink">{cert.names}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <p className="reveal mt-8">
                <TextLink href={security.cta.href}>{security.cta.label}</TextLink>
              </p>
            </div>

            <ul className="stagger grid gap-x-10 gap-y-10 sm:grid-cols-2">
              {security.items.map((item, i) => (
                <li
                  key={item.name}
                  style={stagger(i)}
                  className="border-t border-line pt-6"
                >
                  <h3 className="t-h4">{item.name}</h3>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-slate-600">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
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
