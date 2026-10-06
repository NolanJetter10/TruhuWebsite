import type { FaqCategory } from "@/lib/content";

/**
 * The FAQ carried over from truhu.ai, reformatted for this design system:
 * category blocks with native <details> rows. The open/close height animation
 * comes from the global `details::details-content` transition, so this stays a
 * server component with no JavaScript.
 *
 * `compact` drops the category headings and runs every question as one
 * hairline list in two columns: for a product page's closing section, where
 * the grouped set on /faq is a click away.
 */
export function Faq({
  categories,
  compact,
}: {
  categories: readonly FaqCategory[];
  compact?: boolean;
}) {
  if (compact) return <CompactFaq categories={categories} />;

  return (
    <div className="space-y-12">
      {categories.map((category) => (
        <section key={category.title} aria-label={category.title}>
          <h3 className="t-h3">{category.title}</h3>
          <div className="mt-5 space-y-3">
            {category.questions.map((item) => (
              <details
                key={item.q}
                className="card-shape-sm group border border-line bg-white px-5 sm:px-6"
              >
                <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
                  <span className="t-h4">{item.q}</span>
                  <span
                    aria-hidden
                    className="shrink-0 text-lg leading-none text-slate-400 transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="measure pb-5 text-[0.9375rem] leading-relaxed text-slate-600">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function CompactFaq({ categories }: { categories: readonly FaqCategory[] }) {
  const questions = categories.flatMap((category) => category.questions);
  const half = Math.ceil(questions.length / 2);

  // Two independent stacks rather than one two-column grid, so opening a row
  // pushes down only its own column instead of opening a gap beside it. The
  // second column's top rule is desktop-only: stacked on a phone, the first
  // column's last row already draws it.
  return (
    <div className="grid gap-x-14 lg:grid-cols-2">
      {[questions.slice(0, half), questions.slice(half)].map((column, i) => (
        <div key={i} className={i === 0 ? "border-t" : "lg:border-t"}>
          {column.map((item) => (
            <details key={item.q} className="group border-b">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-4 font-display text-base font-semibold tracking-[-0.01em] text-ink transition-colors hover:text-blue-700 [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <svg
                  aria-hidden
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-1 size-4 shrink-0 text-slate-400 transition-transform duration-300 group-open:rotate-180"
                >
                  <path d="m4 6 4 4 4-4" />
                </svg>
              </summary>
              <p className="pr-10 pb-5 text-[0.9375rem] leading-relaxed text-slate-600">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      ))}
    </div>
  );
}
