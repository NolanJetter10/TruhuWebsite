import { authMode } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message =
    error === "wrong"
      ? "That password didn't match."
      : error === "slow"
        ? "Too many tries. Wait a few minutes."
        : null;

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-7 shadow-sm">
        <p className="text-[0.8125rem] font-semibold text-muted">TruHu</p>
        <h1 className="mt-1 text-xl font-semibold">Funnel analytics</h1>

        {authMode === "locked" ? (
          <p className="mt-4 text-sm text-ink-2">
            Set <code className="rounded bg-raised px-1">DASHBOARD_PASSWORD</code> in this
            app&apos;s environment to turn sign-in on.
          </p>
        ) : (
          <form action="/api/login" method="post" className="mt-5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
            {message ? <p className="mt-2 text-sm text-critical">{message}</p> : null}
            <button
              type="submit"
              className="mt-4 w-full rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-surface hover:opacity-90"
            >
              Sign in
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
