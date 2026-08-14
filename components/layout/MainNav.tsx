"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cx } from "@/components/ui/primitives";
import { NAV, isNavMenu, type NavLink } from "@/lib/site";

/**
 * The main nav, with Products as a menu over the two product pages.
 *
 * The menu is a disclosure rather than an ARIA menubar: the panel holds plain
 * links, so the roving-focus contract a `role="menu"` would promise is one we
 * would have to implement and would buy nothing here. Pointer users get
 * hover-to-open with a close delay so a diagonal path into the panel does not
 * dismiss it; keyboard users get a real button that toggles, closes on Escape,
 * and hands focus back where it started.
 */

/** Long enough to cross the gap between trigger and panel, short enough to feel deliberate. */
const CLOSE_DELAY = 140;

export function MainNav() {
  const pathname = usePathname();
  const [openLabel, setOpenLabel] = useState<string | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const navRef = useRef<HTMLElement>(null);

  const cancelClose = useCallback(() => {
    window.clearTimeout(closeTimer.current);
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(
      () => setOpenLabel(null),
      CLOSE_DELAY,
    );
  }, [cancelClose]);

  // A completed navigation should never leave the panel hanging open. This is
  // the adjust-state-during-render pattern rather than an effect: the close is
  // derived from the route changing, so React can discard the pending output
  // and re-render before anything reaches the DOM.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpenLabel(null);
  }

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // Pointer down anywhere outside closes, which covers the click that opened a
  // different trigger as well as a click on the page behind the panel.
  useEffect(() => {
    if (!openLabel) return;
    function onPointerDown(event: PointerEvent) {
      if (!navRef.current?.contains(event.target as Node)) setOpenLabel(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openLabel]);

  return (
    <nav
      ref={navRef}
      aria-label="Main"
      className="hidden items-center gap-1 md:flex"
      onFocus={cancelClose}
      // Focus leaving the nav entirely closes the panel; moving between the
      // trigger and its links keeps it open because relatedTarget stays inside.
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpenLabel(null);
        }
      }}
    >
      {NAV.map((item) => {
        if (!isNavMenu(item)) {
          return (
            <NavItemLink
              key={item.href}
              link={item}
              active={isActive(pathname, item.href)}
              onPointerEnter={scheduleClose}
            />
          );
        }

        const open = openLabel === item.label;
        const active = item.children.some((child) =>
          isActive(pathname, child.href),
        );

        return (
          <div
            key={item.label}
            className="relative"
            onPointerEnter={() => {
              cancelClose();
              setOpenLabel(item.label);
            }}
            onPointerLeave={scheduleClose}
          >
            <button
              type="button"
              aria-expanded={open}
              aria-controls={`nav-panel-${slug(item.label)}`}
              onClick={() => setOpenLabel(open ? null : item.label)}
              onKeyDown={(event) => {
                if (event.key === "Escape" && open) {
                  event.preventDefault();
                  setOpenLabel(null);
                } else if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setOpenLabel(item.label);
                }
              }}
              className={cx(
                "group relative flex items-center gap-1.5 rounded-full px-4 py-2 text-[0.9375rem] font-semibold transition-colors duration-200",
                active || open ? "text-ink" : "text-slate-600 hover:text-ink",
              )}
            >
              {item.label}
              <span
                aria-hidden
                className={cx(
                  "text-[0.625rem] transition-transform duration-300 ease-out",
                  open && "rotate-180",
                )}
              >
                ▾
              </span>
              <Underline shown={active} />
            </button>

            <div
              id={`nav-panel-${slug(item.label)}`}
              hidden={!open}
              onKeyDown={(event) => {
                if (event.key !== "Escape") return;
                event.preventDefault();
                setOpenLabel(null);
              }}
              // The padded wrapper is the hover bridge across the gap.
              className="absolute top-full left-1/2 z-50 w-[26rem] -translate-x-1/2 pt-3"
            >
              <div
                className="card-shape border border-line bg-white/95 p-2 shadow-[0_30px_70px_-35px_rgba(5,14,26,0.55)] backdrop-blur-md"
                style={{
                  animation: open
                    ? "hero-in 320ms var(--ease-out-expo) both"
                    : undefined,
                }}
              >
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    aria-current={
                      isActive(pathname, child.href) ? "page" : undefined
                    }
                    className="group block rounded-xl px-4 py-3.5 transition-colors duration-200 hover:bg-paper"
                  >
                    <span className="flex items-center gap-2 text-[0.9375rem] font-bold text-ink">
                      {child.label}
                      <span
                        aria-hidden
                        className="text-blue-700 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                      >
                        &rarr;
                      </span>
                    </span>
                    {child.blurb ? (
                      <span className="mt-1 block text-[0.8125rem] leading-relaxed text-slate-600">
                        {child.blurb}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

/* -------------------------------------------------------------------------- */

function NavItemLink({
  link,
  active,
  onPointerEnter,
}: {
  link: NavLink;
  active: boolean;
  onPointerEnter: () => void;
}) {
  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      onPointerEnter={onPointerEnter}
      className={cx(
        "group relative rounded-full px-4 py-2 text-[0.9375rem] font-semibold transition-colors duration-200",
        active ? "text-ink" : "text-slate-600 hover:text-ink",
      )}
    >
      {link.label}
      <Underline shown={active} />
    </Link>
  );
}

/** The rule under a nav item: always shown when active, drawn on hover otherwise. */
function Underline({ shown }: { shown: boolean }) {
  return (
    <span
      aria-hidden
      className={cx(
        "absolute inset-x-4 bottom-1 h-px origin-left bg-blue-500 transition-transform duration-300 ease-out",
        shown ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
      )}
    />
  );
}

/** `/advisor` matches its own detail routes but never the home route. */
function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function slug(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
