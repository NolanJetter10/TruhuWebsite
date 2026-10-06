import type { Icon } from "@phosphor-icons/react";
import {
  Buildings,
  Check,
  ClockCounterClockwise,
  Database,
  EyeSlash,
  Key,
  ListChecks,
  LockKey,
  LockSimple,
  MagnifyingGlass,
  Password,
  Prohibit,
  Pulse,
  SealCheck,
  Timer,
  Trash,
  UploadSimple,
  User,
  UserMinus,
} from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import { CloseCta } from "@/components/layout/CloseCta";
import { CTAButton, TextLink } from "@/components/ui/CTAButton";
import { FallIn } from "@/components/ui/FallIn";
import { Faq } from "@/components/ui/Faq";
import { SpotlightCard } from "@/components/ui/Spotlight";
import { Words, wordCount } from "@/components/ui/Words";
import {
  Card,
  Container,
  Section,
  SectionHeading,
  stagger,
} from "@/components/ui/primitives";
import { SECURITY_PAGE } from "@/lib/content";
import socBadge from "@/public/images/soc-badge.svg";

const { hero, glance, protection, ai, access, privacy, compliance, faq, close } =
  SECURITY_PAGE;

export const metadata: Metadata = {
  title: "Security",
  description: hero.lede,
  alternates: { canonical: "/security" },
};

const PROTECTION_ICONS: Record<(typeof protection.items)[number]["key"], Icon> = {
  encryption: LockKey,
  isolation: Buildings,
  secrets: Key,
  sessions: Timer,
  private: EyeSlash,
  gated: Password,
};

const STEP_ICONS: Record<(typeof ai.steps)[number]["key"], Icon> = {
  upload: UploadSimple,
  read: MagnifyingGlass,
  build: ListChecks,
  review: User,
  record: ClockCounterClockwise,
};

const COMMITMENT_ICONS: Record<(typeof ai.commitments)[number]["key"], Icon> = {
  training: Prohibit,
  retention: Trash,
  locked: LockSimple,
  monitored: Pulse,
};

const CONTROL_ICONS: Record<(typeof access.controls)[number]["key"], Icon> = {
  offboarding: UserMinus,
  audit: ListChecks,
  versions: ClockCounterClockwise,
  record: Database,
};

function MailLink({ label, email }: { label: string; email: string }) {
  return (
    <div>
      <p className="t-eyebrow text-slate-400">{label}</p>
      <a
        href={`mailto:${email}`}
        className="mt-1.5 inline-block font-semibold text-blue-700 underline-offset-4 hover:underline"
      >
        {email}
      </a>
    </div>
  );
}

/** The hero's right-hand panel: the audits, then the lines a reviewer checks
 *  first. Static on purpose; the page is read, not demoed. */
function Glance() {
  return (
    <div className="card-shape-lg border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm sm:p-8">
      <div className="flex items-center gap-5">
        <Image
          src={socBadge}
          alt="AICPA SOC 2 Type II compliant"
          className="h-20 w-auto shrink-0"
        />
        <div>
          <p className="t-eyebrow text-blue-400">{glance.eyebrow}</p>
          <p className="t-h3 mt-1.5 text-white">{glance.title}</p>
        </div>
      </div>

      <dl className="mt-7 divide-y divide-white/10 border-y border-white/10">
        {glance.certs.map((cert) => (
          <div
            key={`${cert.owner} ${cert.name}`}
            className="flex items-baseline justify-between gap-4 py-3"
          >
            <dt className="text-[0.875rem] text-white/55">{cert.owner}</dt>
            <dd className="text-right text-[0.875rem] font-semibold text-white">
              {cert.name}
            </dd>
          </div>
        ))}
      </dl>

      <ul className="mt-7 space-y-3.5">
        {glance.commitments.map((line) => (
          <li
            key={line}
            className="flex gap-3 text-[0.9375rem] leading-snug text-slate-200"
          >
            <span className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-green-500/15 text-green-400">
              <Check aria-hidden weight="bold" className="size-3" />
            </span>
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SecurityPage() {
  return (
    <>
      {/* Hero ---------------------------------------------------------------
          The claim on the left, the audit summary a reviewer looks for on
          the right. */}
      <Section tone="dark" ambient pointer>
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-16">
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
                <div className="mt-8 flex flex-wrap gap-3">
                  <CTAButton href={hero.primaryCta.href} size="lg">
                    {hero.primaryCta.label}
                  </CTAButton>
                  <CTAButton
                    href={hero.secondaryCta.href}
                    variant="onDark"
                    size="lg"
                  >
                    {hero.secondaryCta.label}
                  </CTAButton>
                </div>
              </div>
            </div>

            <div className="demo-in min-w-0">
              <Glance />
            </div>
          </div>
        </Container>
      </Section>

      {/* Data protection ---------------------------------------------------- */}
      <Section tone="white" id="protection" labelledBy="protection-heading">
        <Container>
          {/* Raised, so the first row falls in behind the lede rather than
              over it. */}
          <SectionHeading
            id="protection-heading"
            title={protection.title}
            lede={protection.lede}
            className="reveal relative z-[1]"
          />

          <FallIn className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {protection.items.map((item) => {
              const ItemIcon = PROTECTION_ICONS[item.key];
              return (
                <SpotlightCard key={item.key} as="li">
                  <span className="grid size-11 place-items-center rounded-xl bg-blue-100 text-blue-700">
                    <ItemIcon aria-hidden weight="duotone" className="size-6" />
                  </span>
                  <h3 className="t-h4 mt-6">{item.name}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-slate-600">
                    {item.body}
                  </p>
                </SpotlightCard>
              );
            })}
          </FallIn>
        </Container>
      </Section>

      {/* AI and your data ---------------------------------------------------
          The question a compliance officer asks first, walked from upload to
          the record it leaves, then the commitments that hold at every step. */}
      <Section tone="dark" ambient id="ai" labelledBy="ai-heading">
        <Container>
          <SectionHeading
            id="ai-heading"
            tone="light"
            title={
              <>
                {ai.titleLead}{" "}
                <span className="t-gradient">{ai.titleAccent}</span>
              </>
            }
            lede={ai.lede}
            className="reveal"
          />

          <ol className="stagger mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
            {ai.steps.map((step, i) => {
              const StepIcon = STEP_ICONS[step.key];
              return (
                <li
                  key={step.key}
                  style={stagger(i)}
                  className="card-shape relative border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid size-7 place-items-center rounded-full bg-green-500 text-[12px] font-bold text-ink-950">
                      {i + 1}
                    </span>
                    <StepIcon
                      aria-hidden
                      weight="duotone"
                      className="size-5 text-blue-400"
                    />
                  </div>
                  <h3 className="t-h4 mt-4 text-white">{step.name}</h3>
                  <p className="mt-2 text-[0.875rem] leading-snug text-slate-300">
                    {step.body}
                  </p>
                  {i < ai.steps.length - 1 ? (
                    <span
                      aria-hidden
                      className="absolute top-1/2 -right-3 z-[1] hidden size-5 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-ink-950 text-[11px] text-white/50 lg:grid"
                    >
                      &rarr;
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ol>

          <ul className="stagger mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {ai.commitments.map((item, i) => {
              const ItemIcon = COMMITMENT_ICONS[item.key];
              return (
                <li
                  key={item.key}
                  style={stagger(i)}
                  className="border-t border-white/15 pt-6"
                >
                  <ItemIcon
                    aria-hidden
                    weight="duotone"
                    className="size-6 text-green-400"
                  />
                  <h3 className="t-h4 mt-4 text-white">{item.name}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-slate-300">
                    {item.body}
                  </p>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>

      {/* Access control -----------------------------------------------------
          Roles per product, side by side, then the controls both share. */}
      <Section tone="paper" id="access" labelledBy="access-heading">
        <Container>
          <SectionHeading
            id="access-heading"
            title={access.title}
            lede={access.lede}
            className="reveal"
          />

          <ul className="stagger mt-12 grid gap-5 lg:grid-cols-2">
            {access.products.map((product, i) => (
              <Card key={product.product} as="li" style={stagger(i)}>
                <p className="t-eyebrow text-blue-700">{product.audience}</p>
                <h3 className="t-h3 mt-2">{product.product}</h3>
                <dl className="mt-6 divide-y divide-line border-y border-line">
                  {product.roles.map((entry) => (
                    <div
                      key={entry.role}
                      className="grid gap-2 py-4 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-5"
                    >
                      <dt>
                        <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-[12px] font-semibold text-blue-700">
                          {entry.role}
                        </span>
                      </dt>
                      <dd className="text-[0.9375rem] leading-relaxed text-slate-600">
                        {entry.body}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="t-caption mt-5 text-slate-500">
                  {product.note}
                </p>
              </Card>
            ))}
          </ul>

          <ul className="stagger mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {access.controls.map((item, i) => {
              const ItemIcon = CONTROL_ICONS[item.key];
              return (
                <li
                  key={item.key}
                  style={stagger(i)}
                  className="border-t border-line pt-6"
                >
                  <ItemIcon
                    aria-hidden
                    weight="duotone"
                    className="size-6 text-green-700"
                  />
                  <h3 className="t-h4 mt-4">{item.name}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-slate-600">
                    {item.body}
                  </p>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>

      {/* Privacy ------------------------------------------------------------ */}
      <Section tone="white" id="privacy" labelledBy="privacy-heading">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] lg:gap-20">
            <div className="lg:self-start">
              <SectionHeading
                id="privacy-heading"
                title={privacy.title}
                lede={privacy.lede}
                className="reveal"
              />
              <div className="reveal mt-8">
                <MailLink
                  label={privacy.contact.label}
                  email={privacy.contact.email}
                />
              </div>
            </div>

            <dl className="stagger grid gap-x-10 gap-y-10 sm:grid-cols-2">
              {privacy.rows.map((row, i) => (
                <div
                  key={row.name}
                  style={stagger(i)}
                  className="border-t border-line pt-6"
                >
                  <dt className="t-h4">{row.name}</dt>
                  <dd className="mt-3 text-[0.9375rem] leading-relaxed text-slate-600">
                    {row.body}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </Section>

      {/* Compliance ---------------------------------------------------------
          What each audit covers, then the regimes stated as they apply,
          including the one that does not. */}
      <Section tone="paper" id="compliance" labelledBy="compliance-heading">
        <Container>
          <SectionHeading
            id="compliance-heading"
            title={compliance.title}
            lede={compliance.lede}
            className="reveal"
          />

          <ul className="stagger mt-12 grid gap-5 md:grid-cols-3">
            {compliance.certs.map((cert, i) => (
              <Card
                key={`${cert.owner} ${cert.name}`}
                as="li"
                style={stagger(i)}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="t-eyebrow text-slate-400">{cert.owner}</p>
                  <SealCheck
                    aria-hidden
                    weight="duotone"
                    className="size-6 shrink-0 text-green-700"
                  />
                </div>
                <h3 className="t-h3 mt-4">{cert.name}</h3>
                <p className="mt-1 text-[0.875rem] font-semibold text-blue-700">
                  {cert.scope}
                </p>
                <p className="mt-4 text-[0.9375rem] leading-relaxed text-slate-600">
                  {cert.body}
                </p>
              </Card>
            ))}
          </ul>

          <p className="reveal mt-8">
            <TextLink href={compliance.report.href}>
              {compliance.report.label}
            </TextLink>
          </p>

          <h3 className="reveal t-eyebrow mt-14 text-slate-400">
            {compliance.postureTitle}
          </h3>
          <dl className="stagger mt-6 grid gap-x-10 gap-y-10 md:grid-cols-3">
            {compliance.posture.map((item, i) => (
              <div
                key={item.name}
                style={stagger(i)}
                className="border-t border-line pt-6"
              >
                <dt className="t-h4">{item.name}</dt>
                <dd className="mt-3 text-[0.9375rem] leading-relaxed text-slate-600">
                  {item.body}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      {/* FAQ ----------------------------------------------------------------
          The hero's second button lands here. One flat two-column list with
          the rows closed, as on /advisor, so the set fits in about half a
          screen. */}
      <Section tone="white" id="security-faq" labelledBy="faq-heading">
        <Container>
          <div className="reveal flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
            <SectionHeading id="faq-heading" title={faq.title} lede={faq.lede} />
            <MailLink label={faq.more.label} email={faq.more.email} />
          </div>

          <div className="mt-10 lg:mt-12">
            <Faq categories={faq.categories} compact />
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
