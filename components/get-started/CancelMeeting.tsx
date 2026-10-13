"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { track } from "@/lib/analytics/tracker";
import type { GET_STARTED_PAGE } from "@/lib/content";

type Copy = (typeof GET_STARTED_PAGE)["manage"];

/** Cancel, behind one confirming click so a stray tap can't do it. */
export function CancelMeeting({
  uid,
  copy,
  startOpen,
}: {
  uid: string;
  copy: Copy;
  startOpen: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "confirm" | "pending" | "error">(
    startOpen ? "confirm" : "idle",
  );

  async function cancel() {
    setState("pending");
    track("cancel_submit", uid);
    try {
      const res = await fetch(`/api/booking/${encodeURIComponent(uid)}/cancel`, {
        method: "POST",
      });
      if (res.ok) {
        router.push(`/get-started/confirmed?b=${encodeURIComponent(uid)}`);
        return;
      }
    } catch {}
    setState("error");
  }

  if (state === "idle") {
    return (
      <button
        type="button"
        onClick={() => setState("confirm")}
        className="mt-4 rounded-full border border-white/25 px-5 py-2.5 text-[0.9375rem] font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/[0.08]"
      >
        {copy.cancelButton}
      </button>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={cancel}
        disabled={state === "pending"}
        className="rounded-full bg-white px-5 py-2.5 text-[0.9375rem] font-semibold text-ink transition-colors hover:bg-red-600 hover:text-white disabled:cursor-wait disabled:opacity-70"
      >
        {state === "pending" ? copy.cancelPending : copy.cancelConfirm}
      </button>
      <button
        type="button"
        onClick={() => setState("idle")}
        disabled={state === "pending"}
        className="rounded-full px-4 py-2.5 text-[0.9375rem] font-semibold text-slate-300 hover:text-white"
      >
        {copy.cancelKeep}
      </button>
      {state === "error" ? (
        <p role="alert" className="basis-full text-[0.875rem] text-red-400">
          That didn&apos;t go through. Try again in a moment.
        </p>
      ) : null}
    </div>
  );
}
