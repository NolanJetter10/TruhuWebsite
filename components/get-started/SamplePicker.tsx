"use client";

import { ArrowRight, CheckCircle, Info } from "@phosphor-icons/react";
import Image, { type StaticImageData } from "next/image";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { startPath } from "@/lib/analytics/tracker";
import flyerCover from "@/public/kindlerye/flyer/p01-cover.webp";
import guideCover from "@/public/kindlerye/guide/p01-cover.webp";
import guideWelcome from "@/public/kindlerye/guide/p03-welcome.webp";
import guideMedical from "@/public/kindlerye/guide/p08-medical.webp";
import siteHome from "@/public/kindlerye/microsite/home-desktop.webp";
import { SAMPLE_FLOWS, type SampleFlow } from "./flows";
import { useFlows } from "./FlowProvider";
import { EMAIL, EmailRow, FORM_CARD, FormError, Honeypot, honeypotValue, sendLead } from "./LeadForm";

/** A page of a document, standing in its tile with a shadow. */
function Page({ src, className }: { src: StaticImageData; className?: string }) {
  return (
    <Image
      src={src}
      alt=""
      sizes="(min-width: 640px) 120px, 30vw"
      className={`h-[84%] w-auto rounded-[3px] shadow-[0_10px_24px_-10px_rgba(5,14,26,0.55)] ring-1 ring-black/5 ${className ?? ""}`}
    />
  );
}

/** Each sample's thumbnail, drawn from the same Kindlerye files its popup shows. */
const THUMBS: Record<SampleFlow, ReactNode> = {
  // The benefits site's home page, in a small browser frame.
  microsite: (
    <span className="absolute inset-x-[9%] top-[12%] bottom-0 flex flex-col overflow-hidden rounded-t-md bg-white shadow-[0_10px_24px_-10px_rgba(5,14,26,0.55)] ring-1 ring-black/5">
      <span aria-hidden className="flex h-2.5 shrink-0 items-center gap-0.5 bg-paper px-1.5">
        <span className="size-1 rounded-full bg-red-600/40" />
        <span className="size-1 rounded-full bg-amber-500/40" />
        <span className="size-1 rounded-full bg-green-500/45" />
      </span>
      <span className="relative min-h-0 flex-1">
        <Image src={siteHome} alt="" fill sizes="(min-width: 640px) 200px, 45vw" className="object-cover object-top" />
      </span>
    </span>
  ),
  sampleGuide: <Page src={guideCover} />,
  // Open at a spread, the way the flipbook shows it.
  flipbook: (
    <span className="flex h-[66%] items-stretch shadow-[0_10px_24px_-10px_rgba(5,14,26,0.55)]">
      <Image src={guideWelcome} alt="" sizes="(min-width: 640px) 90px, 22vw" className="h-full w-auto rounded-l-[3px]" />
      <span aria-hidden className="w-px bg-black/15" />
      <Image src={guideMedical} alt="" sizes="(min-width: 640px) 90px, 22vw" className="h-full w-auto rounded-r-[3px]" />
    </span>
  ),
  flyer: <Page src={flyerCover} />,
};

/**
 * The sample picker, `samples`: Kindlerye's website, guide, flipbook and
 * flyer, each opening its own popup as if Bryan had (`from: "samples"`).
 * Nothing is gated: the picker shows at once, and the work email under it,
 * to have the samples sent, is optional. Sending it is a `samples` lead
 * (/api/leads); the picker stays open so the visitor can keep looking.
 */
export function SamplePicker() {
  const flows = useFlows();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"email" | "sending" | "done">("email");
  const emailInput = useRef<HTMLInputElement>(null);

  if (!flows) return null;
  const { copy: all, open, say, log } = flows;
  const copy = all.samples;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phase !== "email") return;
    const value = email.trim();
    if (!EMAIL.test(value)) {
      setEmailError(copy.invalidEmail);
      emailInput.current?.focus();
      return;
    }
    setEmailError(null);
    setFormError(null);
    setPhase("sending");
    const result = await sendLead({ path: "samples", email: value, website: honeypotValue(event.currentTarget) });
    if (result.ok) {
      setPhase("done");
      log("The visitor entered their work email to have the samples sent.");
      void say(copy.doneLine);
      return;
    }
    setPhase("email");
    if (result.code === "email") setEmailError(copy.invalidEmail);
    else setFormError(copy.error);
  }

  return (
    <div data-section="flow-samples" data-track-ignore className={FORM_CARD}>
      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <div role="group" aria-label={copy.label} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {SAMPLE_FLOWS.map((flow, i) => (
            <button
              key={flow}
              type="button"
              onClick={() => open(flow, "samples")}
              style={{ animationDelay: `${60 + i * 40}ms` }}
              className="bk-enter group flex flex-col overflow-hidden rounded-2xl bg-paper text-left ring-1 ring-line transition-[transform,box-shadow] duration-200 ease-out-expo outline-none hover:-translate-y-0.5 hover:ring-2 hover:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <span className="relative flex aspect-[3/2] items-center sm:aspect-[4/3] justify-center overflow-hidden bg-linear-to-b from-blue-100 to-paper transition-transform duration-300 ease-out-expo">
                {THUMBS[flow]}
              </span>
              <span className="flex items-center justify-between gap-2 border-t border-line bg-white px-3 py-2.5">
                <span className="text-[0.9375rem] font-semibold">{copy.items[flow]}</span>
                <ArrowRight
                  aria-hidden
                  weight="bold"
                  className="size-4 shrink-0 text-blue-700 transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </span>
            </button>
          ))}
        </div>

        <p className="mt-3 flex items-start gap-2 text-[0.8125rem] leading-snug text-slate-600">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-blue-700" />
          {copy.note}
        </p>

        <div className="mt-4 border-t border-line pt-4">
          {phase === "done" ? (
            <p role="status" className="bk-enter flex items-start gap-2 text-[0.9375rem] text-ink">
              <CheckCircle aria-hidden weight="fill" className="mt-0.5 size-5 shrink-0 text-green-500" />
              {copy.done.replace("{email}", email.trim())}
            </p>
          ) : (
            <form
              onSubmit={submit}
              noValidate
              // Session recordings never show what's typed here.
              data-clarity-mask="true"
              className="relative"
            >
              <EmailRow
                id="samples-email"
                label={copy.email}
                value={email}
                onChange={(value) => {
                  // Typing in the form is a step into the samples path.
                  if (!email) startPath("samples", "samples");
                  setEmail(value);
                  if (emailError) setEmailError(null);
                }}
                error={emailError}
                inputRef={emailInput}
                pending={phase === "sending"}
                submit={copy.submit}
                pendingLabel={copy.pending}
              />
              <FormError error={formError} />
              <Honeypot id="samples-website" />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
