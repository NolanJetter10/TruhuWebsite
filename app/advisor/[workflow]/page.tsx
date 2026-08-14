import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Info } from "@phosphor-icons/react/ssr";
import { MessageThread, MiniGuideCard } from "@/components/art/advisorMedia";
import { LeafMotif } from "@/components/art/Leaf";
import { FAQ } from "@/components/conversion/FAQ";
import { EarlyAccessForm } from "@/components/conversion/forms";
import { CTAButton } from "@/components/ui/CTAButton";
import {
  Card,
  Container,
  Eyebrow,
  Section,
  SectionHeading,
  StatusPill,
  TextLink,
  stagger,
} from "@/components/ui/primitives";
import { getWorkflow, workflowsWithPages } from "@/lib/workflows";

export function generateStaticParams() {
  return workflowsWithPages().map((w) => ({ workflow: w.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ workflow: string }>;
}): Promise<Metadata> {
  const { workflow: slug } = await params;
  const workflow = getWorkflow(slug);
  if (!workflow) return {};
  return {
    title: workflow.name,
    description: workflow.deliverable,
    alternates: { canonical: `/advisor/${slug}` },
  };
}

/** Media exists only for workflows that have actually shipped. */
const MEDIA: Record<string, React.ReactNode> = {
  guides: <MiniGuideCard />,
  communications: <MessageThread />,
};

export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ workflow: string }>;
}) {
  const { workflow: slug } = await params;
  const workflow = getWorkflow(slug);
  if (!workflow || !workflow.slug) notFound();

  const isRoadmap = workflow.status !== "live";
  const media = MEDIA[slug];

  return (
    <>
      <Section tone="navy">
        <LeafMotif className="-top-44 -left-32 h-[660px] w-[360px]" opacity={0.08} flip />
        <Container>
          <div className="hero-seq max-w-3xl">
            <Link
              href="/advisor/workflows"
              className="inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-leaf-400 underline-offset-4 hover:underline"
            >
              <ArrowLeft weight="bold" className="size-3.5" aria-hidden />
              The workflow map
            </Link>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Eyebrow tone="light">Advisor workflow</Eyebrow>
              <StatusPill status={workflow.status} label={workflow.statusLabel} onNavy />
            </div>
            <h1 className="t-display mt-4 text-white">{workflow.name}</h1>
            <p className="t-lede measure mt-6 text-muted-300">
              {workflow.deliverable}
            </p>
          </div>
        </Container>
      </Section>

      {isRoadmap ? (
        <Section tone="white" size="tight">
          <Container>
            <div className="card-shape flex gap-4 border border-amber-500/30 bg-amber-500/5 p-5 sm:p-6">
              <Info weight="fill" className="mt-0.5 size-5 shrink-0 text-amber-500" aria-hidden />
              <div>
                <p className="t-h4">This page describes planned capability.</p>
                <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-grey-700">
                  {workflow.statusLabel === "Early access"
                    ? "It is in early access with a small group of brokerages."
                    : "It has not shipped. Everything below is what we intend to build, and what brokerages told us the deliverable has to contain."}
                </p>
              </div>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Today vs TruHu ---------------------------------------------------- */}
      <Section tone={isRoadmap ? "section" : "white"} labelledBy="today-heading">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="reveal">
              <SectionHeading
                id="today-heading"
                eyebrow="How it is built today"
                title="The Manual Process, Described Accurately"
              />
              <ol className="mt-8 space-y-4">
                {workflow.builtToday.map((line, i) => (
                  <li key={line} className="flex gap-4">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-tint-100 text-[11px] font-bold text-navy-700 tabular">
                      {i + 1}
                    </span>
                    <span className="text-[0.9375rem] leading-relaxed text-grey-700">
                      {line}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {media ? (
              <div className="reveal-media lg:pt-12">{media}</div>
            ) : (
              <Card tone="tint" className="lg:mt-12">
                <p className="t-h4">No screenshot here</p>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-grey-700">
                  We do not show product imagery for a workflow that has not
                  shipped. When it does, the real thing goes here.
                </p>
                <p className="mt-5">
                  <TextLink href="/advisor/workflows">See what has shipped</TextLink>
                </p>
              </Card>
            )}
          </div>
        </Container>
      </Section>

      {/* What TruHu does ----------------------------------------------------- */}
      <Section tone={isRoadmap ? "white" : "section"} labelledBy="truhu-heading">
        <Container>
          <SectionHeading
            id="truhu-heading"
            eyebrow="What TruHu does"
            title={isRoadmap ? "What It Will Do" : "What Advisor Does Instead"}
          />
          <ul className="stagger mt-10 grid gap-4 md:grid-cols-2">
            {workflow.truhuDoes.map((line, i) => (
              <Card as="li" key={line} style={stagger(i)} className="flex gap-3.5">
                <Check weight="bold" className="mt-1 size-4 shrink-0 text-green-600" aria-hidden />
                <span className="text-[0.9375rem] leading-relaxed text-grey-700">
                  {line}
                </span>
              </Card>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Human control -------------------------------------------------------- */}
      <Section tone={isRoadmap ? "section" : "white"} labelledBy="control-heading">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-20">
            <SectionHeading
              id="control-heading"
              eyebrow="Human control"
              title="What a Person Still Owns"
            />
            <ul className="stagger space-y-3">
              {workflow.humanControl.map((line, i) => (
                <li
                  key={line}
                  style={stagger(i)}
                  className="card-shape flex gap-3.5 border border-border-200 bg-white p-5"
                >
                  <Check weight="bold" className="mt-1 size-4 shrink-0 text-blue-500" aria-hidden />
                  <span className="text-[0.9375rem] leading-relaxed text-grey-700">
                    {line}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* FAQ -------------------------------------------------------------------- */}
      {workflow.faqs.length ? (
        <Section tone={isRoadmap ? "white" : "section"} labelledBy="wf-faq-heading">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[minmax(0,300px)_1fr] lg:gap-16">
              <SectionHeading id="wf-faq-heading" eyebrow="Questions" title="Worth Asking" />
              <FAQ items={workflow.faqs} />
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Close -------------------------------------------------------------------- */}
      <Section tone="navy" size="loose">
        <LeafMotif className="-top-32 -right-32 h-[620px] w-[340px]" opacity={0.08} />
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="t-h1 text-white">
              {workflow.status === "live" ? (
                <>
                  See it built on{" "}
                  <span className="text-green-500">one of your own clients.</span>
                </>
              ) : (
                <>
                  Shape <span className="text-green-500">what ships next.</span>
                </>
              )}
            </h2>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <CTAButton href="/contact" size="lg">
                Book a demo
              </CTAButton>
              <CTAButton href="/advisor/workflows" variant="onNavySecondary" size="lg">
                Back to the map
              </CTAButton>
            </div>
          </div>

          {workflow.status !== "live" ? (
            <Card tone="navy" className="mx-auto mt-12 max-w-xl">
              <p className="t-h4 text-white">Want it sooner?</p>
              <p className="mt-2 text-[0.9375rem] text-muted-300">
                Early access shapes the order we build in.
              </p>
              <div className="mt-5">
                <EarlyAccessForm workflow={workflow.name} tone="dark" />
              </div>
            </Card>
          ) : null}

          <p className="mx-auto mt-12 max-w-2xl text-center text-[0.9375rem] leading-relaxed text-white/50">
            Advisor produces and publishes this. Reaching an employee with no
            work email, and recording that you did, is{" "}
            <Link
              href="/workforce"
              className="text-leaf-400 underline underline-offset-4"
            >
              TruHu Workforce
            </Link>
            , sold separately.
          </p>
        </Container>
      </Section>
    </>
  );
}
