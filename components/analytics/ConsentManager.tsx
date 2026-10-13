"use client";

import { useEffect, useState } from "react";
import { attributionForTools, privacySignal } from "@/lib/analytics/tracker";
import {
  loadThirdParty,
  revokeThirdParty,
  thirdPartyConfigured,
} from "@/lib/analytics/third-party";
import type { CONSENT_BANNER } from "@/lib/content";

/**
 * Decides whether Clarity and GA4 may load, and asks when it has to.
 *
 * - A visitor whose browser sends Global Privacy Control or Do Not Track:
 *   never loaded, unless they accept in the banner themselves.
 * - A visitor from the EU, EEA, UK or Switzerland: a banner asks first, and
 *   nothing loads until Accept. Clarity requires this signal there since
 *   October 2025, and it's the law there regardless.
 * - Everyone else: loaded straight away.
 *
 * The choice is remembered in this browser. "Cookie preferences" in the
 * footer reopens the banner for anyone, so a choice can always be changed.
 * Country comes from /api/geo (Vercel's edge); without it, from the time zone.
 */

const STORAGE_KEY = "truhu_consent";
export const OPEN_PREFERENCES = "truhu:cookie-preferences";

const ASK_COUNTRIES = new Set([
  // EU
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  // EEA, UK, Switzerland
  "IS", "LI", "NO", "GB", "CH",
]);
const EUROPEAN_ZONE = /^(Europe\/|Atlantic\/(Reykjavik|Canary|Madeira|Azores|Faroe))/;

type Choice = "granted" | "denied";

function stored(): Choice | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

function remember(choice: Choice) {
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {}
}

/** In development, `?region=eu` or `?region=us` stands in for the edge. */
function regionOverride() {
  if (process.env.NODE_ENV === "production") return null;
  return new URL(location.href).searchParams.get("region");
}

async function mustAsk() {
  const forced = regionOverride();
  if (forced) return forced === "eu";
  try {
    const res = await fetch("/api/geo", { cache: "no-store" });
    const { country } = (await res.json()) as { country: string | null };
    if (country) return ASK_COUNTRIES.has(country);
  } catch {}
  return EUROPEAN_ZONE.test(Intl.DateTimeFormat().resolvedOptions().timeZone ?? "");
}

export function ConsentManager({ copy }: { copy: typeof CONSENT_BANNER }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // A development preview shows the banner even with no tool configured.
    const preview = regionOverride() !== null;
    if (!thirdPartyConfigured && !preview) return;
    const choice = stored();
    if (choice === "granted") {
      loadThirdParty(attributionForTools());
      return;
    }
    if (choice === "denied" || (privacySignal() && !preview)) return;

    let live = true;
    void mustAsk().then((ask) => {
      if (!live) return;
      if (ask) setOpen(true);
      else loadThirdParty(attributionForTools());
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_PREFERENCES, reopen);
    return () => window.removeEventListener(OPEN_PREFERENCES, reopen);
  }, []);

  if (!open) return null;

  function choose(choice: Choice) {
    remember(choice);
    setOpen(false);
    if (choice === "granted") loadThirdParty(attributionForTools());
    else revokeThirdParty();
  }

  return (
    <div
      role="region"
      aria-label={copy.label}
      className="fixed inset-x-3 bottom-3 z-[70] sm:inset-x-auto sm:bottom-5 sm:left-5 sm:max-w-sm"
      style={{ animation: "hero-in 500ms var(--ease-out-expo) both" }}
    >
      <div className="card-shape border border-line bg-white p-5 shadow-[0_24px_60px_-28px_rgba(5,14,26,0.55)]">
        <p className="text-[0.875rem] leading-relaxed text-slate-600">{copy.body}</p>
        {/* Equal weight on purpose: declining is as easy as accepting. */}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            data-track="Cookie banner: accept"
            onClick={() => choose("granted")}
            className="flex-1 rounded-full bg-ink-900 px-4 py-2 text-[0.875rem] font-semibold text-white transition-colors hover:bg-ink-800"
          >
            {copy.accept}
          </button>
          <button
            type="button"
            data-track="Cookie banner: decline"
            onClick={() => choose("denied")}
            className="flex-1 rounded-full border border-line px-4 py-2 text-[0.875rem] font-semibold text-ink transition-colors hover:bg-paper"
          >
            {copy.decline}
          </button>
        </div>
      </div>
    </div>
  );
}

/** The footer's "Cookie preferences": reopens the banner. */
export function CookiePreferences({ label }: { label: string }) {
  if (!thirdPartyConfigured) return null;
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_PREFERENCES))}
      className="transition-colors hover:text-white"
    >
      {label}
    </button>
  );
}
