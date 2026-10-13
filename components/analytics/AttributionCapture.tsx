"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { captureTouch, recordPath } from "@/lib/analytics/tracker";

/**
 * Site-wide and silent: sends nothing. It only remembers, in this browser, the
 * campaign tags a visitor arrived with and the last page they were on, so that
 * if they reach /get-started from somewhere else on the site the booking is
 * still credited to the campaign that brought them.
 *
 * Rendered after the page in the layout on purpose: effects run in tree
 * order, so a tracked page reads the previous path before this records the
 * new one.
 */
export function AttributionCapture() {
  const pathname = usePathname();

  useEffect(() => {
    captureTouch();
  }, []);

  useEffect(() => {
    recordPath(pathname);
  }, [pathname]);

  return null;
}
