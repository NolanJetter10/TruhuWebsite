import Link from "next/link";
import { ShieldCheck } from "@phosphor-icons/react/ssr";
import { FOOTER_NAV, SITE } from "@/lib/site";
import { Logo } from "@/components/art/Logo";
import { Container } from "@/components/ui/primitives";

export function SiteFooter() {
  return (
    <footer className="border-t border-border-200 bg-section">
      <Container className="py-12 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[260px_1fr] lg:gap-16">
          <div>
            <Logo />
            <p className="mt-4 max-w-[34ch] text-[0.9375rem] leading-relaxed text-grey-700">
              Two products for benefits brokers. Sold separately.
            </p>
            <p className="t-caption mt-5 flex items-center gap-2 text-grey-500">
              <ShieldCheck weight="fill" className="size-4 text-green-600" aria-hidden />
              SOC 2 Type II
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {FOOTER_NAV.map((column) => (
              <div key={column.heading}>
                <p className="t-caption font-semibold text-ink-900 uppercase">
                  {column.heading}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="text-[0.8125rem] leading-snug text-grey-700 underline-offset-4 hover:text-navy-900 hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border-200 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="t-caption text-grey-500">
            © 2026 {SITE.legalName}
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              { href: "/security", label: "Privacy" },
              { href: "/security", label: "Terms" },
              { href: "/security#subprocessors", label: "Subprocessors" },
              { href: "/security#responsible-ai", label: "Responsible AI" },
            ].map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="t-caption text-grey-500 underline-offset-4 hover:text-navy-900 hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
