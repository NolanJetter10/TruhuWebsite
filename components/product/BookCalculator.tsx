"use client";

import { useState } from "react";
import { SourceNote, cx } from "@/components/ui/primitives";

/**
 * Book economics. The section that turns per-client value into book value.
 *
 * Deliberately has NO preloaded hero number: the broker types their own book
 * size and the model runs on their inputs. A calculator that uses the visitor's
 * own numbers is more persuasive than any claimed percentage and carries none
 * of the evidential risk. (Blueprint §4 A5.)
 */

const currency = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

function Field({
  label,
  suffix,
  value,
  onChange,
  placeholder,
  min = 0,
  hint,
}: {
  label: string;
  suffix?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  min?: number;
  hint?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div>
      <label htmlFor={id} className="block text-[0.8125rem] font-medium text-ink-900">
        {label}
      </label>
      <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-border-200 bg-white px-3 py-2 focus-within:border-blue-500">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-[0.9375rem] font-semibold text-ink-900 outline-none tabular placeholder:font-normal placeholder:text-grey-500"
        />
        {suffix ? (
          <span className="shrink-0 text-[0.8125rem] text-grey-500">{suffix}</span>
        ) : null}
      </div>
      {hint ? <p className="t-caption mt-1 text-grey-500">{hint}</p> : null}
    </div>
  );
}

export function BookCalculator() {
  const [groups, setGroups] = useState("");
  const [share, setShare] = useState("20");
  const [hours, setHours] = useState("12");
  const [rate, setRate] = useState("65");

  const n = Number(groups) || 0;
  const pct = Math.min(100, Math.max(0, Number(share) || 0));
  const h = Number(hours) || 0;
  const r = Number(rate) || 0;

  const served = Math.round((n * pct) / 100);
  const unserved = Math.max(0, n - served);
  const hoursToday = served * h;
  const costToday = hoursToday * r;
  const hoursIfAll = n * h;
  const costIfAll = hoursIfAll * r;

  const ready = n > 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-12">
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Field
          label="Client groups in your book"
          value={groups}
          onChange={setGroups}
          placeholder="e.g. 310"
        />
        <Field
          label="Share that gets a full communication programme today"
          suffix="%"
          value={share}
          onChange={setShare}
          hint="For most brokerages this is the top ten or twenty accounts."
        />
        <Field
          label="Hours to produce one guide, end to end"
          suffix="hrs"
          value={hours}
          onChange={setHours}
          hint="Gathering documents, rebuilding the deck, proofing, translating."
        />
        <Field
          label="Blended internal cost per hour"
          suffix="$"
          value={rate}
          onChange={setRate}
        />
      </form>

      <div
        className={cx(
          "card-shape border border-border-200 bg-white p-6 sm:p-8",
          !ready && "flex items-center",
        )}
        aria-live="polite"
      >
        {!ready ? (
          <p className="t-lede text-grey-500">
            Enter the number of groups in your book. Nothing is preloaded.
            the model runs on your numbers, not on ours.
          </p>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="t-caption font-semibold text-grey-500 uppercase">
                  Groups getting the full programme
                </p>
                <p
                  className="mt-2 font-bold text-ink-900 tabular"
                  style={{ fontFamily: "var(--font-display)", fontSize: "2.25rem", lineHeight: 1 }}
                >
                  {served.toLocaleString()}
                </p>
                <p className="t-caption mt-1.5 text-grey-700">
                  {unserved.toLocaleString()} groups get whatever fits in the
                  time left.
                </p>
              </div>
              <div>
                <p className="t-caption font-semibold text-grey-500 uppercase">
                  Hours that costs you a year
                </p>
                <p
                  className="mt-2 font-bold text-ink-900 tabular"
                  style={{ fontFamily: "var(--font-display)", fontSize: "2.25rem", lineHeight: 1 }}
                >
                  {hoursToday.toLocaleString()}
                </p>
                <p className="t-caption mt-1.5 text-grey-700">
                  About {currency(costToday)} of account-team time.
                </p>
              </div>
            </div>

            <div className="card-shape border border-border-200 bg-section p-5">
              <p className="t-h4">
                To give all {n.toLocaleString()} groups the same programme by
                hand
              </p>
              <p className="mt-2 text-[0.9375rem] text-grey-700">
                {hoursIfAll.toLocaleString()} hours, roughly{" "}
                <span className="font-semibold text-ink-900">
                  {currency(costIfAll)}
                </span>{" "}
                a year, or about{" "}
                <span className="font-semibold text-ink-900">
                  {(hoursIfAll / 1800).toFixed(1)}
                </span>{" "}
                full-time people doing nothing else.
              </p>
              <p className="mt-3 text-[0.9375rem] text-grey-700">
                That is the number the conversation is actually about. It is
                not a savings claim. It is your own arithmetic.
              </p>
            </div>

            <SourceNote>
              Your inputs · 1,800 productive hours assumed per full-time year ·
              no TruHu figure is included in this model. Pricing is per client
              group and we will walk you through how it is structured on a first
              call.
            </SourceNote>
          </div>
        )}
      </div>
    </div>
  );
}
