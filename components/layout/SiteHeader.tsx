import Link from "next/link";
import { Logo } from "@/components/art/Logo";
import { MainNav } from "@/components/layout/MainNav";
import { CTAButton } from "@/components/ui/CTAButton";
import { Container } from "@/components/ui/primitives";

/**
 * The compressed, blurred state comes from a scroll-state container query, so
 * no scroll listener runs. `site-header` is the view-transition name that keeps
 * the bar anchored while page content crossfades under it.
 */
export function SiteHeader() {
  return (
    <div className="header-shell sticky top-0 z-50">
      <header
        className="header-bar relative bg-white/70 backdrop-blur-md transition-[background-color,box-shadow] duration-300"
        style={{ viewTransitionName: "site-header" }}
      >
        <Container>
          <div className="flex h-16 items-center justify-between gap-6">
            <Link href="/" className="shrink-0" aria-label="TruHu home">
              <Logo priority className="h-7" />
            </Link>

            <MainNav />

            <div className="flex shrink-0 items-center gap-2">
              <a
                href="https://app.truhu.ai"
                rel="noreferrer"
                className="hidden rounded-full px-4 py-2 text-[0.8125rem] font-bold tracking-wider text-slate-600 uppercase transition-colors duration-200 hover:text-ink sm:block"
              >
                Login
              </a>
              <CTAButton href="/demo" size="sm">
                Book a demo
              </CTAButton>
            </div>
          </div>
        </Container>

        {/* Reading progress for the whole document, drawn by the scrollbar. */}
        <div
          aria-hidden
          className="scroll-progress absolute inset-x-0 bottom-0 h-0.5"
          style={{ background: "var(--grad-brand)" }}
        />
      </header>
    </div>
  );
}
