import "server-only";

import { analyticsBackend } from "@/lib/analytics/store";
import { calConfigured, calProvider } from "./cal";
import { placeholderProvider } from "./placeholder";
import type { BookingProvider, SlotsByDay } from "./types";

/**
 * Cal.com once its variables are set. Until then the placeholder scheduler,
 * which needs somewhere to keep bookings: the Supabase database (or the local
 * file in development). With neither, nothing — the widget then shows its
 * "request a time" fallback rather than taking a booking it can't keep.
 */
export function bookingProvider(): BookingProvider | null {
  if (calConfigured()) return calProvider;
  if (analyticsBackend() !== "none") return placeholderProvider;
  return null;
}

export { MEETING } from "./meeting";

/*
 * Open times are held for 15 seconds per (provider, range, zone), which keeps
 * a busy page well inside Cal.com's rate limit. Any booking, move or
 * cancellation clears the lot, and every booking re-checks its time anyway,
 * so a stale list can cost a visitor a "just taken", never a double booking.
 */
const TTL_MS = 15_000;
const cache = new Map<string, { at: number; days: SlotsByDay }>();

export async function openSlots(
  provider: BookingProvider,
  from: string,
  to: string,
  timeZone: string,
) {
  const key = `${provider.name}|${from}|${to}|${timeZone}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.days;
  const days = await provider.getSlots(from, to, timeZone);
  if (cache.size > 500) cache.clear();
  cache.set(key, { at: Date.now(), days });
  return days;
}

export function forgetSlots() {
  cache.clear();
}
