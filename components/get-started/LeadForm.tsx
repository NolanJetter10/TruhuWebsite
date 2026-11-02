"use client";

import { CheckCircle } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { cx } from "@/components/ui/primitives";
import { converted, track, trackingContext } from "@/lib/analytics/tracker";
import { useFlows } from "./FlowProvider";

/**
 * What the popups that ask for an email share: the guide upload (GuideUpload),
 * the client's guide (BuildGuideForm) and the sample picker (SamplePicker).
 * The email field with its button, the inputs and their errors, the hidden
 * honeypot, the done state, the lead request, and Bryan's closing line before
 * the popup goes.
 */

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** With no call to hear him, the closing line stays up long enough to read. */
const readingMs = (line: string) => Math.max(4_000, line.split(/\s+/).length * 250);
/** A beat after he stops talking before the popup goes. */
const AFTER_SPEECH_MS = 600;

/**
 * Returns `finish(line)`: Bryan says the closing line, and once he has (or
 * it's been up long enough to read) the popup closes. If the visitor has
 * moved on to another popup by then, it stays open.
 */
export function useFinish() {
  const flows = useFlows();
  const say = flows?.say;
  const close = flows?.close;
  /** False once the popup has moved on, so a late close can't shut another flow. */
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  return useCallback(
    async (line: string) => {
      if (!say || !close) return;
      const spoken = await say(line);
      await new Promise((resolve) => setTimeout(resolve, spoken ? AFTER_SPEECH_MS : readingMs(line)));
      if (mounted.current) close("done");
    },
    [say, close],
  );
}

export type LeadPath = "samples" | "build";

/**
 * Sends a lead to /api/leads: the samples or the client's guide. Tells GA4
 * and Clarity when it's saved (`converted`), logs `lead_error` when it
 * doesn't go through, and returns the server's code ("network" when it never
 * got there). The client's site goes as `clientUrl`; only the honeypot is
 * `website`.
 */
export async function sendLead(lead: {
  path: LeadPath;
  email: string;
  clientUrl?: string;
  /** The honeypot's value; empty for people. */
  website: string;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  try {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...lead, context: trackingContext() }),
    });
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean; code?: string };
    if (res.ok && body.ok) {
      // GA4's generate_lead and Clarity's tag; the server already set the step.
      converted(lead.path);
      return { ok: true };
    }
    const code = body.code ?? String(res.status);
    track("lead_error", code, { path: lead.path });
    return { ok: false, code };
  } catch {
    track("lead_error", "network", { path: lead.path });
    return { ok: false, code: "network" };
  }
}

/** The honeypot's value in a submitted form. */
export const honeypotValue = (form: HTMLFormElement) => String(new FormData(form).get("website") ?? "");

const INPUT =
  "min-w-0 rounded-xl border bg-white px-3.5 py-2.5 text-[0.9375rem] outline-none transition-colors focus:border-blue-500";

/** A text input, red when `error` is set and described by it. */
export function TextInput({
  ref,
  error,
  errorId,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  ref?: Ref<HTMLInputElement>;
  error?: string | null;
  errorId: string;
}) {
  return (
    <input
      ref={ref}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
      className={cx(INPUT, error ? "border-red-600" : "border-line", className)}
      {...props}
    />
  );
}

export function FieldError({ id, error }: { id: string; error?: string | null }) {
  return error ? (
    <p id={id} className="t-caption mt-1 text-red-600">
      {error}
    </p>
  ) : null;
}

/** Trouble with the request rather than a field. */
export function FormError({ error }: { error?: string | null }) {
  return error ? (
    <p role="alert" className="mt-3 text-[0.875rem] text-red-600">
      {error}
    </p>
  ) : null;
}

/** The green send button, worded `pendingLabel` while it sends. */
export function SubmitButton({
  pending,
  disabled,
  label,
  pendingLabel,
  className,
}: {
  pending: boolean;
  disabled?: boolean;
  label: string;
  pendingLabel: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={cx(
        "sheen flex shrink-0 items-center justify-center gap-2 rounded-full bg-green-500 px-5 py-2.5 text-[0.9375rem] font-semibold text-ink-950 shadow-[0_10px_28px_-12px_rgba(56,176,0,0.75)] transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-green-400 disabled:cursor-wait disabled:opacity-70",
        className,
      )}
    >
      <span className="relative z-[2]">{pending ? pendingLabel : label}</span>
    </button>
  );
}

/** Hidden from people, irresistible to naive bots. Its value is sent as `website`. */
export function Honeypot({ id }: { id: string }) {
  return (
    <div aria-hidden className="absolute -left-[9999px]">
      <label htmlFor={id}>Website</label>
      <input id={id} name="website" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

/**
 * A work email with its send button beside it (under it on a phone), its
 * error and the form's. The caller's <form> wraps it, with a Honeypot.
 */
export function EmailRow({
  id,
  label,
  value,
  onChange,
  error,
  inputRef,
  pending,
  disabled,
  submit,
  pendingLabel,
}: {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  inputRef?: Ref<HTMLInputElement>;
  pending: boolean;
  disabled?: boolean;
  submit: string;
  pendingLabel: string;
}) {
  return (
    <>
      <label htmlFor={id} className="text-[0.8125rem] font-semibold">
        {label}
      </label>
      <div className="mt-1.5 flex flex-col gap-2.5 sm:flex-row">
        <TextInput
          ref={inputRef}
          id={id}
          type="email"
          autoComplete="email"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          error={error}
          errorId={`${id}-error`}
          className="flex-1"
        />
        <SubmitButton pending={pending} disabled={disabled} label={submit} pendingLabel={pendingLabel} />
      </div>
      <FieldError id={`${id}-error`} error={error} />
    </>
  );
}

/** A finished form: a tick, a title, what happens next and anything under it. */
export function DoneState({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return (
    <div className="bk-enter px-6 py-8 text-center">
      <CheckCircle aria-hidden weight="fill" className="mx-auto size-11 text-green-500" />
      <p className="t-h4 mt-3">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-[0.9375rem] text-slate-600">{body}</p>
      {children}
    </div>
  );
}

/** The white card a form popup's body sits in. */
export const FORM_CARD =
  "card-shape-lg relative overflow-hidden border border-white/10 bg-white text-ink shadow-[0_40px_90px_-40px_rgba(2,8,18,0.85)]";
