"use client";

import { usePathname } from "next/navigation";

/**
 * Pages that stand alone on one screen, with no site header or footer around
 * them. Exact paths only: the confirmation and reschedule pages under
 * /BryanKleppe keep the normal chrome.
 */
const BARE_PAGES = ["/BryanKleppe"];

/** Wraps the header and footer in the root layout so those pages can drop them. */
export function HideOnBarePages({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return BARE_PAGES.includes(pathname) ? null : <>{children}</>;
}
