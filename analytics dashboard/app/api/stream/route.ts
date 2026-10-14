import type { NextRequest } from "next/server";
import { COOKIE, isSignedIn } from "@/lib/auth";
import { backend, pulse } from "@/lib/store";

/**
 * The live wire. A Server-Sent Events stream that says `change` the moment
 * the database's pulse moves (see `pulse()` in supabase/schema.sql), so the
 * dashboard refreshes within a couple of seconds of anything happening on the
 * page, without the browser polling or holding database credentials.
 *
 * Serverless hosts cap how long one response may run, so each stream ends
 * itself cleanly a little before the cap and tells the browser to reconnect
 * after one second (`retry`). EventSource does that on its own, so the
 * dashboard stays live indefinitely with no visible gap.
 */

/** Seconds. Vercel's ceiling for this function; streams end before it. */
export const maxDuration = 300;
const LIFETIME_MS = 270_000;

const INTERVAL_MS = { supabase: 2000, file: 1000, none: 30_000 };

export async function GET(request: NextRequest) {
  const mode = backend();
  if (!(await isSignedIn(request.cookies.get(COOKIE)?.value))) {
    return new Response("Sign in first.", { status: 401 });
  }

  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let keepAlive: ReturnType<typeof setInterval> | undefined;
  let lifetime: ReturnType<typeof setTimeout> | undefined;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        if (!closed) controller.enqueue(encoder.encode(chunk));
      };
      const stop = () => {
        if (closed) return;
        closed = true;
        clearTimeout(timer);
        clearTimeout(lifetime);
        clearInterval(keepAlive);
        try {
          controller.close();
        } catch {}
      };
      let last: string | null = null;

      const tick = async () => {
        if (closed) return;
        try {
          const now = await pulse();
          if (last !== null && now !== last) send(`event: change\ndata: ${now}\n\n`);
          last = now;
        } catch (error) {
          send(`event: trouble\ndata: ${JSON.stringify(String(error)).slice(0, 300)}\n\n`);
        }
        if (!closed) timer = setTimeout(tick, INTERVAL_MS[mode]);
      };

      // Reconnect a second after any close, ours or the network's.
      send(`retry: 1000\nevent: ready\ndata: ${mode}\n\n`);
      void tick();
      keepAlive = setInterval(() => send(": keep-alive\n\n"), 20_000);
      lifetime = setTimeout(stop, LIFETIME_MS);
      request.signal.addEventListener("abort", stop);
    },
    cancel() {
      closed = true;
      clearTimeout(timer);
      clearTimeout(lifetime);
      clearInterval(keepAlive);
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
