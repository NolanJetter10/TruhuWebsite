"use client";

import { useState } from "react";
import { TRACKED_PAGE } from "@/lib/funnel";

/**
 * Builds a tagged link to Bryan's page, so every link out in the wild says
 * where it came from. Two forms: a plain `?tag=name` (the website reads it as
 * the campaign), or the full set of utm_ tags. Values are normalised to
 * lowercase-with-hyphens: "Q4 Brokers" and "q4-brokers" would otherwise count
 * as two campaigns.
 */

const SOURCES = ["linkedin", "email", "google", "newsletter", "event", "partner", "referral"];
const MEDIUMS = ["paid", "social", "email", "cpc", "referral", "organic", "outbound"];

const slug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type Mode = "tag" | "utm";

export function LinkBuilder({ siteUrl }: { siteUrl: string }) {
  const [mode, setMode] = useState<Mode>("tag");
  const [tag, setTag] = useState("");
  const [source, setSource] = useState("linkedin");
  const [medium, setMedium] = useState("paid");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);

  const url = new URL(TRACKED_PAGE, siteUrl);
  const params: [string, string][] =
    mode === "tag"
      ? [["tag", tag]]
      : [
          ["utm_source", source],
          ["utm_medium", medium],
          ["utm_campaign", campaign],
          ["utm_content", content],
        ];
  for (const [key, value] of params) {
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
      <div role="radiogroup" aria-label="Link type" className="mb-3 inline-flex rounded-lg border border-line bg-surface p-0.5">
        {(
          [
            ["tag", "Tag", "?tag=name: one word for where the link goes"],
            ["utm", "UTM", "utm_source, utm_medium, utm_campaign, utm_content"],
          ] as const
        ).map(([key, label, hint]) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={mode === key}
            title={hint}
            onClick={() => setMode(key)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              mode === key ? "bg-ink text-surface" : "text-ink-2 hover:bg-raised"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "tag" ? (
        <label className="block max-w-sm text-xs font-medium text-ink-2" title="Shows as the campaign">
          Tag
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="spring-webinar"
            className={field}
          />
        </label>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-medium text-ink-2" title="Where the click happens">
            Source
            <input list="lb-sources" value={source} onChange={(e) => setSource(e.target.value)} className={field} />
          </label>
          <label className="text-xs font-medium text-ink-2" title="What kind of placement">
            Medium
            <input list="lb-mediums" value={medium} onChange={(e) => setMedium(e.target.value)} className={field} />
          </label>
          <label className="text-xs font-medium text-ink-2" title="The name you filter by">
            Campaign
            <input
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="q4-broker-outreach"
              className={field}
            />
          </label>
          <label className="text-xs font-medium text-ink-2" title="Which ad or email (optional)">
            Content
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
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="min-w-0 flex-1 truncate rounded-lg border border-line bg-raised px-3 py-2 text-[0.8125rem] text-ink">
          {link}
        </code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-surface hover:opacity-90"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
