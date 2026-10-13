import "server-only";

import { calConfigured, calProvider } from "./cal";
import { demoProvider } from "./demo";
import type { BookingProvider } from "./types";

/**
 * Cal.com when it is configured; the demo scheduler in development when it is
 * not; nothing in production without it, so a live visitor can never book a
 * meeting that does not exist.
 */
export function bookingProvider(): BookingProvider | null {
  if (calConfigured) return calProvider;
  if (process.env.NODE_ENV !== "production") return demoProvider;
  return null;
}

export const MEETING = {
  title: "TruHu demo with Bryan Kleppe",
  minutes: 10,
  host: "Bryan Kleppe",
} as const;
