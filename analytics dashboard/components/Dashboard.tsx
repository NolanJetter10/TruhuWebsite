"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { RANGES, type RangeKey, type Summary } from "@/lib/aggregate";
import { TRACKED_PAGE } from "@/lib/funnel";
import { BarList, FunnelChart, Meter, VisitsOverTime, duration, fmt, noun, pct } from "./charts";
import { LinkBuilder } from "./LinkBuilder";

/**
 * The whole dashboard: one filter row (range, source) scoping everything
 * under it, then the headline numbers, the funnel beside the live feed,
 * Bryan's paths, sources, and the leads, bookings and calls themselves.
 * Labels are a word or three; definitions live in `title` tooltips.
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
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

const NONE = "None yet";

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
  const [openCall, setOpenCall] = useState<string | null>(null);
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
  const finished = data?.trailer.reached.find((r) => r.label === "100%")?.count ?? 0;

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
            <h1 className="text-sm font-semibold">{TRACKED_PAGE}</h1>
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
                title="Session recordings and heatmaps"
                className="text-xs font-medium text-accent-text hover:underline"
              >
                Clarity ↗
              </a>
            ) : null}
            {gaConfigured ? (
              <a
                href="https://analytics.google.com/"
                target="_blank"
                rel="noreferrer"
                title="Google Analytics 4"
                className="text-xs font-medium text-accent-text hover:underline"
              >
                GA4 ↗
              </a>
            ) : null}
            <span
              title={
                backend === "supabase"
                  ? "Reading Supabase"
                  : backend === "file"
                    ? "No database connected: reading .data/analytics.ndjson. Add SUPABASE_URL and SUPABASE_SECRET_KEY to the website's .env.local to switch."
                    : "No database configured"
              }
              className="rounded-full border border-line px-2.5 py-1 text-[0.6875rem] font-medium text-ink-2"
            >
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
        {backend === "none" ? (
          <Notice tone="warn">
            No database: set <code>SUPABASE_URL</code> and <code>SUPABASE_SECRET_KEY</code>.
          </Notice>
        ) : null}
        {openAccess ? (
          <Notice tone="warn">
            Open: no <code>DASHBOARD_PASSWORD</code> set.
          </Notice>
        ) : null}
        {data?.missing.length ? (
          <Notice tone="warn">
            Missing tables: {data.missing.join(", ")}. Run <code>supabase/schema.sql</code> again.
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
                className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3 ${
                  range === key ? "bg-ink text-surface" : "text-ink-2 hover:bg-raised"
                }`}
              >
                {RANGES[key]}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <span className="sr-only">Source</span>
            <select
              value={campaign}
              onChange={(e) => chooseCampaign(e.target.value)}
              title="utm_campaign, ?c= or ?tag=; else the source"
              className="max-w-64 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="">All sources</option>
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
          <span className="text-xs text-muted sm:ml-auto">{tz.replace(/_/g, " ")}</span>
        </div>

        {error ? <Notice tone="error">{error}</Notice> : null}

        {!data || !k ? (
          <p className="py-24 text-center text-sm text-muted">Loading…</p>
        ) : (
          <div className={`space-y-4 transition-opacity duration-200 ${dimmed ? "opacity-55" : ""}`}>
            {/* Headline numbers ---------------------------------------- */}
            <section aria-label="Headline numbers" className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <Tile label="Visits" hint={`Visits to ${TRACKED_PAGE}`} value={fmt.format(k.visits)} />
              <Tile
                label="Talked to Bryan"
                hint="Visits with an AI Bryan call or chat"
                value={fmt.format(k.talked)}
                sub={`${pct(k.talkedRate)} of visits`}
              />
              <Tile label="Leads" hint="Work emails left on Samples, Build or Rebuild" value={fmt.format(k.leads)} />
              <Tile
                label="Booked"
                hint="Calls booked with Bryan, cancellations excluded"
                value={fmt.format(k.booked)}
                sub={k.cancelled ? `${fmt.format(k.cancelled)} cancelled` : undefined}
              />
              <Tile
                label="Conversion"
                hint="Visits with a lead or booking ÷ visits"
                value={pct(k.conversion)}
                sub={`${fmt.format(k.converted)} ${noun(k.converted, "visit")}`}
                strong
                wide
              />
            </section>

            {/* Funnel + live --------------------------------------------- */}
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2" title="Funnel" hint="Visits that reached at least each step">
                <FunnelChart steps={data.funnel} />
              </Card>

              <Card
                title="Live"
                aside={
                  <span className="text-xs text-muted tabular" title="Heard from in the last 45 seconds">
                    {fmt.format(k.liveNow)} now
                  </span>
                }
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
                {data.feed.length ? (
                  <ol className="max-h-[17rem] space-y-0.5 overflow-y-auto pr-1">
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
                  <Empty />
                )}
              </Card>
            </div>

            {/* Paths + where opens came from ----------------------------- */}
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2" title="Paths" hint="Bryan's ways forward, counted in visits">
                <Table minWidth={480}>
                  <thead>
                    <tr className="text-left text-xs text-muted">
                      <Th>Path</Th>
                      <Th right hint="Visits that opened a popup on this path">Opened</Th>
                      <Th right hint="Visits that viewed a sample, typed in a form, added a file or picked a time">
                        Started
                      </Th>
                      <Th right hint="Visits that left a lead or booked on this path">Converted</Th>
                      <Th right hint="Converted ÷ Opened">Rate</Th>
                    </tr>
                  </thead>
                  <tbody className="tabular">
                    {data.paths.map((p) => (
                      <tr key={p.key} className="border-t border-line">
                        <td className="px-1 py-2.5 font-medium" title={`Converts: ${p.converts}`}>
                          {p.label}
                        </td>
                        <td className="px-1 py-2.5 text-right">{fmt.format(p.opened)}</td>
                        <td className="px-1 py-2.5 text-right">{fmt.format(p.started)}</td>
                        <td className="px-1 py-2.5 text-right font-semibold">{fmt.format(p.converted)}</td>
                        <td className="px-1 py-2.5 text-right">
                          {p.rate === null ? (
                            <span className="text-muted">—</span>
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <Meter value={p.rate} />
                              {pct(p.rate)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card>
              <Card title="Opened from" hint="What opened each popup (flow_open from)">
                <BarList items={data.openedFrom} empty={NONE} unit="open" />
              </Card>
            </div>

            {/* Sources ------------------------------------------------- */}
            <Card title="Sources" hint="utm_campaign, ?c= or ?tag=; else the source. Click a row to filter.">
              <Table minWidth={560}>
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <Th>Source</Th>
                    <Th right>Visits</Th>
                    <Th right hint="Visits with an AI Bryan call or chat">Talked</Th>
                    <Th right hint="Visits that opened any popup">Interested</Th>
                    <Th right hint="Visits with a lead or booking">Converted</Th>
                    <Th right hint="Converted ÷ Visits">Rate</Th>
                  </tr>
                </thead>
                <tbody className="tabular">
                  {data.sources.map((row) => (
                    <tr
                      key={row.key}
                      onClick={() => chooseCampaign(campaign === row.key ? "" : row.key)}
                      className={`cursor-pointer border-t border-line hover:bg-raised ${
                        campaign === row.key ? "bg-accent-wash" : ""
                      }`}
                    >
                      <td className="px-1 py-2.5">
                        <p className="font-medium">{row.label}</p>
                        {row.detail ? <p className="text-xs text-muted">{row.detail}</p> : null}
                      </td>
                      <td className="px-1 py-2.5 text-right font-semibold">{fmt.format(row.visits)}</td>
                      <td className="px-1 py-2.5 text-right">{fmt.format(row.talked)}</td>
                      <td className="px-1 py-2.5 text-right">{fmt.format(row.interested)}</td>
                      <td className="px-1 py-2.5 text-right font-semibold">{fmt.format(row.converted)}</td>
                      <td className="px-1 py-2.5 text-right">
                        <span className="inline-flex items-center gap-2">
                          <Meter value={row.rate} />
                          {pct(row.rate)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!data.sources.length ? <EmptyRow span={6} /> : null}
                </tbody>
              </Table>
            </Card>

            {/* Leads ---------------------------------------------------- */}
            <Card title="Leads" aside={<Count shown={data.leads.length} total={data.leadsTotal} />}>
              <Table minWidth={620}>
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <Th>When</Th>
                    <Th>Path</Th>
                    <Th>Email</Th>
                    <Th hint="Client's website (Build) or files uploaded (Rebuild)">Site / files</Th>
                    <Th>Source</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.leads.map((l) => (
                    <tr key={l.id} className="border-t border-line">
                      <td className="px-1 py-2.5 whitespace-nowrap tabular text-ink-2">{when(l.at, tz)}</td>
                      <td className="px-1 py-2.5">{l.path}</td>
                      <td className="px-1 py-2.5">
                        <a href={`mailto:${l.email}`} className="font-medium hover:underline">
                          {l.email}
                        </a>
                      </td>
                      <td className="max-w-56 truncate px-1 py-2.5">
                        {l.href ? (
                          <a href={l.href} target="_blank" rel="noreferrer" className="text-accent-text hover:underline">
                            {l.detail}
                          </a>
                        ) : (
                          (l.detail ?? <span className="text-muted">—</span>)
                        )}
                      </td>
                      <td className="px-1 py-2.5">{l.source}</td>
                    </tr>
                  ))}
                  {!data.leads.length ? <EmptyRow span={5} /> : null}
                </tbody>
              </Table>
            </Card>

            {/* Bookings --------------------------------------------------- */}
            <Card title="Bookings" aside={<Count shown={data.bookings.length} total={data.bookingsTotal} />}>
              <Table minWidth={680}>
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <Th>Booked</Th>
                    <Th>Who</Th>
                    <Th>Agency</Th>
                    <Th>Meeting</Th>
                    <Th>Source</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.bookings.map((b) => (
                    <tr key={b.uid} className="border-t border-line">
                      <td className="px-1 py-2.5 whitespace-nowrap tabular text-ink-2">{when(b.createdAt, tz)}</td>
                      <td className="px-1 py-2.5">
                        <p className="font-medium">{b.name}</p>
                        <p className="text-xs text-muted">{b.email}</p>
                      </td>
                      <td className="px-1 py-2.5" title={b.clients ? `${b.clients} clients` : undefined}>
                        {b.agency ?? "—"}
                      </td>
                      <td className="px-1 py-2.5 whitespace-nowrap tabular">{when(b.startAt, tz)}</td>
                      <td className="px-1 py-2.5">{b.source}</td>
                      <td className="px-1 py-2.5">
                        <Status value={b.status} />
                      </td>
                    </tr>
                  ))}
                  {!data.bookings.length ? <EmptyRow span={6} /> : null}
                </tbody>
              </Table>
            </Card>

            {/* Calls ------------------------------------------------------ */}
            <Card
              title="Calls"
              hint="AI Bryan calls and chats. Click a row for the transcript."
              aside={<Count shown={data.calls.length} total={data.callsTotal} />}
            >
              <Table minWidth={760}>
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <Th>When</Th>
                    <Th>Type</Th>
                    <Th right>Length</Th>
                    <Th right hint="Things the visitor said or typed">Turns</Th>
                    <Th hint="Popups opened during it, in order">Flows</Th>
                    <Th>Ended</Th>
                    <Th>Source</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.calls.map((c) => {
                    const isOpen = openCall === c.id;
                    return (
                      <Fragment key={c.id}>
                        <tr
                          onClick={() => setOpenCall(isOpen ? null : c.id)}
                          aria-expanded={isOpen}
                          className={`cursor-pointer border-t border-line hover:bg-raised ${isOpen ? "bg-raised" : ""}`}
                        >
                          <td className="px-1 py-2.5 whitespace-nowrap tabular text-ink-2">
                            <span aria-hidden className="mr-1.5 inline-block w-2 text-muted">
                              {isOpen ? "▾" : "▸"}
                            </span>
                            {when(c.at, tz)}
                          </td>
                          <td className="px-1 py-2.5 capitalize">{c.mode}</td>
                          <td className="px-1 py-2.5 text-right tabular">{duration(c.seconds)}</td>
                          <td className="px-1 py-2.5 text-right tabular">{fmt.format(c.turns)}</td>
                          <td className="max-w-64 px-1 py-2.5">
                            {c.flows.length ? (
                              <span className="line-clamp-2">{c.flows.join(" → ")}</span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="px-1 py-2.5 whitespace-nowrap">
                            {c.live ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-good-wash px-2 py-0.5 text-xs font-medium text-good-text">
                                <span aria-hidden className="live-dot size-1.5 rounded-full bg-good" />
                                Live
                              </span>
                            ) : (
                              c.ended || <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="px-1 py-2.5">{c.source}</td>
                        </tr>
                        {isOpen ? (
                          <tr className="bg-raised">
                            <td colSpan={7} className="px-3 pt-1 pb-3">
                              <Transcript id={c.id} version={c.updatedAt} tz={tz} />
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                  {!data.calls.length ? <EmptyRow span={7} /> : null}
                </tbody>
              </Table>
            </Card>

            {/* Over time, trailer, where they stopped -------------------- */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card
                className="md:col-span-2"
                title={data.seriesUnit === "hour" ? "Visits by hour" : "Visits by day"}
              >
                <VisitsOverTime series={data.series} unit={data.seriesUnit} />
              </Card>
              <Card title="Trailer" hint="Visits that played it, and how far they got">
                {data.trailer.plays ? (
                  <>
                    <div className="mb-4 flex gap-6">
                      <Stat label="Plays" value={fmt.format(data.trailer.plays)} />
                      <Stat
                        label="Finished"
                        hint="Reached 100% ÷ plays"
                        value={pct(finished / data.trailer.plays)}
                      />
                    </div>
                    <ul className="space-y-1.5 text-sm">
                      {data.trailer.reached.map((r) => (
                        <li key={r.label} className="grid grid-cols-[2.75rem_1fr_2rem] items-center gap-2 tabular">
                          <span className="text-ink-2">{r.label}</span>
                          <span className="h-1.5 rounded-full bg-accent-wash">
                            <span
                              className="bar-grow block h-1.5 rounded-full bg-accent"
                              style={{ width: `${Math.round((r.count / data.trailer.plays) * 100)}%` }}
                            />
                          </span>
                          <span className="text-right font-semibold">{fmt.format(r.count)}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <Empty />
                )}
              </Card>
              <Card title="Stopped at" hint="Furthest step of visits that didn't convert">
                <BarList items={data.stoppedAt} empty={NONE} />
              </Card>
            </div>

            {/* Link builder ------------------------------------------- */}
            <details className="group rounded-xl border border-line bg-surface">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-[0.9375rem] font-semibold [&::-webkit-details-marker]:hidden">
                <span aria-hidden className="text-muted transition-transform group-open:rotate-90">
                  ▸
                </span>
                Link builder
              </summary>
              <div className="border-t border-line px-5 py-4">
                <LinkBuilder siteUrl={siteUrl} />
              </div>
            </details>
          </div>
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ parts */

function Card({
  title,
  hint,
  aside,
  className = "",
  children,
}: {
  title: string;
  /** The definition, as a tooltip on the title. */
  hint?: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`min-w-0 rounded-xl border border-line bg-surface p-5 ${className}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="text-[0.9375rem] font-semibold" title={hint}>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Tile({
  label,
  hint,
  value,
  sub,
  strong = false,
  wide = false,
}: {
  label: string;
  hint: string;
  value: string;
  sub?: string;
  strong?: boolean;
  /** Takes the whole row on a phone, where the tiles are two across. */
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-surface p-4 sm:p-5 ${strong ? "border-accent/40" : "border-line"} ${
        wide ? "col-span-2 md:col-span-1" : ""
      }`}
      title={hint}
    >
      <p className="text-sm text-ink-2">{label}</p>
      <p className="mt-1 text-[1.75rem] leading-tight font-semibold tracking-tight tabular">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted tabular">{sub}</p> : null}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div title={hint}>
      <p className="text-xs text-ink-2">{label}</p>
      <p className="text-2xl leading-tight font-semibold tracking-tight tabular">{value}</p>
    </div>
  );
}

function Table({ minWidth, children }: { minWidth: number; children: ReactNode }) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

function Th({ children, right = false, hint }: { children: ReactNode; right?: boolean; hint?: string }) {
  return (
    <th
      title={hint}
      className={`px-1 py-2 font-medium ${right ? "text-right" : ""} ${hint ? "cursor-help" : ""}`}
    >
      {children}
    </th>
  );
}

function Count({ shown, total }: { shown: number; total: number }) {
  if (!total) return null;
  return (
    <span className="text-xs text-muted tabular">
      {shown < total ? `${fmt.format(shown)} of ${fmt.format(total)}` : fmt.format(total)}
    </span>
  );
}

function Empty() {
  return <p className="py-6 text-center text-sm text-muted">{NONE}</p>;
}

function EmptyRow({ span }: { span: number }) {
  return (
    <tr>
      <td colSpan={span} className="py-6 text-center text-muted">
        {NONE}
      </td>
    </tr>
  );
}

type Line = { role: "visitor" | "bryan"; text: string; at: string };

/** One call's transcript, re-read whenever the call itself changes. */
function Transcript({ id, version, tz }: { id: string; version: string; tz: string }) {
  const [lines, setLines] = useState<Line[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stale = false;
    fetch(`/api/transcript?id=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
        return body.lines as Line[];
      })
      .then((next) => {
        if (stale) return;
        setLines(next);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!stale) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      stale = true;
    };
  }, [id, version]);

  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

  if (error) return <p className="py-3 text-sm text-critical">{error}</p>;
  if (!lines) return <p className="py-3 text-sm text-muted">Loading…</p>;
  if (!lines.length) return <p className="py-3 text-sm text-muted">—</p>;
  return (
    <ol className="max-h-96 space-y-1.5 overflow-y-auto pt-2 text-sm">
      {lines.map((line, i) => (
        <li key={i} className="grid grid-cols-[4.5rem_3.5rem_1fr] gap-2">
          <span className="text-xs leading-5 text-muted tabular">
            {line.at ? time.format(new Date(line.at)) : ""}
          </span>
          <span className={`text-xs leading-5 font-semibold ${line.role === "bryan" ? "text-accent-text" : "text-ink-2"}`}>
            {line.role === "bryan" ? "Bryan" : "Visitor"}
          </span>
          <span className="min-w-0 whitespace-pre-wrap text-ink [overflow-wrap:anywhere]">{line.text}</span>
        </li>
      ))}
    </ol>
  );
}

function LivePill({ link, beat }: { link: Link; beat: number }) {
  const label = link === "live" ? "Live" : link === "connecting" ? "Connecting" : "Reconnecting";
  return (
    <span
      key={beat}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        link === "live" ? "bg-good-wash text-good-text" : "bg-warn-wash text-warn-text"
      } ${beat ? "arrive" : ""}`}
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
