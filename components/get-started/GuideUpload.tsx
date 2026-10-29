"use client";

import {
  ArrowClockwise,
  CheckCircle,
  FileArrowUp,
  FileText,
  Info,
  Warning,
  X,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { cx } from "@/components/ui/primitives";
import { track, trackingContext } from "@/lib/analytics/tracker";
import { GUIDE_ACCEPT, MAX_FILES, guideFileProblem } from "@/lib/guide/files";
import { useFlows } from "./FlowProvider";

/**
 * The guide popup's body: drop in plan documents or last year's guide, then
 * an email to send the finished guide to.
 *
 *   drop or choose files → each uploads with its own progress → Bryan says
 *   the email line → email → done → Bryan's closing line → the popup closes
 *
 * Each file goes straight to storage on a signed link from
 * /api/guide/upload-url; /api/guide then takes the email and tells the team.
 * Every step is logged for the agent (see FlowProvider), so Bryan knows on
 * his next reply.
 */

type Item = {
  key: string;
  file: File;
  state: "uploading" | "done" | "error";
  progress: number;
  /** Why it failed, when it did; `retry` says whether trying again can help. */
  problem?: string;
  retry?: boolean;
};

type Phase = "files" | "email" | "sending" | "done";
/** `url` is null in the storage-less demo: there's nowhere to send the file. */
type Target = { url: string | null; headers: Record<string, string> };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** With no call to hear him, the closing line stays up long enough to read. */
const readingMs = (line: string) => Math.max(4_000, line.split(/\s+/).length * 250);
/** A beat after he stops talking before the popup goes. */
const AFTER_SPEECH_MS = 600;

const size = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** In the demo, the progress a real upload would show, about a second long. */
function pretend(onProgress: (share: number) => void) {
  return new Promise<boolean>((resolve) => {
    let share = 0;
    const timer = setInterval(() => {
      share = Math.min(1, share + 0.12 + Math.random() * 0.1);
      onProgress(share);
      if (share >= 1) {
        clearInterval(timer);
        resolve(true);
      }
    }, 120);
  });
}

/** One file to storage, with progress. fetch can't report upload progress. */
function put(file: File, target: Target, onProgress: (share: number) => void) {
  const url = target.url;
  if (!url) return pretend(onProgress);
  return new Promise<boolean>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [name, value] of Object.entries(target.headers)) xhr.setRequestHeader(name, value);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.send(file);
  });
}

export function GuideUpload() {
  const flows = useFlows();
  const [items, setItemsState] = useState<Item[]>([]);
  const [phase, setPhaseState] = useState<Phase>("files");
  const [dragging, setDragging] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // The upload callbacks outlive the render that started them, so they read
  // and write through these.
  const itemsRef = useRef<Item[]>([]);
  const phaseRef = useRef<Phase>("files");
  const uploadId = useRef<string | null>(null);
  const inflight = useRef(0);
  const reported = useRef(new Set<string>());
  const emailInput = useRef<HTMLInputElement>(null);
  /** False once the popup has moved on, so a late close can't shut another flow. */
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  if (!flows) return null;
  const { copy: all, say, log, close } = flows;
  const copy = all.guide;

  function setItems(next: (current: Item[]) => Item[]) {
    itemsRef.current = next(itemsRef.current);
    setItemsState(itemsRef.current);
  }
  const patch = (key: string, changes: Partial<Item>) =>
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...changes } : item)));
  function setPhase(next: Phase) {
    phaseRef.current = next;
    setPhaseState(next);
  }

  function add(list: FileList | null) {
    if (!list?.length) return;
    let room = MAX_FILES - itemsRef.current.filter((item) => item.state !== "error").length;
    const fresh: Item[] = [];
    const refused: Item[] = [];
    for (const file of Array.from(list)) {
      const problem = guideFileProblem(file.name, file.size);
      const item: Item = { key: crypto.randomUUID(), file, state: "uploading", progress: 0 };
      if (problem || room <= 0) {
        const why = problem === "size" ? copy.tooBig : problem === "type" ? copy.wrongType : copy.tooMany;
        refused.push({ ...item, state: "error", problem: why });
      } else {
        room -= 1;
        fresh.push(item);
      }
    }
    setItems((current) => [...current, ...fresh, ...refused]);
    if (refused.length) track("guide_refused", String(refused.length));
    if (fresh.length) void upload(fresh);
  }

  async function upload(batch: Item[]) {
    inflight.current += 1;
    const fail = (problem: string, retry: boolean) =>
      batch.forEach((item) => patch(item.key, { state: "error", problem, retry }));
    try {
      const res = await fetch("/api/guide/upload-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          uploadId: uploadId.current,
          files: batch.map((item) => ({ name: item.file.name, size: item.file.size })),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        uploadId?: string;
        files?: Target[];
        code?: string;
      };
      if (!res.ok || !body.uploadId || body.files?.length !== batch.length) {
        track("guide_error", body.code ?? String(res.status));
        if (body.code === "count") fail(copy.tooMany, false);
        else if (body.code === "size") fail(copy.tooBig, false);
        else if (body.code === "type") fail(copy.wrongType, false);
        else fail(copy.failed, true);
        return;
      }
      uploadId.current = body.uploadId;
      const targets = body.files;
      await Promise.all(
        batch.map(async (item, i) => {
          const ok = await put(item.file, targets[i], (progress) => patch(item.key, { progress }));
          patch(item.key, ok ? { state: "done", progress: 1 } : { state: "error", problem: copy.failed, retry: true });
          if (!ok) track("guide_error", "put");
        }),
      );
    } catch {
      track("guide_error", "network");
      fail(copy.failed, true);
    } finally {
      inflight.current -= 1;
      settle();
    }
  }

  /** Once nothing is uploading: tell the agent what arrived, then ask for the email. */
  function settle() {
    if (inflight.current > 0) return;
    const done = itemsRef.current.filter((item) => item.state === "done");
    const fresh = done.filter((item) => !reported.current.has(item.key));
    if (!fresh.length) return;
    fresh.forEach((item) => reported.current.add(item.key));
    const names = fresh.map((item) => item.file.name).join(", ");
    log(`The visitor uploaded ${fresh.length} file${fresh.length === 1 ? "" : "s"} for their guide: ${names}.`);
    track("guide_files", String(done.length));
    if (phaseRef.current === "files") {
      setPhase("email");
      void say(copy.emailLine);
      requestAnimationFrame(() => emailInput.current?.focus({ preventScroll: true }));
    }
  }

  function retry(item: Item) {
    patch(item.key, { state: "uploading", progress: 0, problem: undefined });
    void upload([{ ...item, state: "uploading", progress: 0 }]);
  }

  const remove = (item: Item) => setItems((current) => current.filter((i) => i.key !== item.key));

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    add(event.dataTransfer.files);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phaseRef.current !== "email" || inflight.current > 0) return;
    const value = email.trim();
    if (!EMAIL.test(value)) {
      setEmailError(copy.invalidEmail);
      emailInput.current?.focus();
      return;
    }
    setEmailError(null);
    setFormError(null);
    setPhase("sending");
    const honeypot = new FormData(event.currentTarget).get("website");
    try {
      const res = await fetch("/api/guide", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          uploadId: uploadId.current,
          email: value,
          website: honeypot,
          context: trackingContext(),
          // Only read in the storage-less demo, where the server kept nothing.
          files: itemsRef.current
            .filter((item) => item.state === "done")
            .map((item) => ({ name: item.file.name, size: item.file.size })),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; code?: string };
      if (res.ok && body.ok) {
        setPhase("done");
        log("The visitor entered their email, so TruHu's team can send them the finished guide.");
        track("guide_sent");
        // Bryan's closing line, then back to the page as it was.
        const spoken = await say(copy.doneLine);
        await new Promise((resolve) =>
          setTimeout(resolve, spoken ? AFTER_SPEECH_MS : readingMs(copy.doneLine)),
        );
        if (mounted.current) close("done");
        return;
      }
      setPhase("email");
      track("guide_error", body.code ?? String(res.status));
      if (body.code === "email") setEmailError(copy.invalidEmail);
      else setFormError(copy.error);
    } catch {
      setPhase("email");
      track("guide_error", "network");
      setFormError(copy.error);
    }
  }

  const uploading = items.some((item) => item.state === "uploading");
  const sent = items.filter((item) => item.state === "done");

  return (
    <div
      data-section="flow-guide"
      data-track-ignore
      className="card-shape-lg relative overflow-hidden border border-white/10 bg-white text-ink shadow-[0_40px_90px_-40px_rgba(2,8,18,0.85)]"
    >
      {phase === "done" ? (
        <div className="bk-enter px-6 py-8 text-center">
          <CheckCircle aria-hidden weight="fill" className="mx-auto size-11 text-green-500" />
          <p className="t-h4 mt-3">{copy.doneTitle}</p>
          <p className="mx-auto mt-2 max-w-sm text-[0.9375rem] text-slate-600">
            {copy.done.replace("{email}", email.trim())}
          </p>
          <ul className="mx-auto mt-5 max-w-sm space-y-1.5 text-left">
            {sent.map((item) => (
              <li key={item.key} className="flex items-center gap-2 text-[0.8125rem] text-slate-600">
                <FileText aria-hidden className="size-4 shrink-0 text-blue-700" />
                <span className="truncate">{item.file.name}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="px-5 py-5 sm:px-6">
          <label
            htmlFor="guide-files"
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
            }}
            onDrop={onDrop}
            className={cx(
              "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-4 text-center transition-colors has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-blue-500",
              items.length ? "py-4" : "py-9",
              dragging
                ? "border-blue-500 bg-blue-100"
                : "border-blue-500/35 bg-paper hover:border-blue-500 hover:bg-blue-100/60",
            )}
          >
            <FileArrowUp aria-hidden className={cx("text-blue-700", items.length ? "size-6" : "size-9")} />
            <span className="text-[0.9375rem] font-semibold">
              {items.length ? copy.addMore : copy.drop}
            </span>
            <span className="text-[0.8125rem] text-slate-600">{copy.types}</span>
            <input
              id="guide-files"
              type="file"
              multiple
              accept={GUIDE_ACCEPT}
              className="sr-only"
              onChange={(event) => {
                add(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
          <p className="mt-3 flex items-start gap-2 text-[0.8125rem] leading-snug text-slate-600">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-blue-700" />
            {copy.note}
          </p>

          {items.length ? (
            <ul className="mt-4 space-y-2" aria-live="polite">
              {items.map((item) => (
                <FileRow
                  key={item.key}
                  item={item}
                  copy={copy}
                  onRetry={() => retry(item)}
                  onRemove={() => remove(item)}
                />
              ))}
            </ul>
          ) : null}

          {phase === "email" || phase === "sending" ? (
            <form
              onSubmit={submit}
              noValidate
              // Session recordings never show what's typed here.
              data-clarity-mask="true"
              className="bk-enter mt-5 border-t border-line pt-5"
            >
              <label htmlFor="guide-email" className="text-[0.8125rem] font-semibold">
                {copy.email}
              </label>
              <div className="mt-1.5 flex flex-col gap-2.5 sm:flex-row">
                <input
                  ref={emailInput}
                  id="guide-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  aria-invalid={emailError ? true : undefined}
                  aria-describedby={emailError ? "guide-email-error" : undefined}
                  className={cx(
                    "min-w-0 flex-1 rounded-xl border bg-white px-3.5 py-2.5 text-[0.9375rem] outline-none transition-colors focus:border-blue-500",
                    emailError ? "border-red-600" : "border-line",
                  )}
                />
                <button
                  type="submit"
                  disabled={phase === "sending" || uploading}
                  className="sheen flex shrink-0 items-center justify-center gap-2 rounded-full bg-green-500 px-5 py-2.5 text-[0.9375rem] font-semibold text-ink-950 shadow-[0_10px_28px_-12px_rgba(56,176,0,0.75)] transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-green-400 disabled:cursor-wait disabled:opacity-70"
                >
                  <span className="relative z-[2]">{phase === "sending" ? copy.pending : copy.submit}</span>
                </button>
              </div>
              {emailError ? (
                <p id="guide-email-error" className="t-caption mt-1 text-red-600">
                  {emailError}
                </p>
              ) : null}
              {formError ? (
                <p role="alert" className="mt-3 text-[0.875rem] text-red-600">
                  {formError}
                </p>
              ) : null}
              {/* Honeypot. Hidden from people, irresistible to naive bots. */}
              <div aria-hidden className="absolute -left-[9999px]">
                <label htmlFor="guide-website">Website</label>
                <input id="guide-website" name="website" tabIndex={-1} autoComplete="off" />
              </div>
            </form>
          ) : null}
        </div>
      )}
    </div>
  );
}

function FileRow({
  item,
  copy,
  onRetry,
  onRemove,
}: {
  item: Item;
  copy: NonNullable<ReturnType<typeof useFlows>>["copy"]["guide"];
  onRetry: () => void;
  onRemove: () => void;
}) {
  const failed = item.state === "error";
  return (
    <li
      className={cx(
        "rounded-xl border px-3.5 py-2.5",
        failed ? "border-red-600/30 bg-red-600/[0.04]" : "border-line bg-white",
      )}
    >
      <div className="flex items-center gap-2.5">
        {failed ? (
          <Warning aria-hidden className="size-5 shrink-0 text-red-600" />
        ) : item.state === "done" ? (
          <CheckCircle aria-hidden weight="fill" className="size-5 shrink-0 text-green-500" />
        ) : (
          <FileText aria-hidden className="size-5 shrink-0 text-blue-700" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.875rem] font-semibold">{item.file.name}</span>
          {failed ? (
            <span className="block text-[0.75rem] leading-snug text-red-600">{item.problem}</span>
          ) : null}
        </span>
        {failed ? null : (
          <span className="shrink-0 text-[0.75rem] text-slate-400 tabular">{size(item.file.size)}</span>
        )}
        {failed && item.retry ? (
          <button
            type="button"
            onClick={onRetry}
            aria-label={`${copy.retry}: ${item.file.name}`}
            title={copy.retry}
            className="grid size-7 shrink-0 place-items-center rounded-full text-blue-700 hover:bg-blue-100"
          >
            <ArrowClockwise className="size-4" />
          </button>
        ) : null}
        {failed ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`${copy.remove}: ${item.file.name}`}
            title={copy.remove}
            className="grid size-7 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-paper hover:text-ink"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      {item.state === "uploading" ? (
        <div
          role="progressbar"
          aria-label={item.file.name}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(item.progress * 100)}
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper"
        >
          <div
            className="h-full rounded-full bg-blue-500 transition-[width] duration-200"
            style={{ width: `${Math.max(4, item.progress * 100)}%` }}
          />
        </div>
      ) : null}
    </li>
  );
}
