import type { NextRequest } from "next/server";
import { COOKIE, isSignedIn } from "@/lib/auth";
import { transcript } from "@/lib/store";

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * One call's transcript, read when its row is opened rather than with every
 * summary, since a long call can run to hundreds of lines.
 */
export async function GET(request: NextRequest) {
  if (!(await isSignedIn(request.cookies.get(COOKIE)?.value))) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!ID.test(id)) return Response.json({ error: "Bad id." }, { status: 400 });

  try {
    const lines = await transcript(id);
    if (!lines) return Response.json({ error: "No such call." }, { status: 404 });
    return Response.json({ lines }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[dashboard] transcript failed", error);
    return Response.json({ error: "Couldn't read the transcript." }, { status: 502 });
  }
}
