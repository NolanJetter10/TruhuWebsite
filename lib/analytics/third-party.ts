/**
 * Microsoft Clarity (session recordings, heatmaps) and Google Analytics 4
 * (site-wide traffic and campaign reports), loaded only once consent allows —
 * see components/analytics/ConsentManager.tsx for that decision.
 *
 * Each is switched on by its id in .env.local:
 *   NEXT_PUBLIC_CLARITY_ID   the Clarity project id, e.g. "abcd1234ef"
 *   NEXT_PUBLIC_GA_ID        the GA4 measurement id, e.g. "G-ABC123DEF4"
 *
 * Both learn the visitor's campaign (the same attribution the funnel tracker
 * uses, so a click-through from the home page still counts), and both hear
 * about funnel steps and bookings, so recordings and reports can be filtered
 * by campaign and by how far a visit got.
 *
 * Nothing typed into a form reaches either: Clarity masks inputs by default,
 * and the booking form and confirmation pages are additionally marked
 * `data-clarity-mask`. No name or email is ever sent to GA.
 */

type Clarity = ((...args: unknown[]) => void) & { q?: unknown[][] };

declare global {
  interface Window {
    clarity?: Clarity;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID ?? "";
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

export const thirdPartyConfigured = Boolean(CLARITY_ID || GA_ID);

let loaded = false;

function inject(src: string) {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

/** Load both tools, once, with analytics consent granted and ads denied. */
export function loadThirdParty(context: {
  campaign?: string;
  source?: string;
  medium?: string;
  visitorId?: string;
}) {
  if (loaded || !thirdPartyConfigured) return;
  loaded = true;
  const dev = process.env.NODE_ENV !== "production";

  if (CLARITY_ID) {
    const queue: Clarity = function (...args: unknown[]) {
      (queue.q ??= []).push(args);
    };
    window.clarity ??= queue;
    window.clarity("consentv2", { ad_Storage: "denied", analytics_Storage: "granted" });
    inject(`https://www.clarity.ms/tag/${encodeURIComponent(CLARITY_ID)}`);
    // Filterable in Clarity: Filters → Custom tags.
    if (context.campaign) window.clarity("set", "campaign", context.campaign);
    if (context.source) window.clarity("set", "source", context.source);
    if (context.medium) window.clarity("set", "medium", context.medium);
    window.clarity("set", "environment", dev ? "development" : "production");
    // The same id the dashboard shows, so a visit there can be found here.
    if (context.visitorId) window.clarity("identify", context.visitorId);
  }

  if (GA_ID) {
    window.dataLayer ??= [];
    // gtag must push the arguments object itself; GA ignores plain arrays.
    window.gtag ??= function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, dev ? { debug_mode: true } : {});
    inject(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`);
  }
}

/** Withdraw consent on the current page; the next page won't load them. */
export function revokeThirdParty() {
  window.clarity?.("consentv2", { ad_Storage: "denied", analytics_Storage: "denied" });
  window.gtag?.("consent", "update", { analytics_storage: "denied" });
}

/**
 * Tell both tools something happened. `upgrade` asks Clarity to keep the
 * recording in full (it samples long sessions otherwise).
 */
export function thirdPartyEvent(
  name: string,
  params?: Record<string, string | number>,
  options: { upgrade?: string } = {},
) {
  window.clarity?.("event", name);
  if (options.upgrade) window.clarity?.("upgrade", options.upgrade);
  window.gtag?.("event", name, params ?? {});
}
