"use client";

import { ArrowRight, ArrowSquareOut, ChatCircleText, Phone, VideoCamera } from "@phosphor-icons/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { BryanCall, type CallCopy } from "@/components/get-started/BryanCall";
import { pageContext, useFlows } from "@/components/get-started/FlowProvider";
import { FLOW_SCHEMAS, FLOW_WIDGETS, parseFlow, type FlowWidget } from "@/components/get-started/flows";
import { track } from "@/lib/analytics/tracker";
import { KINDLERYE } from "@/lib/kindlerye";

/** Pinned: `@latest` could change the widget under a live page. */
const SDK_SRC =
  "https://cdn.jsdelivr.net/npm/@ensembleapp/client-sdk@0.0.60/dist/widget/widget.global.js";
/** The "Bryan Kleppe" agent; the proxy (lib/ensemble.ts) is pinned to the same one. */
const AGENT_ID = "x9gUTsQSjGMeEpqDSATf";
const THREAD_KEY = "truhu-chat-thread";
const CONTAINER_ID = "truhu-chat";
/** The avatar's still from Anam (upscaled), for the Video view before it plays. */
const POSTER = "/images/team/bryan-kleppe-avatar.webp";
/** Bryan's own photo, cropped from a call and not upscaled, for the Call view. */
const PHOTO = "/images/team/bryan-kleppe.webp";
/** Tokens live ten minutes; reuse one for eight. */
const TOKEN_REUSE_MS = 8 * 60_000;

type ChatWidgetGlobal = {
  init: (config: Record<string, unknown>) => Promise<void>;
  destroy: () => void;
  updateConfig: (config: Record<string, unknown>) => void;
  createWidget: (definition: Record<string, unknown>) => unknown;
};

declare global {
  interface Window {
    ChatWidget?: ChatWidgetGlobal;
  }
}

type Copy = {
  label: string;
  offline: string;
  views: { call: string; video: string; chat: string; chatDuringCall: string };
  widget: { title: string; placeholder: string; greeting: string };
  call: CallCopy;
};

/** Call and Video are two looks of the same call; Chat is the typed chat. */
type View = "call" | "video" | "chat";
type ViewOption = { id: View; label: string; Icon: typeof VideoCamera };

/**
 * Where Bryan's box is drawn: in the column, floating in the corner while a
 * popup is open, or on its way back to the column.
 */
type Mode = "docked" | "floating" | "docking";

/**
 * The floating window, in the bottom-right corner above every popup. It
 * overrides the browser's own popover styles (inset 0, auto margins, padding),
 * since it shows in the top layer.
 */
const PIP_FRAME =
  "fixed top-auto left-auto right-[calc(0.75rem+env(safe-area-inset-right))] bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-[90] m-0 flex flex-col overflow-hidden rounded-2xl border border-white/15 bg-ink-900 p-0 text-white shadow-[0_24px_60px_-18px_rgba(2,8,18,0.9)] sm:right-[calc(1.5rem+env(safe-area-inset-right))] sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]";
/**
 * Under the 2.25rem bar: the call a small tile with room for his photo, the
 * caption and the buttons; the video a 3:2 picture; the chat big enough to
 * type in.
 */
const PIP_SIZE: Record<View, string> = {
  call: "w-[12rem] h-[15rem] sm:w-[16rem] sm:h-[18rem]",
  video: "w-[11rem] h-[9.5833rem] sm:w-[20rem] sm:h-[15.5833rem]",
  chat: "w-[min(17rem,calc(100vw-1.5rem))] h-[min(21rem,calc(100dvh-7rem))] sm:w-[22rem] sm:h-[min(30rem,calc(100dvh-3rem))]",
};
const MORPH_MS = 420;
/** --ease-out-expo */
const MORPH_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function loadSdk() {
  return new Promise<void>((resolve, reject) => {
    if (window.ChatWidget) return resolve();
    let script = document.querySelector<HTMLScriptElement>("script[data-ensemble-sdk]");
    if (!script) {
      script = document.createElement("script");
      script.src = SDK_SRC;
      script.async = true;
      script.dataset.ensembleSdk = "";
      document.head.appendChild(script);
    }
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("SDK failed to load")), { once: true });
  });
}

/**
 * A JSON Schema in the form the widget SDK reads: a Standard Schema with a
 * JSON Schema view. Despite its docs, 0.0.60 can't take the plain object. It
 * edits what it's given, so each read gets a copy.
 */
const standardSchema = (schema: Record<string, unknown>) => ({
  "~standard": {
    version: 1,
    vendor: "truhu",
    validate: (value: unknown) => ({ value }),
    jsonSchema: { input: () => structuredClone(schema), output: () => structuredClone(schema) },
  },
});

let cached: { token: string; at: number } | null = null;

/** A chat token, shared by the widget and the video call. */
async function chatToken(fresh = false) {
  if (!fresh && cached && Date.now() - cached.at < TOKEN_REUSE_MS) return cached.token;
  const response = await fetch("/api/ensemble-token", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Chat authentication unavailable");
  const { token } = (await response.json()) as { token: string };
  cached = { token, at: Date.now() };
  return token;
}

function threadId() {
  try {
    let id = sessionStorage.getItem(THREAD_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(THREAD_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/**
 * Ask Bryan's AI before booking, drawn inside the page rather than as a
 * floating bubble. One box, three views on the same Ensemble agent and thread:
 * a call with his AI (BryanCall) drawn two ways, Call (his photo with a ring
 * that moves as he speaks, the default) and Video (his Anam avatar), and the
 * typed chat (Ensemble's widget, whose own call button is off). The microphone is only
 * requested when a visitor starts a call, since a browser won't open it or
 * play audio before a click. After a call the widget reloads, so the typed
 * chat carries on from what was said.
 *
 * In the typed chat, the page's two flows (flows.ts) render as a card with
 * Bryan's line and a button that opens the popup, which stays in the history.
 * A new reply carrying one opens the popup by itself. Any words the agent
 * writes next to the widget still show above the card.
 */
export function EnsembleChat({ copy }: { copy: Copy }) {
  const [status, setStatus] = useState<"loading" | "ready" | "offline">("loading");
  const [view, setView] = useState<View>("call");
  const [inCall, setInCall] = useState(false);
  const [generation, setGeneration] = useState(0);

  // Only the stable parts, so a popup opening doesn't reload the widget.
  const flows = useFlows();
  const openFlow = flows?.open;
  const flowCopy = flows?.copy;
  const pageEvents = flows?.pageEvents;
  const logEvent = flows?.log;
  const events = flows?.events;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [, token] = await Promise.all([loadSdk(), chatToken()]);
        if (cancelled || !window.ChatWidget) return;
        const sdk = window.ChatWidget;
        const widgets =
          openFlow && flowCopy
            ? (Object.keys(FLOW_SCHEMAS) as FlowWidget[]).map((widgetType) => {
                const flow = FLOW_WIDGETS[widgetType];
                return sdk.createWidget({
                  widgetType,
                  schema: standardSchema(FLOW_SCHEMAS[widgetType]),
                  reactDOM: { createRoot },
                  render: () =>
                    flow === "microsite" ? (
                      <FlowCard
                        line={flowCopy[flow].line}
                        label={flowCopy[flow].open}
                        href={KINDLERYE.micrositeUrl}
                        onOpen={() => {
                          track("microsite_open", "chat");
                          logEvent?.("The visitor opened Kindlerye's live microsite in a new tab.");
                        }}
                      />
                    ) : (
                      <FlowCard
                        line={flowCopy[flow].line}
                        label={flowCopy[flow].open}
                        onOpen={() => openFlow(flow, "chat")}
                      />
                    ),
                });
              })
            : undefined;
        await sdk.init({
          containerId: CONTAINER_ID,
          api: { baseUrl: `${window.location.origin}/api/ensemble`, token },
          agentId: AGENT_ID,
          threadId: threadId(),
          title: copy.widget.title,
          inputPlaceholder: copy.widget.placeholder,
          initialAssistantMessage: copy.widget.greeting,
          styles: { theme: "light", borderRadius: "14px" },
          widgets,
          dataContext: pageContext(pageEvents?.() ?? []),
          // Streamed parts only, so history reloaded after a call opens nothing.
          onData: (part: { type?: string; data?: unknown }) => {
            const flow = parseFlow(part);
            if (flow) openFlow?.(flow, "chat");
          },
          onAuthError: async () => {
            try {
              return await chatToken(true);
            } catch {
              return null;
            }
          },
          onError: () => setStatus((current) => (current === "ready" ? current : "offline")),
        });
        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("offline");
      }
    })();
    return () => {
      cancelled = true;
      window.ChatWidget?.destroy();
    };
  }, [
    generation,
    copy.widget.title,
    copy.widget.placeholder,
    copy.widget.greeting,
    openFlow,
    flowCopy,
    pageEvents,
    logEvent,
  ]);

  // Each typed message tells the agent what the visitor has done on the page.
  useEffect(() => {
    if (status === "ready" && events?.length) {
      window.ChatWidget?.updateConfig({ dataContext: pageContext(events) });
    }
  }, [status, events]);

  const views: { id: View; label: string; Icon: typeof VideoCamera }[] = [
    { id: "call", label: copy.views.call, Icon: Phone },
    { id: "video", label: copy.views.video, Icon: VideoCamera },
    { id: "chat", label: copy.views.chat, Icon: ChatCircleText },
  ];

  // While a popup is open, the box floats in the corner above it, and goes
  // back once it closes. It's the same element throughout, only styled
  // differently, so the call and the chat carry on.
  const [mode, setMode] = useState<Mode>("docked");
  const [introDone, setIntroDone] = useState(false);
  const pipRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const drawnRef = useRef<{ mode: Mode; view: View }>({ mode: "docked", view: "call" });
  const fromRef = useRef<DOMRect | null>(null);
  const animationsRef = useRef<Animation[]>([]);

  const away = Boolean(flows?.flow) && status !== "offline";
  if (away && mode !== "floating") setMode("floating");
  else if (!away && mode === "floating") setMode("docking");

  // Each move animates from the rect it's drawn at to the new one. Before
  // React draws a change the box is still where it was, except for a view
  // picked on the floating bar, which notes its rect first (fromRef).
  useLayoutEffect(() => {
    const pip = pipRef.current;
    const bar = barRef.current;
    const slot = pip?.parentElement;
    const before = drawnRef.current;
    drawnRef.current = { mode, view };
    if (!pip || !bar || !slot || (before.mode === mode && before.view === view)) return;

    // Where it's drawn now, mid-flight included, before stopping what runs.
    const drawn = fromRef.current ?? pip.getBoundingClientRect();
    const barDrawn = bar.getBoundingClientRect().height;
    fromRef.current = null;
    for (const animation of animationsRef.current) animation.cancel();
    animationsRef.current = [];

    // The top layer lifts it over every popup, whatever stacking contexts
    // its ancestors make. Removing `popover` once docked takes it back out.
    const topLayer = typeof pip.showPopover === "function";
    if (mode === "docked") return;
    if (topLayer && !pip.matches(":popover-open")) pip.showPopover();

    // Docked, it fills the column's box inside that box's border.
    const outer = slot.getBoundingClientRect();
    const column = new DOMRect(
      outer.left + slot.clientLeft,
      outer.top + slot.clientTop,
      slot.clientWidth,
      slot.clientHeight,
    );
    const from = before.mode === "docked" ? column : drawn;
    const to = mode === "docking" ? column : pip.getBoundingClientRect();
    const barFrom = before.mode === "docked" ? 0 : barDrawn;
    const barTo = mode === "docking" ? 0 : bar.getBoundingClientRect().height;
    const timing: KeyframeAnimationOptions = {
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : MORPH_MS,
      easing: MORPH_EASE,
      // On the way back it holds the column's rect until React docks it.
      fill: mode === "docking" ? "forwards" : "none",
    };
    const box = (rect: DOMRect) => ({
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });
    const morph = pip.animate([box(from), box(to)], timing);
    const fold = bar.animate(
      [
        { height: `${barFrom}px`, opacity: barFrom ? 1 : 0 },
        { height: `${barTo}px`, opacity: barTo ? 1 : 0 },
      ],
      timing,
    );
    animationsRef.current = [morph, fold];
    if (mode === "docking") {
      morph.onfinish = () => {
        if (topLayer) pip.hidePopover();
        setMode((current) => (current === "docking" ? "docked" : current));
      };
    }
  }, [mode, view]);

  /** A view picked on the floating bar: the window resizes from where it is. */
  const pickFloating = (next: View) => {
    if (next === view) return;
    if (pipRef.current) fromRef.current = pipRef.current.getBoundingClientRect();
    setView(next);
  };

  return (
    <section
      data-section="chat"
      aria-labelledby="chat-heading"
      // The intro's end state keeps a filter, which would make this section
      // the floating box's containing block, so it goes once it has played.
      style={introDone ? undefined : { animation: "hero-in 800ms var(--ease-out-expo) 380ms both" }}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setIntroDone(true);
      }}
    >
      {/* No visible label: the box speaks for itself, and the Call / Video / Chat
          switch sits in its top-right corner. */}
      <h2 id="chat-heading" className="sr-only">
        {copy.label}
      </h2>
      {status === "offline" ? (
        <p
          role="status"
          className="card-shape border border-white/10 bg-white/[0.05] p-5 text-[0.9375rem] text-amber-300 sm:p-6"
        >
          {copy.offline}
        </p>
      ) : (
        <div className="relative h-[30rem] max-h-[80dvh] overflow-hidden rounded-[14px] border border-white/10 bg-white shadow-lg lg:h-[clamp(14rem,calc(100dvh-21rem),44rem)] lg:max-h-none">
          {/* What the column shows while the box is in the corner. */}
          {mode !== "docked" && (
            <div
              aria-hidden
              className="absolute inset-0 rounded-[13px] border border-dashed border-white/20 bg-ink-950"
            />
          )}
          <div
            ref={pipRef}
            data-bryan-pip={mode === "docked" ? "docked" : "floating"}
            popover={mode === "docked" ? undefined : "manual"}
            className={
              mode === "docked" ? "absolute inset-0 flex flex-col" : `${PIP_FRAME} ${PIP_SIZE[view]}`
            }
          >
            <div
              ref={barRef}
              className={
                mode === "docked" ? "hidden" : "flex h-9 shrink-0 items-center overflow-hidden px-1.5"
              }
            >
              <PipSwitch
                views={views}
                view={view}
                inCall={inCall}
                lockedTitle={copy.views.chatDuringCall}
                onPick={pickFloating}
                iconsWhenNarrow
              />
            </div>
            <div className="relative min-h-0 flex-1 bg-white">
              {mode === "docked" && (
                <div className="absolute top-3 right-3 z-10 w-[14rem] rounded-full bg-ink-950/70 shadow-sm backdrop-blur-sm">
                  <PipSwitch
                    views={views}
                    view={view}
                    inCall={inCall}
                    lockedTitle={copy.views.chatDuringCall}
                    onPick={setView}
                  />
                </div>
              )}
              {/* Both stay mounted; the hidden one keeps its size and state.
                  Call and Video are one BryanCall drawn two ways, so
                  switching between them carries a live call on. */}
              <div className={`absolute inset-0 ${view === "chat" ? "invisible" : ""}`}>
                <BryanCall
                  copy={copy.call}
                  look={view === "video" ? "video" : "call"}
                  poster={POSTER}
                  photo={PHOTO}
                  chatToken={chatToken}
                  threadId={threadId}
                  compact={mode !== "docked"}
                  onCallStart={() => setInCall(true)}
                  onCallEnd={(spoke) => {
                    setInCall(false);
                    if (spoke) setGeneration((n) => n + 1);
                  }}
                />
              </div>
              <div
                id={CONTAINER_ID}
                className={`absolute inset-0 ${view === "chat" ? "" : "invisible"}`}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * The Call / Video / Chat switch, in the box's corner and on the floating
 * window's bar, so the visitor can change views while a popup covers the
 * column. The pressed one says which view the box shows.
 */
function PipSwitch({
  views,
  view,
  inCall,
  lockedTitle,
  onPick,
  iconsWhenNarrow = false,
}: {
  views: ViewOption[];
  view: View;
  inCall: boolean;
  lockedTitle: string;
  onPick: (view: View) => void;
  /** Icons only on a phone, where the floating window is too narrow for three labels. */
  iconsWhenNarrow?: boolean;
}) {
  return (
    <div className="flex w-full rounded-full bg-white/[0.07] p-0.5">
      {views.map(({ id, label, Icon }) => {
        const locked = id === "chat" && inCall;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onPick(id)}
            aria-pressed={view === id}
            disabled={locked}
            title={locked ? lockedTitle : undefined}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-1 text-[0.75rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              view === id ? "bg-white text-ink-950" : "text-slate-300 hover:text-white"
            }`}
          >
            <Icon weight={view === id ? "fill" : "regular"} className="size-3.5" />
            <span className={iconsWhenNarrow ? "max-sm:sr-only" : undefined}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * A flow in the typed chat: Bryan's line and a button to the popup, or with
 * `href` (the microsite) straight to that page in a new tab. It renders in a
 * React root of the widget's own, so it gets everything by props.
 */
function FlowCard({
  line,
  label,
  href,
  onOpen,
}: {
  line: string;
  label: string;
  href?: string;
  onOpen: () => void;
}) {
  const button =
    "flex items-center gap-1.5 rounded-full bg-blue-500 px-4 py-2 text-[0.875rem] font-semibold text-white transition-colors hover:bg-blue-700";
  return (
    <div className="flex flex-col items-start gap-2.5 rounded-xl border border-blue-500/25 bg-blue-100/60 p-3.5 font-sans">
      <p className="text-[0.9375rem] leading-snug text-ink">{line}</p>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" onClick={onOpen} className={button}>
          {label}
          <ArrowSquareOut aria-hidden weight="bold" className="size-3.5" />
        </a>
      ) : (
        <button type="button" onClick={onOpen} className={button}>
          {label}
          <ArrowRight aria-hidden weight="bold" className="size-3.5" />
        </button>
      )}
    </div>
  );
}
