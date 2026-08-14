"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CaretDown, List, X } from "@phosphor-icons/react/ssr";
import { NAV, NAV_FLAT } from "@/lib/site";
import { Logo } from "@/components/art/Logo";
import { CTAButton } from "@/components/ui/CTAButton";
import { StatusPill, cx } from "@/components/ui/primitives";

/**
 * Products first, Workflows second because it is the strategy, Company third
 * because the de-risking pages belong in the nav where a conservative buyer
 * will find them. Deliberately not a mega-menu: depth is not authority.
 *
 * The compressed "stuck" state is a scroll-state container query, so no scroll
 * listener runs. The reading-progress rule underneath is a scroll-driven
 * animation. Neither costs any JavaScript.
 */
export function SiteHeader() {
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>("Products");
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  const navRef = useRef<HTMLDivElement>(null);

  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(null);
    setMobileOpen(false);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(null);
        setMobileOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpen(null);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className="header-shell sticky top-0 z-50"
      style={{ viewTransitionName: "site-header" }}
    >
      <div className="header-bar border-b border-border-200 bg-white/92 backdrop-blur-md transition-shadow duration-300">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-5 sm:px-8">
          <Link href="/" aria-label="TruHu home" className="shrink-0">
            <Logo priority />
          </Link>

          <div ref={navRef} className="hidden flex-1 items-center gap-1 lg:flex">
            {NAV.map((group) => {
              const isOpen = open === group.label;
              return (
                <div key={group.label} className="relative">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : group.label)}
                    onMouseEnter={() => setOpen(group.label)}
                    className={cx(
                      "flex items-center gap-1 rounded-full px-3 py-2 text-[0.9375rem] font-medium transition-colors duration-150",
                      isOpen
                        ? "bg-tint-100 text-navy-900"
                        : "text-grey-700 hover:text-navy-900",
                    )}
                  >
                    {group.label}
                    <CaretDown
                      weight="bold"
                      className={cx(
                        "size-3 transition-transform duration-200",
                        isOpen && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>

                  {isOpen ? (
                    <div
                      onMouseLeave={() => setOpen(null)}
                      className="absolute top-full left-0 w-[min(30rem,90vw)] pt-2"
                    >
                      <div className="pop-in card-shape border border-border-200 bg-white p-3 shadow-[0_28px_64px_-28px_rgba(15,42,68,0.35)]">
                        {group.columns.map((column, ci) => (
                          <div key={ci}>
                            {column.heading ? (
                              <p className="t-caption px-3 pt-2 pb-1 font-semibold text-grey-500">
                                {column.heading}
                              </p>
                            ) : null}
                            <ul>
                              {column.links.map((link) => (
                                <li key={link.href + link.label}>
                                  <Link
                                    href={link.href}
                                    className="card-shape-sm block px-3 py-2.5 transition-colors duration-150 hover:bg-section"
                                  >
                                    <span className="flex items-center gap-2">
                                      <span className="text-[0.9375rem] font-semibold text-ink-900">
                                        {link.label}
                                      </span>
                                      {link.status && link.statusLabel ? (
                                        <StatusPill
                                          status={link.status}
                                          label={link.statusLabel}
                                        />
                                      ) : null}
                                    </span>
                                    {link.description ? (
                                      <span className="mt-0.5 block text-[0.8125rem] leading-snug text-grey-500">
                                        {link.description}
                                      </span>
                                    ) : null}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                            {column.footer ? (
                              <div className="mt-2 border-t border-border-200 pt-2">
                                <Link
                                  href={column.footer.href}
                                  className="card-shape-sm block px-3 py-2 text-[0.8125rem] font-semibold text-blue-500 hover:bg-section"
                                >
                                  {column.footer.label}
                                </Link>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}

            {NAV_FLAT.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-2 text-[0.9375rem] font-medium text-grey-700 transition-colors duration-150 hover:text-navy-900"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="ml-auto hidden items-center gap-3 lg:flex">
            <Link
              href="/login"
              className="text-[0.9375rem] font-medium text-grey-700 hover:text-navy-900"
            >
              Login
            </Link>
            <CTAButton href="/contact" size="sm">
              Book a demo
            </CTAButton>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className="ml-auto rounded-full p-2 text-navy-900 lg:hidden"
          >
            <span className="sr-only">Open menu</span>
            <List className="size-5" aria-hidden />
          </button>
        </div>

        {/* Reading progress. Pure CSS, tied to document scroll. */}
        <div
          aria-hidden
          className="header-rule h-0.5 w-full origin-left bg-green-500 opacity-0 transition-opacity duration-300"
        >
          <div className="scroll-progress h-full w-full bg-green-500" />
        </div>
      </div>

      {mobileOpen ? (
        <div
          id="mobile-nav"
          className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden"
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border-200 px-5">
            <Logo />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-full p-2 text-navy-900"
            >
              <span className="sr-only">Close menu</span>
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-5 py-4">
            {NAV.map((group) => {
              const expanded = mobileSection === group.label;
              return (
                <div key={group.label} className="border-b border-border-200">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setMobileSection(expanded ? null : group.label)}
                    className="flex w-full items-center justify-between py-4 text-left"
                  >
                    <span className="t-h4">{group.label}</span>
                    <CaretDown
                      weight="bold"
                      className={cx(
                        "size-3.5 text-grey-500 transition-transform duration-200",
                        expanded && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>
                  {expanded ? (
                    <ul className="pb-4">
                      {group.columns
                        .flatMap((c) => c.links)
                        .map((link) => (
                          <li key={link.href + link.label}>
                            <Link
                              href={link.href}
                              className="flex items-center gap-2 py-2.5 text-[0.9375rem] text-grey-700"
                            >
                              {link.label}
                              {link.status && link.statusLabel ? (
                                <StatusPill
                                  status={link.status}
                                  label={link.statusLabel}
                                />
                              ) : null}
                            </Link>
                          </li>
                        ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}

            {NAV_FLAT.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block border-b border-border-200 py-4"
              >
                <span className="t-h4">{link.label}</span>
              </Link>
            ))}

            <div className="mt-6 flex flex-col gap-3">
              <CTAButton href="/contact">Book a demo</CTAButton>
              <CTAButton href="/fit-test" variant="secondary">
                Take the Fit Test
              </CTAButton>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
