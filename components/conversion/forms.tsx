"use client";

import { useActionState } from "react";
import { Check } from "@phosphor-icons/react/ssr";
import {
  submitDemoRequest,
  submitEarlyAccess,
  submitResourceRequest,
  type FormState,
} from "@/app/actions";
import { SubmitButton } from "@/components/ui/CTAButton";
import { cx } from "@/components/ui/primitives";

const EMPTY: FormState = { ok: false };

/** A field a human never sees and a naive bot always fills in. */
function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label htmlFor="company_website">Company website</label>
      <input id="company_website" name="company_website" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

function Input({
  name,
  label,
  type = "text",
  required,
  error,
  placeholder,
  tone = "light",
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  tone?: "light" | "dark";
  autoComplete?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className={cx(
          "block text-[0.8125rem] font-medium",
          tone === "dark" ? "text-white" : "text-ink-900",
        )}
      >
        {label}
        {required ? (
          <span className="ml-1 text-grey-500" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={cx(
          "mt-1.5 w-full rounded-lg border px-3 py-2.5 text-[0.9375rem] outline-none",
          tone === "dark"
            ? "border-white/20 bg-white/8 text-white placeholder:text-white/40 focus:border-white/50"
            : "border-border-200 bg-white text-ink-900 placeholder:text-grey-500 focus:border-blue-500",
          error && "border-red-600",
        )}
      />
      {error ? (
        <p id={`${name}-error`} className="t-caption mt-1 text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Success({ message, tone }: { message: string; tone: "light" | "dark" }) {
  return (
    <div
      className={cx(
        "card-shape flex items-start gap-3 border p-5",
        tone === "dark"
          ? "border-white/15 bg-white/8 text-white"
          : "border-green-100 bg-green-100/50 text-ink-900",
      )}
      role="status"
    >
      <span
        className={cx(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
          tone === "dark" ? "bg-leaf-400/20 text-leaf-400" : "bg-green-500 text-white",
        )}
      >
        <Check weight="bold" className="size-3.5" aria-hidden />
      </span>
      <p className="text-[0.9375rem] leading-relaxed">{message}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function DemoForm({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [state, action, pending] = useActionState(submitDemoRequest, EMPTY);

  if (state.ok && state.message) return <Success message={state.message} tone={tone} />;

  return (
    <form action={action} className="relative space-y-4">
      <Honeypot />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="name" label="Name" required tone={tone} error={state.errors?.name} autoComplete="name" />
        <Input
          name="email"
          label="Work email"
          type="email"
          required
          tone={tone}
          error={state.errors?.email}
          autoComplete="email"
        />
        <Input name="org" label="Brokerage or employer" required tone={tone} error={state.errors?.org} autoComplete="organization" />
        <Input name="role" label="Your role" tone={tone} placeholder="Account manager, principal, ops" />
      </div>
      <Input
        name="groups"
        label="Roughly how many client groups?"
        tone={tone}
        placeholder="Skip it if you are an employer"
      />
      <div>
        <label
          htmlFor="note"
          className={cx(
            "block text-[0.8125rem] font-medium",
            tone === "dark" ? "text-white" : "text-ink-900",
          )}
        >
          Anything you want to see specifically?
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          className={cx(
            "mt-1.5 w-full rounded-lg border px-3 py-2.5 text-[0.9375rem] outline-none",
            tone === "dark"
              ? "border-white/20 bg-white/8 text-white placeholder:text-white/40 focus:border-white/50"
              : "border-border-200 bg-white text-ink-900 placeholder:text-grey-500 focus:border-blue-500",
          )}
        />
      </div>

      {state.message && !state.ok ? (
        <p className="t-caption text-red-600">{state.message}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pending={pending} variant="primary">
          {pending ? "Sending…" : "Book a demo"}
        </SubmitButton>
        <p className={cx("t-caption", tone === "dark" ? "text-white/60" : "text-grey-500")}>
          No CAPTCHA. One reply, from a person.
        </p>
      </div>
    </form>
  );
}

export function EarlyAccessForm({
  workflow,
  tone = "light",
}: {
  workflow: string;
  tone?: "light" | "dark";
}) {
  const [state, action, pending] = useActionState(submitEarlyAccess, EMPTY);

  if (state.ok && state.message) return <Success message={state.message} tone={tone} />;

  return (
    <form action={action} className="relative">
      <Honeypot />
      <input type="hidden" name="workflow" value={workflow} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            name="email"
            label="Work email"
            type="email"
            required
            tone={tone}
            error={state.errors?.email}
            autoComplete="email"
          />
        </div>
        <SubmitButton pending={pending} variant="primary">
          {pending ? "Adding…" : "Request early access"}
        </SubmitButton>
      </div>
      {state.message && !state.ok ? (
        <p className="t-caption mt-2 text-red-600">{state.message}</p>
      ) : null}
    </form>
  );
}

export function ResourceForm({ resource }: { resource: string }) {
  const [state, action, pending] = useActionState(submitResourceRequest, EMPTY);

  if (state.ok && state.message) return <Success message={state.message} tone="light" />;

  return (
    <form action={action} className="relative">
      <Honeypot />
      <input type="hidden" name="resource" value={resource} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            name="email"
            label="Work email"
            type="email"
            required
            error={state.errors?.email}
            autoComplete="email"
          />
        </div>
        <SubmitButton pending={pending}>
          {pending ? "Sending…" : "Send me the research"}
        </SubmitButton>
      </div>
      {state.message && !state.ok ? (
        <p className="t-caption mt-2 text-red-600">{state.message}</p>
      ) : null}
    </form>
  );
}
