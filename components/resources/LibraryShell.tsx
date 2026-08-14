import Link from "next/link";
import { ResourceGrid } from "@/components/resources/ResourceGrid";
import { CloseCta } from "@/components/layout/CloseCta";
import { SpotlightCard } from "@/components/ui/Spotlight";
import { Words } from "@/components/ui/Words";
import {
  Container,
  SampleTag,
  Section,
  SectionHeading,
  cx,
  stagger,
} from "@/components/ui/primitives";
import { RESOURCES_PAGE } from "@/lib/content";
import {
  DOWNLOADS,
  KIND_ORDER,
  RESOURCE_KINDS,
  type ResourceKind,
} from "@/lib/resources";

const { eyebrow, kinds, downloads, close } = RESOURCES_PAGE;

/**
 * The shell both library routes share. The blog/case-studies switch is a pair
 * of links rather than a tab control: each half is its own page now, so the
 * browser's own history and the nav menu stay in agreement.
 */
export function LibraryShell({ kind }: { kind: ResourceKind }) {
  const hero = kinds[kind];
  const activeIndex = KIND_ORDER.indexOf(kind);

  return (
    <>
      {/* Hero ------------------------------------------------------------- */}
      <Section tone="dark" ambient pointer size="tight" className="pt-20 sm:pt-24">
        <Container>
          <div className="max-w-3xl py-8">
            <p
              className="t-eyebrow inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-blue-400 backdrop-blur-sm"
              style={{ animation: "hero-in 700ms var(--ease-out-expo) both" }}
            >
              <span className="size-1.5 rounded-full bg-green-400 anim-pulse" />
              {eyebrow}
            </p>

            <h1 className="t-h1 mt-6 text-white">
              <Words text={hero.title} />
            </h1>

            <div className="hero-seq">
              <p className="t-lede measure mt-6 text-slate-300">{hero.lede}</p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Library ---------------------------------------------------------- */}
      <Section tone="paper" ambient>
        <Container>
          {/* One indicator that slides between the two, rather than a
              background per link. */}
          <nav
            aria-label="Resource type"
            className="relative grid w-[21rem] max-w-full grid-cols-2 rounded-full border border-line bg-white p-1"
          >
            <span
              aria-hidden
              className="absolute inset-y-1 left-1 rounded-full bg-ink-950 transition-transform duration-[450ms]"
              style={{
                width: "calc(50% - 0.25rem)",
                transform: `translateX(${activeIndex * 100}%)`,
                transitionTimingFunction: "var(--ease-out-expo)",
              }}
            />
            {KIND_ORDER.map((key) => {
              const active = key === kind;
              return (
                <Link
                  key={key}
                  href={RESOURCE_KINDS[key].path}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "relative z-[1] rounded-full px-5 py-2 text-center text-[0.9375rem] font-semibold transition-colors duration-300",
                    active ? "text-white" : "text-slate-600 hover:text-ink",
                  )}
                >
                  {RESOURCE_KINDS[key].label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-10">
            <ResourceGrid kind={kind} />
          </div>
        </Container>
      </Section>

      {/* Downloads -------------------------------------------------------- */}
      <Section tone="white" labelledBy="downloads-heading">
        <Container>
          <SectionHeading
            id="downloads-heading"
            eyebrow={downloads.eyebrow}
            title={downloads.title}
            lede={downloads.lede}
          />

          <ul className="stagger mt-12 grid gap-6 sm:grid-cols-2">
            {DOWNLOADS.map((doc, i) => (
              <SpotlightCard
                key={doc.title}
                as="li"
                style={stagger(i)}
                className="group flex items-start gap-5"
              >
                {/* Stands in for the file thumbnail until real documents exist. */}
                <span
                  aria-hidden
                  className="card-shape-sm grid size-12 shrink-0 place-items-center border border-line bg-paper text-[0.6875rem] font-bold tracking-wider text-slate-600"
                >
                  {doc.format}
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="t-h4 text-ink">{doc.title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-slate-600">
                    {doc.blurb}
                  </p>
                  <p className="t-caption mt-4 flex items-center gap-2 text-slate-400">
                    <span>
                      {doc.format} · {doc.meta}
                    </span>
                    <span aria-hidden>·</span>
                    <SampleTag>File coming soon</SampleTag>
                  </p>
                </div>
              </SpotlightCard>
            ))}
          </ul>
        </Container>
      </Section>

      <CloseCta
        titleLead={close.titleLead}
        titleAccent={close.titleAccent}
        lede={close.lede}
        cta={close.cta}
      />
    </>
  );
}
