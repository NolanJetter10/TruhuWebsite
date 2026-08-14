import { Plus } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/primitives";

/**
 * Built on <details>, so the answers are in the DOM for search and for anyone
 * without JavaScript, and the open/close height animation is the browser's own
 * ::details-content transition rather than a library.
 */
export function FAQ({
  items,
  className,
  schema = true,
}: {
  items: { q: string; a: string }[];
  className?: string;
  schema?: boolean;
}) {
  return (
    <div className={cx("divide-y divide-border-200 border-y border-border-200", className)}>
      {items.map((item) => (
        <details key={item.q} className="group">
          <summary className="flex cursor-pointer list-none items-start gap-4 py-5 [&::-webkit-details-marker]:hidden">
            <span className="t-h4 flex-1 text-ink-900 group-hover:text-navy-700">
              {item.q}
            </span>
            <Plus
              weight="bold"
              className="mt-0.5 size-4 shrink-0 text-blue-500 transition-transform duration-300 group-open:rotate-45"
              aria-hidden
            />
          </summary>
          <div className="measure pb-6 text-[0.9375rem] leading-relaxed text-grey-700">
            {item.a}
          </div>
        </details>
      ))}

      {schema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: items.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: { "@type": "Answer", text: item.a },
              })),
            }),
          }}
        />
      ) : null}
    </div>
  );
}
