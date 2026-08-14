"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitDemoRequest, type FormState } from "@/app/actions";
import { SubmitButton } from "@/components/ui/CTAButton";
import { cx } from "@/components/ui/primitives";

const EMPTY: FormState = { ok: false };

const GROUP_BANDS = ["Under 25", "25–100", "100–500", "500+"] as const;
const INTERESTS = ["TruHu Advisor", "TruHu Workforce", "Both"] as const;

/**
 * One form, two intents. The demo variant asks for what the call needs — a
 * phone number and, ideally, one client's plan documents. The pricing variant
 * is the qualification form: book size and products, nothing else.
 */
export function DemoForm({ variant = "demo" }: { variant?: "demo" | "pricing" }) {
  const [state, action] = useActionState(submitDemoRequest, EMPTY);

  if (state.ok) {
    return (
      <div className="card-shape border border-green-500/30 bg-green-100 p-8">
        <p className="t-h3 text-green-700">Request received</p>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-slate-600">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="card-shape border border-line bg-white p-7 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="name" label="Name" error={state.errors?.name} autoComplete="name" />
        <Field
          name="email"
          label="Work email"
          type="email"
          error={state.errors?.email}
          autoComplete="email"
        />
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field
          name="org"
          label="Brokerage"
          error={state.errors?.org}
          autoComplete="organization"
        />
        {variant === "demo" ? (
          <Field name="phone" label="Phone" type="tel" optional autoComplete="tel" />
        ) : null}
        <Field
          name="groups"
          label="Employer groups you serve"
          as="select"
          options={GROUP_BANDS}
        />
        <Field
          name="interest"
          label="What you want to see"
          as="select"
          options={INTERESTS}
        />
      </div>

      {variant === "demo" ? (
        <>
          <div className="mt-5">
            <label
              htmlFor="plan_docs"
              className="text-[0.8125rem] font-semibold text-ink"
            >
              Plan documents
              <span className="ml-1.5 font-normal text-slate-400">optional</span>
            </label>
            <input
              id="plan_docs"
              name="plan_docs"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-[0.9375rem] text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-paper file:px-4 file:py-1.5 file:text-[0.8125rem] file:font-semibold file:text-slate-600"
            />
            <p className="t-caption mt-1.5 text-slate-400">
              One client&apos;s SBCs and rate sheets are enough to build the guide live.
            </p>
          </div>
          <div className="mt-5">
            <Field name="note" label="Anything we should know?" as="textarea" optional />
          </div>
        </>
      ) : null}

      {/* Honeypot. Hidden from people, irresistible to naive bots. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label htmlFor="company_website">Company website</label>
        <input id="company_website" name="company_website" tabIndex={-1} autoComplete="off" />
      </div>

      {state.message ? (
        <p className="mt-5 text-[0.9375rem] text-red-600">{state.message}</p>
      ) : null}

      <div className="mt-7 flex flex-wrap items-center gap-4">
        <Submit label={variant === "pricing" ? "Get pricing" : "Book a demo"} />
        <p className="t-caption text-slate-400">
          One business day. No sequence, no drip.
        </p>
      </div>
    </form>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <SubmitButton pending={pending}>
      {pending ? "Sending…" : label}
    </SubmitButton>
  );
}

function Field({
  name,
  label,
  type = "text",
  error,
  as,
  options,
  optional,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  error?: string;
  as?: "textarea" | "select";
  options?: readonly string[];
  optional?: boolean;
  autoComplete?: string;
}) {
  const shared = cx(
    "mt-2 w-full rounded-xl border bg-white px-4 py-3 text-[0.9375rem] transition-colors duration-200 outline-none placeholder:text-slate-400 focus:border-blue-500",
    error ? "border-red-600" : "border-line",
  );

  return (
    <div>
      <label htmlFor={name} className="text-[0.8125rem] font-semibold text-ink">
        {label}
        {optional ? (
          <span className="ml-1.5 font-normal text-slate-400">optional</span>
        ) : null}
      </label>
      {as === "textarea" ? (
        <textarea id={name} name={name} rows={3} className={shared} />
      ) : as === "select" ? (
        <select id={name} name={name} defaultValue="" className={cx(shared, "appearance-none")}>
          <option value="" disabled>
            Select…
          </option>
          {options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${name}-error` : undefined}
          className={shared}
        />
      )}
      {error ? (
        <p id={`${name}-error`} className="t-caption mt-1.5 text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
