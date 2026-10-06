import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CloseCta } from "@/components/layout/CloseCta";
import { SpotlightCard } from "@/components/ui/Spotlight";
import {
  Container,
  DrawnRule,
  Pill,
  Section,
  stagger,
} from "@/components/ui/primitives";
import { RESOURCES_PAGE } from "@/lib/content";
import {
  RESOURCES_LIBRARY,
  formatResourceDate,
  getResource,
  relatedResources,
} from "@/lib/resources";

const { close, article } = RESOURCES_PAGE;

type Props = { params: Promise<{ slug: string }> };

/** Every entry is known at build time, so all of these prerender. */
export function generateStaticParams() {
  return RESOURCES_LIBRARY.map((resource) => ({ slug: resource.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resource = getResource(slug);
  if (!resource) return {};

  return {
    title: resource.title,
    description: resource.dek,
    alternates: { canonical: `/resources/${resource.slug}` },
    openGraph: {
      type: "article",
      title: resource.title,
      description: resource.dek,
      publishedTime: resource.date,
    },
  };
}

export default async function ResourceArticlePage({ params }: Props) {
  const { slug } = await params;
  const resource = getResource(slug);
  if (!resource) notFound();

  const related = relatedResources(resource);
  const isCase = resource.kind === "case";

  return (
    <>
      {/* Masthead --------------------------------------------------------- */}
      <Section tone="dark" ambient size="tight" className="pt-20 sm:pt-24">
        <Container>
          <div className="mx-auto max-w-3xl py-8">
            <Link
              href="/resources"
              className="group inline-flex items-center gap-2 text-[0.875rem] font-semibold text-slate-300 transition-colors duration-200 hover:text-white"
            >
              <span
                aria-hidden
                className="transition-transform duration-200 group-hover:-translate-x-1"
              >
                &larr;
              </span>
              {article.backLabel}
            </Link>

            <div className="mt-7 flex flex-wrap items-center gap-2">
              <Pill tone="green">{isCase ? "Case study" : "Blog"}</Pill>
              <Pill tone="light">{resource.topic}</Pill>
            </div>

            <h1
              className="t-h1 mt-6 text-white"
              style={{ animation: "hero-in 700ms var(--ease-out-expo) both" }}
            >
              {resource.title}
            </h1>

            <div className="hero-seq">
              <p className="t-lede measure mt-6 text-slate-300">{resource.dek}</p>
              <p className="t-caption mt-8 flex flex-wrap items-center gap-2 text-white/45">
                <span>{resource.author.name}</span>
                <span aria-hidden>·</span>
                <time dateTime={resource.date}>
                  {formatResourceDate(resource.date)}
                </time>
                <span aria-hidden>·</span>
                <span>{resource.readingMinutes} min read</span>
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Body ------------------------------------------------------------- */}
      <Section tone="white">
        <Container>
          <div className="mx-auto max-w-3xl">
            {isCase && resource.client ? (
              <div className="card-shape border border-line bg-paper p-6 sm:p-7">
                <p className="t-eyebrow text-slate-400">Client</p>
                <p className="t-h4 mt-2 text-ink">{resource.client.name}</p>
                <p className="mt-1 text-[0.9375rem] text-slate-600">
                  {resource.client.detail}
                </p>

                {resource.results ? (
                  <dl className="mt-6 grid gap-5 border-t border-line pt-5 sm:grid-cols-3">
                    {resource.results.map((result) => (
                      <div key={result.label}>
                        <dt className="t-caption text-slate-400">
                          {result.label}
                        </dt>
                        <dd className="tabular t-h3 mt-1 text-ink">
                          {result.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </div>
            ) : null}

            <article className={isCase ? "mt-12" : ""}>
              {resource.body.map((section, i) => (
                <section key={section.heading} className={i ? "mt-12" : ""}>
                  <h2 className="t-h3 text-ink">{section.heading}</h2>
                  {section.paragraphs.map((paragraph, j) => (
                    <p
                      key={j}
                      className="measure mt-5 text-[1.0625rem] leading-relaxed text-slate-600"
                    >
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}
            </article>

            <DrawnRule className="mt-14" />
            <p className="t-caption mt-6 text-slate-400">
              Placeholder article. Replace the body in{" "}
              <code className="rounded bg-paper px-1.5 py-0.5">
                lib/resources.ts
              </code>
              .
            </p>
          </div>
        </Container>
      </Section>

      {/* Related ---------------------------------------------------------- */}
      {related.length ? (
        <Section tone="paper" labelledBy="related-heading">
          <Container>
            <h2 id="related-heading" className="t-h2 text-ink">
              {article.relatedTitle}
            </h2>

            <ul className="stagger mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item, i) => (
                <SpotlightCard
                  key={item.slug}
                  as="li"
                  style={stagger(i)}
                  className="group flex flex-col"
                >
                  <Pill>{item.topic}</Pill>
                  <h3 className="t-h4 mt-4 text-ink">
                    <Link
                      href={`/resources/${item.slug}`}
                      className="after:absolute after:inset-0"
                    >
                      {item.title}
                    </Link>
                  </h3>
                  <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-slate-600">
                    {item.dek}
                  </p>
                  <p className="t-caption mt-5 text-slate-400">
                    {item.readingMinutes} min read
                  </p>
                </SpotlightCard>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      <CloseCta
        titleLead={close.titleLead}
        titleAccent={close.titleAccent}
        lede={close.lede}
        cta={close.cta}
      />
    </>
  );
}
