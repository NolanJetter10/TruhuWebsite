import { after } from "next/server";
import type { Beacon, BeaconEvent } from "@/lib/analytics/schema";
import { ingest } from "@/lib/analytics/store";

/**
 * The funnel beacon. The page sends one of these every few seconds while a
 * visit is live and once more as it ends (via sendBeacon, so the response is
 * never read). It answers 204 straight away and writes after the response, so
 * a slow database can never hold up the page.
 *
 * Everything from the browser is untrusted: the shape is checked field by
 * field, every string is capped, and anything that fails is dropped whole.
 */

const MAX_BODY = 48_000;
const MAX_EVENTS = 80;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOT =
  /bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|monitor|facebookexternalhit|embedly|quora link|vercel-screenshot/i;

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 120;
const hits = new Map<string, number[]>();

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5_000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

const str = (value: unknown, max = 200) =>
  typeof value === "string" && value.length > 0 ? value.slice(0, max) : undefined;

const int = (value: unknown, min: number, max: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.round(value)))
    : min;

function parseUserAgent(ua: string) {
  const device = /iPad|Tablet/i.test(ua)
    ? "tablet"
    : /Mobi|Android|iPhone/i.test(ua)
      ? "mobile"
      : "desktop";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Other";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /iPhone|iPad|iPod/.test(ua)
      ? "iOS"
      : /Mac OS X/.test(ua)
        ? "macOS"
        : /Android/.test(ua)
          ? "Android"
          : /CrOS/.test(ua)
            ? "ChromeOS"
            : /Linux/.test(ua)
              ? "Linux"
              : "Other";
  return { device, browser, os };
}

function header(request: Request, name: string) {
  const value = request.headers.get(name);
  if (!value) return undefined;
  try {
    return decodeURIComponent(value).slice(0, 80);
  } catch {
    return value.slice(0, 80);
  }
}

function cleanProps(props: unknown) {
  if (!props || typeof props !== "object") return undefined;
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(props).slice(0, 12)) {
    if (typeof value === "string") out[key.slice(0, 40)] = value.slice(0, 300);
    else if (typeof value === "number" || typeof value === "boolean" || value === null)
      out[key.slice(0, 40)] = value;
  }
  return out;
}

export async function POST(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";
  // Crawlers and uptime checks would only inflate the top of the funnel. Kept
  // in development so the headless browser used to check pages still counts.
  if (process.env.NODE_ENV === "production" && BOT.test(ua)) {
    return new Response(null, { status: 204 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY) return new Response(null, { status: 413 });

  let body: Beacon;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }

  const v = body?.visit;
  if (body?.v !== 1 || !v || !UUID.test(v.id) || !UUID.test(v.visitorId)) {
    return new Response(null, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(`${ip}:${v.id}`)) return new Response(null, { status: 429 });

  const now = Date.now();
  const iso = (agoMs: unknown) =>
    new Date(now - int(agoMs, 0, 6 * 60 * 60 * 1000)).toISOString();

  const visit = {
    id: v.id,
    visitor_id: v.visitorId,
    page: str(v.page, 120) ?? "/",
    started_at: iso(v.startedAgo),
    last_seen_at: new Date(now).toISOString(),
    source: str(v.source, 120),
    medium: str(v.medium, 120),
    campaign: str(v.campaign, 160),
    content: str(v.content, 160),
    term: str(v.term, 160),
    click_id: str(v.clickId, 20),
    attribution: ["url", "stored", "referrer", "direct"].includes(v.attribution)
      ? v.attribution
      : "direct",
    referrer: str(v.referrer, 300),
    from_path: str(v.fromPath, 200),
    landing_url: str(v.landingUrl, 600),
    ...parseUserAgent(ua),
    // Vercel's edge fills these; locally they are simply absent.
    country: header(request, "x-vercel-ip-country"),
    region: header(request, "x-vercel-ip-country-region"),
    city: header(request, "x-vercel-ip-city"),
    returning: v.returning === true,
    engaged_ms: int(v.engagedMs, 0, 6 * 60 * 60 * 1000),
    max_scroll: int(v.maxScroll, 0, 100),
    furthest_step: int(v.step, 0, 5), // `booked` (6) is only ever set by the server
    last_section: str(v.section, 60),
    exit_target: str(v.exit, 300),
  };

  const events = (Array.isArray(body.events) ? body.events : [])
    .slice(0, MAX_EVENTS)
    .filter((e: BeaconEvent) => typeof e?.type === "string" && e.type.length <= 40)
    .map((e: BeaconEvent) => ({
      type: e.type,
      name: str(e.name, 200),
      at: iso(e.ago),
      props: cleanProps(e.props),
    }));

  after(async () => {
    try {
      await ingest(visit, events);
    } catch (error) {
      console.error("[analytics] ingest failed", error);
    }
  });

  return new Response(null, { status: 204 });
}
