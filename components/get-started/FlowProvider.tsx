"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { track } from "@/lib/analytics/tracker";
import type { GET_STARTED_PAGE } from "@/lib/content";
import type { Flow } from "./flows";

export type FlowCopy = (typeof GET_STARTED_PAGE)["chat"]["flows"];
/**
 * "realBryan" is the visitor pressing "Talk to the real Bryan" in a live call,
 * "book" pressing "Book an appointment with the real deal" before one.
 */
export type FlowSource = "call" | "chat" | "realBryan" | "book";
/** "done" is the page closing a finished flow, not the visitor. */
export type CloseReason = "button" | "escape" | "backdrop" | "done";

/**
 * Speaks a line in the live call and resolves once Bryan has finished saying
 * it. BryanCall sets one while a call is on.
 */
export type Speaker = (line: string) => Promise<void>;

type Flows = {
  copy: FlowCopy;
  /** The open popup, if any. */
  flow: Flow | null;
  /** Bryan's line at the top of the open popup. */
  line: string;
  /** Opens a popup and has Bryan say its line, or `line` in its place. */
  open: (flow: Flow, from: FlowSource, line?: string) => void;
  close: (how: CloseReason) => void;
  /**
   * Shows a line at the top of the popup, and speaks it if a call is live.
   * Resolves true once it has been spoken, or false at once with no call.
   */
  say: (line: string) => Promise<boolean>;
  setSpeaker: (speaker: Speaker | null) => void;
  /** Notes what the visitor did, for the agent's next reply. */
  log: (event: string) => void;
  events: string[];
  /** The same events, read at call time rather than render time. */
  pageEvents: () => string[];
};

/** The agent hears the most recent few; older ones stop mattering. */
const MAX_EVENTS = 10;

const OPENED: Record<Flow, string> = {
  calendar: "Bryan opened the booking calendar on the visitor's screen.",
  guide: "Bryan opened the guide upload on the visitor's screen.",
  sampleGuide: "Bryan showed the visitor Kindlerye's sample benefits guide.",
  flipbook: "Bryan opened Kindlerye's guide as a flipbook over the page.",
  microsite: "Bryan showed the visitor Kindlerye's sample benefits microsite, with a button to the live site.",
  flyer: "Bryan showed the visitor Kindlerye's sample open enrollment flyer.",
};
const CLOSED: Record<Flow, string> = {
  calendar: "The visitor closed the booking calendar.",
  guide: "The visitor closed the guide upload.",
  sampleGuide: "The visitor closed the sample guide.",
  flipbook: "The visitor closed the flipbook.",
  microsite: "The visitor closed the sample microsite.",
  flyer: "The visitor closed the sample flyer.",
};

/** What a message to the agent carries about the page, if anything. */
export const pageContext = (events: string[]) =>
  events.length ? { pageEvents: events } : undefined;

const FlowContext = createContext<Flows | null>(null);

/** Null outside a FlowProvider: the chat then runs without the two popups. */
export const useFlows = () => useContext(FlowContext);

/**
 * The state the call, the typed chat and the popup share on /BryanKleppe:
 * which popup is open, Bryan's line at its top, a way to speak a line in the
 * live call, and a short log of what the visitor did, which each message to
 * the agent carries (see `pageContext`) so Bryan knows on his next reply.
 *
 * Every function here is stable, because the typed chat's flow cards are
 * created once and render in a React root of their own.
 */
export function FlowProvider({ copy, children }: { copy: FlowCopy; children: ReactNode }) {
  const [flow, setFlow] = useState<Flow | null>(null);
  const [line, setLine] = useState("");
  const [events, setEvents] = useState<string[]>([]);

  const flowRef = useRef<Flow | null>(null);
  const speakerRef = useRef<Speaker | null>(null);
  const eventsRef = useRef<string[]>([]);

  const log = useCallback((event: string) => {
    eventsRef.current = [...eventsRef.current, event].slice(-MAX_EVENTS);
    setEvents(eventsRef.current);
  }, []);

  const say = useCallback(async (next: string) => {
    setLine(next);
    const speaker = speakerRef.current;
    if (!speaker) return false;
    await speaker(next);
    return true;
  }, []);

  const open = useCallback(
    (next: Flow, from: FlowSource, line?: string) => {
      if (flowRef.current !== next) {
        flowRef.current = next;
        setFlow(next);
        // The agent hears that the visitor asked for the person, not only
        // that the calendar opened.
        const pressed =
          from === "realBryan" ? copy.realBryan.label : from === "book" ? copy.realBryan.book : null;
        log(pressed ? `The visitor pressed "${pressed}". ${OPENED[next]}` : OPENED[next]);
        track("flow_open", next, { from });
      }
      void say(line ?? copy[next].line);
    },
    [copy, log, say],
  );

  const close = useCallback(
    (how: CloseReason) => {
      const current = flowRef.current;
      if (!current) return;
      flowRef.current = null;
      setFlow(null);
      if (how !== "done") log(CLOSED[current]);
      track("flow_close", current, { how });
    },
    [log],
  );

  const setSpeaker = useCallback((speaker: Speaker | null) => {
    speakerRef.current = speaker;
  }, []);

  const pageEvents = useCallback(() => eventsRef.current, []);

  // Development only: open or close a flow from the console or a test
  // script, e.g. window.__flows.open("flipbook", "chat").
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const w = window as unknown as { __flows?: Pick<Flows, "open" | "close"> };
    w.__flows = { open, close };
    return () => {
      delete w.__flows;
    };
  }, [open, close]);

  const value = useMemo(
    () => ({ copy, flow, line, open, close, say, setSpeaker, log, events, pageEvents }),
    [copy, flow, line, open, close, say, setSpeaker, log, events, pageEvents],
  );

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}
