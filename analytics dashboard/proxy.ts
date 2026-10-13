import { NextResponse, type NextRequest } from "next/server";
import { authMode, COOKIE, isSignedIn } from "@/lib/auth";

/**
 * Everything except the sign-in page needs the dashboard cookie. Pages send
 * you to sign in; API calls get a plain 401. This is the gate, and the data
 * routes check again on their own (see lib/auth.ts), so a misconfigured
 * matcher can never leak data.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/login" || pathname === "/api/login") return NextResponse.next();

  if (await isSignedIn(request.cookies.get(COOKIE)?.value)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: authMode === "locked" ? "DASHBOARD_PASSWORD is not set." : "Sign in first." },
      { status: 401 },
    );
  }
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
