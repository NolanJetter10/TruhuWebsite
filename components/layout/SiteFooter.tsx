import Link from "next/link";
import { Logo } from "@/components/art/Logo";
import { Container, Pill } from "@/components/ui/primitives";
import { FOOTER_NAV, SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="on-dark relative isolate overflow-hidden bg-ink-950 text-white">
      <div className="grid-field opacity-60" aria-hidden />
      <Container className="relative py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(2,minmax(0,1fr))]">
          <div>
            <Logo tone="light" className="h-7" />
            <p className="measure mt-5 text-[0.9375rem] leading-relaxed text-slate-300">
              <span className="font-semibold text-white">Advisor</span> —
              personalized benefits guides and sites, built from the plan
              documents you already have.
            </p>
            <p className="measure mt-2.5 text-[0.9375rem] leading-relaxed text-slate-300">
              <span className="font-semibold text-white">Workforce</span> — a
              direct line to every employee, at every client, by text.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Pill tone="light">Built from your plan documents</Pill>
              <Pill tone="light">No app, no login</Pill>
            </div>
          </div>

          {FOOTER_NAV.map((group) => (
            <div key={group.heading}>
              <h2 className="t-eyebrow text-white/45">{group.heading}</h2>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[0.9375rem] text-slate-300 transition-colors duration-200 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="t-caption text-white/40">
            © {new Date().getFullYear()} {SITE.legalName}
          </p>
          <p className="t-caption flex gap-6 text-white/40">
            <span>Terms of Use</span>
            <span>Privacy Policy</span>
          </p>
        </div>
      </Container>
    </footer>
  );
}
