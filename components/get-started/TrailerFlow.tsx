"use client";

import { ArrowCounterClockwise, CalendarCheck } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics/tracker";
import { useFlows } from "./FlowProvider";

const SRC = "/videos/truhu-trailer.mp4";
const POSTER = "/videos/truhu-trailer-poster.jpg";
/** The quarters reported as `trailer_progress`; 100 is sent when it ends. */
const MARKS = [25, 50, 75] as const;

/**
 * The trailer, `trailer`: TruHu's 69-second trailer, which starts once Bryan
 * has said the flow's line (at once with no call), with the browser's own
 * controls. At the end it offers Bryan's calendar, Bryan's path 5: the
 * trailer, then the calendar.
 *
 * Each opening sends `trailer_play` on its first play and `trailer_progress`
 * once for each quarter watched.
 */
export function TrailerFlow() {
  const flows = useFlows();
  const spoken = flows?.spoken;
  const holdMic = flows?.holdMic;
  const video = useRef<HTMLVideoElement>(null);
  const sent = useRef(new Set<string>());
  const [ended, setEnded] = useState(false);

  // Plays once Bryan has finished his line. A browser that refuses to play
  // with sound leaves the poster and its play button.
  useEffect(() => {
    if (!spoken) return;
    let live = true;
    void spoken().then(() => {
      if (live) video.current?.play().catch(() => {});
    });
    return () => {
      live = false;
    };
  }, [spoken]);

  // In a live call the mic is held off while it plays (MicHold); closed
  // mid-play, it lets go.
  useEffect(() => () => holdMic?.(false), [holdMic]);

  if (!flows) return null;
  const copy = flows.copy.trailer;

  /** Sends an event once per opening. */
  const once = (key: string, send: () => void) => {
    if (sent.current.has(key)) return;
    sent.current.add(key);
    send();
  };

  function progress() {
    const el = video.current;
    if (!el || !el.duration) return;
    const share = (el.currentTime / el.duration) * 100;
    for (const mark of MARKS) {
      if (share >= mark) once(String(mark), () => track("trailer_progress", String(mark)));
    }
  }

  function replay() {
    const el = video.current;
    if (!el) return;
    setEnded(false);
    el.currentTime = 0;
    void el.play().catch(() => {});
  }

  return (
    <div data-section="flow-trailer" data-track-ignore className="relative overflow-hidden rounded-2xl bg-black">
      <video
        ref={video}
        src={SRC}
        poster={POSTER}
        controls
        playsInline
        preload="auto"
        aria-label={copy.title}
        onPlay={() => {
          setEnded(false);
          flows.holdMic(true);
          once("play", () => track("trailer_play"));
        }}
        onPause={() => flows.holdMic(false)}
        onTimeUpdate={progress}
        onEnded={() => {
          flows.holdMic(false);
          progress();
          once("100", () => track("trailer_progress", "100"));
          setEnded(true);
          flows.log("The visitor watched TruHu's trailer to the end.");
        }}
        className="block aspect-video max-h-[calc(100dvh-10rem)] w-full bg-black object-contain"
      />
      {ended ? (
        // Bryan's path 5: the trailer, then his calendar.
        <div className="bk-enter absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-950/75 p-4 backdrop-blur-[2px]">
          <button
            type="button"
            onClick={() => flows.open("calendar", "trailer")}
            className="sheen flex items-center justify-center gap-2 rounded-full bg-blue-400 px-6 py-3 text-base font-semibold text-ink-950 shadow-[0_0_28px_2px_rgba(56,182,255,0.45)] transition-colors hover:bg-[#6cc9ff]"
          >
            <CalendarCheck weight="fill" className="relative z-[2] size-5" />
            <span className="relative z-[2]">{copy.book}</span>
          </button>
          <button
            type="button"
            onClick={replay}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.875rem] font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowCounterClockwise weight="bold" className="size-4" />
            {copy.replay}
          </button>
        </div>
      ) : null}
    </div>
  );
}
