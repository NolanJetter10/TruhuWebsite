"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { RANGES, type RangeKey, type Summary } from "@/lib/aggregate";
import { BarList, FunnelChart, Meter, VisitsOverTime, duration, fmt, pct } from "./charts";
import { LinkBuilder } from "./LinkBuilder";

/**
 * The whole dashboard: one filter row (range, campaign) scoping everything
 * under it, then the headline numbers, the funnel beside the live feed, and
 * the breakdowns.
 *
 * Live: an EventSource on /api/stream says when the data moved, and the
 * summary is re-fetched quietly — the frame never blanks. A filter change
 * dims the current numbers until the new ones land.
 */

type Backend = "supabase" | "file" | "none";
type Link = "connecting" | "live" | "reconnecting";

const noSubscribe = () => () => {};
const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const serverZone = () => "America/New_York";

function useNow(every = 5000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), every);
    return () => clearInterval(id);
  }, [every]);
  return now;
}

function ago(iso: string, now: number) {
  const sec = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86_400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86_400)}d ago`;
}

function when(iso: string, tz: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function Dashboard({
  backend: initialBackend,
  openAccess,
  initialRange,
  initialCampaign,
  siteUrl,
  clarityId,
  gaConfigured,
}: {
  backend: Backend;
  openAccess: boolean;
  initialRange: RangeKey;
  initialCampaign: string;
  siteUrl: string;
  /** Set once Clarity is set up on the site, for the header link. */
  clarityId: string;
  gaConfigured: boolean;
}) {
  const tz = useSyncExternalStore(noSubscribe, browserZone, serverZone);
  const [range, setRange] = useState<RangeKey>(initialRange);
  const [campaign, setCampaign] = useState(initialCampaign);
  const [data, setData] = useState<(Summary & { backend: Backend }) | null>(null);
  // Follows the server, so adding the Supabase keys flips this without a reload.
  const backend = data?.backend ?? initialBackend;
  const [error, setError] = useState<string | null>(null);
  const [dimmed, setDimmed] = useState(false);
  const [link, setLink] = useState<Link>("connecting");
  const [beat, setBeat] = useState(0);
  const now = useNow();
  const request = useRef(0);

  const load = useCallback(async () => {
    const id = ++request.current;
    try {
      const params = new URLSearchParams({ range, tz });
      if (campaign) params.set("campaign", campaign);
      const res = await fetch(`/api/summary?${params}`, { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const body = await res.json();
      if (id !== request.current) return;
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      setData(body as Summary & { backend: Backend });
      setError(null);
    } catch (e) {
      if (id === request.current) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (id === request.current) setDimmed(false);
    }
  }, [range, campaign, tz]);

  useEffect(() => {
    void load();
  }, [load]);

  // Keep the filters in the address bar, so a view can be bookmarked or sent.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("range", range);
    if (campaign) url.searchParams.set("campaign", campaign);
    else url.searchParams.delete("campaign");
    window.history.replaceState(null, "", url);
  }, [range, campaign]);

  const latest = useRef(load);
  useEffect(() => {
    latest.current = load;
  }, [load]);

  useEffect(() => {
    let debounce: ReturnType<typeof setTimeout> | undefined;
    const source = new EventSource("/api/stream");
    source.addEventListener("ready", () => setLink("live"));
    source.addEventListener("change", () => {
      setBeat((n) => n + 1);
      clearTimeout(debounce);
      debounce = setTimeout(() => void latest.current(), 300);
    });
    source.onopen = () => setLink("live");
    source.onerror = () => setLink("reconnecting");
    // "On the page now" ages out even when nothing new arrives.
    const fallback = setInterval(() => void latest.current(), 20_000);
    return () => {
      source.close();
      clearTimeout(debounce);
      clearInterval(fallback);
    };
  }, []);

  function chooseRange(next: RangeKey) {
    if (next === range) return;
    setDimmed(true);
    setRange(next);
  }

  function chooseCampaign(next: string) {
    if (next === campaign) return;
    setDimmed(true);
    setCampaign(next);
  }

  const k = data?.kpis;

  return (
    <div className="min-h-dvh">
      {/* Header ---------------------------------------------------------- */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid size-7 place-items-center rounded-md text-[0.6875rem] font-bold text-white"
              style={{ background: "linear-gradient(120deg,#0582dc,#21cfc0 55%,#38b000)" }}
            >
              T
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Get started funnel</p>
              <p className="text-[0.6875rem] text-muted">truhu.ai/get-started</p>
            </div>
          </div>
          <LivePill link={link} beat={beat} />
          <span className="text-xs text-muted">
            {data ? `Updated ${ago(data.generatedAt, now)}` : "Loading…"}
          </span>
          <span className="ml-auto flex items-center gap-3">
            {clarityId ? (
              <a
                href={`https://clarity.microsoft.com/projects/view/${encodeURIComponent(clarityId)}/dashboard`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-accent-text hover:underline"
              >
                Recordings (Clarity) ↗
              </a>
            ) : null}
            {gaConfigured ? (
              <a
                href="https://analytics.google.com/"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-accent-text hover:underline"
              >
                Google Analytics ↗
              </a>
            ) : null}
            <span className="rounded-full border border-line px-2.5 py-1 text-[0.6875rem] font-medium text-ink-2">
              {backend === "supabase" ? "Supabase" : backend === "file" ? "Local file" : "No database"}
            </span>
            {!openAccess ? (
              <form action="/api/logout" method="post">
                <button type="submit" className="text-xs font-medium text-ink-2 hover:text-ink">
                  Sign out
                </button>
              </form>
            ) : null}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
        {backend === "file" ? (
          <Notice tone="info">
            Local mode: no database connected yet, so this shows test data from{" "}
            <code>.data/analytics.ndjson</code>. Add <code>SUPABASE_URL</code> and{" "}
            <code>SUPABASE_SECRET_KEY</code> to the website&apos;s <code>.env.local</code> and this
            switches to Supabase on its own.
          </Notice>
        ) : null}
        {backend === "none" ? (
          <Notice tone="warn">
            No database configured. Set <code>SUPABASE_URL</code> and{" "}
            <code>SUPABASE_SECRET_KEY</code>.
          </Notice>
        ) : null}
        {openAccess ? (
          <Notice tone="warn">
            No <code>DASHBOARD_PASSWORD</code> set, so this is open. Fine on your laptop; set one
            before deploying.
          </Notice>
        ) : null}

        {/* Filters: one row, scoping everything below ------------------- */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div role="radiogroup" aria-label="Date range" className="flex rounded-lg border border-line bg-surface p-0.5">
            {(Object.keys(RANGES) as RangeKey[]).map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={range === key}
                onClick={() => chooseRange(key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  range === key ? "bg-ink text-surface" : "text-ink-2 hover:bg-raised"
                }`}
              >
                {RANGES[key]}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <span className="sr-only sm:not-sr-only">Campaign</span>
            <select
              value={campaign}
              onChange={(e) => chooseCampaign(e.target.value)}
              className="max-w-64 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="">All campaigns</option>
              {data?.campaignOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label} ({option.visits})
                </option>
              ))}
              {campaign && data && !data.campaignOptions.some((o) => o.key === campaign) ? (
                <option value={campaign}>{campaign.replace(/^[cs]:/, "")}</option>
              ) : null}
            </select>
          </label>
          {campaign ? (
            <button
              type="button"
              onClick={() => chooseCampaign("")}
              className="text-sm font-medium text-accent-text hover:underline"
            >
              Clear
            </button>
          ) : null}
          <span className="text-xs text-muted sm:ml-auto">Times in {tz.replace(/_/g, " ")}</span>
        </div>

        {error ? (
          <Notice tone="error">
            Couldn&apos;t load the numbers: {error}
          </Notice>
        ) : null}

        {!data || !k ? (
          <p className="py-24 text-center text-sm text-muted">Loading the funnel…</p>
        ) : (
          <div className={`space-y-4 transition-opacity duration-200 ${dimmed ? "opacity-55" : ""}`}>
            {/* Headline numbers ---------------------------------------- */}
            <section aria-label="Headline numbers" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <div className="rounded-xl border border-line bg-surface p-5 sm:col-span-2">
                <p className="text-sm text-ink-2">Demos booked</p>
                <p className="mt-1 text-[3.25rem] leading-none font-semibold tracking-tight">
                  {fmt.format(k.bookings)}
                </p>
                <p className="mt-3 text-sm text-ink-2">
                  <span className="font-semibold text-ink">{pct(k.conversion)}</span> of visits booked
                  {k.cancelled ? <span className="text-muted"> · {k.cancelled} cancelled</span> : null}
                </p>
              </div>
              <Tile label="Visits" value={fmt.format(k.visits)}>
                {fmt.format(k.visitors)} people · {fmt.format(k.returning)} returning
              </Tile>
              <Tile label="Engaged" value={pct(k.visits ? k.engaged / k.visits : 0)}>
                {fmt.format(k.engaged)} stayed 10s+ or interacted
              </Tile>
              <Tile label="Saw the calendar" value={pct(k.visits ? k.sawCalendar / k.visits : 0)}>
                {fmt.format(k.sawCalendar)} visits
              </Tile>
              <Tile label="Median time on page" value={duration(k.medianEngagedSec)}>
                active time, tab in view
              </Tile>
            </section>

            {k.visits === 0 ? (
              <Notice tone="info">
                No visits to /get-started in this range yet. Open the page (or a tagged link from
                the builder at the bottom) and this fills in live.
              </Notice>
            ) : null}

            {/* Funnel + live --------------------------------------------- */}
            <div className="grid gap-4 lg:grid-cols-3">
              <Card
                className="lg:col-span-2"
                title="Funnel"
                subtitle="How far each visit got. A step counts every visit that reached at least that point."
                aside={
                  data.biggestDrop ? (
                    <span className="rounded-full bg-critical-wash px-2.5 py-1 text-xs text-ink">
                      Biggest drop: <strong>{data.biggestDrop.from}</strong> →{" "}
                      <strong>{data.biggestDrop.to}</strong> ({pct(data.biggestDrop.share)},{" "}
                      {fmt.format(data.biggestDrop.lost)} visits)
                    </span>
                  ) : null
                }
              >
                <FunnelChart steps={data.funnel} />
              </Card>

              <Card
                title="Live"
                subtitle={`${fmt.format(k.liveNow)} on the page right now`}
                aside={<LivePill link={link} beat={beat} compact />}
              >
                {data.live.length ? (
                  <ul className="mb-4 space-y-1.5">
                    {data.live.slice(0, 6).map((v) => (
                      <li key={v.visitor} className="flex items-center gap-2 rounded-lg bg-good-wash px-2.5 py-1.5 text-xs">
                        <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-good" />
                        <span className="min-w-0 truncate">
                          <strong className="font-semibold">{v.campaign}</strong>
                          <span className="text-ink-2"> · {v.section} · {v.step}</span>
                        </span>
                        <span className="ml-auto shrink-0 text-muted">{v.device}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="mb-2 text-xs font-medium text-muted">Activity</p>
                {data.feed.length ? (
                  <ol className="max-h-[22rem] space-y-0.5 overflow-y-auto pr-1">
                    {data.feed.map((item) => (
                      <li key={item.id} className="arrive grid grid-cols-[3.5rem_1fr] gap-2 rounded-md px-1.5 py-1 text-xs">
                        <span className="text-muted tabular">{ago(item.at, now).replace(" ago", "")}</span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5">
                            <span
                              aria-hidden
                              className={`size-1.5 shrink-0 rounded-full ${
                                item.tone === "win"
                                  ? "bg-good"
                                  : item.tone === "step"
                                    ? "bg-accent"
                                    : item.tone === "exit"
                                      ? "bg-muted"
                                      : "bg-quiet"
                              }`}
                            />
                            <span className={item.tone === "win" ? "font-semibold text-good-text" : "text-ink"}>
                              {item.text}
                            </span>
                          </span>
                          <span className="block truncate pl-3 text-muted">{item.who}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="py-6 text-center text-sm text-muted">Nothing yet.</p>
                )}
              </Card>
            </div>

            {/* Over time + time on page ---------------------------------- */}
            <div className="grid gap-4 lg:grid-cols-3">
              <Card
                className="lg:col-span-2"
                title={data.seriesUnit === "hour" ? "Visits by hour" : "Visits by day"}
                subtitle="Each column is the visits that started then; the blue part booked."
              >
                <VisitsOverTime series={data.series} unit={data.seriesUnit} />
              </Card>
              <Card title="Time actively on the page" subtitle="Seconds with the tab in view and someone there.">
                <BarList items={data.timeBuckets} empty="No visits yet." />
              </Card>
            </div>

            {/* Campaigns ------------------------------------------------- */}
            <Card
              title="Campaigns"
              subtitle="Grouped by utm_campaign, or by source when a link has no campaign. Click a row to filter everything to it."
            >
              <div className="-mx-1 overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted">
                      <th className="px-1 py-2 font-medium">Campaign</th>
                      <th className="px-1 py-2 text-right font-medium">Visits</th>
                      <th className="px-1 py-2 text-right font-medium">Engaged</th>
                      <th className="px-1 py-2 text-right font-medium">Saw calendar</th>
                      <th className="px-1 py-2 text-right font-medium">Booked</th>
                      <th className="px-1 py-2 text-right font-medium">Conversion</th>
                      <th className="px-1 py-2 text-right font-medium">Median time</th>
                    </tr>
                  </thead>
                  <tbody className="tabular">
                    {data.campaigns.map((row) => (
                      <tr
                        key={row.key}
                        onClick={() => chooseCampaign(campaign === row.key ? "" : row.key)}
                        className={`cursor-pointer border-t border-line hover:bg-raised ${
                          campaign === row.key ? "bg-accent-wash" : ""
                        }`}
                      >
                        <td className="px-1 py-2.5">
                          <p className="font-medium">{row.label}</p>
                          <p className="text-xs text-muted">{row.detail}</p>
                        </td>
                        <td className="px-1 py-2.5 text-right font-semibold">{fmt.format(row.visits)}</td>
                        <td className="px-1 py-2.5 text-right">{pct(row.engagedRate)}</td>
                        <td className="px-1 py-2.5 text-right">{pct(row.calendarRate)}</td>
                        <td className="px-1 py-2.5 text-right font-semibold">{fmt.format(row.booked)}</td>
                        <td className="px-1 py-2.5 text-right">
                          <span className="inline-flex items-center gap-2">
                            <Meter value={row.conversion} />
                            {pct(row.conversion)}
                          </span>
                        </td>
                        <td className="px-1 py-2.5 text-right">{duration(row.medianEngagedSec)}</td>
                      </tr>
                    ))}
                    {!data.campaigns.length ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-muted">
                          No visits in this range.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Drop-off ------------------------------------------------ */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card title="Where non-bookers stopped" subtitle="The furthest step reached by visits that didn't book.">
                <BarList items={data.stoppedAt} empty="Everyone booked. Nice." />
              </Card>
              <Card title="What they were looking at last" subtitle="The block on screen when a non-booker left.">
                <BarList items={data.leftFrom} empty="No exits recorded." />
              </Card>
              <Card title="Links they left by" subtitle="Clicked away from the page without booking.">
                <BarList items={data.exits} empty="Nobody left by a link — they closed the tab." />
              </Card>
              <Card title="Devices" subtitle="All visits in range.">
                <BarList items={data.devices} empty="No visits yet." />
              </Card>
            </div>

            {/* Bookings --------------------------------------------------- */}
            <Card
              title="Bookings"
              subtitle="Made on the page, newest first, with reschedules and cancellations. Until a Zoom link is set up, send each booker theirs before the call."
            >
              <div className="-mx-1 overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted">
                      <th className="px-1 py-2 font-medium">Who</th>
                      <th className="px-1 py-2 font-medium">Agency</th>
                      <th className="px-1 py-2 font-medium">Clients</th>
                      <th className="px-1 py-2 font-medium">Meeting</th>
                      <th className="px-1 py-2 font-medium">Campaign</th>
                      <th className="px-1 py-2 font-medium">Booked</th>
                      <th className="px-1 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bookings.map((b) => (
                      <tr key={b.uid} className="border-t border-line">
                        <td className="px-1 py-2.5">
                          <p className="font-medium">{b.name}</p>
                          <p className="text-xs text-muted">{b.email}</p>
                        </td>
                        <td className="px-1 py-2.5">{b.agency ?? "—"}</td>
                        <td className="px-1 py-2.5 tabular">{b.clients ?? "—"}</td>
                        <td className="px-1 py-2.5 tabular">{when(b.startAt, tz)}</td>
                        <td className="px-1 py-2.5">{b.campaign}</td>
                        <td className="px-1 py-2.5 text-muted">{ago(b.createdAt, now)}</td>
                        <td className="px-1 py-2.5">
                          <Status value={b.status} />
                        </td>
                      </tr>
                    ))}
                    {!data.bookings.length ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-muted">
                          No bookings in this range yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Clicked but didn't book -------------------------------- */}
            <Card
              title="Clicked but didn't book"
              subtitle={`${fmt.format(data.retargetTotal)} visits reached the calendar and left without booking — the retargeting audience. Anonymous until they book. ${
                clarityId
                  ? "To watch one, copy its visitor ID (hover it) into Clarity's Custom user ID filter."
                  : "Once Clarity is set up you can watch their recordings."
              }`}
            >
              <div className="-mx-1 overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted">
                      <th className="px-1 py-2 font-medium">Visitor</th>
                      <th className="px-1 py-2 font-medium">Campaign</th>
                      <th className="px-1 py-2 font-medium">Got as far as</th>
                      <th className="px-1 py-2 text-right font-medium">Time on page</th>
                      <th className="px-1 py-2 font-medium">Device</th>
                      <th className="px-1 py-2 font-medium">Location</th>
                      <th className="px-1 py-2 font-medium">Last seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.retarget.map((r, i) => (
                      <tr key={`${r.visitor}-${i}`} className="border-t border-line">
                        <td className="px-1 py-2.5 font-mono text-xs" title={r.visitorId}>
                          #{r.visitor}
                          {r.returning ? <span className="ml-1.5 font-sans text-muted">returning</span> : null}
                        </td>
                        <td className="px-1 py-2.5">{r.campaign}</td>
                        <td className="px-1 py-2.5 font-medium">{r.step}</td>
                        <td className="px-1 py-2.5 text-right tabular">{duration(r.engagedSec)}</td>
                        <td className="px-1 py-2.5 capitalize">{r.device}</td>
                        <td className="px-1 py-2.5">{r.place}</td>
                        <td className="px-1 py-2.5 text-muted">{ago(r.lastSeen, now)}</td>
                      </tr>
                    ))}
                    {!data.retarget.length ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-muted">
                          No one has reached the calendar and left yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Link builder ------------------------------------------- */}
            <Card
              title="Campaign link builder"
              subtitle="Every link you put out should carry its own tags; this is how the Campaigns table tells them apart."
            >
              <LinkBuilder siteUrl={siteUrl} />
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ parts */

function Card({
  title,
  subtitle,
  aside,
  className = "",
  children,
}: {
  title: string;
  subtitle?: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-xl border border-line bg-surface p-5 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 className="text-[0.9375rem] font-semibold">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-muted">{subtitle}</p> : null}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Tile({ label, value, children }: { label: string; value: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <p className="text-sm text-ink-2">{label}</p>
      <p className="mt-1 text-[1.75rem] leading-tight font-semibold tracking-tight">{value}</p>
      <p className="mt-1.5 text-xs text-muted">{children}</p>
    </div>
  );
}

function LivePill({ link, beat, compact = false }: { link: Link; beat: number; compact?: boolean }) {
  const label = link === "live" ? "Live" : link === "connecting" ? "Connecting" : "Reconnecting";
  return (
    <span
      key={compact ? undefined : beat}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        link === "live" ? "bg-good-wash text-good-text" : "bg-warn-wash text-warn-text"
      } ${!compact && beat ? "arrive" : ""}`}
    >
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${link === "live" ? "live-dot bg-good" : "bg-warn-text"}`}
      />
      {label}
    </span>
  );
}

function Status({ value }: { value: string }) {
  const tone =
    value === "cancelled"
      ? "bg-critical-wash text-ink"
      : value === "rescheduled"
        ? "bg-warn-wash text-warn-text"
        : "bg-good-wash text-good-text";
  const text = value === "booked" ? "Booked" : value[0].toUpperCase() + value.slice(1);
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{text}</span>;
}

function Notice({ tone, children }: { tone: "info" | "warn" | "error"; children: ReactNode }) {
  const style =
    tone === "error"
      ? "border-critical/40 bg-critical-wash"
      : tone === "warn"
        ? "border-line bg-warn-wash"
        : "border-line bg-accent-wash";
  return (
    <p className={`mb-4 rounded-lg border px-3.5 py-2.5 text-[0.8125rem] text-ink [&_code]:rounded [&_code]:bg-surface/70 [&_code]:px-1 ${style}`}>
      {children}
    </p>
  );
}
