import { COOKIE, MAX_AGE, passwordMatches, sessionToken } from "@/lib/auth";

const attempts = new Map<string, number[]>();

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  attempts.set(ip, recent);

  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const back = new URL("/login", request.url);

  if (recent.length > 10) {
    back.searchParams.set("error", "slow");
    return Response.redirect(back, 303);
  }
  if (!passwordMatches(password)) {
    back.searchParams.set("error", "wrong");
    return Response.redirect(back, 303);
  }

  const secure = new URL(request.url).protocol === "https:";
  return new Response(null, {
    status: 303,
    headers: {
      location: new URL("/", request.url).toString(),
      "set-cookie": `${COOKIE}=${await sessionToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${secure ? "; Secure" : ""}`,
    },
  });
}
