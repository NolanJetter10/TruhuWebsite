import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/ssr";
import { LeafMotif } from "@/components/art/Leaf";
import { CTAButton } from "@/components/ui/CTAButton";
import {
  Card,
  Container,
  Eyebrow,
  Section,
  Chip,
  SourceNote,
} from "@/components/ui/primitives";
import { CASE_STUDIES } from "@/lib/content";

export function generateStaticParams() {
  return CASE_STUDIES.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = CASE_STUDIES.find((s) => s.slug === slug);
  if (!study) return {};
  return {
    title: `${study.org} case study`,
    description: study.summary,
    alternates: { canonical: `/customers/${slug}` },
  };
}

const BLOCKS = [
  { key: "challenge", heading: "The situation" },
  { key: "approach", heading: "What changed" },
  { key: "result", heading: "What happened" },
] as const;

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = CASE_STUDIES.find((s) => s.slug === slug);
  if (!study) notFound();

  return (
    <>
      <Section tone="navy" className="overflow-hidden">
        <LeafMotif className="-top-44 -left-32 h-[620px] w-[340px]" opacity={0.08} flip />
        <Container>
          <div className="hero-seq max-w-3xl">
            <Link
              href="/customers"
              className="inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-leaf-400 underline-offset-4 hover:underline"
            >
              <ArrowLeft weight="bold" className="size-3.5" aria-hidden />
              All customers
            </Link>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Chip tone="light">{study.side}</Chip>
              <Eyebrow tone="light">{study.sector}</Eyebrow>
            </div>
            <h1 className="t-display mt-4 text-white">{study.org}</h1>
            <p className="measure mt-7 t-lede text-muted-300">{study.summary}</p>
          </div>

          {study.headlineStat ? (
            <div className="mt-12 border-t border-white/12 pt-10">
              <p className="t-stat text-green-500">{study.headlineStat.value}</p>
              <p className="mt-4 max-w-[34ch] text-[1.0625rem] font-medium text-white">
                {study.headlineStat.label}
              </p>
              <SourceNote tone="light" className="mt-3 max-w-[48ch]">
                {study.headlineStat.source}
              </SourceNote>
            </div>
          ) : null}
        </Container>
      </Section>

      <Section tone="white">
        <Container>
          <div className="grid gap-10 lg:grid-cols-3">
            {BLOCKS.map((block) => (
              <Card key={block.key} className="flex flex-col">
                <h2 className="t-h3">{block.heading}</h2>
                <ul className="mt-5 space-y-3.5">
                  {study[block.key].map((line) => (
                    <li
                      key={line}
                      className="flex gap-3 text-[0.9375rem] leading-relaxed text-grey-700"
                    >
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-green-500" aria-hidden />
                      {line}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <SourceNote className="mt-10">
            Published with the organisation&rsquo;s permission. Figures are TruHu
            platform data for the named campaign set unless stated otherwise.
          </SourceNote>
        </Container>
      </Section>

      <Section tone="navy" size="loose">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="t-h1 text-white">See it on one of your own groups.</h2>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <CTAButton href="/contact" size="lg">
                Book a demo
              </CTAButton>
              <CTAButton href="/customers" variant="onNavySecondary" size="lg">
                Read another case study
              </CTAButton>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
