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
import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { cx } from "@/components/ui/primitives";
import { converted, startPath, track, trackingContext } from "@/lib/analytics/tracker";
import { GUIDE_ACCEPT, MAX_FILES, guideFileProblem } from "@/lib/guide/files";
import { useFlows } from "./FlowProvider";
import { DoneState, EMAIL, EmailRow, FORM_CARD, FormError, Honeypot, honeypotValue, useFinish } from "./LeadForm";

/**
 * "Rebuild last year's guide", the guide popup's body: drop in last year's
 * guide and any plan documents, then an email to send the rebuilt guide to.
 *
 *   drop or choose files → each uploads with its own progress → Bryan says
 *   the email line → email → done → Bryan's closing line → the popup closes
 *
 * Each file goes straight to storage on a signed link from
 * /api/guide/upload-url; /api/guide then takes the email and tells the team.
 * Every step is logged for the agent (see FlowProvider), so Bryan knows on
 * his next reply. The email field, the done state and the closing line are
 * shared with the other form popups (LeadForm).
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
  const finish = useFinish();

  if (!flows) return null;
  const { copy: all, say, log } = flows;
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
    if (fresh.length) {
      // A file in is the rebuild path's first real step.
      startPath("rebuild", "guide");
      void upload(fresh);
    }
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
    const honeypot = honeypotValue(event.currentTarget);
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
        converted("rebuild");
        // Bryan's closing line, then back to the page as it was.
        await finish(copy.doneLine);
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
    <div data-section="flow-guide" data-track-ignore className={FORM_CARD}>
      {phase === "done" ? (
        <DoneState title={copy.doneTitle} body={copy.done.replace("{email}", email.trim())}>
          <ul className="mx-auto mt-5 max-w-sm space-y-1.5 text-left">
            {sent.map((item) => (
              <li key={item.key} className="flex items-center gap-2 text-[0.8125rem] text-slate-600">
                <FileText aria-hidden className="size-4 shrink-0 text-blue-700" />
                <span className="truncate">{item.file.name}</span>
              </li>
            ))}
          </ul>
        </DoneState>
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
              <EmailRow
                id="guide-email"
                label={copy.email}
                value={email}
                onChange={(value) => {
                  setEmail(value);
                  if (emailError) setEmailError(null);
                }}
                error={emailError}
                inputRef={emailInput}
                pending={phase === "sending"}
                disabled={uploading}
                submit={copy.submit}
                pendingLabel={copy.pending}
              />
              <FormError error={formError} />
              <Honeypot id="guide-website" />
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
