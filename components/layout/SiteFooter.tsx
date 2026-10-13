import Image from "next/image";
import Link from "next/link";
import { CookiePreferences } from "@/components/analytics/ConsentManager";
import { Logo } from "@/components/art/Logo";
import { CTAButton } from "@/components/ui/CTAButton";
import { Container } from "@/components/ui/primitives";
import { CONSENT_BANNER } from "@/lib/content";
import { FOOTER_CTA, FOOTER_NAV, SITE } from "@/lib/site";
import socBadge from "@/public/images/soc-badge.svg";

export function SiteFooter() {
  return (
    <footer className="on-dark relative isolate overflow-hidden bg-ink-950 text-white">
      <div className="grid-field opacity-60" aria-hidden />
      <Container className="relative py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,1fr))_minmax(0,1.2fr)]">
          <div>
            <Logo tone="light" className="h-7" />
            <p className="measure mt-5 text-[0.9375rem] leading-relaxed text-slate-300">
              {SITE.footerTagline}
            </p>
            <Image
              src={socBadge}
              alt="AICPA SOC 2 Type II compliant — certified for security and availability"
              className="mt-6 h-20 w-auto"
            />
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

          <div className="lg:text-right">
            <p className="t-eyebrow text-white/45">{FOOTER_CTA.title}</p>
            <CTAButton href={FOOTER_CTA.cta.href} className="mt-4">
              {FOOTER_CTA.cta.label}
            </CTAButton>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="t-caption text-white/40">
            © {new Date().getFullYear()} {SITE.legalName}
          </p>
          <p className="t-caption flex gap-6 text-white/40">
            <span>Terms of Use</span>
            <span>Privacy Policy</span>
            <CookiePreferences label={CONSENT_BANNER.preferences} />
          </p>
        </div>
      </Container>
    </footer>
  );
}
