"use client";

import { useRef, useState, type FormEvent } from "react";
import { startPath } from "@/lib/analytics/tracker";
import { useFlows } from "./FlowProvider";
import {
  DoneState,
  EMAIL,
  FieldError,
  FORM_CARD,
  FormError,
  Honeypot,
  honeypotValue,
  sendLead,
  SubmitButton,
  TextInput,
  useFinish,
} from "./LeadForm";

/** A website, with or without its scheme: clientcompany.com, https://www.client.com/about. */
const SITE = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?([/?#]\S*)?$/i;

/** The client's site as the visitor will recognise it in the done state. */
const host = (url: string) => url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/[/?#].*$/, "");

/**
 * "Build a guide for your client", the `build` popup's body: a work email
 * and the client's website, sent as a `build` lead (/api/leads), which the
 * server checks and normalises. Then the done state, Bryan's closing line,
 * and the popup closes, as the guide upload does (LeadForm).
 */
export function BuildGuideForm() {
  const flows = useFlows();
  const [email, setEmail] = useState("");
  const [site, setSite] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [siteError, setSiteError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"form" | "sending" | "done">("form");
  const emailInput = useRef<HTMLInputElement>(null);
  const siteInput = useRef<HTMLInputElement>(null);
  const finish = useFinish();

  if (!flows) return null;
  const { copy: all, log } = flows;
  const copy = all.build;

  /** The first keystroke in either field is the build path's first real step. */
  const typed = () => {
    if (!email && !site) startPath("build", "build");
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phase !== "form") return;
    const mail = email.trim();
    const url = site.trim();
    const badMail = !EMAIL.test(mail);
    const badUrl = !SITE.test(url);
    setEmailError(badMail ? copy.invalidEmail : null);
    setSiteError(badUrl ? copy.invalidUrl : null);
    if (badMail || badUrl) {
      (badMail ? emailInput : siteInput).current?.focus();
      return;
    }
    setFormError(null);
    setPhase("sending");
    const result = await sendLead({
      path: "build",
      email: mail,
      clientUrl: url,
      website: honeypotValue(event.currentTarget),
    });
    if (result.ok) {
      setPhase("done");
      log(`The visitor asked TruHu to build a guide for their client, ${host(url)}, and gave their work email.`);
      // Bryan's closing line, then back to the page as it was.
      await finish(copy.doneLine);
      return;
    }
    setPhase("form");
    if (result.code === "email") setEmailError(copy.invalidEmail);
    else if (result.code === "client_url") setSiteError(copy.invalidUrl);
    else setFormError(copy.error);
  }

  return (
    <div data-section="flow-build" data-track-ignore className={FORM_CARD}>
      {phase === "done" ? (
        <DoneState
          title={copy.doneTitle}
          body={copy.done.replace("{site}", host(site.trim())).replace("{email}", email.trim())}
        />
      ) : (
        <form
          onSubmit={submit}
          noValidate
          // Session recordings never show what's typed here.
          data-clarity-mask="true"
          className="relative space-y-4 px-5 py-5 sm:px-6"
        >
          <div>
            <label htmlFor="build-email" className="text-[0.8125rem] font-semibold">
              {copy.email}
            </label>
            <TextInput
              ref={emailInput}
              id="build-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                typed();
                setEmail(event.target.value);
                if (emailError) setEmailError(null);
              }}
              error={emailError}
              errorId="build-email-error"
              className="mt-1.5 w-full"
            />
            <FieldError id="build-email-error" error={emailError} />
          </div>
          <div>
            <label htmlFor="build-site" className="text-[0.8125rem] font-semibold">
              {copy.clientUrl}
            </label>
            <TextInput
              ref={siteInput}
              id="build-site"
              type="url"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={copy.clientUrlPlaceholder}
              value={site}
              onChange={(event) => {
                typed();
                setSite(event.target.value);
                if (siteError) setSiteError(null);
              }}
              error={siteError}
              errorId="build-site-error"
              className="mt-1.5 w-full"
            />
            <FieldError id="build-site-error" error={siteError} />
          </div>
          <SubmitButton
            pending={phase === "sending"}
            label={copy.submit}
            pendingLabel={copy.pending}
            className="w-full sm:w-auto"
          />
          <FormError error={formError} />
          <Honeypot id="build-website" />
        </form>
      )}
    </div>
  );
}
