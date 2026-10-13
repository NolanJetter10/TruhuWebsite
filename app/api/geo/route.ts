/**
 * The visitor's country, as Vercel's edge sees it, for one decision only:
 * whether the cookie banner has to ask before analytics load (EU, UK and
 * Switzerland) or not. Nothing is stored. Locally there is no header, and
 * the banner falls back to the browser's time zone.
 */
export function GET(request: Request) {
  const country = request.headers.get("x-vercel-ip-country");
  return Response.json(
    { country: country && /^[A-Z]{2}$/.test(country) ? country : null },
    { headers: { "cache-control": "private, no-store" } },
  );
}
