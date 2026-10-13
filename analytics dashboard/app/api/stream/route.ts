import type { NextRequest } from "next/server";
import { COOKIE, isSignedIn } from "@/lib/auth";
import { backend, pulse } from "@/lib/store";

/**
 * The live wire. A Server-Sent Events stream that says `change` the moment
 * the database's pulse moves (see `pulse()` in supabase/schema.sql), so the
 * dashboard refreshes within a couple of seconds of anything happening on the
 * page, without the browser polling or holding database credentials.
 *
 * The browser's EventSource reconnects on its own, so a dropped connection or
 * a host's response time limit only ever costs a moment.
 */

const INTERVAL_MS = { supabase: 2000, file: 1000, none: 30_000 };

export async function GET(request: NextRequest) {
  const mode = backend();
  if (!(await isSignedIn(request.cookies.get(COOKIE)?.value))) {
    return new Response("Sign in first.", { status: 401 });
  }

  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let keepAlive: ReturnType<typeof setInterval> | undefined;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        if (!closed) controller.enqueue(encoder.encode(chunk));
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
        timer = setTimeout(tick, INTERVAL_MS[mode]);
      };

      send(`event: ready\ndata: ${mode}\n\n`);
      void tick();
      keepAlive = setInterval(() => send(": keep-alive\n\n"), 20_000);

      request.signal.addEventListener("abort", () => {
        closed = true;
        clearTimeout(timer);
        clearInterval(keepAlive);
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      closed = true;
      clearTimeout(timer);
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
