import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/ssr";
import { LeafMotif } from "@/components/art/Leaf";
import { ResourceForm } from "@/components/conversion/forms";
import { CTAButton } from "@/components/ui/CTAButton";
import {
  Card,
  Container,
  Eyebrow,
  Section,
  SourceNote,
} from "@/components/ui/primitives";
import { RESOURCES, getResource } from "@/lib/content";

export function generateStaticParams() {
  return RESOURCES.map((resource) => ({ slug: resource.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resource = getResource(slug);
  if (!resource) return {};
  return {
    title: resource.title,
    description: resource.dek,
    alternates: { canonical: `/resources/${slug}` },
  };
}

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resource = getResource(slug);
  if (!resource) notFound();

  return (
    <>
      <Section tone="navy" className="overflow-hidden">
        <LeafMotif className="-top-44 -right-32 h-[600px] w-[330px]" opacity={0.08} />
        <Container>
          <div className="hero-seq max-w-3xl">
            <Link
              href="/resources"
              className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-leaf-400 underline-offset-4 hover:underline"
            >
              <ArrowLeft weight="bold" className="size-3.5" aria-hidden />
              All resources
            </Link>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Eyebrow tone="light">{resource.kind}</Eyebrow>
              <span className="t-caption text-white/55">
                {resource.readingTime} read
              </span>
            </div>
            <h1 className="t-h1 mt-4 text-white">{resource.title}</h1>
            <p className="measure mt-6 t-lede text-muted-300">{resource.dek}</p>
          </div>
        </Container>
      </Section>

      <Section tone="white">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:gap-16">
            <article className="prose-truhu">
              {resource.body.map((block, i) => (
                <section key={i} className={i > 0 ? "mt-10" : undefined}>
                  {block.heading ? (
                    <h2 className="t-h3 mb-4">{block.heading}</h2>
                  ) : null}
                  {block.paragraphs.map((p) => (
                    <p key={p} className="t-lede">
                      {p}
                    </p>
                  ))}
                  {block.list ? (
                    <ol className="mt-6 space-y-3">
                      {block.list.map((item, li) => (
                        <li key={item} className="flex gap-3.5">
                          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-tint-100 text-[11px] font-bold text-navy-700 tabular">
                            {li + 1}
                          </span>
                          <span className="text-[1.0625rem] leading-relaxed text-grey-700">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </section>
              ))}

              <SourceNote className="mt-12 border-t border-border-200 pt-6">
                Every figure in the full research carries its source and date.
                Vendor-sourced numbers are labelled as vendor-sourced, and the
                gaps our own verification could not close are stated rather than
                smoothed over.
              </SourceNote>
            </article>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              {resource.gated ? (
                <Card tone="tint">
                  <p className="t-h4">Get the full research</p>
                  <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-grey-700">
                    One email address, one PDF, no drip campaign.
                  </p>
                  <div className="mt-6">
                    <ResourceForm resource={resource.title} />
                  </div>
                </Card>
              ) : (
                <Card tone="tint">
                  <p className="t-h4">See it in the product</p>
                  <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-grey-700">
                    Everything described here is visible in a demo on one of your
                    own client groups.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <CTAButton href="/contact">Book a demo</CTAButton>
                  </div>
                </Card>
              )}
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
