"use client";

import { useState } from "react";

/**
 * Builds the tagged link for a campaign, so every link out in the wild says
 * where it came from and the Campaigns table can tell them apart. Values are
 * normalised to lowercase-with-hyphens: "Q4 Brokers" and "q4-brokers" would
 * otherwise count as two campaigns.
 */

const SOURCES = ["linkedin", "email", "google", "newsletter", "event", "partner", "referral"];
const MEDIUMS = ["paid", "social", "email", "cpc", "referral", "organic", "outbound"];

const slug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function LinkBuilder({ siteUrl }: { siteUrl: string }) {
  const [source, setSource] = useState("linkedin");
  const [medium, setMedium] = useState("paid");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);

  const url = new URL("/get-started", siteUrl);
  for (const [key, value] of [
    ["utm_source", source],
    ["utm_medium", medium],
    ["utm_campaign", campaign],
    ["utm_content", content],
  ] as const) {
    const clean = slug(value);
    if (clean) url.searchParams.set(key, clean);
  }
  const link = url.toString();

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const field =
    "mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-medium text-ink-2">
          Source <span className="font-normal text-muted">where the click happens</span>
          <input list="lb-sources" value={source} onChange={(e) => setSource(e.target.value)} className={field} />
        </label>
        <label className="text-xs font-medium text-ink-2">
          Medium <span className="font-normal text-muted">what kind of placement</span>
          <input list="lb-mediums" value={medium} onChange={(e) => setMedium(e.target.value)} className={field} />
        </label>
        <label className="text-xs font-medium text-ink-2">
          Campaign <span className="font-normal text-muted">the name you&apos;ll filter by</span>
          <input
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            placeholder="q4-broker-outreach"
            className={field}
          />
        </label>
        <label className="text-xs font-medium text-ink-2">
          Content <span className="font-normal text-muted">optional: which ad or email</span>
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="video-ad-a"
            className={field}
          />
        </label>
        <datalist id="lb-sources">
          {SOURCES.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <datalist id="lb-mediums">
          {MEDIUMS.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="min-w-0 flex-1 truncate rounded-lg border border-line bg-raised px-3 py-2 text-[0.8125rem] text-ink">
          {link}
        </code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-surface hover:opacity-90"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      {!slug(campaign) ? (
        <p className="mt-2 text-xs text-muted">
          Add a campaign name — untagged clicks all land in one bucket.
        </p>
      ) : null}
    </div>
  );
}
